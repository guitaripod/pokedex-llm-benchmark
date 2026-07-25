import { useMemo, useState } from 'react'
import { SearchInput } from '@/components/ui/Controls'
import { Sprite } from '@/components/ui/Sprite'
import { TypeDot } from '@/components/ui/TypeBadge'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import { gameSprite, homeArt, icon } from '@/lib/sprites'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry } from '@/types/data'

const RESULT_LIMIT = 36
const SUGGESTION_LIMIT = 12

/// Cheap row artwork: shiny requests skip the icon set, which has no shiny variants.
function rowSprites(id: number, shiny: boolean): string[] {
  return shiny
    ? [gameSprite(id, { shiny: true }), homeArt(id, { shiny: true }), icon(id)]
    : [icon(id), gameSprite(id), homeArt(id)]
}

/// Ranks matches so name prefixes beat substrings and default forms beat alternates.
function scoreMatch(entry: PokemonIndexEntry, query: string): number {
  const label = entry.label.toLowerCase()
  if (label === query) return 0
  if (label.startsWith(query)) return 1
  if (entry.name.startsWith(query)) return 2
  if (String(entry.dex) === query) return 3
  return 4
}

export function PokemonPicker({
  selected,
  onToggle,
  full,
  suggest = true,
}: {
  selected: number[]
  onToggle: (id: number) => void
  full: boolean
  /** Shows recent/favourite shortcuts while the query is empty. */
  suggest?: boolean
}) {
  const dex = useDex()
  const recent = useApp((state) => state.recent)
  const favorites = useApp((state) => state.favorites)
  const [query, setQuery] = useState('')

  const trimmed = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!trimmed) return []
    const matches = dex.entries.filter(
      (entry) =>
        entry.label.toLowerCase().includes(trimmed) ||
        entry.name.includes(trimmed) ||
        String(entry.dex) === trimmed,
    )
    return matches
      .sort((a, b) => scoreMatch(a, trimmed) - scoreMatch(b, trimmed) || a.dex - b.dex || a.id - b.id)
      .slice(0, RESULT_LIMIT)
  }, [dex.entries, trimmed])

  const suggestions = useMemo(() => {
    if (trimmed || !suggest) return []
    const ids = [...recent, ...favorites]
    const seen = new Set<number>()
    const picks: PokemonIndexEntry[] = []
    for (const id of ids) {
      if (seen.has(id)) continue
      seen.add(id)
      const entry = dex.byId.get(id)
      if (entry) picks.push(entry)
      if (picks.length >= SUGGESTION_LIMIT) break
    }
    if (picks.length > 0) return picks
    return dex.entries.filter((entry) => entry.isFullyEvolved && entry.isDefault).slice(0, SUGGESTION_LIMIT)
  }, [dex.byId, dex.entries, favorites, recent, suggest, trimmed])

  const shown = trimmed ? results : suggestions

  return (
    <div className="min-w-0">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search the national dex — name or dex number"
      />

      <p className="numeric mt-2 text-[10px] uppercase tracking-[0.16em] text-faint">
        {trimmed
          ? `${results.length}${results.length === RESULT_LIMIT ? '+' : ''} matches`
          : suggest
            ? recent.length + favorites.length > 0
              ? 'Recent & favourites'
              : 'Suggestions'
            : `${dex.entries.length.toLocaleString()} Pokémon indexed`}
        {full && ' · slots full — adding replaces the oldest pick'}
      </p>

      {shown.length === 0 ? (
        trimmed && <p className="mt-4 text-sm text-dim">No Pokémon matches “{query.trim()}”.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((entry) => {
            const active = selected.includes(entry.id)
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggle(entry.id)}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-chip border px-2 py-1.5 text-left transition',
                    active
                      ? 'border-[color-mix(in_oklab,var(--accent)_55%,var(--ui-line))] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]'
                      : 'border-line hover:bg-raised',
                  )}
                >
                  <Sprite
                    sources={rowSprites(entry.id, false)}
                    alt=""
                    className="h-8 w-8 shrink-0"
                    pixelated
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] font-medium">
                      {entry.label}
                    </span>
                    <span className="numeric flex items-center gap-1.5 text-[10px] text-faint">
                      {formatDex(entry.dex)}
                      {entry.types.map((typeId) => (
                        <TypeDot key={typeId} typeId={typeId} size={6} />
                      ))}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cx(
                      'numeric shrink-0 text-[10px] font-bold uppercase tracking-[0.12em]',
                      active ? 'text-accent' : 'text-faint',
                    )}
                  >
                    {active ? 'remove' : 'add'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
