// Генератор: плавный журнал + живые описания без копипасты
const btn = document.getElementById("generate-btn");
const genreOut = document.getElementById("genre-out");
const genreType = document.getElementById("genre-type");
const genreFilter = document.getElementById("genre-filter");
const genreDesc = document.getElementById("genre-desc");
const filtersEl = document.getElementById("gen-filters");
const signalLines = document.getElementById("signal-lines");
const etherTrack = document.getElementById("ether-track");

const API_URL = "https://farside-hkic.onrender.com/api/random";

const FILTERS = {
  all: null,
  calm: ["ambient", "chill", "lo-fi", "lofi", "acoustic", "soft", "sleep", "piano", "classical", "jazz", "bossa", "new age", "meditation", "relax", "downtempo", "dream pop", "mellow", "soul"],
  folk: ["folk", "country", "americana", "bluegrass", "celtic", "singer-songwriter", "roots", "banjo", "indie folk", "traditional", "sierreno", "corrido", "ranchera", "norteno", "americana"],
  energy: ["edm", "dance", "techno", "house", "drum and bass", "dnb", "metal", "punk", "hardcore", "trance", "dubstep", "hardstyle", "hard rock"],
  dark: ["dark", "black metal", "gothic", "industrial", "doom", "witch", "horror", "drone", "funeral", "coldwave", "blackgaze"],
  latin: ["latin", "reggaeton", "salsa", "cumbia", "brazilian", "spanish", "corrido", "sierreno", "bachata", "urbano", "mexican", "tango", "norteno", "ranchera", "arrocha", "musica mexicana"],
  electronic: ["electronic", "techno", "house", "synth", "electro", "idm", "breakbeat", "garage", "minimal", "acid", "synthwave", "wave"],
  rock: ["rock", "metal", "punk", "grunge", "alternative", "indie rock", "hard rock", "progressive", "post-rock", "shoegaze"],
  hiphop: ["hip hop", "hip-hop", "rap", "trap", "drill", "boom bap", "gangster", "grime"],
  pop: ["pop", "k-pop", "j-pop", "synthpop", "electropop", "dance pop", "indie pop", "art pop"],
};

const FILTER_LABELS = {
  all: "все",
  calm: "спокойное",
  folk: "народные",
  energy: "энергия",
  dark: "тёмное",
  latin: "латина",
  electronic: "электроника",
  rock: "рок",
  hiphop: "хип-хоп",
  pop: "поп",
};

