import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, Stat } from '@/components/ui/Panel'
import { Button, Chip, RangeSlider, SearchInput, Segmented, Select } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Tabs } from '@/components/ui/Tabs'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import { ItemArt } from '@/components/items/ItemArt'
import { formatCost, latestMachineMoveByItem, pocketAccent } from '@/components/items/itemsMeta'
import { load, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { cx } from '@/lib/cx'
import type { ItemIndexEntry } from '@/types/data'
import type { CSSProperties } from 'react'

const NO_ITEMS: ItemIndexEntry[] = []
const GRID_PAGE = 96
const TABLE_PAGE = 60
/** `holdable`, `holdable-passive` and `holdable-active` all mean the item can be given to a Pokémon. */
const HOLDABLE_ATTRIBUTES = [5, 6, 7]

type SortKey = 'index' | 'name' | 'cost-desc' | 'cost-asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'index', label: 'Item number' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'cost-desc', label: 'Cost, high → low' },
  { value: 'cost-asc', label: 'Cost, low → high' },
]

/// Orders a result set without mutating it; the natural item order is already ascending by id.
function sortItems(rows: ItemIndexEntry[], key: SortKey): ItemIndexEntry[] {
  if (key === 'index') return rows
  const copy = [...rows]
  if (key === 'name') copy.sort((a, b) => a.label.localeCompare(b.label))
  else if (key === 'cost-desc') copy.sort((a, b) => b.cost - a.cost || a.id - b.id)
  else copy.sort((a, b) => a.cost - b.cost || a.id - b.id)
  return copy
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

export default function Items() {
  const dex = useDex()
  const { meta } = dex
  const [params, setParams] = useSearchParams()
  const index = useAsync('items-index', load.itemIndex)

  const pocketParam = params.get('pocket') ?? 'all'
  const categoryParam = params.get('cat') ?? 'all'
  const query = params.get('q') ?? ''
  const view = params.get('view') === 'table' ? 'table' : 'grid'
  const sort = (params.get('sort') as SortKey | null) ?? 'index'

  const [attributes, setAttributes] = useState<number[]>([])
  const [costBounds, setCostBounds] = useState<[number, number] | null>(null)
  const [limit, setLimit] = useState(GRID_PAGE)

  const patch = useCallback(
    (updates: Record<string, string | null>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(updates)) {
            if (value === null) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const entries = index.data?.entries ?? NO_ITEMS

  const costSteps = useMemo(() => {
    const unique = new Set<number>()
    for (const entry of entries) unique.add(entry.cost)
    return [...unique].sort((a, b) => a - b)
  }, [entries])

  const costLimits = useMemo<[number, number]>(() => {
    if (!costSteps.length) return [0, Number.POSITIVE_INFINITY]
    const top = costSteps.length - 1
    const bounds = costBounds ?? [0, top]
    return [costSteps[Math.min(bounds[0], top)], costSteps[Math.min(bounds[1], top)]]
  }, [costSteps, costBounds])

  const normalized = query.trim().toLowerCase()

  const preFiltered = useMemo(() => {
    const [minCost, maxCost] = costLimits
    return entries.filter((entry) => {
      if (entry.cost < minCost || entry.cost > maxCost) return false
      for (const attribute of attributes) {
        if (!entry.attributes.includes(attribute)) return false
      }
      if (!normalized) return true
      if (entry.label.toLowerCase().includes(normalized)) return true
      if (entry.name.includes(normalized)) return true
      if (entry.shortEffect && entry.shortEffect.toLowerCase().includes(normalized)) return true
      for (const value of Object.values(entry.names)) {
        if (value.toLowerCase().includes(normalized)) return true
      }
      return false
    })
  }, [entries, attributes, costLimits, normalized])

  const pocketId = pocketParam === 'all' ? null : Number(pocketParam)
  const categoryId = categoryParam === 'all' ? null : Number(categoryParam)

  const pocketCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const entry of preFiltered) counts.set(entry.pocketId, (counts.get(entry.pocketId) ?? 0) + 1)
    return counts
  }, [preFiltered])

  const categories = useMemo(() => {
    const present = new Set<number>()
    for (const entry of preFiltered) {
      if (pocketId == null || entry.pocketId === pocketId) present.add(entry.categoryId)
    }
    return meta.itemCategories
      .filter((category) => present.has(category.id))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [preFiltered, pocketId, meta])

  const filtered = useMemo(() => {
    let rows = preFiltered
    if (pocketId != null) rows = rows.filter((entry) => entry.pocketId === pocketId)
    if (categoryId != null) rows = rows.filter((entry) => entry.categoryId === categoryId)
    return sortItems(rows, sort)
  }, [preFiltered, pocketId, categoryId, sort])

  const availableAttributes = useMemo(() => {
    const present = new Set<number>()
    for (const entry of entries) for (const attribute of entry.attributes) present.add(attribute)
    return meta.itemAttributes.filter((attribute) => present.has(attribute.id))
  }, [entries, meta])

  const signature = `${pocketParam}|${categoryParam}|${normalized}|${sort}|${attributes.join(',')}|${costBounds?.join(',') ?? ''}`
  useEffect(() => {
    setLimit(GRID_PAGE)
  }, [signature])

  const machineMoveByItem = useMemo(
    () => latestMachineMoveByItem(meta.machines, meta.versionGroups),
    [meta],
  )
  const resultsHaveMachines = useMemo(
    () => filtered.some((entry) => machineMoveByItem.has(entry.id)),
    [filtered, machineMoveByItem],
  )
  const moveIndex = useAsync(resultsHaveMachines ? 'moves-index' : null, load.moveIndex)
  const moveTypeById = useMemo(() => {
    const map = new Map<number, number>()
    for (const move of moveIndex.data?.entries ?? []) map.set(move.id, move.typeId)
    return map
  }, [moveIndex.data])

  const machineTypeFor = useCallback(
    (itemId: number) => {
      const moveId = machineMoveByItem.get(itemId)
      if (moveId == null) return null
      return moveTypeById.get(moveId) ?? null
    },
    [machineMoveByItem, moveTypeById],
  )

  const columns = useMemo<Column<ItemIndexEntry>[]>(
    () => [
      {
        key: 'art',
        header: '',
        width: '48px',
        cell: (row) => (
          <ItemArt
            slug={row.sprite ?? row.name}
            label={row.label}
            machineTypeId={machineTypeFor(row.id)}
            className="h-7 w-7"
          />
        ),
      },
      {
        key: 'name',
        header: 'Item',
        sort: (row) => row.label,
        cell: (row) => (
          <Link to={`/items/${row.name}`} className="font-medium hover:text-accent">
            {row.label}
          </Link>
        ),
      },
      {
        key: 'pocket',
        header: 'Pocket',
        hideBelow: 'md',
        sort: (row) => row.pocketId,
        cell: (row) => <span className="text-dim">{dex.nameOf('itemPockets', row.pocketId)}</span>,
      },
      {
        key: 'category',
        header: 'Category',
        hideBelow: 'sm',
        sort: (row) => dex.nameOf('itemCategories', row.categoryId),
        cell: (row) => <span className="text-dim">{dex.nameOf('itemCategories', row.categoryId)}</span>,
      },
      {
        key: 'cost',
        header: 'Cost',
        align: 'right',
        sort: (row) => row.cost,
        cell: (row) => (
          <span className={cx('numeric', row.cost ? 'text-ink' : 'text-faint')}>{formatCost(row.cost)}</span>
        ),
      },
      {
        key: 'fling',
        header: 'Fling',
        align: 'right',
        hideBelow: 'lg',
        sort: (row) => row.flingPower ?? -1,
        cell: (row) => (
          <span className={cx('numeric', row.flingPower ? 'text-ink' : 'text-faint')}>
            {row.flingPower ?? '—'}
          </span>
        ),
      },
      {
        key: 'effect',
        header: 'Effect',
        hideBelow: 'lg',
        className: 'max-w-[420px]',
        cell: (row) => (
          <span className="line-clamp-2 text-[13px] leading-snug text-dim">{row.shortEffect ?? '—'}</span>
        ),
      },
    ],
    [dex, machineTypeFor],
  )

  const dirty =
    pocketParam !== 'all' ||
    categoryParam !== 'all' ||
    query !== '' ||
    sort !== 'index' ||
    attributes.length > 0 ||
    costBounds !== null

  const reset = () => {
    setAttributes([])
    setCostBounds(null)
    patch({ pocket: null, cat: null, q: null, sort: null })
  }

  const visible = filtered.slice(0, limit)

  return (
    <div style={{ '--accent': pocketAccent(pocketId) } as CSSProperties}>
      <PageHeader
        eyebrow={`${(meta.counts.items ?? entries.length).toLocaleString('en-US')} entries`}
        title="Items"
        subtitle="Every held item, medicine, ball, machine and key item in the series, with the pocket, category and shop economics behind each one."
        actions={
          <Segmented
            value={view}
            onChange={(next) => patch({ view: next === 'table' ? 'table' : null })}
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'table', label: 'Table' },
            ]}
          />
        }
      />

      {index.loading && <InlineLoader label="Loading items" />}
      {index.error && <ErrorState message={index.error.message} onRetry={() => window.location.reload()} />}

      {index.data && (
        <div className="flex flex-col gap-5">
          <Tabs
            active={pocketParam}
            onChange={(next) => patch({ pocket: next === 'all' ? null : next, cat: null })}
            tabs={[
              { id: 'all', label: 'All', count: preFiltered.length },
              ...meta.itemPockets.map((pocket) => ({
                id: String(pocket.id),
                label: pocket.label,
                count: pocketCounts.get(pocket.id) ?? 0,
              })),
            ]}
          />

          <Panel className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <SearchInput
                value={query}
                onChange={(next) => patch({ q: next || null })}
                placeholder="Search by name, effect or localized name"
              />
              <Select
                aria-label="Category"
                value={categoryParam}
                onChange={(event) => patch({ cat: event.target.value === 'all' ? null : event.target.value })}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Sort items"
                value={sort}
                onChange={(event) => patch({ sort: event.target.value === 'index' ? null : event.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <p className="numeric mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Attributes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableAttributes.map((attribute) => (
                    <Chip
                      key={attribute.id}
                      active={attributes.includes(attribute.id)}
                      onClick={() =>
                        setAttributes((current) =>
                          current.includes(attribute.id)
                            ? current.filter((id) => id !== attribute.id)
                            : [...current, attribute.id],
                        )
                      }
                    >
                      {attribute.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {costSteps.length > 1 && (
                <RangeSlider
                  label="Cost"
                  min={0}
                  max={costSteps.length - 1}
                  value={costBounds ?? [0, costSteps.length - 1]}
                  onChange={setCostBounds}
                  format={(step) => formatCost(costSteps[Math.min(step, costSteps.length - 1)] ?? 0)}
                />
              )}
            </div>

            {dirty && (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                <p className="numeric text-[11px] text-faint">
                  {filtered.length.toLocaleString('en-US')} of {entries.length.toLocaleString('en-US')} items
                </p>
                <Button size="sm" variant="ghost" onClick={reset}>
                  Reset filters
                </Button>
              </div>
            )}
          </Panel>

          <Panel className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
            <Stat label="Results" value={filtered.length.toLocaleString('en-US')} accent />
            <Stat
              label="Holdable"
              value={filtered
                .filter((entry) => entry.attributes.some((id) => HOLDABLE_ATTRIBUTES.includes(id)))
                .length.toLocaleString('en-US')}
              hint="can be given to a Pokémon"
            />
            <Stat label="Median cost" value={formatCost(median(filtered.map((entry) => entry.cost)))} />
            <Stat
              label="Priciest"
              value={formatCost(filtered.reduce((top, entry) => Math.max(top, entry.cost), 0))}
            />
          </Panel>

          {filtered.length === 0 ? (
            <EmptyState
              title="No items match these filters"
              hint="Loosen the cost range or clear the attribute filters to widen the search."
            />
          ) : view === 'table' ? (
            <DataTable rows={filtered} columns={columns} rowKey={(row) => row.id} pageSize={TABLE_PAGE} dense />
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {visible.map((entry, position) => (
                  <ItemTile
                    key={entry.id}
                    entry={entry}
                    machineTypeId={machineTypeFor(entry.id)}
                    categoryLabel={dex.nameOf('itemCategories', entry.categoryId)}
                    eager={position < 24}
                  />
                ))}
              </div>
              {filtered.length > visible.length && (
                <div className="mt-5 flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => setLimit((current) => current + GRID_PAGE * 2)}>
                    Show more
                  </Button>
                  <span className="numeric text-[11px] text-faint">
                    {visible.length} of {filtered.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ItemTile = memo(function ItemTile({
  entry,
  machineTypeId,
  categoryLabel,
  eager,
}: {
  entry: ItemIndexEntry
  machineTypeId: number | null
  categoryLabel: string
  eager: boolean
}) {
  return (
    <Link
      to={`/items/${entry.name}`}
      title={entry.shortEffect ?? entry.label}
      style={{ '--accent': pocketAccent(entry.pocketId) } as CSSProperties}
      className={cx(
        'group flex flex-col items-center gap-1.5 rounded-plate border border-line bg-[var(--ui-plate)] p-3 text-center transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-expo)]',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:shadow-[0_10px_30px_-16px_color-mix(in_oklab,var(--accent)_80%,transparent)]',
      )}
    >
      <span className="grid h-12 w-12 place-items-center">
        <ItemArt
          slug={entry.sprite ?? entry.name}
          label={entry.label}
          machineTypeId={machineTypeId}
          eager={eager}
          className="h-9 w-9 transition-transform duration-300 group-hover:scale-110"
        />
      </span>
      <span className="line-clamp-2 min-h-[28px] text-[11px] font-medium leading-tight text-ink">
        {entry.label}
      </span>
      <span className="numeric truncate text-[9px] uppercase tracking-[0.14em] text-faint">
        {categoryLabel}
      </span>
      <span className={cx('numeric text-[11px] font-semibold', entry.cost ? 'text-dim' : 'text-faint')}>
        {formatCost(entry.cost)}
      </span>
    </Link>
  )
})
