import { Link } from 'react-router-dom'
import { Panel, SectionTitle } from '@/components/ui/Panel'
import { Sprite } from '@/components/ui/Sprite'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { thumbCandidates } from '@/lib/sprites'
import { formatDex } from '@/lib/game'

/**
 * First-partner species per region. The dataset carries no "starter" flag, so the trios are
 * curated here and resolved against the live index by species id.
 */
const STARTERS: { generation: number; speciesIds: [number, number, number] }[] = [
  { generation: 1, speciesIds: [1, 4, 7] },
  { generation: 2, speciesIds: [152, 155, 158] },
  { generation: 3, speciesIds: [252, 255, 258] },
  { generation: 4, speciesIds: [387, 390, 393] },
  { generation: 5, speciesIds: [495, 498, 501] },
  { generation: 6, speciesIds: [650, 653, 656] },
  { generation: 7, speciesIds: [722, 725, 728] },
  { generation: 8, speciesIds: [810, 813, 816] },
  { generation: 9, speciesIds: [906, 909, 912] },
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

export function StarterShowcase() {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)

  return (
    <Panel className="min-w-0">
      <SectionTitle eyebrow="First partners">Starters by region</SectionTitle>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {STARTERS.map(({ generation, speciesIds }) => {
          const generationInfo = dex.meta.generations.find((item) => item.id === generation)
          const region = dex.meta.regions.find((item) => item.id === generationInfo?.mainRegionId)
          const trio = speciesIds
            .map((speciesId) => dex.defaultBySpecies.get(speciesId))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

          return (
            <div key={generation} className="rounded-plate border border-line-soft bg-surface/40 p-2.5">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="truncate font-display text-[13px] font-semibold">{region?.label ?? '—'}</p>
                <Link
                  to={`/pokedex?g=${generation}`}
                  className="numeric shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint transition hover:text-accent"
                >
                  Gen {ROMAN[generation - 1]}
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {trio.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/pokemon/${entry.name}`}
                    title={`${entry.label} · ${formatDex(entry.dex)}`}
                    style={
                      { '--accent': `var(--type-${typeSlug(entry.types[0] ?? 1)})` } as React.CSSProperties
                    }
                    className="group flex flex-col items-center rounded-chip border border-transparent bg-[color-mix(in_oklab,var(--accent)_9%,transparent)] px-1 py-1.5 transition hover:border-[color-mix(in_oklab,var(--accent)_55%,transparent)]"
                  >
                    <Sprite
                      sources={thumbCandidates(entry.id, shiny)}
                      alt={entry.label}
                      className="h-12 w-12 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-110"
                    />
                    <span className="mt-0.5 w-full truncate text-center text-[11px] leading-tight text-dim transition group-hover:text-ink">
                      {entry.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
