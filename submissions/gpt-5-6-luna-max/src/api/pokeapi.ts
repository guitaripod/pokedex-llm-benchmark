import type {
  EvolutionChain,
  NamedResource,
  PokemonDetail,
  PokemonListResponse,
  PokemonProfile,
  PokemonSpecies,
  PokemonSummary,
  TypeDetail,
} from "../types";

const API_ROOT = "/api/pokeapi";
const INDEX_CACHE_KEY = "luna-dex-index-v1";
const cache = new Map<string, unknown>();

function resourceId(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

function toApiPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/api\/v2/, "") + parsed.search;
  } catch {
    return url;
  }
}

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const cached = cache.get(path);
  if (cached) {
    return cached as T;
  }

  const response = await fetch(`${API_ROOT}/${path.replace(/^\//, "")}`, { signal });
  if (!response.ok) {
    throw new Error(`PokéAPI returned ${response.status}`);
  }

  const data = (await response.json()) as T;
  cache.set(path, data);
  return data;
}

export async function getPokemonIndex(signal?: AbortSignal): Promise<PokemonSummary[]> {
  try {
    const data = await requestJson<PokemonListResponse>("pokemon?limit=2000", signal);
    const summaries = data.results
      .map((resource) => ({
        id: resourceId(resource.url),
        name: resource.name,
        url: resource.url,
      }))
      .filter((pokemon) => pokemon.id > 0)
      .sort((a, b) => a.id - b.id);
    if (typeof window !== "undefined") window.localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(summaries));
    return summaries;
  } catch (error) {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(INDEX_CACHE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed as PokemonSummary[];
        }
      } catch {
        throw error;
      }
    }
    throw error;
  }
}

export function getPokemon(idOrName: number | string, signal?: AbortSignal): Promise<PokemonDetail> {
  return requestJson<PokemonDetail>(`pokemon/${idOrName}`, signal);
}

export function getSpecies(idOrName: number | string, signal?: AbortSignal): Promise<PokemonSpecies> {
  return requestJson<PokemonSpecies>(`pokemon-species/${idOrName}`, signal);
}

export function getType(name: string, signal?: AbortSignal): Promise<TypeDetail> {
  return requestJson<TypeDetail>(`type/${name}`, signal);
}

export async function getEvolutionChain(
  resource: NamedResource,
  signal?: AbortSignal,
): Promise<EvolutionChain> {
  return requestJson<EvolutionChain>(toApiPath(resource.url), signal);
}

export async function getPokemonProfile(
  id: number,
  signal?: AbortSignal,
): Promise<PokemonProfile> {
  const [pokemon, species] = await Promise.all([
    getPokemon(id, signal),
    getSpecies(id, signal),
  ]);
  const evolution = species.evolution_chain
    ? await getEvolutionChain(species.evolution_chain, signal)
    : null;
  return { pokemon, species, evolution };
}

export function getArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
