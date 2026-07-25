import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionTitle } from '@/components/ui/Panel'
import { TypeDot } from '@/components/ui/TypeBadge'
import { typeSlug, useDex } from '@/lib/dex'
import { BATTLE_TYPE_IDS, effectiveness, effectivenessLabel } from '@/lib/game'

/// Maps a damage multiplier to the swatch colour used by the matrix cells.
function cellColor(value: number): string {
  if (value === 0) return 'color-mix(in oklab, var(--ui-text-faint) 52%, transparent)'
  if (value < 1) return 'color-mix(in oklab, var(--type-fighting) 55%, transparent)'
  if (value > 1) return 'color-mix(in oklab, var(--type-grass) 62%, transparent)'
  return 'color-mix(in oklab, var(--ui-text-faint) 12%, transparent)'
}

export function TypeChartTeaser() {
  const dex = useDex()

  const matrix = useMemo(
    () =>
      BATTLE_TYPE_IDS.map((attacking) => ({
        attacking,
        cells: BATTLE_TYPE_IDS.map((defending) => ({
          defending,
          value: effectiveness(dex.meta.typeChart, attacking, [defending]),
        })),
      })),
    [dex],
  )

  const shortLabel = (id: number) => (dex.typeById.get(id)?.label ?? '').slice(0, 3).toUpperCase()

  return (
    <Panel className="min-w-0">
      <SectionTitle
        eyebrow="Matchups"
        actions={
          <Link
            to="/types"
            className="numeric rounded-chip border border-line px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim transition hover:bg-raised hover:text-ink"
          >
            Full chart
          </Link>
        }
      >
        Type effectiveness
      </SectionTitle>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="min-w-[320px]">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `26px repeat(${BATTLE_TYPE_IDS.length}, minmax(0, 1fr))` }}
          >
            <span aria-hidden />
            {BATTLE_TYPE_IDS.map((typeId) => (
              <span
                key={`head-${typeId}`}
                className="flex h-4 items-center justify-center"
                title={dex.typeById.get(typeId)?.label}
              >
                <TypeDot typeId={typeId} size={7} />
              </span>
            ))}

            {matrix.map((row) => (
              <Fragment key={row.attacking}>
                <Link
                  to={`/types/${typeSlug(row.attacking)}`}
                  title={dex.typeById.get(row.attacking)?.label}
                  className="numeric flex h-[13px] items-center text-[8px] font-semibold uppercase tracking-[0.06em] text-faint transition hover:text-ink"
                >
                  {shortLabel(row.attacking)}
                </Link>
                {row.cells.map((cell) => (
                  <span
                    key={cell.defending}
                    title={`${dex.typeById.get(row.attacking)?.label} → ${dex.typeById.get(cell.defending)?.label} · ${effectivenessLabel(cell.value)}`}
                    className="h-[13px] rounded-[2px]"
                    style={{ background: cellColor(cell.value) }}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line-soft pt-3">
        <Legend value={2} label="Super effective" />
        <Legend value={0.5} label="Resisted" />
        <Legend value={0} label="Immune" />
        <p className="numeric ml-auto text-[10px] uppercase tracking-[0.14em] text-faint">
          Attacker → defender
        </p>
      </div>
    </Panel>
  )
}

function Legend({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-[2px]" style={{ background: cellColor(value) }} aria-hidden />
      <span className="numeric text-[10px] uppercase tracking-[0.12em] text-dim">
        {label} <span className="text-faint">{effectivenessLabel(value)}</span>
      </span>
    </span>
  )
}
