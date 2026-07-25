import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Panel, PageHeader, SectionTitle, Stat } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Controls'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { DualTypeCalculator } from '@/components/types/DualTypeCalculator'
import { MultiplierChip } from '@/components/types/MatchupGroup'
import { TypeMatrix } from '@/components/types/TypeMatrix'
import {
  chartDifferences,
  chartForGeneration,
  typeEras,
  typesForEra,
  type ChartChange,
  type TypeEra,
} from '@/components/types/chart'
import { typeSlug, useDex } from '@/lib/dex'
import { BATTLE_TYPE_IDS } from '@/lib/game'
import type { TypeInfo } from '@/types/data'

const LEGEND = [
  { value: 2, title: 'Super effective', body: 'Double damage. Two of these stack to 4×.' },
  { value: 1, title: 'Normal damage', body: 'No modifier applied.' },
  { value: 0.5, title: 'Not very effective', body: 'Half damage. Two of these stack to ¼×.' },
  { value: 0, title: 'No effect', body: 'Immune — the move fails outright.' },
]

export default function Types() {
  const dex = useDex()
  const [params, setParams] = useSearchParams()

  const eras = useMemo(() => typeEras(dex.meta), [dex.meta])
  const currentEra = eras[eras.length - 1]
  const era = eras.find((entry) => entry.key === params.get('era')) ?? currentEra

  const chart = useMemo(() => chartForGeneration(dex.meta, era.from), [dex.meta, era.from])
  const types = useMemo(() => typesForEra(dex.meta, era), [dex.meta, era])
  const changes = useMemo(
    () =>
      era.current ? [] : chartDifferences(chart, dex.meta.typeChart, types.map((type) => type.id)),
    [chart, dex.meta.typeChart, era.current, types],
  )
  const notYetInvented = useMemo(
    () => dex.meta.types.filter((type) => BATTLE_TYPE_IDS.includes(type.id) && type.generation > era.to),
    [dex.meta.types, era.to],
  )
  const specialTypes = useMemo(
    () => dex.meta.types.filter((type) => !BATTLE_TYPE_IDS.includes(type.id)),
    [dex.meta.types],
  )

  const defending = useMemo(() => {
    const raw = params.get('def')
    if (!raw) return []
    return raw
      .split(',')
      .map((slug) => dex.typeBySlug.get(slug)?.id)
      .filter((id): id is number => typeof id === 'number')
      .slice(0, 2)
  }, [params, dex.typeBySlug])

  function patchParams(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const accentType = defending[0] ?? null

  return (
    <div
      style={
        {
          '--accent': accentType ? `var(--type-${typeSlug(accentType)})` : 'var(--type-dragon)',
        } as React.CSSProperties
      }
    >
      <PageHeader
        eyebrow={`Matchups · ${types.length} types`}
        title="Type chart"
        subtitle="Rows attack, columns defend. Every damaging move is multiplied by this table before the damage roll — a dual-type defender multiplies both of its columns together."
        actions={
          <Segmented
            options={eras.map((entry) => ({
              value: entry.key,
              label: entry.short,
              title: `${entry.label} type chart`,
            }))}
            value={era.key}
            onChange={(key) => patchParams('era', key === currentEra.key ? null : key)}
          />
        }
      >
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Era" value={era.short} hint={era.label} accent />
          <Stat label="Types" value={types.length} hint={era.current ? 'Modern roster' : 'In this era'} />
          <Stat label="Matchups" value={types.length * types.length} hint="Attack × defend pairs" />
          <Stat
            label="Changed since"
            value={era.current ? '—' : changes.length}
            hint={era.current ? 'This is the live chart' : 'Cells differing from today'}
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,auto)_minmax(300px,1fr)]">
        <Panel className="min-w-0">
          <SectionTitle eyebrow={`${era.label} · attacker → defender`}>Effectiveness matrix</SectionTitle>
          <TypeMatrix key={era.key} types={types} chart={chart} />
        </Panel>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-1">
          <Panel>
            <SectionTitle eyebrow="Reading the grid">Legend</SectionTitle>
            <ul className="space-y-2.5">
              {LEGEND.map((entry) => (
                <li key={entry.value} className="flex items-start gap-3">
                  <MultiplierChip value={entry.value} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-tight">{entry.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-dim">{entry.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line-soft pt-3 text-[11px] leading-relaxed text-faint">
              Warm cells amplify damage, cool hatched cells damp it, slashed cells nullify it — the grid
              stays readable without relying on colour alone.
            </p>
          </Panel>

          <EraNotes era={era} changes={changes} notYetInvented={notYetInvented} />

          <Panel>
            <SectionTitle eyebrow="Outside the grid">Special types</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {specialTypes.map((type) => (
                <Link
                  key={type.id}
                  to={`/types/${type.name}`}
                  className="numeric rounded-chip border border-line px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-dim transition hover:border-accent hover:text-ink"
                >
                  {type.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              These carry no efficacy rows in the dataset: Stellar only exists while Terastallised, and
              Unknown and Shadow are placeholders used by Curse and the Orre games.
            </p>
          </Panel>
        </div>
      </div>

      <Panel className="mt-4">
        <DualTypeCalculator
          types={types}
          chart={chart}
          eraLabel={era.short}
          value={defending}
          onChange={(next) =>
            patchParams('def', next.length ? next.map((id) => typeSlug(id)).join(',') : null)
          }
        />
      </Panel>
    </div>
  )
}

function EraNotes({
  era,
  changes,
  notYetInvented,
}: {
  era: TypeEra
  changes: ChartChange[]
  notYetInvented: TypeInfo[]
}) {
  const dex = useDex()

  return (
    <Panel>
      <SectionTitle eyebrow={era.current ? 'Live ruleset' : `${era.label} vs today`}>
        {era.current ? 'Current chart' : 'What changed'}
      </SectionTitle>

      {era.current ? (
        <p className="text-[13px] leading-relaxed text-dim">
          This is the chart in force since Generation VI. Switch eras above to replay the rewrites the
          series has shipped: Generation I&apos;s Bug/Poison and Ghost/Psychic quirks, and the
          Generation VI patch that stripped Steel&apos;s resistance to Ghost and Dark.
        </p>
      ) : (
        <>
          {notYetInvented.length > 0 && (
            <div className="mb-3 rounded-chip border border-line-soft bg-surface p-2.5">
              <p className="numeric mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Not invented yet
              </p>
              <div className="flex flex-wrap gap-1">
                {notYetInvented.map((type) => (
                  <TypeBadge key={type.id} typeId={type.id} label={type.label} size="sm" link={false} />
                ))}
              </div>
            </div>
          )}

          {changes.length === 0 ? (
            <p className="text-[13px] text-dim">
              Every matchup that existed in this era is identical to the modern chart.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {changes.map((change) => (
                <li
                  key={`${change.attacker}-${change.defender}`}
                  className="flex flex-wrap items-center gap-1.5 rounded-chip border border-line-soft bg-surface px-2 py-1.5"
                >
                  <TypeBadge
                    typeId={change.attacker}
                    label={dex.typeById.get(change.attacker)?.label ?? ''}
                    size="xs"
                  />
                  <span aria-hidden className="text-faint">
                    →
                  </span>
                  <TypeBadge
                    typeId={change.defender}
                    label={dex.typeById.get(change.defender)?.label ?? ''}
                    size="xs"
                  />
                  <span className="ml-auto flex items-center gap-1.5">
                    <MultiplierChip value={change.past} size="sm" />
                    <span aria-hidden className="text-faint">
                      ⇢
                    </span>
                    <span className="opacity-55">
                      <MultiplierChip value={change.present} size="sm" />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            Left chip is the {era.label} value, right chip is today&apos;s.
          </p>
        </>
      )}
    </Panel>
  )
}
