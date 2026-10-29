/* force dark */
try { localStorage.setItem("farside-theme","dark"); document.documentElement.setAttribute("data-theme","dark"); } catch(e){}

(function () {
  const PLANET_NAMES = {
    mars: "Марс",
    luna: "Луна",
    neptune: "Нептун",
    saturn: "Сатурн",
    venus: "Венера",
    atmos: "Атмос",
  };
  const SOURCES = {
    mars: "media/mainfon.mp4",
    luna: "media/fonLuna.mp4",
    neptune: "media/neptyn.mp4",
    saturn: "media/satyrn.mp4",
    venus: "media/venera.mp4",
    atmos: "media/atmos.mp4",
  };
  const PRESETS = {
    // обычное видео без «затемняющих» фильтров
    factory: { b: 100, c: 100, s: 100, g: 0, o: 100, v: 0, gr: 0 },
    cinema: { b: 88, c: 118, s: 85, g: 15, o: 100, v: 35, gr: 12 },
    noir: { b: 78, c: 130, s: 0, g: 100, o: 95, v: 50, gr: 22 },
    soft: { b: 108, c: 95, s: 90, g: 0, o: 92, v: 18, gr: 0 },
    vivid: { b: 105, c: 115, s: 150, g: 0, o: 100, v: 15, gr: 0 },
    warm: { b: 102, c: 108, s: 120, g: 0, o: 100, v: 22, gr: 5 },
  };

  const EXTRA_KEY = "farside-planet-extra";

  function $(id) {
    return document.getElementById(id);
  }

  function loadExtra() {
    try {
      return Object.assign({ vignette: 40, grain: 0 }, JSON.parse(localStorage.getItem(EXTRA_KEY) || "{}"));
    } catch {
      return { vignette: 40, grain: 0 };
    }
  }

  function saveExtra(x) {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(x));
  }

  function applyExtra(x) {
    const v = (Number(x.vignette) || 0) / 100;
    const g = (Number(x.grain) || 0) / 100;
    document.documentElement.style.setProperty("--planet-vignette", v.toFixed(2));
    document.documentElement.style.setProperty("--planet-grain", g.toFixed(2));
    const scrim = document.querySelector(".video-scrim");
    if (scrim) {
      scrim.style.boxShadow = "inset 0 0 " + Math.round(120 * v) + "px " + Math.round(40 * v) + "px rgba(0,0,0," + (0.35 + v * 0.5).toFixed(2) + ")";
    }
    let grain = document.querySelector(".video-grain");
    if (!grain) {
      grain = document.createElement("div");
      grain.className = "video-grain";
      document.querySelector(".video-backdrop")?.appendChild(grain);
    }
    grain.style.opacity = String(g * 0.55);
  }

  function bindValue(inputId, labelId) {
    const input = $(inputId);
    const label = $(labelId);
    if (!input || !label) return;
    const sync = () => {
      label.textContent = input.value;
    };
    input.addEventListener("input", sync);
    sync();
  }

  ["mars-bright", "mars-contrast", "mars-saturate", "mars-gray", "mars-opacity"].forEach((id, i) => {
    bindValue(id, ["val-bright", "val-contrast", "val-saturate", "val-gray", "val-opacity"][i]);
  });
  bindValue("planet-vignette", "val-vignette");
  bindValue("planet-grain", "val-grain");

  // extra controls
  const extra = loadExtra();
  if ($("planet-vignette")) $("planet-vignette").value = extra.vignette;
  if ($("planet-grain")) $("planet-grain").value = extra.grain;
  applyExtra(extra);
  $("planet-vignette")?.addEventListener("input", (e) => {
    const x = loadExtra();
    x.vignette = Number(e.target.value);
    saveExtra(x);
    applyExtra(x);
    syncLabFilter();
  });
  $("planet-grain")?.addEventListener("input", (e) => {
    const x = loadExtra();
    x.grain = Number(e.target.value);
    saveExtra(x);
    applyExtra(x);
  });

  function currentSource() {
    try {
      const m = JSON.parse(localStorage.getItem("farside-mars") || "{}");
      return m.source || "mars";
    } catch {
      return "mars";
    }
  }

  function syncLabVideo(srcKey) {
    const v = $("planet-preview");
    if (!v) return;
    const src = SOURCES[srcKey] || SOURCES.mars;
    if (v.getAttribute("data-src") === src) return;
    v.setAttribute("data-src", src);
    v.src = src;
    v.play().catch(() => {});
    if ($("planet-lab-name")) $("planet-lab-name").textContent = PLANET_NAMES[srcKey] || srcKey;
  }

  function syncLabFilter() {
    const v = $("planet-preview");
    const bg = document.getElementById("bg-video");
    if (v && bg) {
      v.style.filter = bg.style.filter || getComputedStyle(bg).filter;
      v.style.opacity = bg.style.opacity || "1";
    }
  }

  // observe bg filter changes
  const bg = document.getElementById("bg-video");
  if (bg) {
    const obs = new MutationObserver(syncLabFilter);
    obs.observe(bg, { attributes: true, attributeFilter: ["style"] });
  }
  document.querySelectorAll("#mars-bright,#mars-contrast,#mars-saturate,#mars-gray,#mars-opacity").forEach((el) => {
    el.addEventListener("input", () => setTimeout(syncLabFilter, 10));
  });

  syncLabVideo(currentSource());
  syncLabFilter();

  document.querySelectorAll(".planet-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-src") || "mars";
      setTimeout(() => {
        syncLabVideo(key);
        syncLabFilter();
        refreshChips();
      }, 30);
    });
  });

  function setRange(id, v) {
    const el = $(id);
    if (!el) return;
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.getAttribute("data-preset")] || PRESETS.default;
      setRange("mars-bright", p.b);
      setRange("mars-contrast", p.c);
      setRange("mars-saturate", p.s);
      setRange("mars-gray", p.g);
      setRange("mars-opacity", p.o);
      setRange("planet-vignette", p.v);
      setRange("planet-grain", p.gr);
      const x = { vignette: p.v, grain: p.gr };
      saveExtra(x);
      applyExtra(x);
      setTimeout(() => $("mars-save")?.click(), 20);
    });
  });

  // motion
  const MOTION_KEY = "farside-motion";
  function paintMotion() {
    const on = localStorage.getItem(MOTION_KEY) !== "off";
    $("motion-on")?.classList.toggle("is-active", on);
    $("motion-off")?.classList.toggle("is-active", !on);
    document.documentElement.classList.toggle("reduce-motion", !on);
  }
  $("motion-on")?.addEventListener("click", () => {
    localStorage.setItem(MOTION_KEY, "on");
    paintMotion();
  });
  $("motion-off")?.addEventListener("click", () => {
    localStorage.setItem(MOTION_KEY, "off");
    paintMotion();
  });
  paintMotion();

  function refreshChips() {
    const theme = localStorage.getItem("farside-theme") || "dark";
    if ($("set-chip-theme"))
      $("set-chip-theme").textContent =
        "Тема · " + (theme === "light" ? "светлая" : "тёмная");
    let planet = currentSource();
    if ($("set-chip-planet"))
      $("set-chip-planet").textContent =
        "Планета · " + (PLANET_NAMES[planet] || planet);
  }
  refreshChips();
  document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setTimeout(refreshChips, 40));
  });

  // mini hover play
  document.querySelectorAll(".planet-mini video").forEach((v) => {
    const b = v.closest(".planet-mini");
    b?.addEventListener("mouseenter", () => v.play().catch(() => {}));
    b?.addEventListener("mouseleave", () => v.pause());
  });

  const api = (
    window.FARSIDE_API ||
    localStorage.getItem("farside-api") ||
    "https://farside-hkic.onrender.com"
  ).replace(/\/$/, "");
  if ($("set-api-url")) $("set-api-url").textContent = api;
  fetch(api + "/api/health")
    .then((r) => r.json())
    .then((d) => {
      if ($("set-chip-api"))
        $("set-chip-api").textContent = d.ok
          ? "API · online · " + (d.genres || "—")
          : "API · ?";
      if ($("set-api-line"))
        $("set-api-line").textContent = d.ok
          ? "Сервер отвечает. Жанров: " + (d.genres ?? "—")
          : "Странный ответ";
    })
    .catch(() => {
      if ($("set-chip-api")) $("set-chip-api").textContent = "API · offline";
      if ($("set-api-line"))
        $("set-api-line").textContent = "Нет связи (Render мог уснуть).";
    });

  (async function () {
    if (!window.FarsideAuth) return;
    try {
      const { user } = await FarsideAuth.me();
      if ($("set-chip-user")) $("set-chip-user").textContent = "Аккаунт · @" + user.nick;
      if ($("set-user-line")) $("set-user-line").textContent = "Вы вошли как @" + user.nick;
    } catch {
      const s = FarsideAuth.session && FarsideAuth.session();
      if (s && s.nick) {
        if ($("set-chip-user")) $("set-chip-user").textContent = "Аккаунт · @" + s.nick;
        if ($("set-user-line")) $("set-user-line").textContent = "Локальная сессия @" + s.nick;
      }
    }
  })();
})();
