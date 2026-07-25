import { BATTLE_TYPE_IDS, effectivenessLabel } from '@/lib/game'
import { typeSlug, useDex } from '@/lib/dex'
import { typingKey } from './analysis'
import { cx } from '@/lib/cx'

/// Maps a multiplier onto a background so holes read red and super-effective reads green.
function cellBackground(value: number): string {
  if (value === 0) return 'color-mix(in oklab, var(--type-dark) 50%, transparent)'
  if (value <= 0.25) return 'color-mix(in oklab, var(--type-fighting) 48%, transparent)'
  if (value < 1) return 'color-mix(in oklab, var(--type-fighting) 24%, transparent)'
  if (value === 1) return 'transparent'
  if (value <= 2) return 'color-mix(in oklab, var(--type-grass) 28%, transparent)'
  return 'color-mix(in oklab, var(--type-grass) 58%, transparent)'
}

function glyph(value: number): string {
  return effectivenessLabel(value).replace('×', '')
}

export function CoverageMatrix({ byKey }: { byKey: Map<string, number> }) {
  const dex = useDex()
  const abbreviation = (typeId: number) => (dex.typeById.get(typeId)?.label ?? '').slice(0, 3).toUpperCase()

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto rounded-plate border border-line">
        <table className="border-collapse">
          <caption className="sr-only">
            Best multiplier of the selected attacking types against every mono and dual typing
          </caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-1" />
              {BATTLE_TYPE_IDS.map((typeId) => (
                <th key={typeId} scope="col" className="bg-surface p-1">
                  <span
                    className="numeric block w-[30px] rounded-[3px] py-1 text-center text-[9px] font-bold uppercase tracking-[0.04em] text-[#0b0d12]"
                    style={{ background: `var(--type-${typeSlug(typeId)})` }}
                    title={dex.typeById.get(typeId)?.label}
                  >
                    {abbreviation(typeId)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BATTLE_TYPE_IDS.map((rowType) => (
              <tr key={rowType}>
                <th scope="row" className="sticky left-0 z-10 bg-surface p-1 text-left">
                  <span
                    className="numeric block w-[30px] rounded-[3px] py-1 text-center text-[9px] font-bold uppercase tracking-[0.04em] text-[#0b0d12]"
                    style={{ background: `var(--type-${typeSlug(rowType)})` }}
                    title={dex.typeById.get(rowType)?.label}
                  >
                    {abbreviation(rowType)}
                  </span>
                </th>
                {BATTLE_TYPE_IDS.map((columnType) => {
                  const types = rowType === columnType ? [rowType] : [rowType, columnType]
                  const value = byKey.get(typingKey(types)) ?? 1
                  const label =
                    rowType === columnType
                      ? dex.typeById.get(rowType)?.label
                      : `${dex.typeById.get(rowType)?.label} / ${dex.typeById.get(columnType)?.label}`
                  return (
                    <td key={columnType} className="p-[2px]">
                      <span
                        title={`${label}: ${effectivenessLabel(value)}`}
                        className={cx(
                          'numeric flex h-[26px] w-[30px] items-center justify-center rounded-[3px] text-[10px] font-semibold',
                          value < 1 ? 'text-ink' : 'text-dim',
                          rowType === columnType && 'ring-1 ring-inset ring-[var(--ui-line)]',
                        )}
                        style={{ background: cellBackground(value) }}
                      >
                        {glyph(value)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {[0, 0.25, 0.5, 1, 2, 4].map((value) => (
          <span key={value} className="flex items-center gap-1.5">
            <span
              className="h-3.5 w-5 rounded-[3px] border border-line-soft"
              style={{ background: cellBackground(value) }}
            />
            <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
              {effectivenessLabel(value)}
            </span>
          </span>
        ))}
        <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
          Diagonal = mono type
        </span>
      </div>
    </div>
  )
}
