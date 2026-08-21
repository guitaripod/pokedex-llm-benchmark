import { motion } from "framer-motion";
import { STAT_META } from "../lib/utils";

export function StatBars({ stats, evs }: { stats: number[]; evs?: number[] }) {
  const keys = Object.keys(STAT_META);
  const total = stats.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      {keys.map((k, i) => {
        const meta = STAT_META[k];
        const pct = Math.min(100, (stats[i] / meta.max) * 100);
        return (
          <div key={k} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-xs font-bold uppercase tracking-wide text-muted">
              {meta.short}
            </span>
            <span className="w-9 shrink-0 text-right font-mono text-sm font-bold">{stats[i]}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background:
                    stats[i] >= 120
                      ? "linear-gradient(90deg,#22c55e,#84cc16)"
                      : stats[i] >= 80
                        ? "linear-gradient(90deg,#38bdf8,#22c55e)"
                        : stats[i] >= 50
                          ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                          : "linear-gradient(90deg,#f87171,#ef4444)",
                }}
              />
            </div>
            {evs && evs[i] > 0 && (
              <span className="w-10 shrink-0 font-mono text-[10px] font-bold text-dex-gold" title="EV yield">
                +{evs[i]}
              </span>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-3 border-t border-line pt-2">
        <span className="w-14 shrink-0 text-xs font-bold uppercase tracking-wide text-muted">Total</span>
        <span className="w-9 shrink-0 text-right font-mono text-sm font-black">{total}</span>
        <div className="h-2.5 flex-1 rounded-full bg-gradient-to-r from-dex-red to-dex-gold opacity-80" />
      </div>
    </div>
  );
}
