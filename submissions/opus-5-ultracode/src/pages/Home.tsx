import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { Skeleton } from '@/components/ui/Controls'
import { ErrorState } from '@/components/shell/Loading'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { Spotlight } from '@/components/home/Spotlight'
import { TypeChartTeaser } from '@/components/home/TypeChartTeaser'
import { StarterShowcase } from '@/components/home/StarterShowcase'
import { openCommandPalette } from '@/components/home/commandPalette'
import { NAV_GROUPS } from '@/components/shell/nav'
import { loadJson, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { cx } from '@/lib/cx'

interface DatasetStats {
  pokemon: number
  species: number
  forms: number
  moves: number
  items: number
  abilities: number
  locations: number
  learnsetRows: number
  encounterRows: number
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

const TOOL_BLURBS: Record<string, string> = {
  '/team': 'Six slots, natures, EV and IV spreads, live defensive profile.',
  '/compare': 'Stack up to six Pokémon side by side, stat for stat.',
  '/calc/damage': 'Gen V+ damage rolls with weather, screens and criticals.',
  '/calc/catch': 'Catch odds by ball, status and remaining HP.',
  '/coverage': 'Find the holes in a movepool across all 18 types.',
  '/leaderboard': 'Extremes and rankings for every base stat.',
  '/play/whos-that': 'Silhouette quiz over the full national dex.',
}

/// Thousands-separated rendering for the dataset figures.
function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

export default function Home() {
  const dex = useDex()
  const stats = useAsync('stats.json', () => loadJson<DatasetStats>('stats.json'))
  const recent = useApp((state) => state.recent)
  const favorites = useApp((state) => state.favorites)
  const caught = useApp((state) => state.caught)
  const teamCount = useApp((state) => state.team.filter(Boolean).length)

  const counts = dex.meta.counts

  const generations = useMemo(() => {
    const totals = new Map<number, number>()
    for (const entry of dex.entries) totals.set(entry.generation, (totals.get(entry.generation) ?? 0) + 1)
    return dex.meta.generations.map((generation) => ({
      id: generation.id,
      region: dex.meta.regions.find((region) => region.id === generation.mainRegionId)?.label ?? '—',
      total: totals.get(generation.id) ?? 0,
    }))
  }, [dex])

  const recentEntries = useMemo(
    () =>
      recent
        .map((id) => dex.byId.get(id))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .slice(0, 12),
    [recent, dex],
  )

  const tools = useMemo(
    () => NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.to in TOOL_BLURBS),
    [],
  )

  const headline = [
    { label: 'Pokémon', value: stats.data?.pokemon ?? counts.pokemon, to: '/pokedex' },
    { label: 'Species', value: stats.data?.species ?? counts.species, to: '/pokedexes' },
    { label: 'Moves', value: stats.data?.moves ?? counts.moves, to: '/moves' },
    { label: 'Items', value: stats.data?.items ?? counts.items, to: '/items' },
    { label: 'Abilities', value: stats.data?.abilities ?? counts.abilities, to: '/abilities' },
    { label: 'Locations', value: stats.data?.locations ?? counts.locations, to: '/locations' },
  ]

  return (
    <div className="space-y-6" style={{ '--accent': 'var(--type-fighting)' } as React.CSSProperties}>
      <section className="dex-grid-bg relative overflow-hidden rounded-plate border border-line px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative max-w-3xl">
          <p className="numeric text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            National index · complete through Generation IX
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight sm:text-6xl">
            Pokédex
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-dim">
            Every Pokémon, move, ability, item and location from the main series, compiled from the PokéAPI
            dataset into a single static corpus and served from the edge.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={openCommandPalette}
              className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-chip border border-line bg-surface px-4 text-left text-sm text-faint transition hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] sm:max-w-lg"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4 shrink-0"
                aria-hidden
              >
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" />
              </svg>
              <span className="min-w-0 flex-1 truncate">
                Search {formatCount(counts.pokemon)} Pokémon, {formatCount(counts.moves)} moves,{' '}
                {formatCount(counts.items)} items…
              </span>
              <kbd className="numeric hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] sm:inline">
                ⌘K
              </kbd>
            </button>

            <Link
              to="/pokedex"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-chip bg-accent px-5 text-sm font-semibold text-[#0b0d12] transition hover:brightness-110"
            >
              Browse the dex
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        <dl className="relative mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line-soft pt-5 sm:grid-cols-3 lg:grid-cols-6">
          {headline.map((item) => (
            <Link key={item.label} to={item.to} className="group min-w-0">
              <dt className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                {item.label}
              </dt>
              <dd className="numeric mt-0.5 truncate text-2xl font-bold leading-none transition group-hover:text-accent">
                {formatCount(item.value)}
              </dd>
            </Link>
          ))}
        </dl>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <CollectionPill to="/favorites" label="Favourites" value={favorites.length} />
          <CollectionPill to="/favorites" label="Caught" value={caught.length} />
          <CollectionPill to="/team" label="Team" value={`${teamCount}/6`} />
        </div>
      </section>

      <Panel className="min-w-0">
        <SectionTitle
          eyebrow="Jump to"
          actions={
            <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
              {formatCount(dex.entries.length)} forms indexed
            </span>
          }
        >
          Generations
        </SectionTitle>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {generations.map((generation) => (
            <Link
              key={generation.id}
              to={`/pokedex?g=${generation.id}`}
              className="group flex flex-col items-center rounded-chip border border-line-soft bg-surface/40 px-2 py-3 text-center transition hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:bg-raised"
            >
              <span className="numeric font-display text-lg font-bold leading-none transition group-hover:text-accent">
                {ROMAN[generation.id - 1]}
              </span>
              <span className="mt-1 w-full truncate text-[11px] leading-tight text-dim">
                {generation.region}
              </span>
              <span className="numeric mt-1 text-[10px] uppercase tracking-[0.14em] text-faint">
                {generation.total}
              </span>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Spotlight />

        <Panel className="min-w-0">
          <SectionTitle eyebrow="Instruments">Tools</SectionTitle>
          <ul className="space-y-1.5">
            {tools.map((tool) => (
              <li key={tool.to}>
                <Link
                  to={tool.to}
                  className="group flex items-start gap-3 rounded-chip border border-transparent px-2.5 py-2 transition hover:border-line hover:bg-raised"
                >
                  <span className="mt-0.5 shrink-0 text-faint transition group-hover:text-accent">
                    {tool.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] font-semibold">{tool.label}</span>
                    <span className="block truncate text-[11px] leading-tight text-dim">
                      {TOOL_BLURBS[tool.to]}
                    </span>
                  </span>
                  {tool.shortcut && (
                    <kbd className="numeric mt-0.5 hidden shrink-0 rounded border border-line px-1 text-[9px] text-faint group-hover:inline">
                      {tool.shortcut}
                    </kbd>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="min-w-0">
        <SectionTitle
          eyebrow="History"
          actions={
            recentEntries.length > 0 ? (
              <Link
                to="/favorites"
                className="numeric rounded-chip border border-line px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim transition hover:bg-raised hover:text-ink"
              >
                Collection
              </Link>
            ) : undefined
          }
        >
          Recently viewed
        </SectionTitle>
        {recentEntries.length === 0 ? (
          <EmptyState
            title="No entries opened yet"
            hint="Pokémon you open queue up here for quick return. Press ⌘K to search the whole dex."
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {recentEntries.map((entry) => (
              <PokemonCard key={entry.id} entry={entry} compact />
            ))}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TypeChartTeaser />

        <Panel className="min-w-0">
          <SectionTitle eyebrow="Build output">Corpus</SectionTitle>
          {stats.loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index}>
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="mt-2 h-5 w-20" />
                </div>
              ))}
            </div>
          ) : stats.error ? (
            <ErrorState message={stats.error.message} />
          ) : stats.data ? (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <Figure label="Forms" value={stats.data.forms} hint="Regional, mega and Gigantamax" />
                <Figure label="Learnset rows" value={stats.data.learnsetRows} hint="Move × version group" />
                <Figure label="Encounter rows" value={stats.data.encounterRows} hint="Wild slots by area" />
                <Figure label="Machines" value={counts.machines} hint="TM, HM and TR entries" />
                <Figure label="Berries" value={counts.berries} hint="With flavour profiles" />
                <Figure label="Versions" value={counts.versions} hint="Across nine generations" />
              </dl>
              <p className="mt-4 border-t border-line-soft pt-3 text-[11px] leading-relaxed text-faint">
                Compiled {new Date(dex.meta.generatedAt).toLocaleDateString('en-GB', { dateStyle: 'long' })}{' '}
                from the PokéAPI CSV dataset into static JSON.{' '}
                <Link
                  to="/about"
                  className="text-dim underline decoration-line underline-offset-2 transition hover:text-accent"
                >
                  How this is built
                </Link>
              </p>
            </>
          ) : null}
        </Panel>
      </div>

      <StarterShowcase />
    </div>
  )
}

function CollectionPill({ to, label, value }: { to: string; label: string; value: number | string }) {
  return (
    <Link
      to={to}
      className={cx(
        'inline-flex h-7 items-center gap-2 rounded-chip border border-line bg-surface/60 px-2.5',
        'transition hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:bg-raised',
      )}
    >
      <span className="numeric text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</span>
      <span className="numeric text-[12px] font-semibold">{value}</span>
    </Link>
  )
}

function Figure({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="min-w-0">
      <dt className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="numeric mt-0.5 truncate text-xl font-bold leading-none">{formatCount(value)}</dd>
      <p className="mt-1 truncate text-[11px] text-dim">{hint}</p>
    </div>
  )
}
