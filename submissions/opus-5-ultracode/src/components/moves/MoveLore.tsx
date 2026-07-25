import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { load, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { itemSprite } from '@/lib/sprites'
import { Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Sprite } from '@/components/ui/Sprite'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { InlineLoader } from '@/components/shell/Loading'
import { MicroLabel } from './MoveBits'
import type { ItemIndexEntry, MoveDetail, MoveIndexEntry } from '@/types/data'

type MachineRow = MoveDetail['machines'][number]

export function MachinesPanel({ machines, className }: { machines: MachineRow[]; className?: string }) {
  const dex = useDex()
  const items = useAsync(machines.length ? 'items-index' : null, () => load.itemIndex())

  const itemById = useMemo(() => {
    const map = new Map<number, ItemIndexEntry>()
    for (const item of items.data?.entries ?? []) map.set(item.id, item)
    return map
  }, [items.data])

  const rows = useMemo(
    () =>
      [...machines].sort(
        (a, b) => orderOf(dex.meta.versionGroups, a.versionGroupId) - orderOf(dex.meta.versionGroups, b.versionGroupId),
      ),
    [machines, dex.meta.versionGroups],
  )

  const columns = useMemo<Column<MachineRow>[]>(
    () => [
      {
        key: 'machine',
        header: 'Machine',
        sort: (row) => row.number,
        cell: (row) => {
          const item = itemById.get(row.itemId)
          const label = item?.label ?? `Item #${row.itemId}`
          const body = (
            <span className="flex items-center gap-2">
              {item?.sprite && (
                <Sprite sources={[itemSprite(item.sprite)]} alt="" className="h-6 w-6 shrink-0" pixelated />
              )}
              <span className="numeric text-[13px] font-semibold">{label}</span>
            </span>
          )
          return item ? (
            <Link to={`/items/${item.name}`} className="inline-flex transition hover:text-accent">
              {body}
            </Link>
          ) : (
            body
          )
        },
      },
      {
        key: 'number',
        header: 'No.',
        width: '64px',
        align: 'right',
        sort: (row) => row.number,
        cell: (row) => <span className="numeric text-[12px] text-dim">{String(row.number).padStart(2, '0')}</span>,
      },
      {
        key: 'game',
        header: 'Game',
        sort: (row) => orderOf(dex.meta.versionGroups, row.versionGroupId),
        cell: (row) => <span className="text-[12px] text-dim">{dex.nameOf('versionGroups', row.versionGroupId)}</span>,
      },
    ],
    [dex, itemById],
  )

  return (
    <Panel className={className}>
      <SectionTitle eyebrow={`${machines.length} entries`}>Machines</SectionTitle>
      {machines.length === 0 ? (
        <p className="text-sm text-dim">No TM, HM or TR has ever taught this move.</p>
      ) : items.loading ? (
        <InlineLoader label="Loading items" />
      ) : (
        <DataTable rows={rows} columns={columns} rowKey={(row) => `${row.versionGroupId}:${row.itemId}`} pageSize={12} dense />
      )}
    </Panel>
  )
}

export function FlavorPanel({
  flavorText,
  className,
}: {
  flavorText: MoveDetail['flavorText']
  className?: string
}) {
  const dex = useDex()

  const grouped = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const entry of flavorText) {
      const list = map.get(entry.text)
      if (list) list.push(entry.versionGroupId)
      else map.set(entry.text, [entry.versionGroupId])
    }
    return [...map.entries()]
      .map(([text, versionGroupIds]) => ({ text, versionGroupIds }))
      .sort(
        (a, b) =>
          orderOf(dex.meta.versionGroups, a.versionGroupIds[0]) -
          orderOf(dex.meta.versionGroups, b.versionGroupIds[0]),
      )
  }, [flavorText, dex.meta.versionGroups])

  return (
    <Panel className={className}>
      <SectionTitle eyebrow={`${flavorText.length} versions`}>In-game description</SectionTitle>
      {grouped.length === 0 ? (
        <p className="text-sm text-dim">No in-game description was ever printed for this move.</p>
      ) : (
        <ul className="space-y-3">
          {grouped.map((group) => (
            <li key={group.text} className="border-l-2 border-accent/50 pl-3">
              <p className="text-[13px] leading-relaxed text-ink">{group.text}</p>
              <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                {group.versionGroupIds.map((id) => (
                  <MicroLabel key={id}>{dex.nameOf('versionGroups', id)}</MicroLabel>
                ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function ChangelogPanel({ changelog }: { changelog: MoveDetail['changelog'] }) {
  const dex = useDex()

  const rows = useMemo(
    () =>
      [...changelog].sort(
        (a, b) => orderOf(dex.meta.versionGroups, a.versionGroupId) - orderOf(dex.meta.versionGroups, b.versionGroupId),
      ),
    [changelog, dex.meta.versionGroups],
  )

  return (
    <Panel>
      <SectionTitle eyebrow="Past values">Changelog</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-sm text-dim">This move has never been rebalanced.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((entry) => {
            const changes = describeChange(entry, (typeId) => dex.typeById.get(typeId)?.label ?? `#${typeId}`)
            return (
              <li key={entry.versionGroupId} className="rounded-chip border border-line-soft bg-surface/50 px-3 py-2">
                <MicroLabel>Before {dex.nameOf('versionGroups', entry.versionGroupId)}</MicroLabel>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {changes.length === 0 ? (
                    <span className="text-[12px] text-dim">Behaviour differed.</span>
                  ) : (
                    changes.map((change) => (
                      <span
                        key={change}
                        className="numeric rounded-chip bg-raised px-2 py-0.5 text-[11px] font-semibold text-ink"
                      >
                        {change}
                      </span>
                    ))
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export function ContestPanel({
  move,
  moveById,
}: {
  move: MoveDetail
  moveById: Map<number, MoveIndexEntry>
}) {
  const dex = useDex()
  const combos = [...move.contestCombos.useBefore, ...move.contestCombos.useAfter]
  const hasContent =
    move.contestTypeId !== null || move.contestEffect !== null || move.superContestEffect !== null || combos.length > 0

  return (
    <Panel>
      <SectionTitle eyebrow="Contests">Appeal</SectionTitle>
      {!hasContent ? (
        <p className="text-sm text-dim">This move has never appeared in a contest.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Condition" value={dex.nameOf('contestTypes', move.contestTypeId)} accent />
            <Stat label="Appeal" value={move.contestEffect ? `${move.contestEffect.appeal}` : '—'} />
            <Stat label="Jam" value={move.contestEffect ? `${move.contestEffect.jam}` : '—'} />
          </div>

          {move.contestEffect?.effect && (
            <p className="text-[13px] leading-relaxed text-dim">{move.contestEffect.effect}</p>
          )}

          {move.superContestEffect && (
            <div className="border-t border-line-soft pt-3">
              <MicroLabel>Super contest · appeal {move.superContestEffect.appeal}</MicroLabel>
              {move.superContestEffect.effect && (
                <p className="mt-1 text-[13px] leading-relaxed text-dim">{move.superContestEffect.effect}</p>
              )}
            </div>
          )}

          {move.contestCombos.useBefore.length > 0 && (
            <ComboRow label="Combos into" ids={move.contestCombos.useBefore} moveById={moveById} />
          )}
          {move.contestCombos.useAfter.length > 0 && (
            <ComboRow label="Follows" ids={move.contestCombos.useAfter} moveById={moveById} />
          )}
        </div>
      )}
    </Panel>
  )
}

function ComboRow({
  label,
  ids,
  moveById,
}: {
  label: string
  ids: number[]
  moveById: Map<number, MoveIndexEntry>
}) {
  return (
    <div className="border-t border-line-soft pt-3">
      <MicroLabel className="mb-1.5 block">{label}</MicroLabel>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => {
          const partner = moveById.get(id)
          if (!partner) {
            return (
              <span key={id} className="numeric rounded-chip bg-raised px-2 py-0.5 text-[11px] text-dim">
                #{id}
              </span>
            )
          }
          return (
            <Link
              key={id}
              to={`/moves/${partner.name}`}
              className="rounded-chip border border-line px-2 py-0.5 font-display text-[11px] font-semibold transition hover:border-accent hover:text-accent"
            >
              {partner.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function orderOf(versionGroups: { id: number; order: number }[], id: number): number {
  return versionGroups.find((group) => group.id === id)?.order ?? 999
}

/// Renders a past-values row as the concrete values the move used to have.
function describeChange(
  entry: MoveDetail['changelog'][number],
  typeLabel: (typeId: number) => string,
): string[] {
  const changes: string[] = []
  if (entry.power !== null) changes.push(`Power ${entry.power}`)
  if (entry.pp !== null) changes.push(`PP ${entry.pp}`)
  if (entry.accuracy !== null) changes.push(`Accuracy ${entry.accuracy}`)
  if (entry.typeId !== null) changes.push(`Type ${typeLabel(entry.typeId)}`)
  if (entry.effectChance !== null) changes.push(`Effect chance ${entry.effectChance}%`)
  if (entry.effectId !== null) changes.push('Different effect')
  return changes
}
