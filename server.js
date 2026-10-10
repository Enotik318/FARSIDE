import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = "tracks-v4";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Нет SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const genresPath = path.join(__dirname, "raw-genres.txt");
const GENRES = fs
  .readFileSync(genresPath, "utf-8")
  .split("\n")
  .map((line) => line.replace(/^\d+:\s*/, "").trim())
  .filter(Boolean);

console.log(`[${VERSION}] genres: ${GENRES.length}`);

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

  if (!response.ok) {
    throw new Error(`token ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

function mapTrack(t) {
  if (!t || typeof t !== "object" || !t.id || t.type === "episode") return null;
  return {
    id: t.id,
    name: t.name,
    artists: (t.artists || []).map((a) => ({
      id: a.id,
      name: a.name,
    })),
    duration_ms: t.duration_ms ?? null,
    image: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || null,
    spotifyUrl: t.external_urls?.spotify || null,
    preview_url: t.preview_url || null,
    album: t.album?.name || null,
  };
}

async function searchPlaylistsByGenre(genre, limit = 8) {
  const token = await getAccessToken();
  // limit 1–50; keep modest
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 8));
  const url =
    "https://api.spotify.com/v1/search?type=playlist&limit=" +
    safeLimit +
    "&q=" +
    encodeURIComponent(genre);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(
      `playlist search ${response.status}: ${await response.text()}`,
    );
  }
  const data = await response.json();
  return (data.playlists?.items || [])
    .filter(Boolean)
    .map((pl) => ({
      id: pl.id,
      name: pl.name,
      image: pl.images?.[0]?.url || null,
      spotifyUrl: pl.external_urls?.spotify || null,
      tracksTotal: pl.tracks?.total ?? null,
    }));
}

async function getPlaylistTracks(playlistId, limit = 10) {
  if (!playlistId) return [];
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));

  // Client credentials often get 401/403 on playlist items — still try
  for (const pathPart of ["tracks", "items"]) {
    const url =
      `https://api.spotify.com/v1/playlists/${playlistId}/${pathPart}` +
      `?limit=${safeLimit}&market=US`;
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) {
        console.error(`${pathPart} ${playlistId}: ${r.status}`);
        continue;
      }
      const data = await r.json();
      const out = [];
      for (const row of data.items || []) {
        const raw =
          row?.track && typeof row.track === "object"
            ? row.track
            : row?.item && typeof row.item === "object"
              ? row.item
              : null;
        const m = mapTrack(raw);
        if (m) out.push(m);
      }
      if (out.length) {
        console.log(`playlist ${playlistId} /${pathPart}: ${out.length}`);
        return out;
      }
    } catch (e) {
      console.error(`${pathPart} fail`, e.message || e);
    }
  }
  return [];
}

async function searchTracksByGenre(genre) {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  // Spotify search: limit must be integer 0–50. Build URL manually.
  // Use 10 — safe for all app tiers.
  const queries = [genre, `genre:${genre}`];

  for (const q of queries) {
    const url =
      "https://api.spotify.com/v1/search?type=track&limit=10&market=US&q=" +
      encodeURIComponent(q);

    try {
      console.log(`track search url: ${url}`);
      const r = await fetch(url, { headers });
      const text = await r.text();
      if (!r.ok) {
        console.error(`track search "${q}": ${r.status} ${text.slice(0, 240)}`);
        continue;
      }
      const data = JSON.parse(text);
      const items = data.tracks?.items || [];
      console.log(`track search "${q}": ${items.length} raw`);
      const out = items.map(mapTrack).filter(Boolean);
      if (out.length) return out;
    } catch (e) {
      console.error("track search fail", e.message || e);
    }
  }
  return [];
}

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "farside-server",
    version: VERSION,
    endpoints: {
      random: "/api/random?genre=optional",
      health: "/api/health",
    },
    genres: GENRES.length,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, version: VERSION, genres: GENRES.length });
});

app.get("/api/random", async (req, res) => {
  const debug = {
    version: VERSION,
    playlistTries: 0,
    trackSource: null,
    trackSearchTried: false,
  };

  try {
    let genre = (req.query.genre && String(req.query.genre).trim()) || null;
    if (!genre) {
      genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    }

    const playlists = await searchPlaylistsByGenre(genre, 8);

    let tracks = [];
    for (const pl of playlists.slice(0, 3)) {
      debug.playlistTries += 1;
      tracks = await getPlaylistTracks(pl.id, 10);
      if (tracks.length) {
        debug.trackSource = "playlist:" + pl.id;
        break;
      }
    }

    if (!tracks.length) {
      debug.trackSearchTried = true;
      tracks = await searchTracksByGenre(genre);
      if (tracks.length) debug.trackSource = "search";
    }

    res.json({
      genre,
      playlists,
      tracks,
      _debug: debug,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Не удалось получить данные от Spotify",
      detail: String(err.message || err),
      version: VERSION,
    });
  }
});

app.listen(PORT, () => {
  console.log(`[${VERSION}] http://127.0.0.1:${PORT}`);
});
