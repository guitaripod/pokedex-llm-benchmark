import type { PokemonDetail, PokemonStat, TypeDetail } from "../types";

export const TYPE_NAMES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type TypeName = (typeof TYPE_NAMES)[number];

export const GENERATIONS = [
  { value: "all", label: "All eras", range: [1, 1025] },
  { value: "1", label: "Gen I · Kanto", range: [1, 151] },
  { value: "2", label: "Gen II · Johto", range: [152, 251] },
  { value: "3", label: "Gen III · Hoenn", range: [252, 386] },
  { value: "4", label: "Gen IV · Sinnoh", range: [387, 493] },
  { value: "5", label: "Gen V · Unova", range: [494, 649] },
  { value: "6", label: "Gen VI · Kalos", range: [650, 721] },
  { value: "7", label: "Gen VII · Alola", range: [722, 809] },
  { value: "8", label: "Gen VIII · Galar", range: [810, 905] },
  { value: "9", label: "Gen IX · Paldea", range: [906, 1025] },
];

export const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;

export function formatName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function getIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

export function formatHeight(decimeters: number): string {
  return `${(decimeters / 10).toFixed(1)} m`;
}

export function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`;
}

export function formatStatName(name: string): string {
  const labels: Record<string, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  };
  return labels[name] ?? formatName(name);
}

export function totalStats(stats: PokemonStat[]): number {
  return stats.reduce((total, stat) => total + stat.base_stat, 0);
}

export function getGeneration(id: number): string {
  return GENERATIONS.find((generation) => id >= generation.range[0] && id <= generation.range[1])?.value ?? "9";
}

export function cleanFlavorText(text: string): string {
  return text.replace(/[\n\f\r]+/g, " ").replace(/\s+/g, " ").trim();
}

export function findEnglish<T extends { language: { name: string } }>(entries: T[]): T | undefined {
  return entries.find((entry) => entry.language.name === "en") ?? entries[0];
}

export function typeClass(type: string): string {
  return `type-${type}`;
}

export function pokemonArtwork(pokemon: Pick<PokemonDetail, "sprites" | "id">, shiny = false): string {
  const artwork = pokemon.sprites.other?.["official-artwork"];
  if (shiny && artwork?.front_shiny) return artwork.front_shiny;
  if (!shiny && artwork?.front_default) return artwork.front_default;
  return pokemon.sprites.front_default ?? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
}

export function getEvolutionTriggerLabel(trigger: string): string {
  return trigger === "level-up" ? "Level up" : formatName(trigger);
}

export function typeMemberNames(type: TypeDetail, relation: "double_damage_from" | "half_damage_from" | "no_damage_from"): string[] {
  return type.damage_relations[relation].map((entry) => entry.name);
}

export function typeColor(type: string): string {
  const colors: Record<string, string> = {
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
  };
  return colors[type] ?? "#8a9189";
}

export function calculateTeamCoverage(team: PokemonDetail[], types: TypeDetail[]): Record<string, number> {
  const coverage: Record<string, number> = {};
  for (const type of types) {
    coverage[type.name] = team.reduce((score, member) => {
      const hasType = member.types.some((memberType) => memberType.type.name === type.name);
      return score + (hasType ? 1 : 0);
    }, 0);
  }
  return coverage;
}
