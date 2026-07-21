import { store } from "../store.js";
import { getAllPokemonRefs, getPokemon, getSpecies } from "../api.js";
import { capitalize, debounce, getTypeColor, formatId } from "../utils.js";
import {
  getOfficialArtwork,
  TYPE_LIST,
  TYPE_COLORS,
  GENERATIONS,
  getGenById,
  TOTAL_POKEMON,
} from "../data.js";

const PAGE_SIZE = 60;

export async function renderPokedex(container) {
  container.innerHTML = `
    <div class="page">
      <div id="featured-container"></div>
      <div class="page-header">
        <h1 class="page-title">National Pokedex</h1>
        <p class="page-subtitle">Explore all ${TOTAL_POKEMON} Pokemon</p>
      </div>
      <div class="quick-actions">
        <button class="quick-action" id="random-pokemon">
          <span class="quick-action-icon">&#127922;</span> Random Pokemon
        </button>
        <a href="#/types" class="quick-action">
          <span class="quick-action-icon">&#9878;</span> Type Chart
        </a>
        <a href="#/compare" class="quick-action">
          <span class="quick-action-icon">&#9878;</span> Compare
        </a>
        <a href="#/team" class="quick-action">
          <span class="quick-action-icon">&#129464;</span> Build a Team
        </a>
      </div>
      <div class="toolbar" id="dex-toolbar">
        <input type="text" class="search-input" id="dex-search" placeholder="Search by name or number...">
        <select class="select-input" id="sort-select">
          <option value="id-asc">Number &#8593;</option>
          <option value="id-desc">Number &#8595;</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="hp">HP</option>
          <option value="attack">Attack</option>
          <option value="defense">Defense</option>
          <option value="special-attack">Sp. Atk</option>
          <option value="special-defense">Sp. Def</option>
          <option value="speed">Speed</option>
          <option value="total">Total Stats</option>
        </select>
      </div>
      <div class="filter-chips" id="type-filters"></div>
      <div class="gen-filter mt-2" id="gen-filters"></div>
      <div id="results-info" class="text-secondary mt-2" style="font-size:0.85rem;"></div>
      <div id="pokemon-grid" class="pokemon-grid mt-4"></div>
      <div id="loading-more" class="loading-center hidden">
        <div class="loading-spinner"></div>
        <span class="loading-text">Loading more...</span>
      </div>
    </div>
  `;

  loadFeatured();
  setupFilters(container);

  const refs = await getAllPokemonRefs();
  let filtered = [...refs];
  let displayed = 0;
  let isLoadingMore = false;
  let currentSort = "id-asc";
  let currentTypes = new Set();
  let currentGen = null;
  let currentSearch = "";
  let cachedStats = new Map();

  function applyFilters() {
    let result = refs;

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      if (/^\d+$/.test(q)) {
        const id = parseInt(q);
        result = result.filter((p) => p.id === id);
      } else {
        result = result.filter((p) => p.name.startsWith(q) || p.name.includes(q));
      }
    }

    if (currentGen) {
      result = result.filter((p) => {
        const gen = getGenById(p.id);
        return gen.id === currentGen;
      });
    }

    if (currentTypes.size > 0) {
      result = result.filter((p) => cachedTypesCache.has(p.id) && 
        cachedTypesCache.get(p.id).some(t => currentTypes.has(t))
      );
    }

    if (currentSort.startsWith("id-")) {
      result.sort((a, b) => currentSort === "id-asc" ? a.id - b.id : b.id - a.id);
    } else if (currentSort.startsWith("name-")) {
      result.sort((a, b) => currentSort === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } else {
      const statKey = currentSort;
      const totalMode = statKey === "total";
      result.sort((a, b) => {
        const aStats = cachedStats.get(a.id);
        const bStats = cachedStats.get(b.id);
        if (!aStats && !bStats) return 0;
        if (!aStats) return 1;
        if (!bStats) return -1;
        if (totalMode) {
          return bStats.total - aStats.total;
        }
        return (bStats[statKey] || 0) - (aStats[statKey] || 0);
      });
    }

    filtered = result;
    displayed = 0;
    document.getElementById("pokemon-grid").innerHTML = "";
    renderResultsInfo();
    loadMore();
  }

  function renderResultsInfo() {
    const info = document.getElementById("results-info");
    if (filtered.length === 0) {
      info.textContent = "No Pokemon found.";
    } else {
      info.textContent = `Showing ${Math.min(displayed, filtered.length)} of ${filtered.length} Pokemon`;
    }
  }

  async function loadMore() {
    if (isLoadingMore || displayed >= filtered.length) return;
    isLoadingMore = true;
    const loadingEl = document.getElementById("loading-more");
    if (displayed > 0) loadingEl.classList.remove("hidden");

    const toLoad = filtered.slice(displayed, displayed + PAGE_SIZE);
    displayed = Math.min(displayed + PAGE_SIZE, filtered.length);

    const grid = document.getElementById("pokemon-grid");

    for (const p of toLoad) {
      const card = createCard(p);
      grid.appendChild(card);
    }

    if (currentTypes.size > 0 || ["hp","attack","defense","special-attack","special-defense","speed","total"].includes(currentSort)) {
      await enrichCards(toLoad);
    }

    isLoadingMore = false;
    loadingEl.classList.add("hidden");
    renderResultsInfo();
  }

  function createCard(p) {
    const card = document.createElement("div");
    card.className = "pokemon-card";
    card.setAttribute("data-id", p.id);
    const isFav = store.isFavorite(p.id);
    card.innerHTML = `
      <button class="fav-btn ${isFav ? "active" : ""}" data-id="${p.id}">${isFav ? "\u2665" : "\u2661"}</button>
      <div class="pokemon-card-bg" style="background: var(--bg-tertiary);"></div>
      <div class="pokemon-card-sprite-container">
        <img class="pokemon-card-sprite skeleton" src="" alt="${p.name}" loading="lazy">
      </div>
      <div class="pokemon-card-info">
        <span class="pokemon-card-number">${formatId(p.id)}</span>
        <span class="pokemon-card-name">${capitalize(p.name)}</span>
        <div class="pokemon-card-types"></div>
      </div>
    `;
    const img = card.querySelector(".pokemon-card-sprite");
    img.src = getOfficialArtwork(p.id);
    img.onload = () => img.classList.remove("skeleton");
    img.onerror = () => {
      img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
      img.classList.remove("skeleton");
    };

    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("fav-btn")) return;
      window.location.hash = `#/pokemon/${p.id}`;
    });

    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const isFav = store.toggleFavorite(p.id);
      e.target.classList.toggle("active", isFav);
      e.target.textContent = isFav ? "\u2665" : "\u2661";
    });

    return card;
  }

  const cachedTypesCache = new Map();

  async function enrichCards(pokemonList) {
    const toFetch = pokemonList.filter(p => !cachedTypesCache.has(p.id) && !cachedStats.has(p.id));
    if (toFetch.length === 0) {
      updateCardsWithTypes();
      return;
    }
    const promises = toFetch.map(async (p) => {
      try {
        const data = await getPokemon(p.id);
        const types = data.types.map(t => t.type.name);
        cachedTypesCache.set(p.id, types);
        const stats = {};
        data.stats.forEach(s => {
          stats[s.stat.name] = s.base_stat;
        });
        stats.total = data.stats.reduce((sum, s) => sum + s.base_stat, 0);
        cachedStats.set(p.id, stats);
      } catch (e) {
        cachedTypesCache.set(p.id, []);
        cachedStats.set(p.id, {});
      }
    });
    await Promise.all(promises);
    updateCardsWithTypes();
  }

  function updateCardsWithTypes() {
    document.querySelectorAll(".pokemon-card").forEach(card => {
      const id = parseInt(card.getAttribute("data-id"));
      const types = cachedTypesCache.get(id);
      if (!types) return;
      const typesContainer = card.querySelector(".pokemon-card-types");
      typesContainer.innerHTML = types.map(t =>
        `<span class="type-badge type-${t}">${t}</span>`
      ).join("");
      const bg = card.querySelector(".pokemon-card-bg");
      if (types.length > 0) {
        const colors = types.map(t => TYPE_COLORS[t] || "#64748b");
        bg.style.background = colors.length === 1
          ? `linear-gradient(135deg, ${colors[0]}, ${colors[0]}88)`
          : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
      }
      card.style.setProperty("--type-color", types.length > 0 ? TYPE_COLORS[types[0]] : "var(--border-color)");
    });
  }

  function setupFilters(container) {
    const typeFilters = container.querySelector("#type-filters");
    TYPE_LIST.forEach(type => {
      const chip = document.createElement("button");
      chip.className = "filter-chip type-chip";
      chip.style.background = TYPE_COLORS[type];
      chip.style.setProperty("--type-color", TYPE_COLORS[type]);
      chip.textContent = capitalize(type);
      chip.addEventListener("click", () => {
        if (currentTypes.has(type)) {
          currentTypes.delete(type);
          chip.classList.remove("active");
        } else {
          currentTypes.add(type);
          chip.classList.add("active");
        }
        applyFilters();
      });
      typeFilters.appendChild(chip);
    });

    const genFilters = container.querySelector("#gen-filters");
    const allBtn = document.createElement("button");
    allBtn.className = "gen-btn active";
    allBtn.textContent = "All";
    allBtn.addEventListener("click", () => {
      currentGen = null;
      genFilters.querySelectorAll(".gen-btn").forEach(b => b.classList.remove("active"));
      allBtn.classList.add("active");
      applyFilters();
    });
    genFilters.appendChild(allBtn);

    GENERATIONS.forEach(gen => {
      const btn = document.createElement("button");
      btn.className = "gen-btn";
      btn.textContent = gen.name;
      btn.addEventListener("click", () => {
        currentGen = gen.id;
        genFilters.querySelectorAll(".gen-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilters();
      });
      genFilters.appendChild(btn);
    });

    const searchInput = container.querySelector("#dex-search");
    searchInput.addEventListener("input", debounce((e) => {
      currentSearch = e.target.value;
      applyFilters();
    }, 250));

    const sortSelect = container.querySelector("#sort-select");
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      if (["hp","attack","defense","special-attack","special-defense","speed","total"].includes(currentSort)) {
        enrichCards(refs).then(() => applyFilters());
      } else {
        applyFilters();
      }
    });

    const randomBtn = container.querySelector("#random-pokemon");
    randomBtn.addEventListener("click", () => {
      const id = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
      window.location.hash = `#/pokemon/${id}`;
    });
  }

  const scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoadingMore && displayed < filtered.length) {
      loadMore();
    }
  }, { rootMargin: "200px" });

  const sentinel = document.createElement("div");
  sentinel.id = "scroll-sentinel";
  sentinel.style.height = "1px";
  container.querySelector(".page").appendChild(sentinel);
  scrollObserver.observe(sentinel);

  applyFilters();
}

