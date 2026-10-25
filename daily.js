
(function () {
  var DAY_KEY = "farside-daily-v1";
  var TIER_KEY = "farside-tierlist-v1";
  var STREAK_KEY = "farside-daily-streak";
  var PROFILE_KEY = "farside-profile-v1";

  var VIBES = [
    { id: "calm", label: "Спокойно", keys: ["ambient", "lo-fi", "lofi", "chill", "sleep", "acoustic", "soft", "neo-classical", "modern classical", "new age", "meditation"] },
    { id: "energy", label: "Энергия", keys: ["dance", "edm", "techno", "trance", "dnb", "drum and bass", "hardstyle", "electro", "house", "bass", "breakbeat"] },
    { id: "dark", label: "Темно", keys: ["dark", "black metal", "doom", "goth", "industrial", "noise", "drone", "witch", "horror", "phonk"] },
    { id: "folk", label: "Корни", keys: ["folk", "country", "bluegrass", "celtic", "americana", "singer-songwriter", "roots", "traditional"] },
    { id: "urban", label: "Город", keys: ["hip hop", "rap", "trap", "r&b", "rnb", "soul", "funk", "drill", "grime", "boom bap"] },
    { id: "weird", label: "Странно", keys: ["experimental", "avant", "glitch", "idm", "vapor", "weird", "outsider", "musique", "free jazz", "math rock"] },
    { id: "rock", label: "Рок", keys: ["rock", "metal", "punk", "post-rock", "indie", "grunge", "shoegaze", "emo", "hardcore"] },
    { id: "any", label: "Любой", keys: [] },
  ];

  var TIER_ORDER = ["S", "A", "B", "C", "Z"];
  var TIER_LABEL = { S: "S — кайф", A: "A — сильно", B: "B — ок", C: "C — так себе", Z: "Не моё" };

  var genres = [];
  var selectedVibes = {};
  var dayState = null;
  var tier = { S: [], A: [], B: [], C: [], Z: [] };

  function today() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function msUntilNextLocalMidnight() {
    var now = new Date();
    var next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return Math.max(0, next.getTime() - now.getTime());
  }

  function formatCountdown(ms) {
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return (
      String(h).padStart(2, "0") +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(sec).padStart(2, "0")
    );
  }

  function updateTimerUI() {
    var el = document.getElementById("dy-timer");
    var hint = document.getElementById("dy-draw-hint");
    var drawBtn = document.getElementById("dy-draw");
    var redrawBtn = document.getElementById("dy-redraw");
    if (!el) return;
    var hasToday = dayState && dayState.date === today();
    if (!hasToday) {
      el.textContent = "Можно получить жанр";
      el.classList.remove("is-wait");
      if (hint) hint.textContent = "Можно сменить жанр один раз за день.";
      if (drawBtn) drawBtn.disabled = false;
      return;
    }
    var left = msUntilNextLocalMidnight();
    el.textContent = "Новый жанр через " + formatCountdown(left);
    el.classList.add("is-wait");
    if (hint) {
      hint.textContent = dayState.redrawUsed
        ? "Смена уже использована. Новый жанр — после полуночи."
        : "Можно сменить жанр один раз за день.";
    }
    // draw still allowed if want to re-show; primary lock is redraw
    if (drawBtn) drawBtn.disabled = false;
    if (redrawBtn) redrawBtn.hidden = !!dayState.redrawUsed;
  }


  function loadJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || "null");
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function loadTier() {
    var t = loadJSON(TIER_KEY, null);
    if (!t || typeof t !== "object") {
      tier = { S: [], A: [], B: [], C: [], Z: [] };
      return;
    }
    TIER_ORDER.forEach(function (k) {
      tier[k] = Array.isArray(t[k]) ? t[k].slice(0, 40) : [];
    });
  }

  function saveTier() {
    saveJSON(TIER_KEY, tier);
    updateChips();
    renderTiers();
  }

  function removeFromTier(name) {
    var low = String(name).toLowerCase();
    TIER_ORDER.forEach(function (k) {
      tier[k] = (tier[k] || []).filter(function (g) {
        return String(g).toLowerCase() !== low;
      });
    });
  }

  function placeInTier(name, tierKey) {
    if (!name || !tier[tierKey]) return;
    removeFromTier(name);
    tier[tierKey] = [name].concat(tier[tierKey]).slice(0, 40);
    saveTier();
  }

  function tierCount() {
    var n = 0;
    TIER_ORDER.forEach(function (k) {
      if (k !== "Z") n += (tier[k] || []).length;
    });
    return n;
  }

  function updateStreak(didToday) {
    var st = loadJSON(STREAK_KEY, { count: 0, last: "" });
    var t = today();
    if (st.last === t) {
      return st.count || 0;
    }
    if (!didToday) return st.count || 0;
    var y = new Date();
    y.setDate(y.getDate() - 1);
    var ys =
      y.getFullYear() +
      "-" +
      String(y.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(y.getDate()).padStart(2, "0");
    if (st.last === ys) st.count = (st.count || 0) + 1;
    else st.count = 1;
    st.last = t;
    saveJSON(STREAK_KEY, st);
    return st.count;
  }

  function updateChips() {
    var dateEl = document.getElementById("dy-chip-date");
    var streakEl = document.getElementById("dy-chip-streak");
    var tierEl = document.getElementById("dy-chip-tier");
    if (dateEl) dateEl.textContent = today();
    var st = loadJSON(STREAK_KEY, { count: 0, last: "" });
    if (streakEl) streakEl.textContent = "Серия · " + (st.count || 0);
    if (tierEl) tierEl.textContent = "В тире · " + tierCount();
  }

  function renderVibes() {
    var box = document.getElementById("dy-vibes");
    if (!box) return;
    box.innerHTML = VIBES.map(function (v) {
      var on = selectedVibes[v.id] ? " is-on" : "";
      return (
        '<button type="button" class="dy-vibe' +
        on +
        '" data-vibe="' +
        v.id +
        '">' +
        v.label +
        "</button>"
      );
    }).join("");
    box.querySelectorAll("[data-vibe]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-vibe");
        if (id === "any") {
          selectedVibes = { any: true };
        } else {
          delete selectedVibes.any;
          if (selectedVibes[id]) delete selectedVibes[id];
          else selectedVibes[id] = true;
          if (!Object.keys(selectedVibes).length) selectedVibes = { any: true };
        }
        renderVibes();
      });
    });
  }

  function activeKeyList() {
    var keys = [];
    VIBES.forEach(function (v) {
      if (selectedVibes[v.id] && v.keys && v.keys.length) {
        keys = keys.concat(v.keys);
      }
    });
    return keys;
  }

  function poolForVibes() {
    if (selectedVibes.any || !Object.keys(selectedVibes).length) {
      return genres.slice();
    }
    var keys = activeKeyList();
    if (!keys.length) return genres.slice();
    var pool = genres.filter(function (g) {
      var low = g.toLowerCase();
      return keys.some(function (k) {
        return low.indexOf(k) !== -1;
      });
    });
    return pool.length ? pool : genres.slice();
  }

  function pickGenre(redraw) {
    var pool = poolForVibes();
    if (!pool.length) return "lo-fi";
    var seed = today() + "|" + Object.keys(selectedVibes).sort().join(",") + (redraw ? "|r" : "");
    var idx = hashStr(seed) % pool.length;
    return pool[idx];
  }

  function showResult(state) {
    var card = document.getElementById("dy-result");
    if (!card || !state || !state.genre) {
      if (card) card.hidden = true;
      return;
    }
    card.hidden = false;
    var nameEl = document.getElementById("dy-genre-name");
    var blurbEl = document.getElementById("dy-genre-blurb");
    var metaEl = document.getElementById("dy-result-meta");
    var link = document.getElementById("dy-to-gen");
    if (nameEl) nameEl.textContent = state.genre;
    if (blurbEl)
      blurbEl.textContent = state.redraw
        ? "Запасной вариант на сегодня."
        : "Пойман по выбранному вайбу.";
    if (metaEl)
      metaEl.textContent =
        (state.vibes && state.vibes.length ? state.vibes.join(" · ") : "любой") +
        " · " +
        state.date;
    if (link)
      link.href = "generator.html?genre=" + encodeURIComponent(state.genre);

    document.querySelectorAll(".dy-tier-btn").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-tier") === state.tier);
    });

    var redrawBtn = document.getElementById("dy-redraw");
    if (redrawBtn) redrawBtn.hidden = !!state.redrawUsed;
  }

  function draw(redraw) {
    if (dayState && dayState.date === today() && !redraw) {
      showResult(dayState);
      return;
    }
    if (redraw && dayState && dayState.redrawUsed) {
      alert("Смена только один раз в день.");
      return;
    }
    var genre = pickGenre(!!redraw);
    dayState = {
      date: today(),
      genre: genre,
      vibes: Object.keys(selectedVibes),
      redraw: !!redraw,
      redrawUsed: (dayState && dayState.date === today() && dayState.redrawUsed) || !!redraw,
      tier: (dayState && dayState.date === today() && dayState.tier) || "",
    };
    saveJSON(DAY_KEY, dayState);
    updateStreak(true);
    updateChips();
    showResult(dayState);
    updateTimerUI();
  }

  function renderTiers() {
    var box = document.getElementById("dy-tiers");
    if (!box) return;
    box.innerHTML = TIER_ORDER.map(function (k) {
      var items = tier[k] || [];
      var chips = items.length
        ? items
            .map(function (g) {
              return (
                '<button type="button" class="dy-chip" data-name="' +
                String(g).replace(/"/g, "&quot;") +
                '">' +
                String(g).replace(/</g, "&lt;") +
                "</button>"
              );
            })
            .join("")
        : '<span class="set-hint">пусто</span>';
      return (
        '<div class="dy-tier-row tier-row-' +
        k.toLowerCase() +
        '"><div class="dy-tier-label">' +
        (TIER_LABEL[k] || k) +
        '</div><div class="dy-tier-items">' +
        chips +
        "</div></div>"
      );
    }).join("");

    box.querySelectorAll(".dy-chip").forEach(function (btn) {
      var name = btn.getAttribute("data-name");
      btn.addEventListener("click", function () {
        var order = TIER_ORDER;
        var cur = "";
        order.forEach(function (k) {
          if ((tier[k] || []).some(function (x) {
            return String(x).toLowerCase() === String(name).toLowerCase();
          }))
            cur = k;
        });
        var idx = order.indexOf(cur);
        var next = order[(idx + 1) % order.length];
        placeInTier(name, next);
      });
      btn.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        removeFromTier(name);
        saveTier();
      });
    });
  }

  function addFavorite(name) {
    try {
      var p = loadJSON(PROFILE_KEY, {});
      var favs = Array.isArray(p.favorites) ? p.favorites.slice() : [];
      var low = String(name).toLowerCase();
      favs = [name].concat(
        favs.filter(function (x) {
          return String(x).toLowerCase() !== low;
        }),
      ).slice(0, 8);
      p.favorites = favs;
      p.updatedAt = Date.now();
      saveJSON(PROFILE_KEY, p);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function loadGenres() {
    try {
      var res = await fetch("genres.txt");
      if (res.ok) {
        var text = await res.text();
        genres = text
          .split(/[\n,]/)
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean);
        // unique
        var seen = {};
        genres = genres.filter(function (g) {
          var k = g.toLowerCase();
          if (seen[k]) return false;
          seen[k] = 1;
          return true;
        });
      }
    } catch (e) {}
    if (!genres.length) {
      genres = [
        "lo-fi",
        "ambient",
        "uk garage",
        "shoegaze",
        "synthwave",
        "city pop",
        "post-rock",
        "drill",
        "jazz fusion",
        "black metal",
      ];
    }
  }

  // events
  document.getElementById("dy-draw") &&
    document.getElementById("dy-draw").addEventListener("click", function () {
      draw(false);
    });
  document.getElementById("dy-redraw") &&
    document.getElementById("dy-redraw").addEventListener("click", function () {
      draw(true);
    });

  document.getElementById("dy-tier-pick") &&
    document.getElementById("dy-tier-pick").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tier]");
      if (!b || !dayState) return;
      var t = b.getAttribute("data-tier");
      dayState.tier = t;
      saveJSON(DAY_KEY, dayState);
      placeInTier(dayState.genre, t);
      showResult(dayState);
    });

  document.getElementById("dy-to-gen") &&
    document.getElementById("dy-to-gen").addEventListener("click", function () {
      if (!dayState || !dayState.genre) return;
      try {
        sessionStorage.setItem("farside-open-genre", dayState.genre);
      } catch (e) {}
      // href already has ?genre=
    });

  document.getElementById("dy-to-fav") &&
    document.getElementById("dy-to-fav").addEventListener("click", function () {
      if (!dayState || !dayState.genre) return;
      if (addFavorite(dayState.genre)) {
        var b = document.getElementById("dy-to-fav");
        if (b) {
          b.textContent = "В любимых";
          setTimeout(function () {
            b.textContent = "♥ В любимые";
          }, 1200);
        }
      }
    });

  document.getElementById("dy-export") &&
    document.getElementById("dy-export").addEventListener("click", async function () {
      var lines = TIER_ORDER.map(function (k) {
        return (
          (TIER_LABEL[k] || k) +
          ": " +
          ((tier[k] && tier[k].length ? tier[k].join(", ") : "—"))
        );
      });
      var text = "FARSIDE tierlist\n" + lines.join("\n");
      try {
        await navigator.clipboard.writeText(text);
        alert("Тирлист скопирован");
      } catch (e) {
        prompt("Скопируй:", text);
      }
    });

  document.getElementById("dy-clear") &&
    document.getElementById("dy-clear").addEventListener("click", function () {
      if (!confirm("Очистить весь тирлист?")) return;
      tier = { S: [], A: [], B: [], C: [], Z: [] };
      saveTier();
    });

  (async function boot() {
    selectedVibes = { any: true };
    loadTier();
    await loadGenres();
    renderVibes();
    renderTiers();
    updateChips();
    dayState = loadJSON(DAY_KEY, null);
    if (dayState && dayState.date === today()) {
      showResult(dayState);
      var redrawBtn = document.getElementById("dy-redraw");
      if (redrawBtn) redrawBtn.hidden = !!dayState.redrawUsed;
    }
    updateTimerUI();
    setInterval(updateTimerUI, 1000);
  })();
})();
