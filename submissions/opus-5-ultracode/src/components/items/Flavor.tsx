import { cx } from '@/lib/cx'

export interface FlavorPotency {
  flavorId: number
  potency: number
}

/** Flavour id → the colour the games associate with that taste. */
export const FLAVOR_COLOR: Record<number, string> = {
  1: 'var(--type-fighting)',
  2: 'var(--type-water)',
  3: 'var(--type-fairy)',
  4: 'var(--type-grass)',
  5: 'var(--type-electric)',
}

export const MAX_FLAVOR_POTENCY = 40

export function flavorColor(flavorId: number): string {
  return FLAVOR_COLOR[flavorId] ?? 'var(--accent)'
}

function sortedByFlavorId(flavors: FlavorPotency[]): FlavorPotency[] {
  return [...flavors].sort((a, b) => a.flavorId - b.flavorId)
}

/// Places a flavour axis on a regular polygon, starting at twelve o'clock and running clockwise.
function axisPoint(
  index: number,
  count: number,
  radius: number,
  centreX: number,
  centreY: number,
): [number, number] {
  const angle = (-90 + (360 / count) * index) * (Math.PI / 180)
  return [centreX + Math.cos(angle) * radius, centreY + Math.sin(angle) * radius]
}

/** Horizontal bleed multiplier that keeps the widest axis labels inside the viewBox. */
const LABEL_GUTTER = 1.34

export function FlavorRadar({
  flavors,
  labelOf,
  size = 200,
  className,
}: {
  flavors: FlavorPotency[]
  labelOf: (flavorId: number) => string
  size?: number
  className?: string
}) {
  const points = sortedByFlavorId(flavors)
  const count = points.length || 1
  const width = Math.round(size * LABEL_GUTTER)
  const centreX = width / 2
  const centreY = size / 2
  const radius = centreY - 24
  const rings = [0.25, 0.5, 0.75, 1]
  const total = points.reduce((sum, entry) => sum + entry.potency, 0)

  const polygon = points
    .map((entry, index) => {
      const ratio = Math.min(1, entry.potency / MAX_FLAVOR_POTENCY)
      const [x, y] = axisPoint(index, count, radius * ratio, centreX, centreY)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <figure className={cx('flex flex-col items-center', className)}>
      <svg
        viewBox={`0 0 ${width} ${size}`}
        width={width}
        height={size}
        role="img"
        aria-label={`Flavour profile: ${points.map((entry) => `${labelOf(entry.flavorId)} ${entry.potency}`).join(', ')}`}
        className="h-auto max-w-full"
      >
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={points
              .map((_, index) => {
                const [x, y] = axisPoint(index, count, radius * ring, centreX, centreY)
                return `${x.toFixed(2)},${y.toFixed(2)}`
              })
              .join(' ')}
            fill="none"
            stroke="var(--ui-line-soft)"
            strokeWidth={1}
          />
        ))}

        {points.map((entry, index) => {
          const [x, y] = axisPoint(index, count, radius, centreX, centreY)
          return (
            <line
              key={entry.flavorId}
              x1={centreX}
              y1={centreY}
              x2={x}
              y2={y}
              stroke="var(--ui-line)"
              strokeWidth={1}
            />
          )
        })}

        {total > 0 && (
          <polygon
            points={polygon}
            fill="color-mix(in oklab, var(--accent) 24%, transparent)"
            stroke="var(--accent)"
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        )}

        {points.map((entry, index) => {
          const ratio = Math.min(1, entry.potency / MAX_FLAVOR_POTENCY)
          const [x, y] = axisPoint(index, count, radius * ratio, centreX, centreY)
          if (entry.potency === 0) return null
          return <circle key={entry.flavorId} cx={x} cy={y} r={3} fill={flavorColor(entry.flavorId)} />
        })}

        {points.map((entry, index) => {
          const [x, y] = axisPoint(index, count, radius + 14, centreX, centreY)
          const anchor = x < centreX - 4 ? 'end' : x > centreX + 4 ? 'start' : 'middle'
          return (
            <text
              key={entry.flavorId}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="numeric"
              fontSize={9}
              letterSpacing="0.12em"
              fill={entry.potency > 0 ? flavorColor(entry.flavorId) : 'var(--ui-text-faint)'}
            >
              {labelOf(entry.flavorId).toUpperCase()}
            </text>
          )
        })}
      </svg>
      <figcaption className="numeric mt-1 text-[10px] uppercase tracking-[0.16em] text-faint">
        Potency · max {MAX_FLAVOR_POTENCY}
      </figcaption>
    </figure>
  )
}

export function FlavorBars({
  flavors,
  labelOf,
  className,
  compact = false,
}: {
  flavors: FlavorPotency[]
  labelOf: (flavorId: number) => string
  className?: string
  compact?: boolean
}) {
  const points = sortedByFlavorId(flavors)
  return (
    <ul className={cx('flex flex-col', compact ? 'gap-1' : 'gap-2', className)}>
      {points.map((entry) => {
        const ratio = Math.min(1, entry.potency / MAX_FLAVOR_POTENCY)
        return (
          <li key={entry.flavorId} className="flex items-center gap-2">
            <span
              className={cx(
                'numeric shrink-0 uppercase tracking-[0.14em]',
                compact ? 'w-[46px] text-[9px]' : 'w-[58px] text-[10px]',
                entry.potency > 0 ? 'text-dim' : 'text-faint',
              )}
            >
              {labelOf(entry.flavorId)}
            </span>
            <span
              className={cx(
                'relative min-w-0 flex-1 overflow-hidden rounded-full bg-raised',
                compact ? 'h-1.5' : 'h-2',
              )}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]"
                style={{ width: `${ratio * 100}%`, background: flavorColor(entry.flavorId) }}
              />
            </span>
            <span
              className={cx(
                'numeric shrink-0 text-right tabular-nums',
                compact ? 'w-5 text-[10px]' : 'w-6 text-[11px]',
                entry.potency > 0 ? 'text-ink' : 'text-faint',
              )}
            >
              {entry.potency}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
