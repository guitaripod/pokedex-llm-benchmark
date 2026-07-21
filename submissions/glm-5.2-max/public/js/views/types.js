import { getType, getAllPokemonRefs } from "../api.js";
import { capitalize, getTypeColor } from "../utils.js";
import { TYPE_LIST, TYPE_COLORS, getOfficialArtwork } from "../data.js";

export async function renderTypes(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Type Chart</h1>
        <p class="page-subtitle">Full 18-type effectiveness matrix. Click a type for details.</p>
      </div>
      <div id="type-chart-content">
        <div class="loading-center"><div class="loading-spinner"></div><span class="loading-text">Loading type data...</span></div>
      </div>
    </div>
  `;

  const content = document.getElementById("type-chart-content");

  try {
    const typeData = await Promise.all(TYPE_LIST.map((t) => getType(t)));
    const typeMap = {};
    typeData.forEach((td) => {
      typeMap[td.name] = td.damage_relations;
    });

    renderTypeMatrix(content, typeMap);
  } catch (err) {
    content.innerHTML = `<div class="error-state"><h3>Failed to load type data</h3><p>${err.message}</p></div>`;
  }
}

function renderTypeMatrix(container, typeMap) {
  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="type-chart-table">
        <thead>
          <tr>
            <th style="position:sticky; left:0; z-index:3; background:var(--bg-secondary);">Defender &#8594;<br>Attacker &#8595;</th>
            ${TYPE_LIST.map((t) => `
              <th>
                <div class="type-chart-header-type">
                  <span class="type-badge type-badge-sm type-${t}" style="background:${TYPE_COLORS[t]};">${t}</span>
                </div>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          ${TYPE_LIST.map((atk) => `
            <tr>
              <td style="position:sticky; left:0; z-index:2; background:var(--bg-secondary);">
                <span class="type-badge type-badge-sm type-${atk}" style="background:${TYPE_COLORS[atk]};">${atk}</span>
              </td>
              ${TYPE_LIST.map((def) => {
                const dmg = typeMap[atk];
                let mult = 1;
                if (dmg.double_damage_to.some((d) => d.name === def)) mult *= 2;
                if (dmg.half_damage_to.some((d) => d.name === def)) mult *= 0.5;
                if (dmg.no_damage_to.some((d) => d.name === def)) mult *= 0;

                let cls = "tc-1";
                let label = "";
                if (mult === 4) { cls = "tc-4"; label = "4"; }
                else if (mult === 2) { cls = "tc-2"; label = "2"; }
                else if (mult === 0.5) { cls = "tc-half"; label = "1/2"; }
                else if (mult === 0.25) { cls = "tc-quarter"; label = "1/4"; }
                else if (mult === 0) { cls = "tc-0"; label = "0"; }

                return `<td><div class="type-chart-cell ${cls}" data-atk="${atk}" data-def="${def}">${label}</div></td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="section-title mt-4"><span class="section-title-bar"></span>Type Details</div>
    <div id="type-details" class="text-tertiary" style="font-size:0.85rem;">Click a cell in the chart to see details.</div>
  `;

  container.querySelectorAll(".type-chart-cell").forEach((cell) => {
    if (cell.classList.contains("tc-1")) return;
    cell.style.cursor = "pointer";
    cell.addEventListener("click", () => {
      const atk = cell.getAttribute("data-atk");
      const def = cell.getAttribute("data-def");
      const dmg = typeMap[atk];
      let mult = 1;
      if (dmg.double_damage_to.some((d) => d.name === def)) mult *= 2;
      if (dmg.half_damage_to.some((d) => d.name === def)) mult *= 0.5;
      if (dmg.no_damage_to.some((d) => d.name === def)) mult *= 0;

      const details = document.getElementById("type-details");
      details.innerHTML = `
        <div class="info-card">
          <div class="info-card-title">Matchup</div>
          <div class="info-card-value">
            <span class="type-badge type-${atk}">${atk}</span> attacks <span class="type-badge type-${def}">${def}</span>
          </div>
          <div class="info-card-sub" style="font-size:1rem; font-weight:700; margin-top:0.5rem; color:${mult > 1 ? "var(--danger)" : mult < 1 && mult > 0 ? "var(--accent)" : "var(--text-tertiary)"};">
            ${mult}x damage
          </div>
        </div>
      `;
    });
  });

  const detailsContainer = document.createElement("div");
  detailsContainer.innerHTML = `
    <div class="section-title mt-4"><span class="section-title-bar"></span>Individual Type Breakdown</div>
    <div class="list-grid" id="type-breakdown-grid">
      ${TYPE_LIST.map((t) => {
        const dmg = typeMap[t];
        const strong = dmg.double_damage_to.map((d) => `<span class="type-badge type-badge-sm type-${d.name}">${d.name}</span>`).join(" ");
        const weak = dmg.half_damage_to.map((d) => `<span class="type-badge type-badge-sm type-${d.name}">${d.name}</span>`).join(" ");
        const immune = dmg.no_damage_to.map((d) => `<span class="type-badge type-badge-sm type-${d.name}">${d.name}</span>`).join(" ");
        const weakTo = dmg.double_damage_from.map((d) => `<span class="type-badge type-badge-sm type-${d.name}">${d.name}</span>`).join(" ");
        const resistFrom = dmg.half_damage_from.map((d) => `<span class="type-badge type-badge-sm type-${d.name}">${d.name}</span>`).join(" ");
        const immuneFrom = dmg.no_damage_from.map((d) => `<span class="type-badge type-badge-sm type-${d.name}">${d.name}</span>`).join(" ");

        return `
          <div class="list-item">
            <div class="list-item-header">
              <span class="type-badge type-${t}">${t}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; font-size:0.8rem;">
              <div><strong>Strong against:</strong> ${strong || "—"}</div>
              <div><strong>Weak to:</strong> ${weakTo || "—"}</div>
              <div><strong>Resists:</strong> ${resistFrom || "—"}</div>
              ${immuneFrom ? `<div><strong>Immune to:</strong> ${immuneFrom}</div>` : ""}
              <div><strong>Deals half to:</strong> ${weak || "—"}</div>
              <div><strong>Cannot hit:</strong> ${immune || "—"}</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
  container.appendChild(detailsContainer);
}
