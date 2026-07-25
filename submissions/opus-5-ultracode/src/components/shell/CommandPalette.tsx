import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { load } from '@/lib/data'
import { KIND_LABELS, rankSearch, routeFor } from '@/lib/search'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { useDialogFocus } from '@/lib/a11y'
import { thumbCandidates } from '@/lib/sprites'
import { Sprite } from '@/components/ui/Sprite'
import { TypeDot } from '@/components/ui/TypeBadge'
import { cx } from '@/lib/cx'
import { formatDex } from '@/lib/game'
import type { SearchTuple } from '@/types/data'

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<SearchTuple[]>([])
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const dex = useDex()
  const recent = useApp((state) => state.recent)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    void load.search().then((index) => setEntries(index.entries))
    setQuery('')
    setActive(0)
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) {
      return recent
        .map((id) => dex.byId.get(id))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .slice(0, 8)
        .map((entry): SearchTuple => ['pokemon', entry.id, entry.name, entry.label, entry.types[0] ?? null])
    }
    return rankSearch(entries, query, 40)
  }, [query, entries, recent, dex])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  useDialogFocus(dialogRef, open)

  if (!open) return null

  const commit = (entry: SearchTuple) => {
    navigate(routeFor(entry[0], entry[2]))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        className="relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-plate border border-line bg-surface shadow-[0_24px_80px_-20px_rgb(0_0_0/0.6)]"
      >
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0 text-faint">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
              } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActive((current) => Math.min(current + 1, results.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActive((current) => Math.max(current - 1, 0))
              } else if (event.key === 'Enter' && results[active]) {
                event.preventDefault()
                commit(results[active])
              }
            }}
            placeholder="Search Pokémon, moves, items, abilities, locations…"
            spellCheck={false}
            autoComplete="off"
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
          <kbd className="numeric rounded border border-line px-1.5 py-0.5 text-[10px] text-faint">esc</kbd>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-faint">
              {query.trim() ? `Nothing matches “${query}”.` : 'Start typing to search the whole dex.'}
            </p>
          ) : (
            <>
              {!query.trim() && (
                <p className="numeric px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-faint">
                  Recently viewed
                </p>
              )}
              {results.map((entry, index) => (
                <Row
                  key={`${entry[0]}-${entry[1]}`}
                  entry={entry}
                  active={index === active}
                  onHover={() => setActive(index)}
                  onSelect={() => commit(entry)}
                />
              ))}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 border-t border-line px-4 py-2 text-[10px] text-faint">
          <Hint keys="↑↓" label="navigate" />
          <Hint keys="↵" label="open" />
          <Hint keys="esc" label="dismiss" />
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  )
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="numeric rounded border border-line px-1 py-px">{keys}</kbd>
      {label}
    </span>
  )
}

function Row({
  entry,
  active,
  onHover,
  onSelect,
}: {
  entry: SearchTuple
  active: boolean
  onHover: () => void
  onSelect: () => void
}) {
  const [kind, id, , label, extra] = entry
  const shiny = useApp((state) => state.shiny)
  const dex = useDex()
  const dexNumber = kind === 'pokemon' ? (dex.byId.get(id)?.dex ?? id) : id

  return (
    <button
      type="button"
      data-active={active}
      onMouseMove={onHover}
      onClick={onSelect}
      className={cx(
        'flex w-full items-center gap-3 rounded-chip px-2.5 py-2 text-left transition',
        active ? 'bg-raised' : 'hover:bg-raised/60',
      )}
    >
      {kind === 'pokemon' ? (
        <Sprite
          sources={thumbCandidates(id, shiny)}
          alt=""
          className="h-8 w-8 shrink-0"
          loading="eager"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-chip border border-line text-faint">
          {extra != null ? <TypeDot typeId={extra} size={9} /> : <KindGlyph kind={kind} />}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{label}</span>
        <span className="numeric block text-[10px] uppercase tracking-[0.14em] text-faint">
          {KIND_LABELS[kind] ?? kind}
          {kind === 'pokemon' && ` · ${formatDex(dexNumber)}`}
        </span>
      </span>

      {active && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
      )}
    </button>
  )
}

function KindGlyph({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      {kind === 'page' ? (
        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" />
      ) : (
        <>
          <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
          <path d="M5.5 8h5" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
