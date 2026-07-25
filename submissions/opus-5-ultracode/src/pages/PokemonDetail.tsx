import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader, EmptyState } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Controls'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { Hero } from '@/components/pokemon-detail/Hero'
import { ProfileBand } from '@/components/pokemon-detail/ProfileBand'
import { StatsTab } from '@/components/pokemon-detail/StatsTab'
import { EvolutionTab } from '@/components/pokemon-detail/EvolutionTab'
import { MovesTab } from '@/components/pokemon-detail/MovesTab'
import { LocationsTab } from '@/components/pokemon-detail/LocationsTab'
import { FormsTab } from '@/components/pokemon-detail/FormsTab'
import { SpritesTab } from '@/components/pokemon-detail/SpritesTab'
import { DexEntriesTab } from '@/components/pokemon-detail/DexEntriesTab'
import { useAbilityLookup } from '@/components/pokemon-detail/shared'
import { load, prefetch, useAsync } from '@/lib/data'
import { useDex, typeSlug } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokemonDetail as PokemonDetailData, PokemonIndexEntry } from '@/types/data'

const TAB_IDS = ['stats', 'evolution', 'moves', 'locations', 'forms', 'sprites', 'dex'] as const

export default function PokemonDetail() {
  const { slug = '' } = useParams()
  const dex = useDex()
  const entry = dex.bySlug.get(slug)

  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab') ?? ''
  const activeTab = (TAB_IDS as readonly string[]).includes(requestedTab) ? requestedTab : 'stats'

  const [movesVersionGroup, setMovesVersionGroup] = useState<number | null>(null)

  const pushRecent = useApp((state) => state.pushRecent)
  const abilities = useAbilityLookup()

  const state = useAsync<PokemonDetailData>(entry ? `pokemon:${entry.id}` : null, () =>
    load.pokemon(entry!.id),
  )

  const neighbours = useNeighbours(entry)

  useEffect(() => {
    if (entry) pushRecent(entry.id)
  }, [entry, pushRecent])

  useEffect(() => {
    if (!neighbours) return
    prefetch([`pokemon/${neighbours.previous.id}.json`, `pokemon/${neighbours.next.id}.json`])
  }, [neighbours])

  useEffect(() => {
    setMovesVersionGroup(null)
  }, [slug])

  if (!entry) {
    return (
      <>
        <PageHeader eyebrow="Not found" title="Unknown Pokémon" subtitle={`No dex entry matches “${slug}”.`} />
        <EmptyState
          title="That Pokémon is not in the index"
          hint="Check the slug, or browse the national dex to find what you are after."
        />
        <div className="mt-4 flex justify-center">
          <Link
            to="/pokedex"
            className="rounded-chip border border-line px-4 py-2 text-sm transition hover:bg-raised"
          >
            Open the national dex
          </Link>
        </div>
      </>
    )
  }

  const detail = state.data
  const accent = `var(--type-${typeSlug(entry.types[0] ?? 1)})`

  const tabs = [
    { id: 'stats', label: 'Stats' },
    { id: 'evolution', label: 'Evolution', count: detail?.evolutionChain?.speciesIds.length },
    { id: 'moves', label: 'Moves', count: detail ? countMoves(detail) : undefined },
    { id: 'locations', label: 'Locations', count: detail?.encounters.length },
    {
      id: 'forms',
      label: 'Forms',
      count: detail ? Math.max(detail.varieties.length, detail.forms.length) : undefined,
    },
    { id: 'sprites', label: 'Sprites' },
    { id: 'dex', label: 'Dex entries', count: detail?.flavorText.length },
  ]

  const selectTab = (id: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set('tab', id)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow={`${formatDex(entry.dex)} · ${dex.nameOf('generations', entry.generation)}`}
        title={entry.label}
        subtitle={entry.genus ?? undefined}
        actions={
          <>
            {neighbours && <DexNav previous={neighbours.previous} next={neighbours.next} />}
            <ActionBar id={entry.id} label={entry.label} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        <Hero entry={entry} detail={detail} />

        {state.loading && <InlineLoader label="Loading dex record" />}
        {state.error && <ErrorState message={state.error.message} />}

        {detail && (
          <>
            <ProfileBand detail={detail} abilityById={abilities.byId} />

            <div className="min-w-0">
              <Tabs idPrefix="pokemon-tabs" tabs={tabs} active={activeTab} onChange={selectTab} className="mb-4" />

              <TabPanel idPrefix="pokemon-tabs" id="stats" active={activeTab === 'stats'}>
                <StatsTab detail={detail} abilityById={abilities.byId} />
              </TabPanel>
              <TabPanel idPrefix="pokemon-tabs" id="evolution" active={activeTab === 'evolution'}>
                <EvolutionTab detail={detail} />
              </TabPanel>
              <TabPanel idPrefix="pokemon-tabs" id="moves" active={activeTab === 'moves'}>
                <MovesTab
                  detail={detail}
                  versionGroupId={movesVersionGroup}
                  onVersionGroupChange={setMovesVersionGroup}
                />
              </TabPanel>
              <TabPanel idPrefix="pokemon-tabs" id="locations" active={activeTab === 'locations'}>
                <LocationsTab detail={detail} />
              </TabPanel>
              <TabPanel idPrefix="pokemon-tabs" id="forms" active={activeTab === 'forms'}>
                <FormsTab detail={detail} />
              </TabPanel>
              <TabPanel idPrefix="pokemon-tabs" id="sprites" active={activeTab === 'sprites'}>
                <SpritesTab detail={detail} />
              </TabPanel>
              <TabPanel idPrefix="pokemon-tabs" id="dex" active={activeTab === 'dex'}>
                <DexEntriesTab detail={detail} />
              </TabPanel>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/// Walks the national dex by species so alternate forms navigate alongside their base Pokémon.
function useNeighbours(entry: PokemonIndexEntry | undefined) {
  const dex = useDex()
  return useMemo(() => {
    if (!entry) return null
    const ordered = dex.entries.filter((item) => item.isDefault).sort((a, b) => a.dex - b.dex)
    const index = ordered.findIndex((item) => item.speciesId === entry.speciesId)
    if (index === -1) return null
    const count = ordered.length
    return {
      previous: ordered[(index - 1 + count) % count],
      next: ordered[(index + 1) % count],
    }
  }, [dex.entries, entry])
}

function countMoves(detail: PokemonDetailData): number {
  const ids = new Set<number>()
  for (const row of detail.moves) ids.add(row[0])
  return ids.size
}

function DexNav({ previous, next }: { previous: PokemonIndexEntry; next: PokemonIndexEntry }) {
  return (
    <div className="flex items-center gap-1 rounded-chip border border-line bg-surface p-0.5">
      <DexNavLink entry={previous} direction="previous" />
      <DexNavLink entry={next} direction="next" />
    </div>
  )
}

function DexNavLink({ entry, direction }: { entry: PokemonIndexEntry; direction: 'previous' | 'next' }) {
  const isPrevious = direction === 'previous'
  return (
    <Link
      to={`/pokemon/${entry.name}`}
      aria-label={`${isPrevious ? 'Previous' : 'Next'}: ${entry.label}`}
      title={`${formatDex(entry.dex)} ${entry.label}`}
      className={cx(
        'flex h-8 items-center gap-1.5 rounded-[4px] px-2 text-dim transition hover:bg-raised hover:text-ink',
        isPrevious ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <svg
        viewBox="0 0 12 12"
        aria-hidden
        className={cx('h-3 w-3 shrink-0', isPrevious ? 'rotate-180' : '')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 2 8 6l-4 4" />
      </svg>
      <span className="numeric hidden max-w-[92px] truncate text-[11px] font-medium sm:inline">
        {entry.label}
      </span>
    </Link>
  )
}

function ActionBar({ id, label }: { id: number; label: string }) {
  const favorite = useApp((state) => state.favorites.includes(id))
  const caught = useApp((state) => state.caught.includes(id))
  const comparing = useApp((state) => state.compare.includes(id))
  const toggleFavorite = useApp((state) => state.toggleFavorite)
  const toggleCaught = useApp((state) => state.toggleCaught)
  const toggleCompare = useApp((state) => state.toggleCompare)
  const addToTeam = useApp((state) => state.addToTeam)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setAdded(false)
  }, [id])

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        variant={favorite ? 'solid' : 'outline'}
        size="sm"
        aria-pressed={favorite}
        aria-label={favorite ? `Remove ${label} from favourites` : `Add ${label} to favourites`}
        onClick={() => toggleFavorite(id)}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M8 13.5 3.2 8.9a3 3 0 1 1 4.3-4.2l.5.5.5-.5a3 3 0 1 1 4.3 4.2Z" />
        </svg>
        <span className="hidden sm:inline">Favourite</span>
      </Button>

      <Button
        variant={caught ? 'solid' : 'outline'}
        size="sm"
        aria-pressed={caught}
        aria-label={caught ? `Mark ${label} as not caught` : `Mark ${label} as caught`}
        onClick={() => toggleCaught(id)}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8h4m4 0h4" />
          <circle cx="8" cy="8" r="1.8" fill="currentColor" />
        </svg>
        <span className="hidden sm:inline">Caught</span>
      </Button>

      <Button
        variant={added ? 'solid' : 'outline'}
        size="sm"
        aria-label={`Add ${label} to the team builder`}
        onClick={() => {
          addToTeam(id)
          setAdded(true)
        }}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
        <span className="hidden sm:inline">{added ? 'On team' : 'Team'}</span>
      </Button>

      <Button
        variant={comparing ? 'solid' : 'outline'}
        size="sm"
        aria-pressed={comparing}
        aria-label={comparing ? `Remove ${label} from the comparison` : `Add ${label} to the comparison`}
        onClick={() => toggleCompare(id)}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M2.5 5.5h8m-2.5-2.5 2.5 2.5-2.5 2.5M13.5 10.5h-8m2.5-2.5-2.5 2.5 2.5 2.5" />
        </svg>
        <span className="hidden sm:inline">Compare</span>
      </Button>
    </div>
  )
}
