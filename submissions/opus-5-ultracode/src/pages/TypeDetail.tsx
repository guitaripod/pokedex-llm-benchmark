import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Button, Chip } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { MatchupGroup } from '@/components/types/MatchupGroup'
import {
  compareDefensive,
  defensiveRow,
  groupByMultiplier,
  typeAbbr,
  type DefensiveRow,
} from '@/components/types/chart'
import { typeSlug, useDex } from '@/lib/dex'
import { load, useAsync } from '@/lib/data'
import { BATTLE_TYPE_IDS, effectivenessLabel, type TypeChart } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { MoveIndexEntry, PokemonIndexEntry, TypeInfo } from '@/types/data'

const NAME_LANGUAGES = ['ja', 'ko', 'zh-hans', 'fr', 'de', 'es', 'it']
const GRID_PAGE = 24

export default function TypeDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const dex = useDex()
  const type = dex.typeBySlug.get(slug)

  if (!type) {
    return (
      <div>
        <PageHeader eyebrow="Type" title="Unknown type" />
        <EmptyState title={`No type named “${slug}”`} hint="Pick one from the full type chart instead." />
        <div className="mt-4 flex justify-center">
          <Link
            to="/types"
            className="inline-flex h-9 items-center rounded-chip border border-line px-4 text-sm transition hover:bg-raised"
          >
            Back to the type chart
          </Link>
        </div>
      </div>
    )
  }

  return <TypeView key={type.id} type={type} />
}

