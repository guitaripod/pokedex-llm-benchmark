import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { SearchInput } from '@/components/ui/Controls'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { useDex, typeSlug } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { scoreCandidate } from '@/lib/search'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry } from '@/types/data'

const MAX_RESULTS = 60

/// Ranks the national index against a query; an empty query lists canonical forms in dex order.
function rankEntries(entries: PokemonIndexEntry[], query: string): PokemonIndexEntry[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return entries.filter((entry) => entry.isDefault).slice(0, MAX_RESULTS)

  const scored: { entry: PokemonIndexEntry; score: number }[] = []
  for (const entry of entries) {
    const score = Math.max(
      scoreCandidate(entry.name, trimmed),
      scoreCandidate(entry.label.toLowerCase(), trimmed),
      String(entry.dex) === trimmed ? 900 : 0,
    )
    if (score > 0) scored.push({ entry, score: score + (entry.isDefault ? 60 : 0) })
  }
  scored.sort((a, b) => b.score - a.score || a.entry.id - b.entry.id)
  return scored.slice(0, MAX_RESULTS).map((item) => item.entry)
}

export interface PokemonPickerProps {
  value: PokemonIndexEntry | null
  onSelect: (entry: PokemonIndexEntry) => void
  label: string
  className?: string
  size?: 'sm' | 'md'
}

export function PokemonPicker({ value, onSelect, label, className, size = 'md' }: PokemonPickerProps) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const matches = useMemo(() => rankEntries(dex.entries, query), [dex.entries, query])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.children[cursor] as HTMLElement | undefined
    node?.scrollIntoView({ block: 'nearest' })
  }, [cursor, open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const commit = (entry: PokemonIndexEntry) => {
    onSelect(entry)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((current) => Math.min(matches.length - 1, current + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((current) => Math.max(0, current - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const entry = matches[cursor]
      if (entry) commit(entry)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cx('relative min-w-0', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cx(
          'flex w-full min-w-0 items-center gap-3 rounded-plate border border-line bg-surface px-3 text-left transition hover:border-[color-mix(in_oklab,var(--accent)_55%,var(--ui-line))]',
          size === 'sm' ? 'py-2' : 'py-2.5',
        )}
      >
        {value ? (
          <Sprite
            sources={spriteSources(value.id, spriteStyle, shiny)}
            alt={value.label}
            className={size === 'sm' ? 'h-8 w-8 shrink-0' : 'h-11 w-11 shrink-0'}
            pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
          />
        ) : (
          <span
            aria-hidden
            className={cx(
              'shrink-0 rounded-full border border-dashed border-line',
              size === 'sm' ? 'h-8 w-8' : 'h-11 w-11',
            )}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="numeric block text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            {label}
          </span>
          <span className="block truncate font-display text-sm font-semibold">
            {value ? value.label : 'Choose a Pokémon'}
          </span>
        </span>
        {value && (
          <span className="hidden shrink-0 items-center gap-1 sm:flex">
            {value.types.map((typeId) => (
              <TypeBadge
                key={typeId}
                typeId={typeId}
                label={dex.typeById.get(typeId)?.label ?? ''}
                size="xs"
                link={false}
              />
            ))}
          </span>
        )}
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
      </button>

      {open && (
        <div
          onKeyDown={onKeyDown}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-plate border border-line bg-panel shadow-plate"
        >
          <div className="border-b border-line p-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search the national dex…"
              autoFocus
            />
          </div>
          <ul
            ref={listRef}
            role="listbox"
            id={listId}
            aria-label={label}
            className="max-h-[300px] overflow-y-auto p-1"
          >
            {matches.map((entry, index) => (
              <li key={entry.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={entry.id === value?.id}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => commit(entry)}
                  style={{ '--accent': `var(--type-${typeSlug(entry.types[0] ?? 1)})` } as React.CSSProperties}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-chip px-2 py-1.5 text-left transition',
                    index === cursor ? 'bg-raised' : 'hover:bg-raised/60',
                  )}
                >
                  <Sprite
                    sources={spriteSources(entry.id, 'home', shiny)}
                    alt=""
                    className="h-8 w-8 shrink-0"
                  />
                  <span className="numeric w-11 shrink-0 text-[10px] text-faint">{formatDex(entry.dex)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{entry.label}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {entry.types.map((typeId) => (
                      <TypeBadge
                        key={typeId}
                        typeId={typeId}
                        label={dex.typeById.get(typeId)?.label ?? ''}
                        size="xs"
                        link={false}
                      />
                    ))}
                  </span>
                  <span className="numeric hidden w-9 shrink-0 text-right text-[11px] text-dim sm:block">
                    {entry.bst}
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-dim">No Pokémon matches “{query}”.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
