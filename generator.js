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
  folk: ["folk", "country", "americana", "bluegrass", "celtic", "singer-songwriter", "roots", "banjo", "indie folk", "traditional", "sierreno", "corrido", "ranchera", "norteno"],
  energy: ["edm", "dance", "techno", "house", "drum and bass", "dnb", "metal", "punk", "hardcore", "trance", "dubstep", "hardstyle", "hard rock"],
  dark: ["dark", "black metal", "gothic", "industrial", "doom", "witch", "horror", "drone", "funeral", "coldwave", "blackgaze"],
  latin: ["latin", "reggaeton", "salsa", "cumbia", "brazilian", "spanish", "corrido", "sierreno", "bachata", "urbano", "mexican", "tango", "norteno", "ranchera", "arrocha", "musica mexicana"],
  electronic: ["electronic", "techno", "house", "synth", "electro", "idm", "breakbeat", "garage", "minimal", "acid", "synthwave", "wave"],
  rock: ["rock", "metal", "punk", "grunge", "alternative", "indie rock", "hard rock", "progressive", "post-rock", "shoegaze"],
  hiphop: ["hip hop", "hip-hop", "rap", "trap", "drill", "boom bap", "gangster", "grime"],
  pop: ["pop", "k-pop", "j-pop", "synthpop", "electropop", "dance pop", "indie pop", "art pop"],
  jazz: ["jazz", "soul", "funk", "neo soul", "bebop", "swing", "bossa"],
  metal: ["metal", "death", "black metal", "doom", "thrash", "core", "djent"],
  soft: ["soft", "mellow", "acoustic", "gentle", "quiet", "chamber", "lullaby"],
  heavy: ["heavy", "hard", "metal", "hardcore", "death", "power", "slam"],
  punk: ["punk", "hardcore", "post-punk", "pop punk", "ska punk", "crust"],
  rnb: ["r&b", "rnb", "rhythm and blues", "neo soul", "soul"],
  classical: ["classical", "orchestra", "baroque", "opera", "chamber"],
  sad: ["sad", "melancholy", "triste", "emo", "screamo", "heartbreak"],
  party: ["party", "dance", "club", "edits", "mashup", "viral"],
  focus: ["focus", "study", "concentration", "piano", "ambient", "lo-fi", "lofi", "coding"],
  indie: ["indie", "alternative", "diy"],
  deep: ["deep", "dub", "minimal"],
  progressive: ["progressive", "prog"],
  classic_era: ["classic", "old school", "traditional", "vintage", "retro"],
  modern_era: ["modern", "contemporary"],
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
  jazz: "джаз / соул",
  metal: "метал",
  soft: "мягкое",
  heavy: "тяжёлое",
  night: "ночь",
  heat: "жара",
  short: "короткие",
  long: "длинные",
  compound: "составные",
  single: "одно слово",
  numeric: "с цифрами",
  regional: "регион",
  latam: "latam",
  asia: "азия",
  europe: "европа",
  africa: "африка",
  online: "онлайн-сцены",
  carded: "с карточкой",
  rare: "редкие буквы",
  punk: "панк",
  rnb: "r&b",
  classical: "классика",
  sad: "грустное",
  party: "вечеринка",
  focus: "фокус",
  us: "us",
  uk: "uk",
  brazil: "brazil",
  classic_era: "classic",
  modern_era: "modern",
  indie: "indie",
  deep: "deep",
  progressive: "progressive",
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
let lastGenre = null;
let lastPayload = null;
const FILTER_KEY = "farside-gen-filter";
let allGenres = null;
let t0 = Date.now();
let logQueue = Promise.resolve();
const LOG_GAP = 140;
const LOG_MAX = 18;
let genresMeta = null;


const COMPASS_ANGLE = {
  calm: 0,
  heat: 90,
  energy: 180,
  dark: 270,
  soft: 45,
  latin: 135,
  folk: 225,
  night: 315,
  all: 0,
};

function labelFor(key) {
  return FILTER_LABELS[key] || key;
}

