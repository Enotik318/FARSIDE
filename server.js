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

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Нет ключей в .env — создай файл .env из .env.example и заполни SPOTIFY_CLIENT_ID и SPOTIFY_CLIENT_SECRET",
  );
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

console.log(`Загружено жанров: ${GENRES.length}`);

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

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
    const text = await response.text();
    throw new Error(`Spotify token error ${response.status}: ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;
  return cachedToken;
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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify search error ${response.status}: ${text}`);
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

/** Реальные треки из плейлиста Spotify */
async function getPlaylistTracks(playlistId, limit = 12) {
  if (!playlistId) return [];
  const token = await getAccessToken();
  const url = new URL(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("market", "US");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`tracks ${playlistId}: ${response.status} ${text}`);
    return [];
  }

  const data = await response.json();
  return (data.items || [])
    .map((item) => item?.track)
    .filter((t) => t && t.id && !t.is_local)
    .map((t) => ({
      id: t.id,
      name: t.name,
      artists: (t.artists || []).map((a) => ({ id: a.id, name: a.name })),
      duration_ms: t.duration_ms,
      image: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || null,
      spotifyUrl: t.external_urls?.spotify || null,
      preview_url: t.preview_url || null,
      album: t.album?.name || null,
    }));
}

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "farside-server",
    endpoints: {
      random: "/api/random?genre=optional",
      health: "/api/health",
    },
    genres: GENRES.length,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, genres: GENRES.length });
});

app.get("/api/random", async (req, res) => {
  try {
    let genre = (req.query.genre && String(req.query.genre).trim()) || null;
    if (!genre) {
      genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    }

    const playlists = await searchPlaylistsByGenre(genre, 8);

    // треки: берём из первого плейлиста с id; если пусто — пробуем следующий
    let tracks = [];
    for (const pl of playlists.slice(0, 3)) {
      tracks = await getPlaylistTracks(pl.id, 15);
      if (tracks.length) break;
    }

    res.json({ genre, playlists, tracks });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Не удалось получить данные от Spotify",
      detail: String(err.message || err),
    });
  }
});

app.listen(PORT, () => {
  console.log(`FARSIDE server: http://127.0.0.1:${PORT}`);
  console.log(`Проверка:     http://127.0.0.1:${PORT}/api/random`);
});
