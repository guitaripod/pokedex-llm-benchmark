import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { load, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { cx } from '@/lib/cx'
import { Panel, PageHeader, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { Button, Chip, RangeSlider, SearchInput, Segmented, Select, Toggle } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { MoveCard } from '@/components/moves/MoveCard'
import {
  DamageClassGlyph,
  DamageClassTag,
  Dash,
  MicroLabel,
  PriorityTag,
  generationRoman,
  meaningfulNumber,
  typeAccent,
} from '@/components/moves/MoveBits'
import {
  ACCURACY_BOUNDS,
  DEFAULT_FILTERS,
  POWER_BOUNDS,
  PP_BOUNDS,
  PRIORITY_BOUNDS,
  activeFilterCount,
  filterMoves,
  fromSearchParams,
  toSearchParams,
  toggleIn,
  type MoveFilters,
  type MoveView,
} from '@/components/moves/filters'
import type { MoveIndexEntry } from '@/types/data'

const GRID_PAGE = 60
const BASE_ACCENT = 'var(--stat-attack)'

export default function Moves() {
  const dex = useDex()
  const [params, setParams] = useSearchParams()
  const [initial] = useState(() => fromSearchParams(params))
  const [filters, setFilters] = useState<MoveFilters>(initial.filters)
  const [view, setView] = useState<MoveView>(initial.view)
  const [attempt, setAttempt] = useState(0)
  const [railOpen, setRailOpen] = useState(false)
  const [gridLimit, setGridLimit] = useState(GRID_PAGE)

  const index = useAsync(`moves-index:${attempt}`, () => load.moveIndex())

  const serialized = useMemo(() => toSearchParams(filters, view).toString(), [filters, view])
  const setParamsRef = useRef(setParams)
  setParamsRef.current = setParams
  useEffect(() => {
    setParamsRef.current(serialized, { replace: true })
    setGridLimit(GRID_PAGE)
  }, [serialized])

  const machineMoveIds = useMemo(
    () => new Set(dex.meta.machines.map((machine) => machine.moveId)),
    [dex.meta.machines],
  )

  const entries = index.data?.entries
  const present = useMemo(() => collectPresentValues(entries), [entries])
  const rows = useMemo(
    () => (entries ? filterMoves(entries, filters, machineMoveIds) : []),
    [entries, filters, machineMoveIds],
  )

  const columns = useMemo<Column<MoveIndexEntry>[]>(
    () => [
      {
        key: 'id',
        header: '#',
        width: '58px',
        align: 'right',
        hideBelow: 'sm',
        sort: (row) => row.id,
        cell: (row) => (
          <span className="numeric text-[11px] text-faint">{String(row.id).padStart(3, '0')}</span>
        ),
      },
      {
        key: 'name',
        header: 'Move',
        sort: (row) => row.label,
        cell: (row) => (
          <Link
            to={`/moves/${row.name}`}
            className="font-display text-[13px] font-semibold leading-tight transition hover:text-accent"
          >
            {row.label}
          </Link>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        width: '96px',
        sort: (row) => dex.typeById.get(row.typeId)?.label ?? '',
        cell: (row) => (
          <TypeBadge
            typeId={row.typeId}
            label={dex.typeById.get(row.typeId)?.label ?? '—'}
            size="xs"
            link={false}
          />
        ),
      },
      {
        key: 'class',
        header: 'Class',
        width: '112px',
        hideBelow: 'md',
        sort: (row) => row.damageClassId,
        cell: (row) => (
          <DamageClassTag
            classId={row.damageClassId}
            label={dex.nameOf('damageClasses', row.damageClassId)}
            compact
          />
        ),
      },
      {
        key: 'power',
        header: 'Pow',
        width: '64px',
        align: 'right',
        sort: (row) => row.power ?? -1,
        cell: (row) => <NumericCell value={meaningfulNumber(row.power)} />,
      },
      {
        key: 'accuracy',
        header: 'Acc',
        width: '64px',
        align: 'right',
        sort: (row) => row.accuracy ?? -1,
        cell: (row) => <NumericCell value={meaningfulNumber(row.accuracy)} />,
      },
      {
        key: 'pp',
        header: 'PP',
        width: '56px',
        align: 'right',
        sort: (row) => row.pp ?? -1,
        cell: (row) => <NumericCell value={row.pp} />,
      },
      {
        key: 'priority',
        header: 'Pri',
        width: '58px',
        align: 'right',
        hideBelow: 'md',
        sort: (row) => row.priority,
        cell: (row) => <PriorityTag priority={row.priority} />,
      },
      {
        key: 'generation',
        header: 'Gen',
        width: '58px',
        align: 'center',
        hideBelow: 'lg',
        sort: (row) => row.generation,
        cell: (row) => (
          <span className="numeric text-[11px] text-dim">{generationRoman(row.generation)}</span>
        ),
      },
      {
        key: 'effect',
        header: 'Effect',
        width: '240px',
        hideBelow: 'lg',
        className: 'max-w-[240px]',
        cell: (row) => (
          <span className="block truncate text-[12px] text-dim" title={row.shortEffect ?? undefined}>
            {row.shortEffect ?? '—'}
          </span>
        ),
      },
      {
        key: 'learners',
        header: 'Learners',
        width: '88px',
        align: 'right',
        hideBelow: 'md',
        sort: (row) => row.learnedByCount,
        cell: (row) => <span className="numeric text-[12px] text-dim">{row.learnedByCount}</span>,
      },
    ],
    [dex],
  )

  const accent = filters.types.length === 1 ? typeAccent(filters.types[0]) : BASE_ACCENT
  const active = activeFilterCount(filters)
  const total = entries?.length ?? 0

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow="Movedex"
        title="Moves"
        subtitle="Every move in the series, with its battle maths, learn data and machine coverage attached."
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'table' as MoveView, label: 'Table', title: 'Dense sortable table' },
                { value: 'grid' as MoveView, label: 'Grid', title: 'Type-tinted cards' },
              ]}
            />
            <Button
              className="lg:hidden"
              variant={active > 0 ? 'solid' : 'outline'}
              onClick={() => setRailOpen((open) => !open)}
              aria-expanded={railOpen}
            >
              Filters{active > 0 ? ` · ${active}` : ''}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside
          className={cx(
            'min-w-0 lg:sticky lg:top-4 lg:block lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:pr-1',
            railOpen ? 'block' : 'hidden',
          )}
        >
          <Panel className="space-y-5">
            <div>
              <SectionTitle
                eyebrow="Query"
                actions={
                  active > 0 ? (
                    <Button size="sm" variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
                      Reset
                    </Button>
                  ) : undefined
                }
              >
                Filters
              </SectionTitle>
              <SearchInput
                value={filters.query}
                onChange={(query) => setFilters((current) => ({ ...current, query }))}
                placeholder="Name, effect, かえんほうしゃ…"
              />
            </div>

            <FilterGroup label="Type">
              <div className="flex flex-wrap gap-1">
                {present.types.map((typeId) => (
                  <Chip
                    key={typeId}
                    color={typeAccent(typeId)}
                    active={filters.types.includes(typeId)}
                    onClick={() =>
                      setFilters((current) => ({ ...current, types: toggleIn(current.types, typeId) }))
                    }
                  >
                    {dex.typeById.get(typeId)?.label ?? typeId}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Damage class">
              <div className="flex flex-wrap gap-1">
                {dex.meta.damageClasses.map((damageClass) => (
                  <Chip
                    key={damageClass.id}
                    active={filters.damageClasses.includes(damageClass.id)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        damageClasses: toggleIn(current.damageClasses, damageClass.id),
                      }))
                    }
                  >
                    <DamageClassGlyph classId={damageClass.id} size={11} />
                    {damageClass.label}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Generation">
              <div className="flex flex-wrap gap-1">
                {dex.meta.generations.map((generation) => (
                  <Chip
                    key={generation.id}
                    title={generation.label}
                    active={filters.generations.includes(generation.id)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        generations: toggleIn(current.generations, generation.id),
                      }))
                    }
                  >
                    {generationRoman(generation.id)}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Classification">
              <div className="space-y-2">
                <LabelledSelect
                  label="Target"
                  value={filters.target}
                  onChange={(target) => setFilters((current) => ({ ...current, target }))}
                  options={dex.meta.moveTargets
                    .filter((option) => present.targets.has(option.id))
                    .map((option) => ({ value: option.id, label: option.label }))}
                />
                <LabelledSelect
                  label="Category"
                  value={filters.category}
                  onChange={(category) => setFilters((current) => ({ ...current, category }))}
                  options={dex.meta.moveCategories
                    .filter((option) => present.categories.has(option.id))
                    .map((option) => ({ value: option.id, label: option.label }))}
                />
                <LabelledSelect
                  label="Ailment"
                  value={filters.ailment}
                  onChange={(ailment) => setFilters((current) => ({ ...current, ailment }))}
                  options={dex.meta.moveAilments
                    .filter((option) => present.ailments.has(option.id))
                    .map((option) => ({ value: option.id, label: option.label }))}
                />
              </div>
            </FilterGroup>

            <FilterGroup label="Numbers" hint="Narrowing a range hides moves the games print as “—”.">
              <div className="space-y-3">
                <RangeSlider
                  label="Power"
                  min={POWER_BOUNDS[0]}
                  max={POWER_BOUNDS[1]}
                  step={5}
                  value={filters.power}
                  onChange={(power) => setFilters((current) => ({ ...current, power }))}
                />
                <RangeSlider
                  label="Accuracy"
                  min={ACCURACY_BOUNDS[0]}
                  max={ACCURACY_BOUNDS[1]}
                  step={5}
                  value={filters.accuracy}
                  onChange={(accuracy) => setFilters((current) => ({ ...current, accuracy }))}
                  format={(value) => `${value}%`}
                />
                <RangeSlider
                  label="PP"
                  min={PP_BOUNDS[0]}
                  max={PP_BOUNDS[1]}
                  value={filters.pp}
                  onChange={(pp) => setFilters((current) => ({ ...current, pp }))}
                />
                <RangeSlider
                  label="Priority"
                  min={PRIORITY_BOUNDS[0]}
                  max={PRIORITY_BOUNDS[1]}
                  value={filters.priority}
                  onChange={(priority) => setFilters((current) => ({ ...current, priority }))}
                  format={(value) => (value > 0 ? `+${value}` : String(value))}
                />
              </div>
            </FilterGroup>

            <FilterGroup label="Availability">
              <Toggle
                label="Has a machine"
                hint="Taught by a TM, HM or TR"
                checked={filters.machineOnly}
                onChange={(machineOnly) => setFilters((current) => ({ ...current, machineOnly }))}
              />
            </FilterGroup>

            <FilterGroup label="Flags" hint="Every selected flag must be present.">
              <div className="flex flex-wrap gap-1">
                {dex.meta.moveFlags.map((flag) => (
                  <Chip
                    key={flag.id}
                    title={flag.label}
                    active={filters.flags.includes(flag.id)}
                    onClick={() =>
                      setFilters((current) => ({ ...current, flags: toggleIn(current.flags, flag.id) }))
                    }
                  >
                    {flag.name.replace(/-/g, ' ')}
                  </Chip>
                ))}
              </div>
            </FilterGroup>
          </Panel>
        </aside>

        <section className="min-w-0">
          {index.error ? (
            <ErrorState message={index.error.message} onRetry={() => setAttempt((value) => value + 1)} />
          ) : !entries ? (
            <InlineLoader label="Loading movedex" />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <p className="numeric text-[11px] uppercase tracking-[0.18em] text-faint">
                  <span className="text-accent">{rows.length}</span> of {total} moves
                </p>
                {active > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="numeric text-[11px] uppercase tracking-[0.18em] text-dim transition hover:text-ink"
                  >
                    Clear {active} filter{active === 1 ? '' : 's'}
                  </button>
                )}
              </div>

              {rows.length === 0 ? (
                <EmptyState
                  title="No moves match those filters"
                  hint={`Loosen a range or clear a chip — ${total} moves are waiting.`}
                />
              ) : view === 'table' ? (
                <DataTable rows={rows} columns={columns} rowKey={(row) => row.id} pageSize={60} dense />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {rows.slice(0, gridLimit).map((move) => (
                      <MoveCard key={move.id} move={move} />
                    ))}
                  </div>
                  {rows.length > gridLimit && (
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <Button onClick={() => setGridLimit((limit) => limit + GRID_PAGE * 2)}>Show more</Button>
                      <span className="numeric text-[11px] text-faint">
                        {gridLimit} of {rows.length}
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function NumericCell({ value }: { value: number | null }) {
  if (value === null) return <Dash />
  return <span className="numeric text-[13px] font-semibold">{value}</span>
}

function FilterGroup({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <MicroLabel className="mb-2 block">{label}</MicroLabel>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-faint">{hint}</p>}
    </div>
  )
}

function LabelledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  options: { value: number; label: string }[]
}) {
  return (
    <Select
      className="w-full"
      aria-label={label}
      value={value === null ? '' : String(value)}
      onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
    >
      <option value="">{label}: any</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}

/// Restricts the classification selects to values the dataset actually uses.
function collectPresentValues(entries: MoveIndexEntry[] | undefined) {
  const types = new Set<number>()
  const targets = new Set<number>()
  const categories = new Set<number>()
  const ailments = new Set<number>()
  for (const move of entries ?? []) {
    types.add(move.typeId)
    targets.add(move.targetId)
    if (move.categoryId !== null) categories.add(move.categoryId)
    if (move.ailmentId !== null) ailments.add(move.ailmentId)
  }
  return { types: [...types].sort((a, b) => a - b), targets, categories, ailments }
}
