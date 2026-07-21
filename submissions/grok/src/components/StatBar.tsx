import { motion } from 'framer-motion'

interface StatBarProps {
  label: string
  value: number
}

export function StatBar({ label, value }: StatBarProps) {
  const pct = Math.min(Math.max((value / 255) * 100, 8), 100)
  return (
    <div className="stat-row">
      <div className="stat-name text-[10px] sm:text-xs w-12 sm:w-[58px]">{label}</div>
      <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#ef4444]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
        />
      </div>
      <div className="w-8 font-mono text-right font-semibold tabular-nums text-sm text-white/90">{value}</div>
    </div>
  )
}
