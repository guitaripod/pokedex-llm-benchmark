import { useCallback, useEffect, useState } from "react";
import type { Pokemon, EvolutionChain } from "./types";
import { getDex, getPokemon, getSpecies, getTypeChart, getEvolutionChain } from "./api";

const mem = new Map<string, any>();
function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
   if (mem.has(key)) return mem.get(key);
   const p = fn();
   mem.set(key, p);
   return p;
}

export function useDex() {
   const [dex, setDex] = useState<{ id: number; name: string }[] | null>(null);
   const [error, setError] = useState<string | null>(null);
   useEffect(() => {
      getDex().then(setDex).catch((e) => setError(String(e)));
   }, []);
   return { dex, error };
}

export function useTypeChart() {
   const [chart, setChart] = useState<any>(null);
   useEffect(() => {
      getTypeChart().then(setChart).catch(() => setChart(null));
   }, []);
   return chart;
}

export function usePokemon(id: number | null) {
   const [data, setData] = useState<{
      pokemon: Pokemon; species: any; chain: EvolutionChain | null;
   } | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   useEffect(() => {
      let alive = true;
      if (!id) return;
      setLoading(true);
      setError(null);
      Promise.all([
         memo(`po:${id}`, () => getPokemon(id)),
         memo(`sp:${id}`, () => getSpecies(id)),
         memo(`tc:${id}`, () =>
            getEvolutionChain(id).catch(() => null as EvolutionChain | null)),
      ])
          .then(([pokemon, species, chain]: any) => {
            if (!alive) return;
            setData({ pokemon, species, chain });
            setLoading(false);
           })
          .catch((e) => {
            if (!alive) return;
            setError(String(e));
            setLoading(false);
           });
      return () => {
         alive = false;
        };
     }, [id]);
   return { data, error, loading };
}

// ---- Pure type-effectiveness system (client-side, instant) ----
export type Rel = "supereffective" | "superweak" | "neutral" | "immune";

// attacker -> set of defender types it does: x2, x0
const ATTACK: Record<string, { up?: string[]; zero?: string[] }> = {
   normal: { zero: ["ghost"] },
   fire: { up: ["ice", "grass", "bug", "steel"], zero: ["fire", "water"] },
    water: { up: ["fire", "ground", "rock"], zero: ["water", "grass"] },
   electric: { up: ["water", "flying"], zero: ["ground"] },
   grass: {
      up: ["ground", "rock", "water"],
      zero: ["fire", "poison", "steel", "grass", "dragon", "bug"],
    },
   ice: { up: ["ground", "flying", "dragon", "grass"], zero: ["fire", "ice", "steel", "water"] },
   fighting: {
      up: ["normal", "ice", "rock", "dark", "steel"],
      zero: ["flying", "poison", "ghost", "fairy"],
     },
   poison: { up: ["grass", "fairy"], zero: ["steel", "poison", "ground", "ghost"] },
   ground: { up: ["poison", "rock", "steel", "fire", "electric"], zero: ["flying"] },
   flying: { up: ["bug", "grass", "fighting"], zero: ["ground", "electric", "steel"] },
   psychic: { up: ["fighting", "poison"], zero: ["psychic", "steel"] },
   bug: {
      up: ["dark", "grass", "psychic"],
      zero: ["fire", "flying", "fighting", "poison", "ghost", "steel", "fairy"],
     },
   rock: { up: ["ice", "fire", "bug", "flying"], zero: ["fighting", "ground", "steel"] },
   ghost: { up: ["ghost", "psychic"], zero: ["normal"] },
   dragon: { up: ["dragon"], zero: ["steel", "fairy"] },
   dark: { up: ["ghost", "psychic"], zero: ["fairy", "flying"] },
   steel: { up: ["ice", "rock", "fairy"], zero: ["fire", "water", "electric", "steel"] },
   fairy: { up: ["dragon", "fairy", "fighting", "dark"], zero: ["poison", "steel"] },
};

export function multiplier(attacker: string, defenders: string[]): number {
   const a = ATTACK[attacker];
   let m = 1;
   if (!a) return 1;
   for (const d of defenders) {
      const b = ATTACK[d];
      if (a.up?.includes(d)) m *= 2;
      if (a.zero?.includes(d)) m = 0;
   }
   return m;
}

export function relation(attacker: string, defenders: string[]): Rel {
   const m = multiplier(attacker, defenders);
   if (m === 0) return "immune";
   if (m === 2 || m === 4) return "supereffective";
   if (m === 0.5 || m === 0.25) return "superweak";
   return "neutral";
}
