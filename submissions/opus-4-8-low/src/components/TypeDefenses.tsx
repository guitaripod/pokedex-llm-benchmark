import { defensiveChart, multiplierLabel } from '../lib/typechart'
import { TYPE_COLORS } from '../lib/constants'
import { TypeBadge } from './ui'

export function TypeDefenses({ types }: { types: string[] }) {
  const chart = defensiveChart(types)
  const groups: Record<string, string[]> = {}
  for (const [t, m] of Object.entries(chart)) {
    const k = String(m)
    ;(groups[k] ??= []).push(t)
  }
  const order = ['4', '2', '0.5', '0.25', '0']
  const labels: Record<string, string> = { '4': 'Weak (4×)', '2': 'Weak (2×)', '0.5': 'Resists (½×)', '0.25': 'Resists (¼×)', '0': 'Immune (0×)' }

  return (
    <div className="space-y-3">
      {order.map((k) =>
        groups[k]?.length ? (
          <div key={k} className="flex flex-wrap items-center gap-2">
            <span className="w-28 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">{labels[k]}</span>
            <div className="flex flex-wrap gap-1.5">
              {groups[k].map((t) => (
                <span key={t} className="relative">
                  <TypeBadge type={t} size="sm" />
                  <span
                    className="absolute -right-1 -top-1 rounded-full px-1 text-[9px] font-black shadow"
                    style={{ background: TYPE_COLORS[t].to, color: '#fff' }}
                  >
                    {multiplierLabel(Number(k))}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null,
      )}
      {!order.some((k) => groups[k]?.length) && (
        <p className="text-sm text-slate-400">Takes neutral damage from all types.</p>
      )}
    </div>
  )
}
