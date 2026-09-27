(() => {
  const KEY = "farside-mars";
  const DEFAULTS = {
    brightness: 52,
    contrast: 115,
    saturate: 0,
    grayscale: 100,
    opacity: 100,
  };

  const bright = document.getElementById("mars-bright");
  const contrast = document.getElementById("mars-contrast");
  const saturate = document.getElementById("mars-saturate");
  const gray = document.getElementById("mars-gray");
  const opacity = document.getElementById("mars-opacity");
  const saveBtn = document.getElementById("mars-save");
  const resetBtn = document.getElementById("mars-reset");

  if (!bright) return;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  let state = load();

  function toFilter(s) {
    const b = (s.brightness / 100).toFixed(2);
    const c = (s.contrast / 100).toFixed(2);
    const sat = (s.saturate / 100).toFixed(2);
    const g = (s.grayscale / 100).toFixed(2);
    return `grayscale(${g}) saturate(${sat}) brightness(${b}) contrast(${c})`;
  }

  function applyToPage(s) {
    const video = document.getElementById("bg-video");
    if (!video) return;
    video.style.filter = toFilter(s);
    video.style.opacity = String((s.opacity / 100).toFixed(2));
    // clear CSS var overrides from theme if any conflict
    document.documentElement.style.setProperty("--video-filter", toFilter(s));
    document.documentElement.style.setProperty("--video-opacity", String((s.opacity / 100).toFixed(2)));
  }

  function fillForm(s) {
    bright.value = s.brightness;
    contrast.value = s.contrast;
    saturate.value = s.saturate;
    gray.value = s.grayscale;
    opacity.value = s.opacity;
  }

  function readForm() {
    return {
      brightness: Number(bright.value),
      contrast: Number(contrast.value),
      saturate: Number(saturate.value),
      grayscale: Number(gray.value),
      opacity: Number(opacity.value),
    };
  }

  fillForm(state);
  applyToPage(state);

  [bright, contrast, saturate, gray, opacity].forEach((el) => {
    el.addEventListener("input", () => {
      state = readForm();
      applyToPage(state);
    });
  });

  saveBtn?.addEventListener("click", () => {
    state = readForm();
    localStorage.setItem(KEY, JSON.stringify(state));
    applyToPage(state);
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
    applyToPage(state);
  });
})();
