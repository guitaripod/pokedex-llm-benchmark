import { MAX_BASE_STAT, STAT_LABELS, STAT_SHORT } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { StatBlock } from '@/types/data'

export interface RadarSeries {
  id: number
  label: string
  color: string
  dash?: string
  stats: StatBlock
}

const AXIS_COUNT = 6
const RINGS = [0.25, 0.5, 0.75, 1]
const CENTER_X = 180
const CENTER_Y = 172
const RADIUS = 112
const LABEL_RATIO = 1.2

/// Rounds the outer bound up to a 50-point step so the ring captions stay round numbers.
function axisMax(series: RadarSeries[]): number {
  let peak = 0
  for (const item of series) {
    for (const value of item.stats) peak = Math.max(peak, value)
  }
  return Math.min(MAX_BASE_STAT, Math.max(150, Math.ceil(peak / 50) * 50))
}

function pointAt(index: number, ratio: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXIS_COUNT
  return [CENTER_X + Math.cos(angle) * RADIUS * ratio, CENTER_Y + Math.sin(angle) * RADIUS * ratio]
}

function polygonPoints(ratios: number[]): string {
  return ratios.map((ratio, index) => pointAt(index, ratio).join(',')).join(' ')
}

/// Keeps axis captions clear of the plot by anchoring them away from the hexagon centre.
function anchorFor(index: number): 'start' | 'middle' | 'end' {
  const [x] = pointAt(index, 1)
  if (x > CENTER_X + 1) return 'start'
  if (x < CENTER_X - 1) return 'end'
  return 'middle'
}

export function StatRadar({
  series,
  focusedId = null,
  onFocus,
  className,
}: {
  series: RadarSeries[]
  focusedId?: number | null
  onFocus?: (id: number | null) => void
  className?: string
}) {
  const max = axisMax(series)
  const highlight =
    series.find((item) => item.id === focusedId) ?? (series.length === 1 ? series[0] : undefined)
  const drawOrder = [...series].sort(
    (a, b) => Number(a.id === focusedId) - Number(b.id === focusedId),
  )

  return (
    <div className={cx('flex flex-col items-center gap-4', className)}>
      <svg
        viewBox="0 0 360 344"
        role="img"
        aria-label={`Base stat radar comparing ${series.map((item) => item.label).join(', ')}`}
        className="w-full max-w-[440px]"
      >
        <g>
          {RINGS.map((ratio) => (
            <polygon
              key={ratio}
              points={polygonPoints(new Array(AXIS_COUNT).fill(ratio))}
              fill={ratio === 1 ? 'color-mix(in oklab, var(--ui-text-faint) 6%, transparent)' : 'none'}
              stroke="var(--ui-line)"
              strokeWidth={ratio === 1 ? 1.2 : 0.8}
            />
          ))}
          {STAT_SHORT.map((_, index) => {
            const [x, y] = pointAt(index, 1)
            return (
              <line
                key={index}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={x}
                y2={y}
                stroke="var(--ui-line)"
                strokeWidth={0.8}
              />
            )
          })}
        </g>

        <g>
          {RINGS.map((ratio) => (
            <text
              key={ratio}
              x={CENTER_X + 7}
              y={CENTER_Y - RADIUS * ratio + 3.5}
              className="numeric text-[9px]"
              style={{ fill: 'var(--ui-text-faint)', opacity: 0.75 }}
            >
              {Math.round(max * ratio)}
            </text>
          ))}
        </g>

        <g>
          {drawOrder.map((item) => {
            const ratios = item.stats.map((value) => Math.min(1, value / max))
            const dimmed = focusedId !== null && item.id !== focusedId
            return (
              <g key={item.id} style={{ opacity: dimmed ? 0.22 : 1 }}>
                <polygon
                  points={polygonPoints(ratios)}
                  fill={`color-mix(in oklab, ${item.color} ${series.length > 3 ? 12 : 18}%, transparent)`}
                  stroke={item.color}
                  strokeWidth={item.id === focusedId ? 2.6 : 1.8}
                  strokeDasharray={item.dash}
                  strokeLinejoin="round"
                />
                {ratios.map((ratio, index) => {
                  const [x, y] = pointAt(index, ratio)
                  return <circle key={index} cx={x} cy={y} r={item.id === focusedId ? 3.2 : 2.2} fill={item.color} />
                })}
              </g>
            )
          })}
        </g>

        <g>
          {STAT_SHORT.map((short, index) => {
            const [x, y] = pointAt(index, LABEL_RATIO)
            const anchor = anchorFor(index)
            return (
              <g key={short}>
                <text
                  x={x}
                  y={y}
                  textAnchor={anchor}
                  className="numeric text-[10px] font-semibold uppercase"
                  style={{ fill: 'var(--ui-text-faint)', letterSpacing: '0.14em' }}
                >
                  {short}
                </text>
                {highlight && (
                  <text
                    x={x}
                    y={y + 13}
                    textAnchor={anchor}
                    className="numeric text-[11px] font-bold"
                    style={{ fill: highlight.color }}
                  >
                    {highlight.stats[index]}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      <ul className="flex w-full flex-wrap justify-center gap-1.5">
        {series.map((item) => {
          const active = item.id === focusedId
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onFocus?.(active ? null : item.id)}
                className={cx(
                  'inline-flex h-7 items-center gap-1.5 rounded-chip border px-2.5 font-display text-[11px] font-semibold transition',
                  active ? 'border-transparent text-ink' : 'border-line text-dim hover:text-ink',
                )}
                style={
                  active
                    ? { background: `color-mix(in oklab, ${item.color} 22%, transparent)` }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ background: item.color }}
                />
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>

      {highlight && (
        <p className="numeric text-center text-[10px] uppercase tracking-[0.16em] text-faint">
          {STAT_LABELS.map((label, index) => `${label} ${highlight.stats[index]}`).join(' · ')}
        </p>
      )}
    </div>
  )
}
