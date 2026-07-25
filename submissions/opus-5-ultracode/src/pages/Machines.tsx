import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Chip, SearchInput, Select } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import { ItemArt } from '@/components/items/ItemArt'
import { MACHINE_KIND_RANK, machineKind, type MachineKind } from '@/components/items/itemsMeta'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { cx } from '@/lib/cx'
import type { ItemIndexEntry, MoveIndexEntry } from '@/types/data'
import type { CSSProperties } from 'react'

interface MachineRow {
  key: string
  number: number
  kind: MachineKind
  item: ItemIndexEntry | undefined
  move: MoveIndexEntry | undefined
}

const KIND_LABEL: Record<MachineKind, string> = { tm: 'TM', hm: 'HM', tr: 'TR' }

export default function Machines() {
  const dex = useDex()
  const { meta } = dex
  const [params, setParams] = useSearchParams()
  const preferredVersionGroup = useApp((state) => state.preferredVersionGroup)
  const bundle = useAsync('machines-bundle', () => Promise.all([load.moveIndex(), load.itemIndex()]))

  const groupsWithMachines = useMemo(() => {
    const counts = new Map<number, number>()
    for (const machine of meta.machines) {
      counts.set(machine.versionGroupId, (counts.get(machine.versionGroupId) ?? 0) + 1)
    }
    return meta.versionGroups
      .filter((group) => counts.has(group.id))
      .sort((a, b) => a.order - b.order)
      .map((group) => ({ group, count: counts.get(group.id) ?? 0 }))
  }, [meta])

  /// Falls back to the largest machine list — the most complete TM set in the series — rather than
  /// the newest version group, whose list is often a small DLC subset.
  const fallbackVersionGroup = useMemo(() => {
    if (preferredVersionGroup != null && groupsWithMachines.some((row) => row.group.id === preferredVersionGroup)) {
      return preferredVersionGroup
    }
    let best = groupsWithMachines[0]
    for (const row of groupsWithMachines) {
      if (!best || row.count > best.count || (row.count === best.count && row.group.order > best.group.order)) {
        best = row
      }
    }
    return best?.group.id ?? 0
  }, [preferredVersionGroup, groupsWithMachines])

  const requested = Number(params.get('vg'))
  const versionGroupId = groupsWithMachines.some((row) => row.group.id === requested)
    ? requested
    : fallbackVersionGroup

  const query = params.get('q') ?? ''
  const kindParam = params.get('kind')

  const patch = (updates: Record<string, string | null>) => {
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
  }

  const lookups = useMemo(() => {
    const moveById = new Map<number, MoveIndexEntry>()
    const itemById = new Map<number, ItemIndexEntry>()
    if (bundle.data) {
      for (const move of bundle.data[0].entries) moveById.set(move.id, move)
      for (const item of bundle.data[1].entries) itemById.set(item.id, item)
    }
    return { moveById, itemById }
  }, [bundle.data])

  const allRows = useMemo<MachineRow[]>(() => {
    if (!bundle.data) return []
    return meta.machines
      .filter((machine) => machine.versionGroupId === versionGroupId)
      .map((machine) => {
        const item = lookups.itemById.get(machine.itemId)
        return {
          key: `${machine.itemId}-${machine.moveId}-${machine.number}`,
          number: machine.number,
          kind: (item ? machineKind(item.name) : null) ?? 'tm',
          item,
          move: lookups.moveById.get(machine.moveId),
        }
      })
      .sort(
        (a, b) => MACHINE_KIND_RANK[a.kind] - MACHINE_KIND_RANK[b.kind] || a.number - b.number,
      )
  }, [bundle.data, lookups, meta, versionGroupId])

  const kindsPresent = useMemo(() => {
    const kinds = new Set<MachineKind>()
    for (const row of allRows) kinds.add(row.kind)
    return [...kinds].sort((a, b) => MACHINE_KIND_RANK[a] - MACHINE_KIND_RANK[b])
  }, [allRows])

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return allRows.filter((row) => {
      if (kindParam && row.kind !== kindParam) return false
      if (!normalized) return true
      if (String(row.number).padStart(2, '0').includes(normalized)) return true
      if (row.item?.label.toLowerCase().includes(normalized)) return true
      if (row.move?.label.toLowerCase().includes(normalized)) return true
      return Boolean(row.move?.name.includes(normalized))
    })
  }, [allRows, query, kindParam])

  const typeSpread = useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of allRows) {
      if (!row.move) continue
      counts.set(row.move.typeId, (counts.get(row.move.typeId) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
  }, [allRows])

  const typedTotal = typeSpread.reduce((sum, entry) => sum + entry[1], 0)

  const columns = useMemo<Column<MachineRow>[]>(
    () => [
      {
        key: 'art',
        header: '',
        width: '44px',
        cell: (row) =>
          row.item ? (
            <ItemArt
              slug={row.item.sprite ?? row.item.name}
              label={row.item.label}
              machineTypeId={row.move?.typeId ?? null}
              className="h-7 w-7"
            />
          ) : null,
      },
      {
        key: 'number',
        header: 'Machine',
        width: '110px',
        sort: (row) => MACHINE_KIND_RANK[row.kind] * 1000 + row.number,
        cell: (row) =>
          row.item ? (
            <Link to={`/items/${row.item.name}`} className="numeric font-semibold hover:text-accent">
              {row.item.label}
            </Link>
          ) : (
            <span className="numeric text-faint">
              {KIND_LABEL[row.kind]}
              {String(row.number).padStart(2, '0')}
            </span>
          ),
      },
      {
        key: 'move',
        header: 'Move',
        sort: (row) => row.move?.label ?? '',
        cell: (row) =>
          row.move ? (
            <div className="flex min-w-0 items-center gap-2">
              <Link to={`/moves/${row.move.name}`} className="truncate font-medium hover:text-accent">
                {row.move.label}
              </Link>
              <TypeBadge
                typeId={row.move.typeId}
                label={dex.typeById.get(row.move.typeId)?.label ?? ''}
                size="xs"
              />
            </div>
          ) : (
            <span className="text-faint">—</span>
          ),
      },
      {
        key: 'class',
        header: 'Class',
        hideBelow: 'md',
        sort: (row) => row.move?.damageClassId ?? 0,
        cell: (row) => (
          <span className="text-dim">{dex.nameOf('damageClasses', row.move?.damageClassId)}</span>
        ),
      },
      {
        key: 'power',
        header: 'Pow',
        align: 'right',
        sort: (row) => row.move?.power ?? -1,
        cell: (row) => (
          <span className={cx('numeric', row.move?.power ? 'text-ink' : 'text-faint')}>
            {row.move?.power ?? '—'}
          </span>
        ),
      },
      {
        key: 'accuracy',
        header: 'Acc',
        align: 'right',
        hideBelow: 'sm',
        sort: (row) => row.move?.accuracy ?? -1,
        cell: (row) => (
          <span className={cx('numeric', row.move?.accuracy ? 'text-ink' : 'text-faint')}>
            {row.move?.accuracy ?? '—'}
          </span>
        ),
      },
      {
        key: 'pp',
        header: 'PP',
        align: 'right',
        hideBelow: 'sm',
        sort: (row) => row.move?.pp ?? -1,
        cell: (row) => <span className="numeric text-dim">{row.move?.pp ?? '—'}</span>,
      },
      {
        key: 'effect',
        header: 'Effect',
        hideBelow: 'lg',
        className: 'max-w-[380px]',
        cell: (row) => (
          <span className="line-clamp-2 text-[13px] leading-snug text-dim">
            {row.move?.shortEffect ?? '—'}
          </span>
        ),
      },
    ],
    [dex],
  )

  const generations = useMemo(() => {
    const buckets = new Map<number, { group: (typeof groupsWithMachines)[number]['group']; count: number }[]>()
    for (const row of groupsWithMachines) {
      const list = buckets.get(row.group.generation) ?? []
      list.push(row)
      buckets.set(row.group.generation, list)
    }
    return [...buckets.entries()].sort((a, b) => a[0] - b[0])
  }, [groupsWithMachines])

  const activeGroup = groupsWithMachines.find((row) => row.group.id === versionGroupId)?.group
  const accent = typeSpread.length ? `var(--type-${typeSlug(typeSpread[0][0])})` : 'var(--type-steel)'

  return (
    <div style={{ '--accent': accent } as CSSProperties}>
      <PageHeader
        eyebrow={`${meta.machines.length.toLocaleString('en-US')} machine records`}
        title="TMs & HMs"
        subtitle="Machine numbering is rewritten almost every generation. Pick a version group to see exactly which move each disc taught in those games."
        actions={
          <Select
            aria-label="Version group"
            value={versionGroupId}
            onChange={(event) => patch({ vg: event.target.value })}
            className="w-[240px]"
          >
            {generations.map(([generation, rows_]) => (
              <optgroup key={generation} label={dex.nameOf('generations', generation)}>
                {rows_.map((row) => (
                  <option key={row.group.id} value={row.group.id}>
                    {dex.nameOf('versionGroups', row.group.id)} · {row.count}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        }
      />

      {bundle.loading && <InlineLoader label="Loading machines" />}
      {bundle.error && <ErrorState message={bundle.error.message} onRetry={() => window.location.reload()} />}

      {bundle.data && (
        <div className="flex flex-col gap-5">
          <Panel className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
            <Stat
              label="Machines"
              value={allRows.length}
              accent
              hint={activeGroup ? dex.nameOf('versionGroups', activeGroup.id) : undefined}
            />
            {kindsPresent.map((kind) => (
              <Stat
                key={kind}
                label={`${KIND_LABEL[kind]} count`}
                value={allRows.filter((row) => row.kind === kind).length}
              />
            ))}
            <Stat label="Types covered" value={`${typeSpread.length} / 18`} />
          </Panel>

          {typeSpread.length > 0 && (
            <Panel>
              <SectionTitle eyebrow="Distribution">Type coverage of this machine set</SectionTitle>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                {typeSpread.map(([typeId, count]) => (
                  <span
                    key={typeId}
                    title={`${dex.nameOf('types', typeId)} · ${count}`}
                    style={{
                      width: `${(count / Math.max(1, typedTotal)) * 100}%`,
                      background: `var(--type-${typeSlug(typeId)})`,
                    }}
                  />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {typeSpread.map(([typeId, count]) => (
                  <li key={typeId} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ background: `var(--type-${typeSlug(typeId)})` }}
                    />
                    <span className="numeric text-[10px] uppercase tracking-[0.12em] text-dim">
                      {dex.nameOf('types', typeId)}
                    </span>
                    <span className="numeric text-[11px] font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <SearchInput
                value={query}
                onChange={(next) => patch({ q: next || null })}
                placeholder="Search by machine number or move name"
              />
              <div className="flex flex-wrap gap-1.5">
                <Chip active={!kindParam} onClick={() => patch({ kind: null })}>
                  All
                </Chip>
                {kindsPresent.map((kind) => (
                  <Chip
                    key={kind}
                    active={kindParam === kind}
                    onClick={() => patch({ kind: kindParam === kind ? null : kind })}
                  >
                    {KIND_LABEL[kind]}
                  </Chip>
                ))}
              </div>
            </div>
          </Panel>

          {rows.length === 0 ? (
            <EmptyState
              title="No machines match"
              hint="Try another version group — machine lists were rebuilt from scratch in several generations."
            />
          ) : (
            <DataTable rows={rows} columns={columns} rowKey={(row) => row.key} pageSize={150} dense />
          )}
        </div>
      )}
    </div>
  )
}
