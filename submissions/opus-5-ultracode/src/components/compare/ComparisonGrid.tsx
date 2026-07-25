import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface ComparisonColumn {
  key: number
  header: ReactNode
}

export interface ComparisonRow {
  key: string
  label: string
  hint?: string
  color?: string
  /** Direction that counts as "better"; omit for descriptive rows. */
  better?: 'high' | 'low'
  /** Comparable numbers aligned with the columns; null marks missing data. */
  values?: (number | null)[]
  /** Renders the gap to the winner when the raw unit differs from the displayed one. */
  formatDelta?: (delta: number) => string
  cells: ReactNode[]
}

/// Picks the winning value for a row, ignoring empty columns and rows where every column ties.
function bestValue(row: ComparisonRow): number | null {
  if (!row.values || !row.better) return null
  const present = row.values.filter((value): value is number => value !== null)
  if (present.length < 2) return null
  const best = row.better === 'high' ? Math.max(...present) : Math.min(...present)
  return present.every((value) => value === best) ? null : best
}

export function ComparisonGrid({
  columns,
  rows,
}: {
  columns: ComparisonColumn[]
  rows: ComparisonRow[]
}) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <div className="min-w-max px-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-20 bg-surface p-0 text-left">
                <span className="sr-only">Attribute</span>
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="min-w-[140px] border-b border-line px-3 pb-3 align-bottom"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const best = bestValue(row)
              return (
                <tr key={row.key} className="border-b border-line-soft last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 whitespace-nowrap bg-surface py-2 pr-4 text-left align-middle"
                  >
                    <span className="flex items-center gap-2">
                      {row.color && (
                        <span
                          aria-hidden
                          className="h-2.5 w-[3px] shrink-0 rounded-full"
                          style={{ background: row.color }}
                        />
                      )}
                      <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                        {row.label}
                      </span>
                      {row.hint && <span className="text-[10px] text-faint/70">{row.hint}</span>}
                    </span>
                  </th>
                  {columns.map((column, index) => {
                    const value = row.values?.[index] ?? null
                    const winner = best !== null && value !== null && value === best
                    const delta = best !== null && value !== null && !winner ? value - best : null
                    return (
                      <td
                        key={column.key}
                        className={cx('px-3 py-2 align-middle', winner && 'font-semibold')}
                        style={
                          winner
                            ? {
                                background: `color-mix(in oklab, ${row.color ?? 'var(--accent)'} 14%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        <span className="flex items-baseline gap-1.5">
                          {row.cells[index]}
                          {winner && (
                            <span
                              aria-label="best"
                              title="Best in this comparison"
                              className="numeric text-[9px] font-bold uppercase tracking-[0.1em]"
                              style={{ color: row.color ?? 'var(--accent)' }}
                            >
                              ▲
                            </span>
                          )}
                          {delta !== null && delta !== 0 && (
                            <span className="numeric text-[10px] text-faint">
                              {row.formatDelta ? row.formatDelta(delta) : delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
