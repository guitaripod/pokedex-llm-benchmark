import { useCallback, useEffect, useState } from "react";

const KEY = "pokedex:favorites";

export function useFavorites(): [
   Set<number>,
   (id: number) => void,
   (id: number) => void,
   number,
] {
   const [ids, setIds] = useState<number[]>(() => {
      try {
         return JSON.parse(localStorage.getItem(KEY) || "[]");
         } catch {
         return [];
         }
    });

   useEffect(() => {
      try {
         localStorage.setItem(KEY, JSON.stringify(ids));
         } catch {
         /* ignore */
         }
    }, [ids]);

   const toggle = useCallback((id: number) => {
      setIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
       );
    }, []);

   const remove = useCallback((id: number) => {
      setIds((prev) => prev.filter((x) => x !== id));
    }, []);

   const setAll = useCallback((next: number[]) => setIds(next), []);

   return [new Set(ids), toggle, remove, ids.length];
}
