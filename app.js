(() => {
  const THEME_KEY = "farside-theme";
  const STYLE_KEY = "farside-style";
  const LANG_KEY = "farside-lang";

  const I18N = {
    ru: {
      "nav.menu": "Меню",
      "nav.section": "Навигация",
      "nav.home": "Главная",
      "nav.generator": "Генератор",
      "nav.tree": "Дерево",
      "nav.manifesto": "Манифест",
      "nav.profile": "Настройки",
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
      "gen.filters": "Настрой поиск",
      "gen.fAll": "Все жанры",
      "gen.fCalm": "Спокойное",
      "gen.fFolk": "Народные",
      "gen.fEnergy": "Энергия",
      "gen.fDark": "Тёмное",
      "gen.fLatin": "Латина",
      "gen.fElec": "Электроника",
      "gen.fRock": "Рок",
      "gen.fHip": "Хип-хоп",
      "gen.fPop": "Поп",
      "gen.worlds": "Миры",
      "gen.mars": "Марс",
      "gen.marsHint": "Видео-фон",
      "gen.customHint": "Из редактора",
      "gen.editPlanet": "Редактор →",
      "tree.kicker": "Таксономия",
      "tree.title": "Дерево жанров",
      "tree.lead": "От семейств к микро-стилям. Раскрой ветку или найди жанр поиском.",
      "about.db": "База жанров",
      "about.loading": "Загрузка списка…",
      "about.random": "Случайный →",
      "about.kicker": "Манифест",
      "about.title1": "Алгоритм устал.",
      "about.title2": "Ты — нет.",
      "about.p1": "Рекомендации сужают вкус до коридора. FARSIDE делает наоборот: бросает в сторону, которую сам бы не выбрал.",
      "about.p2": "В Spotify тысячи микро-жанров. Полный список — справа. Генератор вытащит один и покажет, куда идти дальше.",
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
      "mars.title": "Фон",
      "mars.lead": "Затемнение, контраст, насыщенность — для выбранной планеты.",
      "mars.bright": "Яркость",
      "mars.contrast": "Контраст",
      "mars.saturate": "Насыщенность",
      "mars.gray": "Чёрно-белый",
      "mars.opacity": "Прозрачность видео",
      "mars.save": "Сохранить",
      "mars.reset": "Сбросить",
      "mars.planets": "Планеты",
      "mars.mars": "Марс",
      "mars.luna": "Луна",
      "mars.neptune": "Нептун",
      "mars.saturn": "Сатурн",
      "mars.video": "Видео",
      "about.playlist": "Плейлист автора",
      "about.tg": "Жизнь Енотов",
    },
    en: {
      "nav.menu": "Menu",
      "nav.section": "Navigate",
      "nav.home": "Home",
      "nav.generator": "Generator",
      "nav.tree": "Tree",
      "nav.manifesto": "Manifesto",
      "nav.profile": "Settings",
      "nav.footer": "A random genre beyond familiar sound.",
      "tree.kicker": "Taxonomy",
      "tree.title": "Genre tree",
      "tree.lead": "From families to micro-styles. Expand a branch or search.",
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
      "gen.filters": "Tune search",
      "gen.fAll": "All genres",
      "gen.fCalm": "Calm",
      "gen.fFolk": "Folk",
      "gen.fEnergy": "Energy",
      "gen.fDark": "Dark",
      "gen.fLatin": "Latin",
      "gen.fElec": "Electronic",
      "gen.fRock": "Rock",
      "gen.fHip": "Hip-hop",
      "gen.fPop": "Pop",
      "gen.worlds": "Worlds",
      "gen.mars": "Mars",
      "gen.marsHint": "Video background",
      "gen.customHint": "From editor",
      "gen.editPlanet": "Editor →",
      "tree.kicker": "Таксономия",
      "tree.title": "Дерево жанров",
      "tree.lead": "От семейств к микро-стилям. Раскрой ветку или найди жанр поиском.",
      "about.db": "Genre database",
      "about.loading": "Loading list…",
      "about.random": "Random →",
      "about.kicker": "Manifesto",
      "about.title1": "The algorithm is tired.",
      "about.title2": "You’re not.",
      "about.p1": "Recommendations narrow taste into a corridor. FARSIDE does the opposite: throws you somewhere you wouldn’t pick yourself.",
      "about.p2": "Spotify holds thousands of micro-genres. Full list on the right. The generator pulls one and shows where to go next.",
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
      "mars.title": "Background",
      "mars.lead": "Brightness, contrast, saturation — for the selected planet.",
      "mars.bright": "Brightness",
      "mars.contrast": "Contrast",
      "mars.saturate": "Saturation",
      "mars.gray": "Black & white",
      "mars.opacity": "Video opacity",
      "mars.save": "Save",
      "mars.reset": "Reset",
      "mars.planets": "Planets",
      "mars.mars": "Mars",
      "mars.luna": "Moon",
      "mars.neptune": "Neptune",
      "mars.saturn": "Saturn",
      "mars.video": "Video",
      "about.playlist": "Author playlist",
      "about.tg": "Raccoon Life",
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

  function getStyle() {
    const s = localStorage.getItem(STYLE_KEY) || "default";
    if (s === "terminal" || s === "neon") return "default";
    return s;
  }

  function applyStyle(style) {
    const s = style || "default";
    document.documentElement.setAttribute("data-style", s);
    try { localStorage.setItem(STYLE_KEY, s); } catch (_) {}
    document.querySelectorAll("[data-style-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-style-btn") === s);
    });
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "ru";
  }
  function applyLang(lang) {
    const dict = I18N[lang] || I18N.ru;
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang-btn") === lang);
    });
  }

  applyTheme(getTheme());
  applyStyle(getStyle());
  applyLang(getLang());

  // Mars/Luna video from settings
  (function applyMarsBoot() {
    const SOURCES = {
      mars: "media/mainfon.mp4",
      luna: "media/fonLuna.mp4",
      neptune: "media/neptyn.mp4",
      saturn: "media/satyrn.mp4",
    };
    try {
      const raw = localStorage.getItem("farside-mars");
      const s = raw ? JSON.parse(raw) : {};
      const source = s.source || "mars";
      const src = SOURCES[source] || SOURCES.mars;
      const video = document.getElementById("bg-video");
      if (video) {
        const sourceEl = video.querySelector("source");
        if (sourceEl) sourceEl.src = src;
        video.load();
      }
      const b = ((s.brightness ?? 52) / 100).toFixed(2);
      const c = ((s.contrast ?? 115) / 100).toFixed(2);
      const sat = ((s.saturate ?? 0) / 100).toFixed(2);
      const g = ((s.grayscale ?? 100) / 100).toFixed(2);
      const op = ((s.opacity ?? 100) / 100).toFixed(2);
      const f = `grayscale(${g}) saturate(${sat}) brightness(${b}) contrast(${c})`;
      document.documentElement.style.setProperty("--video-filter", f);
      document.documentElement.style.setProperty("--video-opacity", op);
      if (video) {
        video.style.filter = f;
        video.style.opacity = op;
      }
    } catch (_) {}
  })();





  document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.getAttribute("data-theme-btn")));
  });

  document.querySelectorAll("[data-style-btn]").forEach((btn) => {
    btn.addEventListener("click", () => applyStyle(btn.getAttribute("data-style-btn")));
  });
  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.getAttribute("data-lang-btn")));
  });

  const burger = document.getElementById("burger");
  const panel = document.getElementById("nav-panel");
  const overlay = document.getElementById("nav-overlay");
  const icon = document.getElementById("burger-icon");
  const closeBtn = document.getElementById("nav-close");
  
  const firstLink = panel?.querySelector(".nav-items a");

  let open = false;

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
      setTimeout(() => firstLink?.focus(), 80);
    } else {
      document.getElementById("content")?.removeAttribute("inert");
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
  const videoEl = document.getElementById("bg-video");
  function applyMotion() {
    if (!videoEl) return;
    if (reduceMotion.matches) videoEl.pause();
    else videoEl.play().catch(() => {});
  }
  applyMotion();
  reduceMotion.addEventListener("change", applyMotion);


  /* ----- intro splash (zastavka) ----- */
  const INTRO_KEY = "farside-intro-seen";

  function networkIsSlow() {
    try {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!c) return false;
      if (c.saveData) return true;
      const t = String(c.effectiveType || "");
      if (t === "slow-2g" || t === "2g" || t === "3g") return true;
      if (typeof c.downlink === "number" && c.downlink > 0 && c.downlink < 1.5) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function mountIntro() {
    if (sessionStorage.getItem(INTRO_KEY) === "1") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (_) {}
      return;
    }

    const slow = networkIsSlow();
    const overlay = document.createElement("div");
    overlay.className = "fs-intro";
    overlay.id = "fs-intro";
    overlay.innerHTML =
      '<video class="fs-intro-video" playsinline preload="auto" autoplay' +
      (slow ? " loop" : "") +
      ">" +
      '<source src="media/zastavka.mp4" type="video/mp4" />' +
      "</video>" +
      '<div class="fs-intro-ui">' +
      '<button type="button" class="fs-intro-sound" id="fs-intro-sound" title="Звук">🔊</button>' +
      '<button type="button" class="fs-intro-skip" id="fs-intro-skip">Пропустить</button>' +
      "</div>";

    document.body.appendChild(overlay);
    document.body.classList.add("fs-intro-lock");

    const video = overlay.querySelector("video");
    const skipBtn = overlay.querySelector("#fs-intro-skip");
    const soundBtn = overlay.querySelector("#fs-intro-sound");
    let closed = false;
    let slowTimer = null;

    function closeIntro() {
      if (closed) return;
      closed = true;
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (_) {}
      if (slowTimer) clearTimeout(slowTimer);
      overlay.classList.add("is-out");
      try { video.pause(); } catch (_) {}
      document.body.classList.remove("fs-intro-lock");
      setTimeout(() => {
        try { overlay.remove(); } catch (_) {}
      }, 520);
    }

    function setMutedUi(m) {
      video.muted = m;
      soundBtn.textContent = m ? "🔇" : "🔊";
    }

    function unlockSound() {
      setMutedUi(false);
      video.play().catch(() => {});
    }

    // Any user gesture on the page unmutes (browser rule)
    const gesture = () => {
      unlockSound();
      window.removeEventListener("pointerdown", gesture, true);
      window.removeEventListener("keydown", gesture, true);
      window.removeEventListener("touchstart", gesture, true);
    };
    window.addEventListener("pointerdown", gesture, true);
    window.addEventListener("keydown", gesture, true);
    window.addEventListener("touchstart", gesture, true);

    skipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeIntro();
    });
    soundBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMutedUi(!video.muted);
      video.play().catch(() => {});
    });

    if (!slow) {
      video.loop = false;
      video.addEventListener("ended", closeIntro);
    } else {
      video.loop = true;
      slowTimer = setTimeout(closeIntro, 12000);
    }

    video.addEventListener("error", closeIntro);

    // Prefer sound from the first frame
    setMutedUi(false);
    video.play().then(() => {
      // success with sound (rare but possible)
    }).catch(() => {
      // Autoplay with sound blocked — start muted, unmute on any gesture
      setMutedUi(true);
      video.play().catch(() => {
        // last resort: wait for gesture to both play and unmute
        const startOnGesture = () => {
          setMutedUi(false);
          video.play().catch(() => {});
        };
        window.addEventListener("pointerdown", startOnGesture, { once: true, capture: true });
      });
    });

    // safety: don't trap forever if video never starts
    setTimeout(() => {
      if (!closed && video.readyState < 2) closeIntro();
    }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountIntro);
  } else {
    mountIntro();
  }

})();
