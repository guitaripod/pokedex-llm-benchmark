import { store } from "../store.js";
import { getCompositePokemon, getSpecies, getEvolutionChain, getType, getMove, getLocationArea } from "../api.js";
import {
  capitalize, formatId, formatHeight, formatWeight,
  getFlavorText, getGenus, getEffectText, getStatColor, getStatBarWidth,
  getGenderRate, getCaptureRateColor, getFriendshipColor, getTypeColor,
  getTypeGradient, extractIdFromUrl, escapeHtml, debounce,
} from "../utils.js";
import {
  getOfficialArtwork, getDefaultSprite, getShinySprite,
  TYPE_COLORS, STAT_NAMES, STAT_KEYS, NATURES, GENERATIONS, getGenById,
  DAMAGE_CLASS_ICONS, TYPE_LIST,
} from "../data.js";

let currentShiny = false;
let currentPokemonData = null;
let currentSpeciesData = null;

export async function renderDetail(container, params) {
  const id = params.id;
  currentShiny = false;
  container.innerHTML = `
    <div class="loading-center" style="padding: 5rem;">
      <div class="loading-spinner" style="width:40px;height:40px;"></div>
      <span class="loading-text">Loading Pokemon...</span>
    </div>
  `;

  try {
    const composite = await getCompositePokemon(id);
    const pokemon = composite.pokemon;
    let species = composite.species;
    currentPokemonData = pokemon;
    currentSpeciesData = species;

    if (!species) {
      species = await getSpecies(id);
      currentSpeciesData = species;
    }

    renderFullDetail(container, pokemon, species);
  } catch (err) {
    container.innerHTML = `
      <div class="error-state">
        <h3>Failed to load Pokemon</h3>
        <p>${escapeHtml(err.message)}</p>
        <button class="btn mt-4" onclick="location.hash='/'">Go Home</button>
      </div>
    `;
  }
}

