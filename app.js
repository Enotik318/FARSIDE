(() => {
  const THEME_KEY = "farside-theme";
  const LANG_KEY = "farside-lang";

  const I18N = {
    ru: {
      "nav.menu": "Меню",
      "nav.section": "Навигация",
      "nav.home": "Главная",
      "nav.generator": "Генератор",
      "nav.manifesto": "Манифест",
      "nav.settings": "Настройки",
      "nav.footer": "Случайный жанр за горизонтом привычного звука.",
      "home.kicker": "Spotify · genre generator",
      "home.title1": "За горизонтом",
      "home.title2": "привычного звука",
      "home.lead": "Слушаешь одно и то же? FARSIDE выбросит на другую орбиту — случайный микро-жанр и плейлисты к нему.",
      "home.cta": "Открыть генератор",
      "home.manifesto": "Манифест",
      "home.stat1": "жанров",
      "home.stat2": "клик",
      "home.stat3": "орбит",
      "home.f1t": "Случайный жанр",
      "home.f1d": "Тысячи микро-стилей из Spotify — без повторов привычного.",
      "home.f2t": "Плейлисты сразу",
      "home.f2d": "Обложки и ссылки — открыл и слушаешь за минуту.",
      "home.f3t": "За горизонтом",
      "home.f3d": "Не рекомендации «ещё из того же» — другой угол звука.",
      "gen.kicker": "Генератор",
      "gen.title1": "Найди свой",
      "gen.title2": "новый жанр",
      "gen.btn": "Запустить генератор",
      "gen.placeholder": "Жанр появится здесь",
      "gen.cover": "Обложка плейлиста",
      "gen.worlds": "Миры",
      "gen.mars": "Марс",
      "gen.marsHint": "Видео-фон",
      "gen.customHint": "Из редактора",
      "gen.editPlanet": "Редактор →",
      "about.db": "База жанров",
      "about.loading": "Загрузка списка…",
      "about.random": "Случайный →",
      "about.kicker": "Манифест",
      "about.title1": "Алгоритм устал.",
      "about.title2": "Ты — нет.",
      "about.p1": "Рекомендации сужают вкус до коридора. FARSIDE делает наоборот: бросает в сторону, которую сам бы не выбрал.",
      "about.p2": "В Spotify тысячи микро-жанров. Полный список — слева. Генератор вытащит один и покажет, куда идти дальше.",
      "about.p3": "Горизонт уже здесь.",
      "about.cta": "К генератору",
      "set.kicker": "Система",
      "set.title": "Настройки",
      "set.theme": "Тема",
      "set.themeDesc": "Тёмная ночью, светлая днём.",
      "set.dark": "Тёмная",
      "set.light": "Светлая",
      "set.lang": "Язык",
      "set.langDesc": "Интерфейс сайта.",
      "set.note": "Тема, язык и фон сохраняются в браузере.",
      "mars.title": "Фон · Марс",
      "mars.lead": "Настрой видео Марса: затемнение, контраст, насыщенность, ч/б.",
      "mars.bright": "Яркость",
      "mars.contrast": "Контраст",
      "mars.saturate": "Насыщенность",
      "mars.gray": "Чёрно-белый",
      "mars.opacity": "Прозрачность видео",
      "mars.save": "Сохранить",
      "mars.reset": "Сбросить",
    },
    en: {
      "nav.menu": "Menu",
      "nav.section": "Navigate",
      "nav.home": "Home",
      "nav.generator": "Generator",
      "nav.manifesto": "Manifesto",
      "nav.settings": "Settings",
      "nav.footer": "A random genre beyond familiar sound.",
      "home.kicker": "Spotify · genre generator",
      "home.title1": "Beyond the horizon",
      "home.title2": "of familiar sound",
      "home.lead": "Stuck in a loop? FARSIDE throws you into another orbit — a random micro-genre and playlists to match.",
      "home.cta": "Open generator",
      "home.manifesto": "Manifesto",
      "home.stat1": "genres",
      "home.stat2": "click",
      "home.stat3": "orbits",
      "home.f1t": "Random genre",
      "home.f1d": "Thousands of Spotify micro-styles — not the same old loop.",
      "home.f2t": "Playlists ready",
      "home.f2d": "Covers and links — open and listen in a minute.",
      "home.f3t": "Beyond",
      "home.f3d": "Not “more of the same” — a different angle of sound.",
      "gen.kicker": "Generator",
      "gen.title1": "Find your",
      "gen.title2": "new genre",
      "gen.btn": "Run generator",
      "gen.placeholder": "Genre appears here",
      "gen.cover": "Playlist cover",
      "gen.worlds": "Worlds",
      "gen.mars": "Mars",
      "gen.marsHint": "Video background",
      "gen.customHint": "From editor",
      "gen.editPlanet": "Editor →",
      "about.db": "Genre database",
      "about.loading": "Loading list…",
      "about.random": "Random →",
      "about.kicker": "Manifesto",
      "about.title1": "The algorithm is tired.",
      "about.title2": "You’re not.",
      "about.p1": "Recommendations narrow taste into a corridor. FARSIDE does the opposite: throws you somewhere you wouldn’t pick yourself.",
      "about.p2": "Spotify holds thousands of micro-genres. Full list on the left. The generator pulls one and shows where to go next.",
      "about.p3": "The horizon is already here.",
      "about.cta": "To generator",
      "set.kicker": "System",
      "set.title": "Settings",
      "set.theme": "Theme",
      "set.themeDesc": "Dark at night, light by day.",
      "set.dark": "Dark",
      "set.light": "Light",
      "set.lang": "Language",
      "set.langDesc": "Site interface.",
      "set.note": "Theme, language and background are saved in the browser.",
      "mars.title": "Background · Mars",
      "mars.lead": "Tune the Mars video: brightness, contrast, saturation, B&W.",
      "mars.bright": "Brightness",
      "mars.contrast": "Contrast",
      "mars.saturate": "Saturation",
      "mars.gray": "Black & white",
      "mars.opacity": "Video opacity",
      "mars.save": "Save",
      "mars.reset": "Reset",
    },
  };

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-theme-btn") === theme);
    });
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "ru";
  }
  function applyLang(lang) {
    const dict = I18N[lang] || I18N.ru;
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem(LANG_KEY, lang);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang-btn") === lang);
    });
  }


  applyTheme(getTheme());
  applyLang(getLang());

  // Mars video look from settings
  (function applyMarsFilter() {
    try {
      const raw = localStorage.getItem("farside-mars");
      if (!raw) return;
      const s = JSON.parse(raw);
      const b = ((s.brightness ?? 52) / 100).toFixed(2);
      const c = ((s.contrast ?? 115) / 100).toFixed(2);
      const sat = ((s.saturate ?? 0) / 100).toFixed(2);
      const g = ((s.grayscale ?? 100) / 100).toFixed(2);
      const op = ((s.opacity ?? 100) / 100).toFixed(2);
      const f = `grayscale(${g}) saturate(${sat}) brightness(${b}) contrast(${c})`;
      document.documentElement.style.setProperty("--video-filter", f);
      document.documentElement.style.setProperty("--video-opacity", op);
      const video = document.getElementById("bg-video");
      if (video) {
        video.style.filter = f;
        video.style.opacity = op;
      }
    } catch (_) {}
  })();




  document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.getAttribute("data-theme-btn")));
  });
  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.getAttribute("data-lang-btn")));
  });

  const burger = document.getElementById("burger");
  const panel = document.getElementById("nav-panel");
  const overlay = document.getElementById("nav-overlay");
  const icon = document.getElementById("burger-icon");
  const closeBtn = document.getElementById("nav-close");
  const video = document.getElementById("bg-video");
  const pauseBtn = document.getElementById("bg-pause");
  const firstLink = panel?.querySelector(".nav-items a");

  let open = false;
  let playing = true;

  function setOpen(next) {
    open = next;
    document.body.classList.toggle("menu-open", open);
    panel?.classList.toggle("is-open", open);
    overlay?.classList.toggle("is-open", open);
    icon?.classList.toggle("is-open", open);
    burger?.setAttribute("aria-expanded", String(open));
    burger?.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    if (open) {
      document.getElementById("content")?.setAttribute("inert", "");
      pauseBtn?.setAttribute("inert", "");
      setTimeout(() => firstLink?.focus(), 80);
    } else {
      document.getElementById("content")?.removeAttribute("inert");
      pauseBtn?.removeAttribute("inert");
      setTimeout(() => burger?.focus(), 160);
    }
  }

  burger?.addEventListener("click", () => setOpen(!open));
  overlay?.addEventListener("click", () => setOpen(false));
  closeBtn?.addEventListener("click", () => setOpen(false));
  panel?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false);
  });

  const path = location.pathname.split("/").pop() || "index.html";
  const page =
    path === "" || path === "/"
      ? "index.html"
      : path.includes("generator")
        ? "generator.html"
        : path.includes("about")
          ? "about.html"
          : path.includes("settings")
            ? "settings.html"
            : path;

  document.querySelectorAll(".nav-items a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === page) a.classList.add("is-active");
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function applyMotion() {
    if (!video) return;
    if (reduceMotion.matches) {
      video.pause();
      playing = false;
      updatePauseIcon();
    } else {
      video
        .play()
        .then(() => {
          playing = true;
          updatePauseIcon();
        })
        .catch(() => {
          playing = false;
          updatePauseIcon();
        });
    }
  }

  function updatePauseIcon() {
    if (!pauseBtn) return;
    pauseBtn.setAttribute(
      "aria-label",
      playing ? "Остановить фоновое видео" : "Воспроизвести фоновое видео",
    );
    pauseBtn.innerHTML = playing
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="transform:translateX(1px)"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  }

  pauseBtn?.addEventListener("click", () => {
    if (!video) return;
    if (video.paused) {
      video.play();
      playing = true;
    } else {
      video.pause();
      playing = false;
    }
    updatePauseIcon();
  });

  applyMotion();
  reduceMotion.addEventListener("change", applyMotion);
  updatePauseIcon();
})();