/** Лексика и крюки по семьям — не один абзац, а пулы фраз */
const FAMILY = {
  calm: {
    label: "спокойное",
    texture: ["воздушные пэды", "мягкий пульс", "приглушённый бит", "акустическая теплота", "длинные хвосты реверба"],
    mood: ["для фона и глубокого слушания", "без давления на хук", "когда не нужна драка за внимание", "ночной и комнатный"],
    scene: ["lounge и bedroom-электроника", "post-club downtempo", "modern classical / ambient край"],
  },
  folk: {
    label: "народные",
    texture: ["живые струны", "голос близко к микрофону", "простые куплеты", "корневой groove", "акустика без глянца"],
    mood: ["про место и людей", "про дорогу и память", "честнее, чем поп-формула"],
    scene: ["локальные традиции", "singer-songwriter сцены", "региональные корни в стриминге"],
  },
  energy: {
    label: "энергия",
    texture: ["жёсткий бит", "плотный низ", "резкий транзит", "гитарный или синтетический удар"],
    mood: ["тело вперёд", "peak-time", "без полутонов"],
    scene: ["фестивали и клубный пол", "интернет-рейв", "тяжёлые гитарные сцены"],
  },
  dark: {
    label: "тёмное",
    texture: ["холодный тембр", "низкие гармонии", "дроун и давление", "ночная окраска"],
    mood: ["настроение важнее хука", "тяжесть без обязательного танца"],
    scene: ["underground nocturnal", "post-industrial / gothic ветви", "black и doom окраины"],
  },
  latin: {
    label: "латина",
    texture: ["синкопы", "тёплый вокал", "танцевальный groove", "перкуссия и бас в диалоге"],
    mood: ["тело и текст вместе", "уличный и праздничный"],
    scene: ["латиноамериканские и ibero-сцены", "regional mexican и urbano", "глобальный latin-стриминг"],
  },
  electronic: {
    label: "электроника",
    texture: ["машинный ритм", "синтезаторный рельеф", "саунд-дизайн", "повтор и мутация лупа"],
    mood: ["от танцпола до наушников", "формула может быть гипнотической"],
    scene: ["лейблы и клубные этажи", "онлайн-микросцены", "рейв-наследie"],
  },
  rock: {
    label: "рок",
    texture: ["гитары в центре", "живой драйв", "куплет–припев или длинная форма", "ударные как каркас"],
    mood: ["прямолинейный жест", "иногда эпос, иногда гаражная грязь"],
    scene: ["альтернатива и инди", "метал-ветви", "классический рок-канон"],
  },
  hiphop: {
    label: "хип-хоп",
    texture: ["бит и флоу", "808 или сэмпл", "вокал как главный инструмент", "пространство для текста"],
    mood: ["от повествования до гимнового хука", "локальный акцент важен"],
    scene: ["региональные сцены", "trap / drill / boom bap ветви", "глобальный rap-мейнстрим"],
  },
  pop: {
    label: "поп",
    texture: ["яркий хук", "чистый вокал", "полированный ритм", "форма «запомнить сразу»"],
    mood: ["максимальная считываемость", "эмоция крупным планом"],
    scene: ["радио и плейлистный мейнстрим", "idol и internet-pop", "бесконечные микро-мутации"],
  },
  default: {
    label: "микро-жанр",
    texture: ["узкий тембровый профиль", "свой ритмический почерк", "смесь сцены и алгоритма"],
    mood: ["для тех, кто уже слышал соседей", "ярлык-уточнение, не большая клетка"],
    scene: ["плейлистная экономика Spotify", "онлайн-гибриды", "региональные и нишевые полки"],
  },
};

// дополнительные крюки по отдельным словам в названии
const TOKEN_HINTS = {
  trap: "упор на 808 и современный rap-каркас",
  house: "четыре четверти и клубная ровность",
  techno: "гипнотический повтор и складской вайб",
  punk: "коротко, зло, без лишнего лоска",
  jazz: "импровизационный воздух и гармония богаче поп-сетки",
  soul: "вокал и groove из r&b-крови",
  folk: "корневая простота и рассказ",
  indie: "чуть в стороне от мейнстрим-глянца",
  dark: "ночная, тяжёлая окраска",
  sad: "меланхолия как главный фильтр",
  acoustic: "дерево и воздух вместо стены синтезаторов",
  piano: "клавиши как центр истории",
  wave: "синт-волна и ретро-футуризм",
  drill: "скользящие слайды и холодный UK/глобальный тон",
  metal: "искажение, вес, иногда скорость",
  pop: "хук и доступность",
  rock: "гитарный позвоночник",
  rap: "текст и флоу на первом плане",
  ambient: "пространство важнее удара",
  lo: "шероховатость и камерность",
  lofi: "шероховатость и камерность",
  country: "истории с дороги и крыльца",
  mexican: "мексиканский региональный корень",
  latina: "латиноамериканский пульс",
  latino: "латиноамериканский пульс",
  brazilian: "бразильский ритмический код",
  german: "немецкая сцена в названии",
  french: "французский след в сцене",
  uk: "британский акцент сцены",
  korean: "корейская pop/idol экосистема",
  japanese: "японская сцена и idol/city-pop окраины",
  progressive: "длиннее форма, сложнее гармония",
  alternative: "в стороне от жёсткого мейнстрима",
  classic: "опора на канон прошлых десятилетий",
  modern: "современная продюсерская рамка",
  viral: "заточено под короткий интернет-цикл",
  underground: "ниже радарного мейнстрима",
};