function setFilter(key) {
  activeFilter = key || "all";
  const root = document.getElementById("panel-filters") || document;

  root.querySelectorAll(".gx-filter[data-filter]").forEach((b) => {
    b.classList.toggle("is-active", b.getAttribute("data-filter") === activeFilter);
  });
  root.querySelectorAll(".gx-c-dir").forEach((b) => {
    b.classList.toggle("is-active", b.getAttribute("data-compass") === activeFilter);
  });

  const needle = document.getElementById("compass-needle");
  const core = document.getElementById("compass-core");
  const readout = document.getElementById("compass-readout");
  const ang = COMPASS_ANGLE[activeFilter];
  if (needle && ang !== undefined) {
    needle.style.transform = "rotate(" + ang + "deg)";
  }
  if (core) core.textContent = activeFilter === "all" ? "ALL" : activeFilter.slice(0, 4).toUpperCase();
  if (readout) readout.textContent = "курс · " + labelFor(activeFilter);
  if (genreFilter) genreFilter.textContent = "фильтр · " + labelFor(activeFilter);

  try { localStorage.setItem(FILTER_KEY, activeFilter); } catch (_) {}
  logLine("set filter " + activeFilter);
  logLine("rebuild pool…");
}

document.getElementById("panel-filters")?.addEventListener("click", (e) => {
  const chip = e.target.closest(".gx-filter[data-filter]");
  if (chip) {
    setFilter(chip.getAttribute("data-filter") || "all");
    return;
  }
  const dir = e.target.closest("[data-compass]");
  if (dir) {
    setFilter(dir.getAttribute("data-compass") || "all");
    return;
  }
  if (e.target.closest("#compass-core")) {
    setFilter("all");
  }
});



/* —— Interactive genre map —— */
const REGION_META = {
  na:  { id: "na",  label: "Северная Америка", en: "North America" },
  sa:  { id: "sa",  label: "Южная Америка",   en: "South America" },
  eu:  { id: "eu",  label: "Европа",          en: "Europe" },
  af:  { id: "af",  label: "Африка",          en: "Africa" },
  me:  { id: "me",  label: "Ближний Восток",  en: "Middle East" },
  sas: { id: "sas", label: "Южная Азия",      en: "South Asia" },
  eas: { id: "eas", label: "Восточная Азия",  en: "East Asia" },
  sea: { id: "sea", label: "Юго-Восточная Азия", en: "Southeast Asia" },
  oc:  { id: "oc",  label: "Океания",         en: "Oceania" },
};

const REGION_CENTERS = {
  na: [200, 160], sa: [280, 360], eu: [500, 120], af: [510, 280],
  me: [580, 180], sas: [680, 240], eas: [780, 150], sea: [760, 270], oc: [820, 370],
};

const TOKEN_REGIONS = [
  [/k-?pop|korean|seoul/i, ["eas"], "eas"],
  [/j-?pop|japanese|tokyo|city pop|shibuya/i, ["eas"], "eas"],
  [/c-?pop|mandopop|cantopop|chinese/i, ["eas"], "eas"],
  [/thai|vietnam|indo|malay|pilipino|opm|gamelan/i, ["sea"], "sea"],
  [/bollywood|bhangra|indian|tamil|punjabi/i, ["sas"], "sas"],
  [/arabic|maghreb|rai|egyptian|levant/i, ["me", "af"], "me"],
  [/afrobeats|afrobeat|amapiano|naija|ghana|soukous|highlife/i, ["af"], "af"],
  [/reggaeton|latin|salsa|cumbia|bachata|corrido|sierreno|ranchera|norteno|urbano|mexican|tango|arrocha/i, ["sa", "na"], "sa"],
  [/brazilian|bossa|samba|forro|funk carioca|sertanejo/i, ["sa"], "sa"],
  [/francoton|french|chanson/i, ["eu"], "eu"],
  [/uk |british|grime|britpop|london/i, ["eu"], "eu"],
  [/german|deutsch|schlager|teutonic/i, ["eu"], "eu"],
  [/nordic|swedish|norwegian|danish|iceland|finnish/i, ["eu"], "eu"],
  [/russian|slavic|polish|balkan|turbo-folk/i, ["eu"], "eu"],
  [/ukrainian|ukraine/i, ["eu"], "eu"],
  [/celtic|irish|scottish|welsh/i, ["eu"], "eu"],
  [/americana|nashville|memphis|detroit|chicago|philly|texas|southern hip/i, ["na"], "na"],
  [/hip hop|hip-hop|trap|drill|boom bap/i, ["na"], "na"],
  [/country|bluegrass|folk/i, ["na", "eu"], "na"],
  [/reggae|dancehall|ska|dub\b/i, ["na", "sa"], "na"],
  [/techno|trance|hardstyle|gabber/i, ["eu"], "eu"],
  [/synthwave|outrun|retrowave/i, ["na", "eu"], "na"],
  [/aboriginal|aussie|kiwi|maori/i, ["oc"], "oc"],
  [/global|worldwide|international/i, ["na"], "na"],
];


