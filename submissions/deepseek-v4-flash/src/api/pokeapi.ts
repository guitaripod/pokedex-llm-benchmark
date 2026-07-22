import type {
  Pokemon, PokemonSpecies, EvolutionChain, TypeInfo,
  Move, PokemonListEntry, Generation,
} from '../types/pokemon';

const BASE_URL = 'https://pokeapi.co/api/v2';

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 1000 * 60 * 30;

async function fetchJSON<T>(path: string): Promise<T> {
  const key = `${BASE_URL}${path}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T;

  const res = await fetch(key);
  if (!res.ok) throw new Error(`PokeAPI ${res.status}: ${path}`);
  const data = await res.json() as T;
  cache.set(key, { data, ts: Date.now() });
  return data;
}

export async function getPokemonList(offset = 0, limit = 151): Promise<PokemonListEntry[]> {
  const data = await fetchJSON<{ results: PokemonListEntry[] }>(
    `/pokemon?offset=${offset}&limit=${limit}`
  );
  return data.results;
}

export async function getPokemonById(id: number): Promise<Pokemon> {
  return fetchJSON<Pokemon>(`/pokemon/${id}`);
}

export async function getPokemonByName(name: string): Promise<Pokemon> {
  return fetchJSON<Pokemon>(`/pokemon/${name.toLowerCase()}`);
}

export async function getSpecies(id: number): Promise<PokemonSpecies> {
  return fetchJSON<PokemonSpecies>(`/pokemon-species/${id}`);
}

export async function getEvolutionChain(url: string): Promise<EvolutionChain> {
  const id = url.split('/').filter(Boolean).pop();
  return fetchJSON<EvolutionChain>(`/evolution-chain/${id}`);
}

export async function getTypeInfo(name: string): Promise<TypeInfo> {
  return fetchJSON<TypeInfo>(`/type/${name}`);
}

export async function getAllTypes(): Promise<TypeInfo[]> {
  const types = ['normal','fire','water','electric','grass','ice','fighting',
    'poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
  return Promise.all(types.map(t => getTypeInfo(t)));
}

export async function getMove(idOrName: string | number): Promise<Move> {
  return fetchJSON<Move>(`/move/${idOrName}`);
}

export async function getGeneration(id: number): Promise<Generation> {
  return fetchJSON<Generation>(`/generation/${id}`);
}

export async function getFullPokemonData(id: number) {
  const [pokemon, species] = await Promise.all([
    getPokemonById(id),
    getSpecies(id),
  ]);

  let evolutionChain: EvolutionChain | null = null;
  if (species.evolution_chain?.url) {
    evolutionChain = await getEvolutionChain(species.evolution_chain.url);
  }

  return { pokemon, species, evolutionChain };
}

export function getPokemonImageUrl(id: number, shiny = false): string {
  if (shiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getPokemonSpriteUrl(id: number, shiny = false): string {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  if (shiny) return `${base}/shiny/${id}.png`;
  return `${base}/${id}.png`;
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  if (/^\d+$/.test(q)) {
    const id = parseInt(q);
    if (id > 0 && id <= 1025) return [await getPokemonById(id)];
    return [];
  }

  try {
    return [await getPokemonByName(q)];
  } catch {
    const all = await getPokemonList(0, 1025);
    const matches = all.filter(p => p.name.includes(q)).slice(0, 20);
    if (matches.length === 0) return [];
    return Promise.all(matches.map(m => {
      const id = parseInt(m.url.split('/').filter(Boolean).pop()!);
      return getPokemonById(id);
    }));
  }
}
