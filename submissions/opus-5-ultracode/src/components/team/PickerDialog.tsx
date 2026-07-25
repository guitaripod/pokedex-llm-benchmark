import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SearchInput } from '@/components/ui/Controls'
import { cx } from '@/lib/cx'

export interface PickerItem {
  id: number
  label: string
  /** Pre-lowercased haystack: name, slug, type names, anything else worth matching. */
  keywords: string
}

export interface PickerDialogProps<T extends PickerItem> {
  title: string
  subtitle?: ReactNode
  placeholder?: string
  options: T[]
  onSelect: (option: T) => void
  onClose: () => void
  renderRow: (option: T) => ReactNode
  filters?: ReactNode
  status?: ReactNode
  onClear?: () => void
  clearLabel?: string
  emptyMessage?: string
  limit?: number
}

export function PickerDialog<T extends PickerItem>({
  title,
  subtitle,
  placeholder = 'Search…',
  options,
  onSelect,
  onClose,
  renderRow,
  filters,
  status,
  onClear,
  clearLabel = 'Clear selection',
  emptyMessage = 'No matches.',
  limit = 60,
}: PickerDialogProps<T>) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => rankOptions(options, query), [options, query])
  const visible = matches.slice(0, limit)

  useEffect(() => {
    setActive(0)
  }, [query, options])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, query])

  const commit = (index: number) => {
    const option = visible[index]
    if (option) onSelect(option)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/70 px-3 pb-8 pt-[6vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((current) => Math.min(current + 1, visible.length - 1))
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((current) => Math.max(current - 1, 0))
          } else if (event.key === 'Enter') {
            event.preventDefault()
            commit(active)
          }
        }}
        className="plate flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden shadow-plate"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] text-dim">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip border border-line text-faint transition hover:bg-raised hover:text-ink"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m3 3 6 6M9 3l-6 6" />
            </svg>
          </button>
        </header>

        <div className="space-y-2 border-b border-line px-4 py-3">
          <SearchInput value={query} onChange={setQuery} placeholder={placeholder} autoFocus />
          {filters}
        </div>

        {status ? (
          <div className="px-4 py-8">{status}</div>
        ) : visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-dim">{emptyMessage}</p>
        ) : (
          <ul ref={listRef} role="listbox" aria-label={title} className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {visible.map((option, index) => (
              <li key={option.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  data-active={index === active}
                  onMouseMove={() => setActive(index)}
                  onClick={() => onSelect(option)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-chip px-2.5 py-2 text-left transition-colors',
                    index === active ? 'bg-raised' : 'hover:bg-raised/60',
                  )}
                >
                  {renderRow(option)}
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
            {visible.length} / {matches.length} shown
          </span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-chip border border-line px-2.5 py-1 text-[11px] text-dim transition hover:bg-raised hover:text-ink"
            >
              {clearLabel}
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

/// Substring match on every whitespace-separated token, ranking prefix hits on the label first.
function rankOptions<T extends PickerItem>(options: T[], query: string): T[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return options
  const tokens = trimmed.split(/\s+/)
  const scored: { option: T; score: number }[] = []
  for (const option of options) {
    if (!tokens.every((token) => option.keywords.includes(token))) continue
    const label = option.label.toLowerCase()
    const score = label === trimmed ? 0 : label.startsWith(trimmed) ? 1 : label.includes(trimmed) ? 2 : 3
    scored.push({ option, score })
  }
  scored.sort((a, b) => a.score - b.score || a.option.label.length - b.option.label.length)
  return scored.map((entry) => entry.option)
}
