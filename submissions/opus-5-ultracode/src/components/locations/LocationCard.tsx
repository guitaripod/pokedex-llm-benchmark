import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useDex } from '@/lib/dex'
import { cx } from '@/lib/cx'
import { generationNumeral, regionAccent } from './regions'
import type { LocationIndexEntry } from '@/types/data'

export interface LocationCardProps {
  entry: LocationIndexEntry
  /** Highest Pokémon count in the current view; scales the density bar. */
  scale: number
}

export const LocationCard = memo(function LocationCard({ entry, scale }: LocationCardProps) {
  const dex = useDex()
  const barren = entry.pokemonCount === 0
  const region = entry.regionId == null ? null : dex.meta.regions.find((item) => item.id === entry.regionId)
  const density = scale > 0 ? Math.max(2, (entry.pokemonCount / scale) * 100) : 0

  return (
    <Link
      to={`/locations/${entry.name}`}
      style={{ '--accent': regionAccent(entry.regionId) } as React.CSSProperties}
      className={cx(
        'group relative flex w-full min-w-0 flex-col gap-2.5 overflow-hidden rounded-plate border p-3 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-expo)]',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:shadow-[0_12px_36px_-18px_color-mix(in_oklab,var(--accent)_80%,transparent)]',
        barren
          ? 'border-dashed border-line-soft bg-transparent opacity-60 hover:opacity-100'
          : 'border-line bg-[var(--ui-plate)]',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-1/2 h-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)',
        }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="numeric truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          {region?.label ?? 'Unaffiliated'}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {entry.generationIds.map((generationId) => {
            const generation = dex.meta.generations.find((item) => item.id === generationId)
            return (
              <span
                key={generationId}
                title={generation?.label}
                className="numeric rounded-[3px] bg-raised px-1 text-[9px] font-semibold leading-[14px] text-faint"
              >
                {generation ? generationNumeral(generation.name) : generationId}
              </span>
            )
          })}
        </span>
      </div>

      <h3
        className="relative truncate font-display text-[15px] font-semibold leading-tight"
        title={entry.label}
      >
        {entry.label}
      </h3>

      <div className="relative mt-auto flex items-end justify-between gap-3">
        <span className="min-w-0">
          <span className="numeric block text-[9px] font-semibold uppercase tracking-[0.18em] text-faint">
            Species
          </span>
          <span
            className={cx(
              'numeric block text-lg font-bold leading-none',
              barren ? 'text-faint' : 'text-ink',
            )}
          >
            {entry.pokemonCount}
          </span>
        </span>
        <span className="min-w-0 text-right">
          <span className="numeric block text-[9px] font-semibold uppercase tracking-[0.18em] text-faint">
            Areas
          </span>
          <span className="numeric block text-lg font-bold leading-none text-dim">{entry.areaCount}</span>
        </span>
      </div>

      <div className="relative h-1 overflow-hidden rounded-full bg-raised">
        {barren ? (
          <span className="sr-only">No recorded encounters</span>
        ) : (
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-700 ease-[var(--ease-out-expo)]"
            style={{ width: `${Math.min(100, density)}%` }}
          />
        )}
      </div>
    </Link>
  )
})
