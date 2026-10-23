const FARSIDE_API_BASE = (window.FARSIDE_API || localStorage.getItem("farside-api") || "https://farside-hkic.onrender.com").replace(/\/$/, "");

const API_URL = FARSIDE_API_BASE + "/api/random";
const API_HEALTH = FARSIDE_API_BASE + "/api/health";
const CACHE_KEY = "farside-api-cache-v2";
const CACHE_TTL = 8 * 60 * 1000;
const FILTER_KEY = "farside-filter";
const HISTORY_KEY = "farside-genre-history";


const FILTERS = {
  all: null,
  calm: ["ambient", "chill", "lo-fi", "lofi", "acoustic", "soft", "sleep", "piano", "classical", "jazz", "bossa", "downtempo", "mellow"],
  energy: ["edm", "dance", "techno", "house", "drum and bass", "metal", "punk", "hardcore", "trance", "dubstep"],
  dark: ["dark", "black metal", "gothic", "industrial", "doom", "horror", "drone", "coldwave"],
  folk: ["folk", "country", "americana", "bluegrass", "celtic", "sierreno", "corrido", "ranchera"],
  latin: ["latin", "reggaeton", "salsa", "cumbia", "bachata", "brazilian", "tango", "norteno"],
  electronic: ["electronic", "techno", "house", "synth", "idm", "synthwave", "garage", "minimal"],
  rock: ["rock", "metal", "punk", "grunge", "alternative", "indie rock", "shoegaze", "post-rock"],
  metal: ["metal", "death", "black metal", "doom", "thrash", "djent", "core"],
  hiphop: ["hip hop", "hip-hop", "rap", "trap", "drill", "boom bap", "grime"],
  pop: ["pop", "k-pop", "j-pop", "synthpop", "electropop", "indie pop"],
  jazz: ["jazz", "soul", "funk", "neo soul", "bebop", "swing", "bossa"],
  punk: ["punk", "hardcore", "post-punk", "pop punk"],
  rnb: ["r&b", "rnb", "neo soul", "soul"],
  indie: ["indie", "alternative", "diy"],
  night: ["dark", "ambient", "nocturne", "dream", "coldwave", "witch"],
  heat: ["reggaeton", "dance", "party", "latin", "funk", "disco"],
  soft: ["soft", "acoustic", "gentle", "piano", "folk", "lullaby"],
};

const btn = document.getElementById("generate-btn");
const genreOut = document.getElementById("genre-out");
const genreDesc = document.getElementById("genre-desc");
const genreMeta = document.getElementById("genre-meta");
const genreType = document.getElementById("genre-type");
const genreFilter = document.getElementById("genre-filter");
const signalLines = document.getElementById("signal-lines");
const etherTrack = document.getElementById("ether-track");
const plGrid = document.getElementById("playlist-grid");
const plEmpty = document.getElementById("pl-empty");
const plLabel = document.getElementById("pl-genre-label");
const trList = document.getElementById("track-list");
const trEmpty = document.getElementById("tr-empty");
const trLabel = document.getElementById("tr-genre-label");

let allGenres = null;
let genresMeta = null;
let activeFilter = "all";
let lastGenre = null;
let busy = false;
const t0 = Date.now();
let logQueue = Promise.resolve();
const LOG_GAP = 70;

function elapsed() {
  const s = Math.floor((Date.now() - t0) / 1000);
  return (
    "T+" +
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
}

function logLine(text) {
  logQueue = logQueue.then(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          if (!signalLines) return resolve();
          const li = document.createElement("li");
          li.className = "gx-log-in";
          li.innerHTML =
            '<span class="gx-log-t">' + elapsed() + "</span> " + text;
          signalLines.appendChild(li);
          while (signalLines.children.length > 24) {
            signalLines.removeChild(signalLines.firstChild);
          }
          const box = signalLines.parentElement;
          if (box) box.scrollTop = box.scrollHeight;
          requestAnimationFrame(() => li.classList.add("is-on"));
          resolve();
        }, LOG_GAP);
      }),
  );
  return logQueue;
}

