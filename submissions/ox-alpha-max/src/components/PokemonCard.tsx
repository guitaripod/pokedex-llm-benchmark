import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import type { DexEntry } from "../lib/data";
import { artworkUrl, spriteUrl } from "../lib/data";
import { formatId, formatName, statTotal } from "../lib/utils";
import { TypeBadge } from "./TypeBadge";

export function PokemonCard({
  p,
  shiny,
  favorite,
  index = 0,
}: {
  p: DexEntry;
  shiny: boolean;
  favorite: boolean;
  index?: number;
}) {
  const t1 = p.t[0];
  const total = statTotal(p.s);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index % 24, 12) * 0.02 }}
    >
      <Link
        to={`/pokemon/${p.i}`}
        className="group relative block overflow-hidden rounded-2xl border border-line bg-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-dex-red"
        style={{ ["--card-type" as string]: `var(--color-t-${t1})` }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 -top-16 h-40 opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
          style={{ background: `radial-gradient(closest-side, var(--color-t-${t1}), transparent)` }}
        />
        <div className="relative aspect-square overflow-hidden">
          <img
            src={artworkUrl(p.i, shiny)}
            alt={formatName(p.n)}
            loading="lazy"
            decoding="async"
            className="h-full w-full scale-90 object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = spriteUrl(p.i, shiny);
              } else {
                img.style.visibility = "hidden";
              }
            }}
          />
          <span className="absolute left-2.5 top-2.5 font-mono text-[11px] font-bold text-muted">
            {formatId(p.i)}
          </span>
          <div className="absolute right-2 top-2 flex gap-1">
            {favorite && (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-panel/80 text-dex-red shadow">
                <Heart className="h-3.5 w-3.5 fill-current" />
              </span>
            )}
            {p.l && (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-panel/80 text-dex-gold shadow" title="Legendary">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            )}
            {p.m && (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-panel/80 text-fuchsia-500 shadow" title="Mythical">
                <Star />
              </span>
            )}
          </div>
        </div>
        <div className="relative border-t border-line px-3 pb-3 pt-2">
          <p className="truncate text-sm font-bold">{formatName(p.n)}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex gap-1">
              {p.t.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
            <span className="font-mono text-[10px] font-semibold text-muted">{total}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
    </svg>
  );
}