const COUNTRY_HINTS = [
  [/k-?pop|korean|seoul/i, "Южная Корея"],
  [/j-?pop|japanese|tokyo|city pop|shibuya|kayokyoku/i, "Япония"],
  [/c-?pop|mandopop|cantopop|chinese/i, "Китай"],
  [/bollywood|bhangra|tamil|punjabi|indian/i, "Индия"],
  [/thai|luk thung|molam/i, "Таиланд"],
  [/vietnam|v-pop/i, "Вьетнам"],
  [/indo |dangdut|javanese/i, "Индонезия"],
  [/opm|pilipino|tagalog/i, "Филиппины"],
  [/afrobeats|afrobeat|naija/i, "Нигерия"],
  [/amapiano/i, "ЮАР"],
  [/highlife|ghana/i, "Гана"],
  [/rai|chaabi/i, "Алжир"],
  [/egyptian|mahraganat/i, "Египет"],
  [/reggaeton|urbano latino/i, "Пуэрто-Рико"],
  [/corrido|sierreno|ranchera|norteno|musica mexicana/i, "Мексика"],
  [/samba|bossa|forro|sertanejo|funk carioca|brazilian/i, "Бразилия"],
  [/tango/i, "Аргентина"],
  [/cumbia/i, "Колумбия"],
  [/francoton|french|chanson/i, "Франция"],
  [/grime|britpop|uk garage|uk drill/i, "Великобритания"],
  [/schlager|deutsch|german/i, "Германия"],
  [/italo|canzone/i, "Италия"],
  [/fado/i, "Португалия"],
  [/flamenco/i, "Испания"],
  [/celtic|irish/i, "Ирландия"],
  [/nordic|swedish|norwegian|danish|iceland|finnish/i, "Скандинавия"],
  [/russian|russian doomer|hardbass/i, "Россия"],
  [/ukrainian|ukraine|україн/i, "Украина"],
  [/polish|poland/i, "Польша"],
  [/turkish|turkce|turkey/i, "Турция"],
  [/greek|greece/i, "Греция"],
  [/balkan|turbo-folk/i, "Балканы"],
  [/detroit techno|motown|memphis|nashville|chicago house|philly soul|texas|americana/i, "США"],
  [/hip hop|hip-hop|trap|drill|boom bap/i, "США"],
  [/reggae|dancehall/i, "Ямайка"],
  [/synthwave|outrun/i, "США"],
  [/techno/i, "Германия"],
  [/trance/i, "Нидерланды"],
  [/aussie|aboriginal/i, "Австралия"],
  [/kiwi|maori/i, "Новая Зеландия"],
];

function detectOriginCountry(genre, card) {
  const name = String(genre || "");
  const low = name.toLowerCase();
  if (card && card.country && String(card.country).length < 40) {
    return String(card.country);
  }
  for (const [re, country] of COUNTRY_HINTS) {
    if (re.test(low)) return country;
  }
  // short origin only if it looks like a place, not a sentence
  if (card && card.origin) {
    const o = String(card.origin).trim();
    if (o.length < 28 && !/[.!?]/.test(o) && !/индустр|стрим|традиц|сцен/i.test(o)) return o;
  }
  const fam = detectFamily(name);
  const soft = {
    latin: "Латинская Америка",
    hiphop: "США",
    electronic: "Европа",
    rock: "США / Великобритания",
    metal: "Великобритания",
    pop: "США",
    jazz: "США",
    folk: "разные страны",
    classical: "Европа",
    default: "неизвестно",
  };
  return soft[fam] || soft.default;
}

function normalizeRegionName(r) {
  const s = String(r || "").toLowerCase();
  if (/global|world|worldwide|international|stream/.test(s)) return null;
  if (/north america|us\b|usa|canada|mexico|american/.test(s)) return "na";
  if (/south america|brazil|argentina|colombia|peru|chile|latin america/.test(s)) return "sa";
  if (/europe|uk|britain|france|germany|sweden|norway|spain|italy|russia|poland/.test(s)) return "eu";
  if (/africa|nigeria|ghana|kenya|south africa/.test(s)) return "af";
  if (/middle east|arab|iran|turkey|israel|lebanon/.test(s)) return "me";
  if (/south asia|india|pakistan|bangladesh/.test(s)) return "sas";
  if (/east asia|japan|korea|china|taiwan/.test(s)) return "eas";
  if (/southeast asia|indonesia|thailand|vietnam|philippines|malaysia/.test(s)) return "sea";
  if (/oceania|australia|new zealand|pacific/.test(s)) return "oc";
  return null;
}


