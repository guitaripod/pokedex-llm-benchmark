import { defensiveProfile, MULT_LABEL, TYPES, typeColor } from "../lib/utils";

export function DefensesGrid({ types }: { types: string[] }) {
  const profile = defensiveProfile(types);
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
      {TYPES.map((t) => {
        const mult = profile[t];
        const weak = mult > 1;
        const resist = mult < 1 && mult > 0;
        const immune = mult === 0;
        return (
          <div
            key={t}
            title={`${t}: ×${mult}`}
            className="flex flex-col items-center gap-0.5 rounded-lg border py-1.5 transition-transform hover:scale-105"
            style={{
              borderColor: weak ? "rgba(239,68,68,.45)" : immune ? "rgba(0,0,0,.4)" : resist ? "rgba(34,197,94,.4)" : "var(--line)",
              background: weak
                ? "color-mix(in srgb, #ef4444 12%, transparent)"
                : immune
                  ? "color-mix(in srgb, var(--muted) 14%, transparent)"
                  : resist
                    ? "color-mix(in srgb, #22c55e 10%, transparent)"
                    : "transparent",
            }}
          >
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: typeColor(t) }} />
            <span className={`font-mono text-[11px] font-bold ${weak ? "text-red-500" : immune ? "text-muted line-through" : resist ? "text-green-500" : "text-muted"}`}>
              {MULT_LABEL[mult] ?? mult}
            </span>
          </div>
        );
      })}
    </div>
  );
}
