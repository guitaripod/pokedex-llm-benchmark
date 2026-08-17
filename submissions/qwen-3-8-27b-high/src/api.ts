import type {
   DexEntry, Pokemon, EvolutionChain, TypeChartRow,
} from "./types";

// All data routes through our Worker, which proxies + edge-caches PokéAPI.
async function j<T>(path: string): Promise<T> {
   const res = await fetch(`/api/${path}`);
   if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
   return res.json() as Promise<T>;
}

export const getDex = () => j<DexEntry[]>("pokemon");
export const getPokemon = (idOrName: string | number) =>
   j<Pokemon>(`v2/pokemon/${idOrName}`);
export const getSpecies = (idOrName: string | number) =>
   j<any>(`v2/pokemon-species/${idOrName}`);
export const getType = (name: string) => j<any>(`v2/type/${name}`);
export const getEvolutionChain = (idOrName: string | number) =>
   j<EvolutionChain>(`v2/evolution-chain/${idOrName}`);
export const getTypeChart = () => j<TypeChartRow[]>("type-chart");
export const getAbility = (idOrName: string | number) => j<any>(`v2/ability/${idOrName}`);

export function normalizeName(v: string): string {
   return v.trim().toLowerCase().replace(/[^a-z0-9\-\s]/g, "");
}
