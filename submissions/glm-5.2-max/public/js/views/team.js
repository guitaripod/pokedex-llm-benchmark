import { store } from "../store.js";
import { getAllPokemonRefs, getCompositePokemon, getType } from "../api.js";
import { capitalize, formatId } from "../utils.js";
import { getOfficialArtwork, TYPE_COLORS, TYPE_LIST } from "../data.js";

export async function renderTeam(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Team Builder</h1>
        <p class="page-subtitle">Build your team and analyze type coverage and weaknesses.</p>
      </div>

      <div class="toolbar">
        <select class="select-input" id="team-select"></select>
        <button class="btn btn-secondary btn-sm" id="create-team-btn">+ New Team</button>
        <button class="btn btn-danger btn-sm" id="delete-team-btn">Delete</button>
        <button class="btn btn-secondary btn-sm" id="clear-team-btn">Clear All</button>
      </div>

      <div class="team-builder">
        <div>
          <div class="section-title"><span class="section-title-bar"></span>Your Team (<span id="team-count">0</span>/6)</div>
          <div class="team-slots" id="team-slots"></div>
        </div>
        <div>
          <div class="team-coverage" id="coverage-panel">
            <div class="section-title" style="font-size:1rem;"><span class="section-title-bar"></span>Type Coverage</div>
            <p class="text-tertiary" style="font-size:0.8rem;">Add Pokemon to see your team's defensive type matchups.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  function updateTeamSelect() {
    const select = document.getElementById("team-select");
    const teamNames = store.getTeamNames();
    const current = store.getCurrentTeamName();
    select.innerHTML = teamNames.map((name) =>
      `<option value="${name}" ${name === current ? "selected" : ""}>${capitalize(name)}</option>`
    ).join("");
    select.onchange = (e) => {
      store.setCurrentTeam(e.target.value);
      renderTeamSlots();
      renderCoverage();
    };
  }

  document.getElementById("create-team-btn").addEventListener("click", () => {
    const name = prompt("Enter team name:");
    if (name && name.trim()) {
      if (store.createTeam(name.trim().toLowerCase())) {
        updateTeamSelect();
        renderTeamSlots();
        renderCoverage();
      } else {
        alert("Team already exists!");
      }
    }
  });

  document.getElementById("delete-team-btn").addEventListener("click", () => {
    const name = store.getCurrentTeamName();
    if (name === "default") {
      alert("Cannot delete the default team.");
      return;
    }
    if (confirm(`Delete team "${capitalize(name)}"?`)) {
      store.deleteTeam(name);
      updateTeamSelect();
      renderTeamSlots();
      renderCoverage();
    }
  });

  document.getElementById("clear-team-btn").addEventListener("click", () => {
    if (confirm("Clear all Pokemon from this team?")) {
      store.clearTeam();
      renderTeamSlots();
      renderCoverage();
    }
  });

  function renderTeamSlots() {
    const slots = document.getElementById("team-slots");
    const team = store.getCurrentTeam();
    document.getElementById("team-count").textContent = team.length;

    let html = "";
    for (let i = 0; i < 6; i++) {
      const member = team[i];
      if (member) {
        const typeColors = member.types.map((t) => TYPE_COLORS[t] || "#64748b");
        const bg = typeColors.length === 1
          ? `linear-gradient(135deg, ${typeColors[0]}22, ${typeColors[0]}08)`
          : `linear-gradient(135deg, ${typeColors[0]}22, ${typeColors[1]}08)`;
        html += `
          <div class="team-slot filled" data-id="${member.id}" style="background:${bg};">
            <button class="team-slot-remove" data-remove="${member.id}">&times;</button>
            <img class="team-slot-sprite" src="${getOfficialArtwork(member.id)}" alt="${member.name}" loading="lazy"
              onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.id}.png'">
            <span class="pokemon-card-name">${capitalize(member.name)}</span>
            <div class="pokemon-card-types">
              ${member.types.map((t) => `<span class="type-badge type-badge-sm type-${t}">${t}</span>`).join("")}
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="team-slot">
            <span class="team-slot-empty">+ Add Pokemon</span>
          </div>
        `;
      }
    }
    slots.innerHTML = html;

    slots.querySelectorAll(".team-slot.filled").forEach((slot) => {
      slot.addEventListener("click", (e) => {
        if (e.target.classList.contains("team-slot-remove")) {
          e.stopPropagation();
          const id = parseInt(e.target.getAttribute("data-remove"));
          store.removeFromTeam(id);
          renderTeamSlots();
          renderCoverage();
          return;
        }
        const id = slot.getAttribute("data-id");
        window.location.hash = `#/pokemon/${id}`;
      });
    });

    slots.querySelectorAll(".team-slot:not(.filled)").forEach((slot) => {
      slot.addEventListener("click", () => openTeamPicker());
    });
  }

  async function openTeamPicker() {
    const modalContainer = document.getElementById("modal-container");
    const refs = await getAllPokemonRefs();

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal" style="max-width:700px;">
          <div class="modal-header">
            <span class="modal-title">Add Pokemon to Team</span>
            <button class="modal-close" onclick="document.getElementById('modal-container').innerHTML=''">&times;</button>
          </div>
          <div class="modal-body">
            <input type="text" class="search-input mb-4" id="team-picker-search" placeholder="Search...">
            <div class="pokemon-picker-grid" id="team-picker-grid">
              ${refs.slice(0, 200).map((p) => `
                <div class="picker-item" data-id="${p.id}">
                  <img src="${getOfficialArtwork(p.id)}" alt="${p.name}" loading="lazy"
                    onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
                  <span class="picker-item-name">${capitalize(p.name)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    const searchInput = document.getElementById("team-picker-search");
    const grid = document.getElementById("team-picker-grid");

    let timeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const q = e.target.value.toLowerCase();
        const filtered = refs.filter((p) => p.name.includes(q) || String(p.id) === q).slice(0, 200);
        grid.innerHTML = filtered.map((p) => `
          <div class="picker-item" data-id="${p.id}">
            <img src="${getOfficialArtwork(p.id)}" alt="${p.name}" loading="lazy"
              onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
            <span class="picker-item-name">${capitalize(p.name)}</span>
          </div>
        `).join("");
        attachClicks();
      }, 200);
    });

    function attachClicks() {
      grid.querySelectorAll(".picker-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const id = parseInt(item.getAttribute("data-id"));
          const composite = await getCompositePokemon(id);
          const types = composite.pokemon.types.map((t) => t.type.name);
          const added = store.addToTeam({ id, name: composite.pokemon.name, types });
          if (added) {
            modalContainer.innerHTML = "";
            renderTeamSlots();
            renderCoverage();
          } else {
            const team = store.getCurrentTeam();
            if (team.length >= 6) {
              alert("Team is full! Remove a Pokemon first.");
            } else {
              alert("This Pokemon is already on your team.");
            }
          }
        });
      });
    }
    attachClicks();

    modalContainer.querySelector(".modal-backdrop").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) {
        modalContainer.innerHTML = "";
      }
    });
  }

  async function renderCoverage() {
    const team = store.getCurrentTeam();
    const panel = document.getElementById("coverage-panel");

    if (team.length === 0) {
      panel.innerHTML = `
        <div class="section-title" style="font-size:1rem;"><span class="section-title-bar"></span>Type Coverage</div>
        <p class="text-tertiary" style="font-size:0.8rem;">Add Pokemon to see your team's defensive type matchups.</p>
      `;
      return;
    }

    panel.innerHTML = `
      <div class="section-title" style="font-size:1rem;"><span class="section-title-bar"></span>Defensive Coverage</div>
      <div class="loading-center" style="padding:1rem;"><div class="loading-spinner" style="width:20px;height:20px;"></div></div>
    `;

    const teamTypeData = await Promise.all(
      team.map(async (member) => {
        const composite = await getCompositePokemon(member.id);
        const types = composite.pokemon.types.map((t) => t.type.name);
        const typeDetails = await Promise.all(types.map((t) => getType(t)));
        return { member, types, typeDetails };
      }),
    );

    const coverage = {};
    TYPE_LIST.forEach((t) => {
      coverage[t] = { weak: 0, resist: 0, immune: 0, neutral: 0 };
    });

    for (const { types, typeDetails } of teamTypeData) {
      for (const atkType of TYPE_LIST) {
        let mult = 1;
        for (const td of typeDetails) {
          const dmg = td.damage_relations;
          if (dmg.double_damage_from.some((d) => d.name === atkType)) mult *= 2;
          if (dmg.half_damage_from.some((d) => d.name === atkType)) mult *= 0.5;
          if (dmg.no_damage_from.some((d) => d.name === atkType)) mult *= 0;
        }
        if (mult === 0) coverage[atkType].immune++;
        else if (mult > 1) coverage[atkType].weak++;
        else if (mult < 1) coverage[atkType].resist++;
        else coverage[atkType].neutral++;
      }
    }

    const teamSize = team.length;

    panel.innerHTML = `
      <div class="section-title" style="font-size:1rem;"><span class="section-title-bar"></span>Defensive Coverage</div>
      <p class="text-tertiary mb-4" style="font-size:0.75rem;">How your team of ${teamSize} handles each attacking type.</p>
      ${TYPE_LIST.map((t) => {
        const c = coverage[t];
        const weakPct = (c.weak / teamSize) * 100;
        const resistPct = (c.resist / teamSize) * 100;
        const immunePct = (c.immune / teamSize) * 100;
        const weakColor = weakPct > 50 ? "var(--danger)" : weakPct > 0 ? "#f97316" : "var(--success)";
        return `
          <div class="coverage-row">
            <span class="type-badge type-badge-sm type-${t} coverage-type">${t}</span>
            <div class="coverage-bar">
              <div class="coverage-bar-fill" style="width:${weakPct}%; background:var(--danger);"></div>
            </div>
            <span class="coverage-value" style="color:${weakColor};">
              ${c.weak > 0 ? `${c.weak} weak` : c.resist === teamSize ? "All resist" : c.immune === teamSize ? "All immune" : "OK"}
            </span>
          </div>
        `;
      }).join("")}
      <div class="mt-4" style="font-size:0.75rem; color:var(--text-tertiary); line-height:1.5;">
        <span style="color:var(--danger);">&#9632;</span> = % of team weak to this type<br>
        <span style="color:var(--accent);">&#9632;</span> = % of team that resists
      </div>
    `;
  }

  updateTeamSelect();
  renderTeamSlots();
  renderCoverage();
}
