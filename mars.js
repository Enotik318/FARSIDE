
(() => {
  const KEY = "farside-mars";
  const SOURCES = {
    mars: "media/mainfon.mp4",
    luna: "media/fonLuna.mp4",
    neptune: "media/neptyn.mp4",
    saturn: "media/satyrn.mp4",
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

  function save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (_) {}
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
    let current = video.querySelector("source");
    if (!current) {
      current = document.createElement("source");
      current.type = "video/mp4";
      video.appendChild(current);
    }
    // always set and reload — avoids sticky Mars
    current.setAttribute("src", src);
    video.setAttribute("src", src);
    try {
      video.load();
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
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
    applySource(s.source || "mars");
    applyFilter(s);
    // highlight picker
    document.querySelectorAll(".planet-pick").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        btn.getAttribute("data-src") === s.source,
      );
    });
  }

  window.farsideApplyMars = applyAll;
  window.farsideGetMars = load;

  let state = load();
  applyAll(state);

  // settings form (only on settings page)
  const bright = document.getElementById("mars-bright");
  const contrast = document.getElementById("mars-contrast");
  const saturate = document.getElementById("mars-saturate");
  const gray = document.getElementById("mars-gray");
  const opacity = document.getElementById("mars-opacity");
  const saveBtn = document.getElementById("mars-save");
  const resetBtn = document.getElementById("mars-reset");
  const list = document.getElementById("planet-source-list");

  function fillForm(s) {
    if (bright) bright.value = s.brightness;
    if (contrast) contrast.value = s.contrast;
    if (saturate) saturate.value = s.saturate;
    if (gray) gray.value = s.grayscale;
    if (opacity) opacity.value = s.opacity;
    document.querySelectorAll(".planet-pick").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        btn.getAttribute("data-src") === s.source,
      );
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

  fillForm(state);

  if (bright) {
    [bright, contrast, saturate, gray, opacity].forEach((el) => {
      el?.addEventListener("input", () => {
        state = { ...state, ...readForm() };
        applyFilter(state);
      });
    });
  }

  list?.addEventListener("click", (e) => {
    const btn = e.target.closest(".planet-pick");
    if (!btn) return;
    state.source = btn.getAttribute("data-src") || "mars";
    state = { ...state, ...readForm(), source: state.source };
    save(state); // auto-save planet choice
    fillForm(state);
    applyAll(state);
  });

  saveBtn?.addEventListener("click", () => {
    state = { ...readForm(), source: state.source };
    save(state);
    applyAll(state);
    saveBtn.textContent = "✓";
    setTimeout(() => {
      saveBtn.textContent = "Сохранить";
    }, 800);
  });

  resetBtn?.addEventListener("click", () => {
    state = { ...DEFAULTS };
    fillForm(state);
    save(state);
    applyAll(state);
  });
})();
