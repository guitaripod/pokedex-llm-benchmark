import type { TypeName } from "./types";

export const TYPE_ORDER: TypeName[] = [
   "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
   "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

export const TYPE_COLORS: Record<TypeName, string> = {
   normal: "#9099A1",
   fire: "#EF5D2E",
   water: "#4D81C9",
   electric: "#F5CB29",
   grass: "#5EAF2E",
   ice: "#54C6E3",
   fighting: "#D04B4B",
   poison: "#9D3EA1",
   ground: "#C5A357",
   flying: "#85A1C6",
   psychic: "#F56B95",
   bug: "#9DAA2C",
   rock: "#B8A756",
   ghost: "#7868B6",
   dragon: "#5146A3",
   dark: "#524435",
   steel: "#617077",
   fairy: "#E886AD",
};

export const TYPE_GLYPH: Record<TypeName, string> = {
   normal: "🛡️", fire: "🔥", water: "💧", electric: "⚡", grass: "🌿", ice: "❄️",
   fighting: "🥊", poison: "☠️", ground: "⛰️", flying: "🕊️", psychic: "🔮", bug: "🐛",
   rock: "🪨", ghost: "👻", dragon: "🐉", dark: "🌑", steel: "⚙️", fairy: "✨",
};

export const STAT_KEYS = [
   "hp", "attack", "defense", "special-attack", "special-defense", "speed",
] as const;

export const STAT_LABELS: Record<string, string> = {
   hp: "HP",
   attack: "Atk",
   defense: "Def",
   "special-attack": "Sp.Atk",
   "special-defense": "Sp.Def",
   speed: "Speed",
};

export const GEN_START: Record<number, number> = {
   1: 1, 2: 152, 3: 252, 4: 387, 5: 494, 6: 649, 7: 722, 8: 810, 9: 905,
};
export const GEN_END: Record<number, number> = {
   1: 151, 2: 251, 3: 386, 4: 493, 5: 648, 6: 721, 7: 809, 8: 904, 9: 1010,
};

export function genForId(id: number): number {
   for (let g = 1; g <= 9; g++) {
      if (id >= GEN_START[g] && id <= GEN_END[g]) return g;
   }
   return 9;
}

// Sprite + asset helpers (raw PokeAPI sprite repos, no API rate limits).
const SPR = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
export const officialArt = (id: number, shiny = false) => {
   if (shiny) return `${SPR}/other/official-artwork/shiny/${id}.png`;
   return `${SPR}/other/official-artwork/${id}.png`;
};
export const homeSprite = (id: number) => `${SPR}/other/home/${id}.png`;
export const defaultSprite = (id: number) => `${SPR}/${id}.png`;
export const backSprite = (id: number) => `${SPR}/back-default/${id}.png`;
export const gen1Sprite = (id: number) =>
   `${SPR}/versions/generation-i/red-blue/front_default/${id}.png`;