async function logLines(arr) {
  for (const t of arr) await logLine(t);
}

function setApiStatus(state, text) {
  const el = document.getElementById("api-status");
  if (!el) return;
  el.dataset.state = state || "";
  el.textContent = text || "";
}

function readHistory() {
  try {
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(arr) ? arr.filter(Boolean).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function pushHistory(genre) {
  if (!genre) return;
  let arr = readHistory().filter(
    (g) => g.toLowerCase() !== String(genre).toLowerCase(),
  );
  arr.unshift(genre);
  arr = arr.slice(0, 5);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  } catch (_) {}
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("history-list");
  if (!list) return;
  const arr = readHistory();
  if (!arr.length) {
    list.innerHTML = '<li class="gx-history-empty">пока пусто</li>';
    return;
  }
  list.innerHTML = arr
    .map(
      (g) =>
        '<li><button type="button" class="gx-history-btn" data-genre="' +
        String(g).replace(/"/g, "&quot;") +
        '">' +
        String(g).replace(/</g, "&lt;") +
        "</button></li>",
    )
    .join("");
  list.querySelectorAll(".gx-history-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const g = btn.getAttribute("data-genre");
      if (!g) return;
      await loadMeta();
      lastGenre = g;
      renderResult(g);
      const cached = cacheRead(g.toLowerCase());
      if (cached) {
        renderPlaylists(cached.playlists || [], g, false);
        renderTracks(cached, g);
        logLine("history · cache " + g);
      } else {
        renderPlaylists([], g, true);
        renderTracks(null, g);
        logLine("history · " + g);
      }
      showPanel("desc");
    });
  });
}


async function loadGenres() {
  if (allGenres && allGenres.length) return allGenres;

  function looksLikeHtml(s) {
    const t = String(s || "").trim().toLowerCase();
    return (
      t.startsWith("<!doctype") ||
      t.startsWith("<html") ||
      t.startsWith("<head") ||
      t.startsWith("<body") ||
      t.includes("</html>") ||
      t.startsWith("<!--")
    );
  }

  function cleanList(list) {
    return (list || [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .filter((s) => !looksLikeHtml(s))
      .filter((s) => !s.startsWith("<") && !s.startsWith("{"))
      .filter((s) => s.length < 80);
  }

  // 1) genres.json — reliable
  try {
    const res = await fetch("genres.json");
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        genresMeta = data;
        allGenres = cleanList(
          Array.isArray(data) ? data : Object.values(data).map((v) => v.name || v),
        );
        // also keys if values have no name
        if (!allGenres.length) allGenres = cleanList(Object.keys(data));
      }
    }
  } catch (_) {}

  // 2) genres.txt fallback
  if (!allGenres || !allGenres.length) {
    try {
      const res = await fetch("genres.txt");
      const text = await res.text();
      if (!looksLikeHtml(text)) {
        allGenres = cleanList(text.split("\n"));
      }
    } catch (_) {}
  }

  if (!allGenres || !allGenres.length) {
    allGenres = ["indie", "techno", "lo-fi", "synthwave", "jazz", "ambient"];
  }
  return allGenres;
}

async function loadMeta() {
  if (genresMeta && Object.keys(genresMeta).length) return genresMeta;
  try {
    const res = await fetch("genres.json");
    genresMeta = res.ok ? await res.json() : {};
  } catch {
    genresMeta = {};
  }
  return genresMeta;
}

function filterPool(list, key) {
  const words = FILTERS[key];
  if (!words) return list;
  return list.filter((g) => {
    const low = g.toLowerCase();
    return words.some((w) => low.includes(w));
  });
}

function cacheRead(key) {
  try {
    const bag = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
    const hit = bag[key];
    if (!hit || Date.now() - hit.t > CACHE_TTL) return null;
    const d = hit.data;
    const ok =
      d &&
      ((Array.isArray(d.playlists) && d.playlists.filter(Boolean).length) ||
        (Array.isArray(d.tracks) && d.tracks.filter(Boolean).length));
    return ok ? d : null;
  } catch {
    return null;
  }
}

