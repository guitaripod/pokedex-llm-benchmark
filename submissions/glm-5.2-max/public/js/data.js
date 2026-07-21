export const TYPE_COLORS = {
  normal: "#a8a77a",
  fire: "#ee8130",
  water: "#6390f0",
  electric: "#f7d02c",
  grass: "#7ac74c",
  ice: "#96d9d6",
  fighting: "#c22e28",
  poison: "#a33ea1",
  ground: "#e2bf65",
  flying: "#a98ff3",
  psychic: "#f95587",
  bug: "#a6b91a",
  rock: "#b6a136",
  ghost: "#735797",
  dragon: "#6f35fc",
  dark: "#705746",
  steel: "#b7b7ce",
  fairy: "#d685ad",
  stellar: "#f082e5",
  unknown: "#68a090",
};

export const TYPE_LIST = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

export const STAT_NAMES = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
  accuracy: "Accuracy",
  evasion: "Evasion",
};

export const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

export const GENERATIONS = [
  { id: 1, name: "Gen I", region: "Kanto", range: [1, 151], start: 1 },
  { id: 2, name: "Gen II", region: "Johto", range: [152, 251], start: 152 },
  { id: 3, name: "Gen III", region: "Hoenn", range: [252, 386], start: 252 },
  { id: 4, name: "Gen IV", region: "Sinnoh", range: [387, 493], start: 387 },
  { id: 5, name: "Gen V", region: "Unova", range: [494, 649], start: 494 },
  { id: 6, name: "Gen VI", region: "Kalos", range: [650, 721], start: 650 },
  { id: 7, name: "Gen VII", region: "Alola", range: [722, 809], start: 722 },
  { id: 8, name: "Gen VIII", region: "Galar", range: [810, 905], start: 810 },
  { id: 9, name: "Gen IX", region: "Paldea", range: [906, 1025], start: 906 },
];

export function getGenById(id) {
  for (const gen of GENERATIONS) {
    if (id >= gen.range[0] && id <= gen.range[1]) return gen;
  }
  return GENERATIONS[0];
}

export const NATURES = [
  { name: "hardy", increased: null, decreased: null },
  { name: "bold", increased: "defense", decreased: "attack" },
  { name: "modest", increased: "special-attack", decreased: "attack" },
  { name: "calm", increased: "special-defense", decreased: "attack" },
  { name: "timid", increased: "speed", decreased: "attack" },
  { name: "lonely", increased: "attack", decreased: "defense" },
  { name: "docile", increased: null, decreased: null },
  { name: "mild", increased: "special-attack", decreased: "defense" },
  { name: "gentle", increased: "special-defense", decreased: "defense" },
  { name: "hasty", increased: "speed", decreased: "defense" },
  { name: "adamant", increased: "attack", decreased: "special-attack" },
  { name: "impish", increased: "defense", decreased: "special-attack" },
  { name: "bashful", increased: null, decreased: null },
  { name: "careful", increased: "special-defense", decreased: "special-attack" },
  { name: "jolly", increased: "speed", decreased: "special-attack" },
  { name: "naughty", increased: "attack", decreased: "special-defense" },
  { name: "lax", increased: "defense", decreased: "special-defense" },
  { name: "rash", increased: "special-attack", decreased: "special-defense" },
  { name: "quirky", increased: null, decreased: null },
  { name: "naive", increased: "speed", decreased: "special-defense" },
  { name: "brave", increased: "attack", decreased: "speed" },
  { name: "relaxed", increased: "defense", decreased: "speed" },
  { name: "quiet", increased: "special-attack", decreased: "speed" },
  { name: "sassy", increased: "special-defense", decreased: "speed" },
  { name: "serious", increased: null, decreased: null },
];

export const EGG_GROUPS = [
  "monster", "water-1", "water-2", "water-3", "bug", "flying",
  "field", "fairy", "grass", "human-like", "mineral", "amorphous",
  "ditto", "no-eggs",
];

export const GROWTH_RATES = {
  "slow": "1,059,860 XP at Lv 100",
  "medium": "1,000,000 XP at Lv 100",
  "fast": "800,000 XP at Lv 100",
  "medium-slow": "1,059,860 XP at Lv 100",
  "medium-fast": "1,000,000 XP at Lv 100",
  "erratic": "600,000 XP at Lv 100",
  "fluctuating": "1,640,000 XP at Lv 100",
};

export const DAMAGE_CLASS_ICONS = {
  physical: `<svg class="damage-class-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" opacity="0.8"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/></svg>`,
  special: `<svg class="damage-class-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
  status: `<svg class="damage-class-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>`,
};

export const MOVE_LEARN_METHODS = {
  "level-up": "Level Up",
  "egg": "Egg",
  "tutor": "Tutor",
  "machine": "TM/HM",
  "stadium-surfing-pikachu": "Stadium",
  "light-ball-egg": "Light Ball Egg",
  "colosseum-purification": "Purification",
  "xd-shadow": "XD Shadow",
  "xd-purification": "XD Purification",
  "form-change": "Form Change",
};

export const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function getOfficialArtwork(id) {
  return `${SPRITE_BASE}/other/official-artwork/${id}.png`;
}

export function getDefaultSprite(id) {
  return `${SPRITE_BASE}/${id}.png`;
}

export function getShinySprite(id) {
  return `${SPRITE_BASE}/shiny/${id}.png`;
}

export const TOTAL_POKEMON = 1025;
