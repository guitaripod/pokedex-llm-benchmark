export function StatBar({
   label, value, max = 255,
}: {
   label: string;
   value: number;
   max?: number;
}) {
   const pct = Math.min(100, (value / max) * 100);
   const color =
      value >= 130 ? "#3ba55d"
         : value >= 90 ? "#3ba55d"
            : value >= 60 ? "#e0b53a"
               : value >= 30 ? "#e07a3a"
                  : "#cf4a52";
   return (
      <div className="flex items-center gap-3">
         <span className="w-16 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
           {label}
           </span>
         <span className="w-8 text-right text-xs font-bold text-slate-200 tabular-nums">
           {value}
           </span>
         <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
            <div
               className="h-full rounded-full transition-[width] duration-500"
               style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                }}
            />
        </div>
        <span className="w-14 text-[11px] text-slate-500 tabular-nums">
          {Math.round(pct)}%
          </span>
        </div>
      );
}

export function StatBars({
   stats,
}: {
   stats: { base_stat: number; stat: { name: string } }[];
}) {
   const labels: Record<string, string> = {
      hp: "HP", attack: "Atk", defense: "Def",
      "special-attack": "SpA", "special-defense": "SpD", speed: "Spe",
   };
   return (
      <div className="space-y-2">
        {stats.map((s) => (
           <StatBar key={s.stat.name} label={labels[s.stat.name] || s.stat.name} value={s.base_stat} />
        ))}
      </div>
   );
}
