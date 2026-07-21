import { store } from "../store.js";
import { getAllPokemonRefs, getPokemon } from "../api.js";
import { capitalize, formatId, debounce } from "../utils.js";
import { getOfficialArtwork, TYPE_COLORS, TYPE_LIST } from "../data.js";

export async function renderFavorites(container) {
  const favIds = store.getFavorites();

  if (favIds.length === 0) {
    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">Favorites</h1>
          <p class="page-subtitle">Your favorited Pokemon will appear here.</p>
        </div>
        <div class="empty-state">
          <div class="empty-state-icon">&#9825;</div>
          <h3>No favorites yet</h3>
          <p>Click the heart icon on any Pokemon to add it to your favorites.</p>
          <a href="#/" class="btn mt-4">Browse Pokemon</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Favorites</h1>
        <p class="page-subtitle">${favIds.length} Pokemon saved. <button class="btn btn-danger btn-sm" id="clear-favs" style="margin-left:0.5rem;">Clear All</button></p>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" id="fav-search" placeholder="Search favorites...">
        <select class="select-input" id="fav-sort">
          <option value="id">Number</option>
          <option value="name">Name</option>
        </select>
      </div>
      <div class="filter-chips" id="fav-type-filters"></div>
      <div id="fav-results-info" class="text-secondary mt-2" style="font-size:0.85rem;"></div>
      <div id="fav-grid" class="pokemon-grid mt-4"></div>
    </div>
  `;

  const refs = await getAllPokemonRefs();
  const favRefs = favIds.map((id) => refs.find((r) => r.id === id)).filter(Boolean);

  let currentTypes = new Set();
  let currentSearch = "";
  let currentSort = "id";

  const typeFilters = document.getElementById("fav-type-filters");
  TYPE_LIST.forEach((type) => {
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

  const cachedTypes = new Map();

  async function enrichFav(pokemonRef) {
    if (cachedTypes.has(pokemonRef.id)) return cachedTypes.get(pokemonRef.id);
    try {
      const data = await getPokemon(pokemonRef.id);
      const types = data.types.map((t) => t.type.name);
      cachedTypes.set(pokemonRef.id, types);
      return types;
    } catch (e) {
      cachedTypes.set(pokemonRef.id, []);
      return [];
    }
  }

  function applyFilters() {
    let filtered = favRefs;
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter((p) => p.name.includes(q) || String(p.id) === q);
    }
    if (currentTypes.size > 0) {
      filtered = filtered.filter((p) => {
        const types = cachedTypes.get(p.id);
        return types && types.some((t) => currentTypes.has(t));
      });
    }
    if (currentSort === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => a.id - b.id);
    }

    renderGrid(filtered);
  }

  function renderGrid(list) {
    const grid = document.getElementById("fav-grid");
    const info = document.getElementById("fav-results-info");

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>No favorites match your filters.</p></div>`;
      info.textContent = "No matches.";
      return;
    }

    info.textContent = `Showing ${list.length} of ${favRefs.length} favorites`;

    grid.innerHTML = list.map((p) => {
      const isFav = store.isFavorite(p.id);
      const types = cachedTypes.get(p.id) || [];
      const typeColors = types.map((t) => TYPE_COLORS[t] || "#64748b");
      const bg = typeColors.length === 1
        ? `linear-gradient(135deg, ${typeColors[0]}22, ${typeColors[0]}08)`
        : `linear-gradient(135deg, ${typeColors[0]}22, ${typeColors[1]}08)`;
      return `
        <div class="pokemon-card" data-id="${p.id}">
          <button class="fav-btn ${isFav ? "active" : ""}" data-id="${p.id}">${isFav ? "\u2665" : "\u2661"}</button>
          <div class="pokemon-card-bg" style="background:${bg};"></div>
          <div class="pokemon-card-sprite-container">
            <img class="pokemon-card-sprite" src="${getOfficialArtwork(p.id)}" alt="${p.name}" loading="lazy"
              onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
          </div>
          <div class="pokemon-card-info">
            <span class="pokemon-card-number">${formatId(p.id)}</span>
            <span class="pokemon-card-name">${capitalize(p.name)}</span>
            <div class="pokemon-card-types">
              ${types.map((t) => `<span class="type-badge type-${t}">${t}</span>`).join("")}
            </div>
          </div>
        </div>
      `;
    }).join("");

    grid.querySelectorAll(".pokemon-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("fav-btn")) return;
        const id = card.getAttribute("data-id");
        window.location.hash = `#/pokemon/${id}`;
      });
      const favBtn = card.querySelector(".fav-btn");
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(favBtn.getAttribute("data-id"));
        const isFav = store.toggleFavorite(id);
        favBtn.classList.toggle("active", isFav);
        favBtn.textContent = isFav ? "\u2665" : "\u2661";
        if (!isFav) {
          card.style.transition = "opacity 0.3s";
          card.style.opacity = "0.3";
        }
      });
    });
  }

  document.getElementById("fav-search").addEventListener("input", debounce((e) => {
    currentSearch = e.target.value;
    applyFilters();
  }, 200));

  document.getElementById("fav-sort").addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFilters();
  });

  document.getElementById("clear-favs").addEventListener("click", () => {
    if (confirm("Remove all favorites?")) {
      store.getFavorites().forEach((id) => {
        if (store.isFavorite(id)) store.toggleFavorite(id);
      });
      renderFavorites(container);
    }
  });

  applyFilters();

  favRefs.forEach((r) => enrichFav(r));
  Promise.all(favRefs.map((r) => enrichFav(r))).then(() => applyFilters());
}