function TypeView({ type }: { type: TypeInfo }) {
  const dex = useDex()
  const chart: TypeChart = dex.meta.typeChart
  const isBattleType = BATTLE_TYPE_IDS.includes(type.id)

  const [includeForms, setIncludeForms] = useState(false)
  const [tab, setTab] = useState<'primary' | 'secondary'>('primary')
  const [limit, setLimit] = useState(GRID_PAGE)

  const moveIndex = useAsync('moves-index', () => load.moveIndex())

  const offensive = useMemo(() => {
    const byType: Record<number, number> = {}
    for (const defender of BATTLE_TYPE_IDS) byType[defender] = chart[type.id]?.[defender] ?? 1
    return groupByMultiplier(byType, BATTLE_TYPE_IDS)
  }, [chart, type.id])

  const mono = useMemo(() => defensiveRow(chart, [type.id], null), [chart, type.id])
  const defensive = useMemo(() => groupByMultiplier(mono.byType, BATTLE_TYPE_IDS), [mono])

  const pairSpecies = useMemo(() => countSpeciesByPair(dex.entries), [dex.entries])

  const partners = useMemo(() => {
    if (!isBattleType) return []
    return BATTLE_TYPE_IDS.filter((id) => id !== type.id)
      .map((id) => defensiveRow(chart, [type.id, id], id))
      .sort(compareDefensive)
  }, [chart, isBattleType, type.id])

  const pool = useMemo(
    () => (includeForms ? dex.entries : dex.entries.filter((entry) => entry.isDefault)),
    [dex.entries, includeForms],
  )
  const primary = useMemo(() => pool.filter((entry) => entry.types[0] === type.id).sort(byDex), [pool, type.id])
  const secondary = useMemo(
    () => pool.filter((entry) => entry.types[1] === type.id).sort(byDex),
    [pool, type.id],
  )

  const moves = useMemo(
    () => (moveIndex.data ? moveIndex.data.entries.filter((move) => move.typeId === type.id) : []),
    [moveIndex.data, type.id],
  )
  const moveClassCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const move of moves) counts.set(move.damageClassId, (counts.get(move.damageClassId) ?? 0) + 1)
    return counts
  }, [moves])

  const columns = useMemo(() => moveColumns(dex.nameOf), [dex.nameOf])
  const shown = tab === 'primary' ? primary : secondary
  const localized = NAME_LANGUAGES.map((code) => [code, type.names?.[code]] as const).filter(
    (pair): pair is readonly [string, string] => Boolean(pair[1]),
  )

  function selectTab(next: string) {
    setTab(next === 'secondary' ? 'secondary' : 'primary')
    setLimit(GRID_PAGE)
  }

  return (
    <div style={{ '--accent': `var(--type-${typeSlug(type.id)})` } as React.CSSProperties}>
      <PageHeader
        eyebrow={`Type · ${dex.nameOf('generations', type.generation)}`}
        title={type.label}
        subtitle={
          isBattleType
            ? `One of the ${BATTLE_TYPE_IDS.length} battle types. Every ${type.label}-type move is multiplied through the ${type.label} row of the chart, and every ${type.label} Pokémon absorbs damage through its column.`
            : `${type.label} sits outside the standard efficacy chart — the dataset carries no attack or defence rows for it.`
        }
        actions={
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="numeric flex h-14 w-14 items-center justify-center rounded-plate text-base font-bold text-[#0b0d12]"
              style={{ background: `var(--type-${typeSlug(type.id)})` }}
            >
              {typeAbbr(type.label)}
            </span>
            <Link
              to="/types"
              className="inline-flex h-9 items-center rounded-chip border border-line px-4 text-sm transition hover:border-accent hover:bg-raised"
            >
              Full chart
            </Link>
          </div>
        }
      >
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Pokémon" value={primary.length + secondary.length} hint={includeForms ? 'incl. forms' : 'default forms'} accent />
          <Stat label="Primary" value={primary.length} hint="First type slot" />
          <Stat label="Secondary" value={secondary.length} hint="Second type slot" />
          <Stat label="Moves" value={moveIndex.loading ? '—' : moves.length} hint="Across all generations" />
          <Stat label="Introduced" value={dex.nameOf('generations', type.generation)} />
          <Stat
            label="Damage class"
            value={type.damageClass ? dex.nameOf('damageClasses', type.damageClass) : '—'}
            hint={type.damageClass ? 'Pre-Gen IV split' : undefined}
          />
        </div>

        {localized.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {localized.map(([code, name]) => (
              <span key={code} className="flex items-baseline gap-1.5">
                <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">{code}</span>
                <span className="text-[13px] text-dim">{name}</span>
              </span>
            ))}
          </div>
        )}
      </PageHeader>

      {isBattleType ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel>
            <SectionTitle eyebrow={`${type.label} moves against…`}>Offensive profile</SectionTitle>
            <div className="rounded-chip border border-line-soft bg-surface px-3">
              {offensive.map((group) => (
                <MatchupGroup
                  key={group.value}
                  value={group.value}
                  typeIds={group.typeIds}
                  caption={offensiveCaption(group.value)}
                />
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle eyebrow={`Damage taken by a pure ${type.label} Pokémon`}>
              Defensive profile
            </SectionTitle>
            <div className="rounded-chip border border-line-soft bg-surface px-3">
              {defensive.map((group) => (
                <MatchupGroup
                  key={group.value}
                  value={group.value}
                  typeIds={group.typeIds}
                  caption={defensiveCaption(group.value)}
                />
              ))}
            </div>
          </Panel>
        </div>
      ) : (
        <Panel>
          <SectionTitle eyebrow="No chart data">Matchups</SectionTitle>
          <p className="text-sm leading-relaxed text-dim">
            The efficacy table only covers the {BATTLE_TYPE_IDS.length} battle types, so {type.label} has
            neither an attack row nor a defence column. Anything it touches is treated as 1×.
          </p>
        </Panel>
      )}

      {isBattleType && (
        <PartnerAnalysis type={type} mono={mono} partners={partners} pairSpecies={pairSpecies} />
      )}

      <Panel className="mt-4">
        <SectionTitle
          eyebrow={moveIndex.loading ? 'Loading' : `${moves.length} moves`}
          actions={
            <div className="flex flex-wrap gap-1.5">
              {[...moveClassCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([classId, count]) => (
                  <span
                    key={classId}
                    className="numeric rounded-chip border border-line px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-dim"
                  >
                    {dex.nameOf('damageClasses', classId)} <span className="text-ink">{count}</span>
                  </span>
                ))}
            </div>
          }
        >
          {type.label} moves
        </SectionTitle>

        {moveIndex.loading && <InlineLoader label="Loading move index" />}
        {moveIndex.error && <ErrorState message={moveIndex.error.message} />}
        {!moveIndex.loading && !moveIndex.error && (
          <DataTable
            rows={moves}
            columns={columns}
            rowKey={(move) => move.id}
            initialSort={{ key: 'power', direction: 'desc' }}
            pageSize={20}
            emptyMessage={`No ${type.label} moves in the dataset.`}
            dense
          />
        )}
      </Panel>

      <Panel className="mt-4">
        <SectionTitle
          eyebrow={`${primary.length + secondary.length} in the national dex`}
          actions={
            <Chip active={includeForms} onClick={() => { setIncludeForms(!includeForms); setLimit(GRID_PAGE) }}>
              Alternate forms
            </Chip>
          }
        >
          {type.label} Pokémon
        </SectionTitle>

        <Tabs idPrefix="type-tabs"
          tabs={[
            { id: 'primary', label: 'Primary type', count: primary.length },
            { id: 'secondary', label: 'Secondary type', count: secondary.length },
          ]}
          active={tab}
          onChange={selectTab}
          className="mb-4"
        />

        <TabPanel active>
          {shown.length === 0 ? (
            <EmptyState
              title={`No Pokémon with ${type.label} in this slot`}
              hint={includeForms ? undefined : 'Try enabling alternate forms.'}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {shown.slice(0, limit).map((entry) => (
                  <PokemonCard key={entry.id} entry={entry} />
                ))}
              </div>
              {shown.length > limit && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button variant="soft" onClick={() => setLimit(limit + GRID_PAGE * 2)}>
                    Show more
                  </Button>
                  <span className="numeric text-[11px] text-faint">
                    {Math.min(limit, shown.length)} of {shown.length}
                  </span>
                </div>
              )}
            </>
          )}
        </TabPanel>
      </Panel>
    </div>
  )
}

