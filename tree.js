
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

const BOX_W = 112;
const BOX_H = 30;
const ROOT_W = 100;
const ROOT_H = 36;
const GROUP_W = 100;
const GAP_X = 14;
const GAP_Y = 52;
const MAX_ROOTS = 5;
const MAX_KIDS = 3;
const MAX_DEPTH = 2;

let DB = {};
let ROOT = null;
let selectedId = null;

const world = document.getElementById("ft-world");
const stage = document.getElementById("ft-stage");
const card = document.getElementById("ft-card");
const qInput = document.getElementById("ft-q");

let cam = { x: 0, y: 0, k: 1 };
let dragging = false;
let last = { x: 0, y: 0 };
let pinchStart = null;

function applyCam() {
  if (!world) return;
  world.style.transform =
    "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.k + ")";
}

function zoomAt(mx, my, factor) {
  const prev = cam.k;
  const next = Math.min(2.5, Math.max(0.22, prev * factor));
  if (next === prev) return;
  cam.k = next;
  cam.x = mx - ((mx - cam.x) / prev) * next;
  cam.y = my - ((my - cam.y) / prev) * next;
  applyCam();
}

function resetCam() {
  if (!stage || !world) return;
  const rect = stage.getBoundingClientRect();
  const W = parseFloat(world.dataset.w || "900");
  const H = parseFloat(world.dataset.h || "600");
  const k =
    Math.min(rect.width / (W + 40), rect.height / (Math.min(H, 700) + 40), 1) *
    0.9;
  cam.k = Math.max(0.25, k);
  cam.x = (rect.width - W * cam.k) / 2;
  cam.y = 18;
  applyCam();
}

function labelFamily(f) {
  return FAMILY_LABELS[f] || f;
}

function genresInFamily(fam) {
  return Object.values(DB)
    .filter((v) => (v.family || "other") === fam)
    .map((v) => v.name)
    .filter(Boolean);
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
  const sortFn = (a, b) => {
    const ca = (children[a] || []).length;
    const cb = (children[b] || []).length;
    return cb - ca || a.localeCompare(b);
  };
  roots.sort(sortFn);
  Object.keys(children).forEach((k) => children[k].sort(sortFn));
  return { roots, children };
}

function buildTree() {
  const famNodes = [];
  FAMILY_ORDER.forEach((f) => {
    const names = genresInFamily(f);
    if (!names.length) return;
    const { roots, children } = buildHierarchy(names);

    function makeGenreNode(name, depth) {
      const raw = children[name] || [];
      const kids =
        depth >= MAX_DEPTH
          ? []
          : raw.slice(0, MAX_KIDS).map((k) => makeGenreNode(k, depth + 1));
      return {
        id: "g:" + f + ":" + name,
        label: name,
        kind: depth === 0 ? "branch" : "leaf",
        name,
        family: f,
        children: kids,
        count: raw.length,
      };
    }

    famNodes.push({
      id: "fam:" + f,
      label: labelFamily(f),
      kind: "family",
      family: f,
      count: names.length,
      children: roots.slice(0, MAX_ROOTS).map((r) => makeGenreNode(r, 0)),
    });
  });

  const GROUPS = [
    {
      id: "grp:pulse",
      label: "Pulse",
      keys: ["electronic", "pop", "hiphop", "rnb"],
    },
    { id: "grp:weight", label: "Weight", keys: ["rock", "metal", "punk"] },
    {
      id: "grp:roots",
      label: "Roots",
      keys: [
        "latin",
        "folk",
        "jazz",
        "blues",
        "reggae",
        "classical",
        "world",
        "other",
      ],
    },
  ];

  const byFam = {};
  famNodes.forEach((n) => (byFam[n.family] = n));

  const groupNodes = GROUPS.map((g) => {
    const kids = g.keys.map((k) => byFam[k]).filter(Boolean);
    return {
      id: g.id,
      label: g.label,
      kind: "group",
      count: kids.reduce((s, n) => s + (n.count || 0), 0),
      children: kids,
    };
  }).filter((g) => g.children.length);

  return {
    id: "root",
    label: "MUSIC",
    kind: "root",
    children: groupNodes,
  };
}

function nodeSize(n) {
  if (n.kind === "root") return { w: ROOT_W, h: ROOT_H };
  if (n.kind === "group") return { w: GROUP_W, h: 30 };
  return { w: BOX_W, h: BOX_H };
}

/** Top-down tidy: children in a row under parent (like the jazz chart) */
function layoutClean(node) {
  const sz = nodeSize(node);
  node.w = sz.w;
  node.h = sz.h;
  const kids = node.children || [];
  if (!kids.length) {
    node.subtreeW = node.w;
    return;
  }
  kids.forEach(layoutClean);
  let total = 0;
  kids.forEach((ch, i) => {
    total += ch.subtreeW + (i ? GAP_X : 0);
  });
  node.subtreeW = Math.max(node.w, total);
}

