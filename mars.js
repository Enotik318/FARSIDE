(() => {
  const KEY = "farside-mars";
  const SOURCES = {
    mars: "media/mainfon.mp4",
    luna: "media/fonLuna.mp4",
  };
  const DEFAULTS = {
    source: "mars",
    brightness: 52,
    contrast: 115,
    saturate: 0,
    grayscale: 100,
    opacity: 100,
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function toFilter(s) {
    const b = (s.brightness / 100).toFixed(2);
    const c = (s.contrast / 100).toFixed(2);
    const sat = (s.saturate / 100).toFixed(2);
    const g = (s.grayscale / 100).toFixed(2);
    return `grayscale(${g}) saturate(${sat}) brightness(${b}) contrast(${c})`;
  }

  function applySource(source) {
    const src = SOURCES[source] || SOURCES.mars;
    const video = document.getElementById("bg-video");
    if (!video) return;
    const current = video.querySelector("source");
    const abs = new URL(src, location.href).href;
    const cur = current ? current.src : video.currentSrc;
    if (cur && (cur.endsWith(src) || cur === abs)) {
      video.play().catch(() => {});
      return;
    }
    if (current) current.src = src;
    else {
      const s = document.createElement("source");
      s.src = src;
      s.type = "video/mp4";
      video.appendChild(s);
    }
    video.load();
    video.play().catch(() => {});
  }

  function applyFilter(s) {
    const f = toFilter(s);
    const op = String((s.opacity / 100).toFixed(2));
    document.documentElement.style.setProperty("--video-filter", f);
    document.documentElement.style.setProperty("--video-opacity", op);
    const video = document.getElementById("bg-video");
    if (video) {
      video.style.filter = f;
      video.style.opacity = op;
    }
  }

  function applyAll(s) {
    applySource(s.source);
    applyFilter(s);
  }

  window.farsideApplyMars = applyAll;

  const bright = document.getElementById("mars-bright");
  const contrast = document.getElementById("mars-contrast");
  const saturate = document.getElementById("mars-saturate");
  const gray = document.getElementById("mars-gray");
  const opacity = document.getElementById("mars-opacity");
  const saveBtn = document.getElementById("mars-save");
  const resetBtn = document.getElementById("mars-reset");
  const list = document.getElementById("planet-source-list");

  let state = load();

  function fillForm(s) {
    if (bright) bright.value = s.brightness;
    if (contrast) contrast.value = s.contrast;
    if (saturate) saturate.value = s.saturate;
    if (gray) gray.value = s.grayscale;
    if (opacity) opacity.value = s.opacity;
    list?.querySelectorAll(".planet-pick").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-src") === s.source);
    });
    // preview thumbs
    list?.querySelectorAll("video").forEach((v) => {
      v.play().catch(() => {});
    });
  }

  function readForm() {
    return {
      source: state.source,
      brightness: Number(bright?.value ?? state.brightness),
      contrast: Number(contrast?.value ?? state.contrast),
      saturate: Number(saturate?.value ?? state.saturate),
      grayscale: Number(gray?.value ?? state.grayscale),
      opacity: Number(opacity?.value ?? state.opacity),
    };
  }

  applyAll(state);
  fillForm(state);

  if (!bright) return;

  [bright, contrast, saturate, gray, opacity].forEach((el) => {
    el?.addEventListener("input", () => {
      state = { ...state, ...readForm() };
      applyFilter(state);
    });
  });

  list?.addEventListener("click", (e) => {
    const btn = e.target.closest(".planet-pick");
    if (!btn) return;
    state.source = btn.getAttribute("data-src") || "mars";
    fillForm(state);
    applyAll(state);
  });

  saveBtn?.addEventListener("click", () => {
    state = readForm();
    localStorage.setItem(KEY, JSON.stringify(state));
    applyAll(state);
    const lang = localStorage.getItem("farside-lang") || "ru";
    saveBtn.textContent = "✓";
    setTimeout(() => {
      saveBtn.textContent = lang === "en" ? "Save" : "Сохранить";
    }, 800);
  });

  resetBtn?.addEventListener("click", () => {
    state = { ...DEFAULTS };
    fillForm(state);
    localStorage.setItem(KEY, JSON.stringify(state));
    applyAll(state);
  });
})();
