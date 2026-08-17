import { useState } from "react";
import type { Route } from "../useRoute";

const TABS: { key: string; label: string; route: Route; icon: string }[] = [
    { key: "dex", label: "Pokédex", route: { view: "dex" }, icon: "📖" },
    { key: "type", label: "Type Chart", route: { view: "type" }, icon: "🎯" },
    { key: "compare", label: "Compare", route: { view: "compare" }, icon: "⚔️" },
];

export function Navigation({
   route, navigate, total,
}: {
   route: Route;
   navigate: (r: Route) => void;
   total: number;
}) {
   const [open, setOpen] = useState(false);
   const active = route.view;
   return (
       <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b1020]/80 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-3">
             <button
               onClick={() => navigate({ view: "dex" })}
               className="flex items-center gap-2 font-black text-lg select-none"
            >
               <span className="text-2xl drop-shadow-[0_0_10px_rgba(239,93,46,0.6)]">🔴</span>
               <span className="bg-gradient-to-r from-[#ef5d2e] to-[#f5cb29] bg-clip-text text-transparent">
                 POKÉDEX
                 </span>
            </button>
            <span className="hidden sm:inline text-xs text-slate-500 tabular-nums">
              {total.toLocaleString()} Pokémon
              </span>
            <nav className="ml-auto flex items-center gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => navigate(t.route)}
                  className={
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition " +
                    (active === t.key
                       ? "bg-white/10 text-white shadow-inner"
                       : "text-slate-400 hover:text-white hover:bg-white/5")
                   }
                >
                  <span className="mr-1">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </nav>
            <a
              href="https://pokeapi.co"
              target="_blank"
              rel="noreferrer"
              title="Powered by PokéAPI"
              className="hidden md:block ml-2 text-xs text-slate-600 hover:text-slate-300"
            >
              ⚡ pokeapi
            </a>
          </div>
       </header>
    );
}
