import { getAllAbilities, getAbility } from "../api.js";
import { capitalize, getEffectText, debounce, extractIdFromUrl } from "../utils.js";
import { getOfficialArtwork } from "../data.js";

export async function renderAbilities(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Abilities</h1>
        <p class="page-subtitle">Browse all Pokemon abilities and their effects.</p>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" id="ability-search" placeholder="Search abilities...">
      </div>
      <div id="ability-results"></div>
    </div>
  `;

  const resultsEl = document.getElementById("ability-results");
  resultsEl.innerHTML = '<div class="loading-center"><div class="loading-spinner"></div><span class="loading-text">Loading abilities...</span></div>';

  try {
    const allAbilities = await getAllAbilities();
    const realAbilities = allAbilities.filter((a) => !a.name.includes("-") && !a.name.startsWith("tm"));
    let displayed = 0;
    const PAGE = 30;
    let filtered = realAbilities;
    const abilityCache = new Map();

    async function enrichAbility(ability) {
      if (abilityCache.has(ability.name)) return abilityCache.get(ability.name);
      try {
        const id = extractIdFromUrl(ability.url);
        const data = await getAbility(id);
        const info = {
          name: ability.name,
          id: id,
          effect: getEffectText(data.effect_entries),
          shortEffect: getEffectText(data.effect_entries, true),
          pokemon: data.pokemon || [],
          generation: data.generation?.name || "",
        };
        abilityCache.set(ability.name, info);
        return info;
      } catch (e) {
        const info = { name: ability.name, effect: "", pokemon: [] };
        abilityCache.set(ability.name, info);
        return info;
      }
    }

    function renderAbilitiesList() {
      const toShow = filtered.slice(0, displayed + PAGE);
      displayed = toShow.length;

      resultsEl.innerHTML = `
        <div id="ability-list">
          ${toShow.map((a) => {
            const cached = abilityCache.get(a.name);
            return `
              <div class="ability-item" data-name="${a.name}">
                <div class="ability-name">${capitalize(a.name)}</div>
                ${cached ? `<div class="ability-effect">${cached.shortEffect || cached.effect || "Loading..."}</div>` : '<div class="ability-effect text-tertiary">Loading...</div>'}
                ${cached && cached.pokemon.length > 0 ? `<div class="text-tertiary mt-2" style="font-size:0.75rem;">${cached.pokemon.length} Pokemon have this ability</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>
        ${displayed < filtered.length ? `
          <div class="loading-center">
            <button class="btn btn-secondary" id="load-more-abilities">Load more (${filtered.length - displayed} remaining)</button>
          </div>
        ` : ""}
      `;

      const loadMore = document.getElementById("load-more-abilities");
      if (loadMore) loadMore.addEventListener("click", renderAbilitiesList);

      resultsEl.querySelectorAll(".ability-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const name = item.getAttribute("data-name");
          showAbilityDetail(name, abilityCache);
        });
      });
    }

    function applySearch() {
      const q = document.getElementById("ability-search").value.toLowerCase();
      filtered = realAbilities.filter((a) => a.name.includes(q));
      displayed = 0;
      renderAbilitiesList();
    }

    document.getElementById("ability-search").addEventListener("input", debounce(applySearch, 200));

    renderAbilitiesList();

    const enrichBatch = realAbilities.slice(0, 60).map((a) => enrichAbility(a));
    Promise.all(enrichBatch).then(() => {
      renderAbilitiesList();
      const nextBatch = realAbilities.slice(60, 200).map((a) => enrichAbility(a));
      Promise.all(nextBatch).then(() => renderAbilitiesList());
    });
  } catch (err) {
    resultsEl.innerHTML = `<div class="error-state"><h3>Failed to load abilities</h3><p>${err.message}</p></div>`;
  }
}

async function showAbilityDetail(name, cache) {
  const modalContainer = document.getElementById("modal-container");
  let info = cache.get(name);
  if (!info) {
    const ability = { name, url: `https://pokeapi.co/api/v2/ability/${name}` };
    info = await enrichAndReturn(ability);
  }

  const pokemonList = info.pokemon || [];
  modalContainer.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${capitalize(name)}</span>
          <button class="modal-close" onclick="document.getElementById('modal-container').innerHTML=''">&times;</button>
        </div>
        <div class="modal-body">
          <p class="text-secondary mb-4" style="font-size:0.9rem;">${info.effect || info.shortEffect || "No effect data available."}</p>
          ${info.generation ? `<p class="text-tertiary mb-4" style="font-size:0.8rem;">Introduced in ${capitalize(info.generation).replace("generation-", "Gen ")}</p>` : ""}
          <div class="section-title" style="font-size:1rem;">Pokemon with this ability (${pokemonList.length})</div>
          <div class="pokemon-picker-grid">
            ${pokemonList.slice(0, 100).map((p) => {
              const id = extractIdFromUrl(p.pokemon.url);
              const isHidden = p.is_hidden;
              return `
                <div class="picker-item" data-id="${id}">
                  <img src="${getOfficialArtwork(id)}" alt="${p.pokemon.name}" loading="lazy"
                    onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png'">
                  <span class="picker-item-name">${capitalize(p.pokemon.name)}</span>
                  ${isHidden ? '<span class="ability-hidden">Hidden</span>' : ""}
                </div>
              `;
            }).join("")}
          </div>
          ${pokemonList.length > 100 ? `<p class="text-tertiary text-center mt-4" style="font-size:0.8rem;">+${pokemonList.length - 100} more</p>` : ""}
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

async function enrichAndReturn(ability) {
  try {
    const id = extractIdFromUrl(ability.url);
    const data = await getAbility(id);
    return {
      name: ability.name,
      id: id,
      effect: getEffectText(data.effect_entries),
      shortEffect: getEffectText(data.effect_entries, true),
      pokemon: data.pokemon || [],
      generation: data.generation?.name || "",
    };
  } catch (e) {
    return { name: ability.name, effect: "", pokemon: [] };
  }
}