function cacheWrite(key, data) {
  try {
    const bag = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
    bag[key] = { t: Date.now(), data };
    const keys = Object.keys(bag);
    if (keys.length > 30) {
      keys
        .sort((a, b) => bag[a].t - bag[b].t)
        .slice(0, keys.length - 30)
        .forEach((k) => delete bag[k]);
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(bag));
  } catch (_) {}
}

function fillEther(list) {
  if (!etherTrack || !list.length) return;
  const pick = [];
  for (let i = 0; i < 20; i++) {
    pick.push(list[Math.floor(Math.random() * list.length)]);
  }
  etherTrack.innerHTML = pick
    .concat(pick)
    .map((g) => "<span>" + g + "</span>")
    .join("");
}

function showPanel(id) {
  document.querySelectorAll(".gx-tab").forEach((t) => {
    const on = t.getAttribute("data-panel") === id;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".gx-panel").forEach((p) => {
    const on = p.getAttribute("data-panel") === id;
    p.classList.toggle("is-active", on);
    p.hidden = !on;
  });
}

function setFilter(key) {
  activeFilter = key || "all";
  document.querySelectorAll(".gx-filter, .gx-chip, [data-filter]").forEach((el) => {
    const f = el.getAttribute("data-filter");
    if (f == null) return;
    el.classList.toggle("is-active", f === activeFilter);
    el.classList.toggle("is-on", f === activeFilter);
  });
  try {
    localStorage.setItem(FILTER_KEY, activeFilter);
  } catch (_) {}
  logLine("filter · " + activeFilter);
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function lookupMeta(genre) {
  if (!genresMeta || !genre) return null;
  const g = String(genre);
  return (
    genresMeta[g] ||
    genresMeta[g.toLowerCase()] ||
    Object.values(genresMeta).find(
      (v) => v && v.name && v.name.toLowerCase() === g.toLowerCase(),
    ) ||
    null
  );
}

function cleanBlurb(text, genre) {
  if (!text) return "";
  let t = String(text).trim();
  // drop duplicated wiki paste
  const mid = Math.floor(t.length / 2);
  if (t.length > 280) {
    const a = t.slice(0, mid).trim();
    const b = t.slice(mid).trim();
    if (a.slice(0, 80) === b.slice(0, 80)) t = a;
  }
  // strip leading "name —" noise sometimes
  const low = genre.toLowerCase();
  if (t.toLowerCase().startsWith(low + " —")) t = t.slice(low.length + 3).trim();
  if (t.toLowerCase().startsWith(low + " -")) t = t.slice(low.length + 2).trim();
  return t.slice(0, 520);
}

function buildDesc(genre) {
  const meta = lookupMeta(genre);
  if (!meta) {
    return (
      '<p class="gx-desc-lead"><strong>' +
      esc(genre) +
      "</strong> — микро-жанр из каталога. Открой плейлисты и треки во вкладках.</p>" +
      '<p><span class="gx-desc-label">Звук.</span> Уточняется по сцене и соседним стилям.</p>' +
      '<p><span class="gx-desc-label">Откуда.</span> Данные появятся, когда подтянется карточка жанра.</p>' +
      '<p><span class="gx-desc-label">Куда слушать.</span> Вкладки «Плейлисты» и «Треки».</p>'
    );
  }

  const blurb = cleanBlurb(meta.blurb || meta.wiki_extract || "", genre);
  const sound = meta.sound || "";
  const originBits = [];
  if (meta.origin) originBits.push(meta.origin);
  if (meta.country) originBits.push(meta.country);
  if (Array.isArray(meta.regions) && meta.regions.length) {
    originBits.push(meta.regions.slice(0, 4).join(", "));
  }
  // unique-ish
  const origin = [...new Set(originBits.map((x) => String(x).trim()).filter(Boolean))].join(" · ");
  const tags = Array.isArray(meta.tags) ? meta.tags.filter(Boolean).slice(0, 6) : [];

  let html = "";
  if (blurb) {
    html += '<p class="gx-desc-lead">' + esc(blurb) + "</p>";
  } else {
    html +=
      '<p class="gx-desc-lead"><strong>' +
      esc(meta.name || genre) +
      "</strong> — стиль из семейства " +
      esc(meta.family || "other") +
      ".</p>";
  }

  html +=
    '<p><span class="gx-desc-label">Звук.</span> ' +
    esc(sound || "Тембр и ритм зависят от локальной сцены — смотри треки.") +
    "</p>";

  html +=
    '<p><span class="gx-desc-label">Откуда.</span> ' +
    esc(origin || "Регион не зафиксирован — часто онлайн- или гибридная сцена.") +
    "</p>";

  html +=
    '<p><span class="gx-desc-label">Куда слушать.</span> Плейлисты и треки — во вкладках рядом' +
    (meta.wiki && meta.wiki.url
      ? '; <a class="gx-wiki-link" href="' +
        esc(meta.wiki.url) +
        '" target="_blank" rel="noopener">wiki</a>'
      : "") +
    ".</p>";

  if (tags.length) {
    html +=
      '<p class="gx-result-muted">теги · ' +
      tags.map(esc).join(" · ") +
      "</p>";
  } else if (meta.parent && meta.parent !== meta.name) {
    html +=
      '<p class="gx-result-muted">ветка · ' +
      esc(meta.parent) +
      (meta.family ? " · семья " + esc(meta.family) : "") +
      "</p>";
  }

  return html;
}

function renderResult(genre) {
  const meta = lookupMeta(genre);
  if (genreOut) {
    genreOut.textContent = genre;
    genreOut.classList.remove("is-in");
    requestAnimationFrame(() => genreOut.classList.add("is-in"));
  }
  if (genreDesc) genreDesc.innerHTML = buildDesc(genre);
  if (genreType) {
    const fam = (meta && meta.family) || "—";
    genreType.textContent = "тип · " + fam;
  }
  if (genreFilter) {
    genreFilter.textContent =
      "фильтр · " + (activeFilter === "all" ? "все" : activeFilter);
  }
}

function renderPlaylists(list, genre, offline) {
  if (plLabel) plLabel.textContent = genre || "—";
  if (!plGrid) return;
  plGrid.innerHTML = "";
  const items = (list || []).filter(Boolean).slice(0, 8);

  if (!items.length) {
    if (offline && genre) {
      if (plEmpty) plEmpty.hidden = true;
      const q = encodeURIComponent(genre);
      [
        {
          name: "Spotify · " + genre,
          spotifyUrl: "https://open.spotify.com/search/" + q + "/playlists",
        },
      ].forEach((pl, i) => {
        const a = document.createElement("a");
        a.className = "gx-pl-card gx-pl-in";
        a.href = pl.spotifyUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML =
          '<div class="gx-pl-cover"></div><div class="gx-pl-meta"><strong>' +
          pl.name.replace(/</g, "&lt;") +
          "</strong><span>Открыть поиск</span></div>";
        plGrid.appendChild(a);
      });
      return;
    }
    if (plEmpty) {
      plEmpty.hidden = false;
      const title = plEmpty.querySelector("strong");
      const sub = plEmpty.querySelector("span");
      if (title) title.textContent = offline ? "API молчит" : "Плейлистов пока нет";
      if (sub)
        sub.textContent = offline
          ? "Жанр локальный. Подними Render (server.js tracks-v5)."
          : "Запусти генератор.";
    }
    return;
  }

  if (plEmpty) plEmpty.hidden = true;
  items.forEach((pl, i) => {
    const url =
      pl.spotifyUrl ||
      (pl.external_urls && pl.external_urls.spotify) ||
      "#";
    const img =
      pl.image ||
      (pl.images && pl.images[0] && (pl.images[0].url || pl.images[0])) ||
      "";
    const total = pl.tracksTotal ?? pl.tracks_total ?? null;
    const a = document.createElement("a");
    a.className = "gx-pl-card gx-pl-in";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.animationDelay = i * 40 + "ms";
    a.innerHTML =
      '<div class="gx-pl-cover"' +
      (img
        ? ' style="background-image:url(\'' +
          String(img).replace(/'/g, "%27") +
          "')\""
        : "") +
      '></div><div class="gx-pl-meta"><strong>' +
      String(pl.name || "Playlist").replace(/</g, "&lt;") +
      "</strong><span>" +
      (total != null ? total + " tracks" : "Spotify") +
      "</span></div>";
    plGrid.appendChild(a);
  });
}

function fmtDur(ms) {
  if (ms == null || isNaN(ms)) return "";
  const s = Math.round(Number(ms) / 1000);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function renderTracks(data, genre) {
  if (trLabel) trLabel.textContent = genre || "—";
  if (!trList) return;
  trList.innerHTML = "";
  let tracks = [];
  if (data) {
    if (Array.isArray(data.tracks)) tracks = data.tracks;
    else if (data.data && Array.isArray(data.data.tracks)) tracks = data.data.tracks;
    else if (Array.isArray(data)) tracks = data;
  }
  tracks = tracks.filter(Boolean);

  if (!tracks.length) {
    if (trEmpty) trEmpty.hidden = false;
    return;
  }
  if (trEmpty) trEmpty.hidden = true;

  tracks.slice(0, 12).forEach((tr, i) => {
    const url =
      tr.spotifyUrl || (tr.external_urls && tr.external_urls.spotify) || "#";
    const artists = (tr.artists || [])
      .map((a) => (typeof a === "string" ? a : a.name))
      .filter(Boolean)
      .join(", ");
    const img = tr.image || tr.album_image || null;
    const row = document.createElement(url !== "#" ? "a" : "div");
    row.className = "gx-track gx-track-row gx-pl-in";
    row.style.animationDelay = i * 35 + "ms";
    if (row.tagName === "A") {
      row.href = url;
      row.target = "_blank";
      row.rel = "noopener";
    }
    const artStyle = img
      ? "background-image:url(" + JSON.stringify(String(img)) + ")"
      : "";
    row.innerHTML =
      '<span class="gx-track-n">' +
      (i + 1) +
      '</span><div class="gx-track-art" style="' +
      artStyle +
      '"></div><div class="gx-track-meta"><strong>' +
      String(tr.name || "Track").replace(/</g, "&lt;") +
      "</strong><span>" +
      String(artists).replace(/</g, "&lt;") +
      '</span></div><span class="gx-track-dur">' +
      fmtDur(tr.duration_ms) +
      "</span>";
    trList.appendChild(row);
  });
}

async function fetchApi(genre) {
  const key = String(genre || "").toLowerCase();
  const cached = key ? cacheRead(key) : null;
  if (cached) {
    setApiStatus("ok", "связь · кэш");
    await logLine("cache hit");
    return cached;
  }
  setApiStatus("wait", "связь · прогрев сервера…");
  await logLine("handshake api");
  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), 20000);
  try {
    const q = genre ? "?genre=" + encodeURIComponent(genre) : "";
    const res = await fetch(API_URL + q, { signal: ctrl.signal });
    clearTimeout(kill);
    if (!res.ok) {
      setApiStatus("err", "связь · ошибка " + res.status);
      await logLine("api " + res.status);
      return null;
    }
    const data = await res.json();
    const pc = (data.playlists || []).filter(Boolean).length;
    const tc = (data.tracks || []).filter(Boolean).length;
    setApiStatus("ok", "связь · online");
    await logLine("api 200 · pl " + pc + " · tr " + tc);
    if (key && (pc || tc)) cacheWrite(key, data);
    return data;
  } catch (e) {
    clearTimeout(kill);
    const timeout = e && e.name === "AbortError";
    setApiStatus("err", timeout ? "связь · таймаут, Render спит?" : "связь · offline");
    await logLine(timeout ? "api timeout" : "api offline");
    return null;
  }
}

async function generate() {
  if (busy || !btn) return;
  busy = true;
  btn.classList.add("is-busy");
  await logLines(["ignition", "scan band…"]);

  try {
    const genres = await loadGenres();
    await loadMeta();
    await logLine("table " + genres.length);
    const pool =
      activeFilter === "all" ? genres : filterPool(genres, activeFilter);
    const src = pool.length ? pool : genres;
    if (!src.length) {
      await logLine("ERR empty");
      if (genreOut) genreOut.textContent = "пусто";
      return;
    }
    const localGenre = src[Math.floor(Math.random() * src.length)];
    await logLine("probe " + localGenre);

    const data = await fetchApi(localGenre);
    const genre = (data && data.genre) || localGenre;
    lastGenre = genre;

    await logLine("LOCK: " + genre);
    renderResult(genre);
    renderPlaylists((data && data.playlists) || [], genre, !data);
    renderTracks(data, genre);
    await logLine("tracks · " + ((data && data.tracks) || []).filter(Boolean).length);
    pushHistory(genre);
    await logLine("done");
  } catch (err) {
    console.error(err);
    await logLine("ERR");
  } finally {
    busy = false;
    btn.classList.remove("is-busy");
  }
}

// tabs
document.querySelectorAll(".gx-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.getAttribute("data-panel");
    if (id) showPanel(id);
  });
});