const REGION_FOCUS = {
  na:  { x: 40,  y: 20,  w: 340, h: 320 },
  sa:  { x: 180, y: 240, w: 220, h: 260 },
  eu:  { x: 420, y: 40,  w: 220, h: 200 },
  af:  { x: 420, y: 140, w: 240, h: 280 },
  me:  { x: 520, y: 120, w: 180, h: 160 },
  sas: { x: 620, y: 160, w: 180, h: 180 },
  eas: { x: 680, y: 40,  w: 260, h: 220 },
  sea: { x: 700, y: 180, w: 220, h: 180 },
  oc:  { x: 740, y: 280, w: 220, h: 180 },
};

const MAP_WORLD = { x: -20, y: -10, w: 990, h: 500 };
let mapZoomTimer = null;

function setMapView(box, animate) {
  const svg = document.getElementById("genre-map");
  if (!svg || !box) return;
  const target = box.x + " " + box.y + " " + box.w + " " + box.h;
  if (!animate) {
    svg.setAttribute("viewBox", target);
    return;
  }
  const cur = (svg.getAttribute("viewBox") || "0 0 950 500").split(/\s+/).map(Number);
  const from = { x: cur[0], y: cur[1], w: cur[2], h: cur[3] };
  const t0 = performance.now();
  const dur = 700;
  if (mapZoomTimer) cancelAnimationFrame(mapZoomTimer);
  function frame(now) {
    const p = Math.min(1, (now - t0) / dur);
    const e = p < 0.5 ? 2*p*p : -1+(4-2*p)*p; // ease in-out
    const x = from.x + (box.x - from.x) * e;
    const y = from.y + (box.y - from.y) * e;
    const w = from.w + (box.w - from.w) * e;
    const h = from.h + (box.h - from.h) * e;
    svg.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
    if (p < 1) mapZoomTimer = requestAnimationFrame(frame);
  }
  mapZoomTimer = requestAnimationFrame(frame);
}

function focusMapOnRegions(origin, spread) {
  const ids = [];
  if (origin) ids.push(origin);
  (spread || []).forEach((id) => { if (!ids.includes(id)) ids.push(id); });
  if (!ids.length) {
    setMapView(MAP_WORLD, true);
    return;
  }
  let minX=9999, minY=9999, maxX=-9999, maxY=-9999;
  ids.forEach((id) => {
    const b = REGION_FOCUS[id];
    if (!b) return;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  });
  if (minX > 9000) {
    setMapView(MAP_WORLD, true);
    return;
  }
  const pad = 36;
  setMapView({
    x: minX - pad,
    y: minY - pad,
    w: (maxX - minX) + pad * 2,
    h: (maxY - minY) + pad * 2,
  }, true);
}

function detectMapRegions(genre) {
  const name = String(genre || "");
  const low = name.toLowerCase();
  const spread = new Set();
  let origin = null;

  const card = genresMeta && (genresMeta[low] || genresMeta[name]);
  if (card) {
    if (card.country) {
      const o = normalizeRegionName(card.country) || normalizeRegionName(String(card.origin || ""));
      if (o) origin = o;
    }
    if (Array.isArray(card.regions)) {
      card.regions.forEach((r) => {
        const id = normalizeRegionName(r);
        if (id) spread.add(id);
      });
    }
    if (!origin && card.origin) {
      const o = normalizeRegionName(card.origin);
      if (o) origin = o;
    }
  }

  for (const [re, zones, ori] of TOKEN_REGIONS) {
    if (re.test(low)) {
      if (!origin) origin = ori;
      // only add zones from the FIRST matching token rule
      zones.forEach((z) => spread.add(z));
      break;
    }
  }

  // family fallback — ONE origin region only, no continent painting
  if (!origin) {
    const fam = detectFamily(name);
    const famOrigin = {
      latin: "sa",
      hiphop: "na",
      electronic: "eu",
      rock: "na",
      metal: "eu",
      pop: "na",
      jazz: "na",
      folk: "na",
      classical: "eu",
      reggae: "na",
      blues: "na",
      rnb: "na",
      punk: "na",
      world: "af",
      default: null,
    };
    origin = famOrigin[fam] || famOrigin.default;
  }

  if (origin) spread.add(origin);

  // keep at most origin + 2 spread (drop extras)
  let list = [...spread];
  if (origin && list.includes(origin)) {
    list = [origin, ...list.filter((id) => id !== origin)];
  }
  list = list.slice(0, 3);

  return { origin, spread: list, card };
}

