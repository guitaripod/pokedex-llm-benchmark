import { TYPES, MULT_LABEL, effectiveness, typeColor } from "../lib/utils";
import { TypeBadge } from "../components/TypeBadge";

export function TypesPage() {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Types</h1>
      <p className="mt-1 text-sm text-muted">
        The full 18-type matrix. Rows: attacking type · Columns: defending type.
      </p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-panel p-3">
        <table className="border-separate border-spacing-0.5 text-center">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-panel p-1"></th>
              {TYPES.map((d) => (
                <th key={d} className="p-1 align-bottom">
                  <div className="mx-auto grid h-8 w-8 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${typeColor(d)} 25%, transparent)` }}>
                    <span className="h-4 w-4 rounded-full" style={{ background: typeColor(d) }} title={d} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map((atk) => (
              <tr key={atk}>
                <td className="sticky left-0 z-10 bg-panel p-1 text-left">
                  <span className="whitespace-nowrap text-[11px] font-bold capitalize">{atk}</span>
                </td>
                {TYPES.map((def) => {
                  const mult = effectiveness(atk, [def]);
                  const bg =
                    mult === 0
                      ? "color-mix(in srgb, var(--muted) 22%, transparent)"
                      : mult === 0.5
                        ? "color-mix(in srgb, #22c55e 18%, transparent)"
                        : mult === 2
                          ? "color-mix(in srgb, #ef4444 20%, transparent)"
                          : "transparent";
                  return (
                    <td key={def} className="p-0" title={`${atk} → ${def}: ×${mult}`}>
                      <div
                        className="grid h-7 w-9 place-items-center rounded font-mono text-[10px] font-bold"
                        style={{ background: bg, color: mult === 0 ? "var(--muted)" : mult > 1 ? "#ef4444" : mult < 1 ? "#22c55e" : "var(--muted)" }}
                      >
                        {MULT_LABEL[mult] ?? mult}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TYPES.map((t) => {
          const strong = TYPES.filter((d) => effectiveness(t, [d]) > 1);
          const weak = TYPES.filter((d) => effectiveness(t, [d]) < 1 && effectiveness(t, [d]) > 0);
          const noEffect = TYPES.filter((d) => effectiveness(t, [d]) === 0);
          return (
            <div key={t} className="rounded-2xl border border-line bg-panel p-4">
              <div className="flex items-center justify-between">
                <TypeBadge type={t} size="md" />
              </div>
              <MatchRow label="Super effective vs" types={strong} tone="text-red-500" />
              <MatchRow label="Not very effective vs" types={weak} tone="text-green-500" />
              <MatchRow label="No effect vs" types={noEffect} tone="text-muted" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchRow({ label, types, tone }: { label: string; types: string[]; tone: string }) {
  if (!types.length) return null;
  return (
    <div className="mt-2.5">
      <p className={`text-[10px] font-bold uppercase tracking-widest ${tone}`}>{label}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {types.map((t) => (
          <TypeBadge key={t} type={t} size="sm" />
        ))}
      </div>
    </div>
  );
}
