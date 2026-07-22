import { motion } from 'framer-motion';
import { STAT_NAMES, STAT_MAX } from '../../types/pokemon';

interface StatBarProps {
  statName: string;
  baseStat: number;
  delay?: number;
}

export function StatBar({ statName, baseStat, delay = 0 }: StatBarProps) {
  const max = STAT_MAX[statName] || 255;
  const percentage = Math.min((baseStat / max) * 100, 100);
  const label = STAT_NAMES[statName] || statName;

  const color = baseStat >= 110 ? 'bg-green-500'
    : baseStat >= 80 ? 'bg-emerald-400'
    : baseStat >= 60 ? 'bg-yellow-400'
    : baseStat >= 40 ? 'bg-orange-400'
    : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-xs font-semibold text-gray-400 text-right shrink-0">{label}</span>
      <span className="w-8 text-sm font-bold text-white font-mono text-right shrink-0">{baseStat}</span>
      <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className={`h-full rounded-full ${color} relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
        </motion.div>
      </div>
    </div>
  );
}

export function StatRadar({ stats, types }: { stats: { base_stat: number; stat: { name: string } }[]; types: string[] }) {
  const primaryColor = typeToHex(types[0] || 'normal');
  const statMap: Record<string, number> = {};
  stats.forEach(s => { statMap[s.stat.name] = s.base_stat; });

  const points = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 72;

  const angleStep = (Math.PI * 2) / points.length;
  const startAngle = -Math.PI / 2;

  function getPoint(index: number, value: number) {
    const angle = startAngle + angleStep * index;
    const r = (Math.min(value / 255, 1)) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const statValues = points.map(p => statMap[p] || 0);
  const polygon = statValues.map((v, i) => {
    const pt = getPoint(i, v);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px] mx-auto">
      <g transform={`translate(${cx},${cy})`}>
        <circle r={radius} fill="none" stroke="rgb(55 65 81)" strokeWidth={1} />
        <circle r={radius * 0.8} fill="none" stroke="rgb(55 65 81)" strokeWidth={0.5} />
        <circle r={radius * 0.6} fill="none" stroke="rgb(55 65 81)" strokeWidth={0.5} />
        <circle r={radius * 0.4} fill="none" stroke="rgb(55 65 81)" strokeWidth={0.5} />
        <circle r={radius * 0.2} fill="none" stroke="rgb(55 65 81)" strokeWidth={0.5} />
      </g>
      <polygon
        points={polygon}
        fill={`${primaryColor}33`}
        stroke={primaryColor}
        strokeWidth={2}
      />
      {points.map((p, i) => {
        const pt = getPoint(i, statValues[i]);
        const labelPt = getPoint(i, radius + 14);
        return (
          <g key={p}>
            <line x1={cx} y1={cy} x2={labelPt.x} y2={labelPt.y} stroke="rgb(55 65 81)" strokeWidth={0.5} />
            <circle cx={pt.x} cy={pt.y} r={3} fill={primaryColor} />
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgb(156 163 175)"
              fontSize={10}
              fontWeight={600}
            >
              {(STAT_NAMES[p] || p).replace('Sp', 'S')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function typeToHex(type: string): string {
  const map: Record<string, string> = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD',
  };
  return map[type] || '#999';
}