function renderMap(genre) {
  const title = document.getElementById("map-genre-title");
  const originEl = document.getElementById("map-origin");
  const countryEl = document.getElementById("map-country");
  const zonesEl = document.getElementById("map-zones");
  const readout = document.getElementById("map-readout");
  const chips = document.getElementById("map-chips");
  const hot = document.getElementById("map-hotspots");
  const bars = document.getElementById("map-bars");
  const soundEl = document.getElementById("map-sound");
  const svg = document.getElementById("genre-map");
  if (!svg) return;

  const g = genre || lastGenre || "";
  if (title) title.textContent = g || "—";

  if (!g || g === "ожидание сигнала" || g === "…" || g === "—") {
    if (originEl) originEl.textContent = "—";
    if (countryEl) countryEl.textContent = "—";
    if (zonesEl) zonesEl.innerHTML = "";
    if (chips) chips.innerHTML = "";
    if (bars) bars.innerHTML = "";
    if (soundEl) soundEl.textContent = "—";
    if (readout) readout.textContent = "Сначала сгенерируй жанр.";
    svg.querySelectorAll(".gx-map-region").forEach((p) => {
      p.classList.remove("is-origin", "is-spread", "is-dim");
    });
    if (hot) hot.innerHTML = "";
    return;
  }

  const { origin, spread, card } = detectMapRegions(g);
  const lang = localStorage.getItem("farside-lang") || "ru";
  const fam = detectFamily(g);
  const country = detectOriginCountry(g, card);

  svg.querySelectorAll(".gx-map-region").forEach((p) => {
    const id = p.getAttribute("data-region");
    const active = spread.includes(id);
    p.classList.toggle("is-origin", id === origin);
    p.classList.toggle("is-spread", active && id !== origin);
    p.classList.toggle("is-dim", spread.length > 0 && !active);
  });

  if (hot) {
    hot.innerHTML = "";
    // single pulse on origin only — cleaner
    if (origin && REGION_CENTERS[origin]) {
      const c = REGION_CENTERS[origin];
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", c[0]);
      circle.setAttribute("cy", c[1]);
      circle.setAttribute("r", 54);
      circle.setAttribute("class", "gx-map-hot");
      hot.appendChild(circle);
    }
  }


  if (countryEl) countryEl.textContent = country || "—";

  if (originEl) {
    const meta = origin && REGION_META[origin];
    originEl.textContent = meta
      ? lang === "en"
        ? meta.en
        : meta.label
      : "—";
  }

  if (zonesEl) {
    zonesEl.innerHTML = spread
      .map((id) => {
        const meta = REGION_META[id];
        const label = meta ? (lang === "en" ? meta.en : meta.label) : id;
        const tag = id === origin ? "исток" : "слушают";
        return (
          '<li class="' +
          (id === origin ? "is-origin" : "is-spread") +
          '"><span>' +
          label +
          "</span><em>" +
          tag +
          "</em></li>"
        );
      })
      .join("");
  }

  if (bars) {
    const rows = spread.map((id) => {
      const meta = REGION_META[id];
      const label = meta ? (lang === "en" ? meta.en : meta.label) : id;
      let hsh = 0;
      const s = g + "|" + id;
      for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) >>> 0;
      let pct = 48 + (hsh % 45);
      if (id === origin) pct = Math.max(pct, 82);
      return { id, label, pct };
    });
    rows.sort((a, b) => b.pct - a.pct);
    bars.innerHTML = rows
      .map(
        (r) =>
          '<div class="gx-map-bar-row"><span>' +
          r.label.split(" ")[0] +
          '</span><div class="gx-map-bar"><i style="width:' +
          r.pct +
          '%"></i></div><strong>' +
          r.pct +
          "</strong></div>",
      )
      .join("");
    requestAnimationFrame(() => {
      bars.querySelectorAll(".gx-map-bar i").forEach((el) => {
        const w = el.style.width;
        el.style.width = "0";
        requestAnimationFrame(() => {
          el.style.width = w;
        });
      });
    });
  }

  if (soundEl) {
    soundEl.textContent =
      (card && card.sound) ||
      (card && card.blurb) ||
      "Семейство: " + fam;
  }

  if (chips) {
    chips.innerHTML =
      '<span class="gx-chip">' +
      fam +
      "</span>" +
      (country && country !== "—"
        ? '<span class="gx-chip">' + country + "</span>"
        : "");
  }

  if (readout) {
    if (card && card.blurb && card.rich) {
      readout.textContent = card.blurb;
    } else {
      readout.textContent = country && country !== "неизвестно"
        ? "Исток: " + country + (origin ? " · " + (REGION_META[origin] || {}).label : "")
        : "Регион определён по названию и семейству «" + fam + "».";
    }
  }
}

