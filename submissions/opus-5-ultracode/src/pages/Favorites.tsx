import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Segmented, Select } from '@/components/ui/Controls'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { CaughtToggle } from '@/components/pokedexes/DexBits'
import { ConfirmButton, FavoriteToggle } from '@/components/collection/CollectionToggles'
import {
  GenerationBreakdown,
  TypeDistribution,
  type GenerationRow,
  type TypeCount,
} from '@/components/collection/CollectionCharts'
import { useIncremental } from '@/components/pokedexes/useIncremental'
import { accentForType, dominantTypeId, formatPercent, percent } from '@/components/pokedexes/dexData'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import type { PokemonIndexEntry } from '@/types/data'

type TabKey = 'favorites' | 'caught'
type SortKey = 'added' | 'dex' | 'name' | 'bst' | 'type'

const SPECIES_TOTAL = 1025

const SORTS: Record<SortKey, ((a: PokemonIndexEntry, b: PokemonIndexEntry) => number) | null> = {
  added: null,
  dex: (a, b) => a.dex - b.dex || a.id - b.id,
  name: (a, b) => a.label.localeCompare(b.label),
  bst: (a, b) => b.bst - a.bst,
  type: (a, b) => (a.types[0] ?? 0) - (b.types[0] ?? 0) || a.dex - b.dex,
}

