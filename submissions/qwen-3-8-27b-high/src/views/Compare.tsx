import { useState, useEffect } from "react";
import type { Route } from "../useRoute";
import { useDex } from "../useData";
import { getPokemon } from "../api";
import { TypeBadge } from "../ui/TypeBadge";
import { StatBars } from "../ui/StatBars";
import { officialArt } from "../poke";
import { Spinner, Empty } from "../ui/Spinner";

export function Compare({ navigate }: { navigate: (r: Route) => void }) {
   const { dex } = useDex();
   const [ids, setIds] = useState<number[]>([25, 6]);
   const [pkm, setPkm] = useState<Record<number, any> | null>(null);
   const [loading, setLoading] = useState(true);
   const [err, setErr] = useState<string | null>(null);

   const key = ids.join(",");
   useEffect(() => {
      setLoading(true);
      setErr(null);
      let alive = true;
      Promise.all(ids.map((id) => getPokemon(id)))
          .then((list) => {
            if (!alive) return;
            const m: Record<number, any> = {};
            list.forEach((p) => (m[p.id] = p));
            setPkm(m);
            setLoading(false);
          })
          .catch((e) => {
            if (!alive) return;
            setErr(String(e));
            setLoading(false);
          });
      return () => {
         alive = false;
      };
   }, [key]);

   const addSlot = () => {
      if (ids.length < 4) setIds([...ids, 1]);
   };

   const sortedDex =
      dex ? [...dex].sort((a, b) => a.id - b.id) : [];

   return (
      <div className="max-w-5xl mx-auto px-4 py-6">
         <h1 className="text-2xl font-black text-white mb-1">Compare Pokémon</h1>
         <p className="text-slate-400 text-sm mb-6">
            Line up to four Pokémon and compare base stats, types and size head to head.
         </p>

         <div className="flex flex-wrap items-center gap-3 mb-6">
            {ids.map((id, i) => (
               <div
                  key={i}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
               >
                 <span className="text-xs text-slate-500">#{i + 1}</span>
                 {!dex && <span className="text-xs text-slate-500">…</span>}
                 {dex && (
                    <select
                        value={id}
                        onChange={(e) => {
                           const v = Number(e.target.value);
                           const next = [...ids];
                           next[i] = v;
                           setIds(next);
                        }}
                        className="bg-transparent text-sm text-slate-100 capitalize focus:outline-none max-w-[150px]"
                     >
                        {sortedDex.map((d) => (
                          <option key={d.id} value={d.id}>
                            #{d.id} {d.name}
                          </option>
                        ))}
                    </select>
                  )}
                  {ids.length > 2 && (
                     <button
                        onClick={() => setIds(ids.filter((_, j) => j !== i))}
                        className="text-slate-600 hover:text-red-400"
                     >
                      ✕
                     </button>
                  )}
               </div>
            ))}
            {ids.length < 4 && (
               <button
                  onClick={addSlot}
                  className="text-sm px-3 py-2 rounded-xl border border-dashed border-white/15 text-slate-400 hover:text-white"
               >
                  + Add
               </button>
            )}
         </div>

         {!dex && <Spinner label="Loading Pokédex…" />}
         {err && <Empty title="Failed to compare" hint={err} />}
         {loading && dex && !pkm && <Spinner />}

         {pkm && !loading && (
            <div
              className={`grid gap-4 ${
                  ids.length === 1
                     ? "grid-cols-1"
                     : ids.length === 2
                       ? "md:grid-cols-2"
                       : "md:grid-cols-2 xl:grid-cols-4"
                  }`}
            >
               {ids.map((id) => {
                  const p = pkm[id];
                  if (!p) return null;
                  const stats = p.stats.map((s: any) => ({
                    base_stat: s.base_stat,
                    stat: s.stat,
                  }));
                  const total = stats.reduce((a: number, s: any) => a + s.base_stat, 0);
                  return (
                     <div
                        key={id}
                        className="rounded-3xl bg-white/5 border border-white/5 p-5 flex flex-col"
                     >
                       <button
                          onClick={() =>
                              navigate({ view: "pokemon", id: String(id) })
                          }
                          className="flex flex-col items-center group"
                       >
                          <img
                             src={officialArt(id)}
                             width={130}
                             height={130}
                             alt={p.name}
                             className="drop-shadow-xl transition group-hover:scale-105"
                          />
                          <span className="text-[11px] font-mono text-slate-500 mt-2">
                             #{String(id).padStart(3, "0")}
                          </span>
                          <span className="text-lg font-black capitalize text-white">
                             {p.name}
                          </span>
                       </button>
                       <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                          {p.types.map((t: any) => (
                            <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                          ))}
                       </div>
                       <div className="text-center text-xs text-slate-400 mt-3">
                          <div className="font-bold text-slate-200 text-base">
                            {total} BST
                          </div>
                          <div className="mt-1">
                            {(p.height / 10).toFixed(1)}m ·
                            {(p.weight / 10).toFixed(1)}kg
                          </div>
                       </div>
                       <div className="mt-4 space-y-1.5">
                          <StatBars stats={stats} />
                       </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
}
