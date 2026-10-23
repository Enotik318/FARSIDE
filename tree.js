
const FAMILY_LABELS = {
  hiphop: "Хип-хоп", metal: "Метал", punk: "Панк", rock: "Рок",
  electronic: "Электроника", latin: "Латина", jazz: "Джаз", rnb: "R&B",
  pop: "Поп", folk: "Фолк", classical: "Классика", reggae: "Reggae",
  blues: "Блюз", world: "World", other: "Другое",
};
const FAMILY_ORDER = [
  "electronic", "hiphop", "pop", "rock", "metal", "punk",
  "latin", "jazz", "rnb", "folk", "classical", "reggae", "blues", "world", "other",
];

let DB = {};
const openSet = new Set(["root", "grp:pulse", "grp:weight", "grp:roots"]);

const listEl = document.getElementById("ft-list") || document.getElementById("ft-world");
const card = document.getElementById("ft-card");
const qInput = document.getElementById("ft-q");
const stats = document.getElementById("ft-stats");

function labelFamily(f) {
  return FAMILY_LABELS[f] || f;
}

function genresInFamily(fam) {
  return Object.values(DB)
    .filter((v) => (v.family || "other") === fam)
    .map((v) => v.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function buildHierarchy(names) {
  const set = new Set(names.map((n) => n.toLowerCase()));
  const by = {};
  names.forEach((n) => (by[n.toLowerCase()] = n));
  const parentOf = {};
  names.forEach((name) => {
    const parts = name.toLowerCase().split(/\s+/);
    let best = null;
    let bestLen = 0;
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j <= parts.length; j++) {
        if (j - i === parts.length) continue;
        const phrase = parts.slice(i, j).join(" ");
        if (set.has(phrase) && j - i > bestLen) {
          best = by[phrase];
          bestLen = j - i;
        }
      }
    }
    parentOf[name] = best;
  });
  const children = {};
  const roots = [];
  names.forEach((n) => {
    const p = parentOf[n];
    if (!p) roots.push(n);
    else {
      if (!children[p]) children[p] = [];
      children[p].push(n);
    }
  });
  Object.keys(children).forEach((k) => children[k].sort((a, b) => a.localeCompare(b)));
  roots.sort((a, b) => a.localeCompare(b));
  return { roots, children };
}

function buildTree() {
  const GROUPS = [
    { id: "grp:pulse", label: "Pulse", keys: ["electronic", "pop", "hiphop", "rnb"] },
    { id: "grp:weight", label: "Weight", keys: ["rock", "metal", "punk"] },
    {
      id: "grp:roots",
      label: "Roots",
      keys: ["latin", "folk", "jazz", "blues", "reggae", "classical", "world", "other"],
    },
  ];

  const famNodes = {};
  FAMILY_ORDER.forEach((f) => {
    const names = genresInFamily(f);
    if (!names.length) return;
    const { roots, children } = buildHierarchy(names);

    function makeNode(name, depth) {
      const kids = (children[name] || []).map((k) => makeNode(k, depth + 1));
      return {
        id: "g:" + f + ":" + name,
        label: name,
        kind: kids.length ? "branch" : "leaf",
        name,
        family: f,
        children: kids,
      };
    }

    famNodes[f] = {
      id: "fam:" + f,
      label: labelFamily(f),
      kind: "family",
      family: f,
      count: names.length,
      children: roots.map((r) => makeNode(r, 0)),
    };
  });

  return {
    id: "root",
    label: "MUSIC",
    kind: "root",
    children: GROUPS.map((g) => ({
      id: g.id,
      label: g.label,
      kind: "group",
      children: g.keys.map((k) => famNodes[k]).filter(Boolean),
    })).filter((g) => g.children.length),
  };
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderNode(node, depth) {
  const hasKids = node.children && node.children.length;
  const isOpen = openSet.has(node.id);
  const canToggle = hasKids && node.kind !== "leaf";

  let html =
    '<div class="ft-row ft-row-' +
    node.kind +
    '" style="padding-left:' +
    depth * 16 +
    'px">';

  if (canToggle) {
    html +=
      '<button type="button" class="ft-toggle' +
      (isOpen ? " is-open" : "") +
      '" data-toggle="' +
      esc(node.id) +
      '" aria-expanded="' +
      (isOpen ? "true" : "false") +
      '">' +
      (isOpen ? "▾" : "▸") +
      "</button>";
  } else {
    html += '<span class="ft-toggle-spacer"></span>';
  }

  html +=
    '<button type="button" class="ft-label" data-id="' +
    esc(node.id) +
    '"' +
    (node.name ? ' data-name="' + esc(node.name) + '"' : "") +
    ">" +
    esc(node.label) +
    (node.count != null
      ? ' <span class="ft-count">' + node.count + "</span>"
      : "") +
    "</button></div>";

  if (canToggle && isOpen) {
    html += '<div class="ft-children">';
    node.children.forEach((ch) => {
      html += renderNode(ch, depth + 1);
    });
    html += "</div>";
  }
  return html;
}

let ROOT = null;

function render() {
  if (!listEl || !ROOT) return;
  listEl.innerHTML =
    '<div class="ft-list-inner">' + renderNode(ROOT, 0) + "</div>";

  listEl.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-toggle");
      if (openSet.has(id)) openSet.delete(id);
      else openSet.add(id);
      render();
    });
  });

  listEl.querySelectorAll(".ft-label").forEach((btn) => {
    btn.addEventListener("click", () => {
      listEl.querySelectorAll(".ft-label.is-sel").forEach((x) =>
        x.classList.remove("is-sel"),
      );
      btn.classList.add("is-sel");
      showCard(btn.getAttribute("data-id"), btn.getAttribute("data-name"));
    });
  });
}