export default function Favorites() {
  const dex = useDex()
  const favorites = useApp((state) => state.favorites)
  const caught = useApp((state) => state.caught)
  const toggleFavorite = useApp((state) => state.toggleFavorite)
  const clearCaught = useApp((state) => state.clearCaught)
  const density = useApp((state) => state.density)
  const setSetting = useApp((state) => state.setSetting)

  const [tab, setTab] = useState<TabKey>('favorites')
  const [sortKey, setSortKey] = useState<SortKey>('added')

  const favoriteEntries = useCollection(favorites, sortKey)
  const caughtEntries = useCollection(caught, sortKey)

  const caughtSpecies = useMemo(
    () => new Set(caughtEntries.map((entry) => entry.speciesId)).size,
    [caughtEntries],
  )
  const completion = percent(caughtSpecies, SPECIES_TOTAL)

  const averageBst = useMemo(() => {
    if (caughtEntries.length === 0) return 0
    const total = caughtEntries.reduce((sum, entry) => sum + entry.bst, 0)
    return Math.round(total / caughtEntries.length)
  }, [caughtEntries])

  const generationRows = useMemo<GenerationRow[]>(() => {
    const totals = new Map<number, number>()
    for (const entry of dex.entries) {
      if (!entry.isDefault) continue
      totals.set(entry.generation, (totals.get(entry.generation) ?? 0) + 1)
    }
    const owned = new Map<number, Set<number>>()
    for (const entry of caughtEntries) {
      const set = owned.get(entry.generation) ?? new Set<number>()
      set.add(entry.speciesId)
      owned.set(entry.generation, set)
    }
    return dex.meta.generations.map((generation) => ({
      id: generation.id,
      label: `Gen ${romanNumeral(generation.id)}`,
      caught: owned.get(generation.id)?.size ?? 0,
      total: totals.get(generation.id) ?? 0,
    }))
  }, [dex, caughtEntries])

  const active = tab === 'favorites' ? favoriteEntries : caughtEntries

  const typeCounts = useMemo<TypeCount[]>(() => {
    const tally = new Map<number, number>()
    for (const entry of active) {
      for (const typeId of entry.types) tally.set(typeId, (tally.get(typeId) ?? 0) + 1)
    }
    return [...tally.entries()]
      .map(([typeId, count]) => ({ typeId, label: dex.typeById.get(typeId)?.label ?? '—', count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [active, dex])

  const accent = useMemo(
    () =>
      accentForType(
        dominantTypeId([...favoriteEntries, ...caughtEntries].map((entry) => entry.types)),
      ),
    [favoriteEntries, caughtEntries],
  )

  const pager = useIncremental(active.length, `${tab}|${sortKey}`, 60)
  const empty = favorites.length === 0 && caught.length === 0

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow="Personal collection"
        title="Favourites & caught"
        subtitle="Everything you have starred or logged as caught, with live completion statistics across the national dex."
        actions={
          <Link
            to="/pokedex"
            className="inline-flex h-9 items-center rounded-chip border border-line px-4 text-sm text-dim transition hover:bg-raised hover:text-ink"
          >
            Browse the dex
          </Link>
        }
      >
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Species caught" value={`${caughtSpecies} / ${SPECIES_TOTAL}`} accent />
          <Stat label="Completion" value={formatPercent(completion, 2)} />
          <Stat label="Favourites" value={favorites.length} />
          <Stat label="Entries logged" value={caught.length} hint="forms included" />
          <Stat label="Average BST" value={averageBst || '—'} />
        </div>
      </PageHeader>

      {empty ? (
        <div className="space-y-4">
          <EmptyState
            title="Your collection is empty"
            hint="Open any Pokémon and mark it as caught, or star it as a favourite — everything you log shows up here."
          />
          <div className="flex justify-center">
            <Link
              to="/pokedex"
              className="inline-flex h-10 items-center rounded-chip bg-accent px-5 font-display text-sm font-semibold text-[#0b0d12] transition hover:brightness-110"
            >
              Start with the national dex
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel>
              <SectionTitle eyebrow="Completion" actions={<CompletionPill value={completion} />}>
                By generation
              </SectionTitle>
              <GenerationBreakdown rows={generationRows} />
            </Panel>
            <Panel>
              <SectionTitle eyebrow={tab === 'favorites' ? 'Favourites' : 'Caught'}>
                Type distribution
              </SectionTitle>
              <TypeDistribution
                counts={typeCounts}
                total={active.length}
                linkTypes
                emptyMessage="Nothing in this list yet."
              />
            </Panel>
          </div>

          <Tabs idPrefix="collection-tabs"
            active={tab}
            onChange={(next) => setTab(next as TabKey)}
            tabs={[
              { id: 'favorites', label: 'Favourites', count: favoriteEntries.length },
              { id: 'caught', label: 'Caught', count: caughtEntries.length },
            ]}
            className="mb-4"
          />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Select
              aria-label="Sort collection"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="added">Recently added</option>
              <option value="dex">Dex number</option>
              <option value="name">Name</option>
              <option value="bst">Base stat total</option>
              <option value="type">Type</option>
            </Select>
            <Segmented
              size="sm"
              value={density}
              onChange={(value) => setSetting('density', value)}
              options={[
                { value: 'comfortable' as const, label: 'Comfortable' },
                { value: 'compact' as const, label: 'Compact' },
              ]}
            />
            <span className="numeric ml-auto text-[10px] uppercase tracking-[0.16em] text-faint">
              {active.length} shown
            </span>
            {tab === 'favorites' ? (
              <ConfirmButton
                label="Clear favourites"
                confirmLabel="Tap again to clear"
                disabled={favorites.length === 0}
                onConfirm={() => {
                  for (const id of [...favorites]) toggleFavorite(id)
                }}
              />
            ) : (
              <ConfirmButton
                label="Clear caught"
                confirmLabel="Tap again to clear"
                disabled={caught.length === 0}
                onConfirm={clearCaught}
              />
            )}
          </div>

          <TabPanel idPrefix="collection-tabs" id="favorites" active={tab === 'favorites'}>
            {favoriteEntries.length === 0 ? (
              <EmptyState
                title="No favourites yet"
                hint="Star a Pokémon from its detail page to pin it here."
              />
            ) : (
              <CollectionGrid
                entries={favoriteEntries.slice(0, pager.count)}
                compact={density === 'compact'}
                badge={(entry) => <FavoriteToggle pokemonId={entry.id} label={entry.label} />}
              />
            )}
          </TabPanel>

          <TabPanel idPrefix="collection-tabs" id="caught" active={tab === 'caught'}>
            {caughtEntries.length === 0 ? (
              <EmptyState
                title="Nothing logged as caught"
                hint="Use the ball toggle on any pokédex entry to record a catch."
              />
            ) : (
              <CollectionGrid
                entries={caughtEntries.slice(0, pager.count)}
                compact={density === 'compact'}
                badge={(entry) => (
                  <CaughtToggle pokemonId={entry.id} label={entry.label} size="sm" />
                )}
              />
            )}
          </TabPanel>

          <div ref={pager.sentinelRef} aria-hidden className="h-px" />
          {pager.remaining > 0 && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={pager.showMore}
                className="rounded-chip border border-line px-4 py-2 text-xs transition hover:bg-raised"
              >
                Show more
              </button>
              <span className="numeric text-[11px] text-faint">{pager.remaining} more</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/// Resolves stored ids against the national index, dropping anything the dataset no longer has.
function useCollection(ids: number[], sortKey: SortKey): PokemonIndexEntry[] {
  const dex = useDex()
  return useMemo(() => {
    const source = sortKey === 'added' ? [...ids].reverse() : ids
    const entries = source
      .map((id) => dex.byId.get(id))
      .filter((entry): entry is PokemonIndexEntry => entry !== undefined)
    const comparator = SORTS[sortKey]
    return comparator ? [...entries].sort(comparator) : entries
  }, [ids, sortKey, dex])
}

function CollectionGrid({
  entries,
  compact,
  badge,
}: {
  entries: PokemonIndexEntry[]
  compact: boolean
  badge: (entry: PokemonIndexEntry) => React.ReactNode
}) {
  return (
    <div
      className={
        compact
          ? 'grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8'
          : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6'
      }
    >
      {entries.map((entry, index) => (
        <PokemonCard
          key={entry.id}
          entry={entry}
          compact={compact}
          eager={index < 12}
          badge={badge(entry)}
        />
      ))}
    </div>
  )
}

function CompletionPill({ value }: { value: number }) {
  return (
    <span className="numeric rounded-chip bg-raised px-2 py-1 text-[11px] font-semibold text-accent">
      {formatPercent(value, 1)}
    </span>
  )
}

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function romanNumeral(value: number): string {
  return ROMAN[value] ?? String(value)
}
