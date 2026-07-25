import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Chip } from '@/components/ui/Controls'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { useDex } from '@/lib/dex'
import { STAT_KEYS, STAT_LABELS, STAT_SHORT } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { NatureInfo } from '@/types/data'

const MATRIX_STAT_IDS = [2, 3, 4, 5, 6]
const FALLBACK_ACCENT = 'var(--type-fairy)'

/** Pokéathlon performance stats; the dataset references them by id only. */
const POKEATHLON_STATS = [
  { id: 1, label: 'Speed' },
  { id: 2, label: 'Power' },
  { id: 3, label: 'Skill' },
  { id: 5, label: 'Jump' },
]

function statKey(statId: number): string {
  return STAT_KEYS[statId - 1] ?? 'hp'
}

function statColor(statId: number): string {
  return `var(--stat-${statKey(statId)})`
}

function statShort(statId: number): string {
  return STAT_SHORT[statId - 1] ?? '—'
}

function statLabel(statId: number): string {
  return STAT_LABELS[statId - 1] ?? '—'
}

function isNeutral(nature: NatureInfo): boolean {
  return nature.increasedStatId === nature.decreasedStatId
}

function pokeathlonChange(nature: NatureInfo, statId: number): number {
  return nature.pokeathlon.find((entry) => entry.statId === statId)?.maxChange ?? 0
}

