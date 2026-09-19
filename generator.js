// Логика генератора жанров.
// Общается с сервером (server.js), который прячет Spotify Client Secret
// и отдаёт готовый жанр + плейлисты.

const btn = document.getElementById("generate-btn");
const genreOut = document.getElementById("genre-out");
const genRight = document.getElementById("gen-right");
const genLeft = document.getElementById("gen-left");

// Локально: http://127.0.0.1:3000/api/random
// После деплоя на Render — замени на свой адрес вида
// https://твой-сервис.onrender.com/api/random
const API_URL = "/api/random";


btn.addEventListener("click", async function () {
  btn.disabled = true;
  genreOut.textContent = "Ищем частоту...";
  clearSlots();

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    genreOut.textContent = data.genre;
    renderLeftCover(data.genre, data.playlists);
    renderPlaylists(data.playlists);
  } catch (error) {
    genreOut.textContent = "Сервер не отвечает";
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

  genLeft.innerHTML = `<p class="gen-left-placeholder">Здесь скоро появится что-то ещё</p>`;
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

  if (first.image) {
    cover.style.backgroundImage = `url("${first.image}")`;
  }

  const label = document.createElement("div");
  label.className = "gen-left-label";
  label.innerHTML = `
    <span class="gen-left-genre">${genre}</span>
    <span class="gen-left-name">${first.name}</span>
  `;

  cover.appendChild(label);
  genLeft.appendChild(cover);
}

function renderPlaylists(playlists) {
  const slots = genRight.querySelectorAll(".gen-playlist");

  if (!playlists || playlists.length === 0) {
    return;
  }

  slots.forEach((slot, index) => {
    const playlist = playlists[index];
    if (!playlist) return;

    slot.classList.add("is-filled");

    const link = document.createElement("a");
    link.href = playlist.spotifyUrl || "#";
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "gen-playlist-link";

    if (playlist.image) {
      link.style.backgroundImage = `url("${playlist.image}")`;
    }

    const name = document.createElement("span");
    name.className = "gen-playlist-name";
    name.textContent = playlist.name;

    link.appendChild(name);
    slot.appendChild(link);
  });
}                                               