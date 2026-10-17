
(function () {
  const TOKEN_KEY = "farside-token";
  const PROFILE_KEY = "farside-profile-v1";

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

  function apiBase() {
    return (
      window.FARSIDE_API ||
      localStorage.getItem("farside-api") ||
      "https://farside-api.onrender.com"
    ).replace(/\/$/, "");
  }

  async function api(path, opts = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      opts.headers || {},
    );
    const t = token();
    if (t) headers.Authorization = "Bearer " + t;
    const url = apiBase() + path;
    let res;
    try {
      res = await fetch(url, {
        ...opts,
        headers,
        credentials: "include",
        body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      });
    } catch (net) {
      const err = new Error(
        "Нет связи с API (" +
          apiBase() +
          "). Проверь URL и что Render Online.",
      );
      err.code = "network";
      throw err;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(
        data.message || data.error || "Ошибка " + res.status,
      );
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
      '<div class="auth-modal-card" role="dialog" aria-modal="true" aria-label="Вход для подписчиков">' +
      '<div class="auth-modal-bg" aria-hidden="true"></div>' +
      '<div class="auth-modal-scrim"></div>' +
      '<button type="button" class="auth-modal-x" data-auth-close aria-label="Закрыть">×</button>' +
      '<div class="auth-modal-body">' +
      '<p class="auth-kicker">FARSIDE · SUBSCRIBERS</p>' +
      '<h2 class="auth-title">Паписики</h2>' +
      '<p class="auth-sub">Вход для подписчиков. Пароль хранится в виде хэша на сервере.</p>' +
      '<div class="auth-tabs">' +
      '<button type="button" class="auth-tab is-active" data-auth-tab="login">Вход</button>' +
      '<button type="button" class="auth-tab" data-auth-tab="register">Регистрация</button>' +
      "</div>" +
      '<form class="auth-form" id="auth-form-login">' +
      '<label><span>Ник</span><input name="nick" autocomplete="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" placeholder="fukamaru" /></label>' +
      '<label><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="72" placeholder="минимум 8 символов" /></label>' +
      '<p class="auth-error" data-auth-error hidden></p>' +
      '<button type="submit" class="btn btn-primary auth-submit">Войти</button>' +
      "</form>" +
      '<form class="auth-form" id="auth-form-register" hidden>' +
      '<label><span>Ник</span><input name="nick" autocomplete="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" placeholder="латиница, цифры, _" /></label>' +
      '<label><span>Как отображать</span><input name="displayName" maxlength="24" placeholder="необязательно" /></label>' +
      '<label><span>Пароль</span><input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="72" placeholder="минимум 8 символов" /></label>' +
      '<label><span>Ещё раз пароль</span><input name="password2" type="password" autocomplete="new-password" required minlength="8" maxlength="72" /></label>' +
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
      err.hidden = true;
      const fd = new FormData(form);
      try {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: {
            nick: fd.get("nick"),
            password: fd.get("password"),
          },
        });
        if (data.token) setToken(data.token);
        onAuthSuccess(data.user);
        closeAuth();
      } catch (ex) {
        err.textContent = ex.message || "Ошибка входа";
        err.hidden = false;
      }
    });

    el.querySelector("#auth-form-register").addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        const form = e.target;
        const err = form.querySelector("[data-auth-error]");
        err.hidden = true;
        const fd = new FormData(form);
        if (String(fd.get("password")) !== String(fd.get("password2"))) {
          err.textContent = "Пароли не совпадают";
          err.hidden = false;
          return;
        }
        try {
          const data = await api("/api/auth/register", {
            method: "POST",
            body: {
              nick: fd.get("nick"),
              password: fd.get("password"),
              displayName: fd.get("displayName") || fd.get("nick"),
            },
          });
          if (data.token) setToken(data.token);
          // merge local profile favorites if any
          try {
            const local = JSON.parse(
              localStorage.getItem(PROFILE_KEY) || "null",
            );
            if (local && (local.favorites || local.bio)) {
              await api("/api/auth/profile", {
                method: "PATCH",
                body: {
                  bio: local.bio || "",
                  spotify: local.spotify || "",
                  favorites: local.favorites || [],
                  displayName:
                    data.user.displayName || local.name || data.user.nick,
                },
              });
            }
          } catch (_) {}
          onAuthSuccess(data.user);
          closeAuth();
        } catch (ex) {
          err.textContent = ex.message || "Ошибка регистрации";
          err.hidden = false;
        }
      },
    );
  }

  function openAuth(tab) {
    ensureModal();
    const el = document.getElementById("auth-modal");
    el.hidden = false;
    document.body.classList.add("auth-modal-open");
    if (tab === "register") {
      el.querySelector('[data-auth-tab="register"]').click();
    }
  }

  function closeAuth() {
    const el = document.getElementById("auth-modal");
    if (!el) return;
    el.hidden = true;
    document.body.classList.remove("auth-modal-open");
  }

  function onAuthSuccess(user) {
    try {
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({
          name: user.displayName || user.nick,
          bio: user.bio || "",
          spotify: user.spotify || "",
          avatar: user.avatar || "",
          favorites: user.favorites || [],
          updatedAt: Date.now(),
          accountNick: user.nick,
        }),
      );
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("farside-auth", { detail: user }));
    // refresh profile page fields if present
    if (location.pathname.endsWith("profile.html")) {
      location.reload();
    }
  }

  window.FarsideAuth = {
    open: openAuth,
    close: closeAuth,
    token,
    async me() {
      return api("/api/auth/me");
    },
    async logout() {
      try {
        await api("/api/auth/logout", { method: "POST", body: {} });
      } catch (_) {}
      setToken("");
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
