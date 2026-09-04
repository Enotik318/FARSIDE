(() => {
  const burger = document.getElementById("burger");
  const panel = document.getElementById("nav-panel");
  const overlay = document.getElementById("nav-overlay");
  const icon = document.getElementById("burger-icon");
  const video = document.getElementById("bg-video");
  const pauseBtn = document.getElementById("bg-pause");
  const firstLink = panel?.querySelector("a");

  let open = false;
  let playing = true;

  function setOpen(next) {
    open = next;
    document.body.classList.toggle("menu-open", open);
    panel?.classList.toggle("is-open", open);
    overlay?.classList.toggle("is-open", open);
    icon?.classList.toggle("is-open", open);
    burger?.setAttribute("aria-expanded", String(open));
    burger?.setAttribute(
      "aria-label",
      open ? "Закрыть меню" : "Открыть меню",
    );

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

  panel?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false);
  });

  // Mark active nav link
  const path = location.pathname.split("/").pop() || "index.html";
  panel?.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (
      href === path ||
      (path === "" && href === "index.html") ||
      (path === "index.html" && href === "index.html") ||
      (path === "generator.html" && href === "generator.html") ||
      (path === "about.html" && href === "about.html")
    ) {
      a.classList.add("is-active");
    }
  });

  // Video play / pause
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