function bindMapInteractions() {
  const svg = document.getElementById("genre-map");
  if (!svg || svg.dataset.bound) return;
  svg.dataset.bound = "1";
  const readout = document.getElementById("map-readout");
  const resetBtn = document.getElementById("map-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => setMapView(MAP_WORLD, true));
  }
  svg.querySelectorAll(".gx-map-region").forEach((p) => {
    p.addEventListener("mouseenter", () => {
      p.classList.add("is-hover");
      const id = p.getAttribute("data-region");
      const meta = REGION_META[id];
      if (readout && meta) {
        const lang = localStorage.getItem("farside-lang") || "ru";
        readout.textContent =
          (lang === "en" ? meta.en : meta.label) +
          (p.classList.contains("is-origin")
            ? " · исток"
            : p.classList.contains("is-spread")
              ? " · здесь слушают"
              : "");
      }
    });
    p.addEventListener("mouseleave", () => p.classList.remove("is-hover"));
    p.addEventListener("click", () => {
      const id = p.getAttribute("data-region");
      if (REGION_FOCUS[id]) {
        const b = REGION_FOCUS[id];
        setMapView({ x: b.x - 20, y: b.y - 20, w: b.w + 40, h: b.h + 40 }, true);
      }
    });
  });
  svg.addEventListener("dblclick", () => setMapView(MAP_WORLD, true));
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

  if (id === "map") renderMap(lastGenre);
}

document.querySelectorAll(".gx-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.getAttribute("data-panel");
    if (!id) return;
    showPanel(id);
    logLine("panel → " + id);
  });
});


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

const REGIONAL_WORDS = ["mexican","mexico","brazilian","brazil","german","french","uk","british","korean","japanese","colombian","argentina","argentino","italian","italiana","turkish","polish","spanish","norteno","sierreno","corrido","ranchera","bollywood","desi","afro","nigerian","caribbean"];
const NIGHT_WORDS = ["dark","sad","black","doom","drone","night","noir","shadow","cold","funeral","witch","horror","ambient","sleep","melancholy","triste"];
const HEAT_WORDS = ["dance","edm","party","club","trap","reggaeton","hardstyle","dembow","bounce","festival","techno","house"];
const LATAM_WORDS = ["latin","latino","reggaeton","sierreno","corrido","norteno","ranchera","cumbia","salsa","bachata","brazilian","brazil","mexican","mexico","argentino","colombian","arrocha","musica mexicana","funk carioca"];
const ASIA_WORDS = ["k-pop","j-pop","korean","japanese","chinese","mandarin","cantopop","bollywood","desi","indian","thai","indonesian","city pop","anime"];
const EUROPE_WORDS = ["french","german","italian","polish","swedish","norwegian","uk ","british","euro","dutch","spanish","greek","finnish"];
const AFRICA_WORDS = ["afro","african","nigerian","ghana","amapiano","afrobeats","afrobeat","soukous","highlife"];
const ONLINE_WORDS = ["hyperpop","phonk","lo-fi","lofi","vapor","meme","viral","beat","nightcore","speedcore"];