function renderFullDetail(container, pokemon, species) {
  const types = pokemon.types.map((t) => t.type.name);
  const typeColors = types.map((t) => TYPE_COLORS[t] || "#64748b");
  const gradient =
    typeColors.length === 1
      ? `linear-gradient(160deg, ${typeColors[0]}, ${typeColors[0]}88, ${typeColors[0]}33)`
      : `linear-gradient(160deg, ${typeColors[0]}, ${typeColors[1]}88, ${typeColors[0]}33)`;

  const flavorText = species ? getFlavorText(species.flavor_text_entries) : "";
  const genus = species ? getGenus(species.genera) : "";
  const isFav = store.isFavorite(pokemon.id);

  let pills = "";
  if (species) {
    if (species.is_legendary) pills += `<span class="pill pill-legendary">Legendary</span> `;
    if (species.is_mythical) pills += `<span class="pill pill-mythical">Mythical</span> `;
    if (species.is_baby) pills += `<span class="pill pill-baby">Baby</span> `;
  }
  if (pokemon.name.includes("mega")) pills += `<span class="pill pill-mega">Mega</span> `;

  const spriteUrl = currentShiny ? getShinySprite(pokemon.id) : getOfficialArtwork(pokemon.id);

  container.innerHTML = `
    <div class="detail-header" style="background: ${gradient};">
      <div class="detail-header-bg" style="background: radial-gradient(ellipse at center, ${typeColors[0]}44, transparent 70%);"></div>
      <div class="detail-header-content">
        <div class="detail-sprite-wrapper">
          <img class="detail-sprite ${currentShiny ? "shiny" : ""}" id="detail-sprite" src="${spriteUrl}" alt="${pokemon.name}">
        </div>
        <div class="detail-name-row">
          <h1 class="detail-name">${capitalize(pokemon.name)}</h1>
          <span class="detail-id">${formatId(pokemon.id)}</span>
        </div>
        <div class="detail-types">
          ${types.map((t) => `<span class="type-badge type-${t}">${t}</span>`).join("")}
        </div>
        ${genus ? `<p class="detail-genus">${genus}</p>` : ""}
        <div class="flex gap-2" style="justify-content:center; flex-wrap:wrap;">
          ${pills}
        </div>
        ${flavorText ? `<p class="detail-flavor">${flavorText}</p>` : ""}
        <div class="flex gap-2" style="justify-content:center; flex-wrap:wrap; margin-top:0.5rem;">
          <button class="btn btn-sm ${isFav ? "btn-danger" : "btn-secondary"}" id="detail-fav-btn">${isFav ? "\u2665 Favorited" : "\u2661 Favorite"}</button>
          <button class="btn btn-sm btn-secondary" id="shiny-toggle">${currentShiny ? "Shiny" : "Normal"} &#10024;</button>
          ${pokemon.cries && pokemon.cries.latest ? `<button class="btn btn-sm btn-secondary" id="cry-btn">&#128264; Cry</button>` : ""}
          <button class="btn btn-sm btn-secondary" id="add-team-btn">+ Team</button>
        </div>
      </div>
    </div>

    <nav class="detail-nav" id="detail-nav">
      <button class="detail-tab active" data-tab="about">About</button>
      <button class="detail-tab" data-tab="stats">Stats</button>
      <button class="detail-tab" data-tab="evolution">Evolution</button>
      <button class="detail-tab" data-tab="moves">Moves</button>
      <button class="detail-tab" data-tab="sprites">Sprites</button>
      <button class="detail-tab" data-tab="types">Defenses</button>
      <button class="detail-tab" data-tab="locations">Locations</button>
      ${pokemon.forms && pokemon.forms.length > 1 ? `<button class="detail-tab" data-tab="forms">Forms</button>` : ""}
    </nav>

    <div class="detail-content" id="detail-content"></div>
  `;

  setupDetailInteractions(container, pokemon, species);
  switchTab("about", pokemon, species);
}

function setupDetailInteractions(container, pokemon, species) {
  const favBtn = container.querySelector("#detail-fav-btn");
  favBtn.addEventListener("click", () => {
    const isFav = store.toggleFavorite(pokemon.id);
    favBtn.textContent = isFav ? "\u2665 Favorited" : "\u2661 Favorite";
    favBtn.classList.toggle("btn-danger", isFav);
    favBtn.classList.toggle("btn-secondary", !isFav);
  });

  const shinyToggle = container.querySelector("#shiny-toggle");
  shinyToggle.addEventListener("click", () => {
    currentShiny = !currentShiny;
    const sprite = container.querySelector("#detail-sprite");
    sprite.src = currentShiny ? getShinySprite(pokemon.id) : getOfficialArtwork(pokemon.id);
    sprite.classList.toggle("shiny", currentShiny);
    shinyToggle.innerHTML = `${currentShiny ? "Shiny" : "Normal"} &#10024;`;
  });

  const cryBtn = container.querySelector("#cry-btn");
  if (cryBtn && pokemon.cries) {
    const cryUrl = pokemon.cries.latest || pokemon.cries.legacy;
    if (cryUrl) {
      cryBtn.addEventListener("click", () => {
        const audio = new Audio(cryUrl);
        cryBtn.classList.add("playing");
        audio.play().catch(() => {});
        audio.addEventListener("ended", () => cryBtn.classList.remove("playing"));
        audio.addEventListener("error", () => cryBtn.classList.remove("playing"));
      });
    }
  }

  const teamBtn = container.querySelector("#add-team-btn");
  teamBtn.addEventListener("click", () => {
    const types = pokemon.types.map((t) => t.type.name);
    const added = store.addToTeam({
      id: pokemon.id,
      name: pokemon.name,
      types: types,
    });
    if (added) {
      import("../app.js").then((m) => m.toast(`${capitalize(pokemon.name)} added to team!`));
    } else {
      const team = store.getCurrentTeam();
      if (team.length >= 6) {
        import("../app.js").then((m) => m.toast("Team is full (6 max)."));
      } else {
        import("../app.js").then((m) => m.toast(`${capitalize(pokemon.name)} is already on your team.`));
      }
    }
  });

  const tabs = container.querySelectorAll(".detail-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      switchTab(tab.getAttribute("data-tab"), pokemon, species);
    });
  });
}

function switchTab(tab, pokemon, species) {
  const content = document.getElementById("detail-content");
  content.innerHTML = '<div class="loading-center"><div class="loading-spinner"></div></div>';

  switch (tab) {
    case "about":
      renderAboutTab(content, pokemon, species);
      break;
    case "stats":
      renderStatsTab(content, pokemon, species);
      break;
    case "evolution":
      renderEvolutionTab(content, pokemon, species);
      break;
    case "moves":
      renderMovesTab(content, pokemon);
      break;
    case "sprites":
      renderSpritesTab(content, pokemon);
      break;
    case "types":
      renderTypeDefensesTab(content, pokemon);
      break;
    case "locations":
      renderLocationsTab(content, pokemon);
      break;
    case "forms":
      renderFormsTab(content, pokemon);
      break;
  }
}