function PartnerAnalysis({
  type,
  mono,
  partners,
  pairSpecies,
}: {
  type: TypeInfo
  mono: DefensiveRow
  partners: DefensiveRow[]
  pairSpecies: Map<string, number>
}) {
  const dex = useDex()
  const best = partners.slice(0, 3)
  const worst = [...partners].reverse().slice(0, 3)

  const columns: Column<DefensiveRow>[] = [
    {
      key: 'partner',
      header: 'Partner',
      sort: (row) => dex.typeById.get(row.partnerId ?? 0)?.label ?? '',
      cell: (row) =>
        row.partnerId ? (
          <TypeBadge
            typeId={row.partnerId}
            label={dex.typeById.get(row.partnerId)?.label ?? ''}
            size="sm"
          />
        ) : (
          <span className="text-dim">—</span>
        ),
    },
    {
      key: 'weak',
      header: 'Weak',
      align: 'right',
      sort: (row) => row.weaknesses * 10 + row.quadWeaknesses,
      cell: (row) => (
        <span className="numeric">
          {row.weaknesses}
          {row.quadWeaknesses > 0 && (
            <span className="ml-1 text-[10px] text-[var(--type-fighting)]">{row.quadWeaknesses}×4</span>
          )}
        </span>
      ),
    },
    {
      key: 'resist',
      header: 'Resist',
      align: 'right',
      sort: (row) => row.resistances * 10 + row.quadResistances,
      cell: (row) => (
        <span className="numeric">
          {row.resistances}
          {row.quadResistances > 0 && (
            <span className="ml-1 text-[10px] text-[var(--type-water)]">{row.quadResistances}×¼</span>
          )}
        </span>
      ),
    },
    {
      key: 'immune',
      header: 'Immune',
      align: 'right',
      sort: (row) => row.immunities,
      cell: (row) => <span className="numeric">{row.immunities}</span>,
    },
    {
      key: 'mean',
      header: 'Mean ×',
      align: 'right',
      sort: (row) => row.mean,
      cell: (row) => <span className="numeric text-dim">{row.mean.toFixed(2)}</span>,
    },
    {
      key: 'species',
      header: 'Species',
      align: 'right',
      hideBelow: 'sm',
      sort: (row) => pairSpecies.get(pairKey(type.id, row.partnerId)) ?? 0,
      cell: (row) => (
        <span className="numeric text-dim">{pairSpecies.get(pairKey(type.id, row.partnerId)) ?? 0}</span>
      ),
    },
    {
      key: 'profile',
      header: 'Incoming damage',
      hideBelow: 'lg',
      cell: (row) => <ProfileStrip row={row} />,
    },
  ]

  return (
    <Panel className="mt-4">
      <SectionTitle eyebrow="Which second type covers this one best">Defensive partners</SectionTitle>

      <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-dim">
        Every {type.label} pairing is run through all {BATTLE_TYPE_IDS.length} attacking types. Weak
        counts multipliers above 1×, resist counts multipliers below 1× (immunities excluded), and mean
        is the average incoming multiplier — lower is tankier. Pure {type.label} takes{' '}
        <span className="numeric text-ink">{mono.mean.toFixed(2)}×</span> on average with{' '}
        <span className="numeric text-ink">{mono.weaknesses}</span> weaknesses.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <PartnerHighlight title="Best partners" tone="good" rows={best} baseline={mono} typeId={type.id} />
        <PartnerHighlight title="Worst partners" tone="bad" rows={worst} baseline={mono} typeId={type.id} />
      </div>

      <DataTable
        rows={partners}
        columns={columns}
        rowKey={(row) => row.partnerId ?? 0}
        initialSort={{ key: 'weak', direction: 'asc' }}
        pageSize={20}
        dense
      />
    </Panel>
  )
}