// filters
document.getElementById("panel-filters")?.addEventListener("click", (e) => {
  const el = e.target.closest("[data-filter]");
  if (!el) return;
  setFilter(el.getAttribute("data-filter"));
});

// compass dirs if present
document.querySelectorAll("[data-compass]").forEach((el) => {
  el.addEventListener("click", () => {
    const key = el.getAttribute("data-compass");
    if (key) setFilter(key);
  });
});

btn?.addEventListener("click", generate);

document.getElementById("share-btn")?.addEventListener("click", async () => {
  const g = lastGenre || (genreOut && genreOut.textContent) || "";
  if (!g || g === "ожидание сигнала") return;
  try {
    await navigator.clipboard.writeText(g);
    await logLine("copied: " + g);
  } catch {
    prompt("Скопируй:", g);
  }
});

document.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key === "Enter") {
    e.preventDefault();
    generate();
  }
  const map = { "1": "desc", "2": "filters", "3": "playlists", "4": "tracks" };
  if (map[e.key]) showPanel(map[e.key]);
});

(async () => {
  if (signalLines) signalLines.innerHTML = "";
  setApiStatus("wait", "связь · прогрев сервера…");
  renderHistory();
  await logLines(["boot sequence", "load freq table", "open channel"]);
  fetch(API_HEALTH)
    .then((r) => {
      if (r.ok) {
        setApiStatus("ok", "связь · online");
        logLine("api warm");
      } else {
        setApiStatus("err", "связь · " + r.status);
        logLine("api " + r.status);
      }
    })
    .catch(() => {
      setApiStatus("err", "связь · Render спит, первый запрос долгий");
      logLine("api sleep");
    });
  const genres = await loadGenres();
  await logLine("ether " + genres.length);
  fillEther(genres);
  try {
    const saved = localStorage.getItem(FILTER_KEY);
    if (saved) setFilter(saved);
  } catch (_) {}
  const q = new URLSearchParams(location.search).get("genre");
  if (q) {
    lastGenre = q;
    renderResult(q);
    const cached = cacheRead(q.toLowerCase());
    if (cached) {
      renderPlaylists(cached.playlists || [], q, false);
      renderTracks(cached, q);
    }
    await logLine("deep link: " + q);
  }
  await logLines(["standby", "ready"]);
})();