function place(node, left, top) {
  node.ax = left + node.subtreeW / 2 - node.w / 2;
  node.ay = top;
  const kids = node.children || [];
  if (!kids.length) return;
  let x = left;
  kids.forEach((ch) => {
    place(ch, x, top + GAP_Y);
    x += ch.subtreeW + GAP_X;
  });
}

function collect(node, list) {
  list.push(node);
  (node.children || []).forEach((ch) => collect(ch, list));
}

function collectLinks(node, links) {
  (node.children || []).forEach((ch) => {
    links.push({ parent: node, child: ch });
    collectLinks(ch, links);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function findNode(id, node) {
  if (node.id === id) return node;
  for (const ch of node.children || []) {
    const f = findNode(id, ch);
    if (f) return f;
  }
  return null;
}

function render() {
  if (!ROOT || !world) return;
  layoutClean(ROOT);
  place(ROOT, 0, 0);

  const nodes = [];
  collect(ROOT, nodes);
  const links = [];
  collectLinks(ROOT, links);

  const pad = 36;
  const maxX = Math.max(...nodes.map((n) => n.ax + n.w), BOX_W);
  const maxY = Math.max(...nodes.map((n) => n.ay + n.h), BOX_H);
  const W = maxX + pad * 2;
  const H = maxY + pad * 2;
  world.dataset.w = String(W);
  world.dataset.h = String(H);
  world.style.width = W + "px";
  world.style.height = H + "px";

  const ox = pad;
  const oy = pad;

  let html = "";
  html += '<svg class="ft-lines" width="' + W + '" height="' + H + '">';
  links.forEach(({ parent: p, child: c }) => {
    const x1 = ox + p.ax + p.w / 2;
    const y1 = oy + p.ay + p.h;
    const x2 = ox + c.ax + c.w / 2;
    const y2 = oy + c.ay;
    const mid = y1 + (y2 - y1) * 0.5;
    // orthogonal like textbook diagrams
    html +=
      '<path class="ft-link" d="M' +
      x1 +
      "," +
      y1 +
      " V" +
      mid +
      " H" +
      x2 +
      " V" +
      y2 +
      '"/>';
  });
  html += "</svg>";

  nodes.forEach((n) => {
    const sel = selectedId === n.id ? " is-sel" : "";
    const cls = "ft-box ft-box-" + n.kind + sel;
    const count =
      n.kind === "family" || n.kind === "group"
        ? '<span class="ft-count">' + (n.count || "") + "</span>"
        : "";
    html +=
      '<button type="button" class="' +
      cls +
      '" data-id="' +
      n.id +
      '" style="left:' +
      (ox + n.ax) +
      "px;top:" +
      (oy + n.ay) +
      "px;width:" +
      n.w +
      "px;height:" +
      n.h +
      'px"><span class="ft-box-label">' +
      escapeHtml(n.label) +
      "</span>" +
      count +
      "</button>";
  });

  world.innerHTML = html;
  world.querySelectorAll(".ft-box").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onBoxClick(btn.getAttribute("data-id"));
    });
  });
}

function onBoxClick(id) {
  const n = findNode(id, ROOT);
  if (!n) return;
  selectedId = id;
  world.querySelectorAll(".ft-box").forEach((b) => {
    b.classList.toggle("is-sel", b.getAttribute("data-id") === id);
  });
  showCard(n);
}

function showCard(n) {
  if (!card) return;
  card.hidden = false;
  const kick = document.getElementById("ft-card-kicker");
  const name = document.getElementById("ft-card-name");
  const path = document.getElementById("ft-card-path");
  const blurb = document.getElementById("ft-card-blurb");
  if (kick)
    kick.textContent =
      n.kind === "root"
        ? "Корень"
        : n.kind === "group"
          ? "Группа"
          : n.kind === "family"
            ? "Семейство"
            : n.kind === "branch"
              ? "Ветка"
              : "Жанр";
  if (name) name.textContent = n.label;
  if (path) {
    if (n.kind === "group") path.textContent = "Кластер семейств";
    else if (n.family)
      path.textContent =
        labelFamily(n.family) + (n.name ? " → " + n.name : "");
    else path.textContent = "Все направления";
  }
  const meta =
    n.name &&
    (DB[n.name.toLowerCase()] ||
      Object.values(DB).find((x) => x.name === n.name));
  if (blurb) {
    let t = (meta && (meta.blurb || meta.sound)) || "";
    if (t.length > 240) t = t.slice(0, 240) + "…";
    blurb.textContent =
      t ||
      (n.kind === "group"
        ? "Ветви семейств ниже по схеме."
        : n.kind === "family"
          ? (n.count || 0) + " жанров."
          : "Открой в генераторе.");
  }
  const gen = document.getElementById("ft-gen");
  if (gen) {
    if (n.name) {
      gen.style.display = "";
      gen.href = "generator.html?genre=" + encodeURIComponent(n.name);
    } else gen.style.display = "none";
  }
}

