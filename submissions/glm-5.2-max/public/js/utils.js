export function capitalize(str) {
  if (!str) return "";
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatId(id) {
  return `#${String(id).padStart(4, "0")}`;
}

export function formatHeight(dm) {
  const m = dm / 10;
  return `${m.toFixed(1)} m (${(m * 3.28084).toFixed(1)} ft)`;
}

export function formatWeight(hg) {
  const kg = hg / 10;
  const lb = kg * 2.20462;
  return `${kg.toFixed(1)} kg (${lb.toFixed(1)} lbs)`;
}

export function formatStatValue(val) {
  return val !== null && val !== undefined ? val : "—";
}

export function getTextInEnglish(entries) {
  if (!entries) return "";
  const en = entries.find((e) => e.language.name === "en");
  return en ? en.text || en.description || "" : "";
}

export function getFlavorText(entries) {
  if (!entries) return "";
  const en = entries.filter((e) => e.language.name === "en");
  if (en.length === 0) return "";
  const latest = en[en.length - 1];
  return latest.flavor_text.replace(/[\n\r\f]/g, " ").replace(/\u00ad/g, "");
}

export function getGenus(entries) {
  if (!entries) return "";
  const en = entries.find((e) => e.language.name === "en");
  return en ? en.genus : "";
}

export function getName(entries) {
  if (!entries) return "";
  const en = entries.find((e) => e.language.name === "en");
  return en ? en.name : "";
}

export function getEffectText(entries, short = false) {
  if (!entries) return "";
  const en = entries.find((e) => e.language.name === "en");
  if (!en) return "";
  const text = short ? en.short_effect : en.effect;
  return text ? text.replace(/[\n\r\f]/g, " ") : "";
}

export function getStatColor(value, max = 255) {
  const pct = value / max;
  if (pct < 0.35) return "#ef4444";
  if (pct < 0.55) return "#f97316";
  if (pct < 0.7) return "#eab308";
  if (pct < 0.85) return "#84cc16";
  return "#22c55e";
}

export function getStatBarWidth(value, max = 200) {
  return Math.min(100, (value / max) * 100);
}

export function getGenderRate(rate) {
  if (rate === -1) return { label: "Genderless", male: 0, female: 0 };
  const femalePct = (rate / 8) * 100;
  const malePct = 100 - femalePct;
  return { label: `${malePct}% M / ${femalePct}% F`, male: malePct, female: femalePct };
}

export function getCaptureRateColor(rate) {
  if (rate >= 200) return "#22c55e";
  if (rate >= 150) return "#84cc16";
  if (rate >= 100) return "#eab308";
  if (rate >= 50) return "#f97316";
  return "#ef4444";
}

export function getFriendshipColor(val) {
  if (val >= 140) return "#22c55e";
  if (val >= 100) return "#84cc16";
  if (val >= 50) return "#eab308";
  return "#ef4444";
}

export function debounce(fn, ms) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function extractIdFromUrl(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? parseInt(match[1]) : null;
}

export function getTypeGradient(types) {
  if (!types || types.length === 0) return "var(--bg-secondary)";
  const colors = {
    normal: "#a8a77a", fire: "#ee8130", water: "#6390f0", electric: "#f7d02c",
    grass: "#7ac74c", ice: "#96d9d6", fighting: "#c22e28", poison: "#a33ea1",
    ground: "#e2bf65", flying: "#a98ff3", psychic: "#f95587", bug: "#a6b91a",
    rock: "#b6a136", ghost: "#735797", dragon: "#6f35fc", dark: "#705746",
    steel: "#b7b7ce", fairy: "#d685ad", stellar: "#f082e5", unknown: "#68a090",
  };
  if (types.length === 1) {
    const c = colors[types[0]] || "#64748b";
    return `linear-gradient(135deg, ${c}dd, ${c}88)`;
  }
  const c1 = colors[types[0]] || "#64748b";
  const c2 = colors[types[1]] || "#64748b";
  return `linear-gradient(135deg, ${c1}dd, ${c2}88)`;
}

export function getTypeColor(type) {
  const colors = {
    normal: "#a8a77a", fire: "#ee8130", water: "#6390f0", electric: "#f7d02c",
    grass: "#7ac74c", ice: "#96d9d6", fighting: "#c22e28", poison: "#a33ea1",
    ground: "#e2bf65", flying: "#a98ff3", psychic: "#f95587", bug: "#a6b91a",
    rock: "#b6a136", ghost: "#735797", dragon: "#6f35fc", dark: "#705746",
    steel: "#b7b7ce", fairy: "#d685ad", stellar: "#f082e5", unknown: "#68a090",
  };
  return colors[type] || "#64748b";
}

export function calculateStat(base, iv, ev, level, nature, isHP = false) {
  if (isHP) {
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  const natureMod = nature === 1.1 ? 1.1 : nature === 0.9 ? 0.9 : 1.0;
  return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * natureMod);
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function formatNumber(num) {
  return num.toLocaleString("en-US");
}
