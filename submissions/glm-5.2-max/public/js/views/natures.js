import { NATURES, STAT_NAMES, STAT_KEYS } from "../data.js";
import { capitalize } from "../utils.js";

export async function renderNatures(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Natures</h1>
        <p class="page-subtitle">All 25 natures and their stat modifications. Natures increase one stat by 10% and decrease another by 10%.</p>
      </div>

      <div class="section-title"><span class="section-title-bar"></span>Nature Matrix</div>
      <div style="overflow-x:auto; margin-bottom:2rem;">
        <table class="type-chart-table" style="font-size:0.8rem;">
          <thead>
            <tr>
              <th style="position:sticky; left:0; z-index:3; background:var(--bg-secondary);">Nature</th>
              ${STAT_KEYS.map((k) => `<th style="padding:0.5rem 0.8rem;">${STAT_NAMES[k]}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${NATURES.map((n) => `
              <tr>
                <td style="position:sticky; left:0; z-index:2; background:var(--bg-secondary); font-weight:600; text-transform:capitalize;">${n.name}</td>
                ${STAT_KEYS.map((k) => {
                  if (n.increased === k && n.decreased === k) {
                    return `<td><span style="color:var(--text-tertiary);">=</span></td>`;
                  }
                  if (n.increased === k) {
                    return `<td><span style="color:var(--success); font-weight:700;">+10%</span></td>`;
                  }
                  if (n.decreased === k) {
                    return `<td><span style="color:var(--danger); font-weight:700;">-10%</span></td>`;
                  }
                  return `<td><span style="color:var(--text-muted);">&mdash;</span></td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="section-title"><span class="section-title-bar"></span>Nature Cards</div>
      <div class="nature-grid">
        ${NATURES.map((n) => {
          if (!n.increased && !n.decreased) {
            return `
              <div class="nature-card">
                <div class="nature-name">${capitalize(n.name)}</div>
                <div class="nature-neutral">Neutral - no stat changes</div>
              </div>
            `;
          }
          return `
            <div class="nature-card">
              <div class="nature-name">${capitalize(n.name)}</div>
              <div class="nature-stats">
                <span class="nature-stat-up">${STAT_NAMES[n.increased]} +10%</span>
                <span class="nature-stat-down">${STAT_NAMES[n.decreased]} -10%</span>
              </div>
              <div style="display:flex; gap:0.25rem; margin-top:0.5rem; height:4px;">
                <div style="flex:1; background:var(--success); border-radius:2px;"></div>
                <div style="flex:1; background:var(--bg-tertiary); border-radius:2px;"></div>
                <div style="flex:1; background:var(--danger); border-radius:2px;"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
