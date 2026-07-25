import { useMemo } from 'react'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { useDex } from '@/lib/dex'
import { BATTLE_TYPE_IDS, defenseProfile, effectivenessLabel } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry } from '@/types/data'

interface CellTone {
  background: string
  color: string
}

/// Maps an incoming-damage multiplier onto the matrix colour scale.
function toneFor(value: number): CellTone {
  if (value === 0) return { background: 'color-mix(in oklab, var(--type-ghost) 26%, transparent)', color: 'var(--type-ghost)' }
  if (value <= 0.25) return { background: 'color-mix(in oklab, var(--type-grass) 30%, transparent)', color: 'var(--type-grass)' }
  if (value < 1) return { background: 'color-mix(in oklab, var(--type-grass) 15%, transparent)', color: 'var(--type-grass)' }
  if (value === 1) return { background: 'transparent', color: 'var(--ui-text-faint)' }
  if (value >= 4) return { background: 'color-mix(in oklab, var(--type-fighting) 38%, transparent)', color: 'var(--type-fighting)' }
  return { background: 'color-mix(in oklab, var(--type-fighting) 19%, transparent)', color: 'var(--type-fighting)' }
}

const LEGEND: { value: number; label: string }[] = [
  { value: 0, label: 'Immune' },
  { value: 0.25, label: '¼×' },
  { value: 0.5, label: '½×' },
  { value: 1, label: 'Neutral' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
]

export function DefenceMatrix({ entries }: { entries: PokemonIndexEntry[] }) {
  const dex = useDex()

  const profiles = useMemo(
    () => entries.map((entry) => defenseProfile(dex.meta.typeChart, entry.types)),
    [entries, dex.meta.typeChart],
  )

  const sharedWeaknesses = useMemo(() => {
    if (entries.length < 2) return new Set<number>()
    return new Set(
      BATTLE_TYPE_IDS.filter((typeId) => profiles.every((profile) => profile.byType[typeId] > 1)),
    )
  }, [entries.length, profiles])

  return (
    <div className="min-w-0">
      <div className="-mx-5 overflow-x-auto">
        <div className="min-w-max px-5">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Damage taken from each attacking type by every compared Pokémon
            </caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-20 bg-surface p-0 text-left">
                  <span className="numeric block py-2 pr-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                    Attacking
                  </span>
                </th>
                {entries.map((entry) => (
                  <th
                    key={entry.id}
                    scope="col"
                    className="min-w-[84px] border-b border-line px-2 pb-2 text-center"
                  >
                    <span className="numeric block truncate text-[11px] font-semibold text-dim">
                      {entry.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BATTLE_TYPE_IDS.map((typeId) => {
                const shared = sharedWeaknesses.has(typeId)
                return (
                  <tr key={typeId} className="border-b border-line-soft">
                    <th scope="row" className="sticky left-0 z-10 bg-surface py-1 pr-4 text-left">
                      <span className="flex items-center gap-2">
                        <TypeBadge
                          typeId={typeId}
                          label={dex.typeById.get(typeId)?.label ?? ''}
                          size="xs"
                          variant="ghost"
                          link={false}
                        />
                        {shared && (
                          <span
                            title="Every selected Pokémon is weak to this type"
                            className="numeric text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--type-fighting)]"
                          >
                            shared
                          </span>
                        )}
                      </span>
                    </th>
                    {entries.map((entry, index) => {
                      const value = profiles[index].byType[typeId] ?? 1
                      const tone = toneFor(value)
                      return (
                        <td key={entry.id} className="px-1 py-1">
                          <span
                            className={cx(
                              'numeric flex h-7 items-center justify-center rounded-chip text-[11px] font-semibold',
                              value === 1 && 'border border-line-soft',
                            )}
                            style={{ background: tone.background, color: tone.color }}
                          >
                            {effectivenessLabel(value)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <SummaryRow
                label="Weak"
                entries={entries}
                counts={profiles.map((profile) => profile.weaknesses.length)}
                better="low"
                color="var(--type-fighting)"
              />
              <SummaryRow
                label="Resist"
                entries={entries}
                counts={profiles.map((profile) => profile.resistances.length)}
                better="high"
                color="var(--type-grass)"
              />
              <SummaryRow
                label="Immune"
                entries={entries}
                counts={profiles.map((profile) => profile.immunities.length)}
                better="high"
                color="var(--type-ghost)"
              />
            </tfoot>
          </table>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        {LEGEND.map((item) => {
          const tone = toneFor(item.value)
          return (
            <li key={item.value} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-3.5 w-6 rounded-[3px] border border-line-soft"
                style={{ background: tone.background }}
              />
              <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SummaryRow({
  label,
  entries,
  counts,
  better,
  color,
}: {
  label: string
  entries: PokemonIndexEntry[]
  counts: number[]
  better: 'high' | 'low'
  color: string
}) {
  const best = entries.length > 1 ? (better === 'high' ? Math.max(...counts) : Math.min(...counts)) : null

  return (
    <tr className="border-t border-line">
      <th scope="row" className="sticky left-0 z-10 bg-surface py-2 pr-4 text-left">
        <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          {label}
        </span>
      </th>
      {entries.map((entry, index) => (
        <td key={entry.id} className="px-2 py-2 text-center">
          <span
            className="numeric text-[12px] font-bold"
            style={{ color: best !== null && counts[index] === best ? color : 'var(--ui-text-dim)' }}
          >
            {counts[index]}
          </span>
        </td>
      ))}
    </tr>
  )
}