function showCard(id, name) {
  if (!card) return;
  card.hidden = false;
  const kick = document.getElementById("ft-card-kicker");
  const nameEl = document.getElementById("ft-card-name");
  const path = document.getElementById("ft-card-path");
  const blurb = document.getElementById("ft-card-blurb");
  const gen = document.getElementById("ft-gen");

  if (name) {
    const meta =
      DB[name.toLowerCase()] ||
      Object.values(DB).find((x) => x.name === name) ||
      {};
    if (kick) kick.textContent = "Жанр · " + (meta.family || "—");
    if (nameEl) nameEl.textContent = name;
    if (path) path.textContent = labelFamily(meta.family || "") + " → " + name;
    if (blurb)
      blurb.textContent =
        meta.blurb || meta.sound || "Открой в генераторе — плейлисты и треки.";
    if (gen) {
      gen.style.display = "";
      gen.href = "generator.html?genre=" + encodeURIComponent(name);
    }
  } else {
    if (kick) kick.textContent = "Узел";
    if (nameEl) nameEl.textContent = id.replace(/^[^:]+:/, "");
    if (path) path.textContent = "Раскрой ветки ниже";
    if (blurb) blurb.textContent = "Жанры внутри семейства.";
    if (gen) gen.style.display = "none";
  }
}

document.getElementById("ft-card-x")?.addEventListener("click", () => {
  if (card) card.hidden = true;
});

document.getElementById("ft-q")?.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (q.length < 2) return;
  const hit = Object.values(DB).find((v) =>
    (v.name || "").toLowerCase().includes(q),
  );
  if (!hit) return;
  // open path to family
  openSet.add("root");
  const fam = hit.family || "other";
  if (["electronic", "pop", "hiphop", "rnb"].includes(fam)) openSet.add("grp:pulse");
  else if (["rock", "metal", "punk"].includes(fam)) openSet.add("grp:weight");
  else openSet.add("grp:roots");
  openSet.add("fam:" + fam);
  render();
  showCard("g:" + fam + ":" + hit.name, hit.name);
  const el = listEl.querySelector('[data-name="' + CSS.escape(hit.name) + '"]');
  el?.classList.add("is-sel");
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
});

document.getElementById("ft-random")?.addEventListener("click", () => {
  const all = Object.values(DB);
  if (!all.length) return;
  const hit = all[Math.floor(Math.random() * all.length)];
  if (qInput) qInput.value = hit.name;
  qInput?.dispatchEvent(new Event("input"));
});

document.getElementById("ft-collapse")?.addEventListener("click", () => {
  openSet.clear();
  openSet.add("root");
  render();
  if (card) card.hidden = true;
});

async function boot() {
  try {
    DB = await (await fetch("genres.json")).json();
  } catch {
    if (listEl)
      listEl.innerHTML = '<p class="ft-empty">Не удалось загрузить genres.json</p>';
    return;
  }
  if (stats)
    stats.textContent =
      Object.keys(DB).length.toLocaleString("ru-RU") + " жанров · раскрывай ветки";
  ROOT = buildTree();
  // host: use list container
  if (listEl) {
    listEl.classList.add("ft-list-host");
    listEl.style.transform = "none";
    listEl.style.width = "auto";
    listEl.style.height = "auto";
  }
  render();
}

boot();
