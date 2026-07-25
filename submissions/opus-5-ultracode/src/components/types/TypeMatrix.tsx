import { useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { typeSlug } from '@/lib/dex'
import { effectivenessLabel, type TypeChart } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { TypeInfo } from '@/types/data'
import { cellVisual, matchupWord, typeAbbr } from './chart'

interface Cursor {
  attacker: number
  defender: number
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

function cellId(attacker: number, defender: number): string {
  return `matchup-${attacker}-${defender}`
}

export function TypeMatrix({ types, chart }: { types: TypeInfo[]; chart: TypeChart }) {
  const [cursor, setCursor] = useState<Cursor | null>(null)

  const byId = useMemo(() => new Map(types.map((type) => [type.id, type])), [types])
  const indexById = useMemo(() => new Map(types.map((type, index) => [type.id, index])), [types])

  const tabTarget = cursor ?? { attacker: types[0]?.id ?? 0, defender: types[0]?.id ?? 0 }
  const attacker = cursor ? byId.get(cursor.attacker) : undefined
  const defender = cursor ? byId.get(cursor.defender) : undefined
  const value = cursor ? (chart[cursor.attacker]?.[cursor.defender] ?? 1) : null

  function moveCursor(event: KeyboardEvent<HTMLAnchorElement>, current: Cursor) {
    const delta = ARROWS[event.key]
    const row = indexById.get(current.attacker) ?? 0
    const column = indexById.get(current.defender) ?? 0
    let nextRow = row
    let nextColumn = column
    if (delta) {
      nextRow = Math.min(types.length - 1, Math.max(0, row + delta[0]))
      nextColumn = Math.min(types.length - 1, Math.max(0, column + delta[1]))
    } else if (event.key === 'Home') {
      nextColumn = 0
    } else if (event.key === 'End') {
      nextColumn = types.length - 1
    } else {
      return
    }
    const nextAttacker = types[nextRow]
    const nextDefender = types[nextColumn]
    if (!nextAttacker || !nextDefender) return
    event.preventDefault()
    setCursor({ attacker: nextAttacker.id, defender: nextDefender.id })
    document.getElementById(cellId(nextAttacker.id, nextDefender.id))?.focus()
  }

  return (
    <div>
      <div
        className="mb-3 flex min-h-[42px] flex-wrap items-center gap-x-3 gap-y-2 rounded-chip border border-line-soft bg-surface px-3 py-2"
        role="status"
        aria-live="polite"
      >
        {attacker && defender && value !== null ? (
          <>
            <TypeBadge typeId={attacker.id} label={attacker.label} size="sm" link={false} />
            <span aria-hidden className="text-faint">
              →
            </span>
            <TypeBadge typeId={defender.id} label={defender.label} size="sm" link={false} />
            <span
              style={cellVisual(value).style}
              className="numeric ml-auto inline-flex h-7 min-w-[52px] items-center justify-center rounded-chip border border-line-soft px-2 text-sm font-bold"
            >
              {effectivenessLabel(value)}
            </span>
            <span className="numeric text-[10px] uppercase tracking-[0.16em] text-dim">
              {matchupWord(value)}
            </span>
          </>
        ) : (
          <p className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
            Hover or arrow-key a cell to inspect a matchup
          </p>
        )}
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-plate border border-line bg-panel">
        <table
          className="numeric w-full min-w-max border-separate border-spacing-0 text-[11px]"
          onMouseLeave={() => setCursor(null)}
        >
          <caption className="sr-only">
            Type effectiveness chart. Rows are the attacking type, columns are the defending type.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-30 w-[72px] min-w-[72px] border-b border-r border-line bg-surface px-2 py-1.5 text-left sm:w-[108px] sm:min-w-[108px]"
              >
                <span className="block text-[9px] font-semibold uppercase leading-[1.35] tracking-[0.14em] text-faint">
                  ATK ↓
                </span>
                <span className="block text-[9px] font-semibold uppercase leading-[1.35] tracking-[0.14em] text-faint">
                  DEF →
                </span>
              </th>
              {types.map((type) => {
                const active = cursor?.defender === type.id
                return (
                  <th
                    key={type.id}
                    scope="col"
                    className={cx(
                      'sticky top-0 z-20 w-[34px] min-w-[34px] border-b border-line p-0 transition-colors sm:w-[40px] sm:min-w-[40px]',
                      active ? 'bg-raised' : 'bg-surface',
                    )}
                  >
                    <Link
                      to={`/types/${typeSlug(type.id)}`}
                      title={`${type.label} (defending)`}
                      className="flex h-9 flex-col items-center justify-center gap-1 transition hover:bg-raised"
                    >
                      <span
                        aria-hidden
                        className="h-1 w-4 rounded-full"
                        style={{ background: `var(--type-${typeSlug(type.id)})` }}
                      />
                      <span
                        className={cx(
                          'text-[9px] font-semibold tracking-[0.06em]',
                          active ? 'text-ink' : 'text-dim',
                        )}
                      >
                        {typeAbbr(type.label)}
                      </span>
                    </Link>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <MatrixRow
                key={type.id}
                attacker={type}
                types={types}
                chart={chart}
                cursor={cursor}
                tabTarget={tabTarget}
                onCursor={setCursor}
                onKeyDown={moveCursor}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MatrixRow({
  attacker,
  types,
  chart,
  cursor,
  tabTarget,
  onCursor,
  onKeyDown,
}: {
  attacker: TypeInfo
  types: TypeInfo[]
  chart: TypeChart
  cursor: Cursor | null
  tabTarget: Cursor
  onCursor: (cursor: Cursor) => void
  onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>, cursor: Cursor) => void
}) {
  const rowActive = cursor?.attacker === attacker.id
  const slug = typeSlug(attacker.id)

  return (
    <tr>
      <th
        scope="row"
        className={cx(
          'sticky left-0 z-10 border-b border-r border-line-soft p-0 text-left transition-colors',
          rowActive ? 'bg-raised' : 'bg-surface',
        )}
      >
        <Link
          to={`/types/${slug}`}
          title={`${attacker.label} (attacking)`}
          className="flex h-[30px] items-center gap-1.5 px-2 transition hover:bg-raised sm:h-[34px]"
        >
          <span
            aria-hidden
            className="h-3.5 w-1 shrink-0 rounded-full"
            style={{ background: `var(--type-${slug})` }}
          />
          <span
            className={cx(
              'truncate text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-[11px]',
              rowActive ? 'text-ink' : 'text-dim',
            )}
          >
            <span className="sm:hidden">{typeAbbr(attacker.label)}</span>
            <span className="hidden sm:inline">{attacker.label}</span>
          </span>
        </Link>
      </th>

      {types.map((defender) => {
        const value = chart[attacker.id]?.[defender.id] ?? 1
        const visual = cellVisual(value)
        const columnActive = cursor?.defender === defender.id
        const crossing = rowActive && columnActive
        const style: CSSProperties = { ...visual.style }
        if ((rowActive || columnActive) && !crossing) {
          style.boxShadow = 'inset 0 0 0 999px color-mix(in oklab, var(--ui-text) 9%, transparent)'
        }
        if (crossing) {
          style.outline = '2px solid var(--accent)'
          style.outlineOffset = '-2px'
        }

        return (
          <td key={defender.id} className="border-b border-l border-line-soft p-0">
            <Link
              id={cellId(attacker.id, defender.id)}
              to={`/types/${slug}`}
              style={style}
              tabIndex={tabTarget.attacker === attacker.id && tabTarget.defender === defender.id ? 0 : -1}
              aria-label={`${attacker.label} attacking ${defender.label}: ${effectivenessLabel(value)}, ${matchupWord(value)}`}
              onMouseEnter={() => onCursor({ attacker: attacker.id, defender: defender.id })}
              onFocus={() => onCursor({ attacker: attacker.id, defender: defender.id })}
              onKeyDown={(event) => onKeyDown(event, { attacker: attacker.id, defender: defender.id })}
              className={cx(
                'flex h-[30px] w-full items-center justify-center text-[10px] leading-none transition-[box-shadow] sm:h-[34px] sm:text-[11px]',
                visual.bold && 'font-bold',
              )}
            >
              {effectivenessLabel(value)}
            </Link>
          </td>
        )
      })}
    </tr>
  )
}
