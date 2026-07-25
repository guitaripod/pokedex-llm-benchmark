import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import { Button, Chip, Segmented, Select } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/Panel'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { PokemonCard, spriteSources } from '@/components/pokemon/PokemonCard'
import { MicroLabel } from './MoveBits'
import type { PokemonIndexEntry } from '@/types/data'

const GRID_PAGE = 48

export interface Learner {
  entry: PokemonIndexEntry
  methods: number[]
  versionGroups: number[]
  /** Lowest level the move is learned at, when any version teaches it by level-up. */
  level: number | null
}

export function LearnedBy({ rows }: { rows: [number, number, number, number][] }) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const [versionGroup, setVersionGroup] = useState<number | null>(null)
  const [method, setMethod] = useState<number | null>(null)
  const [mode, setMode] = useState<'grid' | 'table'>('grid')
  const [limit, setLimit] = useState(GRID_PAGE)

  const available = useMemo(() => {
    const versionGroups = new Set<number>()
    const methods = new Set<number>()
    for (const [, group, learnMethod] of rows) {
      versionGroups.add(group)
      methods.add(learnMethod)
    }
    return {
      versionGroups: dex.meta.versionGroups
        .filter((group) => versionGroups.has(group.id))
        .sort((a, b) => a.order - b.order),
      methods: dex.meta.moveMethods.filter((entry) => methods.has(entry.id)),
    }
  }, [rows, dex])

  const learners = useMemo(
    () => groupLearners(rows, versionGroup, method, dex.byId),
    [rows, versionGroup, method, dex],
  )

  const columns = useMemo<Column<Learner>[]>(
    () => [
      {
        key: 'pokemon',
        header: 'Pokémon',
        sort: (row) => row.entry.dex,
        cell: (row) => (
          <Link to={`/pokemon/${row.entry.name}`} className="flex items-center gap-2.5 transition hover:text-accent">
            <Sprite
              sources={spriteSources(row.entry.id, spriteStyle, shiny)}
              alt=""
              className="h-8 w-8 shrink-0"
              pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
            />
            <span className="min-w-0">
              <span className="numeric block text-[10px] text-faint">{formatDex(row.entry.dex)}</span>
              <span className="block truncate font-display text-[13px] font-semibold leading-tight">
                {row.entry.label}
              </span>
            </span>
          </Link>
        ),
      },
      {
        key: 'types',
        header: 'Type',
        width: '150px',
        hideBelow: 'sm',
        cell: (row) => (
          <span className="flex flex-wrap gap-1">
            {row.entry.types.map((typeId) => (
              <TypeBadge
                key={typeId}
                typeId={typeId}
                label={dex.typeById.get(typeId)?.label ?? '—'}
                size="xs"
                link={false}
              />
            ))}
          </span>
        ),
      },
      {
        key: 'method',
        header: 'Method',
        hideBelow: 'md',
        cell: (row) => (
          <span className="flex flex-wrap gap-1">
            {row.methods.map((methodId) => (
              <span
                key={methodId}
                className="numeric rounded-chip bg-raised px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-dim"
              >
                {dex.nameOf('moveMethods', methodId)}
              </span>
            ))}
          </span>
        ),
      },
      {
        key: 'level',
        header: 'Level',
        width: '72px',
        align: 'right',
        sort: (row) => row.level ?? 999,
        cell: (row) => (
          <span className="numeric text-[13px] font-semibold">
            {row.level === null ? <span className="text-faint">—</span> : row.level}
          </span>
        ),
      },
      {
        key: 'games',
        header: 'Games',
        width: '78px',
        align: 'right',
        hideBelow: 'lg',
        sort: (row) => row.versionGroups.length,
        cell: (row) => (
          <span
            className="numeric text-[12px] text-dim"
            title={row.versionGroups.map((id) => dex.nameOf('versionGroups', id)).join(', ')}
          >
            {row.versionGroups.length}
          </span>
        ),
      },
      {
        key: 'bst',
        header: 'BST',
        width: '68px',
        align: 'right',
        hideBelow: 'lg',
        sort: (row) => row.entry.bst,
        cell: (row) => <span className="numeric text-[12px] text-dim">{row.entry.bst}</span>,
      },
    ],
    [dex, shiny, spriteStyle],
  )

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No Pokémon learn this move"
        hint="It is either an event-only move or generated by another move’s effect."
      />
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filter by game"
          value={versionGroup === null ? '' : String(versionGroup)}
          onChange={(event) => {
            setVersionGroup(event.target.value === '' ? null : Number(event.target.value))
            setLimit(GRID_PAGE)
          }}
        >
          <option value="">All games</option>
          {available.versionGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </Select>

        <div className="flex flex-wrap gap-1">
          <Chip
            active={method === null}
            onClick={() => {
              setMethod(null)
              setLimit(GRID_PAGE)
            }}
          >
            All methods
          </Chip>
          {available.methods.map((entry) => (
            <Chip
              key={entry.id}
              active={method === entry.id}
              onClick={() => {
                setMethod(method === entry.id ? null : entry.id)
                setLimit(GRID_PAGE)
              }}
            >
              {entry.label}
            </Chip>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <MicroLabel>
            <span className="text-accent">{learners.length}</span> Pokémon
          </MicroLabel>
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'grid' as const, label: 'Grid' },
              { value: 'table' as const, label: 'Table' },
            ]}
          />
        </div>
      </div>

      {learners.length === 0 ? (
        <EmptyState title="Nothing learns it under those conditions" hint="Try another game or method." />
      ) : mode === 'table' ? (
        <DataTable
          rows={learners}
          columns={columns}
          rowKey={(row) => row.entry.id}
          initialSort={{ key: 'pokemon', direction: 'asc' }}
          pageSize={40}
          dense
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {learners.slice(0, limit).map((learner) => (
              <PokemonCard
                key={learner.entry.id}
                entry={learner.entry}
                compact
                badge={<LearnerBadge learner={learner} />}
              />
            ))}
          </div>
          {learners.length > limit && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button onClick={() => setLimit((current) => current + GRID_PAGE * 2)}>Show more</Button>
              <span className="numeric text-[11px] text-faint">
                {limit} of {learners.length}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function LearnerBadge({ learner }: { learner: Learner }) {
  const dex = useDex()
  const label =
    learner.level !== null ? `Lv ${learner.level}` : dex.nameOf('moveMethods', learner.methods[0] ?? 0)
  return (
    <span className="numeric rounded-chip bg-void/70 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-dim backdrop-blur">
      {label}
    </span>
  )
}

/// Collapses the per-game learn rows into one entry per Pokémon, keeping the earliest level.
function groupLearners(
  rows: [number, number, number, number][],
  versionGroup: number | null,
  method: number | null,
  byId: Map<number, PokemonIndexEntry>,
): Learner[] {
  const accumulator = new Map<
    number,
    { methods: Set<number>; versionGroups: Set<number>; level: number | null }
  >()

  for (const [pokemonId, group, learnMethod, level] of rows) {
    if (versionGroup !== null && group !== versionGroup) continue
    if (method !== null && learnMethod !== method) continue
    let record = accumulator.get(pokemonId)
    if (!record) {
      record = { methods: new Set(), versionGroups: new Set(), level: null }
      accumulator.set(pokemonId, record)
    }
    record.methods.add(learnMethod)
    record.versionGroups.add(group)
    if (level > 0 && (record.level === null || level < record.level)) record.level = level
  }

  const learners: Learner[] = []
  for (const [pokemonId, record] of accumulator) {
    const entry = byId.get(pokemonId)
    if (!entry) continue
    learners.push({
      entry,
      methods: [...record.methods].sort((a, b) => a - b),
      versionGroups: [...record.versionGroups].sort((a, b) => a - b),
      level: record.level,
    })
  }
  return learners.sort((a, b) => a.entry.dex - b.entry.dex || a.entry.id - b.entry.id)
}
