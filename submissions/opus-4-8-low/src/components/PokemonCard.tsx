import { Link } from 'react-router-dom'
import { memo } from 'react'
import { artworkUrl, padId, titleCase, spriteUrl } from '../lib/api'
import { TYPE_COLORS } from '../lib/constants'
import { TypeBadge } from './ui'
import type { IndexEntry } from '../lib/data'

export const PokemonCard = memo(function PokemonCard({ p }: { p: IndexEntry }) {
  const c1 = TYPE_COLORS[p.types[0]] ?? TYPE_COLORS.unknown
  const c2 = TYPE_COLORS[p.types[1]] ?? c1
  return (
    <Link
      to={`/pokemon/${p.id}`}
      className="group relative overflow-hidden rounded-2xl border border-white/10 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ background: `linear-gradient(150deg, ${c1.from}22, ${c2.to}33)` }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: c1.solid }}
      />
      <div className="absolute right-3 top-3 text-xs font-black tabular-nums text-slate-500/70 dark:text-white/40">{padId(p.id)}</div>
      <div className="relative flex items-center justify-center">
        <img
          src={artworkUrl(p.id)}
          alt={p.name}
          loading="lazy"
          width={130}
          height={130}
          className="h-32 w-32 object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = spriteUrl(p.id)
          }}
        />
      </div>
      <div className="relative mt-2">
        <h3 className="truncate text-base font-extrabold tracking-tight">{titleCase(p.name)}</h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {p.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" link={false} />
          ))}
        </div>
      </div>
    </Link>
  )
})
