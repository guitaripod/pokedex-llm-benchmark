import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  AbilityDetail,
  EvolutionChain,
  ItemDetail,
  MoveDetail,
  Pokemon,
  PokemonSpecies,
} from "./types";

const API = "https://pokeapi.co/api/v2";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`PokeAPI ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const qk = {
  pokemon: (id: string | number) => ["pokemon", String(id)] as const,
  species: (id: string | number) => ["species", String(id)] as const,
  evolution: (id: number) => ["evolution", id] as const,
  ability: (name: string) => ["ability", name] as const,
  move: (name: string) => ["move", name] as const,
  item: (name: string) => ["item", name] as const,
};

export function usePokemon(idOrName: string | number): UseQueryResult<Pokemon> {
  return useQuery({
    queryKey: qk.pokemon(idOrName),
    queryFn: () => get<Pokemon>(`/pokemon/${idOrName}`),
    staleTime: Infinity,
    retry: 2,
  });
}

export function useSpecies(idOrName: string | number | null): UseQueryResult<PokemonSpecies> {
  return useQuery({
    queryKey: qk.species(idOrName ?? "none"),
    queryFn: () => get<PokemonSpecies>(`/pokemon-species/${idOrName}`),
    enabled: idOrName != null,
    staleTime: Infinity,
    retry: 2,
  });
}

export function useEvolutionChain(url: string | null): UseQueryResult<EvolutionChain> {
  return useQuery({
    queryKey: ["evolution", url ?? "none"],
    queryFn: () => fetch(url!).then((r) => r.json() as Promise<EvolutionChain>),
    enabled: !!url,
    staleTime: Infinity,
  });
}

export function useAbility(name: string): UseQueryResult<AbilityDetail> {
  return useQuery({
    queryKey: qk.ability(name),
    queryFn: () => get<AbilityDetail>(`/ability/${name}`),
    staleTime: Infinity,
  });
}

export function useMoveDetail(name: string): UseQueryResult<MoveDetail> {
  return useQuery({
    queryKey: qk.move(name),
    queryFn: () => get<MoveDetail>(`/move/${name}`),
    staleTime: Infinity,
  });
}

export function useItemDetail(name: string): UseQueryResult<ItemDetail> {
  return useQuery({
    queryKey: qk.item(name),
    queryFn: () => get<ItemDetail>(`/item/${name}`),
    staleTime: Infinity,
  });
}
