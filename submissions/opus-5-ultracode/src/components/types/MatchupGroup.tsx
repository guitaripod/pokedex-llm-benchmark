import { TypeBadge } from '@/components/ui/TypeBadge'
import { useDex } from '@/lib/dex'
import { effectivenessLabel } from '@/lib/game'
import { cx } from '@/lib/cx'
import { cellVisual, matchupWord } from './chart'

export function MultiplierChip({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const visual = cellVisual(value)
  return (
    <span
      style={visual.style}
      className={cx(
        'numeric inline-flex shrink-0 items-center justify-center rounded-chip border border-line-soft font-semibold leading-none',
        size === 'sm' ? 'h-6 min-w-[38px] px-1.5 text-[11px]' : 'h-7 min-w-[46px] px-2 text-xs',
      )}
    >
      {effectivenessLabel(value)}
    </span>
  )
}

export function MatchupGroup({
  value,
  typeIds,
  caption,
  emptyText = 'None',
}: {
  value: number
  typeIds: number[]
  caption?: string
  emptyText?: string
}) {
  const dex = useDex()

  return (
    <div className="grid grid-cols-[46px_minmax(0,1fr)] items-start gap-3 border-b border-line-soft py-2.5 last:border-0">
      <div className="pt-px">
        <MultiplierChip value={value} size="sm" />
      </div>
      <div className="min-w-0">
        <p className="numeric mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          {caption ?? matchupWord(value)}
        </p>
        {typeIds.length === 0 ? (
          <p className="text-xs text-faint">{emptyText}</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {typeIds.map((typeId) => (
              <TypeBadge
                key={typeId}
                typeId={typeId}
                label={dex.typeById.get(typeId)?.label ?? String(typeId)}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
