
(function () {
  var KEY = "farside-profile-v1";
  var HISTORY_KEY = "farside-genre-history";
  var MAX_EDGE = 256;
  var JPEG_Q = 0.82;

  var nameEl = document.getElementById("pf-name");
  var bioEl = document.getElementById("pf-bio");
  var spotifyEl = document.getElementById("pf-spotify");
  var avatarHidden = document.getElementById("pf-avatar");
  var avatarUrl = document.getElementById("pf-avatar-url");
  var avatarFile = document.getElementById("pf-avatar-file");
  var avatarView = document.getElementById("pf-avatar-view");
  var avatarPreview = document.getElementById("pf-avatar-preview");
  var previewName = document.getElementById("pf-preview-name");
  var previewBio = document.getElementById("pf-preview-bio");
  var favList = document.getElementById("pf-fav-list");
  var favListEdit = document.getElementById("pf-fav-list-edit");
  var favInput = document.getElementById("pf-fav-input");
  var statusEl = document.getElementById("pf-status");
  var locked = document.getElementById("profile-locked");
  var app = document.getElementById("profile-app");
  var label = document.getElementById("pf-account-label");
  var logoutBtn = document.getElementById("pf-logout");

  var favorites = [];
  var avatarData = "";

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null") || {};
    } catch (e) {
      return {};
    }
  }

  function saveLocal(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function histCount() {
    try {
      var h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(h) ? h.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function planetName() {
    try {
      var m = JSON.parse(localStorage.getItem("farside-mars") || "{}");
      var map = {
        mars: "Марс",
        luna: "Луна",
        neptune: "Нептун",
        saturn: "Сатурн",
        venus: "Венера",
        atmos: "Атмос",
      };
      return map[m.source] || "Марс";
    } catch (e) {
      return "Марс";
    }
  }

  function initial(name) {
    var t = (name || "").trim();
    return t ? t.charAt(0).toUpperCase() : "?";
  }

  function setAvatarEl(el) {
    if (!el) return;
    if (avatarData) {
      el.textContent = "";
      el.style.backgroundImage =
        'url("' + String(avatarData).replace(/"/g, "") + '")';
      el.classList.add("has-image");
    } else {
      el.style.backgroundImage = "";
      el.classList.remove("has-image");
      el.textContent = initial(nameEl && nameEl.value);
    }
  }

  function renderAvatar() {
    setAvatarEl(avatarView);
    setAvatarEl(avatarPreview);
  }

  function renderPreview() {
    var name = (nameEl && nameEl.value.trim()) || "";
    var bio = (bioEl && bioEl.value.trim()) || "";
    if (previewName) previewName.textContent = name || "Без имени";
    if (previewBio) previewBio.textContent = bio || "Расскажи, кто ты в эфире.";
    renderAvatar();
    updateStats();
  }

  function updateStats() {
    function set(id, v) {
      var n = document.getElementById(id);
      if (n) n.textContent = v;
    }
    set("pf-stat-favs", String(favorites.length));
    set("pf-stat-hist", String(histCount()));
    set("pf-stat-planet", planetName());
    set("pf-chip-favs", "Жанры · " + favorites.length);
    set("pf-chip-hist", "История · " + histCount());
  }

  function paintFavCloud(el, removable) {
    if (!el) return;
    if (!favorites.length) {
      el.innerHTML = removable ? '<span class="set-hint">Пока пусто</span>' : "";
      return;
    }
    el.innerHTML = favorites
      .map(function (g, i) {
        var safe = String(g).replace(/</g, "&lt;");
        if (removable) {
          return (
            '<button type="button" class="pf-fav-chip" data-i="' +
            i +
            '">' +
            safe +
            " ×</button>"
          );
        }
        return '<span class="pf-fav-chip">' + safe + "</span>";
      })
      .join("");
    if (removable) {
      el.querySelectorAll("button[data-i]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          favorites.splice(Number(btn.getAttribute("data-i")), 1);
          renderFavs();
        });
      });
    }
  }

  function renderFavs() {
    paintFavCloud(favListEdit, true);
    paintFavCloud(favList, false);
    updateStats();
  }

  function addFav(raw) {
    var g = String(raw || "").trim();
    if (!g) return;
    var low = g.toLowerCase();
    favorites = [g]
      .concat(
        favorites.filter(function (x) {
          return x.toLowerCase() !== low;
        }),
      )
      .slice(0, 8);
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
      updatedAt: Date.now(),
    };
  }

  function applyForm(data) {
    if (nameEl) nameEl.value = data.name || data.displayName || "";
    if (bioEl) bioEl.value = data.bio || "";
    if (spotifyEl) spotifyEl.value = data.spotify || "";
    avatarData = data.avatar || "";
    if (avatarHidden) avatarHidden.value = avatarData;
    if (avatarUrl) {
      avatarUrl.value =
        avatarData && String(avatarData).indexOf("http") === 0 ? avatarData : "";
    }
    favorites = Array.isArray(data.favorites) ? data.favorites.slice(0, 8) : [];
    renderFavs();
    renderPreview();
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.width;
        var h = img.height;
        var scale = Math.min(1, MAX_EDGE / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", JPEG_Q));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("bad image"));
      };
      img.src = url;
    });
  }

  function showLocked() {
    if (locked) locked.hidden = false;
    if (app) app.hidden = true;
    if (logoutBtn) logoutBtn.hidden = true;
    var chip = document.getElementById("pf-chip-user");
    if (chip) chip.textContent = "Гость";
    var reg = document.getElementById("pf-btn-reg");
    var log = document.getElementById("pf-btn-login");
    if (reg) { reg.removeAttribute("hidden"); reg.style.display = ""; }
    if (log) { log.removeAttribute("hidden"); log.style.display = ""; }
  }

  function showApp(user) {
    if (locked) locked.hidden = true;
    if (app) app.hidden = false;
    if (label) label.textContent = "@" + (user.nick || "—");
    if (logoutBtn) logoutBtn.hidden = false;
    var chip = document.getElementById("pf-chip-user");
    if (chip) chip.textContent = "@" + (user.nick || "user");
    var reg = document.getElementById("pf-btn-reg");
    var log = document.getElementById("pf-btn-login");
    if (reg) { reg.setAttribute("hidden", ""); reg.style.display = "none"; }
    if (log) { log.setAttribute("hidden", ""); log.style.display = "none"; }

    var local = loadLocal();
    var serverAv = user.avatar != null ? String(user.avatar) : "";
    var localAv = local.avatar != null ? String(local.avatar) : "";
    var avatar = serverAv;
    if (localAv.indexOf("data:") === 0 && serverAv.indexOf("http") !== 0) {
      avatar = localAv;
    } else if (!serverAv && localAv) {
      avatar = localAv;
    }
    // prefer local favorites (generator/ritual write here)
    var local2 = loadLocal();
    var favs = Array.isArray(local2.favorites) && local2.favorites.length
      ? local2.favorites
      : (Array.isArray(user.favorites) ? user.favorites : []);
    console.log("[farside] profile favs", favs);
    applyForm({
      name: user.displayName || user.nick || local.name || "",
      bio: user.bio != null && user.bio !== "" ? user.bio : local.bio || "",
      spotify: user.spotify || local.spotify || "",
      avatar: avatar,
      favorites: favs,
    });
  }

  if (avatarFile) {
    avatarFile.addEventListener("change", function () {
      var f = avatarFile.files && avatarFile.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) {
        alert("Нужна картинка");
        return;
      }
      compressImage(f)
        .then(function (dataUrl) {
          avatarData = dataUrl;
          if (avatarHidden) avatarHidden.value = dataUrl;
          try {
            saveLocal(collect());
          } catch (e) {
            alert("Не хватило места для аватара. Возьми файл поменьше.");
            return;
          }
          renderPreview();
        })
        .catch(function () {
          alert("Не удалось прочитать картинку");
        });
    });
  }

  if (avatarUrl) {
    avatarUrl.addEventListener("change", function () {
      var u = avatarUrl.value.trim();
      if (u.indexOf("http") === 0) {
        avatarData = u;
        if (avatarHidden) avatarHidden.value = u;
        renderPreview();
      }
    });
  }

  var favAdd = document.getElementById("pf-fav-add");
  if (favAdd) {
    favAdd.addEventListener("click", function () {
      addFav(favInput && favInput.value);
    });
  }
  if (favInput) {
    favInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addFav(favInput.value);
      }
    });
  }

  var fromHist = document.getElementById("pf-from-history");
  if (fromHist) {
    fromHist.addEventListener("click", function () {
      try {
        var hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        if (!Array.isArray(hist) || !hist.length) {
          alert("История пуста — сначала поймай жанры в генераторе.");
          return;
        }
        hist.slice(0, 8).forEach(function (g) {
          addFav(typeof g === "string" ? g : g.genre || g.name || "");
        });
      } catch (e) {
        alert("Не удалось прочитать историю.");
      }
    });
  }

  var saveBtn = document.getElementById("pf-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      var data = collect();
      try {
        saveLocal(data);
      } catch (e) {
        alert("Не хватило места в браузере.");
        return;
      }

      try {
        var base =
          (window.FarsideAuth && FarsideAuth.session && FarsideAuth.session()) ||
          {};
        localStorage.setItem(
          "farside-session-v1",
          JSON.stringify(
            Object.assign({}, base, {
              displayName: data.name,
              bio: data.bio,
              spotify: data.spotify,
              avatar: data.avatar,
              favorites: data.favorites,
            }),
          ),
        );
      } catch (e) {}

      try {
        if (window.FarsideAuth && FarsideAuth.token && FarsideAuth.token()) {
          await FarsideAuth.api("/api/auth/profile", {
            method: "PATCH",
            body: {
              displayName: data.name,
              bio: data.bio,
              spotify: data.spotify,
              favorites: data.favorites,
              avatar:
                data.avatar && String(data.avatar).indexOf("http") === 0
                  ? data.avatar
                  : "",
            },
          });
        }
      } catch (e) {
        console.warn("profile server save", e);
      }

      renderPreview();
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = "✓ сохранено";
        setTimeout(function () {
          statusEl.hidden = true;
        }, 1800);
      }
    });
  }

  var resetBtn = document.getElementById("pf-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (!confirm("Сбросить локальный профиль?")) return;
      localStorage.removeItem(KEY);
      avatarData = "";
      favorites = [];
      applyForm({});
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      if (window.FarsideAuth) await FarsideAuth.logout();
      location.reload();
    });
  }

  if (nameEl) nameEl.addEventListener("input", renderPreview);
  if (bioEl) bioEl.addEventListener("input", renderPreview);

  (async function boot() {
    updateStats();
    if (!window.FarsideAuth) {
      showLocked();
      return;
    }
    var cached = FarsideAuth.session && FarsideAuth.session();
    if (cached && cached.nick) showApp(cached);
    try {
      var res = await FarsideAuth.me();
      showApp(res.user);
    } catch (e) {
      if (!(cached && cached.nick)) showLocked();
    }
  })();
})();
