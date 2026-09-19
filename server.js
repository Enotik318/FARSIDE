import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Нет ключей в .env — заполни SPOTIFY_CLIENT_ID и SPOTIFY_CLIENT_SECRET');
  process.exit(1);
}

app.use(cors());

const GENRES = fs
  .readFileSync('raw-genres.txt', 'utf-8')
  .split('\n')                            // режем на строки
  .map(line => line.replace(/^\d+:\s*/, '').trim())  // убираем "123: " в начале
  .filter(Boolean);                       // выкидываем пустые строки

console.log(`📀 Загружено жанров: ${GENRES.length}`);

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new Error(`Spotify token error ${response.status}`);

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function searchPlaylistsByGenre(genre, limit = 10) {
  const token = await getAccessToken();
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', genre);
  url.searchParams.set('type', 'playlist');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) throw new Error(`Spotify search error ${response.status}`);

  const data = await response.json();
  return (data.playlists?.items || [])
    .filter(Boolean)
    .map(pl => ({
      id: pl.id,
      name: pl.name,
      image: pl.images?.[0]?.url || null,
      spotifyUrl: pl.external_urls?.spotify || null,
    }));
}       

app.get('/api/random', async (req, res) => {
  try {
    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const playlists = await searchPlaylistsByGenre(genre);
    res.json({ genre, playlists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось получить данные от Spotify' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ http://127.0.0.1:${PORT}`);
});