
(function () {
  const KEY = "farside-profile-v1";
  const HISTORY_KEY = "farside-genre-history";
  const MAX_AVATAR = 220000;

  const nameEl = document.getElementById("pf-name");
  const bioEl = document.getElementById("pf-bio");
  const spotifyEl = document.getElementById("pf-spotify");
  const avatarHidden = document.getElementById("pf-avatar");
  const avatarUrl = document.getElementById("pf-avatar-url");
  const avatarFile = document.getElementById("pf-avatar-file");
  const avatarView = document.getElementById("pf-avatar-view");
  const previewName = document.getElementById("pf-preview-name");
  const previewBio = document.getElementById("pf-preview-bio");
  const favList = document.getElementById("pf-fav-list");
  const favInput = document.getElementById("pf-fav-input");
  const statusEl = document.getElementById("pf-status");
  const locked = document.getElementById("profile-locked");
  const app = document.getElementById("profile-app");
  const label = document.getElementById("pf-account-label");
  const logoutBtn = document.getElementById("pf-logout");

  let favorites = [];
  let avatarData = "";

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null") || {};
    } catch {
      return {};
    }
  }

  function saveLocal(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function histCount() {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(h) ? h.length : 0;
    } catch {
      return 0;
    }
  }

  function planetName() {
    try {
      const m = JSON.parse(localStorage.getItem("farside-mars") || "{}");
      const map = {
        mars: "Марс",
        luna: "Луна",
        neptune: "Нептун",
        saturn: "Сатурн",
        venus: "Венера",
        atmos: "Атмос",
      };
      return map[m.source] || "Марс";
    } catch {
      return "Марс";
    }
  }

  function initial(name) {
    const t = (name || "").trim();
    return t ? t[0].toUpperCase() : "?";
  }

  function renderAvatar() {
    if (!avatarView) return;
    if (avatarData) {
      avatarView.textContent = "";
      avatarView.style.backgroundImage = "url(" + JSON.stringify(String(avatarData)) + ")";
      avatarView.classList.add("has-image");
    } else {
      avatarView.style.backgroundImage = "";
      avatarView.classList.remove("has-image");
      avatarView.textContent = initial(nameEl && nameEl.value);
    }
  }

  function renderPreview() {
    const name = (nameEl && nameEl.value.trim()) || "";
    const bio = (bioEl && bioEl.value.trim()) || "";
    if (previewName) previewName.textContent = name || "Без имени";
    if (previewBio) previewBio.textContent = bio || "Расскажи, кто ты в эфире.";
    renderAvatar();
    updateStats();
  }

  function updateStats() {
    const fc = favorites.length;
    const hc = histCount();
    const el = (id, v) => {
      const n = document.getElementById(id);
      if (n) n.textContent = v;
    };
    el("pf-stat-favs", String(fc));
    el("pf-stat-hist", String(hc));
    el("pf-stat-planet", planetName());
    el("pf-chip-favs", "Жанры · " + fc);
    el("pf-chip-hist", "История · " + hc);
  }

  function renderFavs() {
    if (!favList) return;
    if (!favorites.length) {
      favList.innerHTML = '<span class="set-hint">Пока пусто — добавь жанр или подтяни из истории.</span>';
      return;
    }
    favList.innerHTML = favorites
      .map(
        (g, i) =>
          '<button type="button" class="pf-fav-chip" data-i="' +
          i +
          '">' +
          String(g).replace(/</g, "&lt;") +
          " <span aria-hidden=\"true\">×</span></button>",
      )
      .join("");
    favList.querySelectorAll("button[data-i]").forEach((btn) => {
      btn.addEventListener("click", () => {
        favorites.splice(Number(btn.getAttribute("data-i")), 1);
        renderFavs();
        updateStats();
      });
    });
    updateStats();
  }

  function addFav(raw) {
    const g = String(raw || "").trim();
    if (!g) return;
    const low = g.toLowerCase();
    favorites = [g, ...favorites.filter((x) => x.toLowerCase() !== low)].slice(0, 8);
    if (favInput) favInput.value = "";
    renderFavs();
  }

  function collect() {
    return {
      name: (nameEl && nameEl.value.trim()) || "",
      bio: (bioEl && bioEl.value.trim()) || "",
      spotify: (spotifyEl && spotifyEl.value.trim()) || "",
      avatar: avatarData || "",
      favorites: favorites.slice(0, 8),
    };
  }

  function applyForm(data) {
    if (nameEl) nameEl.value = data.name || data.displayName || "";
    if (bioEl) bioEl.value = data.bio || "";
    if (spotifyEl) spotifyEl.value = data.spotify || "";
    avatarData = data.avatar || "";
    if (avatarHidden) avatarHidden.value = avatarData;
    if (avatarUrl && avatarData && String(avatarData).startsWith("http")) {
      avatarUrl.value = avatarData;
    }
    favorites = Array.isArray(data.favorites) ? data.favorites.slice(0, 8) : [];
    renderFavs();
    renderPreview();
  }

  function showLocked() {
    if (locked) locked.hidden = false;
    if (app) app.hidden = true;
    if (label) label.textContent = "";
    if (logoutBtn) logoutBtn.hidden = true;
    const chip = document.getElementById("pf-chip-user");
    if (chip) chip.textContent = "Гость";
    document.getElementById("pf-btn-reg")?.removeAttribute("hidden");
    document.getElementById("pf-btn-login")?.removeAttribute("hidden");
  }

  function showApp(user) {
    if (locked) locked.hidden = true;
    if (app) app.hidden = false;
    if (label) label.textContent = "@" + (user.nick || "—");
    if (logoutBtn) logoutBtn.hidden = false;
    const chip = document.getElementById("pf-chip-user");
    if (chip) chip.textContent = "@" + (user.nick || "user");
    document.getElementById("pf-btn-reg")?.setAttribute("hidden", "");
    document.getElementById("pf-btn-login")?.setAttribute("hidden", "");

    const local = loadLocal();
    applyForm({
      name: user.displayName || user.nick || local.name || "",
      bio: user.bio || local.bio || "",
      spotify: user.spotify || local.spotify || "",
      avatar: user.avatar || local.avatar || "",
      favorites: user.favorites || local.favorites || [],
    });
  }

  // avatar file
  avatarFile?.addEventListener("change", () => {
    const f = avatarFile.files && avatarFile.files[0];
    if (!f) return;
    if (f.size > MAX_AVATAR) {
      alert("Файл слишком большой (макс ~200KB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      avatarData = String(reader.result || "");
      if (avatarHidden) avatarHidden.value = avatarData;
      renderPreview();
    };
    reader.readAsDataURL(f);
  });

  avatarUrl?.addEventListener("change", () => {
    const u = avatarUrl.value.trim();
    if (u.startsWith("http")) {
      avatarData = u;
      if (avatarHidden) avatarHidden.value = u;
      renderPreview();
    }
  });

  document.getElementById("pf-fav-add")?.addEventListener("click", () => addFav(favInput && favInput.value));
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
        alert("История пуста — сначала поймай жанры в генераторе.");
        return;
      }
      hist.slice(0, 8).forEach((g) => addFav(g));
    } catch {
      alert("Не удалось прочитать историю.");
    }
  });

  document.getElementById("pf-save")?.addEventListener("click", async () => {
    const data = collect();
    try {
      saveLocal(data);
    } catch {
      alert("Не хватило места в браузере.");
      return;
    }

    try {
      const sess = Object.assign(
        {},
        (window.FarsideAuth && FarsideAuth.session && FarsideAuth.session()) || {},
        {
          displayName: data.name,
          bio: data.bio,
          spotify: data.spotify,
          avatar: data.avatar && String(data.avatar).startsWith("http") ? data.avatar : "",
          favorites: data.favorites,
        },
      );
      localStorage.setItem("farside-session-v1", JSON.stringify(sess));
    } catch (_) {}

    try {
      if (window.FarsideAuth && FarsideAuth.token && FarsideAuth.token()) {
        const payload = {
          displayName: data.name,
          bio: data.bio,
          spotify: data.spotify,
          favorites: data.favorites,
          avatar:
            data.avatar && String(data.avatar).startsWith("http")
              ? data.avatar
              : "",
        };
        if (FarsideAuth.api) {
          await FarsideAuth.api("/api/auth/profile", {
            method: "PATCH",
            body: payload,
          });
        } else {
          await fetch(
            (window.FARSIDE_API || "https://farside-hkic.onrender.com") +
              "/api/auth/profile",
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + FarsideAuth.token(),
              },
              body: JSON.stringify(payload),
            },
          );
        }
      }
    } catch (e) {
      console.warn("profile save", e);
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
    favorites = [];
    applyForm({});
  });

  logoutBtn?.addEventListener("click", async () => {
    if (window.FarsideAuth) await FarsideAuth.logout();
    location.reload();
  });

  nameEl?.addEventListener("input", renderPreview);
  bioEl?.addEventListener("input", renderPreview);

  (async function boot() {
    updateStats();
    if (!window.FarsideAuth) {
      showLocked();
      return;
    }
    const cached = FarsideAuth.session && FarsideAuth.session();
    if (cached && cached.nick) showApp(cached);
    try {
      const { user } = await FarsideAuth.me();
      showApp(user);
    } catch {
      if (!(cached && cached.nick)) showLocked();
    }
  })();
})();