async function loadFeatured() {
  const container = document.getElementById("featured-container");
  if (!container) return;
  const day = Math.floor(Date.now() / 86400000);
  const id = (day % TOTAL_POKEMON) + 1;
  try {
    const data = await getPokemon(id);
    const species = await getSpecies(id);
    const types = data.types.map(t => t.type.name);
    const colors = types.map(t => TYPE_COLORS[t] || "#64748b");
    const gradient = colors.length === 1
      ? `linear-gradient(135deg, ${colors[0]}33, ${colors[0]}11)`
      : `linear-gradient(135deg, ${colors[0]}33, ${colors[1]}11)`;
    let flavor = "";
    if (species && species.flavor_text_entries) {
      const en = species.flavor_text_entries.find(e => e.language.name === "en");
      if (en) flavor = en.flavor_text.replace(/[\n\r\f]/g, " ").replace(/\u00ad/g, "");
    }
    container.innerHTML = `
      <div class="featured-card" style="background: ${gradient};">
        <div class="featured-sprite-section">
          <img class="featured-sprite" src="${getOfficialArtwork(id)}" alt="${data.name}" onclick="location.hash='#/pokemon/${id}'" style="cursor:pointer;">
        </div>
        <div class="featured-info">
          <span class="featured-label">Pokemon of the Day</span>
          <h2 class="featured-name">${capitalize(data.name)} <span class="text-tertiary" style="font-size:1rem;">${formatId(id)}</span></h2>
          <div class="featured-types">
            ${types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join("")}
          </div>
          <p class="featured-desc">${flavor}</p>
          <div class="mt-2">
            <a href="#/pokemon/${id}" class="btn btn-sm">View Details &#8594;</a>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = "";
  }
}
