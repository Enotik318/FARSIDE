import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const AUTH_SECRET =
  process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");
const IS_PROD = process.env.NODE_ENV === "production";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  process.exit(1);
}

app.set("trust proxy", 1);

// CORS: reflect request origin (never * with credentials)
const allowList = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow no-origin (curl, same-origin tools) and any browser origin
      // when allowList empty — reflect any origin (dev + local 5500 + GH pages)
      if (!origin) return cb(null, true);
      if (!allowList.length) return cb(null, true);
      if (allowList.includes(origin)) return cb(null, true);
      // always allow localhost for dev
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
        return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "48kb" }));

// ---------- genres / spotify ----------
const genresPath = path.join(__dirname, "raw-genres.txt");
const GENRES = fs.existsSync(genresPath)
  ? fs
      .readFileSync(genresPath, "utf-8")
      .split("\n")
      .map((line) => line.replace(/^\d+:\s*/, "").trim())
      .filter(Boolean)
  : [];

console.log(`[farside] genres: ${GENRES.length}`);

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("Spotify token " + response.status);
  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

function mapTrack(t) {
  if (!t || !t.id) return null;
  return {
    id: t.id,
    name: t.name,
    artists: (t.artists || []).map((a) => ({ id: a.id, name: a.name })),
    duration_ms: t.duration_ms,
    image: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || null,
    spotifyUrl: t.external_urls?.spotify || null,
    preview_url: t.preview_url || null,
    album: t.album?.name || null,
  };
}

async function searchPlaylistsByGenre(genre, limit = 8) {
  const token = await getAccessToken();
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", genre);
  url.searchParams.set("type", "playlist");
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.playlists?.items || [])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.images?.[0]?.url || null,
      spotifyUrl: p.external_urls?.spotify || null,
      owner: p.owner?.display_name || null,
      tracksTotal: p.tracks?.total ?? null,
    }));
}

async function searchTracksByGenre(genre, limit = 12) {
  const token = await getAccessToken();
  const words = String(genre || "").trim().split(/\s+/).filter(Boolean);
  const queries = [
    `genre:"${genre}"`,
    genre,
    words.slice(0, 2).join(" "),
    words[0],
    `${genre} tag:new`,
  ].filter((q, i, a) => q && a.indexOf(q) === i);

  const seen = new Set();
  const out = [];

  for (const q of queries) {
    if (out.length >= limit) break;
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", String(Math.min(limit, 15)));
    url.searchParams.set("market", "US");
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.warn("tracks search", response.status, q);
        continue;
      }
      const data = await response.json();
      for (const raw of data.tracks?.items || []) {
        const t = mapTrack(raw);
        if (!t || seen.has(t.id)) continue;
        seen.add(t.id);
        out.push(t);
        if (out.length >= limit) break;
      }
      if (out.length) console.log("tracks ok", q, out.length);
    } catch (e) {
      console.warn("tracks err", e.message);
    }
  }
  return out;
}




app.get("/api/health", (_req, res) => {
  res.json({ ok: true, genres: GENRES.length, auth: true, community: true });
});

app.get("/api/random", async (req, res) => {
  try {
    const q = String(req.query.genre || "").trim();
    const genre =
      q || GENRES[Math.floor(Math.random() * Math.max(GENRES.length, 1))] || "";
    const [playlists, tracks] = await Promise.all([
      searchPlaylistsByGenre(genre, 8),
      searchTracksByGenre(genre, 12),
    ]);
    res.json({ genre, playlists, tracks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "random_failed" });
  }
});

// ---------- storage ----------
const DATA_DIR = path.join(__dirname, "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const FEED_PATH = path.join(DATA_DIR, "feed.json");
const BCRYPT_ROUNDS = 12;
const TOKEN_DAYS = 14;
const rateMap = new Map();

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "[]", "utf-8");
  if (!fs.existsSync(FEED_PATH)) fs.writeFileSync(FEED_PATH, "[]", "utf-8");
}

