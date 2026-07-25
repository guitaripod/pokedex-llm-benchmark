import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Chip, SearchInput, Segmented, Select } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { StatSparkline } from '@/components/pokemon/StatBars'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import { CaughtToggle, CompletionRing, ProgressBar } from '@/components/pokedexes/DexBits'
import { DexEntryCard } from '@/components/pokedexes/DexEntryCard'
import { TypeDistribution, type TypeCount } from '@/components/collection/CollectionCharts'
import { useIncremental } from '@/components/pokedexes/useIncremental'
import {
  accentForType,
  dominantTypeId,
  formatPercent,
  percent,
  type PokedexEntryRecord,
  type PokedexFile,
} from '@/components/pokedexes/dexData'
import { load, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import type { PokemonIndexEntry } from '@/types/data'

type Status = 'all' | 'caught' | 'missing'
type SortKey = 'number' | 'national' | 'name' | 'bst'
type View = 'grid' | 'list'

interface DexRow {
  record: PokedexEntryRecord
  index: PokemonIndexEntry | undefined
}

const SORTS: Record<SortKey, (a: DexRow, b: DexRow) => number> = {
  number: (a, b) => a.record.entryNumber - b.record.entryNumber,
  national: (a, b) => a.record.speciesId - b.record.speciesId,
  name: (a, b) => a.record.label.localeCompare(b.record.label),
  bst: (a, b) => (b.index?.bst ?? 0) - (a.index?.bst ?? 0),
}

export default function PokedexDetail() {
  const { id } = useParams<{ id: string }>()
  const dex = useDex()
  const navigate = useNavigate()
  const caught = useApp((state) => state.caught)

  const info = useMemo(
    () => dex.meta.pokedexes.find((entry) => String(entry.id) === id || entry.name === id),
    [dex.meta.pokedexes, id],
  )

  const state = useAsync<PokedexFile>(info ? `pokedex/${info.id}` : null, () =>
    load.pokedex<PokedexFile>(info!.id),
  )

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('all')
  const [sortKey, setSortKey] = useState<SortKey>('number')
  const [view, setView] = useState<View>('grid')
  const [typeFilter, setTypeFilter] = useState<number[]>([])

  const caughtSet = useMemo(() => new Set(caught), [caught])

  const rows = useMemo<DexRow[]>(
    () =>
      (state.data?.entries ?? []).map((record) => ({
        record,
        index: dex.defaultBySpecies.get(record.speciesId) ?? dex.byId.get(record.pokemonId),
      })),
    [state.data, dex],
  )

  const caughtCount = useMemo(
    () => rows.reduce((total, row) => total + (caughtSet.has(row.record.pokemonId) ? 1 : 0), 0),
    [rows, caughtSet],
  )

  const typeCounts = useMemo<TypeCount[]>(() => {
    const tally = new Map<number, number>()
    for (const row of rows) {
      for (const typeId of row.record.types) tally.set(typeId, (tally.get(typeId) ?? 0) + 1)
    }
    return [...tally.entries()]
      .map(([typeId, count]) => ({
        typeId,
        label: dex.typeById.get(typeId)?.label ?? '—',
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [rows, dex])

  const accent = useMemo(
    () => accentForType(dominantTypeId(rows.map((row) => row.record.types))),
    [rows],
  )

  const summary = useMemo(() => {
    let bstTotal = 0
    let bstCount = 0
    let legendary = 0
    const generations = new Set<number>()
    for (const row of rows) {
      if (!row.index) continue
      bstTotal += row.index.bst
      bstCount += 1
      generations.add(row.index.generation)
      if (row.index.isLegendary || row.index.isMythical) legendary += 1
    }
    return {
      averageBst: bstCount > 0 ? Math.round(bstTotal / bstCount) : 0,
      legendary,
      generations: generations.size,
    }
  }, [rows])

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = rows.filter((row) => {
      if (status === 'caught' && !caughtSet.has(row.record.pokemonId)) return false
      if (status === 'missing' && caughtSet.has(row.record.pokemonId)) return false
      if (typeFilter.length > 0 && !typeFilter.every((typeId) => row.record.types.includes(typeId))) {
        return false
      }
      if (!needle) return true
      return (
        row.record.label.toLowerCase().includes(needle) ||
        row.record.name.includes(needle) ||
        String(row.record.entryNumber) === needle ||
        String(row.record.speciesId) === needle
      )
    })
    return filtered.sort(SORTS[sortKey])
  }, [rows, query, status, typeFilter, sortKey, caughtSet])

  const resetKey = `${info?.id ?? 0}|${query}|${status}|${sortKey}|${typeFilter.join(',')}`
  const pager = useIncremental(visibleRows.length, resetKey, 120)

  if (!info) {
    return (
      <div>
        <PageHeader eyebrow="Pokédex" title="Unknown pokédex" />
        <EmptyState
          title={`No pokédex with the id “${id ?? ''}”`}
          hint="Pick one from the regional index instead."
        />
        <div className="mt-4 flex justify-center">
          <Link
            to="/pokedexes"
            className="inline-flex h-9 items-center rounded-chip border border-line px-4 text-sm transition hover:bg-raised"
          >
            All pokédexes
          </Link>
        </div>
      </div>
    )
  }

  const region =
    info.regionId === null ? null : dex.meta.regions.find((item) => item.id === info.regionId)
  const games = info.versionGroupIds.map((groupId) => dex.nameOf('versionGroups', groupId))
  const ratio = percent(caughtCount, info.entryCount)

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow={`${region ? region.label : info.isMainSeries ? 'All regions' : 'Side series'} · Pokédex`}
        title={info.label}
        subtitle={
          info.description ??
          `${region ? `${region.label} ` : ''}regional Pokédex with ${info.entryCount} entries.`
        }
        actions={
          <Link
            to="/pokedexes"
            className="inline-flex h-9 items-center rounded-chip border border-line px-4 text-sm text-dim transition hover:bg-raised hover:text-ink"
          >
            All dexes
          </Link>
        }
      >
        {games.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {games.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="rounded-chip border border-line-soft px-2 py-0.5 font-display text-[11px] font-medium text-dim"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </PageHeader>

      {state.loading && <InlineLoader label={`Loading ${info.label} dex`} />}
      {state.error && <ErrorState message={state.error.message} onRetry={() => navigate(0)} />}

      {state.data && (
        <>
          <Panel className="mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <CompletionRing ratio={ratio} label="caught" />
              <div className="min-w-[200px] flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                    Dex completion
                  </span>
                  <span className="numeric text-[11px] text-dim">
                    {caughtCount} of {info.entryCount} · {formatPercent(ratio)}
                  </span>
                </div>
                <ProgressBar value={ratio} height="h-2" className="mt-2" />
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Entries" value={info.entryCount} />
                  <Stat label="Avg BST" value={summary.averageBst} />
                  <Stat label="Legendary" value={summary.legendary} />
                  <Stat label="Generations" value={summary.generations} />
                </div>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_268px]">
            <div className="min-w-0">
              <Panel className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="Search this dex…"
                    className="min-w-[180px] flex-1"
                  />
                  <Segmented
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'caught', label: 'Caught' },
                      { value: 'missing', label: 'Missing' },
                    ]}
                  />
                  <Select
                    aria-label="Sort entries"
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value as SortKey)}
                  >
                    <option value="number">Dex order</option>
                    <option value="national">National no.</option>
                    <option value="name">Name</option>
                    <option value="bst">Base stat total</option>
                  </Select>
                  <Segmented
                    value={view}
                    onChange={setView}
                    options={[
                      { value: 'grid', label: 'Grid' },
                      { value: 'list', label: 'List' },
                    ]}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line-soft pt-3">
                  {typeCounts.map((item) => (
                    <Chip
                      key={item.typeId}
                      active={typeFilter.includes(item.typeId)}
                      color={accentForType(item.typeId)}
                      title={`${item.count} entries`}
                      onClick={() =>
                        setTypeFilter((current) =>
                          current.includes(item.typeId)
                            ? current.filter((value) => value !== item.typeId)
                            : [...current, item.typeId],
                        )
                      }
                    >
                      {item.label}
                      <span className="numeric opacity-70">{item.count}</span>
                    </Chip>
                  ))}
                  {typeFilter.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTypeFilter([])}
                      className="numeric ml-1 text-[11px] uppercase tracking-[0.14em] text-faint transition hover:text-ink"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </Panel>

              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  {visibleRows.length} of {rows.length} entries
                </p>
                {typeFilter.length > 1 && (
                  <p className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
                    Matching every selected type
                  </p>
                )}
              </div>

              {visibleRows.length === 0 ? (
                <EmptyState
                  title="Nothing matches those filters"
                  hint="Clear the search or type filters to see the rest of this dex."
                />
              ) : view === 'grid' ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {visibleRows.slice(0, pager.count).map((row, position) => (
                      <DexEntryCard
                        key={`${row.record.entryNumber}-${row.record.pokemonId}`}
                        record={row.record}
                        bst={row.index?.bst}
                        eager={position < 12}
                      />
                    ))}
                  </div>
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
                      <span className="numeric text-[11px] text-faint">
                        {pager.remaining} more entries
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <DexTable rows={visibleRows} />
              )}
            </div>

            <aside className="min-w-0 space-y-4 xl:sticky xl:top-[72px] xl:self-start">
              <Panel>
                <SectionTitle eyebrow="Composition">Type spread</SectionTitle>
                <TypeDistribution counts={typeCounts} total={rows.length} linkTypes />
              </Panel>
              <Panel>
                <SectionTitle eyebrow="Progress">Remaining</SectionTitle>
                <p className="numeric text-3xl font-bold leading-none">
                  {info.entryCount - caughtCount}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-dim">
                  entries still to catch in {info.label}. Toggle the ball on any card to record one.
                </p>
              </Panel>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

function DexTable({ rows }: { rows: DexRow[] }) {
  const dex = useDex()
  const navigate = useNavigate()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)

  const columns = useMemo<Column<DexRow>[]>(
    () => [
      {
        key: 'number',
        header: 'No.',
        width: '64px',
        sort: (row) => row.record.entryNumber,
        cell: (row) => (
          <span className="numeric text-[12px] font-bold text-accent">
            {String(row.record.entryNumber).padStart(3, '0')}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Pokémon',
        sort: (row) => row.record.label,
        cell: (row) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <Sprite
              sources={spriteSources(row.record.pokemonId, spriteStyle, shiny)}
              alt=""
              className="h-8 w-8 shrink-0"
              pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
            />
            <span className="truncate font-display text-[13px] font-medium">{row.record.label}</span>
          </div>
        ),
      },
      {
        key: 'national',
        header: 'National',
        align: 'right',
        width: '90px',
        hideBelow: 'sm',
        sort: (row) => row.record.speciesId,
        cell: (row) => <span className="numeric text-[11px] text-dim">{formatDex(row.record.speciesId)}</span>,
      },
      {
        key: 'types',
        header: 'Types',
        width: '150px',
        hideBelow: 'sm',
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.record.types.map((typeId) => (
              <TypeBadge
                key={typeId}
                typeId={typeId}
                label={dex.typeById.get(typeId)?.label ?? ''}
                size="xs"
                link={false}
              />
            ))}
          </div>
        ),
      },
      {
        key: 'bst',
        header: 'BST',
        align: 'right',
        width: '110px',
        hideBelow: 'md',
        sort: (row) => row.index?.bst ?? 0,
        cell: (row) =>
          row.index ? (
            <div className="flex items-center justify-end gap-2">
              <StatSparkline stats={row.index.stats} />
              <span className="numeric text-[11px] font-semibold">{row.index.bst}</span>
            </div>
          ) : (
            <span className="text-faint">—</span>
          ),
      },
      {
        key: 'caught',
        header: 'Caught',
        align: 'center',
        width: '70px',
        cell: (row) => (
          <div className="flex justify-center">
            <CaughtToggle pokemonId={row.record.pokemonId} label={row.record.label} size="sm" />
          </div>
        ),
      },
    ],
    [dex, shiny, spriteStyle],
  )

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => `${row.record.entryNumber}-${row.record.pokemonId}`}
      pageSize={80}
      onRowClick={(row) => navigate(`/pokemon/${row.record.name}`)}
      emptyMessage="No entries match those filters."
    />
  )
}