function renderAboutTab(content, pokemon, species) {
  const abilities = pokemon.abilities.map((a) => {
    return `<div class="ability-item">
      <div>
        <span class="ability-name">${capitalize(a.ability.name)}</span>
        ${a.is_hidden ? '<span class="ability-hidden">Hidden</span>' : ""}
        <span class="text-tertiary" style="font-size:0.75rem;">Slot ${a.slot}</span>
      </div>
    </div>`;
  }).join("");

  let speciesInfo = "";
  if (species) {
    const genderRate = getGenderRate(species.gender_rate);
    const captureRate = species.capture_rate || 0;
    const baseHappiness = species.base_happiness || 0;
    const eggGroups = species.egg_groups ? species.egg_groups.map((g) => capitalize(g.name)).join(", ") : "Unknown";
    const growthRate = species.growth_rate ? capitalize(species.growth_rate.name) : "Unknown";
    const habitat = species.habitat ? capitalize(species.habitat.name) : "Unknown";
    const color = species.color ? capitalize(species.color.name) : "Unknown";
    const shape = species.shape ? capitalize(species.shape.name) : "Unknown";
    const gen = species.generation ? capitalize(species.generation.name).replace("generation-", "Gen ") : "Unknown";
    const hatchCounter = species.hatch_counter ? `${species.hatch_counter * 256} steps` : "Unknown";

    speciesInfo = `
      <div class="info-card">
        <div class="info-card-title">Gender</div>
        <div class="info-card-value">${genderRate.label}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Capture Rate</div>
        <div class="info-card-value" style="color:${getCaptureRateColor(captureRate)};">${captureRate} / 255</div>
        <div class="info-card-sub">Higher = easier to catch</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Base Happiness</div>
        <div class="info-card-value" style="color:${getFriendshipColor(baseHappiness)};">${baseHappiness} / 255</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Egg Groups</div>
        <div class="info-card-value">${eggGroups}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Growth Rate</div>
        <div class="info-card-value">${growthRate}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Habitat</div>
        <div class="info-card-value">${habitat}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Color</div>
        <div class="info-card-value">${color}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Shape</div>
        <div class="info-card-value">${shape}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Generation</div>
        <div class="info-card-value">${gen}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Hatch Counter</div>
        <div class="info-card-value">${hatchCounter}</div>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="section-title"><span class="section-title-bar"></span>Basic Info</div>
    <div class="info-grid mb-4">
      <div class="info-card">
        <div class="info-card-title">National No.</div>
        <div class="info-card-value">${formatId(pokemon.id)}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Height</div>
        <div class="info-card-value">${formatHeight(pokemon.height)}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Weight</div>
        <div class="info-card-value">${formatWeight(pokemon.weight)}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Base Experience</div>
        <div class="info-card-value">${pokemon.base_experience || "—"}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Order</div>
        <div class="info-card-value">${pokemon.order}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Is Default Form</div>
        <div class="info-card-value">${pokemon.is_default ? "Yes" : "No"}</div>
      </div>
    </div>

    <div class="section-title"><span class="section-title-bar"></span>Abilities</div>
    <div class="mb-4">${abilities}</div>

    ${species ? `
    <div class="section-title"><span class="section-title-bar"></span>Species Info</div>
    <div class="info-grid mb-4">${speciesInfo}</div>
    ` : ""}

    ${pokemon.held_items && pokemon.held_items.length > 0 ? `
    <div class="section-title"><span class="section-title-bar"></span>Held Items</div>
    <div class="info-grid mb-4">
      ${pokemon.held_items.map((item) => `
        <div class="info-card">
          <div class="info-card-title">${capitalize(item.item.name)}</div>
          <div class="info-card-value">${item.version_details.map((v) => `${v.rarity}% in ${capitalize(v.version.name)}`).join(", ")}</div>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${species && species.flavor_text_entries ? `
    <div class="section-title"><span class="section-title-bar"></span>Pokedex Entries</div>
    <div class="info-grid mb-4">
      ${species.flavor_text_entries
        .filter((e) => e.language.name === "en")
        .slice(-5)
        .map((entry) => {
          const version = capitalize(entry.version.name).replace(/-/g, " ");
          return `<div class="info-card">
            <div class="info-card-title">${version}</div>
            <div class="info-card-value" style="font-size:0.9rem; font-weight:400; line-height:1.5;">${entry.flavor_text.replace(/[\n\r\f]/g, " ").replace(/\u00ad/g, "")}</div>
          </div>`;
        }).join("")}
    </div>
    ` : ""}
  `;
}

function renderStatsTab(content, pokemon, species) {
  const stats = {};
  pokemon.stats.forEach((s) => {
    stats[s.stat.name] = { base: s.base_stat, effort: s.effort };
  });
  const total = STAT_KEYS.reduce((sum, key) => sum + (stats[key]?.base || 0), 0);

  content.innerHTML = `
    <div class="section-title"><span class="section-title-bar"></span>Base Stats</div>
    <div class="info-card stats-section mb-4">
      ${STAT_KEYS.map((key) => {
        const base = stats[key]?.base || 0;
        const effort = stats[key]?.effort || 0;
        const width = getStatBarWidth(base, 200);
        const color = getStatColor(base);
        return `
          <div class="stat-row">
            <span class="stat-label">${STAT_NAMES[key]}</span>
            <div class="stat-bar-container">
              <div class="stat-bar" style="width:${width}%; background:${color};"></div>
            </div>
            <span class="stat-value">${base}</span>
          </div>
        `;
      }).join("")}
      <div class="stat-total">
        <span>Total</span>
        <span>${total}</span>
      </div>
    </div>

    <div class="section-title"><span class="section-title-bar"></span>EV Yield</div>
    <div class="info-grid mb-4">
      ${STAT_KEYS.map((key) => {
        const effort = stats[key]?.effort || 0;
        if (effort === 0) return "";
        return `<div class="info-card">
          <div class="info-card-title">${STAT_NAMES[key]} EV</div>
          <div class="info-card-value" style="color:${getStatColor(effort * 50, 255)};">+${effort}</div>
        </div>`;
      }).join("")}
    </div>

    <div class="section-title"><span class="section-title-bar"></span>Stat Calculator</div>
    <div class="stat-calculator">
      <div class="calc-row">
        <label>Level</label>
        <input type="number" class="calc-input" id="calc-level" value="50" min="1" max="100">
        <span></span>
      </div>
      <div class="calc-row">
        <label>Nature</label>
        <select class="select-input" id="calc-nature" style="width:auto;">
          ${NATURES.map((n) => {
            const label = n.increased && n.decreased
              ? `${capitalize(n.name)} (+${STAT_NAMES[n.increased]}, -${STAT_NAMES[n.decreased]})`
              : `${capitalize(n.name)} (Neutral)`;
            return `<option value="${n.name}">${label}</option>`;
          }).join("")}
        </select>
        <span></span>
      </div>
      <div id="calc-stats"></div>
    </div>
  `;

  function updateCalc() {
    const level = parseInt(document.getElementById("calc-level").value) || 50;
    const natureName = document.getElementById("calc-nature").value;
    const nature = NATURES.find((n) => n.name === natureName);
    const calcContainer = document.getElementById("calc-stats");

    calcContainer.innerHTML = STAT_KEYS.map((key) => {
      const base = stats[key]?.base || 0;
      const isHP = key === "hp";
      let natureMod = 1.0;
      if (!isHP) {
        if (nature.increased === key) natureMod = 1.1;
        if (nature.decreased === key) natureMod = 0.9;
      }
      const minIv = 0, maxIv = 31, minEv = 0, maxEv = 252;
      const minVal = isHP
        ? Math.floor(((2 * base + minIv) * level) / 100) + level + 10
        : Math.floor((Math.floor(((2 * base + minIv) * level) / 100) + 5) * natureMod);
      const maxVal = isHP
        ? Math.floor(((2 * base + maxIv + Math.floor(maxEv / 4)) * level) / 100) + level + 10
        : Math.floor((Math.floor(((2 * base + maxIv + Math.floor(maxEv / 4)) * level) / 100) + 5) * natureMod);

      return `
        <div class="calc-stat-row">
          <span class="calc-stat-label">${STAT_NAMES[key]}</span>
          <span class="text-tertiary" style="font-size:0.75rem;">${minVal}</span>
          <span class="text-tertiary" style="font-size:0.75rem;">${maxVal}</span>
          <div class="stat-bar-container">
            <div class="stat-bar" style="width:${getStatBarWidth(maxVal, isHP ? 700 : 500)}%; background:${getStatColor(base)};"></div>
          </div>
          <span class="calc-result" style="color:${getStatColor(base)};">${minVal}-${maxVal}</span>
        </div>
      `;
    }).join("") + `
      <div class="calc-stat-row" style="border-top: 1px solid var(--border-color); padding-top:0.6rem;">
        <span class="calc-stat-label" style="font-weight:800;">Range</span>
        <span></span>
        <span></span>
        <span style="font-size:0.7rem;color:var(--text-tertiary);">Min (0 IV/0 EV) - Max (31 IV/252 EV)</span>
        <span></span>
      </div>
    `;
  }

  document.getElementById("calc-level").addEventListener("input", updateCalc);
  document.getElementById("calc-nature").addEventListener("change", updateCalc);
  updateCalc();
}

async function renderEvolutionTab(content, pokemon, species) {
  if (!species || !species.evolution_chain) {
    content.innerHTML = `<div class="empty-state"><p>This Pokemon does not evolve.</p></div>`;
    return;
  }

  try {
    const chainId = extractIdFromUrl(species.evolution_chain.url);
    const chain = await getEvolutionChain(chainId);

    const stages = [];
    function processEvo(node, depth = 0) {
      if (!stages[depth]) stages[depth] = [];
      stages[depth].push(node);
      if (node.evolves_to && node.evolves_to.length > 0) {
        node.evolves_to.forEach((child) => processEvo(child, depth + 1));
      }
    }
    processEvo(chain.chain);

    const allSpecies = [];
    function collectSpecies(node) {
      allSpecies.push(node.species);
      if (node.evolves_to) node.evolves_to.forEach(collectSpecies);
    }
    collectSpecies(chain.chain);

    const pokemonIds = {};
    for (const s of allSpecies) {
      const sid = extractIdFromUrl(s.url);
      pokemonIds[s.name] = sid;
    }

    let html = '<div class="evolution-chain">';

    function renderNode(node, depth) {
      const id = pokemonIds[node.species.name];
      if (!id) return "";
      return `
        <div class="evolution-stage" data-id="${id}">
          <img class="evolution-sprite" src="${getOfficialArtwork(id)}" alt="${node.species.name}" loading="lazy"
            onerror="this.src='${getDefaultSprite(id)}'">
          <span class="evolution-name">${capitalize(node.species.name)}</span>
        </div>
      `;
    }

    function renderEvoDetails(details) {
      if (!details || details.length === 0) return "Unknown";
      const d = details[0];
      let parts = [];
      if (d.min_level) parts.push(`Level ${d.min_level}`);
      if (d.item) parts.push(`Use ${capitalize(d.item.name)}`);
      if (d.trigger && d.trigger.name === "trade") parts.push("Trade");
      if (d.trigger && d.trigger.name === "use-item") parts.push(`Use ${d.item ? capitalize(d.item.name) : "Item"}`);
      if (d.held_item) parts.push(`Holding ${capitalize(d.held_item.name)}`);
      if (d.time_of_day) parts.push(`During ${d.time_of_day}`);
      if (d.location) parts.push(`At ${capitalize(d.location.name)}`);
      if (d.min_happiness) parts.push("High Happiness");
      if (d.min_beauty) parts.push("High Beauty");
      if (d.min_affection) parts.push("High Affection");
      if (d.known_move) parts.push(`Knows ${capitalize(d.known_move.name)}`);
      if (d.known_move_type) parts.push(`Knows ${capitalize(d.known_move_type.name)} move`);
      if (d.gender) parts.push(d.gender === "female" ? "Female" : "Male");
      if (d.needs_overworld_rain) parts.push("In Rain");
      if (d.party_species) parts.push(`Party has ${capitalize(d.party_species.name)}`);
      if (d.party_type) parts.push(`Party has ${capitalize(d.party_type.name)} type`);
      if (d.relative_physical_stats !== null && d.relative_physical_stats !== undefined) {
        parts.push(d.relative_physical_stats > 0 ? "Atk > Def" : d.relative_physical_stats < 0 ? "Def > Atk" : "Atk = Def");
      }
      if (d.turn_upside_down) parts.push("Turn device upside down");
      if (d.trigger && d.trigger.name === "level-up" && parts.length === 0) parts.push("Level up");
      return parts.join(", ");
    }

    function renderChain(node) {
      let html = renderNode(node, 0);
      if (node.evolves_to && node.evolves_to.length > 0) {
        for (const child of node.evolves_to) {
          const condition = renderEvoDetails(child.evolution_details);
          html += `
            <div class="evolution-arrow">
              <span class="evolution-arrow-icon">&#8594;</span>
              <span class="evolution-condition">${condition}</span>
            </div>
          `;
          html += renderChain(child);
        }
      }
      return html;
    }

    html += renderChain(chain.chain);
    html += "</div>";

    content.innerHTML = html;

    content.querySelectorAll(".evolution-stage").forEach((stage) => {
      stage.addEventListener("click", () => {
        const id = stage.getAttribute("data-id");
        if (id && parseInt(id) !== pokemon.id) {
          window.location.hash = `#/pokemon/${id}`;
        }
      });
    });
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>Evolution data unavailable.</p></div>`;
  }
}

function renderMovesTab(content, pokemon) {
  const moves = pokemon.moves || [];
  if (moves.length === 0) {
    content.innerHTML = `<div class="empty-state"><p>No moves data available.</p></div>`;
    return;
  }

  content.innerHTML = `
    <div class="toolbar">
      <input type="text" class="search-input" id="moves-search" placeholder="Search moves...">
      <select class="select-input" id="moves-game-filter">
        <option value="">All Games</option>
      </select>
      <select class="select-input" id="moves-method-filter">
        <option value="">All Methods</option>
      </select>
    </div>
    <div id="moves-table-container" class="moves-table-container">
      <table class="moves-table">
        <thead>
          <tr>
            <th>Move</th>
            <th>Type</th>
            <th>Cat</th>
            <th>Pwr</th>
            <th>Acc</th>
            <th>PP</th>
            <th>Method</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody id="moves-tbody"></tbody>
      </table>
    </div>
  `;

  const allGames = new Set();
  const allMethods = new Set();

  const flatMoves = [];
  for (const move of moves) {
    for (const vg of move.version_group_details) {
      allGames.add(vg.version_group.name);
      allMethods.add(vg.move_learn_method.name);
      flatMoves.push({
        name: move.move.name,
        url: move.move.url,
        type: null,
        damageClass: null,
        power: null,
        accuracy: null,
        pp: null,
        game: vg.version_group.name,
        method: vg.move_learn_method.name,
        level: vg.level_learned_at,
      });
    }
  }

  const gameSelect = document.getElementById("moves-game-filter");
  [...allGames].sort().reverse().forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = capitalize(g).replace(/-/g, " ");
    gameSelect.appendChild(opt);
  });

  const methodSelect = document.getElementById("moves-method-filter");
  [...allMethods].sort().forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = capitalize(m).replace(/-/g, " ");
    methodSelect.appendChild(opt);
  });

  const moveCache = new Map();
  async function enrichMove(fm) {
    if (moveCache.has(fm.name)) {
      const data = moveCache.get(fm.name);
      fm.type = data.type;
      fm.damageClass = data.damageClass;
      fm.power = data.power;
      fm.accuracy = data.accuracy;
      fm.pp = data.pp;
      return;
    }
    try {
      const id = extractIdFromUrl(fm.url);
      const data = await getMove(id);
      const info = {
        type: data.type?.name,
        damageClass: data.damage_class?.name,
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
      };
      moveCache.set(fm.name, info);
      fm.type = info.type;
      fm.damageClass = info.damageClass;
      fm.power = info.power;
      fm.accuracy = info.accuracy;
      fm.pp = info.pp;
    } catch (e) {
      moveCache.set(fm.name, {});
    }
  }

  let displayed = 0;
  const PAGE = 50;
  let filtered = flatMoves;

  function applyMoveFilters() {
    const search = document.getElementById("moves-search").value.toLowerCase();
    const game = document.getElementById("moves-game-filter").value;
    const method = document.getElementById("moves-method-filter").value;

    filtered = flatMoves.filter((m) => {
      if (search && !m.name.includes(search)) return false;
      if (game && m.game !== game) return false;
      if (method && m.method !== method) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.method === b.method) return a.level - b.level;
      return a.method.localeCompare(b.method);
    });

    displayed = 0;
    renderMoves();
  }

  function renderMoves() {
    const tbody = document.getElementById("moves-tbody");
    const toShow = filtered.slice(0, displayed + PAGE);
    displayed = toShow.length;

    tbody.innerHTML = toShow.map((m) => `
      <tr>
        <td class="move-name">${capitalize(m.name)}</td>
        <td>${m.type ? `<span class="type-badge type-badge-sm type-${m.type}">${m.type}</span>` : '<span class="text-tertiary">—</span>'}</td>
        <td>${m.damageClass ? `<span class="move-damage-class">${DAMAGE_CLASS_ICONS[m.damageClass] || ""} ${m.damageClass}</span>` : '<span class="text-tertiary">—</span>'}</td>
        <td class="move-power">${m.power ?? "—"}</td>
        <td class="move-accuracy">${m.accuracy != null ? m.accuracy + "%" : "—"}</td>
        <td class="move-pp">${m.pp ?? "—"}</td>
        <td class="text-secondary" style="font-size:0.8rem;">${capitalize(m.method).replace(/-/g, " ")}</td>
        <td class="text-secondary" style="font-size:0.8rem;">${m.level > 0 ? m.level : "—"}</td>
      </tr>
    `).join("");

    if (displayed < filtered.length) {
      tbody.innerHTML += `<tr id="load-more-row"><td colspan="8" style="text-align:center; padding:1rem;">
        <button class="btn btn-sm btn-secondary" id="load-more-moves">Load more (${filtered.length - displayed} remaining)</button>
      </td></tr>`;
      const btn = document.getElementById("load-more-moves");
      if (btn) btn.addEventListener("click", () => { renderMoves(); });
    }
  }

  document.getElementById("moves-search").addEventListener("input", debounce(applyMoveFilters, 200));
  document.getElementById("moves-game-filter").addEventListener("change", applyMoveFilters);
  document.getElementById("moves-method-filter").addEventListener("change", applyMoveFilters);

  applyMoveFilters();

  const uniqueMoveNames = [...new Set(flatMoves.map((m) => m.name))];
  const toEnrich = uniqueMoveNames.slice(0, 100).map(async (name) => {
    const fm = flatMoves.find((m) => m.name === name);
    await enrichMove(fm);
  });
  Promise.all(toEnrich).then(() => {
    flatMoves.forEach((m) => {
      const cached = moveCache.get(m.name);
      if (cached) {
        m.type = cached.type;
        m.damageClass = cached.damageClass;
        m.power = cached.power;
        m.accuracy = cached.accuracy;
        m.pp = cached.pp;
      }
    });
    renderMoves();
  });
}

function renderSpritesTab(content, pokemon) {
  const sprites = pokemon.sprites || {};
  const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
  const id = pokemon.id;

  const spriteSets = [
    { label: "Official Artwork", url: `${SPRITE_BASE}/other/official-artwork/${id}.png` },
    { label: "Official Artwork (Shiny)", url: `${SPRITE_BASE}/other/official-artwork/shiny/${id}.png` },
    { label: "Default Front", url: `${SPRITE_BASE}/${id}.png` },
    { label: "Default Back", url: `${SPRITE_BASE}/back/${id}.png` },
    { label: "Shiny Front", url: `${SPRITE_BASE}/shiny/${id}.png` },
    { label: "Shiny Back", url: `${SPRITE_BASE}/back/shiny/${id}.png` },
  ];

  const versions = sprites.versions || {};
  const genSprites = [];
  for (const [genKey, genData] of Object.entries(versions)) {
    for (const [vgKey, vgData] of Object.entries(genData)) {
      if (vgData.front_default) {
        genSprites.push({
          label: `${capitalize(genKey).replace(/-/g, " ")} - ${capitalize(vgKey).replace(/-/g, " ")} Front`,
          url: vgData.front_default,
        });
      }
      if (vgData.front_shiny) {
        genSprites.push({
          label: `${capitalize(genKey).replace(/-/g, " ")} - ${capitalize(vgKey).replace(/-/g, " ")} Shiny`,
          url: vgData.front_shiny,
        });
      }
    }
  }

  const allSprites = [...spriteSets, ...genSprites].slice(0, 60);

  content.innerHTML = `
    <div class="section-title"><span class="section-title-bar"></span>All Sprites</div>
    <div class="sprites-grid">
      ${allSprites.map((s) => `
        <div class="sprite-tile">
          <img src="${s.url}" alt="${s.label}" loading="lazy"
            onerror="this.style.display='none'; this.parentElement.style.opacity='0.3';">
          <div class="sprite-tile-label">${s.label}</div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderTypeDefensesTab(content, pokemon) {
  const types = pokemon.types.map((t) => t.type.name);
  const typeData = await Promise.all(types.map((t) => getType(t)));

  const effectiveness = {};
  TYPE_LIST.forEach((t) => {
    effectiveness[t] = { from: 1, to: 1 };
  });

  for (const td of typeData) {
    const dmg = td.damage_relations;
    for (const rel of dmg.double_damage_from) {
      effectiveness[rel.name].from *= 2;
    }
    for (const rel of dmg.half_damage_from) {
      effectiveness[rel.name].from *= 0.5;
    }
    for (const rel of dmg.no_damage_from) {
      effectiveness[rel.name].from *= 0;
    }
    for (const rel of dmg.double_damage_to) {
      effectiveness[rel.name].to = Math.max(effectiveness[rel.name].to, 2);
    }
    for (const rel of dmg.half_damage_to) {
      if (effectiveness[rel.name].to === 1) effectiveness[rel.name].to = 0.5;
    }
    for (const rel of dmg.no_damage_to) {
      if (effectiveness[rel.name].to === 1) effectiveness[rel.name].to = 0;
    }
  }

  const weak = [];
  const resist = [];
  const immune = [];

  for (const [type, eff] of Object.entries(effectiveness)) {
    if (eff.from > 1) weak.push({ type, mult: eff.from });
    else if (eff.from > 0 && eff.from < 1) resist.push({ type, mult: eff.from });
    else if (eff.from === 0) immune.push({ type, mult: 0 });
  }

  weak.sort((a, b) => b.mult - a.mult);
  resist.sort((a, b) => b.mult - a.mult);

  function effClass(mult) {
    if (mult === 4) return "type-eff-4x";
    if (mult === 2) return "type-eff-2x";
    if (mult === 0.5) return "type-eff-half";
    if (mult === 0.25) return "type-eff-quarter";
    if (mult === 0) return "type-eff-0x";
    return "";
  }

  function effLabel(mult) {
    if (mult === 4) return "4x";
    if (mult === 2) return "2x";
    if (mult === 0.5) return "1/2x";
    if (mult === 0.25) return "1/4x";
    if (mult === 0) return "0x";
    return "1x";
  }

  content.innerHTML = `
    <div class="section-title"><span class="section-title-bar"></span>Type Defenses</div>
    <p class="text-secondary mb-4" style="font-size:0.85rem;">Damage taken when attacked by each type</p>

    ${weak.length > 0 ? `
    <div class="section-title" style="font-size:1rem;"><span class="section-title-bar" style="background:var(--danger);"></span>Weak To (${weak.length})</div>
    <div class="type-effectiveness-grid mb-4">
      ${weak.map((w) => `
        <div class="type-eff-card ${effClass(w.mult)}">
          <span class="type-badge type-${w.type}">${w.type}</span>
          <span class="type-eff-multiplier" style="color:var(--danger);">${effLabel(w.mult)}</span>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${resist.length > 0 ? `
    <div class="section-title" style="font-size:1rem;"><span class="section-title-bar" style="background:var(--accent);"></span>Resistant To (${resist.length})</div>
    <div class="type-effectiveness-grid mb-4">
      ${resist.map((r) => `
        <div class="type-eff-card ${effClass(r.mult)}">
          <span class="type-badge type-${r.type}">${r.type}</span>
          <span class="type-eff-multiplier" style="color:var(--accent);">${effLabel(r.mult)}</span>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${immune.length > 0 ? `
    <div class="section-title" style="font-size:1rem;"><span class="section-title-bar" style="background:var(--text-tertiary);"></span>Immune To (${immune.length})</div>
    <div class="type-effectiveness-grid mb-4">
      ${immune.map((i) => `
        <div class="type-eff-card ${effClass(i.mult)}">
          <span class="type-badge type-${i.type}">${i.type}</span>
          <span class="type-eff-multiplier" style="color:var(--text-tertiary);">${effLabel(i.mult)}</span>
        </div>
      `).join("")}
    </div>
    ` : ""}

    <div class="section-title"><span class="section-title-bar"></span>Offensive Coverage</div>
    <p class="text-secondary mb-4" style="font-size:0.85rem;">Damage dealt to each type</p>
    <div class="type-effectiveness-grid">
      ${Object.entries(effectiveness).map(([type, eff]) => {
        if (eff.to === 1) return "";
        const cls = eff.to === 2 ? "type-eff-2x" : eff.to === 0.5 ? "type-eff-half" : eff.to === 0 ? "type-eff-0x" : "";
        const color = eff.to === 2 ? "var(--success)" : eff.to === 0.5 ? "var(--accent)" : "var(--text-tertiary)";
        return `
          <div class="type-eff-card ${cls}">
            <span class="type-badge type-${type}">${type}</span>
            <span class="type-eff-multiplier" style="color:${color};">${effLabel(eff.to)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

async function renderLocationsTab(content, pokemon) {
  if (!pokemon.location_area_encounters) {
    content.innerHTML = `<div class="empty-state"><p>Location data unavailable.</p></div>`;
    return;
  }

  try {
    const encountersUrl = pokemon.location_area_encounters;
    const proxyPath = encountersUrl.replace("https://pokeapi.co/api/v2/", "/api/");
    const resp = await fetch(proxyPath);
    if (!resp.ok) throw new Error("Failed to load locations");
    const encounters = await resp.json();

    if (encounters.length === 0) {
      content.innerHTML = `<div class="empty-state"><p>This Pokemon cannot be found in the wild.</p></div>`;
      return;
    }

    const byVersion = {};
    for (const enc of encounters) {
      const areaName = capitalize(enc.location_area.name.replace(/-/g, " "));
      for (const det of enc.version_details) {
        const version = det.version.name;
        if (!byVersion[version]) byVersion[version] = [];
        const methods = det.encounter_details.map((d) =>
          `${capitalize(d.method.name.replace(/-/g, " "))} (Lv ${d.min_level}${d.max_level !== d.min_level ? `-${d.max_level}` : ""})`
        ).join(", ");
        byVersion[version].push({ area: areaName, methods, chance: det.max_chance });
      }
    }

    const sortedVersions = Object.entries(byVersion).sort((a, b) => a[0].localeCompare(b[0]));

    content.innerHTML = `
      <div class="section-title"><span class="section-title-bar"></span>Location Encounters</div>
      <div class="info-grid">
        ${sortedVersions.slice(0, 12).map(([version, areas]) => `
          <div class="info-card">
            <div class="info-card-title">${capitalize(version).replace(/-/g, " ")}</div>
            <div style="font-size:0.85rem; line-height:1.6;">
              ${areas.slice(0, 5).map((a) => `<div style="margin-bottom:0.4rem;"><strong>${a.area}</strong><br><span class="text-tertiary" style="font-size:0.75rem;">${a.methods}</span></div>`).join("")}
              ${areas.length > 5 ? `<div class="text-tertiary" style="font-size:0.75rem;">+${areas.length - 5} more locations</div>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>Location data unavailable.</p></div>`;
  }
}

function renderFormsTab(content, pokemon) {
  const forms = pokemon.forms || [];
  if (forms.length <= 1) {
    content.innerHTML = `<div class="empty-state"><p>No alternate forms.</p></div>`;
    return;
  }

  content.innerHTML = `
    <div class="section-title"><span class="section-title-bar"></span>Alternate Forms</div>
    <div class="pokemon-grid">
      ${forms.map((form) => {
        const formId = extractIdFromUrl(form.url);
        const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
        return `
          <div class="pokemon-card" data-url="${form.url}">
            <div class="pokemon-card-sprite-container">
              <img class="pokemon-card-sprite" src="${spriteUrl}" alt="${form.name}" loading="lazy">
            </div>
            <div class="pokemon-card-info">
              <span class="pokemon-card-name">${capitalize(form.name)}</span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}
