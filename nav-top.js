
(function () {
  var ROUTES = [
    { href: "index.html", label: "Главная", key: "nav.home" },
    { href: "generator.html", label: "Генератор", key: "nav.generator" },
    { href: "daily.html", label: "Ритуал", key: "nav.daily" },
    { href: "profile.html", label: "Профиль", key: "nav.profile" },
    { href: "settings.html", label: "Настройки", key: "nav.settings" }
  ];

  window.FarsideNav = {
    relabel: function (dict) {
      if (!dict) return;
      document.querySelectorAll(".top-rail a[data-nav-i]").forEach(function (a) {
        var i = Number(a.getAttribute("data-nav-i"));
        var r = ROUTES[i];
        if (!r) return;
        a.textContent = dict[r.key] || r.label;
      });
      movePill();
    },
  };

  function fileName() {
    var p = (location.pathname || "").split("/").pop() || "";
    if (!p || p === "/") return "index.html";
    // profile variants map to profile
    if (/^profile/i.test(p)) return "profile.html";
    return p;
  }

  function indexOf(name) {
    var n = name || fileName();
    for (var i = 0; i < ROUTES.length; i++) {
      if (ROUTES[i].href === n) return i;
    }
    if (!n || n === "index.html" || n === "index.htm") return 0;
    return -1;
  }

  function movePill() {
    var rail = document.querySelector(".top-rail");
    if (!rail) return;
    var inner = rail.querySelector(".top-rail-inner");
    var pill = rail.querySelector(".top-rail-pill");
    var on = rail.querySelector("a.is-on");
    if (!inner || !pill || !on) return;
    var ir = inner.getBoundingClientRect();
    var ar = on.getBoundingClientRect();
    pill.style.width = ar.width + "px";
    pill.style.transform = "translateX(" + (ar.left - ir.left) + "px)";
  }

  function ensureUI() {
    if (!document.querySelector(".top-rail")) {
      var rail = document.createElement("div");
      rail.className = "top-rail";
      var html =
        '<div class="top-rail-inner" role="navigation" aria-label="Разделы">' +
        '<span class="top-rail-pill" aria-hidden="true"></span>';
      for (var i = 0; i < ROUTES.length; i++) {
        html +=
          '<a href="' +
          ROUTES[i].href +
          '" data-nav-i="' +
          i +
          '">' +
          ROUTES[i].label +
          "</a>";
      }
      html += "</div>";
      rail.innerHTML = html;
      document.body.appendChild(rail);
    }
    if (!document.querySelector(".side-arrows")) {
      var wrap = document.createElement("div");
      wrap.className = "side-arrows";
      wrap.innerHTML =
        '<button type="button" class="side-arrow side-arrow-left" aria-label="Назад">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
        "</button>" +
        '<button type="button" class="side-arrow side-arrow-right" aria-label="Вперёд">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>' +
        "</button>";
      document.body.appendChild(wrap);
    }
    document.body.classList.add("has-top-rail", "no-side-nav");
    var fn = fileName();
    if (fn.indexOf("generator") !== -1) document.body.classList.add("page-gen");
    if (fn.indexOf("tree") !== -1) document.body.classList.add("page-tree");
  }

  function markActive() {
    var i = indexOf();
    var rail = document.querySelector(".top-rail");
    if (!rail) return;
    rail.querySelectorAll("a").forEach(function (a, idx) {
      a.classList.toggle("is-on", idx === i);
    });
    requestAnimationFrame(movePill);
  }

  function wrapSlide() {
    var el =
      document.querySelector("main") ||
      document.querySelector(".stage") ||
      document.querySelector(".hero");
    if (el) el.classList.add("page-slide");
  }

  function goTo(index, dir) {
    if (index < 0 || index >= ROUTES.length) return;
    var target = ROUTES[index].href;
    try {
      sessionStorage.setItem("farside-nav-dir", dir);
    } catch (e) {}
    // prefer quick navigate if reduced motion
    if (document.documentElement.classList.contains("reduce-motion")) {
      location.href = target;
      return;
    }
    document.body.classList.remove(
      "slide-in-from-left",
      "slide-in-from-right",
      "slide-out-to-left",
      "slide-out-to-right",
    );
    document.body.classList.add(
      dir === "right" ? "slide-out-to-left" : "slide-out-to-right",
    );
    var rail = document.querySelector(".top-rail");
    if (rail) {
      rail.querySelectorAll("a").forEach(function (a, idx) {
        a.classList.toggle("is-on", idx === index);
      });
      movePill();
    }
    setTimeout(function () {
      location.href = target;
    }, 260);
  }

  // enter anim — only if we actually navigated with direction
  try {
    var dirIn = sessionStorage.getItem("farside-nav-dir");
    if (dirIn === "right") document.body.classList.add("slide-in-from-right");
    else if (dirIn === "left") document.body.classList.add("slide-in-from-left");
    sessionStorage.removeItem("farside-nav-dir");
  } catch (e) {}

  // always force content visible after a short time (safety)
  setTimeout(function () {
    document.body.classList.remove(
      "slide-out-to-left",
      "slide-out-to-right",
    );
    var slides = document.querySelectorAll(".page-slide");
    for (var i = 0; i < slides.length; i++) {
      slides[i].style.opacity = "1";
      slides[i].style.transform = "none";
    }
  }, 600);

  ensureUI();
  markActive();
  wrapSlide();
  window.addEventListener("resize", movePill);
  window.addEventListener("farside-lang", function (e) {
    if (e.detail && e.detail.dict) window.FarsideNav.relabel(e.detail.dict);
  });
  if (window.__farsideDict) window.FarsideNav.relabel(window.__farsideDict);

  var leftBtn = document.querySelector(".side-arrow-left");
  var rightBtn = document.querySelector(".side-arrow-right");
  if (leftBtn) {
    leftBtn.addEventListener("click", function () {
      var i = indexOf();
      if (i < 0) i = 0;
      goTo(i <= 0 ? ROUTES.length - 1 : i - 1, "left");
    });
  }
  if (rightBtn) {
    rightBtn.addEventListener("click", function () {
      var i = indexOf();
      if (i < 0) i = 0;
      goTo(i >= ROUTES.length - 1 ? 0 : i + 1, "right");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft" && leftBtn) leftBtn.click();
    if (e.key === "ArrowRight" && rightBtn) rightBtn.click();
  });

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (!href || href.indexOf("http") === 0 || href.charAt(0) === "#") return;
      if (href.indexOf("profile-v") !== -1) return; // allow variant pages normal nav
      var name = href.split("/").pop().split("?")[0] || "index.html";
      var to = indexOf(name);
      if (to < 0) return;
      e.preventDefault();
      var from = indexOf();
      if (from < 0) from = 0;
      goTo(to, to >= from ? "right" : "left");
    },
    true,
  );
})();
