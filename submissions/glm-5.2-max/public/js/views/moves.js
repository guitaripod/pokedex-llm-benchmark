import { getAllMoves, getMove } from "../api.js";
import { capitalize, debounce, extractIdFromUrl } from "../utils.js";
import { TYPE_LIST, TYPE_COLORS, DAMAGE_CLASS_ICONS, getOfficialArtwork } from "../data.js";

export async function renderMoves(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Moves</h1>
        <p class="page-subtitle">Browse all Pokemon moves with stats and effects.</p>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" id="move-search" placeholder="Search moves...">
        <select class="select-input" id="move-type-filter">
          <option value="">All Types</option>
          ${TYPE_LIST.map((t) => `<option value="${t}">${capitalize(t)}</option>`).join("")}
        </select>
        <select class="select-input" id="move-class-filter">
          <option value="">All Categories</option>
          <option value="physical">Physical</option>
          <option value="special">Special</option>
          <option value="status">Status</option>
        </select>
        <select class="select-input" id="move-sort">
          <option value="id">ID</option>
          <option value="name">Name</option>
          <option value="power-desc">Power &#8595;</option>
          <option value="power-asc">Power &#8593;</option>
          <option value="accuracy-desc">Accuracy &#8595;</option>
          <option value="pp-desc">PP &#8595;</option>
        </select>
      </div>
      <div id="move-results"></div>
    </div>
  `;

  const resultsEl = document.getElementById("move-results");
  resultsEl.innerHTML = '<div class="loading-center"><div class="loading-spinner"></div><span class="loading-text">Loading moves...</span></div>';

  try {
    const allMoves = await getAllMoves();
    const realMoves = allMoves.filter((m) => !m.name.includes("-") || m.name.match(/^[a-z-]+$/));
    let displayed = 0;
    const PAGE = 50;
    let filtered = realMoves;
    const moveCache = new Map();
    let currentSort = "id";
    let currentType = "";
    let currentClass = "";
    let currentSearch = "";

    async function enrichMove(move) {
      if (moveCache.has(move.name)) return moveCache.get(move.name);
      try {
        const id = extractIdFromUrl(move.url);
        const data = await getMove(id);
        const info = {
          name: move.name,
          id: id,
          type: data.type?.name,
          damageClass: data.damage_class?.name,
          power: data.power,
          accuracy: data.accuracy,
          pp: data.pp,
          priority: data.priority,
          effect: data.effect_entries?.find((e) => e.language.name === "en")?.effect || "",
          shortEffect: data.effect_entries?.find((e) => e.language.name === "en")?.short_effect || "",
          learnedBy: data.learned_by_pokemon?.length || 0,
          generation: data.generation?.name || "",
        };
        moveCache.set(move.name, info);
        return info;
      } catch (e) {
        const info = { name: move.name, type: null, damageClass: null, power: null, accuracy: null, pp: null };
        moveCache.set(move.name, info);
        return info;
      }
    }

    function applyFilters() {
      currentSearch = document.getElementById("move-search").value.toLowerCase();
      currentType = document.getElementById("move-type-filter").value;
      currentClass = document.getElementById("move-class-filter").value;
      currentSort = document.getElementById("move-sort").value;

      filtered = realMoves.filter((m) => {
        if (currentSearch && !m.name.includes(currentSearch)) return false;
        const cached = moveCache.get(m.name);
        if (currentType && (!cached || cached.type !== currentType)) return false;
        if (currentClass && (!cached || cached.damageClass !== currentClass)) return false;
        return true;
      });

      if (currentSort.startsWith("power") || currentSort.startsWith("accuracy") || currentSort.startsWith("pp")) {
        const [key, dir] = currentSort.split("-");
        const dirMult = dir === "desc" ? -1 : 1;
        filtered.sort((a, b) => {
          const av = moveCache.get(a.name)?.[key] ?? -1;
          const bv = moveCache.get(b.name)?.[key] ?? -1;
          return (av - bv) * dirMult;
        });
      } else if (currentSort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        filtered.sort((a, b) => extractIdFromUrl(a.url) - extractIdFromUrl(b.url));
      }

      displayed = 0;
      renderMovesList();
    }

    function renderMovesList() {
      const toShow = filtered.slice(0, displayed + PAGE);
      displayed = toShow.length;

      resultsEl.innerHTML = `
        <div class="moves-table-container">
          <table class="moves-table">
            <thead>
              <tr>
                <th>Move</th>
                <th>Type</th>
                <th>Cat</th>
                <th>Pwr</th>
                <th>Acc</th>
                <th>PP</th>
                <th>Learned By</th>
              </tr>
            </thead>
            <tbody>
              ${toShow.map((m) => {
                const cached = moveCache.get(m.name);
                return `
                  <tr data-name="${m.name}">
                    <td class="move-name">${capitalize(m.name)}</td>
                    <td>${cached?.type ? `<span class="type-badge type-badge-sm type-${cached.type}">${cached.type}</span>` : '<span class="text-tertiary">—</span>'}</td>
                    <td>${cached?.damageClass ? `<span class="move-damage-class">${DAMAGE_CLASS_ICONS[cached.damageClass] || ""} ${cached.damageClass}</span>` : '<span class="text-tertiary">—</span>'}</td>
                    <td class="move-power">${cached?.power ?? "—"}</td>
                    <td class="move-accuracy">${cached?.accuracy != null ? cached.accuracy + "%" : "—"}</td>
                    <td class="move-pp">${cached?.pp ?? "—"}</td>
                    <td class="text-secondary" style="font-size:0.8rem;">${cached?.learnedBy ?? "—"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
        ${displayed < filtered.length ? `
          <div class="loading-center">
            <button class="btn btn-secondary" id="load-more-moves">Load more (${filtered.length - displayed} remaining)</button>
          </div>
        ` : ""}
      `;

      const loadMore = document.getElementById("load-more-moves");
      if (loadMore) loadMore.addEventListener("click", renderMovesList);

      resultsEl.querySelectorAll("tr[data-name]").forEach((row) => {
        row.addEventListener("click", async () => {
          const name = row.getAttribute("data-name");
          showMoveDetail(name, moveCache);
        });
      });
    }

    document.getElementById("move-search").addEventListener("input", debounce(applyFilters, 200));
    document.getElementById("move-type-filter").addEventListener("change", applyFilters);
    document.getElementById("move-class-filter").addEventListener("change", applyFilters);
    document.getElementById("move-sort").addEventListener("change", applyFilters);

    applyFilters();

    const enrichBatch = realMoves.slice(0, 100).map((m) => enrichMove(m));
    Promise.all(enrichBatch).then(() => {
      applyFilters();
      const nextBatch = realMoves.slice(100, 400).map((m) => enrichMove(m));
      Promise.all(nextBatch).then(() => applyFilters());
    });
  } catch (err) {
    resultsEl.innerHTML = `<div class="error-state"><h3>Failed to load moves</h3><p>${err.message}</p></div>`;
  }
}

async function showMoveDetail(name, cache) {
  const modalContainer = document.getElementById("modal-container");
  let info = cache.get(name);
  if (!info) {
    try {
      const data = await getMove(name);
      info = {
        name: name,
        type: data.type?.name,
        damageClass: data.damage_class?.name,
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        priority: data.priority,
        effect: data.effect_entries?.find((e) => e.language.name === "en")?.effect || "",
        shortEffect: data.effect_entries?.find((e) => e.language.name === "en")?.short_effect || "",
        learnedBy: data.learned_by_pokemon || [],
        generation: data.generation?.name || "",
      };
    } catch (e) {
      info = { name, effect: "Failed to load." };
    }
  }

  modalContainer.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${capitalize(name)}</span>
          <button class="modal-close" onclick="document.getElementById('modal-container').innerHTML=''">&times;</button>
        </div>
        <div class="modal-body">
          <div class="info-grid mb-4">
            ${info.type ? `<div class="info-card"><div class="info-card-title">Type</div><div class="info-card-value"><span class="type-badge type-${info.type}">${info.type}</span></div></div>` : ""}
            ${info.damageClass ? `<div class="info-card"><div class="info-card-title">Category</div><div class="info-card-value">${capitalize(info.damageClass)}</div></div>` : ""}
            ${info.power != null ? `<div class="info-card"><div class="info-card-title">Power</div><div class="info-card-value">${info.power}</div></div>` : ""}
            ${info.accuracy != null ? `<div class="info-card"><div class="info-card-title">Accuracy</div><div class="info-card-value">${info.accuracy}%</div></div>` : ""}
            ${info.pp != null ? `<div class="info-card"><div class="info-card-title">PP</div><div class="info-card-value">${info.pp}</div></div>` : ""}
            ${info.priority ? `<div class="info-card"><div class="info-card-title">Priority</div><div class="info-card-value">${info.priority}</div></div>` : ""}
          </div>
          ${info.shortEffect ? `<p class="text-secondary mb-4" style="font-size:0.9rem;">${info.shortEffect}</p>` : ""}
          ${info.effect ? `<p class="text-tertiary mb-4" style="font-size:0.85rem;">${info.effect}</p>` : ""}
          ${info.generation ? `<p class="text-tertiary mb-4" style="font-size:0.8rem;">Introduced in ${capitalize(info.generation).replace("generation-", "Gen ")}</p>` : ""}
          ${info.learnedBy && info.learnedBy.length > 0 ? `
            <div class="section-title" style="font-size:1rem;">Learned by ${info.learnedBy.length} Pokemon</div>
            <div class="pokemon-picker-grid">
              ${info.learnedBy.slice(0, 60).map((p) => {
                const id = extractIdFromUrl(p.url);
                return `
                  <div class="picker-item" data-id="${id}">
                    <img src="${getOfficialArtwork(id)}" alt="${p.name}" loading="lazy"
                      onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png'">
                    <span class="picker-item-name">${capitalize(p.name)}</span>
                  </div>
                `;
              }).join("")}
            </div>
            ${info.learnedBy.length > 60 ? `<p class="text-tertiary text-center mt-4" style="font-size:0.8rem;">+${info.learnedBy.length - 60} more</p>` : ""}
          ` : ""}
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelectorAll(".picker-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-id");
      modalContainer.innerHTML = "";
      window.location.hash = `#/pokemon/${id}`;
    });
  });

  modalContainer.querySelector(".modal-backdrop").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      modalContainer.innerHTML = "";
    }
  });
}
