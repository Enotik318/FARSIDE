
(function () {
  const ROUTES = [
    { href: "index.html", label: "Главная", key: "nav.home" },
    { href: "generator.html", label: "Генератор", key: "nav.generator" },
    { href: "tree.html", label: "Дерево", key: "nav.tree" },
    { href: "profile.html", label: "Профиль", key: "nav.profile" },
    { href: "settings.html", label: "Настройки", key: "nav.settings" },
    { href: "about.html", label: "Манифест", key: "nav.about" },
  ];

  window.FarsideNav = {
    relabel: function (dict) {
      if (!dict) return;
      document.querySelectorAll(".top-rail a[data-nav-i]").forEach(function (a) {
        var i = Number(a.getAttribute("data-nav-i"));
        var r = ROUTES[i];
        if (!r) return;
        var t = dict[r.key] || r.label;
        a.textContent = t;
      });
      var pill = document.querySelector(".top-rail-pill");
      var on = document.querySelector(".top-rail a.is-on");
      var inner = document.querySelector(".top-rail-inner");
      if (pill && on && inner) {
        var ir = inner.getBoundingClientRect();
        var ar = on.getBoundingClientRect();
        pill.style.width = ar.width + "px";
        pill.style.transform = "translateX(" + (ar.left - ir.left) + "px)";
      }
    },
  };


  function fileName() {
    const p = (location.pathname || "").split("/").pop() || "";
    if (!p || p === "/") return "index.html";
    return p;
  }

  function indexOf(name) {
    const n = name || fileName();
    for (let i = 0; i < ROUTES.length; i++) {
      if (ROUTES[i].href === n) return i;
    }
    if (/^index\.html?$/.test(n) || n === "") return 0;
    for (let i = 0; i < ROUTES.length; i++) {
      if (n.indexOf(ROUTES[i].href.replace(".html", "")) === 0) return i;
    }
    return 0;
  }

  function ensureUI() {
    if (!document.querySelector(".top-rail")) {
      const rail = document.createElement("div");
      rail.className = "top-rail";
      rail.innerHTML =
        '<div class="top-rail-inner" role="navigation" aria-label="Разделы">' +
        '<span class="top-rail-pill" aria-hidden="true"></span>' +
        ROUTES.map(function (r, i) {
          return (
            '<a href="' +
            r.href +
            '" data-nav-i="' +
            i +
            '">' +
            r.label +
            "</a>"
          );
        }).join("") +
        "</div>";
      document.body.appendChild(rail);
    }

    if (!document.querySelector(".side-arrows")) {
      const wrap = document.createElement("div");
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

  function movePill() {
    const rail = document.querySelector(".top-rail");
    if (!rail) return;
    const inner = rail.querySelector(".top-rail-inner");
    const pill = rail.querySelector(".top-rail-pill");
    const on = rail.querySelector("a.is-on");
    if (!inner || !pill || !on) return;
    const ir = inner.getBoundingClientRect();
    const ar = on.getBoundingClientRect();
    pill.style.width = ar.width + "px";
    pill.style.transform = "translateX(" + (ar.left - ir.left) + "px)";
  }

  function markActive() {
    const i = indexOf();
    const rail = document.querySelector(".top-rail");
    if (!rail) return;
    rail.querySelectorAll("a").forEach(function (a, idx) {
      a.classList.toggle("is-on", idx === i);
    });
    requestAnimationFrame(movePill);
  }

  function wrapSlide() {
    const el =
      document.querySelector("main") ||
      document.querySelector(".stage") ||
      document.querySelector(".hero");
    if (el) el.classList.add("page-slide");
  }

  function goTo(index, dir) {
    if (index < 0 || index >= ROUTES.length) return;
    const target = ROUTES[index].href;
    sessionStorage.setItem("farside-nav-dir", dir);
    document.body.classList.remove(
      "slide-in-from-left",
      "slide-in-from-right",
      "slide-out-to-left",
      "slide-out-to-right",
    );
    document.body.classList.add(
      dir === "right" ? "slide-out-to-left" : "slide-out-to-right",
    );

    const rail = document.querySelector(".top-rail");
    if (rail) {
      rail.querySelectorAll("a").forEach(function (a, idx) {
        a.classList.toggle("is-on", idx === index);
      });
      movePill();
    }

    setTimeout(function () {
      location.href = target;
    }, 300);
  }

  // enter anim
  var dirIn = sessionStorage.getItem("farside-nav-dir");
  if (dirIn === "right") document.body.classList.add("slide-in-from-right");
  else if (dirIn === "left") document.body.classList.add("slide-in-from-left");
  sessionStorage.removeItem("farside-nav-dir");

  ensureUI();
  markActive();
  wrapSlide();
  window.addEventListener("resize", movePill);
  window.addEventListener("farside-lang", function (e) {
    if (e.detail && e.detail.dict) window.FarsideNav.relabel(e.detail.dict);
  });
  if (window.__farsideDict) window.FarsideNav.relabel(window.__farsideDict);


  // arrows
  document.querySelector(".side-arrow-left")?.addEventListener("click", function () {
    var i = indexOf();
    if (i <= 0) goTo(ROUTES.length - 1, "left");
    else goTo(i - 1, "left");
  });
  document.querySelector(".side-arrow-right")?.addEventListener("click", function () {
    var i = indexOf();
    if (i >= ROUTES.length - 1) goTo(0, "right");
    else goTo(i + 1, "right");
  });

  // keyboard
  document.addEventListener("keydown", function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft") {
      document.querySelector(".side-arrow-left")?.click();
    } else if (e.key === "ArrowRight") {
      document.querySelector(".side-arrow-right")?.click();
    }
  });

  // top rail + any internal html links
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (!href || href.indexOf("http") === 0 || href.charAt(0) === "#") return;
      var name = href.split("/").pop().split("?")[0] || "index.html";
      var to = -1;
      for (var i = 0; i < ROUTES.length; i++) {
        if (ROUTES[i].href === name) {
          to = i;
          break;
        }
      }
      if (to < 0) return;
      e.preventDefault();
      var from = indexOf();
      goTo(to, to >= from ? "right" : "left");
    },
    true,
  );
})();
