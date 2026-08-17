import { useState } from "react";
import { useTypeChart, multiplier } from "../useData";
import { TYPE_COLORS, TYPE_GLYPH } from "../poke";
import type { TypeName } from "../types";
import { Spinner } from "../ui/Spinner";

const ALL: TypeName[] = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

export function TypeChart() {
   const chart = useTypeChart();
   const [primary, setPrimary] = useState<TypeName>("grass");
   const [secondary, setSecondary] = useState<TypeName | null>(null);
   const [dual, setDual] = useState(false);

   const defenders = dual && secondary ? [primary, secondary] : [primary];

   if (!chart) return <Spinner label="Loading type chart…" />;

   return (
        <div className="max-w-5xl mx-auto px-4 py-6">
           <h1 className="text-2xl font-black text-white mb-1">Type Effectiveness</h1>
           <p className="text-slate-400 text-sm mb-6">
             Choose the defending type{dual ? "s" : ""} and see how strongly every attacking
             type hits it.
             </p>

           <section className="rounded-3xl bg-white/5 border border-white/5 p-6 mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-slate-300">Defender</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {ALL.map((t) => {
                    const active = defenders.includes(t);
                    return (
                       <button
                        key={t}
                        onClick={() => setPrimary(t)}
                        className={
                            "px-2.5 py-1 rounded-full text-xs font-semibold text-white transition " +
                            (active ? "ring-2 ring-white" : "opacity-60 hover:opacity-100")}
                        style={{ background: TYPE_COLORS[t] }}
                        title={`Defender: ${t}`}
                       >
                          {TYPE_GLYPH[t]} {t}
                       </button>
                   );
                 })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dual}
                    onChange={(e) => setDual(e.target.checked)}
                    className="accent-[#ef5d2e]"
                  />
                  Dual-type
                 </label>
                 {dual && (
                   <div className="flex flex-wrap gap-1.5">
                    {ALL.map((t) => (
                       <button
                        key={t}
                        onClick={() => setSecondary(t)}
                        className={
                             "px-2 py-0.5 rounded-full text-[11px] font-semibold text-white " +
                             (secondary === t
                               ? "ring-2 ring-[#f5cb29]"
                               : "opacity-50 hover:opacity-90")}
                        style={{ background: TYPE_COLORS[t] }}
                       >
                          {TYPE_GLYPH[t]}
                       </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Defending as
                 <b className="text-slate-200 ml-1 capitalize">
                    {defenders.join(" + ")}
                 </b>
                 .
              </p>
           </section>

           <section className="rounded-3xl bg-white/5 border border-white/5 p-6">
              <h2 className="font-bold text-slate-200 mb-4">Attacking types</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ALL.map((t) => {
                   const m = multiplier(t, defenders);
                   return <TypeCell key={t} type={t} m={m} />;
                })}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-5">
                <Legend color="bg-emerald-500" label="2× / 4× super-effective" />
                <Legend color="bg-white/10" label="1× neutral" />
                <Legend color="bg-stone-500" label="0.25× / 0.5× resisted" />
                <Legend color="bg-red-600" label="0× immune" />
              </div>
           </section>
        </div>
     );
}

function TypeCell({ type, m }: { type: TypeName; m: number }) {
   const tone = m >= 2 ? "emerald" : m === 1 ? "neutral" : m === 0 ? "immune" : "weak";
   const color =
       tone === "emerald" ? "rgba(16,185,129,0.15)"
           : tone === "immune"
             ? "rgba(220,38,38,0.18)"
               : tone === "weak"
                 ? "rgba(120,113,108,0.18)"
                   : "rgba(255,255,255,0.04)";
   const num =
       tone === "emerald" ? "#34d399"
           : tone === "immune"
             ? "#f87171"
               : tone === "weak"
                 ? "#a8a29e"
                   : "#94a3b8";
   return (
       <div
        className="rounded-xl p-2 text-center border border-white/5 transition hover:-translate-y-0.5"
        style={{ background: color }}
        title={`${type} hits for ${m}×`}
       >
         <div
          className="mx-auto w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 text-white"
          style={{ background: TYPE_COLORS[type] }}
         >
           {TYPE_GLYPH[type]}
         </div>
        <div className="text-[11px] capitalize text-slate-200 truncate">{type}</div>
        <div className="text-xs font-bold tabular-nums" style={{ color: num }}>{m}×</div>
       </div>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
   return (
       <span className="flex items-center gap-1.5">
        <span className={`w-3 h-3 rounded ${color}`} />
        <span>{label}</span>
       </span>
     );
}
