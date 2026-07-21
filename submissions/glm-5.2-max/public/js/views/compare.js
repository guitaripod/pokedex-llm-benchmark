import { getCompositePokemon, getAllPokemonRefs } from "../api.js";
import { capitalize, formatId, formatHeight, formatWeight, getStatColor, getStatBarWidth, getTypeColor } from "../utils.js";
import {
  getOfficialArtwork, TYPE_COLORS, STAT_NAMES, STAT_KEYS,
  TYPE_LIST, getGenById,
} from "../data.js";

export async function renderCompare(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Compare Pokemon</h1>
        <p class="page-subtitle">Side-by-side comparison of two Pokemon.</p>
      </div>
      <div class="compare-container">
        <div class="compare-panel" id="panel-left">
          <button class="btn btn-secondary" id="pick-left">Select Pokemon</button>
        </div>
        <div class="compare-vs">VS</div>
        <div class="compare-panel" id="panel-right">
          <button class="btn btn-secondary" id="pick-right">Select Pokemon</button>
        </div>
      </div>
    </div>
  `;

  let leftPokemon = null;
  let rightPokemon = null;

  document.getElementById("pick-left").addEventListener("click", () => {
    openPokemonPicker("left");
  });
  document.getElementById("pick-right").addEventListener("click", () => {
    openPokemonPicker("right");
  });

  async function openPokemonPicker(side) {
    const modalContainer = document.getElementById("modal-container");
    const refs = await getAllPokemonRefs();

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal" style="max-width:700px;">
          <div class="modal-header">
            <span class="modal-title">Select Pokemon</span>
            <button class="modal-close" onclick="document.getElementById('modal-container').innerHTML=''">&times;</button>
          </div>
          <div class="modal-body">
            <input type="text" class="search-input mb-4" id="picker-search" placeholder="Search by name or number...">
            <div class="pokemon-picker-grid" id="picker-grid">
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

    const searchInput = document.getElementById("picker-search");
    const grid = document.getElementById("picker-grid");

    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const q = e.target.value.toLowerCase();
        const filtered = refs.filter((p) => p.name.includes(q) || String(p.id) === q).slice(0, 200);
        grid.innerHTML = filtered.map((p) => `
          <div class="picker-item" data-id="${p.id}">
            <img src="${getOfficialArtwork(p.id)}" alt="${p.name}" loading="lazy"
              onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
            <span class="picker-item-name">${capitalize(p.name)}</span>
          </div>
        `).join("");
        attachPickerClicks();
      }, 200);
    });

    function attachPickerClicks() {
      grid.querySelectorAll(".picker-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const id = item.getAttribute("data-id");
          modalContainer.innerHTML = "";
          const data = await loadPokemonData(id);
          if (side === "left") leftPokemon = data;
          else rightPokemon = data;
          renderComparison();
        });
      });
    }
    attachPickerClicks();

    modalContainer.querySelector(".modal-backdrop").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) {
        modalContainer.innerHTML = "";
      }
    });
  }

  async function loadPokemonData(id) {
    const composite = await getCompositePokemon(id);
    return composite;
  }

  function renderComparison() {
    const leftPanel = document.getElementById("panel-left");
    const rightPanel = document.getElementById("panel-right");

    if (leftPokemon) renderPanel(leftPanel, leftPokemon, "left");
    else leftPanel.innerHTML = `<button class="btn btn-secondary" id="pick-left">Select Pokemon</button>`;
    if (rightPokemon) renderPanel(rightPanel, rightPokemon, "right");
    else rightPanel.innerHTML = `<button class="btn btn-secondary" id="pick-right">Select Pokemon</button>`;

    document.getElementById("pick-left")?.addEventListener("click", () => openPokemonPicker("left"));
    document.getElementById("pick-right")?.addEventListener("click", () => openPokemonPicker("right"));

    if (leftPokemon && rightPokemon) {
      renderStatComparison(leftPokemon.pokemon, rightPokemon.pokemon);
    }
  }

  function renderPanel(panel, composite, side) {
    const p = composite.pokemon;
    const types = p.types.map((t) => t.type.name);
    const stats = {};
    p.stats.forEach((s) => stats[s.stat.name] = s.base_stat);
    const total = STAT_KEYS.reduce((sum, k) => sum + (stats[k] || 0), 0);

    panel.innerHTML = `
      <div style="position:relative;">
        <button class="modal-close" style="position:absolute; top:-0.5rem; right:-0.5rem; z-index:5;" id="clear-${side}">&times;</button>
        <img src="${getOfficialArtwork(p.id)}" alt="${p.name}" style="width:160px; height:160px; margin:0 auto; display:block; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.2));">
        <h2 class="detail-name" style="font-size:1.5rem; margin-top:0.5rem;">${capitalize(p.name)}</h2>
        <span class="detail-id" style="color:var(--text-tertiary);">${formatId(p.id)}</span>
        <div class="detail-types" style="justify-content:center; margin-top:0.5rem;">
          ${types.map((t) => `<span class="type-badge type-${t}">${t}</span>`).join("")}
        </div>
        <div class="info-grid mt-4" style="text-align:left;">
          <div class="info-card"><div class="info-card-title">Height</div><div class="info-card-value">${formatHeight(p.height)}</div></div>
          <div class="info-card"><div class="info-card-title">Weight</div><div class="info-card-value">${formatWeight(p.weight)}</div></div>
          <div class="info-card"><div class="info-card-title">Base XP</div><div class="info-card-value">${p.base_experience || "—"}</div></div>
          <div class="info-card"><div class="info-card-title">Total Stats</div><div class="info-card-value">${total}</div></div>
        </div>
        <div style="text-align:left; margin-top:1rem;">
          <div class="info-card-title">Abilities</div>
          <div style="font-size:0.85rem; margin-top:0.3rem;">
            ${p.abilities.map((a) => capitalize(a.ability.name) + (a.is_hidden ? " (Hidden)" : "")).join(", ")}
          </div>
        </div>
      </div>
    `;

    document.getElementById(`clear-${side}`).addEventListener("click", () => {
      if (side === "left") leftPokemon = null;
      else rightPokemon = null;
      renderComparison();
    });
  }

  function renderStatComparison(left, right) {
    const leftStats = {};
    left.stats.forEach((s) => leftStats[s.stat.name] = s.base_stat);
    const rightStats = {};
    right.stats.forEach((s) => rightStats[s.stat.name] = s.base_stat);
    const leftTotal = STAT_KEYS.reduce((sum, k) => sum + (leftStats[k] || 0), 0);
    const rightTotal = STAT_KEYS.reduce((sum, k) => sum + (rightStats[k] || 0), 0);
    const maxStat = 200;

    const compareEl = document.createElement("div");
    compareEl.id = "stat-comparison";
    compareEl.className = "mt-4";
    compareEl.innerHTML = `
      <div class="section-title"><span class="section-title-bar"></span>Stat Comparison</div>
      <div class="info-card">
        ${STAT_KEYS.map((key) => {
          const lv = leftStats[key] || 0;
          const rv = rightStats[key] || 0;
          const leftWidth = getStatBarWidth(lv, maxStat);
          const rightWidth = getStatBarWidth(rv, maxStat);
          const leftColor = getStatColor(lv);
          const rightColor = getStatColor(rv);
          const leftWin = lv > rv;
          const rightWin = rv > lv;
          return `
            <div class="compare-stat-row">
              <div>
                <div class="compare-stat-value" style="color:${leftColor}; ${leftWin ? "font-weight:800;" : ""}">${lv}</div>
                <div class="compare-stat-bar left" style="width:${leftWidth}%; background:${leftColor};"></div>
              </div>
              <div>
                <div class="compare-stat-label">${STAT_NAMES[key]}</div>
              </div>
              <div>
                <div class="compare-stat-value" style="color:${rightColor}; ${rightWin ? "font-weight:800;" : ""}">${rv}</div>
                <div class="compare-stat-bar right" style="width:${rightWidth}%; background:${rightColor};"></div>
              </div>
            </div>
          `;
        }).join("")}
        <div class="compare-stat-row" style="border-top: 1px solid var(--border-color); padding-top:0.6rem;">
          <div>
            <div class="compare-stat-value" style="font-weight:800; ${leftTotal > rightTotal ? "color:var(--success);" : ""}">${leftTotal}</div>
          </div>
          <div class="compare-stat-label" style="font-weight:700;">Total</div>
          <div>
            <div class="compare-stat-value" style="font-weight:800; ${rightTotal > leftTotal ? "color:var(--success);" : ""}">${rightTotal}</div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById("stat-comparison");
    if (existing) existing.remove();
    container.querySelector(".page").appendChild(compareEl);
  }
}
