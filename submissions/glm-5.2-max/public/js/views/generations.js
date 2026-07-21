import { getGeneration, getAllPokemonRefs } from "../api.js";
import { capitalize, extractIdFromUrl } from "../utils.js";
import { GENERATIONS, getOfficialArtwork, TYPE_COLORS } from "../data.js";

export async function renderGenerations(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Generations</h1>
        <p class="page-subtitle">Explore Pokemon by generation. Click a generation to see its Pokemon.</p>
      </div>
      <div id="gen-content">
        <div class="loading-center"><div class="loading-spinner"></div><span class="loading-text">Loading generations...</span></div>
      </div>
    </div>
  `;

  const content = document.getElementById("gen-content");

  try {
    const genData = await Promise.all(
      GENERATIONS.map((g) => getGeneration(g.id)),
    );

    content.innerHTML = `
      <div class="list-grid">
        ${genData.map((gen) => {
          const id = gen.id;
          const name = capitalize(gen.name).replace("generation-", "Generation ");
          const region = gen.main_region ? capitalize(gen.main_region.name) : "Unknown";
          const pokemonCount = gen.pokemon_species?.length || 0;
          const moveCount = gen.moves?.length || 0;
          const abilityCount = gen.abilities?.length || 0;
          const typeCount = gen.types?.length || 0;

          return `
            <div class="list-item" data-gen="${id}">
              <div class="list-item-header">
                <span class="list-item-name" style="font-size:1.1rem;">${name}</span>
                <span class="list-item-id">Gen ${id}</span>
              </div>
              <div class="list-item-desc">
                <strong>Region:</strong> ${region}<br>
                <strong>Pokemon:</strong> ${pokemonCount}<br>
                <strong>Moves:</strong> ${moveCount} | <strong>Abilities:</strong> ${abilityCount}<br>
                <strong>Types:</strong> ${typeCount}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div id="gen-pokemon-display" class="mt-4"></div>
    `;

    content.querySelectorAll(".list-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const genId = parseInt(item.getAttribute("data-gen"));
        await showGenerationPokemon(genId, genData);
      });
    });

    showGenerationPokemon(1, genData);
  } catch (err) {
    content.innerHTML = `<div class="error-state"><h3>Failed to load generations</h3><p>${err.message}</p></div>`;
  }
}

async function showGenerationPokemon(genId, genData) {
  const display = document.getElementById("gen-pokemon-display");
  if (!display) return;

  const gen = genData.find((g) => g.id === genId);
  if (!gen) return;

  display.innerHTML = '<div class="loading-center"><div class="loading-spinner"></div><span class="loading-text">Loading Pokemon...</span></div>';

  const species = gen.pokemon_species || [];
  const sortedSpecies = species.sort((a, b) => extractIdFromUrl(a.url) - extractIdFromUrl(b.url));

  display.innerHTML = `
    <div class="section-title"><span class="section-title-bar"></span>${capitalize(gen.name).replace("generation-", "Generation ")} - ${sortedSpecies.length} Pokemon</div>
    <div class="pokemon-grid">
      ${sortedSpecies.slice(0, 100).map((s) => {
        const id = extractIdFromUrl(s.url);
        return `
          <div class="pokemon-card" data-id="${id}">
            <div class="pokemon-card-bg" style="background:var(--bg-tertiary);"></div>
            <div class="pokemon-card-sprite-container">
              <img class="pokemon-card-sprite" src="${getOfficialArtwork(id)}" alt="${s.name}" loading="lazy"
                onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png'">
            </div>
            <div class="pokemon-card-info">
              <span class="pokemon-card-number">#${String(id).padStart(4, "0")}</span>
              <span class="pokemon-card-name">${capitalize(s.name)}</span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
    ${sortedSpecies.length > 100 ? `
      <div class="loading-center">
        <button class="btn btn-secondary" id="show-all-gen">Show all ${sortedSpecies.length} Pokemon</button>
      </div>
    ` : ""}
  `;

  display.querySelectorAll(".pokemon-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      window.location.hash = `#/pokemon/${id}`;
    });
  });

  const showAll = document.getElementById("show-all-gen");
  if (showAll) {
    showAll.addEventListener("click", () => {
      display.innerHTML = `
        <div class="section-title"><span class="section-title-bar"></span>${capitalize(gen.name).replace("generation-", "Generation ")} - ${sortedSpecies.length} Pokemon</div>
        <div class="pokemon-grid">
          ${sortedSpecies.map((s) => {
            const id = extractIdFromUrl(s.url);
            return `
              <div class="pokemon-card" data-id="${id}">
                <div class="pokemon-card-bg" style="background:var(--bg-tertiary);"></div>
                <div class="pokemon-card-sprite-container">
                  <img class="pokemon-card-sprite" src="${getOfficialArtwork(id)}" alt="${s.name}" loading="lazy"
                    onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png'">
                </div>
                <div class="pokemon-card-info">
                  <span class="pokemon-card-number">#${String(id).padStart(4, "0")}</span>
                  <span class="pokemon-card-name">${capitalize(s.name)}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
      display.querySelectorAll(".pokemon-card").forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.getAttribute("data-id");
          window.location.hash = `#/pokemon/${id}`;
        });
      });
    });
  }
}
