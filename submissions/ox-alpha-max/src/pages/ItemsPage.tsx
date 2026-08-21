import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { itemSpriteUrl } from "../lib/data";
import { formatName } from "../lib/utils";
import itemsJson from "../data/items.json";

interface ItemEntry {
  n: string;
  c: string;
  cost: number;
  e: string;
}

const ITEMS = itemsJson as ItemEntry[];

export function ItemsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(120);

  const categories = useMemo(() => [...new Set(ITEMS.map((i) => i.c))].sort(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter(
      (i) =>
        (!q || i.n.includes(q.replace(/\s+/g, "-")) || i.e.toLowerCase().includes(q)) &&
        (!category || i.c === category)
    );
  }, [query, category]);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Items</h1>
      <p className="mt-1 text-sm text-muted">{ITEMS.length.toLocaleString()} items — hold items, berries-adjacent goods, balls, TMs and more.</p>

      <div className="sticky top-14 z-40 -mx-4 mt-4 border-b border-line glass px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-xl border border-line bg-panel py-2 pl-9 pr-8 text-sm outline-none placeholder:text-muted focus:border-dex-red/50"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className="rounded-xl border border-line bg-panel px-3 py-2 text-sm font-semibold capitalize outline-none focus:border-dex-red/50"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{formatName(c)}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-3 mt-3 text-xs font-semibold uppercase tracking-widest text-muted">
        {filtered.length.toLocaleString()} items
      </p>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {filtered.slice(0, limit).map((i) => (
          <div
            key={i.n}
            title={i.e || i.n}
            className="group rounded-xl border border-line bg-panel p-3 text-center transition-all hover:-translate-y-0.5 hover:border-dex-red/40 hover:shadow-lg"
          >
            <img
              src={itemSpriteUrl(i.n)}
              alt={formatName(i.n)}
              loading="lazy"
              className="mx-auto h-12 w-12 object-contain transition-transform group-hover:scale-110"
              onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.15")}
            />
            <p className="mt-1.5 truncate text-[11px] font-bold" title={formatName(i.n)}>
              {formatName(i.n)}
            </p>
            <p className="truncate text-[10px] capitalize text-muted">{i.c.replace(/-/g, " ")}</p>
          </div>
        ))}
      </div>

      {limit < filtered.length && (
        <div className="mt-5 text-center">
          <button onClick={() => setLimit((l) => l + 180)} className="rounded-xl bg-dex-red px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-dex-red/25 transition-transform hover:scale-105">
            Show more ({(filtered.length - limit).toLocaleString()} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
