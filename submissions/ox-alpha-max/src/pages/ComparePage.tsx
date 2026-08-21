import { useMemo, useState } from "react";
import { Search, X, ArrowLeftRight } from "lucide-react";
import { BASE_DEX, DEX_BY_ID, artworkUrl, type DexEntry } from "../lib/data";
import { STAT_META, formatId, formatName, statTotal } from "../lib/utils";
import { TypeBadge } from "../components/TypeBadge";
import { DefensesGrid } from "../components/DefensesGrid";

const KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;

export function ComparePage() {
  const [left, setLeft] = useState<number | null>(6);
  const [right, setRight] = useState<number | null>(9);
  const [picking, setPicking] = useState<"left" | "right" | null>(null);

  const L = left != null ? DEX_BY_ID.get(left) : null;
  const R = right != null ? DEX_BY_ID.get(right) : null;

  const winner = useMemo(() => {
    if (!L || !R) return null;
    return KEYS.map((_, i) => (L.s[i] === R.s[i] ? 0 : L.s[i] > R.s[i] ? -1 : 1));
  }, [L, R]);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Compare</h1>
      <p className="mt-1 text-sm text-muted">Put two Pokemon side by side — stats, types and defenses.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Side entry={L} onPick={() => setPicking("left")} />
        <div className="hidden self-center md:block">
          <ArrowLeftRight className="h-6 w-6 text-muted" />
        </div>
        <Side entry={R} onPick={() => setPicking("right")} />
      </div>

      {L && R && (
        <>
          <section className="mt-4 rounded-2xl border border-line bg-panel p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-muted">Base Stats</h2>
            <div className="space-y-3">
              {KEYS.map((k, i) => {
                const meta = STAT_META[k];
                const max = Math.max(L.s[i], R.s[i], meta.max * 0.6);
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className={`w-10 shrink-0 text-right font-mono text-sm font-bold ${winner![i] === -1 ? "text-dex-red" : "text-muted"}`}>
                      {L.s[i]}
                    </span>
                    <div className="flex h-3 flex-1 justify-end overflow-hidden rounded-full bg-panel-2">
                      <div
                        className="h-full rounded-l-full transition-all duration-500"
                        style={{ width: `${(L.s[i] / max) * 100}%`, background: winner![i] === -1 ? "#ef4444" : "color-mix(in srgb, #ef4444 40%, transparent)" }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-center text-[10px] font-bold uppercase tracking-wide text-muted">{meta.short}</span>
                    <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-panel-2">
                      <div
                        className="h-full rounded-r-full transition-all duration-500"
                        style={{ width: `${(R.s[i] / max) * 100}%`, background: winner![i] === 1 ? "#38bdf8" : "color-mix(in srgb, #38bdf8 40%, transparent)" }}
                      />
                    </div>
                    <span className={`w-10 shrink-0 font-mono text-sm font-bold ${winner![i] === 1 ? "text-sky-500" : "text-muted"}`}>
                      {R.s[i]}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 border-t border-line pt-3">
                <span className={`w-10 shrink-0 text-right font-mono text-sm font-black ${statTotal(L.s) > statTotal(R.s) ? "text-dex-red" : ""}`}>
                  {statTotal(L.s)}
                </span>
                <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted">Total</span>
                <span className={`w-10 shrink-0 font-mono text-sm font-black ${statTotal(R.s) > statTotal(L.s) ? "text-sky-500" : ""}`}>
                  {statTotal(R.s)}
                </span>
              </div>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-muted">{formatName(L.n)} Defenses</h2>
              <DefensesGrid types={L.t} />
            </section>
            <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-muted">{formatName(R.n)} Defenses</h2>
              <DefensesGrid types={R.t} />
            </section>
          </div>
        </>
      )}

      {picking && (
        <PickerModal
          current={picking === "left" ? left : right}
          onPick={(id) => (picking === "left" ? setLeft(id) : setRight(id))}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

function Side({ entry, onPick }: { entry: DexEntry | null | undefined; onPick: () => void }) {
  if (!entry) {
    return (
      <button
        onClick={onPick}
        className="grid min-h-56 w-full place-items-center rounded-2xl border-2 border-dashed border-line bg-panel/50 text-sm font-bold text-muted transition-colors hover:border-dex-red/40 hover:text-dex-red"
      >
        Choose a Pokemon
      </button>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4 text-center">
      <button onClick={onPick} aria-label="Change Pokemon" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-panel-2 text-muted hover:text-ink">
        <X className="h-3.5 w-3.5" />
      </button>
      <img src={artworkUrl(entry.i)} alt={entry.n} className="mx-auto h-32 w-32 object-contain" loading="lazy" />
      <p className="font-mono text-xs font-bold text-muted">{formatId(entry.i)}</p>
      <p className="text-xl font-black capitalize">{formatName(entry.n)}</p>
      <div className="mt-2 flex justify-center gap-1.5">
        {entry.t.map((t) => (
          <TypeBadge key={t} type={t} size="sm" />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <Mini label="Height" value={`${(entry.h / 10).toFixed(1)}m`} />
        <Mini label="Weight" value={`${(entry.w / 10).toFixed(1)}kg`} />
        <Mini label="Gen" value={String(entry.g)} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel-2 px-2 py-1.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className="font-mono font-bold">{value}</p>
    </div>
  );
}

function PickerModal({
  onPick,
  onClose,
  current,
}: {
  onPick: (id: number) => void;
  onClose: () => void;
  current: number | null;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const query = q.trim().toLowerCase().replace(/\s+/g, "-");
    return BASE_DEX.filter((p) => (!query || p.n.includes(query) || String(p.i) === query)).slice(0, 60);
  }, [q]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
      >
        <div className="border-b border-line p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a Pokemon…"
              className="w-full rounded-xl border border-line bg-panel-2 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-dex-red/50"
            />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
          {results.map((p) => (
            <button
              key={p.i}
              onClick={() => {
                onPick(p.i);
                onClose();
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all hover:-translate-y-0.5 ${
                p.i === current ? "border-dex-red/50 bg-dex-red/5" : "border-line bg-panel-2 hover:border-dex-red/40"
              }`}
            >
              <img src={artworkUrl(p.i)} alt={p.n} loading="lazy" className="h-14 w-14 object-contain" />
              <span className="w-full truncate text-[11px] font-bold capitalize">{formatName(p.n)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
