import { STAT_KEYS, STAT_LABELS, MAX_BASE_STAT, statRange } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { StatBlock } from '@/types/data'

const BST_BENCHMARK = 720

export function StatBars({
  stats,
  compare,
  level,
  showRanges = false,
  className,
}: {
  stats: StatBlock
  compare?: StatBlock
  level?: number
  showRanges?: boolean
  className?: string
}) {
  const total = stats.reduce((sum, value) => sum + value, 0)

  return (
    <div className={cx('space-y-2', className)}>
      {stats.map((value, index) => {
        const key = STAT_KEYS[index]
        const width = Math.min(100, (value / MAX_BASE_STAT) * 100)
        const other = compare?.[index]
        const delta = other === undefined ? null : value - other
        const range = showRanges && level ? statRange(value, level, index) : null

        return (
          <div key={key} className="grid grid-cols-[62px_44px_1fr] items-center gap-3">
            <span className="numeric text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
              {STAT_LABELS[index]}
            </span>
            <span className="numeric text-right text-[13px] font-semibold tabular-nums">{value}</span>
            <div className="relative h-2 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                style={{ width: `${width}%`, background: `var(--stat-${key})` }}
              />
              {other !== undefined && (
                <span
                  aria-hidden
                  className="absolute top-0 h-full w-px bg-ink/50"
                  style={{ left: `${Math.min(100, (other / MAX_BASE_STAT) * 100)}%` }}
                />
              )}
            </div>
            {range && (
              <span className="numeric col-span-3 -mt-1 pl-[106px] text-[10px] text-faint">
                {range.min} – {range.max} at level {level}
              </span>
            )}
            {delta !== null && delta !== 0 && (
              <span
                className={cx(
                  'numeric col-span-3 -mt-1 pl-[106px] text-[10px] font-semibold',
                  delta > 0 ? 'text-[var(--type-grass)]' : 'text-[var(--type-fighting)]',
                )}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </div>
        )
      })}

      <div className="grid grid-cols-[62px_44px_1fr] items-center gap-3 border-t border-line pt-2.5">
        <span className="numeric text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Total</span>
        <span className="numeric text-right text-[13px] font-bold tabular-nums">{total}</span>
        <div className="relative h-2 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-[var(--ease-out-expo)]"
            style={{ width: `${Math.min(100, (total / BST_BENCHMARK) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/// Compact six-segment readout used inside dense list rows.
export function StatSparkline({ stats, className }: { stats: StatBlock; className?: string }) {
  return (
    <span className={cx('inline-flex h-4 items-end gap-[2px]', className)} aria-hidden>
      {stats.map((value, index) => (
        <span
          key={STAT_KEYS[index]}
          className="w-[3px] rounded-[1px]"
          style={{
            height: `${Math.max(12, Math.min(100, (value / 180) * 100))}%`,
            background: `var(--stat-${STAT_KEYS[index]})`,
          }}
        />
      ))}
    </span>
  )
}
