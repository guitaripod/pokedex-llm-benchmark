import { useMemo, useRef, useState, useEffect } from "react";
import { Search, X, Heart, Sparkles, Star, Gem, Layers } from "lucide-react";
import { BASE_DEX, DEX, GENERATIONS, TOTAL_SPECIES, type DexEntry } from "../lib/data";
import { TYPES, formatName, statTotal } from "../lib/utils";
import { useFavorites } from "../lib/store";
import { PokemonCard } from "../components/PokemonCard";

const PAGE = 60;

type SortKey = "id" | "id-desc" | "name" | "total" | "hp" | "atk" | "def" | "spe";

export function DexPage() {
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [gen, setGen] = useState(0);
  const [sort, setSort] = useState<SortKey>("id");
  const [shiny, setShiny] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [legendary, setLegendary] = useState(false);
  const [mythical, setMythical] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [count, setCount] = useState(PAGE);
  const [favs] = useFavorites();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list: DexEntry[] = showForms ? DEX : BASE_DEX;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.n.includes(q.replace(/\s+/g, "-")) || String(p.i) === q || String(p.i).padStart(4, "0") === q
      );
    }
    if (types.length) list = list.filter((p) => types.every((t) => p.t.includes(t)));
    if (gen) list = list.filter((p) => p.g === gen);
    if (favOnly) list = list.filter((p) => favs.includes(p.i));
    if (legendary) list = list.filter((p) => p.l);
    if (mythical) list = list.filter((p) => p.m);

    const sorted = [...list];
    switch (sort) {
      case "id": sorted.sort((a, b) => a.i - b.i); break;
      case "id-desc": sorted.sort((a, b) => b.i - a.i); break;
      case "name": sorted.sort((a, b) => a.n.localeCompare(b.n)); break;
      case "total": sorted.sort((a, b) => statTotal(b.s) - statTotal(a.s)); break;
      case "hp": sorted.sort((a, b) => b.s[0] - a.s[0]); break;
      case "atk": sorted.sort((a, b) => b.s[1] - a.s[1]); break;
      case "def": sorted.sort((a, b) => b.s[2] - a.s[2]); break;
      case "spe": sorted.sort((a, b) => b.s[5] - a.s[5]); break;
    }
    return sorted;
  }, [query, types, gen, sort, favOnly, legendary, mythical, showForms, favs]);

  useEffect(() => setCount(PAGE), [filtered]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setCount((c) => Math.min(c + PAGE, filtered.length));
      },
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  const activeFilters =
    types.length + (gen ? 1 : 0) + (favOnly ? 1 : 0) + (legendary ? 1 : 0) + (mythical ? 1 : 0);

  const clearAll = () => {
    setTypes([]);
    setGen(0);
    setFavOnly(false);
    setLegendary(false);
    setMythical(false);
    setQuery("");
  };

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-dex-red/15 via-panel to-panel p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-dex-red/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-dex-gold/10 blur-3xl" />
        <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
          The Complete{" "}
          <span className="bg-gradient-to-r from-dex-red to-dex-gold bg-clip-text text-transparent">
            Pokedex
          </span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
          All {TOTAL_SPECIES} species, every move, ability, item and berry — full data, beautifully organized.
        </p>
      </section>

      <div className="sticky top-14 z-40 -mx-4 mb-4 border-b border-line glass px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or number…"
              className="w-full rounded-xl border border-line bg-panel py-2 pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted focus:border-dex-red/50"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={gen}
            onChange={(e) => setGen(Number(e.target.value))}
            className="rounded-xl border border-line bg-panel px-3 py-2 text-sm font-semibold outline-none focus:border-dex-red/50"
            aria-label="Generation"
          >
            <option value={0}>All Gens</option>
            {GENERATIONS.map((g) => (
              <option key={g.n} value={g.n}>Gen {g.n} · {formatName(g.region)}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-line bg-panel px-3 py-2 text-sm font-semibold outline-none focus:border-dex-red/50"
            aria-label="Sort"
          >
            <option value="id">№ ascending</option>
            <option value="id-desc">№ descending</option>
            <option value="name">A → Z</option>
            <option value="total">Best total stats</option>
            <option value="hp">Best HP</option>
            <option value="atk">Best Attack</option>
            <option value="def">Best Defense</option>
            <option value="spe">Best Speed</option>
          </select>

          <Toggle active={shiny} onClick={() => setShiny(!shiny)} title="Shiny sprites">
            <Gem className="h-4 w-4" /> Shiny
          </Toggle>
          <Toggle active={favOnly} onClick={() => setFavOnly(!favOnly)} title="Favorites only">
            <Heart className={`h-4 w-4 ${favOnly ? "fill-current" : ""}`} /> Favs
          </Toggle>
          <Toggle active={legendary} onClick={() => setLegendary(!legendary)} title="Legendary only">
            <Sparkles className="h-4 w-4" /> Legendary
          </Toggle>
          <Toggle active={mythical} onClick={() => setMythical(!mythical)} title="Mythical only">
            <Star className="h-4 w-4" /> Mythical
          </Toggle>
          <Toggle active={showForms} onClick={() => setShowForms(!showForms)} title="Include alternate forms">
            <Layers className="h-4 w-4" /> Forms
          </Toggle>
        </div>

        <div className="no-scrollbar mt-2 flex items-center gap-1 overflow-x-auto pb-0.5">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() =>
                setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
              }
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-all ${
                types.includes(t) ? "text-white shadow" : "text-muted hover:text-ink"
              }`}
              style={
                types.includes(t)
                  ? { background: `var(--color-t-${t})` }
                  : { background: `color-mix(in srgb, var(--color-t-${t}) 16%, transparent)` }
              }
            >
              {t}
            </button>
          ))}
          {(activeFilters > 0 || query) && (
            <button
              onClick={clearAll}
              className="ml-1 shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-muted hover:text-dex-red"
            >
              Clear ({activeFilters + (query ? 1 : 0)})
            </button>
          )}
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
        {filtered.length.toLocaleString()} result{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line py-24 text-center">
          <p className="text-lg font-bold">No Pokemon found</p>
          <p className="mt-1 text-sm text-muted">Try different filters or a different search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.slice(0, count).map((p, i) => (
              <PokemonCard key={p.i} p={p} shiny={shiny} favorite={favs.includes(p.i)} index={i} />
            ))}
          </div>
          <div ref={sentinelRef} className="h-4" />
          {count < filtered.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setCount((c) => c + PAGE * 2)}
                className="rounded-xl bg-dex-red px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-dex-red/25 transition-transform hover:scale-105"
              >
                Load more ({filtered.length - count} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
        active
          ? "border-dex-red/40 bg-dex-red/10 text-dex-red"
          : "border-line bg-panel text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
