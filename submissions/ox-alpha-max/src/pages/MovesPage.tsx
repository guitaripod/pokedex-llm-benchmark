import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { MOVES } from "../lib/data";
import { TYPES, formatName } from "../lib/utils";
import { TypeBadge } from "../components/TypeBadge";
import { MoveDetailModal } from "../components/MoveDetailModal";

const CLASSES = ["physical", "special", "status"] as const;
const CLASS_COLORS: Record<string, string> = {
  physical: "bg-red-500/15 text-red-500",
  special: "bg-sky-500/15 text-sky-500",
  status: "bg-violet-500/15 text-violet-400",
};

export function MovesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [cls, setCls] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOVES.filter(
      (m) =>
        (!q || m.n.includes(q.replace(/\s+/g, "-")) || m.e.toLowerCase().includes(q)) &&
        (!type || m.t === type) &&
        (!cls || m.c === cls)
    );
  }, [query, type, cls]);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Moves</h1>
      <p className="mt-1 text-sm text-muted">{MOVES.length} moves across all generations.</p>

      <div className="sticky top-14 z-40 -mx-4 mt-4 border-b border-line glass px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search moves or effects…"
              className="w-full rounded-xl border border-line bg-panel py-2 pl-9 pr-8 text-sm outline-none placeholder:text-muted focus:border-dex-red/50"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type filter" className="rounded-xl border border-line bg-panel px-3 py-2 text-sm font-semibold capitalize outline-none focus:border-dex-red/50">
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{formatName(t)}</option>
            ))}
          </select>
          <select value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class filter" className="rounded-xl border border-line bg-panel px-3 py-2 text-sm font-semibold capitalize outline-none focus:border-dex-red/50">
            <option value="">All classes</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>{formatName(c)}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-widest text-muted">
        {filtered.length.toLocaleString()} moves
      </p>

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel-2 text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-3 py-2.5">Move</th>
              <th className="hidden px-3 py-2.5 sm:table-cell">Type</th>
              <th className="hidden px-3 py-2.5 md:table-cell">Class</th>
              <th className="px-3 py-2.5 text-right">Power</th>
              <th className="px-3 py-2.5 text-right">Acc</th>
              <th className="hidden px-3 py-2.5 text-right sm:table-cell">PP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((m, i) => (
              <tr
                key={m.n}
                onClick={() => setSelected(m.n)}
                className={`cursor-pointer transition-colors hover:bg-panel-2 ${i % 2 ? "bg-panel-2/30" : ""}`}
              >
                <td className="max-w-52 truncate px-3 py-2 font-semibold">
                  {formatName(m.n)}
                  <span className="block truncate text-[11px] font-normal text-muted sm:hidden">{m.e}</span>
                </td>
                <td className="hidden px-3 py-2 sm:table-cell"><TypeBadge type={m.t} size="sm" /></td>
                <td className="hidden px-3 py-2 md:table-cell">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CLASS_COLORS[m.c]}`}>{m.c}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold">{m.p ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-muted">{m.a != null ? `${m.a}%` : "—"}</td>
                <td className="hidden px-3 py-2 text-right font-mono text-xs text-muted sm:table-cell">{m.pp ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {limit < filtered.length && (
        <div className="mt-5 text-center">
          <button onClick={() => setLimit((l) => l + 150)} className="rounded-xl bg-dex-red px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-dex-red/25 transition-transform hover:scale-105">
            Show more ({filtered.length - limit} remaining)
          </button>
        </div>
      )}

      <MoveDetailModal moveName={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
