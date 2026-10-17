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
  console.error("Нет SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET в .env");
  process.exit(1);
}

app.set("trust proxy", 1);
const corsOrigin = (() => {
  const o = process.env.FRONTEND_ORIGIN;
  if (!o || o === "true" || o === "*") return true; // reflect request origin
  return o.split(",").map((s) => s.trim()).filter(Boolean);
})();

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "32kb" }));

// ---------- genres / spotify (existing) ----------
const genresPath = path.join(__dirname, "raw-genres.txt");
const GENRES = fs.existsSync(genresPath)
  ? fs
      .readFileSync(genresPath, "utf-8")
      .split("\n")
      .map((line) => line.replace(/^\d+:\s*/, "").trim())
      .filter(Boolean)
  : [];

console.log(`Жанров: ${GENRES.length}`);

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
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", `genre:"${genre}"`);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", String(limit));
  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const url2 = new URL("https://api.spotify.com/v1/search");
    url2.searchParams.set("q", genre);
    url2.searchParams.set("type", "track");
    url2.searchParams.set("limit", String(limit));
    response = await fetch(url2, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  if (!response.ok) return [];
  const data = await response.json();
  return (data.tracks?.items || []).map(mapTrack).filter(Boolean);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, genres: GENRES.length });
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

// ---------- AUTH ----------
const USERS_PATH = path.join(__dirname, "data", "users.json");
const BCRYPT_ROUNDS = 12;
const TOKEN_DAYS = 14;
const rateMap = new Map(); // ip -> { n, reset }

function ensureUsersFile() {
  const dir = path.dirname(USERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, "[]", "utf-8");
  }
}

function readUsers() {
  ensureUsersFile();
  try {
    const raw = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  ensureUsersFile();
  const tmp = USERS_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2), "utf-8");
  fs.renameSync(tmp, USERS_PATH);
}

function normalizeNick(n) {
  return String(n || "")
    .trim()
    .toLowerCase();
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
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
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
    const k = p.slice(0, i).trim();
    const v = p.slice(i + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function setSessionCookie(res, token) {
  const maxAge = TOKEN_DAYS * 86400;
  const parts = [
    `farside_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=None",
    `Max-Age=${maxAge}`,
  ];
  if (IS_PROD) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res) {
  const parts = [
    "farside_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=None",
    "Max-Age=0",
  ];
  if (IS_PROD) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function rateLimit(ip, limit = 20, windowMs = 15 * 60 * 1000) {
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
  const token = cookies.farside_session || bearer || "";
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return null;
  const users = readUsers();
  return users.find((u) => u.id === payload.sub) || null;
}

app.post("/api/auth/register", async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  if (!rateLimit(String(ip), 10)) {
    return res.status(429).json({ error: "too_many_requests" });
  }

  const nickRaw = String(req.body?.nick || "").trim();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || nickRaw).trim().slice(0, 24);

  if (!validNick(nickRaw)) {
    return res.status(400).json({
      error: "bad_nick",
      message: "Ник: 3–24 символа, латиница, цифры, _",
    });
  }
  if (!validPass(password)) {
    return res.status(400).json({
      error: "bad_password",
      message: "Пароль от 8 до 72 символов",
    });
  }

  const nick = normalizeNick(nickRaw);
  const users = readUsers();
  if (users.some((u) => u.nick === nick)) {
    return res.status(409).json({ error: "nick_taken", message: "Ник занят" });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = {
    id: crypto.randomUUID(),
    nick,
    displayName: displayName || nickRaw,
    passwordHash,
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
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  if (!rateLimit(String(ip), 20)) {
    return res.status(429).json({ error: "too_many_requests" });
  }

  const nick = normalizeNick(req.body?.nick);
  const password = String(req.body?.password || "");
  if (!nick || !password) {
    return res.status(400).json({ error: "missing", message: "Введи ник и пароль" });
  }

  const users = readUsers();
  const user = users.find((u) => u.nick === nick);
  // constant-ish fail
  const ok =
    user && (await bcrypt.compare(password, user.passwordHash || ""));
  if (!ok) {
    return res.status(401).json({
      error: "invalid_credentials",
      message: "Неверный ник или пароль",
    });
  }

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

app.patch("/api/auth/profile", async (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx < 0) return res.status(401).json({ error: "unauthorized" });

  const body = req.body || {};
  if (typeof body.displayName === "string") {
    users[idx].displayName = body.displayName.trim().slice(0, 24);
  }
  if (typeof body.bio === "string") {
    users[idx].bio = body.bio.trim().slice(0, 160);
  }
  if (typeof body.spotify === "string") {
    users[idx].spotify = body.spotify.trim().slice(0, 200);
  }
  if (typeof body.avatar === "string") {
    // allow URL only on server profile (no huge data URLs in file store)
    const a = body.avatar.trim().slice(0, 300);
    if (!a || a.startsWith("https://") || a.startsWith("http://")) {
      users[idx].avatar = a;
    }
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

app.listen(PORT, () => {
  console.log(`FARSIDE server http://127.0.0.1:${PORT}`);
  if (!process.env.AUTH_SECRET) {
    console.warn(
      "WARN: AUTH_SECRET не задан — сессии сбросятся после рестарта. Добавь AUTH_SECRET в .env",
    );
  }
});
