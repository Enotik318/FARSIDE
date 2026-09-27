const btn = document.getElementById("generate-btn");
const genreOut = document.getElementById("genre-out");
const genRight = document.getElementById("gen-right");
const genLeft = document.getElementById("gen-left");
const filtersEl = document.getElementById("gen-filters");

const API_URL = "https://farside-hkic.onrender.com/api/random";

const FILTERS = {
  all: null,
  calm: ["ambient", "chill", "lo-fi", "lofi", "acoustic", "soft", "sleep", "piano", "classical", "jazz", "bossa", "new age", "meditation", "relax", "downtempo", "dream pop"],
  folk: ["folk", "country", "americana", "bluegrass", "celtic", "singer-songwriter", "roots", "banjo", "indie folk", "traditional"],
  energy: ["edm", "dance", "techno", "house", "drum and bass", "dnb", "metal", "punk", "hardcore", "trance", "dubstep", "hardstyle", "gabber"],
  dark: ["dark", "black metal", "gothic", "industrial", "doom", "witch", "horror", "drone", "funeral", "depressive", "coldwave"],
  latin: ["latin", "reggaeton", "salsa", "cumbia", "brazilian", "spanish", "corrido", "sierreno", "bachata", "merengue", "urbano", "mexican", "tango"],
  electronic: ["electronic", "techno", "house", "synth", "electro", "idm", "breakbeat", "garage", "minimal", "acid", "future bass"],
  rock: ["rock", "metal", "punk", "grunge", "alternative", "indie rock", "hard rock", "progressive", "post-rock", "shoegaze"],
  hiphop: ["hip hop", "hip-hop", "rap", "trap", "drill", "boom bap", "gangster", "grime"],
  pop: ["pop", "k-pop", "j-pop", "synthpop", "electropop", "dance pop", "indie pop", "art pop"],
};

let activeFilter = "all";
let allGenres = null;

filtersEl?.addEventListener("click", (e) => {
  const btnF = e.target.closest("[data-filter]");
  if (!btnF) return;
  activeFilter = btnF.getAttribute("data-filter") || "all";
  filtersEl.querySelectorAll(".gen-filter").forEach((b) => {
    b.classList.toggle("is-active", b === btnF);
  });
});

async function loadGenres() {
  if (allGenres) return allGenres;
  try {
    const res = await fetch("genres.txt");
    const text = await res.text();
    allGenres = text.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    allGenres = [];
  }
  return allGenres;
}

function filterGenres(list, key) {
  const words = FILTERS[key];
  if (!words || key === "all") return list;
  return list.filter((g) => {
    const low = g.toLowerCase();
    return words.some((w) => low.includes(w));
  });
}

function pickRandom(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

btn.addEventListener("click", async function () {
  btn.disabled = true;
  genreOut.textContent = "Ищем частоту...";
  clearSlots();

  try {
    const genres = await loadGenres();
    const pool = filterGenres(genres, activeFilter);
    const localGenre = pickRandom(pool);

    if (!localGenre && activeFilter !== "all") {
      genreOut.textContent = "Нет жанров для фильтра";
      return;
    }

    // try API with genre hint; fallback to plain random
    let data = null;
    try {
      const q = localGenre ? `?genre=${encodeURIComponent(localGenre)}` : "";
      const response = await fetch(API_URL + q);
      if (response.ok) data = await response.json();
    } catch (_) {}

    // if filter active and API returned something outside filter, prefer local
    let genre = data && data.genre ? data.genre : localGenre;
    if (localGenre && activeFilter !== "all") {
      const pool2 = filterGenres([genre], activeFilter);
      if (!pool2.length) genre = localGenre;
    }

    if (!genre) {
      genreOut.textContent = "Сервер не отвечает";
      return;
    }

    genreOut.textContent = genre;
    const playlists = (data && data.playlists) || [];
    renderLeftCover(genre, playlists);
    renderPlaylists(playlists);
  } catch (error) {
    genreOut.textContent = "Ошибка";
    console.error(error);
  } finally {
    btn.disabled = false;
  }
});

function clearSlots() {
  const slots = genRight.querySelectorAll(".gen-playlist");
  slots.forEach((slot) => {
    slot.innerHTML = "";
    slot.classList.remove("is-filled");
  });
  genLeft.innerHTML = `<p class="gen-left-placeholder">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    <span>Обложка плейлиста</span>
  </p>`;
}

function renderLeftCover(genre, playlists) {
  const first = playlists && playlists[0];
  if (!first) return;
  genLeft.innerHTML = "";
  const cover = document.createElement("a");
  cover.className = "gen-left-cover";
  cover.href = first.spotifyUrl || "#";
  cover.target = "_blank";
  cover.rel = "noopener";
  if (first.image) cover.style.backgroundImage = `url("${first.image}")`;
  const label = document.createElement("div");
  label.className = "gen-left-label";
  label.innerHTML = `
    <span class="gen-left-genre">${genre}</span>
    <span class="gen-left-name">${first.name || ""}</span>
  `;
  cover.appendChild(label);
  genLeft.appendChild(cover);
}

function renderPlaylists(playlists) {
  const slots = genRight.querySelectorAll(".gen-playlist");
  if (!playlists || !playlists.length) return;
  slots.forEach((slot, index) => {
    const playlist = playlists[index];
    if (!playlist) return;
    slot.classList.add("is-filled");
    const link = document.createElement("a");
    link.href = playlist.spotifyUrl || "#";
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "gen-playlist-link";
    if (playlist.image) link.style.backgroundImage = `url("${playlist.image}")`;
    const name = document.createElement("span");
    name.className = "gen-playlist-name";
    name.textContent = playlist.name || "";
    link.appendChild(name);
    slot.innerHTML = "";
    slot.appendChild(link);
  });
}
