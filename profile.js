
const KEY = "farside-profile-v1";
const HISTORY_KEY = "farside-genre-history";
const MAX_AVATAR_BYTES = 220000;

const nameEl = document.getElementById("pf-name");
const bioEl = document.getElementById("pf-bio");
const spotifyEl = document.getElementById("pf-spotify");
const avatarEl = document.getElementById("pf-avatar");
const avatarFile = document.getElementById("pf-avatar-file");
const avatarUrl = document.getElementById("pf-avatar-url");
const previewName = document.getElementById("pf-preview-name");
const previewBio = document.getElementById("pf-preview-bio");
const favList = document.getElementById("pf-fav-list");
const favInput = document.getElementById("pf-fav-input");
const statusEl = document.getElementById("pf-status");

let favorites = [];
let avatarData = ""; // data URL or remote URL

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") || {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function initial(name) {
  const t = (name || "").trim();
  return t ? t[0].toUpperCase() : "?";
}

function renderAvatar() {
  if (!avatarEl) return;
  if (avatarData) {
    avatarEl.textContent = "";
    avatarEl.style.backgroundImage = "url(" + JSON.stringify(String(avatarData)) + ")";
    avatarEl.classList.add("has-image");
  } else {
    avatarEl.style.backgroundImage = "";
    avatarEl.classList.remove("has-image");
    avatarEl.textContent = initial(nameEl && nameEl.value);
  }
}

function renderPreview() {
  const name = (nameEl.value || "").trim();
  const bio = (bioEl.value || "").trim();
  previewName.textContent = name || "Без имени";
  previewBio.textContent = bio || "Расскажи, кто ты в эфире.";
  renderAvatar();
}

function renderFavs() {
  if (!favList) return;
  if (!favorites.length) {
    favList.innerHTML = '<li class="profile-fav-empty">Пока пусто</li>';
    return;
  }
  favList.innerHTML = favorites
    .map(
      (g, i) =>
        '<li><span>' +
        String(g).replace(/</g, "&lt;") +
        '</span><button type="button" data-i="' +
        i +
        '" aria-label="Удалить">×</button></li>',
    )
    .join("");
  favList.querySelectorAll("button[data-i]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-i"));
      favorites.splice(i, 1);
      renderFavs();
    });
  });
}

function addFav(raw) {
  const g = String(raw || "").trim();
  if (!g) return;
  const low = g.toLowerCase();
  if (favorites.some((x) => x.toLowerCase() === low)) return;
  favorites.unshift(g);
  favorites = favorites.slice(0, 8);
  renderFavs();
  if (favInput) favInput.value = "";
}

function applyForm(data) {
  nameEl.value = data.name || "";
  bioEl.value = data.bio || "";
  spotifyEl.value = data.spotify || "";
  avatarData = data.avatar || "";
  if (avatarUrl) {
    avatarUrl.value =
      avatarData && !String(avatarData).startsWith("data:") ? avatarData : "";
  }
  favorites = Array.isArray(data.favorites) ? data.favorites.slice(0, 8) : [];
  renderPreview();
  renderFavs();
}

function collect() {
  let avatar = avatarData || "";
  // prefer explicit URL field if user typed one and no file data
  const urlVal = (avatarUrl && avatarUrl.value || "").trim();
  if (urlVal && (urlVal.startsWith("http://") || urlVal.startsWith("https://"))) {
    if (!avatar || !String(avatar).startsWith("data:")) avatar = urlVal;
  }
  return {
    name: (nameEl.value || "").trim().slice(0, 24),
    bio: (bioEl.value || "").trim().slice(0, 160),
    spotify: (spotifyEl.value || "").trim().slice(0, 200),
    avatar: avatar,
    favorites: favorites.slice(0, 8),
    updatedAt: Date.now(),
  };
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 256;
      let w = img.width;
      let h = img.height;
      if (w > h && w > max) {
        h = Math.round((h * max) / w);
        w = max;
      } else if (h >= w && h > max) {
        w = Math.round((w * max) / h);
        h = max;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      let data = canvas.toDataURL("image/jpeg", quality);
      while (data.length > MAX_AVATAR_BYTES && quality > 0.4) {
        quality -= 0.1;
        data = canvas.toDataURL("image/jpeg", quality);
      }
      if (data.length > MAX_AVATAR_BYTES * 1.4) {
        reject(new Error("too large"));
        return;
      }
      resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load fail"));
    };
    img.src = url;
  });
}

