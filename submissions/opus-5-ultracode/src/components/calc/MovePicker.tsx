import { useEffect, useMemo, useRef, useState } from 'react'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { SearchInput } from '@/components/ui/Controls'
import { useDex } from '@/lib/dex'
import { scoreCandidate } from '@/lib/search'
import { DAMAGE_CLASS } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { MoveIndexEntry } from '@/types/data'

const MAX_RESULTS = 80

export const DAMAGE_CLASS_SHORT: Record<number, string> = {
  [DAMAGE_CLASS.status]: 'STA',
  [DAMAGE_CLASS.physical]: 'PHY',
  [DAMAGE_CLASS.special]: 'SPE',
}

/// Orders candidate moves by query relevance, falling back to raw power when nothing is typed.
function rankMoves(moves: MoveIndexEntry[], query: string): MoveIndexEntry[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return [...moves]
      .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.label.localeCompare(b.label))
      .slice(0, MAX_RESULTS)
  }
  const scored: { move: MoveIndexEntry; score: number }[] = []
  for (const move of moves) {
    const score = Math.max(scoreCandidate(move.name, trimmed), scoreCandidate(move.label.toLowerCase(), trimmed))
    if (score > 0) scored.push({ move, score })
  }
  scored.sort((a, b) => b.score - a.score || (b.move.power ?? 0) - (a.move.power ?? 0))
  return scored.slice(0, MAX_RESULTS).map((item) => item.move)
}

export interface MovePickerProps {
  moves: MoveIndexEntry[]
  value: MoveIndexEntry | null
  onSelect: (move: MoveIndexEntry) => void
  label: string
  disabled?: boolean
  emptyHint?: string
}

export function MovePicker({ moves, value, onSelect, label, disabled, emptyHint }: MovePickerProps) {
  const dex = useDex()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => rankMoves(moves, query), [moves, query])

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

  const commit = (move: MoveIndexEntry) => {
    onSelect(move)
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
      const move = matches[cursor]
      if (move) commit(move)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full min-w-0 items-center gap-2.5 rounded-plate border border-line bg-surface px-3 py-2.5 text-left transition hover:border-[color-mix(in_oklab,var(--accent)_55%,var(--ui-line))] disabled:pointer-events-none disabled:opacity-45"
      >
        <span className="min-w-0 flex-1">
          <span className="numeric block text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            {label}
          </span>
          <span className="block truncate font-display text-sm font-semibold">
            {value ? value.label : (emptyHint ?? 'Choose a move')}
          </span>
        </span>
        {value && (
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="numeric text-[11px] text-dim">{value.power ?? '—'}</span>
            <TypeBadge
              typeId={value.typeId}
              label={dex.typeById.get(value.typeId)?.label ?? ''}
              size="xs"
              link={false}
            />
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
            <SearchInput value={query} onChange={setQuery} placeholder="Search moves…" autoFocus />
          </div>
          <ul ref={listRef} role="listbox" aria-label={label} className="max-h-[300px] overflow-y-auto p-1">
            {matches.map((move, index) => (
              <li key={move.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={move.id === value?.id}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => commit(move)}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-chip px-2 py-1.5 text-left transition',
                    index === cursor ? 'bg-raised' : 'hover:bg-raised/60',
                  )}
                >
                  <TypeBadge
                    typeId={move.typeId}
                    label={dex.typeById.get(move.typeId)?.label ?? ''}
                    size="xs"
                    link={false}
                    className="w-[62px] shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{move.label}</span>
                  <span className="numeric w-8 shrink-0 text-right text-[10px] text-faint">
                    {DAMAGE_CLASS_SHORT[move.damageClassId]}
                  </span>
                  <span className="numeric w-9 shrink-0 text-right text-[11px] text-dim">
                    {move.power ?? '—'}
                  </span>
                  <span className="numeric hidden w-10 shrink-0 text-right text-[11px] text-faint sm:block">
                    {move.accuracy ?? '—'}%
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-dim">No move matches “{query}”.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
