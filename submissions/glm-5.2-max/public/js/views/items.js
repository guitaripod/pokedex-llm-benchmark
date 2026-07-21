import { getAllItems, getItem } from "../api.js";
import { capitalize, debounce, extractIdFromUrl, getEffectText } from "../utils.js";

const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

export async function renderItems(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Items</h1>
        <p class="page-subtitle">Browse all items from the Pokemon games.</p>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" id="item-search" placeholder="Search items...">
        <select class="select-input" id="item-category-filter">
          <option value="">All Categories</option>
        </select>
      </div>
      <div id="item-results"></div>
    </div>
  `;

  const resultsEl = document.getElementById("item-results");
  resultsEl.innerHTML = '<div class="loading-center"><div class="loading-spinner"></div><span class="loading-text">Loading items...</span></div>';

  try {
    const allItems = await getAllItems();
    let displayed = 0;
    const PAGE = 60;
    let filtered = allItems;
    const itemCache = new Map();
    let currentSearch = "";
    const categories = new Set();

    async function enrichItem(item) {
      if (itemCache.has(item.name)) return itemCache.get(item.name);
      try {
        const id = extractIdFromUrl(item.url);
        const data = await getItem(id);
        const info = {
          name: item.name,
          id: id,
          cost: data.cost,
          flingPower: data.fling_power,
          effect: getEffectText(data.effect_entries),
          shortEffect: getEffectText(data.effect_entries, true),
          category: data.category?.name || "unknown",
          sprite: data.sprites?.default || `${ITEM_SPRITE_BASE}/${item.name}.png`,
        };
        itemCache.set(item.name, info);
        if (info.category && !categories.has(info.category)) {
          categories.add(info.category);
        }
        return info;
      } catch (e) {
        const info = {
          name: item.name,
          id: extractIdFromUrl(item.url),
          category: "unknown",
          sprite: `${ITEM_SPRITE_BASE}/${item.name}.png`,
          effect: "",
        };
        itemCache.set(item.name, info);
        return info;
      }
    }

    function applyFilters() {
      currentSearch = document.getElementById("item-search").value.toLowerCase();
      const cat = document.getElementById("item-category-filter").value;
      filtered = allItems.filter((item) => {
        if (currentSearch && !item.name.includes(currentSearch)) return false;
        if (cat) {
          const cached = itemCache.get(item.name);
          if (!cached || cached.category !== cat) return false;
        }
        return true;
      });
      displayed = 0;
      renderItemsList();
    }

    function renderItemsList() {
      const toShow = filtered.slice(0, displayed + PAGE);
      displayed = toShow.length;

      resultsEl.innerHTML = `
        <div class="pokemon-grid" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));">
          ${toShow.map((item) => {
            const cached = itemCache.get(item.name);
            return `
              <div class="pokemon-card" data-name="${item.name}">
                <div class="pokemon-card-sprite-container" style="min-height:80px;">
                  <img class="pokemon-card-sprite" style="width:64px; height:64px; image-rendering:pixelated;" 
                    src="${cached?.sprite || `${ITEM_SPRITE_BASE}/${item.name}.png`}" 
                    alt="${item.name}" loading="lazy"
                    onerror="this.style.opacity='0.2'">
                </div>
                <div class="pokemon-card-info">
                  <span class="pokemon-card-name" style="font-size:0.8rem;">${capitalize(item.name)}</span>
                  ${cached?.cost ? `<span class="pokemon-card-number">${cached.cost} &#8381;</span>` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
        ${displayed < filtered.length ? `
          <div class="loading-center">
            <button class="btn btn-secondary" id="load-more-items">Load more (${filtered.length - displayed} remaining)</button>
          </div>
        ` : ""}
      `;

      const loadMore = document.getElementById("load-more-items");
      if (loadMore) loadMore.addEventListener("click", renderItemsList);

      resultsEl.querySelectorAll(".pokemon-card").forEach((card) => {
        card.addEventListener("click", () => {
          const name = card.getAttribute("data-name");
          showItemDetail(name, itemCache);
        });
      });
    }

    document.getElementById("item-search").addEventListener("input", debounce(applyFilters, 200));

    renderItemsList();

    const enrichBatch = allItems.slice(0, 120).map((item) => enrichItem(item));
    Promise.all(enrichBatch).then(() => {
      updateCategoryFilter();
      applyFilters();
      const nextBatch = allItems.slice(120, 400).map((item) => enrichItem(item));
      Promise.all(nextBatch).then(() => {
        updateCategoryFilter();
        applyFilters();
      });
    });

    function updateCategoryFilter() {
      const select = document.getElementById("item-category-filter");
      const current = select.value;
      const sortedCats = [...categories].sort();
      select.innerHTML = `<option value="">All Categories</option>` +
        sortedCats.map((c) => `<option value="${c}">${capitalize(c).replace(/-/g, " ")}</option>`).join("");
      select.value = current;
      select.addEventListener("change", applyFilters);
    }
  } catch (err) {
    resultsEl.innerHTML = `<div class="error-state"><h3>Failed to load items</h3><p>${err.message}</p></div>`;
  }
}

async function showItemDetail(name, cache) {
  const modalContainer = document.getElementById("modal-container");
  let info = cache.get(name);
  if (!info) {
    try {
      const data = await getItem(name);
      info = {
        name: name,
        cost: data.cost,
        flingPower: data.fling_power,
        effect: getEffectText(data.effect_entries),
        shortEffect: getEffectText(data.effect_entries, true),
        category: data.category?.name || "unknown",
        sprite: data.sprites?.default || `${ITEM_SPRITE_BASE}/${name}.png`,
        flingEffect: data.fling_effect?.name,
      };
    } catch (e) {
      info = { name, effect: "Failed to load.", sprite: `${ITEM_SPRITE_BASE}/${name}.png` };
    }
  }

  modalContainer.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${capitalize(name).replace(/-/g, " ")}</span>
          <button class="modal-close" onclick="document.getElementById('modal-container').innerHTML=''">&times;</button>
        </div>
        <div class="modal-body">
          <div style="text-align:center; margin-bottom:1rem;">
            <img src="${info.sprite}" alt="${name}" style="width:80px; height:80px; image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div class="info-grid mb-4">
            ${info.category ? `<div class="info-card"><div class="info-card-title">Category</div><div class="info-card-value">${capitalize(info.category).replace(/-/g, " ")}</div></div>` : ""}
            ${info.cost != null ? `<div class="info-card"><div class="info-card-title">Cost</div><div class="info-card-value">${info.cost} &#8381;</div></div>` : ""}
            ${info.flingPower != null ? `<div class="info-card"><div class="info-card-title">Fling Power</div><div class="info-card-value">${info.flingPower}</div></div>` : ""}
            ${info.flingEffect ? `<div class="info-card"><div class="info-card-title">Fling Effect</div><div class="info-card-value">${capitalize(info.flingEffect).replace(/-/g, " ")}</div></div>` : ""}
          </div>
          ${info.shortEffect ? `<p class="text-secondary mb-4" style="font-size:0.9rem;">${info.shortEffect}</p>` : ""}
          ${info.effect ? `<p class="text-tertiary" style="font-size:0.85rem;">${info.effect}</p>` : ""}
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
