import { STAT_SHORT } from '../lib/constants'

const ORDER = ['hp', 'attack', 'defense', 'speed', 'special-defense', 'special-attack']

export function StatRadar({ stats, color }: { stats: Record<string, number>; color: string }) {
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const r = 88
  const max = 200
  const n = ORDER.length

  const point = (i: number, val: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const rad = (Math.min(val, max) / max) * r
    return [cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]
  }
  const axis = (i: number, mult = 1) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + Math.cos(angle) * r * mult, cy + Math.sin(angle) * r * mult]
  }

  const poly = ORDER.map((k, i) => point(i, stats[k] ?? 0).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <polygon
          key={g}
          points={ORDER.map((_, i) => axis(i, g).join(',')).join(' ')}
          fill="none"
          className="stroke-slate-300/50 dark:stroke-white/10"
          strokeWidth="1"
        />
      ))}
      {ORDER.map((_, i) => {
        const [x, y] = axis(i)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-slate-300/50 dark:stroke-white/10" strokeWidth="1" />
      })}
      <polygon points={poly} fill={color} fillOpacity="0.28" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {ORDER.map((k, i) => {
        const [x, y] = point(i, stats[k] ?? 0)
        return <circle key={k} cx={x} cy={y} r="3.5" fill={color} />
      })}
      {ORDER.map((k, i) => {
        const [x, y] = axis(i, 1.22)
        return (
          <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[10px] font-bold dark:fill-slate-400">
            {STAT_SHORT[k]}
          </text>
        )
      })}
    </svg>
  )
}
