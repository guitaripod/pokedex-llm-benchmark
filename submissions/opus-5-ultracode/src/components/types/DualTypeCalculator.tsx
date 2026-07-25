import { useMemo } from 'react'
import { Chip } from '@/components/ui/Controls'
import { EmptyState, SectionTitle, Stat } from '@/components/ui/Panel'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { typeSlug } from '@/lib/dex'
import { effectivenessLabel, type TypeChart } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { TypeInfo } from '@/types/data'
import { cellVisual, defensiveRow, groupByMultiplier, matchupWord, typeAbbr } from './chart'
import { MatchupGroup } from './MatchupGroup'

export function DualTypeCalculator({
  types,
  chart,
  eraLabel,
  value,
  onChange,
}: {
  types: TypeInfo[]
  chart: TypeChart
  eraLabel: string
  value: number[]
  onChange: (value: number[]) => void
}) {
  const available = useMemo(() => new Set(types.map((type) => type.id)), [types])
  const selected = useMemo(() => value.filter((id) => available.has(id)), [value, available])

  const row = useMemo(
    () =>
      selected.length ? defensiveRow(chart, selected, selected[1] ?? null, [...available]) : null,
    [chart, selected, available],
  )
  const groups = useMemo(
    () => (row ? groupByMultiplier(row.byType, types.map((type) => type.id)) : []),
    [row, types],
  )

  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((entry) => entry !== id))
      return
    }
    onChange(selected.length >= 2 ? [selected[1], id] : [...selected, id])
  }

  return (
    <div>
      <SectionTitle
        eyebrow={`Defending · ${eraLabel}`}
        actions={
          selected.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="numeric rounded-chip border border-line px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-dim transition hover:bg-raised hover:text-ink"
            >
              Clear
            </button>
          ) : undefined
        }
      >
        Dual-type calculator
      </SectionTitle>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div>
          <p className="mb-2.5 text-xs leading-relaxed text-dim">
            Pick one or two defending types. Every attacking type is multiplied through both columns of
            the chart.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {types.map((type) => (
              <Chip
                key={type.id}
                active={selected.includes(type.id)}
                color={`var(--type-${typeSlug(type.id)})`}
                onClick={() => toggle(type.id)}
                title={type.label}
              >
                {type.label}
              </Chip>
            ))}
          </div>

          {selected.length > 0 && row && (
            <div className="mt-4 rounded-chip border border-line-soft bg-surface p-3">
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {selected.map((id) => {
                  const type = types.find((entry) => entry.id === id)
                  return type ? (
                    <TypeBadge key={id} typeId={id} label={type.label} size="md" link={false} />
                  ) : null
                })}
                {selected.length === 1 && (
                  <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
                    mono-type
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label="Weak"
                  value={row.weaknesses}
                  hint={row.quadWeaknesses ? `${row.quadWeaknesses} at 4×` : undefined}
                />
                <Stat
                  label="Resist"
                  value={row.resistances}
                  hint={row.quadResistances ? `${row.quadResistances} at ¼×` : undefined}
                />
                <Stat label="Immune" value={row.immunities} />
                <Stat label="Mean ×" value={row.mean.toFixed(2)} accent />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          {!row ? (
            <EmptyState
              title="No defending type selected"
              hint="Choose a type to see how all attacking types land against it."
            />
          ) : (
            <>
              <div className="mb-4 overflow-x-auto">
                <div className="flex min-w-max gap-[3px]">
                  {types.map((type) => {
                    const multiplier = row.byType[type.id] ?? 1
                    const visual = cellVisual(multiplier)
                    return (
                      <div key={type.id} className="w-[38px] shrink-0 text-center">
                        <span
                          aria-hidden
                          className="mx-auto mb-1 block h-1 w-5 rounded-full"
                          style={{ background: `var(--type-${typeSlug(type.id)})` }}
                        />
                        <span className="numeric mb-1 block text-[9px] font-semibold tracking-[0.06em] text-faint">
                          {typeAbbr(type.label)}
                        </span>
                        <span
                          style={visual.style}
                          title={`${type.label}: ${effectivenessLabel(multiplier)} — ${matchupWord(multiplier)}`}
                          className={cx(
                            'numeric flex h-8 items-center justify-center rounded-chip border border-line-soft text-[11px]',
                            visual.bold && 'font-bold',
                          )}
                        >
                          {effectivenessLabel(multiplier)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-chip border border-line-soft bg-surface px-3">
                {groups.map((group) => (
                  <MatchupGroup key={group.value} value={group.value} typeIds={group.typeIds} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
