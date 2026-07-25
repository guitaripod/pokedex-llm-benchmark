import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { Select } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { ItemChip, Micro, useItemLookup } from './shared'
import { useDex } from '@/lib/dex'
import { load, useAsync } from '@/lib/data'
import type { EncounterTuple, PokemonDetail, VersionInfo } from '@/types/data'

interface EncounterRow {
  key: string
  areaId: number
  methodId: number
  minLevel: number
  maxLevel: number
  rarity: number
  slots: number
  conditionValueIds: number[]
}

export function LocationsTab({ detail }: { detail: PokemonDetail }) {
  const dex = useDex()
  const { data: areaLookup } = useAsync('location-areas', load.locationAreas)

  const versions = useMemo(() => {
    const counts = new Map<number, number>()
    for (const row of detail.encounters) counts.set(row[0], (counts.get(row[0]) ?? 0) + 1)
    return dex.meta.versions
      .filter((version) => counts.has(version.id))
      .map((version) => ({ version, count: counts.get(version.id) ?? 0 }))
      .reverse()
  }, [detail.encounters, dex.meta.versions])

  const [versionId, setVersionId] = useState<number | null>(null)
  const activeVersionId =
    versionId !== null && versions.some((item) => item.version.id === versionId)
      ? versionId
      : defaultVersionId(versions)

  const rows = useMemo(
    () => mergeSlots(detail.encounters.filter((row) => row[0] === activeVersionId)),
    [detail.encounters, activeVersionId],
  )

  const areaCount = useMemo(() => new Set(rows.map((row) => row.areaId)).size, [rows])

  const columns = useMemo<Column<EncounterRow>[]>(
    () => [
      {
        key: 'area',
        header: 'Area',
        width: '200px',
        sort: (row) => areaLookup?.areas[row.areaId]?.[2] ?? String(row.areaId),
        cell: (row) => {
          const area = areaLookup?.areas[row.areaId]
          if (!area) return <span className="numeric text-[12px] text-faint">Area #{row.areaId}</span>
          return (
            <Link
              to={`/locations/${area[1]}`}
              className="text-[12px] font-medium leading-snug transition hover:text-accent"
            >
              {area[2]}
            </Link>
          )
        },
      },
      {
        key: 'method',
        header: 'Method',
        sort: (row) => dex.nameOf('encounterMethods', row.methodId),
        cell: (row) => (
          <span className="text-[12px] leading-snug text-dim">
            {dex.nameOf('encounterMethods', row.methodId)}
          </span>
        ),
      },
      {
        key: 'levels',
        header: 'Levels',
        width: '92px',
        align: 'right',
        sort: (row) => row.minLevel,
        cell: (row) => (
          <span className="numeric tabular-nums">
            {row.minLevel === row.maxLevel ? row.minLevel : `${row.minLevel}–${row.maxLevel}`}
          </span>
        ),
      },
      {
        key: 'rarity',
        header: 'Rate',
        width: '132px',
        align: 'right',
        sort: (row) => row.rarity,
        cell: (row) => <RarityCell rarity={row.rarity} slots={row.slots} />,
      },
      {
        key: 'conditions',
        header: 'Conditions',
        hideBelow: 'md',
        cell: (row) =>
          row.conditionValueIds.length === 0 ? (
            <span className="text-[12px] text-faint">—</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {row.conditionValueIds.map((id) => (
                <span
                  key={id}
                  className="rounded-chip border border-line-soft px-1.5 py-0.5 text-[11px] text-dim"
                >
                  {dex.nameOf('encounterConditionValues', id)}
                </span>
              ))}
            </span>
          ),
      },
    ],
    [dex, areaLookup],
  )

  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel className="min-w-0">
        <SectionTitle
          eyebrow={activeVersionId === null ? 'Encounters' : `${rows.length} entries · ${areaCount} areas`}
          actions={
            versions.length > 0 ? (
              <Select
                aria-label="Game version"
                value={activeVersionId ?? ''}
                onChange={(event) => setVersionId(Number(event.target.value))}
                className="w-[200px]"
              >
                {versions.map(({ version, count }) => (
                  <option key={version.id} value={version.id}>
                    {version.label} ({count})
                  </option>
                ))}
              </Select>
            ) : undefined
          }
        >
          Wild encounters
        </SectionTitle>

        {versions.length === 0 ? (
          <EmptyState
            title="Not found in the wild"
            hint="This Pokémon has no recorded wild encounters — it is obtained by evolution, breeding, trade or an event."
          />
        ) : (
          <>
            <DataTable
              key={activeVersionId ?? 'none'}
              rows={rows}
              columns={columns}
              rowKey={(row) => row.key}
              initialSort={{ key: 'area', direction: 'asc' }}
              pageSize={50}
              dense
              emptyMessage="No encounters in this version."
            />
            <Micro className="mt-3 leading-relaxed">
              Encounter rates are summed across every slot a Pokémon occupies in the same spot, so each
              row shows its true chance for that method.
            </Micro>
            <Link
              to="/locations"
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
            >
              Browse locations
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M4 2.5 7.5 6 4 9.5" />
              </svg>
            </Link>
          </>
        )}
      </Panel>

      <HeldItemsPanel detail={detail} />
    </div>
  )
}