function focusId(id) {
  const el = world.querySelector('.ft-box[data-id="' + CSS.escape(id) + '"]');
  if (!el || !stage) return;
  const rect = stage.getBoundingClientRect();
  const left = parseFloat(el.style.left) || 0;
  const top = parseFloat(el.style.top) || 0;
  const w = parseFloat(el.style.width) || BOX_W;
  cam.k = Math.max(cam.k, 0.85);
  cam.x = rect.width / 2 - (left + w / 2) * cam.k;
  cam.y = rect.height / 3 - (top + BOX_H / 2) * cam.k;
  applyCam();
}

document.getElementById("ft-card-x")?.addEventListener("click", () => {
  if (card) card.hidden = true;
});
document.getElementById("ft-collapse")?.addEventListener("click", () => {
  selectedId = null;
  if (card) card.hidden = true;
  world.querySelectorAll(".ft-box.is-sel").forEach((b) =>
    b.classList.remove("is-sel"),
  );
  resetCam();
});

document.getElementById("ft-q")?.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (q.length < 2) return;
  const hit = Object.values(DB).find((v) =>
    (v.name || "").toLowerCase().includes(q),
  );
  if (!hit) return;
  const id = "g:" + (hit.family || "other") + ":" + hit.name;
  const n = findNode(id, ROOT);
  if (!n) return;
  selectedId = id;
  world.querySelectorAll(".ft-box").forEach((b) => {
    b.classList.toggle("is-sel", b.getAttribute("data-id") === id);
  });
  showCard(n);
  focusId(id);
});

document.getElementById("ft-random")?.addEventListener("click", () => {
  const all = Object.values(DB);
  if (!all.length) return;
  const hit = all[Math.floor(Math.random() * all.length)];
  const id = "g:" + (hit.family || "other") + ":" + hit.name;
  selectedId = id;
  world.querySelectorAll(".ft-box").forEach((b) => {
    b.classList.toggle("is-sel", b.getAttribute("data-id") === id);
  });
  const n = findNode(id, ROOT);
  if (n) showCard(n);
  focusId(id);
  if (qInput) qInput.value = hit.name;
});

stage?.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".ft-box, .ft-card, .ft-bar, .ft-zoom, button, a, input"))
    return;
  dragging = true;
  last = { x: e.clientX, y: e.clientY };
  stage.setPointerCapture(e.pointerId);
  stage.classList.add("is-dragging");
});
stage?.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  cam.x += e.clientX - last.x;
  cam.y += e.clientY - last.y;
  last = { x: e.clientX, y: e.clientY };
  applyCam();
});
stage?.addEventListener("pointerup", () => {
  dragging = false;
  stage.classList.remove("is-dragging");
});
stage?.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    zoomAt(
      e.clientX - rect.left,
      e.clientY - rect.top,
      e.deltaY < 0 ? 1.1 : 1 / 1.1,
    );
  },
  { passive: false },
);
stage?.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart = {
        dist: Math.hypot(dx, dy),
        k: cam.k,
        cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  },
  { passive: true },
);
stage?.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2 && pinchStart) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const rect = stage.getBoundingClientRect();
      const next = Math.min(
        2.5,
        Math.max(0.22, pinchStart.k * (dist / pinchStart.dist)),
      );
      const mx = pinchStart.cx - rect.left;
      const my = pinchStart.cy - rect.top;
      const prev = cam.k;
      cam.k = next;
      cam.x = mx - ((mx - cam.x) / prev) * next;
      cam.y = my - ((my - cam.y) / prev) * next;
      applyCam();
    }
  },
  { passive: false },
);
stage?.addEventListener("touchend", () => {
  pinchStart = null;
});

document.getElementById("ft-in")?.addEventListener("click", () => {
  const r = stage.getBoundingClientRect();
  zoomAt(r.width / 2, r.height / 2, 1.15);
});
document.getElementById("ft-out")?.addEventListener("click", () => {
  const r = stage.getBoundingClientRect();
  zoomAt(r.width / 2, r.height / 2, 1 / 1.15);
});
document.getElementById("ft-reset")?.addEventListener("click", () => resetCam());

async function boot() {
  try {
    DB = await (await fetch("genres.json")).json();
  } catch (e) {
    if (world)
      world.innerHTML =
        '<p class="ft-empty">Не удалось загрузить genres.json</p>';
    return;
  }
  const n = Object.keys(DB).length;
  const fams = new Set(Object.values(DB).map((v) => v.family || "other"));
  const stats = document.getElementById("ft-stats");
  if (stats)
    stats.textContent =
      n.toLocaleString("ru-RU") + " жанров · схема сверху вниз";

  ROOT = buildTree();
  render();
  resetCam();
  window.addEventListener("resize", () => resetCam());
}

boot();
