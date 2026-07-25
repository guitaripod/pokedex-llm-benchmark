import { Link } from 'react-router-dom'
import { Sprite } from '@/components/ui/Sprite'
import { gameSprite, icon } from '@/lib/sprites'
import { cx } from '@/lib/cx'
import { MODE_LABEL, OUTCOME_COLOR, OUTCOME_LABEL, formatDuration, type HistoryItem } from './quiz'

export function RoundHistory({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-chip border border-dashed border-line px-3 py-6 text-center text-[12px] text-faint">
        Rounds you finish will stack up here.
      </p>
    )
  }

  return (
    <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
      {items.map((item) => (
        <li key={item.round} className="shrink-0">
          <Link
            to={`/pokemon/${item.entry.name}`}
            title={`Round ${item.round} · ${OUTCOME_LABEL[item.status]} · ${item.entry.label} · ${MODE_LABEL[item.mode]} · ${formatDuration(item.elapsed)}`}
            style={{ '--outcome': OUTCOME_COLOR[item.status] } as React.CSSProperties}
            className={cx(
              'flex w-[76px] flex-col items-center gap-1 rounded-chip border px-1.5 py-2 transition',
              'border-[color-mix(in_oklab,var(--outcome)_38%,var(--ui-line))] hover:border-[var(--outcome)] hover:bg-raised',
            )}
          >
            <span className="numeric text-[9px] uppercase tracking-[0.14em] text-faint">
              R{String(item.round).padStart(2, '0')}
            </span>
            <Sprite
              sources={[icon(item.entry.id), gameSprite(item.entry.id)]}
              alt={item.entry.label}
              className={cx('h-9 w-9', item.status === 'correct' ? '' : 'opacity-60 grayscale')}
              pixelated
            />
            <span className="w-full truncate text-center text-[10px] leading-tight text-dim">
              {item.entry.label}
            </span>
            <span
              className="numeric text-[9px] font-semibold leading-none"
              style={{ color: 'var(--outcome)' }}
            >
              {item.status === 'correct' ? `+${item.points}` : OUTCOME_LABEL[item.status]}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