function PartnerHighlight({
  title,
  tone,
  rows,
  baseline,
  typeId,
}: {
  title: string
  tone: 'good' | 'bad'
  rows: DefensiveRow[]
  baseline: DefensiveRow
  typeId: number
}) {
  const dex = useDex()

  return (
    <div className="rounded-chip border border-line-soft bg-surface p-3">
      <p className="numeric mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
        {title}
      </p>
      <ul className="space-y-2">
        {rows.map((row) => {
          const delta = row.weaknesses - baseline.weaknesses
          return (
            <li key={row.partnerId ?? 0} className="flex flex-wrap items-center gap-2">
              <TypeBadge typeId={typeId} label={dex.typeById.get(typeId)?.label ?? ''} size="xs" link={false} />
              <span aria-hidden className="text-faint">
                +
              </span>
              <TypeBadge
                typeId={row.partnerId ?? 0}
                label={dex.typeById.get(row.partnerId ?? 0)?.label ?? ''}
                size="xs"
              />
              <span className="numeric ml-auto flex items-center gap-2 text-[11px]">
                <span className={cx('font-semibold', tone === 'good' ? 'text-[var(--type-grass)]' : 'text-[var(--type-fighting)]')}>
                  {row.weaknesses} weak
                </span>
                <span className="text-dim">{row.resistances} res</span>
                {row.immunities > 0 && <span className="text-dim">{row.immunities} imm</span>}
                <span className="text-faint">
                  {delta === 0 ? '±0' : delta > 0 ? `+${delta}` : delta}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ProfileStrip({ row }: { row: DefensiveRow }) {
  const dex = useDex()
  return (
    <div className="flex gap-px">
      {BATTLE_TYPE_IDS.map((id) => {
        const value = row.byType[id] ?? 1
        return (
          <span
            key={id}
            title={`${dex.typeById.get(id)?.label ?? id}: ${effectivenessLabel(value)}`}
            className="h-4 w-2.5 rounded-[2px]"
            style={{
              background:
                value === 0
                  ? 'color-mix(in oklab, var(--ui-void) 70%, transparent)'
                  : value > 1
                    ? `color-mix(in oklab, var(--type-fire) ${value > 2 ? 100 : 70}%, transparent)`
                    : value < 1
                      ? `color-mix(in oklab, var(--type-water) ${value < 0.5 ? 70 : 35}%, transparent)`
                      : 'color-mix(in oklab, var(--ui-text-faint) 16%, transparent)',
            }}
          />
        )
      })}
    </div>
  )
}

function moveColumns(nameOf: (kind: 'damageClasses', id: number) => string): Column<MoveIndexEntry>[] {
  return [
    {
      key: 'name',
      header: 'Move',
      sort: (move) => move.label,
      cell: (move) => (
        <Link to={`/moves/${move.name}`} className="font-medium transition hover:text-accent">
          {move.label}
        </Link>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      hideBelow: 'sm',
      sort: (move) => move.damageClassId,
      cell: (move) => (
        <span className="numeric text-[11px] uppercase tracking-[0.1em] text-dim">
          {nameOf('damageClasses', move.damageClassId)}
        </span>
      ),
    },
    {
      key: 'power',
      header: 'Power',
      align: 'right',
      sort: (move) => move.power ?? -1,
      cell: (move) => <span className="numeric font-semibold">{move.power ?? '—'}</span>,
    },
    {
      key: 'accuracy',
      header: 'Acc',
      align: 'right',
      hideBelow: 'sm',
      sort: (move) => move.accuracy ?? -1,
      cell: (move) => <span className="numeric text-dim">{move.accuracy ?? '—'}</span>,
    },
    {
      key: 'pp',
      header: 'PP',
      align: 'right',
      hideBelow: 'md',
      sort: (move) => move.pp ?? -1,
      cell: (move) => <span className="numeric text-dim">{move.pp ?? '—'}</span>,
    },
    {
      key: 'generation',
      header: 'Gen',
      align: 'right',
      hideBelow: 'md',
      sort: (move) => move.generation,
      cell: (move) => <span className="numeric text-faint">{move.generation}</span>,
    },
    {
      key: 'learned',
      header: 'Learned by',
      align: 'right',
      hideBelow: 'lg',
      sort: (move) => move.learnedByCount,
      cell: (move) => <span className="numeric text-dim">{move.learnedByCount}</span>,
    },
  ]
}

function offensiveCaption(value: number): string {
  if (value === 0) return 'Cannot touch'
  if (value > 1) return 'Super effective against'
  if (value < 1) return 'Resisted by'
  return 'Neutral against'
}

function defensiveCaption(value: number): string {
  if (value === 0) return 'Immune to'
  if (value > 1) return 'Weak to'
  if (value < 1) return 'Resists'
  return 'Takes neutral damage from'
}

function pairKey(a: number, b: number | null): string {
  if (b === null) return `${a}`
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

/// Distinct species per exact two-type pairing, so alternate forms do not inflate the count.
function countSpeciesByPair(entries: PokemonIndexEntry[]): Map<string, number> {
  const buckets = new Map<string, Set<number>>()
  for (const entry of entries) {
    const key = entry.types.length === 2 ? pairKey(entry.types[0], entry.types[1]) : pairKey(entry.types[0], null)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = new Set()
      buckets.set(key, bucket)
    }
    bucket.add(entry.speciesId)
  }
  return new Map([...buckets.entries()].map(([key, set]) => [key, set.size]))
}

function byDex(a: PokemonIndexEntry, b: PokemonIndexEntry): number {
  if (a.dex !== b.dex) return a.dex - b.dex
  return a.id - b.id
}