function readJSON(p, fallback) {
  ensureData();
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(p, data) {
  ensureData();
  const tmp = p + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, p);
}

function readUsers() {
  return readJSON(USERS_PATH, []);
}
function writeUsers(u) {
  writeJSON(USERS_PATH, u);
}
function readFeed() {
  return readJSON(FEED_PATH, []);
}
function writeFeed(f) {
  writeJSON(FEED_PATH, f);
}

function normalizeNick(n) {
  return String(n || "").trim().toLowerCase();
}
function validNick(n) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(n);
}
function validPass(p) {
  return typeof p === "string" && p.length >= 8 && p.length <= 72;
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_DAYS * 86400,
    }),
  );
  const data = header + "." + body;
  const sig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return data + "." + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const data = header + "." + body;
  const expect = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    );
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || "";
  raw.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function setSessionCookie(res, token) {
  const maxAge = TOKEN_DAYS * 86400;
  const parts = [
    `farside_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (IS_PROD) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res) {
  const parts = ["farside_session=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (IS_PROD) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function rateLimit(ip, limit = 30, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  let row = rateMap.get(ip);
  if (!row || now > row.reset) {
    row = { n: 0, reset: now + windowMs };
    rateMap.set(ip, row);
  }
  row.n += 1;
  return row.n <= limit;
}

function publicUser(u) {
  return {
    id: u.id,
    nick: u.nick,
    displayName: u.displayName || u.nick,
    bio: u.bio || "",
    spotify: u.spotify || "",
    avatar: u.avatar || "",
    favorites: Array.isArray(u.favorites) ? u.favorites.slice(0, 8) : [],
    createdAt: u.createdAt,
  };
}

function getUserFromReq(req) {
  const cookies = parseCookies(req);
  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const token = bearer || cookies.farside_session || "";
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return null;
  return readUsers().find((u) => u.id === payload.sub) || null;
}

// ---------- AUTH ----------
app.post("/api/auth/register", async (req, res) => {
  const ip = String(req.ip || req.headers["x-forwarded-for"] || "x");
  if (!rateLimit(ip, 12)) return res.status(429).json({ error: "too_many_requests", message: "Слишком много попыток" });

  const nickRaw = String(req.body?.nick || "").trim();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || nickRaw).trim().slice(0, 24);

  if (!validNick(nickRaw))
    return res.status(400).json({ error: "bad_nick", message: "Ник: 3–24, латиница, цифры, _" });
  if (!validPass(password))
    return res.status(400).json({ error: "bad_password", message: "Пароль от 8 до 72 символов" });

  const nick = normalizeNick(nickRaw);
  const users = readUsers();
  if (users.some((u) => u.nick === nick))
    return res.status(409).json({ error: "nick_taken", message: "Ник занят" });

  const user = {
    id: crypto.randomUUID(),
    nick,
    displayName: displayName || nickRaw,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    bio: "",
    spotify: "",
    avatar: "",
    favorites: [],
    createdAt: Date.now(),
  };
  users.push(user);
  writeUsers(users);

  const token = signToken({ sub: user.id, nick: user.nick });
  setSessionCookie(res, token);
  res.status(201).json({ user: publicUser(user), token });
});

app.post("/api/auth/login", async (req, res) => {
  const ip = String(req.ip || req.headers["x-forwarded-for"] || "x");
  if (!rateLimit(ip, 25)) return res.status(429).json({ error: "too_many_requests", message: "Слишком много попыток" });

  const nick = normalizeNick(req.body?.nick);
  const password = String(req.body?.password || "");
  if (!nick || !password)
    return res.status(400).json({ error: "missing", message: "Введи ник и пароль" });

  const user = readUsers().find((u) => u.nick === nick);
  const ok = user && (await bcrypt.compare(password, user.passwordHash || ""));
  if (!ok)
    return res.status(401).json({ error: "invalid_credentials", message: "Неверный ник или пароль" });

  const token = signToken({ sub: user.id, nick: user.nick });
  setSessionCookie(res, token);
  res.json({ user: publicUser(user), token });
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: publicUser(user) });
});

app.patch("/api/auth/profile", (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx < 0) return res.status(401).json({ error: "unauthorized" });
  const body = req.body || {};
  if (typeof body.displayName === "string")
    users[idx].displayName = body.displayName.trim().slice(0, 24);
  if (typeof body.bio === "string") users[idx].bio = body.bio.trim().slice(0, 160);
  if (typeof body.spotify === "string")
    users[idx].spotify = body.spotify.trim().slice(0, 200);
  if (typeof body.avatar === "string") {
    const a = body.avatar.trim().slice(0, 300);
    if (!a || a.startsWith("https://") || a.startsWith("http://")) users[idx].avatar = a;
  }
  if (Array.isArray(body.favorites)) {
    users[idx].favorites = body.favorites
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  writeUsers(users);
  res.json({ user: publicUser(users[idx]) });
});

// ---------- COMMUNITY ----------
app.get("/api/community/members", (_req, res) => {
  const users = readUsers()
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 60)
    .map(publicUser);
  res.json({ members: users, total: readUsers().length });
});

app.get("/api/community/feed", (_req, res) => {
  const feed = readFeed().slice(0, 80);
  res.json({ posts: feed });
});

app.post("/api/community/post", (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized", message: "Нужен вход" });
  const ip = String(req.ip || "x");
  if (!rateLimit("post:" + ip, 40, 60 * 60 * 1000))
    return res.status(429).json({ error: "too_many_requests", message: "Подожди немного" });

  const text = String(req.body?.text || "").trim().slice(0, 280);
  const genre = String(req.body?.genre || "").trim().slice(0, 64);
  if (text.length < 2)
    return res.status(400).json({ error: "empty", message: "Напиши хотя бы пару символов" });

  const post = {
    id: crypto.randomUUID(),
    text,
    genre: genre || null,
    author: {
      nick: user.nick,
      displayName: user.displayName || user.nick,
      avatar: user.avatar || "",
    },
    createdAt: Date.now(),
  };
  const feed = readFeed();
  feed.unshift(post);
  writeFeed(feed.slice(0, 200));
  res.status(201).json({ post });
});

// ---------- WIKI (genre meta from genres.json if present) ----------
let GENRES_META = null;
function loadMeta() {
  if (GENRES_META) return GENRES_META;
  const p = path.join(__dirname, "genres.json");
  if (fs.existsSync(p)) {
    try {
      GENRES_META = JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch {
      GENRES_META = {};
    }
  } else GENRES_META = {};
  return GENRES_META;
}

app.get("/api/wiki/search", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const meta = loadMeta();
  let list = Object.values(meta);
  if (!list.length) {
    list = GENRES.slice(0, 500).map((name) => ({ name, family: "other" }));
  }
  if (q) {
    list = list.filter(
      (g) =>
        (g.name || "").toLowerCase().includes(q) ||
        (g.family || "").toLowerCase().includes(q) ||
        (g.blurb || "").toLowerCase().includes(q),
    );
  }
  list = list.slice(0, 40);
  res.json({ results: list });
});

app.get("/api/wiki/:name", (req, res) => {
  const name = decodeURIComponent(req.params.name || "");
  const meta = loadMeta();
  const key = name.toLowerCase();
  let g =
    meta[key] ||
    Object.values(meta).find((x) => (x.name || "").toLowerCase() === key);
  if (!g) {
    const hit = GENRES.find((n) => n.toLowerCase() === key);
    if (!hit) return res.status(404).json({ error: "not_found" });
    g = { name: hit, family: "other", blurb: "" };
  }
  res.json({ genre: g });
});

app.listen(PORT, () => {
  console.log(`[farside] http://127.0.0.1:${PORT}`);
  if (!process.env.AUTH_SECRET)
    console.warn("[farside] WARN: set AUTH_SECRET in env");
});
