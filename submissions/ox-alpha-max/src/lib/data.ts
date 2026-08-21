import dexJson from "../data/dex.json";
import movesJson from "../data/moves.json";
import abilitiesJson from "../data/abilities.json";
import typesJson from "../data/types.json";
import generationsJson from "../data/generations.json";

export interface DexEntry {
  i: number;
  n: string;
  t: string[];
  s: [number, number, number, number, number, number];
  g: number;
  l: boolean;
  m: boolean;
  h: number;
  w: number;
  f: boolean;
}

export interface MoveIndexEntry {
  n: string;
  t: string;
  c: string;
  p: number | null;
  a: number | null;
  pp: number | null;
  pri: number;
  g: number;
  e: string;
}

export interface AbilityIndexEntry {
  n: string;
  g: number;
  e: string;
}

export interface TypeRelations {
  double: string[];
  half: string[];
  zero: string[];
}

export const DEX = (dexJson as { v: number; list: DexEntry[] }).list;
export const MOVES = movesJson as MoveIndexEntry[];
export const ABILITIES = abilitiesJson as AbilityIndexEntry[];
export const TYPE_RELATIONS = typesJson as Record<string, TypeRelations>;
export const GENERATIONS = generationsJson as { n: number; region: string; games: string[] }[];

export const BASE_DEX = DEX.filter((d) => !d.f);
export const FORM_DEX = DEX.filter((d) => d.f);

export const DEX_BY_ID = new Map<number, DexEntry>(DEX.map((d) => [d.i, d]));
export const DEX_BY_NAME = new Map<string, DexEntry>(DEX.map((d) => [d.n, d]));

export const TOTAL_SPECIES = BASE_DEX.length;

export function findPokemon(idOrName: string): DexEntry | undefined {
  const key = decodeURIComponent(idOrName).toLowerCase();
  if (/^\d+$/.test(key)) return DEX_BY_ID.get(Number(key));
  return DEX_BY_NAME.get(key);
}

export const artworkUrl = (id: number, shiny = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shiny ? "shiny/" : ""}${id}.png`;

export const spriteUrl = (id: number, shiny = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? "shiny/" : ""}${id}.png`;

export const itemSpriteUrl = (name: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;

export const berrySpriteUrl = (name: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/berries/${name}-berry.png`;
