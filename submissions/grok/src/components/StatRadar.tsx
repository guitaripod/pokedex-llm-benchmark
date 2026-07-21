import { motion } from 'framer-motion'
import type { Stat } from '../types/pokemon'

interface StatRadarProps {
  stats: Stat[]
  size?: number
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
}

const ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

export function StatRadar({ stats, size = 180 }: StatRadarProps) {
  const center = size / 2
  const radius = size * 0.38
  const maxStat = 255

  const getValue = (name: string) => {
    const s = stats.find(st => st.stat.name === name)
    return Math.min(Math.max(s?.base_stat || 0, 0), maxStat)
  }

  const points = ORDER.map((key, i) => {
    const angle = (Math.PI * 2 * i) / ORDER.length - Math.PI / 2
    const val = getValue(key) / maxStat
    const r = radius * val
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      label: STAT_LABELS[key],
      val: getValue(key),
      angle,
    }
  })

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  // Background grid polygons
  const gridLevels = [0.25, 0.5, 0.75, 1]
  const gridPolys = gridLevels.map(level => {
    const pts = ORDER.map((_, i) => {
      const angle = (Math.PI * 2 * i) / ORDER.length - Math.PI / 2
      const r = radius * level
      return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`
    }).join(' ')
    return pts
  })

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid */}
        {gridPolys.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Axes */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + Math.cos(p.angle) * radius}
            y2={center + Math.sin(p.angle) * radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        ))}

        {/* Data polygon */}
        <motion.polygon
          points={polygonPoints}
          fill="rgba(239, 68, 68, 0.25)"
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Vertex dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="#ef4444"
            stroke="#0a0c14"
            strokeWidth={1.5}
          />
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          const labelDist = radius + 16
          const lx = center + Math.cos(p.angle) * labelDist
          const ly = center + Math.sin(p.angle) * labelDist
          return (
            <g key={i}>
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/70 text-[9px] font-medium select-none"
              >
                {p.label}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/90 text-[10px] font-semibold tabular-nums select-none"
              >
                {p.val}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
