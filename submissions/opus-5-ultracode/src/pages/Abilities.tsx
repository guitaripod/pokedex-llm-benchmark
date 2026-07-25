import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button, Chip, SearchInput, Segmented } from '@/components/ui/Controls'
import { EmptyState, PageHeader, Panel, Stat } from '@/components/ui/Panel'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import {
  GenerationTag,
  NonMainSeriesTag,
  TypeShiftBadge,
  generationRoman,
} from '@/components/abilities/AbilityMarks'
import { load, useAsync } from '@/lib/data'
import { hasDefensiveAbilityEffect } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { AbilityIndexEntry } from '@/types/data'

const PAGE_ACCENT = 'var(--type-psychic)'
const GENERATIONS = [3, 4, 5, 6, 7, 8, 9]
const GRID_LIMIT = 120

type SortKey = 'name' | 'generation' | 'count'

/// Matches every whitespace-separated token against the ability's slug, label and effect text.
function matchesQuery(entry: AbilityIndexEntry, tokens: string[]): boolean {
  if (tokens.length === 0) return true
  const haystack = `${entry.name} ${entry.label} ${entry.shortEffect ?? ''}`.toLowerCase()
  return tokens.every((token) => haystack.includes(token))
}

function compareBy(key: SortKey, a: AbilityIndexEntry, b: AbilityIndexEntry): number {
  if (key === 'generation') return a.generation - b.generation || a.label.localeCompare(b.label)
  if (key === 'count') return a.pokemonCount - b.pokemonCount || a.label.localeCompare(b.label)
  return a.label.localeCompare(b.label)
}

