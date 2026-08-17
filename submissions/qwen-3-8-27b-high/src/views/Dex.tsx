import { useEffect, useMemo, useState } from "react";
import type { Route } from "../useRoute";
import { useDex } from "../useData";
import { useFavorites } from "../useFavorites";
import { Card } from "./../components/Card";
import { SearchBar } from "./../components/SearchBar";
import { Empty, Skeleton } from "./../ui/Spinner";

const PAGE = 60;
const GEN: Record<number, [number, number]> = {
   1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493], 5: [494, 648],
   6: [649, 721], 7: [722, 809], 8: [810, 904], 9: [905, 1010],
};

export function Dex({ navigate }: { navigate: (r: Route) => void }) {
   const { dex, error } = useDex();
   const [favSet] = useFavorites();
   const [q, setQ] = useState("");
   const [gen, setGen] = useState("");
   const [onlyFav, setOnlyFav] = useState(false);
   const [show, setShow] = useState(PAGE);

   useEffect(() => setShow(PAGE), [q, gen, onlyFav]);

   const filtered = useMemo(() => {
      if (!dex) return [];
      const norm = q.trim().toLowerCase().replace(/[^a-z0-9\-\s]/g, "");
      let list = dex;
      if (gen && GEN[Number(gen)]) {
         const [lo, hi] = GEN[Number(gen)];
         list = list.filter((d) => d.id >= lo && d.id <= hi);
         }
      if (onlyFav) list = list.filter((d) => favSet.has(d.id));
      if (!norm) return list;
      return list.filter(
           (d) =>
              d.name.includes(norm) ||
              String(d.id) === norm ||
              `#${d.id}` === norm);
     }, [dex, q, gen, onlyFav, favSet]);

   const grid = (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
         {filtered.slice(0, show).map((d) => (
           <Card
              key={d.id}
              id={d.id}
              name={d.name}
              onOpen={() => navigate({ view: "pokemon", id: String(d.id) })}
             />
         ))}
      </div>
    );

   return (
     <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
           <SearchBar value={q} onChange={setQ} big placeholder="Search by name or #…" />
           <div className="flex items-center gap-2">
              <select
                 value={gen}
                 onChange={(e) => setGen(e.target.value)}
                 className="rounded-xl bg-white/5 border border-white/10 text-slate-200 px-3 py-2 text-sm focus:outline-none"
              >
                 <option value="">All generations</option>
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                   <option key={g} value={g}>Gen {romanize(g)}</option>
                 ))}
              </select>
              <button
                 onClick={() => setOnlyFav((v) => !v)}
                 className={
                   "rounded-xl px-3 py-2 text-sm font-medium transition " +
                   (onlyFav
                      ? "bg-[#ef5d2e] text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/10")}
              >
                 ⭐ Favorites ({favSet.size})
              </button>
           </div>
        </div>

        <div className="text-xs text-slate-500 mb-3 flex justify-between">
           <span>{filtered.length.toLocaleString()} Pokémon</span>
           <span>{Math.min(show, filtered.length).toLocaleString()} shown</span>
        </div>

        {!dex && <DexSkeleton />}
        {error && <Empty title="Failed to load Pokédex" hint={error} />}
        {dex && onlyFav && filtered.length === 0 && (
           <Empty
              title="No favorites yet"
              hint="Tap ⭐ on a Pokémon to save it here. Favorites live in this browser."
           />
        )}
        {dex && !onlyFav && filtered.length === 0 && (
           <Empty title="No Pokémon match" hint="Try a different name, number, or generation." />
        )}

        {dex && filtered.length > 0 && grid}

        {dex && show < filtered.length && (
           <div className="mt-6 text-center">
              <button
                 onClick={() => setShow((s) => s + 120)}
                 className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium transition"
              >
                 Load {Math.min(120, filtered.length - show).toLocaleString()} more
              </button>
           </div>
        )}
     </div>
   );
}

function romanize(n: number): string {
   const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
   const chars = "MCMCDXLIXV";
   let num = n;
   let out = "";
   for (let i = 0; i < vals.length; i++) {
      while (num >= vals[i]) {
         out += chars[i];
         num -= vals[i];
         }
      }
   return out;
}

function DexSkeleton() {
   return (
     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
     </div>
   );
}