avatarFile?.addEventListener("change", async () => {
  const file = avatarFile.files && avatarFile.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Нужен файл изображения");
    return;
  }
  try {
    avatarData = await compressImage(file);
    if (avatarUrl) avatarUrl.value = "";
    renderAvatar();
  } catch (e) {
    alert("Не удалось обработать фото. Попробуй меньше размер.");
  }
  avatarFile.value = "";
});

avatarUrl?.addEventListener("change", () => {
  const v = (avatarUrl.value || "").trim();
  if (v.startsWith("http://") || v.startsWith("https://")) {
    avatarData = v;
    renderAvatar();
  }
});

document.getElementById("pf-avatar-clear")?.addEventListener("click", () => {
  avatarData = "";
  if (avatarUrl) avatarUrl.value = "";
  renderAvatar();
});

document.getElementById("pf-save")?.addEventListener("click", async () => {
  const data = collect();
  // server avatar: only https URL (not huge data-url)
  const serverPayload = {
    displayName: data.name,
    bio: data.bio,
    spotify: data.spotify,
    favorites: data.favorites,
    avatar:
      data.avatar && String(data.avatar).startsWith("http")
        ? data.avatar
        : "",
  };
  try {
    if (window.FarsideAuth && FarsideAuth.token()) {
      await fetch(
        (window.FARSIDE_API ||
          localStorage.getItem("farside-api") ||
          "https://farside-api.onrender.com") + "/api/auth/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + FarsideAuth.token(),
          },
          credentials: "include",
          body: JSON.stringify(serverPayload),
        },
      ).then(async (r) => {
        if (!r.ok) throw new Error("save_failed");
      });
    }
    save(data);
  } catch (e) {
    alert("Не удалось сохранить на сервер. Проверь вход и API.");
    return;
  }
  renderPreview();
  if (statusEl) {
    statusEl.hidden = false;
    setTimeout(() => {
      statusEl.hidden = true;
    }, 1600);
  }
});

document.getElementById("pf-reset")?.addEventListener("click", () => {
  if (!confirm("Сбросить локальный профиль?")) return;
  localStorage.removeItem(KEY);
  avatarData = "";
  applyForm({});
});

document.getElementById("pf-fav-add")?.addEventListener("click", () => {
  addFav(favInput && favInput.value);
});

favInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addFav(favInput.value);
  }
});

document.getElementById("pf-from-history")?.addEventListener("click", () => {
  try {
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(hist) || !hist.length) {
      alert("История генератора пуста — сначала поймай жанры.");
      return;
    }
    hist.slice(0, 8).forEach((g) => addFav(g));
  } catch {
    alert("Не удалось прочитать историю.");
  }
});

nameEl?.addEventListener("input", renderPreview);
bioEl?.addEventListener("input", renderPreview);

applyForm(load());


// account gate — no edit without login
(async function accountGate() {
  const locked = document.getElementById("profile-locked");
  const app = document.getElementById("profile-app");
  const label = document.getElementById("pf-account-label");
  const logoutBtn = document.getElementById("pf-logout");

  function showLocked() {
    if (locked) locked.hidden = false;
    if (app) app.hidden = true;
    if (label) label.textContent = "";
    if (logoutBtn) logoutBtn.hidden = true;
  }

  function showApp(user) {
    if (locked) locked.hidden = true;
    if (app) app.hidden = false;
    if (label) label.textContent = "@" + user.nick;
    if (logoutBtn) {
      logoutBtn.hidden = false;
      logoutBtn.onclick = async () => {
        await FarsideAuth.logout();
        location.reload();
      };
    }
    // fill from server user
    if (nameEl) nameEl.value = user.displayName || user.nick || "";
    if (bioEl) bioEl.value = user.bio || "";
    if (spotifyEl) spotifyEl.value = user.spotify || "";
    avatarData = user.avatar || "";
    favorites = Array.isArray(user.favorites) ? user.favorites.slice(0, 8) : [];
    renderPreview();
    renderFavs();
  }

  if (!window.FarsideAuth) {
    showLocked();
    return;
  }
  try {
    const { user } = await FarsideAuth.me();
    showApp(user);
  } catch (_) {
    showLocked();
  }
})();