export default function Natures() {
  const dex = useDex()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [focusStat, setFocusStat] = useState<number | null>(null)

  const natures = dex.meta.natures
  const target = useMemo(() => decodeURIComponent(hash.replace('#', '')), [hash])

  useEffect(() => {
    if (!target) return
    const node = document.getElementById(target)
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [target])

  const matrix = useMemo(() => {
    const cells = new Map<string, NatureInfo>()
    for (const nature of natures) {
      if (nature.increasedStatId === null || nature.decreasedStatId === null) continue
      cells.set(`${nature.increasedStatId}:${nature.decreasedStatId}`, nature)
    }
    return cells
  }, [natures])

  const flavorMap = useMemo(
    () =>
      MATRIX_STAT_IDS.map((statId) => ({
        statId,
        flavorId:
          natures.find((item) => item.increasedStatId === statId && !isNeutral(item))?.likesFlavorId ??
          null,
      })),
    [natures],
  )

  const columns = useMemo<Column<NatureInfo>[]>(
    () => [
      {
        key: 'nature',
        header: 'Nature',
        width: '150px',
        sort: (row) => row.label,
        cell: (row) => (
          <span className="flex items-center gap-2">
            <span className="font-display text-[13px] font-semibold">{row.label}</span>
            {isNeutral(row) && (
              <span className="numeric text-[9px] uppercase tracking-[0.14em] text-faint">Neutral</span>
            )}
          </span>
        ),
      },
      {
        key: 'increased',
        header: 'Raises',
        width: '96px',
        sort: (row) => (isNeutral(row) ? 'ZZ' : statLabel(row.increasedStatId ?? 0)),
        cell: (row) =>
          isNeutral(row) ? (
            <span className="text-[12px] text-faint">—</span>
          ) : (
            <span
              className="numeric text-[12px] font-semibold"
              style={{ color: statColor(row.increasedStatId ?? 0) }}
            >
              +{statShort(row.increasedStatId ?? 0)}
            </span>
          ),
      },
      {
        key: 'decreased',
        header: 'Lowers',
        width: '96px',
        sort: (row) => (isNeutral(row) ? 'ZZ' : statLabel(row.decreasedStatId ?? 0)),
        cell: (row) =>
          isNeutral(row) ? (
            <span className="text-[12px] text-faint">—</span>
          ) : (
            <span
              className="numeric text-[12px] font-semibold"
              style={{ color: statColor(row.decreasedStatId ?? 0) }}
            >
              −{statShort(row.decreasedStatId ?? 0)}
            </span>
          ),
      },
      {
        key: 'likes',
        header: 'Likes',
        hideBelow: 'sm',
        sort: (row) => (isNeutral(row) ? 'ZZ' : dex.nameOf('berryFlavors', row.likesFlavorId)),
        cell: (row) =>
          isNeutral(row) ? (
            <span className="text-[12px] text-faint">—</span>
          ) : (
            <span className="text-[12px] text-dim">{dex.nameOf('berryFlavors', row.likesFlavorId)}</span>
          ),
      },
      {
        key: 'hates',
        header: 'Hates',
        hideBelow: 'sm',
        sort: (row) => (isNeutral(row) ? 'ZZ' : dex.nameOf('berryFlavors', row.hatesFlavorId)),
        cell: (row) =>
          isNeutral(row) ? (
            <span className="text-[12px] text-faint">—</span>
          ) : (
            <span className="text-[12px] text-dim">{dex.nameOf('berryFlavors', row.hatesFlavorId)}</span>
          ),
      },
      ...POKEATHLON_STATS.map<Column<NatureInfo>>((stat) => ({
        key: `pokeathlon-${stat.id}`,
        header: stat.label,
        align: 'center',
        width: '88px',
        sort: (row) => pokeathlonChange(row, stat.id),
        cell: (row) => <PokeathlonValue value={pokeathlonChange(row, stat.id)} />,
      })),
    ],
    [dex],
  )

  if (natures.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Meta" title="Natures" />
        <EmptyState title="No natures in this dataset" />
      </div>
    )
  }

  return (
    <div style={{ '--accent': focusStat ? statColor(focusStat) : FALLBACK_ACCENT } as React.CSSProperties}>
      <PageHeader
        eyebrow={`Meta · ${natures.length} records`}
        title="Natures"
        subtitle="Each nature raises one stat by 10% and lowers another by 10%. The five on the diagonal cancel out. Berry flavours follow the same stat mapping, and the Pokéathlon modifiers below are the Gen IV performance shifts."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {MATRIX_STAT_IDS.map((statId) => (
              <Chip
                key={statId}
                color={statColor(statId)}
                active={focusStat === statId}
                onClick={() => setFocusStat((current) => (current === statId ? null : statId))}
                title={`Highlight natures touching ${statLabel(statId)}`}
              >
                {statShort(statId)}
              </Chip>
            ))}
          </div>
        }
      />

      <div className="mb-5 space-y-5">
        <Panel padded={false} className="min-w-0 overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <SectionTitle
              eyebrow="Rows raise · columns lower"
              className="mb-0"
              actions={
                focusStat !== null ? (
                  <button
                    type="button"
                    onClick={() => setFocusStat(null)}
                    className="numeric text-[10px] uppercase tracking-[0.16em] text-accent"
                  >
                    Clear highlight
                  </button>
                ) : undefined
              }
            >
              The nature matrix
            </SectionTitle>
            <p className="numeric mt-1 text-[10px] uppercase tracking-[0.14em] text-faint lg:hidden">
              Scroll sideways to see every column
            </p>
          </div>

          <div className="overflow-x-auto p-3 sm:p-4">
            <div className="grid min-w-[860px] grid-cols-[76px_repeat(5,minmax(0,1fr))] gap-1.5">
              <div className="flex flex-col justify-end pb-1 pl-1">
                <span className="numeric text-[9px] uppercase leading-tight tracking-[0.14em] text-faint">
                  ↓ raises
                </span>
                <span className="numeric text-[9px] uppercase leading-tight tracking-[0.14em] text-faint">
                  lowers →
                </span>
              </div>

              {MATRIX_STAT_IDS.map((statId) => (
                <button
                  key={`col-${statId}`}
                  type="button"
                  onClick={() => setFocusStat((current) => (current === statId ? null : statId))}
                  className={cx(
                    'flex items-center justify-center gap-1.5 rounded-chip border border-line-soft px-2 py-1.5 transition hover:bg-raised',
                    focusStat === statId && 'bg-raised',
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: statColor(statId) }} />
                  <span className="numeric text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                    −{statShort(statId)}
                  </span>
                </button>
              ))}

              {MATRIX_STAT_IDS.map((rowStat) => (
                <MatrixRow
                  key={`row-${rowStat}`}
                  rowStat={rowStat}
                  matrix={matrix}
                  focusStat={focusStat}
                  target={target}
                  onFocusStat={setFocusStat}
                />
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel>
            <SectionTitle eyebrow="Reference">Flavour map</SectionTitle>
            <ul className="space-y-2">
              {flavorMap.map((row) => (
                <li key={row.statId} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: statColor(row.statId) }}
                    />
                    <span className="truncate text-[13px]">{statLabel(row.statId)}</span>
                  </span>
                  <span className="numeric shrink-0 text-[11px] text-dim">
                    {dex.nameOf('berryFlavors', row.flavorId)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line-soft pt-3 text-[12px] leading-relaxed text-dim">
              Every stat owns a berry flavour. A nature likes the flavour of the stat it raises and hates
              the flavour of the stat it lowers; the neutral five have no preference.
            </p>
          </Panel>

          <Panel>
            <SectionTitle eyebrow="Neutral">No stat change</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {natures.filter(isNeutral).map((nature) => (
                <button
                  key={nature.id}
                  type="button"
                  onClick={() => navigate(`/natures#${nature.name}`)}
                  className="rounded-chip border border-dashed border-line px-2 py-1.5 text-left transition hover:bg-raised"
                >
                  <span className="block font-display text-[13px] font-semibold leading-tight">
                    {nature.label}
                  </span>
                  <span className="numeric block text-[10px] uppercase tracking-[0.12em] text-faint">
                    ±0%
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
              <Stat label="Total" value={natures.length} accent />
              <Stat label="Stat-changing" value={natures.filter((nature) => !isNeutral(nature)).length} />
            </div>
          </Panel>
        </div>
      </div>

      <Panel padded={false}>
        <div className="border-b border-line px-5 py-4">
          <SectionTitle eyebrow="Generation IV · HeartGold · SoulSilver" className="mb-0">
            Pokéathlon modifiers
          </SectionTitle>
        </div>
        <div className="p-3 sm:p-4">
          <DataTable
            rows={natures}
            columns={columns}
            rowKey={(row) => row.id}
            initialSort={{ key: 'nature', direction: 'asc' }}
            onRowClick={(row) => navigate(`/natures#${row.name}`)}
            pageSize={25}
            dense
          />
          <p className="mt-3 text-[12px] text-faint">
            Stamina is the one Pokéathlon stat no nature affects, so it is omitted.
          </p>
        </div>
      </Panel>
    </div>
  )
}

function MatrixRow({
  rowStat,
  matrix,
  focusStat,
  target,
  onFocusStat,
}: {
  rowStat: number
  matrix: Map<string, NatureInfo>
  focusStat: number | null
  target: string
  onFocusStat: (statId: number | null) => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onFocusStat(focusStat === rowStat ? null : rowStat)}
        className={cx(
          'flex flex-col items-start justify-center rounded-chip border border-line-soft px-2 transition hover:bg-raised',
          focusStat === rowStat && 'bg-raised',
        )}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: statColor(rowStat) }} />
        <span className="numeric mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
          +{statShort(rowStat)}
        </span>
      </button>

      {MATRIX_STAT_IDS.map((columnStat) => {
        const nature = matrix.get(`${rowStat}:${columnStat}`)
        if (!nature) {
          return (
            <div
              key={`${rowStat}-${columnStat}`}
              className="rounded-chip border border-dashed border-line-soft"
            />
          )
        }
        return (
          <NatureCell
            key={nature.id}
            nature={nature}
            dimmed={focusStat !== null && focusStat !== rowStat && focusStat !== columnStat}
            highlighted={target === nature.name}
          />
        )
      })}
    </>
  )
}

function NatureCell({
  nature,
  dimmed,
  highlighted,
}: {
  nature: NatureInfo
  dimmed: boolean
  highlighted: boolean
}) {
  const dex = useDex()
  const neutral = isNeutral(nature)
  const increased = nature.increasedStatId ?? 0
  const decreased = nature.decreasedStatId ?? 0

  return (
    <div
      id={nature.name}
      style={{ '--accent': statColor(increased) } as React.CSSProperties}
      className={cx(
        'scroll-mt-24 rounded-chip border px-2.5 py-2 transition duration-300',
        neutral ? 'border-dashed border-line bg-surface' : 'border-line-soft bg-[var(--ui-plate)]',
        highlighted && 'border-accent ring-2 ring-accent',
        dimmed ? 'opacity-30' : 'opacity-100',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="truncate font-display text-[13px] font-semibold leading-tight">{nature.label}</h3>
        <span className="numeric shrink-0 text-[10px] text-faint">{nature.names?.ja ?? ''}</span>
      </div>

      {neutral ? (
        <p className="numeric mt-1 text-[10px] uppercase tracking-[0.14em] text-faint">Neutral · ±0%</p>
      ) : (
        <p className="numeric mt-1 flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold">
          <span style={{ color: statColor(increased) }}>+10% {statShort(increased)}</span>
          <span style={{ color: statColor(decreased) }}>−10% {statShort(decreased)}</span>
        </p>
      )}

      {neutral ? (
        <p className="mt-1.5 truncate text-[10px] text-faint">No flavour preference</p>
      ) : (
        <p className="mt-1.5 truncate text-[10px] text-dim">
          <span className="text-faint">likes</span> {dex.nameOf('berryFlavors', nature.likesFlavorId)}
          <span className="text-faint"> · hates</span> {dex.nameOf('berryFlavors', nature.hatesFlavorId)}
        </p>
      )}
    </div>
  )
}

function PokeathlonValue({ value }: { value: number }) {
  if (value === 0) return <span className="text-[12px] text-faint">·</span>
  return (
    <span
      className={cx(
        'numeric text-[12px] font-semibold',
        value > 0 ? 'text-[var(--type-grass)]' : 'text-[var(--type-fighting)]',
      )}
    >
      {value > 0 ? `+${value}` : `−${Math.abs(value)}`}
    </span>
  )
}
