
(function () {
  const TOKEN_KEY = "farside-token";
  const SESSION_KEY = "farside-session-v1";
  const PROFILE_KEY = "farside-profile-v1";

  function apiBase() {
    const u =
      (typeof window.FARSIDE_API === "string" && window.FARSIDE_API) ||
      localStorage.getItem("farside-api") ||
      "https://farside-hkic.onrender.com";
    return String(u).replace(/\/$/, "");
  }

  function token() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }

  function setToken(t) {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function writeSession(user) {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  function readLocalProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") || {};
    } catch {
      return {};
    }
  }

  function pickAvatar(serverAvatar, localAvatar) {
    const s = serverAvatar != null ? String(serverAvatar) : "";
    const l = localAvatar != null ? String(localAvatar) : "";
    // keep data-URL / blob from this browser if server has no http image
    if (l && l.indexOf("data:") === 0 && !(s.indexOf("http") === 0)) return l;
    if (s) return s;
    return l || "";
  }

  function saveLocalProfile(user) {
    try {
      const prev = readLocalProfile();
      const avatar = pickAvatar(user && user.avatar, prev.avatar);
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({
          name: (user && (user.displayName || user.nick)) || prev.name || "",
          bio: (user && user.bio) != null && user.bio !== "" ? user.bio : prev.bio || "",
          spotify: (user && user.spotify) || prev.spotify || "",
          avatar: avatar,
          favorites:
            user && Array.isArray(user.favorites) && user.favorites.length
              ? user.favorites
              : prev.favorites || [],
          updatedAt: Date.now(),
          accountNick: (user && user.nick) || prev.accountNick || "",
        }),
      );
      // also keep avatar on session object
      try {
        const sess = readSession() || {};
        if (user && user.nick) {
          writeSession(
            Object.assign({}, sess, user, {
              avatar: avatar,
            }),
          );
        }
      } catch (_) {}
    } catch (_) {}
  }

  async function api(path, opts = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json", Accept: "application/json" },
      opts.headers || {},
    );
    const t = token();
    if (t) headers.Authorization = "Bearer " + t;
    const url = apiBase() + path;
    let res;
    try {
      res = await fetch(url, {
        method: opts.method || "GET",
        headers,
        body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      });
    } catch (net) {
      const err = new Error(
        "Нет связи с API (" + apiBase() + "). Render спит или URL неверный.",
      );
      err.code = "network";
      throw err;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || data.error || "Ошибка " + res.status);
      err.code = data.error;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function ensureModal() {
    if (document.getElementById("auth-modal")) return;
    const el = document.createElement("div");
    el.id = "auth-modal";
    el.className = "auth-modal";
    el.hidden = true;
    el.innerHTML =
      '<div class="auth-modal-backdrop" data-auth-close></div>' +
      '<div class="auth-modal-card" role="dialog" aria-modal="true" aria-label="Паписики">' +
      '<div class="auth-modal-bg" aria-hidden="true"></div>' +
      '<div class="auth-modal-scrim"></div>' +
      '<button type="button" class="auth-modal-x" data-auth-close aria-label="Закрыть">×</button>' +
      '<div class="auth-modal-body">' +
      '<p class="auth-kicker">FARSIDE · SUBSCRIBERS</p>' +
      '<h2 class="auth-title">Паписики</h2>' +
      '<p class="auth-sub">Вход сохраняется в этом браузере. Не выходи из аккаунта вручную — после обновления страницы ты останешься внутри.</p>' +
      '<div class="auth-tabs">' +
      '<button type="button" class="auth-tab is-active" data-auth-tab="login">Вход</button>' +
      '<button type="button" class="auth-tab" data-auth-tab="register">Регистрация</button>' +
      "</div>" +
      '<form class="auth-form" id="auth-form-login">' +
      '<label><span>Ник</span><input name="nick" autocomplete="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" placeholder="fukamaru" /></label>' +
      '<label><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="72" /></label>' +
      '<p class="auth-error" data-auth-error hidden></p>' +
      '<button type="submit" class="btn btn-primary auth-submit">Войти</button>' +
      "</form>" +
      '<form class="auth-form" id="auth-form-register" hidden>' +
      '<label><span>Ник</span><input name="nick" autocomplete="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" placeholder="латиница, цифры, _" /></label>' +
      '<label><span>Как отображать</span><input name="displayName" maxlength="24" placeholder="необязательно" /></label>' +
      '<label><span>Пароль</span><input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="72" /></label>' +
      '<label><span>Ещё раз</span><input name="password2" type="password" autocomplete="new-password" required minlength="8" maxlength="72" /></label>' +
      '<p class="auth-error" data-auth-error hidden></p>' +
      '<button type="submit" class="btn btn-primary auth-submit">Создать аккаунт</button>' +
      "</form>" +
      "</div></div>";
    document.body.appendChild(el);

    el.querySelectorAll("[data-auth-close]").forEach((n) =>
      n.addEventListener("click", closeAuth),
    );
    el.querySelectorAll("[data-auth-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-auth-tab");
        el.querySelectorAll(".auth-tab").forEach((b) =>
          b.classList.toggle("is-active", b === btn),
        );
        el.querySelector("#auth-form-login").hidden = tab !== "login";
        el.querySelector("#auth-form-register").hidden = tab !== "register";
        el.querySelectorAll("[data-auth-error]").forEach((e) => {
          e.hidden = true;
        });
      });
    });

    el.querySelector("#auth-form-login").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const err = form.querySelector("[data-auth-error]");
      const btn = form.querySelector(".auth-submit");
      err.hidden = true;
      const fd = new FormData(form);
      if (btn) { btn.disabled = true; btn.textContent = "…"; }
      try {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: {
            nick: String(fd.get("nick") || "").trim(),
            password: String(fd.get("password") || ""),
          },
        });
        finishAuth(data);
        closeAuth();
      } catch (ex) {
        err.textContent = ex.message || "Ошибка входа";
        err.hidden = false;
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Войти"; }
      }
    });

    el.querySelector("#auth-form-register").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const err = form.querySelector("[data-auth-error]");
      const btn = form.querySelector(".auth-submit");
      err.hidden = true;
      const fd = new FormData(form);
      if (String(fd.get("password")) !== String(fd.get("password2"))) {
        err.textContent = "Пароли не совпадают";
        err.hidden = false;
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "…"; }
      try {
        const data = await api("/api/auth/register", {
          method: "POST",
          body: {
            nick: String(fd.get("nick") || "").trim(),
            password: String(fd.get("password") || ""),
            displayName: String(fd.get("displayName") || fd.get("nick") || "").trim(),
          },
        });
        finishAuth(data);
        closeAuth();
      } catch (ex) {
        err.textContent = ex.message || "Ошибка регистрации";
        err.hidden = false;
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Создать аккаунт"; }
      }
    });
  }

  function finishAuth(data) {
    if (data.token) setToken(data.token);
    if (data.user) {
      writeSession(data.user);
      saveLocalProfile(data.user);
    }
    window.dispatchEvent(
      new CustomEvent("farside-auth", { detail: data.user || null }),
    );
    const p = location.pathname || "";
    if (/profile/i.test(p)) location.reload();
  }

  function openAuth(tab) {
    ensureModal();
    const el = document.getElementById("auth-modal");
    el.hidden = false;
    document.body.classList.add("auth-modal-open");
    if (tab === "register")
      el.querySelector('[data-auth-tab="register"]').click();
  }

  function closeAuth() {
    const el = document.getElementById("auth-modal");
    if (!el) return;
    el.hidden = true;
    document.body.classList.remove("auth-modal-open");
  }

  async function me() {
    const prevProfile = readLocalProfile();
    try {
      const data = await api("/api/auth/me");
      if (data && data.user) {
        const avatar = pickAvatar(data.user.avatar, prevProfile.avatar);
        const merged = Object.assign({}, data.user, { avatar: avatar });
        // if local has favorites and server empty — keep local
        if (
          (!merged.favorites || !merged.favorites.length) &&
          prevProfile.favorites &&
          prevProfile.favorites.length
        ) {
          merged.favorites = prevProfile.favorites;
        }
        writeSession(merged);
        saveLocalProfile(merged);
        return { user: merged };
      }
    } catch (e) {
      const local = readSession();
      if (local && local.nick && token()) {
        const avatar = pickAvatar(local.avatar, prevProfile.avatar);
        return { user: Object.assign({}, local, { avatar: avatar }), offline: true };
      }
      throw e;
    }
    const local = readSession();
    if (local && local.nick) {
      const avatar = pickAvatar(local.avatar, prevProfile.avatar);
      return { user: Object.assign({}, local, { avatar: avatar }), offline: true };
    }
    const err = new Error("unauthorized");
    err.status = 401;
    throw err;
  }

  window.FarsideAuth = {
    open: openAuth,
    close: closeAuth,
    token,
    api,
    apiBase,
    session: readSession,
    me,
    async logout() {
      try {
        await api("/api/auth/logout", { method: "POST", body: {} });
      } catch (_) {}
      setToken("");
      writeSession(null);
      window.dispatchEvent(new CustomEvent("farside-auth", { detail: null }));
    },
  };

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open-auth]");
    if (!t) return;
    e.preventDefault();
    openAuth(t.getAttribute("data-open-auth") || "login");
  });
})();
