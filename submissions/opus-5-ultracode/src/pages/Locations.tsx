import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { load, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { EmptyState, PageHeader, Panel, Stat } from '@/components/ui/Panel'
import { Button, Chip, SearchInput, Segmented } from '@/components/ui/Controls'
import { Tabs } from '@/components/ui/Tabs'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import { LocationCard } from '@/components/locations/LocationCard'
import { ALL_TAB, UNASSIGNED_TAB, generationNumeral, regionAccent } from '@/components/locations/regions'
import type { LocationIndexEntry } from '@/types/data'

const PAGE_SIZE = 120

type SortKey = 'name' | 'pokemon' | 'areas'

const SORT_OPTIONS: { value: SortKey; label: string; title: string }[] = [
  { value: 'name', label: 'A–Z', title: 'Sort alphabetically' },
  { value: 'pokemon', label: 'Species', title: 'Sort by distinct Pokémon found' },
  { value: 'areas', label: 'Areas', title: 'Sort by sub-area count' },
]

export default function Locations() {
  const dex = useDex()
  const [params, setParams] = useSearchParams()
  const state = useAsync('locations-index', load.locationIndex)

  const tab = params.get('region') ?? ALL_TAB
  const query = params.get('q') ?? ''
  const generation = Number(params.get('gen')) || null
  const sort = (params.get('sort') as SortKey | null) ?? 'name'
  const liveOnly = params.get('live') === '1'

  const setParam = (key: string, value: string | null) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const entries = state.data?.entries

  const regionOfTab = useMemo(
    () => dex.meta.regions.find((region) => region.name === tab) ?? null,
    [dex.meta.regions, tab],
  )

  const tabs = useMemo(() => {
    if (!entries) return []
    const byId = new Map(dex.meta.regions.map((region) => [region.id, region]))
    const counts = new Map<string, number>()
    for (const entry of entries) {
      const key = (entry.regionId == null ? null : byId.get(entry.regionId)?.name) ?? UNASSIGNED_TAB
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [
      { id: ALL_TAB, label: 'All regions', count: entries.length },
      ...dex.meta.regions
        .filter((region) => (counts.get(region.name) ?? 0) > 0)
        .map((region) => ({ id: region.name, label: region.label, count: counts.get(region.name) ?? 0 })),
      { id: UNASSIGNED_TAB, label: 'Unaffiliated', count: counts.get(UNASSIGNED_TAB) ?? 0 },
    ]
  }, [entries, dex.meta.regions])

  const filtered = useMemo(() => {
    if (!entries) return []
    const needle = query.trim().toLowerCase()
    const rows = entries.filter((entry) => {
      if (tab === UNASSIGNED_TAB && entry.regionId !== null) return false
      if (tab !== ALL_TAB && tab !== UNASSIGNED_TAB && entry.regionId !== regionOfTab?.id) return false
      if (generation !== null && !entry.generationIds.includes(generation)) return false
      if (liveOnly && entry.pokemonCount === 0) return false
      if (needle && !matchesName(entry, needle)) return false
      return true
    })
    return sortLocations(rows, sort)
  }, [entries, tab, regionOfTab, generation, liveOnly, query, sort])

  const [limit, setLimit] = useState(PAGE_SIZE)
  const filterKey = `${tab}|${generation}|${query}|${sort}|${liveOnly}`
  useEffect(() => setLimit(PAGE_SIZE), [filterKey])

  const totals = useMemo(() => {
    let areas = 0
    let populated = 0
    let richest: LocationIndexEntry | null = null
    for (const entry of filtered) {
      areas += entry.areaCount
      if (entry.pokemonCount > 0) populated += 1
      if (!richest || entry.pokemonCount > richest.pokemonCount) richest = entry
    }
    return { areas, populated, richest, peak: richest?.pokemonCount ?? 0 }
  }, [filtered])

  const filtersActive = Boolean(query) || generation !== null || liveOnly || tab !== ALL_TAB

  return (
    <div style={{ '--accent': regionAccent(regionOfTab?.id ?? null) } as React.CSSProperties}>
      <PageHeader
        eyebrow="Atlas"
        title="Locations"
        subtitle="Every route, cave, lake and city recorded across the main series — and the wild Pokémon each one hides."
        actions={
          <Segmented
            options={SORT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              title: option.title,
            }))}
            value={sort}
            onChange={(value) => setParam('sort', value === 'name' ? null : value)}
          />
        }
      />

      {state.loading && <InlineLoader label="Loading atlas" />}
      {state.error && <ErrorState message={state.error.message} onRetry={() => window.location.reload()} />}

      {entries && (
        <>
          <Panel className="mb-5" padded={false}>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={query}
                  onChange={(value) => setParam('q', value)}
                  placeholder="Search locations…"
                  className="w-full sm:w-72"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  {dex.meta.generations.map((item) => (
                    <Chip
                      key={item.id}
                      active={generation === item.id}
                      title={item.label}
                      onClick={() => setParam('gen', generation === item.id ? null : String(item.id))}
                    >
                      {generationNumeral(item.name)}
                    </Chip>
                  ))}
                  <Chip
                    active={liveOnly}
                    title="Hide locations with no recorded wild encounters"
                    onClick={() => setParam('live', liveOnly ? null : '1')}
                  >
                    Has encounters
                  </Chip>
                </div>
                {filtersActive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="sm:ml-auto"
                    onClick={() => setParams({}, { replace: true })}
                  >
                    Reset
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-line-soft pt-3 sm:grid-cols-4">
                <Stat label="Locations" value={filtered.length.toLocaleString()} accent />
                <Stat label="Sub-areas" value={totals.areas.toLocaleString()} />
                <Stat
                  label="With encounters"
                  value={totals.populated.toLocaleString()}
                  hint={`${(filtered.length - totals.populated).toLocaleString()} empty`}
                />
                <Stat
                  label="Richest"
                  value={totals.richest?.label ?? '—'}
                  hint={totals.richest ? `${totals.richest.pokemonCount} species` : undefined}
                />
              </div>
            </div>
          </Panel>

          <Tabs
            tabs={tabs}
            active={tab}
            onChange={(id) => setParam('region', id === ALL_TAB ? null : id)}
            className="mb-5"
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="No locations match"
              hint="Try another region, generation or search term."
            />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filtered.slice(0, limit).map((entry) => (
                  <li key={entry.id} className="flex">
                    <LocationCard entry={entry} scale={totals.peak} />
                  </li>
                ))}
              </ul>

              {filtered.length > limit && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button onClick={() => setLimit((current) => current + PAGE_SIZE * 2)}>Show more</Button>
                  <span className="numeric text-[11px] text-faint">
                    {limit} of {filtered.length}
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

/// Matches the English label, the slug and every localized name shipped with the entry.
function matchesName(entry: LocationIndexEntry, needle: string): boolean {
  if (entry.label.toLowerCase().includes(needle)) return true
  if (entry.name.includes(needle)) return true
  for (const value of Object.values(entry.names)) {
    if (value.toLowerCase().includes(needle)) return true
  }
  return false
}

function sortLocations(rows: LocationIndexEntry[], sort: SortKey): LocationIndexEntry[] {
  const sorted = [...rows]
  if (sort === 'pokemon') {
    sorted.sort((a, b) => b.pokemonCount - a.pokemonCount || a.label.localeCompare(b.label))
  } else if (sort === 'areas') {
    sorted.sort((a, b) => b.areaCount - a.areaCount || a.label.localeCompare(b.label))
  } else {
    sorted.sort((a, b) => a.label.localeCompare(b.label))
  }
  return sorted
}
