import { Link } from 'react-router-dom'
import { typeSlug } from '@/lib/dex'
import { percent } from '@/components/pokedexes/dexData'
import { cx } from '@/lib/cx'

export interface TypeCount {
  typeId: number
  label: string
  count: number
}

export function TypeDistribution({
  counts,
  total,
  linkTypes = false,
  emptyMessage = 'Nothing to chart yet.',
}: {
  counts: TypeCount[]
  total: number
  linkTypes?: boolean
  emptyMessage?: string
}) {
  if (counts.length === 0) {
    return <p className="py-6 text-center text-sm text-dim">{emptyMessage}</p>
  }

  const max = counts.reduce((highest, item) => Math.max(highest, item.count), 0)

  return (
    <ul className="space-y-1.5">
      {counts.map((item) => {
        const slug = typeSlug(item.typeId)
        const share = percent(item.count, total)
        const body = (
          <>
            <span
              className="numeric w-[62px] shrink-0 truncate text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: `var(--type-${slug})` }}
            >
              {item.label}
            </span>
            <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-raised">
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                style={{
                  width: `${percent(item.count, max)}%`,
                  background: `var(--type-${slug})`,
                }}
              />
            </span>
            <span className="numeric w-[30px] shrink-0 text-right text-[11px] font-semibold tabular-nums">
              {item.count}
            </span>
            <span className="numeric w-[42px] shrink-0 text-right text-[10px] text-faint">
              {share.toFixed(1)}%
            </span>
          </>
        )

        return (
          <li key={item.typeId}>
            {linkTypes ? (
              <Link
                to={`/types/${slug}`}
                className="flex items-center gap-2 rounded-chip py-0.5 transition hover:bg-raised/60"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-2 py-0.5">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export interface GenerationRow {
  id: number
  label: string
  caught: number
  total: number
}

export function GenerationBreakdown({ rows }: { rows: GenerationRow[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const share = percent(row.caught, row.total)
        return (
          <li key={row.id} className="grid grid-cols-[46px_1fr_74px] items-center gap-2.5">
            <span className="numeric whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
              {row.label}
            </span>
            <span className="relative h-2.5 overflow-hidden rounded-full bg-raised">
              <span
                className={cx(
                  'absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700 ease-[var(--ease-out-expo)]',
                  share === 100 && 'bg-[var(--type-grass)]',
                )}
                style={{ width: `${share}%` }}
              />
            </span>
            <span className="numeric text-right text-[11px] tabular-nums text-dim">
              {row.caught}
              <span className="text-faint">/{row.total}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
