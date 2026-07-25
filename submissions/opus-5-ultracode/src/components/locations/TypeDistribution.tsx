import { typeSlug, useDex } from '@/lib/dex'
import { TypeDot } from '@/components/ui/TypeBadge'

export interface TypeTally {
  typeId: number
  count: number
}

/// Stacked share of every type carried by the Pokémon recorded at a location.
export function TypeDistribution({ tallies }: { tallies: TypeTally[] }) {
  const dex = useDex()
  const total = tallies.reduce((sum, tally) => sum + tally.count, 0)
  if (total === 0) return null

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-raised" role="presentation">
        {tallies.map((tally) => (
          <span
            key={tally.typeId}
            title={`${dex.typeById.get(tally.typeId)?.label ?? ''} · ${tally.count}`}
            className="h-full min-w-[2px]"
            style={{
              width: `${(tally.count / total) * 100}%`,
              background: `var(--type-${typeSlug(tally.typeId)})`,
            }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {tallies.slice(0, 10).map((tally) => (
          <li key={tally.typeId} className="flex items-center gap-1.5">
            <TypeDot typeId={tally.typeId} />
            <span className="text-[11px] text-dim">{dex.typeById.get(tally.typeId)?.label}</span>
            <span className="numeric text-[11px] font-semibold text-faint">{tally.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