let activeFilter = "all";
let allGenres = null;
let t0 = Date.now();
let logQueue = Promise.resolve();
const LOG_GAP = 140;
const LOG_MAX = 18;
let genresMeta = null;

filtersEl?.addEventListener("click", (e) => {
  const f = e.target.closest("[data-filter]");
  if (!f) return;
  activeFilter = f.getAttribute("data-filter") || "all";
  filtersEl.querySelectorAll(".gx-filter").forEach((b) => {
    b.classList.toggle("is-active", b === f);
  });
  logLine("set filter " + activeFilter);
  logLine("rebuild pool…");
  if (genreFilter) {
    genreFilter.textContent = "фильтр · " + (FILTER_LABELS[activeFilter] || activeFilter);
  }
});

document.querySelectorAll(".gx-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    showPanel(tab.getAttribute("data-panel"));
    logLine("panel → " + tab.getAttribute("data-panel"));
  });
});

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

function elapsed() {
  const s = Math.floor((Date.now() - t0) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return "T+" + mm + ":" + ss;
}

function logLine(text) {
  logQueue = logQueue.then(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          if (!signalLines) return resolve();
          const li = document.createElement("li");
          li.className = "gx-log-in";
          li.innerHTML = '<span class="gx-log-t">' + elapsed() + "</span> " + text;
          signalLines.appendChild(li);
          while (signalLines.children.length > LOG_MAX) {
            signalLines.removeChild(signalLines.firstChild);
          }
          const box = signalLines.parentElement;
          if (box) box.scrollTop = box.scrollHeight;
          requestAnimationFrame(() => li.classList.add("is-on"));
          resolve();
        }, LOG_GAP);
      })
  );
  return logQueue;
}

async function logLines(lines) {
  for (const line of lines) await logLine(line);
}

async function loadGenres() {
  if (allGenres) return allGenres;
  try {
    const res = await fetch("genres.txt");
    const text = await res.text();
    allGenres = text.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    allGenres = [];
  }
  return allGenres;
}

async function loadGenresMeta() {
  if (genresMeta !== null) return genresMeta;
  try {
    const res = await fetch("genres.json");
    if (res.ok) {
      genresMeta = await res.json();
      return genresMeta;
    }
  } catch (_) {}
  genresMeta = {};
  return genresMeta;
}

function fillEther(list) {
  if (!etherTrack || !list.length) return;
  const pick = [];
  for (let i = 0; i < 24; i++) {
    pick.push(list[Math.floor(Math.random() * list.length)]);
  }
  etherTrack.innerHTML = pick.concat(pick).map((g) => "<span>" + g + "</span>").join("");
}

function filterGenres(list, key) {
  const words = FILTERS[key];
  if (!words || key === "all") return list;
  return list.filter((g) => {
    const low = g.toLowerCase();
    return words.some((w) => low.includes(w));
  });
}