/// The newest release is often a DLC with a single raid row, so the richest version opens first.
function defaultVersionId(versions: { version: VersionInfo; count: number }[]): number | null {
  let best: { version: VersionInfo; count: number } | null = null
  for (const candidate of versions) {
    if (!best || candidate.count > best.count) best = candidate
  }
  return best?.version.id ?? null
}

/// A species can occupy several encounter slots in one spot; their rates add up to the real chance.
function mergeSlots(encounters: EncounterTuple[]): EncounterRow[] {
  const merged = new Map<string, EncounterRow>()
  for (const [, areaId, methodId, minLevel, maxLevel, rarity, conditionValueIds] of encounters) {
    const key = `${areaId}-${methodId}-${minLevel}-${maxLevel}-${conditionValueIds.join('.')}`
    const existing = merged.get(key)
    if (existing) {
      existing.rarity += rarity
      existing.slots += 1
    } else {
      merged.set(key, {
        key,
        areaId,
        methodId,
        minLevel,
        maxLevel,
        rarity,
        slots: 1,
        conditionValueIds,
      })
    }
  }
  return [...merged.values()]
}

function RarityCell({ rarity, slots }: { rarity: number; slots: number }) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span aria-hidden className="h-1 w-10 overflow-hidden rounded-full bg-raised">
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, rarity)}%` }}
        />
      </span>
      <span className="numeric w-9 text-right tabular-nums">{Math.min(100, rarity)}%</span>
      <span className="numeric w-7 text-right text-[10px] text-faint" title={`${slots} encounter slots`}>
        {slots > 1 ? `×${slots}` : ''}
      </span>
    </span>
  )
}

function HeldItemsPanel({ detail }: { detail: PokemonDetail }) {
  const dex = useDex()
  const items = useItemLookup(detail.heldItems.length > 0)

  const grouped = useMemo(() => {
    const map = new Map<number, { versionIds: number[]; rarity: number }>()
    for (const [itemId, versionId, rarity] of detail.heldItems) {
      const existing = map.get(itemId)
      if (existing) {
        existing.versionIds.push(versionId)
        existing.rarity = Math.max(existing.rarity, rarity)
      } else {
        map.set(itemId, { versionIds: [versionId], rarity })
      }
    }
    return [...map.entries()].sort((a, b) => b[1].rarity - a[1].rarity)
  }, [detail.heldItems])

  if (detail.heldItems.length === 0) {
    return (
      <Panel>
        <SectionTitle eyebrow="Wild holds">Held items</SectionTitle>
        <p className="text-[13px] text-dim">Never found holding an item.</p>
      </Panel>
    )
  }

  return (
    <Panel>
      <SectionTitle eyebrow={`${grouped.length} items`}>Held items</SectionTitle>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {grouped.map(([itemId, info]) => (
          <li key={itemId} className="min-w-0 rounded-chip border border-line-soft bg-surface/60 p-2.5">
            <ItemChip itemId={itemId} item={items.byId?.get(itemId)} hint={`${info.rarity}%`} />
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-faint">
              {info.versionIds.map((versionId) => dex.nameOf('versions', versionId)).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
