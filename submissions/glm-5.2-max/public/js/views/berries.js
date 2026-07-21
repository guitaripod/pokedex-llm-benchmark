import { getAllBerries, getBerry } from "../api.js";
import { capitalize, debounce, extractIdFromUrl } from "../utils.js";

const BERRY_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

const FLAVOR_NAMES = {
  spicy: 0, dry: 1, sweet: 2, bitter: 3, sour: 4,
};

export async function renderBerries(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Berries</h1>
        <p class="page-subtitle">Browse all berries with their flavors and effects.</p>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" id="berry-search" placeholder="Search berries...">
      </div>
      <div id="berry-results"></div>
    </div>
  `;

  const resultsEl = document.getElementById("berry-results");
  resultsEl.innerHTML = '<div class="loading-center"><div class="loading-spinner"></div><span class="loading-text">Loading berries...</span></div>';

  try {
    const allBerries = await getAllBerries();
    let displayed = 0;
    const PAGE = 30;
    let filtered = allBerries;
    const berryCache = new Map();

    async function enrichBerry(berry) {
      if (berryCache.has(berry.name)) return berryCache.get(berry.name);
      try {
        const id = extractIdFromUrl(berry.url);
        const data = await getBerry(id);
        const info = {
          name: berry.name,
          id: id,
          maxHarvest: data.max_harvest,
          growthTime: data.growth_time,
          naturalGiftPower: data.natural_gift_power,
          naturalGiftType: data.natural_gift_type?.name,
          size: data.size,
          smoothness: data.smoothness,
          soilDryness: data.soil_dryness,
          firmness: data.firmness?.name,
          flavors: data.flavors || [],
          sprite: `${BERRY_SPRITE_BASE}/${berry.name}-berry.png`,
        };
        berryCache.set(berry.name, info);
        return info;
      } catch (e) {
        const info = { name: berry.name, sprite: `${BERRY_SPRITE_BASE}/${berry.name}-berry.png`, flavors: [] };
        berryCache.set(berry.name, info);
        return info;
      }
    }

    function applyFilters() {
      const q = document.getElementById("berry-search").value.toLowerCase();
      filtered = allBerries.filter((b) => b.name.includes(q));
      displayed = 0;
      renderBerriesList();
    }

    function renderBerriesList() {
      const toShow = filtered.slice(0, displayed + PAGE);
      displayed = toShow.length;

      resultsEl.innerHTML = `
        <div class="list-grid">
          ${toShow.map((berry) => {
            const cached = berryCache.get(berry.name);
            const flavors = cached?.flavors || [];
            const dominantFlavor = flavors.length > 0
              ? flavors.reduce((max, f) => f.potency > max.potency ? f : max, flavors[0])
              : null;
            return `
              <div class="list-item" data-name="${berry.name}">
                <div class="list-item-header">
                  <img src="${cached?.sprite || `${BERRY_SPRITE_BASE}/${berry.name}-berry.png`}" 
                    alt="${berry.name}" style="width:32px; height:32px; image-rendering:pixelated;" loading="lazy"
                    onerror="this.style.display='none'">
                  <span class="list-item-name">${capitalize(berry.name)}</span>
                  <span class="list-item-id">#${cached?.id || ""}</span>
                </div>
                <div class="list-item-desc">
                  ${cached?.growthTime ? `Growth: ${cached.growthTime}h` : ""}
                  ${cached?.firmness ? ` | Firmness: ${capitalize(cached.firmness)}` : ""}
                  ${dominantFlavor && dominantFlavor.potency > 0 ? ` | ${capitalize(dominantFlavor.flavor.name)}` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
        ${displayed < filtered.length ? `
          <div class="loading-center">
            <button class="btn btn-secondary" id="load-more-berries">Load more (${filtered.length - displayed} remaining)</button>
          </div>
        ` : ""}
      `;

      const loadMore = document.getElementById("load-more-berries");
      if (loadMore) loadMore.addEventListener("click", renderBerriesList);

      resultsEl.querySelectorAll(".list-item").forEach((item) => {
        item.addEventListener("click", () => {
          const name = item.getAttribute("data-name");
          showBerryDetail(name, berryCache);
        });
      });
    }

    document.getElementById("berry-search").addEventListener("input", debounce(applyFilters, 200));

    renderBerriesList();

    const enrichBatch = allBerries.map((b) => enrichBerry(b));
    Promise.all(enrichBatch).then(() => renderBerriesList());
  } catch (err) {
    resultsEl.innerHTML = `<div class="error-state"><h3>Failed to load berries</h3><p>${err.message}</p></div>`;
  }
}

async function showBerryDetail(name, cache) {
  const modalContainer = document.getElementById("modal-container");
  let info = cache.get(name);
  if (!info) {
    try {
      const data = await getBerry(name);
      info = {
        name: name,
        maxHarvest: data.max_harvest,
        growthTime: data.growth_time,
        naturalGiftPower: data.natural_gift_power,
        naturalGiftType: data.natural_gift_type?.name,
        size: data.size,
        smoothness: data.smoothness,
        soilDryness: data.soil_dryness,
        firmness: data.firmness?.name,
        flavors: data.flavors || [],
        sprite: `${BERRY_SPRITE_BASE}/${name}-berry.png`,
      };
    } catch (e) {
      info = { name, flavors: [], sprite: `${BERRY_SPRITE_BASE}/${name}-berry.png` };
    }
  }

  const flavors = info.flavors || [];
  const maxPotency = Math.max(...flavors.map((f) => f.potency), 1);

  modalContainer.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${capitalize(name)} Berry</span>
          <button class="modal-close" onclick="document.getElementById('modal-container').innerHTML=''">&times;</button>
        </div>
        <div class="modal-body">
          <div style="text-align:center; margin-bottom:1rem;">
            <img src="${info.sprite}" alt="${name}" style="width:64px; height:64px; image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div class="info-grid mb-4">
            ${info.maxHarvest != null ? `<div class="info-card"><div class="info-card-title">Max Harvest</div><div class="info-card-value">${info.maxHarvest}</div></div>` : ""}
            ${info.growthTime != null ? `<div class="info-card"><div class="info-card-title">Growth Time</div><div class="info-card-value">${info.growthTime}h</div></div>` : ""}
            ${info.size != null ? `<div class="info-card"><div class="info-card-title">Size</div><div class="info-card-value">${info.size}mm</div></div>` : ""}
            ${info.smoothness != null ? `<div class="info-card"><div class="info-card-title">Smoothness</div><div class="info-card-value">${info.smoothness}</div></div>` : ""}
            ${info.firmness ? `<div class="info-card"><div class="info-card-title">Firmness</div><div class="info-card-value">${capitalize(info.firmness)}</div></div>` : ""}
            ${info.soilDryness != null ? `<div class="info-card"><div class="info-card-title">Soil Dryness</div><div class="info-card-value">${info.soilDryness}</div></div>` : ""}
            ${info.naturalGiftPower ? `<div class="info-card"><div class="info-card-title">Natural Gift Power</div><div class="info-card-value">${info.naturalGiftPower}</div></div>` : ""}
            ${info.naturalGiftType ? `<div class="info-card"><div class="info-card-title">Natural Gift Type</div><div class="info-card-value"><span class="type-badge type-${info.naturalGiftType}">${info.naturalGiftType}</span></div></div>` : ""}
          </div>
          ${flavors.length > 0 ? `
            <div class="section-title" style="font-size:1rem;">Flavor Profile</div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
              ${flavors.map((f) => `
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <span style="width:80px; font-size:0.85rem; text-transform:capitalize;">${f.flavor.name}</span>
                  <div class="stat-bar-container" style="flex:1;">
                    <div class="stat-bar" style="width:${(f.potency / maxPotency) * 100}%; background:var(--accent);"></div>
                  </div>
                  <span style="font-weight:700; font-variant-numeric:tabular-nums; width:40px; text-align:right;">${f.potency}</span>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelector(".modal-backdrop").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      modalContainer.innerHTML = "";
    }
  });
}
