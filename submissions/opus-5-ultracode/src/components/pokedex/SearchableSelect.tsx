import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { TextInput } from '@/components/ui/Controls'
import { InlineLoader } from '@/components/shell/Loading'
import { cx } from '@/lib/cx'

export interface SearchableOption {
  id: number
  label: string
  hint?: string
}

export interface SearchableSelectProps {
  label: string
  value: number | null
  options: SearchableOption[]
  onChange: (value: number | null) => void
  placeholder?: string
  emptyLabel?: string
  loading?: boolean
  error?: string
  maxRendered?: number
}

/// Combobox for lists too long for a native `<select>`; renders at most `maxRendered` matches.
export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Any',
  emptyLabel = 'No matches',
  loading = false,
  error,
  maxRendered = 60,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const selected = useMemo(() => options.find((option) => option.id === value) ?? null, [options, value])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const source = needle
      ? options.filter((option) => option.label.toLowerCase().includes(needle))
      : options
    return source.slice(0, maxRendered)
  }, [options, query, maxRendered])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setQuery('')
    setActive(0)
  }, [open])

  const commit = (id: number | null) => {
    onChange(id)
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => {
        const next = event.key === 'ArrowDown' ? current + 1 : current - 1
        if (matches.length === 0) return 0
        return (next + matches.length) % matches.length
      })
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const option = matches[active]
      if (option) commit(option.id)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="numeric mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{label}</p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label}: ${selected?.label ?? placeholder}`}
          className={cx(
            'flex h-9 min-w-0 flex-1 items-center gap-2 rounded-chip border border-line bg-surface px-3 text-left text-sm transition hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--ui-line))]',
            selected ? 'text-ink' : 'text-faint',
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
          {loading ? (
            <span
              aria-hidden
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-line border-t-accent"
            />
          ) : (
            <svg
              aria-hidden
              viewBox="0 0 12 12"
              className="h-3 w-3 shrink-0 text-faint"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M3 4.5 6 7.5 9 4.5" />
            </svg>
          )}
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => commit(null)}
            aria-label={`Clear ${label}`}
            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-chip border border-line text-faint transition hover:bg-raised hover:text-ink"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m3 3 6 6M9 3l-6 6" />
            </svg>
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-[11px] text-[var(--type-fighting)]">{error}</p>}

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-plate border border-line bg-panel shadow-plate">
          <div className="border-b border-line-soft p-2">
            <TextInput
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={`Search ${label.toLowerCase()}…`}
              spellCheck={false}
              autoComplete="off"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              className="h-8 text-[13px]"
            />
          </div>
          <ul id={listId} role="listbox" aria-label={label} className="max-h-60 overflow-y-auto py-1">
            {loading && (
              <li>
                <InlineLoader label="Loading" />
              </li>
            )}
            {!loading && matches.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-faint">{emptyLabel}</li>
            )}
            {matches.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => commit(option.id)}
                  className={cx(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition',
                    index === active ? 'bg-raised text-ink' : 'text-dim',
                    option.id === value && 'text-accent',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint && <span className="numeric shrink-0 text-[10px] text-faint">{option.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