export default function Abilities() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, error, loading } = useAsync('abilities-index', load.abilityIndex)

  const query = params.get('q') ?? ''
  const generation = params.get('gen') ?? 'all'
  const mainOnly = params.get('main') === '1'
  const shiftOnly = params.get('shift') === '1'
  const view = params.get('view') === 'grid' ? 'grid' : 'table'
  const sortKey = (params.get('sort') as SortKey | null) ?? 'name'
  const descending = params.get('dir') === 'desc'

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const entries = data?.entries
  const tokens = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])

  const filtered = useMemo(() => {
    if (!entries) return []
    const generationFilter = generation === 'all' ? null : Number(generation)
    const rows = entries.filter(
      (entry) =>
        (generationFilter === null || entry.generation === generationFilter) &&
        (!mainOnly || entry.isMainSeries) &&
        (!shiftOnly || hasDefensiveAbilityEffect(entry.name)) &&
        matchesQuery(entry, tokens),
    )
    return rows.sort((a, b) => (descending ? -1 : 1) * compareBy(sortKey, a, b))
  }, [entries, generation, mainOnly, shiftOnly, tokens, sortKey, descending])

  const summary = useMemo(
    () => ({
      shift: filtered.filter((entry) => hasDefensiveAbilityEffect(entry.name)).length,
      unused: filtered.filter((entry) => entry.pokemonCount === 0).length,
      holders: filtered.reduce((total, entry) => total + entry.pokemonCount, 0),
    }),
    [filtered],
  )

  const maxCount = useMemo(
    () => entries?.reduce((max, entry) => Math.max(max, entry.pokemonCount), 1) ?? 1,
    [entries],
  )

  const columns = useMemo<Column<AbilityIndexEntry>[]>(
    () => [
      {
        key: 'name',
        header: 'Ability',
        width: '250px',
        sort: (row) => row.label,
        cell: (row) => (
          <div className="min-w-0">
            <Link
              to={`/abilities/${row.name}`}
              onClick={(event) => event.stopPropagation()}
              className="font-display text-[13px] font-semibold leading-tight transition hover:text-accent"
            >
              {row.label}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {hasDefensiveAbilityEffect(row.name) && <TypeShiftBadge compact />}
              {!row.isMainSeries && <NonMainSeriesTag />}
              <span className="numeric text-[10px] tracking-[0.1em] text-faint">#{row.id}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'generation',
        header: 'Gen',
        align: 'center',
        width: '64px',
        sort: (row) => row.generation,
        cell: (row) => (
          <span className="numeric text-[12px] text-dim">{generationRoman(row.generation)}</span>
        ),
      },
      {
        key: 'effect',
        header: 'Short effect',
        hideBelow: 'md',
        sort: (row) => row.shortEffect ?? '',
        cell: (row) =>
          row.shortEffect ? (
            <p className="line-clamp-2 max-w-[70ch] text-[13px] leading-snug text-dim">{row.shortEffect}</p>
          ) : (
            <span className="text-[13px] text-faint">No recorded effect</span>
          ),
      },
      {
        key: 'count',
        header: 'Pokémon',
        align: 'right',
        width: '132px',
        sort: (row) => row.pokemonCount,
        cell: (row) => (
          <span className="inline-flex items-center justify-end gap-2">
            <span className="hidden h-1 w-12 overflow-hidden rounded-full bg-raised sm:block">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${Math.max(2, (row.pokemonCount / maxCount) * 100)}%` }}
              />
            </span>
            <span className={cx('numeric text-[13px] font-semibold', row.pokemonCount === 0 && 'text-faint')}>
              {row.pokemonCount}
            </span>
          </span>
        ),
      },
    ],
    [maxCount],
  )

  const total = data?.entries.length ?? 0

  return (
    <div style={{ '--accent': PAGE_ACCENT } as React.CSSProperties}>
      <PageHeader
        eyebrow={`Index · ${total} records`}
        title="Abilities"
        subtitle="Every passive effect in the series, with the roster that carries it. Abilities that rewrite incoming type effectiveness are flagged — they decide how a defensive matchup actually resolves."
        actions={
          <Segmented
            value={view}
            onChange={(next) => update({ view: next === 'grid' ? 'grid' : null })}
            options={[
              { value: 'table', label: 'Table' },
              { value: 'grid', label: 'Grid' },
            ]}
          />
        }
      />

      <Panel className="mb-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={query}
              onChange={(value) => update({ q: value || null })}
              placeholder="Search name or effect text — try “immune”, “weather”, “speed”"
              className="min-w-[220px] flex-1"
            />
            {view === 'grid' && (
              <div className="flex shrink-0 items-center gap-1.5">
                <Segmented
                  size="sm"
                  value={sortKey}
                  onChange={(next) => update({ sort: next === 'name' ? null : next })}
                  options={[
                    { value: 'name', label: 'A–Z' },
                    { value: 'generation', label: 'Gen' },
                    { value: 'count', label: 'Users' },
                  ]}
                />
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={descending ? 'Sort ascending' : 'Sort descending'}
                  title={descending ? 'Descending' : 'Ascending'}
                  onClick={() => update({ dir: descending ? null : 'desc' })}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d={descending ? 'M6 2v8M3 7l3 3 3-3' : 'M6 10V2M3 5l3-3 3 3'} strokeLinecap="round" />
                  </svg>
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={generation === 'all'} onClick={() => update({ gen: null })}>
              All gens
            </Chip>
            {GENERATIONS.map((value) => (
              <Chip
                key={value}
                active={generation === String(value)}
                onClick={() => update({ gen: generation === String(value) ? null : String(value) })}
              >
                {generationRoman(value)}
              </Chip>
            ))}
            <span aria-hidden className="mx-1 hidden h-4 w-px bg-line sm:block" />
            <Chip active={mainOnly} onClick={() => update({ main: mainOnly ? null : '1' })}>
              Main series only
            </Chip>
            <Chip
              active={shiftOnly}
              color="var(--type-dragon)"
              onClick={() => update({ shift: shiftOnly ? null : '1' })}
            >
              Alters type matchups
            </Chip>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-4">
            <Stat label="Showing" value={filtered.length} hint={`of ${total}`} accent />
            <Stat label="Type shifters" value={summary.shift} hint="rewrite the defensive chart" />
            <Stat label="Roster slots" value={summary.holders} hint="ability–Pokémon pairs" />
            <Stat label="Unused" value={summary.unused} hint="no Pokémon carries it" />
          </div>
        </div>
      </Panel>

      {loading && <InlineLoader label="Loading abilities" />}
      {error && <ErrorState message={error.message} onRetry={() => window.location.reload()} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No abilities match those filters"
          hint="Try clearing the generation filter or searching a different word from the effect text."
        />
      )}

      {!loading && !error && filtered.length > 0 && view === 'table' && (
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(row) => row.id}
          initialSort={{ key: sortKey, direction: descending ? 'desc' : 'asc' }}
          onRowClick={(row) => navigate(`/abilities/${row.name}`)}
          pageSize={80}
          emptyMessage="No abilities match those filters."
        />
      )}

      {!loading && !error && filtered.length > 0 && view === 'grid' && (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, GRID_LIMIT).map((entry) => (
              <li key={entry.id}>
                <AbilityCard entry={entry} share={entry.pokemonCount / maxCount} />
              </li>
            ))}
          </ul>
          {filtered.length > GRID_LIMIT && (
            <p className="numeric mt-4 text-center text-[11px] uppercase tracking-[0.16em] text-faint">
              Showing first {GRID_LIMIT} of {filtered.length} — refine the search or switch to the table
            </p>
          )}
        </>
      )}
    </div>
  )
}

function AbilityCard({ entry, share }: { entry: AbilityIndexEntry; share: number }) {
  return (
    <Link
      to={`/abilities/${entry.name}`}
      className="group flex h-full flex-col rounded-plate border border-line bg-[var(--ui-plate)] p-4 transition-[border-color,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-semibold leading-tight transition group-hover:text-accent">
            {entry.label}
          </h3>
          <p className="numeric mt-0.5 truncate text-[10px] uppercase tracking-[0.14em] text-faint">
            {entry.name}
          </p>
        </div>
        <GenerationTag generation={entry.generation} />
      </div>

      <p className="mt-2.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-dim">
        {entry.shortEffect ?? 'No recorded effect.'}
      </p>

      <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-2.5">
        <span className="numeric text-[11px] font-semibold">
          {entry.pokemonCount}
          <span className="ml-1 text-[10px] uppercase tracking-[0.14em] text-faint">Pokémon</span>
        </span>
        <span className="ml-auto flex items-center gap-1">
          {hasDefensiveAbilityEffect(entry.name) && <TypeShiftBadge compact />}
          {!entry.isMainSeries && <NonMainSeriesTag />}
        </span>
      </div>
      <span aria-hidden className="mt-2 block h-1 overflow-hidden rounded-full bg-raised">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(2, share * 100)}%` }} />
      </span>
    </Link>
  )
}
