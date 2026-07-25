import { useMemo } from 'react'
import { cx } from '@/lib/cx'

interface Bar {
  from: number
  to: number
  count: number
}

interface Histogram {
  bars: Bar[]
  min: number
  max: number
  peak: number
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 212
const PLOT_LEFT = 14
const PLOT_RIGHT = 626
const PLOT_TOP = 30
const BASELINE = 172

/// Keeps a marker caption inside the plot by flipping it left of its line near the right edge.
function labelPlacement(x: number): { x: number; anchor: 'start' | 'end' } {
  return x > PLOT_RIGHT - 96 ? { x: x - 5, anchor: 'end' } : { x: x + 5, anchor: 'start' }
}

/// Splits the population into equal-width bins, collapsing to a single bin when every value matches.
function buildHistogram(values: number[], buckets: number): Histogram {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return { bars: [{ from: min, to: max, count: values.length }], min, max, peak: values.length }

  const width = (max - min) / buckets
  const counts = new Array<number>(buckets).fill(0)
  for (const value of values) {
    const slot = Math.min(buckets - 1, Math.floor((value - min) / width))
    counts[slot] += 1
  }

  return {
    bars: counts.map((count, index) => ({ from: min + index * width, to: min + (index + 1) * width, count })),
    min,
    max,
    peak: Math.max(...counts),
  }
}

export function Distribution({
  values,
  mean,
  median,
  color,
  format,
  buckets = 28,
  className,
}: {
  values: number[]
  mean: number
  median: number
  color: string
  format: (value: number) => string
  buckets?: number
  className?: string
}) {
  const histogram = useMemo(() => buildHistogram(values, buckets), [values, buckets])
  const { bars, min, max, peak } = histogram

  const span = max - min || 1
  const plotWidth = PLOT_RIGHT - PLOT_LEFT
  const barWidth = plotWidth / bars.length
  const positionOf = (value: number) => PLOT_LEFT + ((value - min) / span) * plotWidth
  const meanX = positionOf(mean)
  const medianX = positionOf(median)
  const stackLabels = Math.abs(meanX - medianX) < 84
  const meanLabel = labelPlacement(meanX)
  const medianLabel = labelPlacement(medianX)

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Distribution of ${values.length} Pokémon between ${format(min)} and ${format(max)}, mean ${format(Math.round(mean))}, median ${format(median)}`}
      className={cx('w-full', className)}
    >
      <line
        x1={PLOT_LEFT}
        y1={PLOT_TOP}
        x2={PLOT_RIGHT}
        y2={PLOT_TOP}
        stroke="var(--ui-line)"
        strokeDasharray="2 4"
      />
      <text
        x={PLOT_LEFT}
        y={PLOT_TOP - 7}
        className="numeric text-[9px] uppercase"
        style={{ fill: 'var(--ui-text-faint)', letterSpacing: '0.16em' }}
      >
        peak {peak}
      </text>

      {bars.map((bar, index) => {
        const height = peak > 0 ? ((BASELINE - PLOT_TOP) * bar.count) / peak : 0
        return (
          <rect
            key={bar.from}
            x={PLOT_LEFT + index * barWidth + 0.75}
            y={BASELINE - height}
            width={Math.max(1, barWidth - 1.5)}
            height={height}
            rx={1.5}
            fill={color}
            opacity={bar.count === 0 ? 0.12 : 0.78}
          >
            <title>
              {`${format(Math.round(bar.from))} – ${format(Math.round(bar.to))} · ${bar.count} Pokémon`}
            </title>
          </rect>
        )
      })}

      <line x1={PLOT_LEFT} y1={BASELINE} x2={PLOT_RIGHT} y2={BASELINE} stroke="var(--ui-line)" />

      <line
        x1={meanX}
        y1={PLOT_TOP - 2}
        x2={meanX}
        y2={BASELINE}
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <text
        x={meanLabel.x}
        y={stackLabels ? PLOT_TOP - 19 : PLOT_TOP - 7}
        textAnchor={meanLabel.anchor}
        className="numeric text-[10px] font-semibold"
        style={{ fill: 'var(--accent)' }}
      >
        mean {format(Math.round(mean))}
      </text>

      <line
        x1={medianX}
        y1={PLOT_TOP - 2}
        x2={medianX}
        y2={BASELINE}
        stroke="var(--ui-text)"
        strokeWidth={1.5}
      />
      <text
        x={medianLabel.x}
        y={PLOT_TOP - 7}
        textAnchor={medianLabel.anchor}
        className="numeric text-[10px] font-semibold"
        style={{ fill: 'var(--ui-text)' }}
      >
        median {format(median)}
      </text>

      <text
        x={PLOT_LEFT}
        y={BASELINE + 18}
        className="numeric text-[10px]"
        style={{ fill: 'var(--ui-text-faint)' }}
      >
        {format(min)}
      </text>
      <text
        x={(PLOT_LEFT + PLOT_RIGHT) / 2}
        y={BASELINE + 18}
        textAnchor="middle"
        className="numeric text-[10px]"
        style={{ fill: 'var(--ui-text-faint)' }}
      >
        {format(Math.round((min + max) / 2))}
      </text>
      <text
        x={PLOT_RIGHT}
        y={BASELINE + 18}
        textAnchor="end"
        className="numeric text-[10px]"
        style={{ fill: 'var(--ui-text-faint)' }}
      >
        {format(max)}
      </text>
      <text
        x={(PLOT_LEFT + PLOT_RIGHT) / 2}
        y={BASELINE + 34}
        textAnchor="middle"
        className="numeric text-[9px] uppercase"
        style={{ fill: 'var(--ui-text-faint)', letterSpacing: '0.18em' }}
      >
        {bars.length} buckets · {values.length} Pokémon
      </text>
    </svg>
  )
}
