import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ABILITIES } from "../lib/data";
import { useAbility } from "../lib/api";
import { formatName } from "../lib/utils";

export function AbilitiesPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(60);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ABILITIES.filter((a) => !q || a.n.includes(q.replace(/\s+/g, "-")) || a.e.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Abilities</h1>
      <p className="mt-1 text-sm text-muted">{ABILITIES.length} abilities. Click one for full details and holders.</p>

      <div className="relative mt-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search abilities…"
          className="w-full rounded-xl border border-line bg-panel py-2 pl-9 pr-8 text-sm outline-none placeholder:text-muted focus:border-dex-red/50"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mb-3 mt-3 text-xs font-semibold uppercase tracking-widest text-muted">
        {filtered.length} abilities
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, limit).map((a) => (
          <button
            key={a.n}
            onClick={() => setSelected(a.n)}
            className="rounded-xl border border-line bg-panel p-3 text-left transition-all hover:-translate-y-0.5 hover:border-dex-red/40 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold">{formatName(a.n)}</p>
              <span className="shrink-0 rounded-full bg-panel-2 px-2 py-0.5 font-mono text-[10px] font-bold text-muted">G{a.g}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{a.e}</p>
          </button>
        ))}
      </div>

      {limit < filtered.length && (
        <div className="mt-5 text-center">
          <button onClick={() => setLimit((l) => l + 90)} className="rounded-xl bg-dex-red px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-dex-red/25 transition-transform hover:scale-105">
            Show more ({filtered.length - limit} remaining)
          </button>
        </div>
      )}

      <AbilityModal name={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AbilityModal({ name, onClose }: { name: string | null; onClose: () => void }) {
  const { data } = useAbility(name ?? "");
  if (!name) return null;
  const effect =
    data?.effect_entries.find((e) => e.language.name === "en")?.effect ??
    data?.flavor_text_entries.find((f) => f.language.name === "en")?.flavor_text ??
    "";
  const holders = data?.pokemon.filter((p) => !p.is_hidden).slice(0, 24) ?? [];
  const hiddenHolders = data?.pokemon.filter((p) => p.is_hidden).slice(0, 12) ?? [];

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-panel p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-black">{formatName(name)}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-panel-2 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        {!data ? (
          <div className="mt-4 space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed">{effect}</p>
            {holders.length > 0 && (
              <>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted">Common holders</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {holders.map((h) => (
                    <a key={h.pokemon.name} href={`/pokemon/${h.pokemon.name}`} className="rounded-full bg-panel-2 px-2.5 py-1 text-xs font-semibold capitalize transition-colors hover:bg-dex-red/10 hover:text-dex-red">
                      {formatName(h.pokemon.name)}
                    </a>
                  ))}
                </div>
              </>
            )}
            {hiddenHolders.length > 0 && (
              <>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted">Hidden ability holders</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {hiddenHolders.map((h) => (
                    <a key={h.pokemon.name} href={`/pokemon/${h.pokemon.name}`} className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-fuchsia-500 transition-colors hover:bg-fuchsia-500/20">
                      {formatName(h.pokemon.name)}
                    </a>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