function pickRandom(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** Стабильный «рандом» от строки — один жанр = один текст */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickHashed(arr, seed, salt) {
  if (!arr || !arr.length) return "";
  const h = hashStr(String(seed) + "|" + String(salt));
  return arr[h % arr.length];
}

function tokensOf(genre) {
  return String(genre)
    .toLowerCase()
    .replace(/[&/+,._]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function detectFamily(genre) {
  const g = (genre || "").toLowerCase();
  // более длинные ключи раньше
  const keys = Object.keys(FILTERS).filter((k) => k !== "all");
  let best = "default";
  let bestLen = 0;
  for (const key of keys) {
    for (const w of FILTERS[key]) {
      if (g.includes(w) && w.length >= bestLen) {
        best = key;
        bestLen = w.length;
      }
    }
  }
  return best;
}

function tokenHintsFor(genre) {
  const toks = tokensOf(genre);
  const hints = [];
  for (const t of toks) {
    if (TOKEN_HINTS[t]) hints.push(TOKEN_HINTS[t]);
    // частичные
    for (const [k, v] of Object.entries(TOKEN_HINTS)) {
      if (k.length > 3 && t.includes(k) && !hints.includes(v)) hints.push(v);
    }
  }
  // unique
  return [...new Set(hints)].slice(0, 2);
}

function buildDescription(genre) {
  const name = genre || "unknown";
  const meta = genresMeta && (genresMeta[name] || genresMeta[name.toLowerCase()]);

  if (meta && meta.blurb) {
    let html =
      "<p class=\"gx-desc-lead\"><strong>" +
      name +
      "</strong> — " +
      meta.blurb +
      "</p>";
    if (meta.origin) {
      html +=
        "<p><span class=\"gx-desc-label\">Откуда.</span> " + meta.origin + "</p>";
    }
    if (meta.regions && meta.regions.length) {
      html +=
        "<p><span class=\"gx-desc-label\">Где звучит.</span> " +
        meta.regions.join(", ") +
        "</p>";
    }
    if (meta.sound) {
      html +=
        "<p><span class=\"gx-desc-label\">Звук.</span> " + meta.sound + "</p>";
    }
    html += "<p class=\"gx-result-muted\">FARSIDE · карточка из genres.json</p>";
    return html;
  }

  const family = detectFamily(name);
  const pack = FAMILY[family] || FAMILY.default;
  const seed = name.toLowerCase();
  const toks = tokensOf(name);
  const hints = tokenHintsFor(name);

  const texture = pickHashed(pack.texture, seed, "tex");
  const mood = pickHashed(pack.mood, seed, "mood");
  const scene = pickHashed(pack.scene, seed, "scene");

  const openers = [
    "<strong>" + name + "</strong> — микро-ярлык Spotify в зоне «" + pack.label + "».",
    "Под тегом <strong>" + name + "</strong> алгоритм держит узкую полку внутри «" + pack.label + "».",
    "<strong>" + name + "</strong> не большая клетка, а уточнение внутри поля «" + pack.label + "».",
    "Когда в плейлисте вспыхивает <strong>" + name + "</strong>, это сигнал: трек ближе к «" + pack.label + "», чем к соседям.",
  ];

  const soundLines = [
    "В звуке часто слышны " + texture + " — " + mood + ".",
    "Опора на " + texture + "; настроение " + mood + ".",
    "Характер держат " + texture + ".",
  ];

  if (hints.length) {
    soundLines.push("В самом названии уже зашито: " + hints.join("; ") + ".");
  }

  const originLines = [
    "Сцена: " + scene + ".",
    "Фон: " + scene + " — отсюда и узкий ярлык.",
    "Корень скорее в том, как " + scene + " режется на микро-полки в стриминге.",
  ];

  const tokenLine =
    toks.length > 1
      ? "Слова в ярлыке («" +
        toks.slice(0, 4).join("», «") +
        "») сами подсказывают, от чего жанр отпочковался."
      : "";

  const listenLines = [
    "Имеет смысл открыть плейлисты по точному тегу и рядом послушать соседей из эфира слева.",
    "Стартуй с плейлистов с этим именем; если пусто — шаг назад к более широкой семье «" + pack.label + "».",
    "Слушай не один трек, а пачку под тегом: микро-жанр раскрывается рядом, не в одиночку.",
  ];

  const opener = pickHashed(openers, seed, "op");
  const sound = pickHashed(soundLines, seed, "snd");
  const origin = pickHashed(originLines, seed, "org");
  const listen = pickHashed(listenLines, seed, "lst");

  // иногда другой порядок блоков — меньше ощущения «один шаблон»
  const layout = hashStr(seed + "|lay") % 3;

  let body = "<p class=\"gx-desc-lead\">" + opener + "</p>";

  if (layout === 0) {
    body += "<p><span class=\"gx-desc-label\">Звук.</span> " + sound + "</p>";
    if (tokenLine) body += "<p>" + tokenLine + "</p>";
    body += "<p><span class=\"gx-desc-label\">Откуда.</span> " + origin + "</p>";
    body += "<p><span class=\"gx-desc-label\">Куда слушать.</span> " + listen + "</p>";
  } else if (layout === 1) {
    body += "<p><span class=\"gx-desc-label\">Откуда.</span> " + origin + "</p>";
    body += "<p><span class=\"gx-desc-label\">Звук.</span> " + sound + "</p>";
    body += "<p><span class=\"gx-desc-label\">Куда слушать.</span> " + listen + "</p>";
    if (tokenLine) body += "<p class=\"gx-result-muted\">" + tokenLine + "</p>";
  } else {
    if (tokenLine) body += "<p>" + tokenLine + "</p>";
    body += "<p><span class=\"gx-desc-label\">Звук.</span> " + sound + "</p>";
    body += "<p><span class=\"gx-desc-label\">Куда слушать.</span> " + listen + "</p>";
    body += "<p><span class=\"gx-desc-label\">Откуда.</span> " + origin + "</p>";
  }

  body +=
    "<p class=\"gx-result-muted\">FARSIDE · собрано из ярлыка «" +
    name +
    "» · семья «" +
    pack.label +
    "»</p>";

  return body;
}

function renderResult(genre) {
  const family = detectFamily(genre);
  const label = (FAMILY[family] || FAMILY.default).label;
  if (genreOut) {
    genreOut.textContent = genre;
    requestAnimationFrame(() => genreOut.classList.add("is-in"));
  }
  if (genreType) genreType.textContent = "тип · " + label;
  if (genreFilter) {
    genreFilter.textContent =
      "фильтр · " + (FILTER_LABELS[activeFilter] || activeFilter);
  }
  if (genreDesc) genreDesc.innerHTML = buildDescription(genre);
  showPanel("desc");
}

btn?.addEventListener("click", async () => {
  btn.disabled = true;
  btn.classList.add("is-busy");
  await logLines(["ignition", "scan band…"]);
  if (genreOut) {
    genreOut.textContent = "…";
    genreOut.classList.remove("is-in");
  }

  try {
    await loadGenresMeta();
    const genres = await loadGenres();
    await logLine("table " + genres.length + " rows");
    const pool = filterGenres(genres, activeFilter);
    await logLine("pool size " + (pool.length || genres.length));
    const localGenre = pickRandom(pool);

    if (!localGenre && activeFilter !== "all") {
      await logLine("ERR empty pool");
      if (genreOut) genreOut.textContent = "пусто";
      return;
    }

    await logLine("probe " + (localGenre || "random"));
    await logLine("handshake api");

    let data = null;
    try {
      const q = localGenre ? "?genre=" + encodeURIComponent(localGenre) : "";
      const response = await fetch(API_URL + q);
      if (response.ok) {
        data = await response.json();
        await logLine("api 200");
      } else await logLine("api " + response.status);
    } catch (_) {
      await logLine("api offline — local lock");
    }

    let genre = (data && data.genre) || localGenre;
    if (localGenre && activeFilter !== "all") {
      if (!filterGenres([genre], activeFilter).length) genre = localGenre;
    }

    if (!genre) {
      await logLine("ERR no lock");
      if (genreOut) genreOut.textContent = "нет сигнала";
      return;
    }

    await logLines(["sync buffers", "LOCK: " + genre, "write desc panel"]);
    renderResult(genre);
    await logLine("done");
  } catch (err) {
    await logLine("ERR exception");
    console.error(err);
    if (genreOut) genreOut.textContent = "ошибка";
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-busy");
  }
});

(async () => {
  if (signalLines) signalLines.innerHTML = "";
  await logLines(["boot sequence", "load freq table", "open channel", "ether link ok"]);
  await loadGenresMeta();
  const genres = await loadGenres();
  await logLine("ether " + (genres.length || 0) + " tags");
  fillEther(genres.length ? genres : ["ambient", "sierreno", "synthwave"]);
  await logLines(["standby", "awaiting launch", "ready"]);
})();
