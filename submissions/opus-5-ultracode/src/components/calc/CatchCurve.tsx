import { MicroLabel } from './Fields'

export interface CurvePoint {
  hpPercent: number
  probability: number
}

const WIDTH = 300
const HEIGHT = 100

/// Draws catch probability against remaining HP, marking where the target currently sits.
export function CatchCurve({
  points,
  currentHpPercent,
  currentProbability,
  ballLabel,
}: {
  points: CurvePoint[]
  currentHpPercent: number
  currentProbability: number
  ballLabel: string
}) {
  const x = (hpPercent: number) => ((hpPercent - 1) / 99) * WIDTH
  const y = (probability: number) => HEIGHT - probability * HEIGHT

  const line = points.map((point) => `${x(point.hpPercent).toFixed(2)},${y(point.probability).toFixed(2)}`)
  const area = `M0,${HEIGHT} L${line.join(' L')} L${WIDTH},${HEIGHT} Z`
  const markerLeft = ((currentHpPercent - 1) / 99) * 100
  const markerTop = (1 - currentProbability) * 100

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <MicroLabel>Catch chance vs remaining HP</MicroLabel>
        <span className="numeric text-[11px] text-dim">{ballLabel}</span>
      </div>

      <div className="relative mt-2 h-28 w-full">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label={`Catch chance curve for ${ballLabel}`}
        >
          {[0.25, 0.5, 0.75].map((tick) => (
            <line
              key={tick}
              x1="0"
              x2={WIDTH}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--ui-line-soft)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} fill="color-mix(in oklab, var(--accent) 18%, transparent)" />
          <polyline
            points={line.join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
        <span
          aria-hidden
          className="absolute top-0 h-full w-px border-l border-dashed border-line"
          style={{ left: `${markerLeft}%` }}
        />
        <span
          aria-hidden
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-[var(--ui-panel)]"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%` }}
        />
      </div>

      <div className="numeric mt-1 flex justify-between text-[10px] text-faint">
        <span>1% HP</span>
        <span>50%</span>
        <span>100% HP</span>
      </div>
    </div>
  )
}
