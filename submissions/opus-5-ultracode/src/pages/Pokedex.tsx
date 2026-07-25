import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader, EmptyState } from '@/components/ui/Panel'
import { Button, Segmented, Select } from '@/components/ui/Controls'
import { ErrorState } from '@/components/shell/Loading'
import { FilterRail } from '@/components/pokedex/FilterRail'
import { FilterSheet } from '@/components/pokedex/FilterSheet'
import { VirtualPokemonGrid } from '@/components/pokedex/VirtualPokemonGrid'
import type { SearchableOption } from '@/components/pokedex/SearchableSelect'
import {
  SORTS,
  buildSearchTerms,
  computeBounds,
  countActiveFilters,
  describeFilters,
  defaultFilters,
  filterEntries,
  generationShortLabel,
  parseFilters,
  serializeFilters,
  sortEntries,
  type ActiveFilter,
  type Filters,
  type SortKey,
} from '@/components/pokedex/filterModel'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp, type CardDensity, type SpriteStyle } from '@/lib/store'
import { cx } from '@/lib/cx'

export default function Pokedex() {
  const dex = useDex()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const density = useApp((state) => state.density)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const setSetting = useApp((state) => state.setSetting)
  const favorites = useApp((state) => state.favorites)
  const caught = useApp((state) => state.caught)

  const abilities = useAsync('abilities-index', load.abilityIndex)

  const bounds = useMemo(() => computeBounds(dex.entries), [dex.entries])
  const terms = useMemo(() => buildSearchTerms(dex.entries), [dex.entries])
  const marks = useMemo(
    () => ({ favorites: new Set(favorites), caught: new Set(caught) }),
    [favorites, caught],
  )

  const filters = useMemo(() => parseFilters(searchParams, bounds), [searchParams, bounds])
  const deferred = useDeferredValue(filters)
  const stale = deferred !== filters

  const results = useMemo(
    () =>
      sortEntries(
        filterEntries(dex.entries, deferred, { ...marks, terms }),
        deferred.sort,
        deferred.dir,
      ),
    [dex.entries, deferred, marks, terms],
  )

  const update = useCallback(
    (patch: Partial<Filters>) => {
      setSearchParams(serializeFilters({ ...filters, ...patch }, bounds), { replace: true })
    },
    [filters, bounds, setSearchParams],
  )

  const reset = useCallback(() => {
    setSearchParams(serializeFilters(defaultFilters(bounds), bounds), { replace: true })
  }, [bounds, setSearchParams])

  const abilityOptions = useMemo<SearchableOption[]>(() => {
    if (!abilities.data) return []
    return abilities.data.entries
      .filter((ability) => ability.pokemonCount > 0)
      .map((ability) => ({ id: ability.id, label: ability.label, hint: String(ability.pokemonCount) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [abilities.data])

  const abilityLabel = useMemo(() => {
    const map = new Map(abilityOptions.map((option) => [option.id, option.label]))
    return (id: number) => map.get(id) ?? `Ability #${id}`
  }, [abilityOptions])

  const chips = useMemo<ActiveFilter[]>(
    () =>
      describeFilters(
        filters,
        bounds,
        {
          type: (id) => dex.typeById.get(id)?.label ?? typeSlug(id),
          generation: (id) => generationShortLabel(dex.nameOf('generations', id)),
          pokedex: (id) => dex.nameOf('pokedexes', id),
          eggGroup: (id) => dex.nameOf('eggGroups', id),
          ability: abilityLabel,
          growthRate: (id) => dex.nameOf('growthRates', id),
          habitat: (id) => dex.nameOf('habitats', id),
          shape: (id) => dex.nameOf('shapes', id),
          color: (id) => dex.nameOf('colors', id),
        },
        (id) => `var(--type-${typeSlug(id)})`,
      ),
    [filters, bounds, dex, abilityLabel],
  )

  const activeCount = useMemo(() => countActiveFilters(filters, bounds), [filters, bounds])
  const accentType = filters.types[0]
  const accent = accentType ? `var(--type-${typeSlug(accentType)})` : undefined

  const rail = (
    <FilterRail
      filters={filters}
      bounds={bounds}
      onChange={update}
      onReset={reset}
      activeCount={activeCount}
      resultCount={results.length}
      abilityOptions={abilityOptions}
      abilitiesLoading={abilities.loading}
      abilitiesError={abilities.error ? 'Ability list unavailable offline.' : undefined}
    />
  )

  return (
    <div style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}>
      <PageHeader
        eyebrow="National index"
        title="Pokédex"
        subtitle={`Every one of the ${dex.entries.length.toLocaleString()} indexed Pokémon and alternate forms, filterable across types, stats, breeding data and regional dexes.`}
        actions={
          <div className="flex max-w-[19rem] flex-wrap items-center justify-end gap-2 sm:max-w-none">
            <Segmented<SpriteStyle>
              size="sm"
              value={spriteStyle}
              onChange={(value) => setSetting('spriteStyle', value)}
              options={[
                { value: 'artwork', label: 'Art', title: 'Official artwork' },
                { value: 'home', label: 'Home', title: 'Pokémon HOME renders' },
                { value: 'showdown', label: 'Anim', title: 'Animated Showdown sprites' },
                { value: 'game', label: 'Game', title: 'Game sprites' },
              ]}
            />
            <Segmented<CardDensity>
              size="sm"
              value={density}
              onChange={(value) => setSetting('density', value)}
              options={[
                { value: 'comfortable', label: 'Comfy', title: 'Comfortable card size' },
                { value: 'compact', label: 'Dense', title: 'Compact card size' },
              ]}
            />
          </div>
        }
      />

      <div className="flex items-start gap-6">
        <aside className="sticky top-[4.5rem] hidden h-[calc(100dvh-6.5rem)] w-[264px] shrink-0 lg:block xl:w-[288px]">
          {rail}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-14 z-20 -mx-1 mb-3 flex flex-wrap items-center gap-2 bg-[color-mix(in_oklab,var(--ui-bg)_88%,transparent)] px-1 py-2 backdrop-blur-xl">
            <Button className="lg:hidden" variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 4h12M4 8h8M6.5 12h3" strokeLinecap="round" />
              </svg>
              Filters
              {activeCount > 0 && (
                <span className="numeric ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-[#0b0d12]">
                  {activeCount}
                </span>
              )}
            </Button>

            <p
              aria-live="polite"
              className="numeric flex min-w-0 items-baseline gap-1.5 text-sm font-semibold"
            >
              <span className={cx('tabular-nums transition-opacity', stale && 'opacity-50')}>
                {results.length.toLocaleString()}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                of {dex.entries.length.toLocaleString()} results
              </span>
            </p>

            <div className="ml-auto flex items-center gap-1.5">
              <label htmlFor="pokedex-sort" className="sr-only">
                Sort results by
              </label>
              <Select
                id="pokedex-sort"
                className="w-[8.5rem] sm:w-[9.5rem]"
                value={filters.sort}
                onChange={(event) => update({ sort: event.target.value as SortKey })}
              >
                {SORTS.map((sort) => (
                  <option key={sort.key} value={sort.key}>
                    {sort.label}
                  </option>
                ))}
              </Select>
              <Button
                size="icon"
                variant="outline"
                aria-label={filters.dir === 'asc' ? 'Sorted ascending' : 'Sorted descending'}
                title={filters.dir === 'asc' ? 'Ascending' : 'Descending'}
                onClick={() => update({ dir: filters.dir === 'asc' ? 'desc' : 'asc' })}
              >
                <svg
                  viewBox="0 0 16 16"
                  className={cx('h-4 w-4 transition-transform', filters.dir === 'desc' && 'rotate-180')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <ActiveFilterChip key={chip.id} chip={chip} onClear={() => update(chip.patch)} />
              ))}
              <button
                type="button"
                onClick={reset}
                className="numeric ml-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint underline decoration-line underline-offset-4 transition hover:text-ink"
              >
                Reset all
              </button>
            </div>
          )}

          {abilities.error && filters.ability !== null && (
            <div className="mb-4">
              <ErrorState message={abilities.error.message} />
            </div>
          )}

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full">
                <EmptyState
                  title="No Pokémon match these filters"
                  hint="Loosen a range, switch the type match mode, or include alternate forms."
                />
              </div>
              <Button variant="soft" onClick={reset}>
                Reset all filters
              </Button>
            </div>
          ) : (
            <VirtualPokemonGrid
              entries={results}
              compact={density === 'compact'}
              resetKey={searchParams.toString()}
            />
          )}
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {rail}
      </FilterSheet>
    </div>
  )
}

function ActiveFilterChip({ chip, onClear }: { chip: ActiveFilter; onClear: () => void }) {
  return (
    <span
      style={chip.color ? ({ '--chip': chip.color } as React.CSSProperties) : undefined}
      className={cx(
        'inline-flex h-7 items-center gap-1.5 rounded-chip border border-line bg-surface pl-2 pr-1 text-[11px]',
        chip.color && 'border-[color-mix(in_oklab,var(--chip)_45%,var(--ui-line))]',
      )}
    >
      <span className="numeric text-[9px] font-semibold uppercase tracking-[0.16em] text-faint">
        {chip.label}
      </span>
      <span className={cx('max-w-[12rem] truncate font-medium', chip.color && 'text-[var(--chip)]')}>
        {chip.value}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove filter ${chip.label} ${chip.value}`}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-raised hover:text-ink"
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 3 6 6M9 3l-6 6" />
        </svg>
      </button>
    </span>
  )
}
