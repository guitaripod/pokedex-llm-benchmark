import { MicroLabel } from './Fields'
import { cx } from '@/lib/cx'

/// Plots the 16 random damage rolls, scaled against the defender's HP when the move can KO.
export function RollSpread({ rolls, hp }: { rolls: number[]; hp: number }) {
  const max = Math.max(...rolls, 1)
  const ceiling = Math.max(max, 1)
  const minPercent = (rolls[0] / hp) * 100
  const maxPercent = (rolls[rolls.length - 1] / hp) * 100

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <MicroLabel>Damage rolls</MicroLabel>
        <span className="numeric text-[11px] text-faint">85 – 100 random factor</span>
      </div>

      <div className="mt-2 flex h-24 items-end gap-[3px]" role="img" aria-label={`Damage rolls from ${rolls[0]} to ${rolls[rolls.length - 1]}`}>
        {rolls.map((roll, index) => (
          <span
            key={index}
            title={`${roll} damage · ${((roll / hp) * 100).toFixed(1)}%`}
            className={cx(
              'min-w-0 flex-1 rounded-t-[2px] transition-[height] duration-300',
              roll >= hp ? 'bg-[var(--type-grass)]' : 'bg-accent',
            )}
            style={{ height: `${Math.max(4, (roll / ceiling) * 100)}%`, opacity: 0.45 + (index / 15) * 0.55 }}
          />
        ))}
      </div>

      <div className="numeric mt-1.5 grid grid-cols-8 gap-[3px] text-center text-[10px] text-faint sm:grid-cols-[repeat(16,minmax(0,1fr))]">
        {rolls.map((roll, index) => (
          <span key={index} className="truncate">
            {roll}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <MicroLabel>Share of the defender's HP</MicroLabel>
          <span className="numeric text-[11px] text-dim">
            {minPercent.toFixed(1)}% – {maxPercent.toFixed(1)}%
          </span>
        </div>
        <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-raised">
          <span
            className="absolute inset-y-0 left-0 bg-accent"
            style={{ width: `${Math.min(100, minPercent)}%` }}
          />
          <span
            className="absolute inset-y-0 bg-accent/40"
            style={{
              left: `${Math.min(100, minPercent)}%`,
              width: `${Math.max(0, Math.min(100, maxPercent) - Math.min(100, minPercent))}%`,
            }}
          />
          {[25, 50, 75].map((mark) => (
            <span key={mark} aria-hidden className="absolute inset-y-0 w-px bg-bg/60" style={{ left: `${mark}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