function filterGenres(list, key) {
  if (!key || key === "all") return list;

  if (FILTERS[key]) {
    const words = FILTERS[key];
    if (!words) return list;
    return list.filter((g) => {
      const low = g.toLowerCase();
      return words.some((w) => low.includes(w));
    });
  }

  if (key === "short") return list.filter((g) => g.length > 0 && g.length <= 8);
  if (key === "long") return list.filter((g) => g.length >= 16);
  if (key === "compound") return list.filter((g) => /[\s\-/]/.test(g));
  if (key === "single") return list.filter((g) => !/[\s\-/]/.test(g));
  if (key === "numeric") return list.filter((g) => /\d/.test(g));
  if (key === "regional") {
    return list.filter((g) => REGIONAL_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "latam") {
    return list.filter((g) => LATAM_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "asia") {
    return list.filter((g) => ASIA_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "europe") {
    return list.filter((g) => EUROPE_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "africa") {
    return list.filter((g) => AFRICA_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "online") {
    return list.filter((g) => ONLINE_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "night") {
    return list.filter((g) => NIGHT_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "heat") {
    return list.filter((g) => HEAT_WORDS.some((w) => g.toLowerCase().includes(w)));
  }
  if (key === "carded") {
    const meta = genresMeta || {};
    return list.filter((g) => meta[g] || meta[g.toLowerCase()]);
  }
  if (key === "rare") {
    return list.filter((g) => /[qxzj]/i.test(g));
  }
  if (key === "us") {
    return list.filter((g) => /\b(us|american|atlanta|texas|chicago|detroit)\b/i.test(g) || /atl |nyc|la /i.test(g));
  }
  if (key === "uk") {
    return list.filter((g) => /\b(uk|british|london|england|scottish|welsh)\b/i.test(g));
  }
  if (key === "brazil") {
    return list.filter((g) => /brazil|brazilian|carioca|forro|sertanejo|pagode|arrocha|bossa/i.test(g));
  }
  return list;
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

function renderPlaylists(playlists, genre, status) {
  const grid = document.getElementById("playlist-grid");
  const label = document.getElementById("pl-genre-label");
  const empty = document.getElementById("pl-empty");
  if (label) label.textContent = genre || "—";
  if (!grid) return;

  const list = Array.isArray(playlists) ? playlists.slice(0, 8) : [];
  grid.innerHTML = "";

  if (!list.length) {
    if (empty) {
      empty.hidden = false;
      const title = empty.querySelector("strong");
      const sub = empty.querySelector("span");
      if (status === "offline") {
        if (title) title.textContent = "API молчит";
        if (sub) sub.textContent = "Жанр пойман локально, но обложки плейлистов не пришли. Попробуй «Ещё раз» чуть позже.";
      } else if (status === "empty") {
        if (title) title.textContent = "Пустой ответ";
        if (sub) sub.textContent = "Сервер ответил, но плейлистов в выдаче нет.";
      } else {
        if (title) title.textContent = "Плейлистов пока нет";
        if (sub) sub.textContent = "Запусти генератор — сюда подтянутся обложки, когда API ответит.";
      }
    }
    return;
  }

  if (empty) empty.hidden = true;

  list.forEach((pl, i) => {
    const url = pl.spotifyUrl || (pl.external_urls && pl.external_urls.spotify) || pl.url || "#";
    const img = pl.image || (pl.images && pl.images[0] && (pl.images[0].url || pl.images[0])) || "";
    const name = pl.name || "Playlist";
    const tracks =
      pl.tracks_total != null
        ? pl.tracks_total + " tracks"
        : pl.tracks && pl.tracks.total != null
          ? pl.tracks.total + " tracks"
          : "Spotify";
    const a = document.createElement("a");
    a.className = "gx-pl-card gx-pl-in";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.animationDelay = i * 55 + "ms";
    a.innerHTML =
      '<div class="gx-pl-cover"' +
      (img ? ' style="background-image:url(\'' + String(img).replace(/'/g, "%27") + '\')"' : "") +
      '></div><div class="gx-pl-meta"><strong>' +
      String(name).replace(/</g, "&lt;") +
      "</strong><span>" +
      String(tracks).replace(/</g, "&lt;") +
      "</span></div>";
    grid.appendChild(a);
  });
}

function fmtDur(ms) {
  if (ms == null || isNaN(ms)) return "—";
  const s = Math.round(Number(ms) / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ":" + String(r).padStart(2, "0");
}

function renderTracks(data, genre) {
  const listEl = document.getElementById("track-list");
  const label = document.getElementById("tr-genre-label");
  const empty = document.getElementById("tr-empty");
  if (label) label.textContent = genre || "—";

  const tracks = data && Array.isArray(data.tracks) ? data.tracks : [];
  console.log("[farside] renderTracks", {
    genre: genre,
    hasData: !!data,
    count: tracks.length,
    listEl: !!listEl,
  });

  if (listEl) listEl.innerHTML = "";

  if (!tracks.length) {
    if (empty) {
      empty.hidden = false;
      empty.removeAttribute("hidden");
      const title = empty.querySelector("strong");
      const sub = empty.querySelector("span");
      if (!data) {
        if (title) title.textContent = "API молчит";
        if (sub) sub.textContent = "Без ответа сервера треки не подтянуть.";
      } else {
        if (title) title.textContent = "Треков нет";
        if (sub)
          sub.textContent =
            "Сервер ответил, но tracks пустой. Открой консоль (F12) и журнал сигнала.";
      }
    }
    return;
  }

  if (empty) {
    empty.hidden = true;
    empty.setAttribute("hidden", "");
  }
  if (!listEl) {
    console.warn("[farside] #track-list not found");
    return;
  }

  tracks.slice(0, 15).forEach((tr, i) => {
    const name = tr.name || "Track";
    const artists = Array.isArray(tr.artists)
      ? tr.artists.map((a) => a.name || a).filter(Boolean).join(", ")
      : tr.artist || "—";
    const dur = fmtDur(tr.duration_ms);
    const img = tr.image || "";
    const url =
      tr.spotifyUrl ||
      (tr.external_urls && tr.external_urls.spotify) ||
      "#";
    const row = document.createElement(url !== "#" ? "a" : "div");
    if (row.tagName === "A") {
      row.href = url;
      row.target = "_blank";
      row.rel = "noopener";
    }
    row.className = "gx-track gx-pl-in";
    row.style.animationDelay = i * 40 + "ms";
    const imgAttr = img
      ? ' style="background-image:url(\'' +
        String(img).replace(/'/g, "%27") +
        "')\""
      : "";
    row.innerHTML =
      '<span class="gx-track-n">' +
      (i + 1) +
      '</span><span class="gx-track-art"' +
      imgAttr +
      '></span><span class="gx-track-meta"><strong>' +
      String(name).replace(/</g, "&lt;") +
      "</strong><span>" +
      String(artists).replace(/</g, "&lt;") +
      '</span></span><span class="gx-track-dur">' +
      dur +
      "</span>";
    listEl.appendChild(row);
  });
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
  // не переключаем вкладку — удобно смотреть плейлисты
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
        await logLine(
          "api tracks " +
            (data && Array.isArray(data.tracks) ? data.tracks.length : 0)
        );
        console.log("[farside] api payload", data);
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
    lastGenre = genre;
    lastPayload = data;
    renderResult(genre);
    const pls = (data && data.playlists) || [];
    const plStatus = !data ? "offline" : pls.length ? "ok" : "empty";
    renderPlaylists(pls, genre, plStatus);
    renderTracks(data, genre);
    renderMap(genre);
    await logLine("tracks " + ((data && data.tracks && data.tracks.length) || 0));
    await logLine("map ok");
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

document.getElementById("share-btn")?.addEventListener("click", async () => {
  const g = lastGenre || (genreOut && genreOut.textContent) || "";
  if (!g || g === "…" || g === "ожидание сигнала") {
    logLine("share: nothing locked");
    return;
  }
  try {
    await navigator.clipboard.writeText(g);
    logLine("copied genre: " + g);
    const b = document.getElementById("share-btn");
    if (b) {
      b.classList.add("is-flash");
      const prev = b.textContent;
      b.textContent = "Скопировано";
      setTimeout(() => {
        b.classList.remove("is-flash");
        b.textContent = prev || "Копировать жанр";
      }, 900);
    }
  } catch (_) {
    logLine("clipboard blocked");
    prompt("Скопируй жанр:", g);
  }
});

bindMapInteractions();

document.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
  if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    document.getElementById("generate-btn")?.click();
    return;
  }
  const map = { "1": "desc", "2": "filters", "3": "playlists", "4": "tracks", "5": "map" };
  if (map[e.key]) {
    showPanel(map[e.key]);
    logLine("panel → " + map[e.key]);
  }
});

(async () => {
  if (signalLines) signalLines.innerHTML = "";
  await logLines(["boot sequence", "load freq table", "open channel", "ether link ok"]);
  await loadGenresMeta();
  const genres = await loadGenres();
  await logLine("ether " + (genres.length || 0) + " tags");
  fillEther(genres.length ? genres : ["ambient", "sierreno", "synthwave"]);

  try {
    const saved = localStorage.getItem(FILTER_KEY);
    if (saved) setFilter(saved);
  } catch (_) {}

  const params = new URLSearchParams(window.location.search);
  const qGenre = params.get("genre");
  if (qGenre) {
    lastGenre = qGenre;
    renderResult(qGenre);
    renderPlaylists([], qGenre, "empty");
    await logLine("deep link: " + qGenre);
  }

  await logLines(["standby", "awaiting launch", "ready"]);
})();
