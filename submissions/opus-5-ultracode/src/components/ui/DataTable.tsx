import { useMemo, useState, type ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface Column<T> {
  key: string
  header: ReactNode
  /** Rendered cell content. */
  cell: (row: T) => ReactNode
  /** Comparable value; omit to make the column unsortable. */
  sort?: (row: T) => number | string
  align?: 'left' | 'right' | 'center'
  width?: string
  className?: string
  headerClassName?: string
  hideBelow?: 'sm' | 'md' | 'lg'
}

const HIDE_CLASS = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const

export interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  initialSort?: { key: string; direction: 'asc' | 'desc' }
  onRowClick?: (row: T) => void
  emptyMessage?: string
  /** Caps rendered rows and shows a "load more" control; keeps huge tables responsive. */
  pageSize?: number
  className?: string
  dense?: boolean
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  initialSort,
  onRowClick,
  emptyMessage = 'Nothing to show.',
  pageSize = 100,
  className,
  dense = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null)
  const [limit, setLimit] = useState(pageSize)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column?.sort) return rows
    const accessor = column.sort
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = accessor(a)
      const right = accessor(b)
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left).localeCompare(String(right)) * factor
      }
      return (left - right) * factor
    })
  }, [rows, columns, sort])

  const visible = sorted.slice(0, limit)

  const toggle = (key: string) => {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-plate border border-dashed border-line px-6 py-14 text-center text-sm text-dim">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cx('min-w-0', className)}>
      <div className="overflow-x-auto rounded-plate border border-line">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface">
              {columns.map((column) => {
                const sortable = Boolean(column.sort)
                const active = sort?.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      !sortable ? undefined : !active ? 'none' : sort!.direction === 'asc' ? 'ascending' : 'descending'
                    }
                    style={column.width ? { width: column.width } : undefined}
                    className={cx(
                      'numeric whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      !column.align && 'text-left',
                      column.hideBelow && HIDE_CLASS[column.hideBelow],
                      column.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggle(column.key)}
                        className={cx(
                          'inline-flex items-center gap-1 transition hover:text-ink',
                          active && 'text-accent',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        <SortGlyph direction={active ? sort!.direction : null} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx(
                  'border-b border-line-soft last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-raised/70',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cx(
                      dense ? 'px-3 py-1.5' : 'px-3 py-2.5',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.hideBelow && HIDE_CLASS[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > limit && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setLimit((current) => current + pageSize * 2)}
            className="rounded-chip border border-line px-4 py-2 text-xs transition hover:bg-raised"
          >
            Show more
          </button>
          <span className="numeric text-[11px] text-faint">
            {limit} of {sorted.length}
          </span>
        </div>
      )}
    </div>
  )
}

function SortGlyph({ direction }: { direction: 'asc' | 'desc' | null }) {
  return (
    <svg viewBox="0 0 10 12" className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 1.5 8 5H2Z" fill={direction === 'asc' ? 'currentColor' : 'none'} opacity={direction === 'desc' ? 0.3 : 1} />
      <path d="M5 10.5 8 7H2Z" fill={direction === 'desc' ? 'currentColor' : 'none'} opacity={direction === 'asc' ? 0.3 : 1} />
    </svg>
  )
}
