
(async function () {
  const nameEl = document.getElementById("god-name");
  const blurbEl = document.getElementById("god-blurb");
  const link = document.getElementById("god-link");
  if (!nameEl) return;
  try {
    const data = await (await fetch("genres.json")).json();
    const list = Object.values(data).filter((g) => g && g.name);
    const day = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < day.length; i++) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
    const g = list[hash % list.length];
    nameEl.textContent = g.name;
    blurbEl.textContent = (g.blurb || g.sound || g.family || "").slice(0, 160) || "Микро-жанр дня.";
    if (link) link.href = "generator.html?genre=" + encodeURIComponent(g.name);
  } catch {
    nameEl.textContent = "lo-fi";
    blurbEl.textContent = "Каталог не загрузился.";
  }
})();
