import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { Select, Chip } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { DamageClassTag, Micro, useItemLookup, useMoveLookup } from './shared'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { cx } from '@/lib/cx'
import type { MoveIndexEntry, PokemonDetail, VersionGroupInfo } from '@/types/data'

/// Spin-off groups such as Champions ship only tutor rows, so the newest genuine learnset wins.
function defaultGroupId(groups: GroupSummary[], preferred: number | null): number | null {
  if (preferred !== null && groups.some((item) => item.group.id === preferred)) return preferred
  const withLevelUp = groups.find((item) => item.levelUpCount > 0)
  return (withLevelUp ?? groups[0])?.group.id ?? null
}

const LEVEL_UP_METHOD = 1
const MACHINE_METHOD = 4

interface GroupSummary {
  group: VersionGroupInfo
  count: number
  levelUpCount: number
}

interface MoveRow {
  moveId: number
  level: number
  move: MoveIndexEntry | undefined
  machine: string | null
}

export function MovesTab({
  detail,
  versionGroupId,
  onVersionGroupChange,
}: {
  detail: PokemonDetail
  versionGroupId: number | null
  onVersionGroupChange: (id: number) => void
}) {
  const dex = useDex()
  const moves = useMoveLookup()
  const preferredGroup = useApp((state) => state.preferredVersionGroup)

  const groupsPresent = useMemo(() => {
    const counts = new Map<number, { count: number; levelUpCount: number }>()
    for (const row of detail.moves) {
      const bucket = counts.get(row[1]) ?? { count: 0, levelUpCount: 0 }
      bucket.count += 1
      if (row[2] === LEVEL_UP_METHOD) bucket.levelUpCount += 1
      counts.set(row[1], bucket)
    }
    return dex.meta.versionGroups
      .filter((group) => counts.has(group.id))
      .sort((a, b) => b.order - a.order)
      .map((group) => ({ group, ...counts.get(group.id)! }))
  }, [detail.moves, dex.meta.versionGroups])

  const activeGroupId =
    versionGroupId !== null && groupsPresent.some((item) => item.group.id === versionGroupId)
      ? versionGroupId
      : defaultGroupId(groupsPresent, preferredGroup)

  const methodsPresent = useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of detail.moves) {
      if (row[1] !== activeGroupId) continue
      counts.set(row[2], (counts.get(row[2]) ?? 0) + 1)
    }
    return dex.meta.moveMethods
      .filter((method) => counts.has(method.id))
      .map((method) => ({ method, count: counts.get(method.id) ?? 0 }))
  }, [detail.moves, activeGroupId, dex.meta.moveMethods])

  const [methodId, setMethodId] = useState<number | null>(null)
  const activeMethodId =
    methodId !== null && methodsPresent.some((item) => item.method.id === methodId)
      ? methodId
      : (methodsPresent[0]?.method.id ?? null)

  const machineNumbers = useMemo(() => {
    const map = new Map<number, { number: number; itemId: number }>()
    if (activeGroupId === null) return map
    for (const machine of dex.meta.machines) {
      if (machine.versionGroupId === activeGroupId) {
        map.set(machine.moveId, { number: machine.number, itemId: machine.itemId })
      }
    }
    return map
  }, [dex.meta.machines, activeGroupId])

  const items = useItemLookup(activeMethodId === MACHINE_METHOD)

  const rows = useMemo(() => {
    if (activeGroupId === null || activeMethodId === null) return []
    const best = new Map<number, MoveRow>()
    for (const row of detail.moves) {
      const [moveId, groupId, method, level] = row
      if (groupId !== activeGroupId || method !== activeMethodId) continue
      const existing = best.get(moveId)
      if (existing && existing.level !== 0 && (level === 0 || level >= existing.level)) continue
      const machine = machineNumbers.get(moveId)
      best.set(moveId, {
        moveId,
        level,
        move: moves.byId?.get(moveId),
        machine: machine
          ? (items.byId?.get(machine.itemId)?.label ?? `No. ${machine.number}`)
          : null,
      })
    }
    return [...best.values()]
  }, [detail.moves, activeGroupId, activeMethodId, moves.byId, machineNumbers, items.byId])

  const columns = useMemo<Column<MoveRow>[]>(() => {
    const list: Column<MoveRow>[] = []
    if (activeMethodId === 1) {
      list.push({
        key: 'level',
        header: 'Lv',
        width: '54px',
        align: 'right',
        sort: (row) => (row.level === 0 ? -1 : row.level),
        cell: (row) => (
          <span className="numeric font-semibold tabular-nums">{row.level === 0 ? '—' : row.level}</span>
        ),
      })
    }
    if (activeMethodId === MACHINE_METHOD) {
      list.push({
        key: 'machine',
        header: 'TM',
        width: '78px',
        sort: (row) => row.machine ?? 'zzz',
        cell: (row) => <span className="numeric text-[12px] text-dim">{row.machine ?? '—'}</span>,
      })
    }
    list.push(
      {
        key: 'name',
        header: 'Move',
        sort: (row) => row.move?.label ?? String(row.moveId),
        cell: (row) =>
          row.move ? (
            <Link
              to={`/moves/${row.move.name}`}
              className="font-medium transition hover:text-accent"
            >
              {row.move.label}
            </Link>
          ) : (
            <span className="numeric text-dim">Move #{row.moveId}</span>
          ),
      },
      {
        key: 'type',
        header: 'Type',
        width: '96px',
        sort: (row) => row.move?.typeId ?? 99,
        cell: (row) =>
          row.move ? (
            <TypeBadge
              typeId={row.move.typeId}
              label={dex.typeById.get(row.move.typeId)?.label ?? '—'}
              size="xs"
              link={false}
            />
          ) : null,
      },
      {
        key: 'class',
        header: 'Class',
        width: '104px',
        hideBelow: 'sm',
        sort: (row) => row.move?.damageClassId ?? 99,
        cell: (row) =>
          row.move ? (
            <DamageClassTag
              id={row.move.damageClassId}
              label={dex.nameOf('damageClasses', row.move.damageClassId)}
            />
          ) : null,
      },
      {
        key: 'power',
        header: 'Pow',
        width: '60px',
        align: 'right',
        sort: (row) => row.move?.power ?? -1,
        cell: (row) => <span className="numeric tabular-nums">{row.move?.power ?? '—'}</span>,
      },
      {
        key: 'accuracy',
        header: 'Acc',
        width: '60px',
        align: 'right',
        hideBelow: 'sm',
        sort: (row) => row.move?.accuracy ?? -1,
        cell: (row) => (
          <span className="numeric tabular-nums">
            {row.move?.accuracy === null || row.move?.accuracy === undefined ? '—' : `${row.move.accuracy}%`}
          </span>
        ),
      },
      {
        key: 'pp',
        header: 'PP',
        width: '52px',
        align: 'right',
        hideBelow: 'md',
        sort: (row) => row.move?.pp ?? -1,
        cell: (row) => <span className="numeric tabular-nums text-dim">{row.move?.pp ?? '—'}</span>,
      },
      {
        key: 'effect',
        header: 'Effect',
        hideBelow: 'lg',
        className: 'max-w-[420px]',
        cell: (row) => (
          <span className="line-clamp-2 text-[12px] leading-snug text-dim">{row.move?.shortEffect ?? '—'}</span>
        ),
      },
    )
    return list
  }, [activeMethodId, dex])

  if (detail.moves.length === 0) {
    return <EmptyState title="No learnset" hint="This form has no recorded moves in any game." />
  }

  if (moves.error) return <ErrorState message={moves.error.message} />

  return (
    <Panel>
      <SectionTitle
        eyebrow="Learnset"
        actions={
          <Select
            aria-label="Version group"
            value={activeGroupId ?? ''}
            onChange={(event) => onVersionGroupChange(Number(event.target.value))}
            className="w-[190px]"
          >
            {groupsPresent.map(({ group, count }) => (
              <option key={group.id} value={group.id}>
                {group.label} ({count})
              </option>
            ))}
          </Select>
        }
      >
        Moves
      </SectionTitle>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {methodsPresent.map(({ method, count }) => (
          <Chip
            key={method.id}
            active={method.id === activeMethodId}
            onClick={() => setMethodId(method.id)}
          >
            {method.label}
            <span className={cx('numeric text-[10px]', method.id === activeMethodId ? 'opacity-70' : 'text-faint')}>
              {count}
            </span>
          </Chip>
        ))}
      </div>

      {moves.loading ? (
        <InlineLoader label="Loading move index" />
      ) : (
        <>
          <DataTable
            key={`${activeGroupId}-${activeMethodId}`}
            rows={rows}
            columns={columns}
            rowKey={(row) => row.moveId}
            initialSort={
              activeMethodId === 1 ? { key: 'level', direction: 'asc' } : { key: 'name', direction: 'asc' }
            }
            pageSize={60}
            dense
            emptyMessage="No moves learned this way."
          />
          <Micro className="mt-3">
            Duplicate rows collapsed to the earliest level · {rows.length} moves
          </Micro>
        </>
      )}
    </Panel>
  )
}
