import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Chip } from '@/components/ui/Controls'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { EncounterGroup } from '@/components/locations/EncounterGroup'
import { TypeDistribution, type TypeTally } from '@/components/locations/TypeDistribution'
import { generationNumeral, regionAccent } from '@/components/locations/regions'
import { cx } from '@/lib/cx'
import type { Dex } from '@/lib/dex'
import type {
  AreaEncounterTuple,
  LocationAreaDetail,
  LocationDetail as LocationRecord,
} from '@/types/data'

const NAME_LANGUAGES = ['ja-hrkt', 'ja', 'ko', 'fr', 'de', 'es', 'it']

interface RarestCatch {
  pokemonId: number
  rarity: number
  areaLabel: string
  versionId: number
  methodId: number
  minLevel: number
  maxLevel: number
}

interface Survey {
  distinct: number
  slots: number
  versionIds: number[]
  methodIds: number[]
  minLevel: number
  maxLevel: number
  rarest: RarestCatch | null
  tallies: TypeTally[]
  dominantTypeId: number | null
}

export default function LocationDetail() {
  const { slug } = useParams<{ slug: string }>()
  const dex = useDex()
  const [params, setParams] = useSearchParams()
  const preferredVersionGroup = useApp((state) => state.preferredVersionGroup)

  const state = useAsync(slug ?? null, async () => {
    const index = await load.locationIndex()
    const entry = index.entries.find((item) => item.name === slug)
    if (!entry) return null
    return load.location(entry.id)
  })

  const record = state.data ?? undefined
  const survey = useMemo(() => (record ? buildSurvey(record, dex) : null), [record, dex])

  const versionId = useMemo(() => {
    if (!survey || survey.versionIds.length === 0) return null
    const requested = Number(params.get('v'))
    if (survey.versionIds.includes(requested)) return requested
    const preferred = survey.versionIds.find(
      (id) => dex.meta.versions.find((version) => version.id === id)?.versionGroupId === preferredVersionGroup,
    )
    return preferred ?? survey.versionIds[0]
  }, [survey, params, dex.meta.versions, preferredVersionGroup])

  const region = record?.regionId == null ? null : dex.meta.regions.find((item) => item.id === record.regionId)

  const accent =
    survey?.dominantTypeId != null
      ? `var(--type-${typeSlug(survey.dominantTypeId)})`
      : regionAccent(record?.regionId ?? null)

  if (state.loading) return <InlineLoader label="Loading location" />
  if (state.error) return <ErrorState message={state.error.message} onRetry={() => window.location.reload()} />
  if (!record || !survey) {
    return (
      <div>
        <PageHeader eyebrow="Atlas" title="Location not found" />
        <EmptyState
          title={`No location named “${slug}”`}
          hint="It may have been renamed or never existed. Browse the atlas to find it."
        />
        <div className="mt-4 flex justify-center">
          <Link to="/locations" className="rounded-chip border border-line px-4 py-2 text-sm hover:bg-raised">
            Back to locations
          </Link>
        </div>
      </div>
    )
  }

  const alternates = NAME_LANGUAGES.map((code) => record.names[code])
    .filter((value) => Boolean(value))
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 4)

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow={region ? region.label : 'Unaffiliated'}
        title={record.label}
        subtitle={alternates.length > 0 ? alternates.join(' · ') : undefined}
        actions={
          <>
            <Link
              to={region ? `/locations?region=${region.name}` : '/locations'}
              className="inline-flex h-9 items-center rounded-chip border border-line px-4 text-sm transition hover:bg-raised"
            >
              {region ? `All of ${region.label}` : 'All locations'}
            </Link>
            {survey.versionIds.length > 0 && (
              <a
                href="#encounters"
                className="inline-flex h-9 items-center rounded-chip bg-raised px-4 text-sm transition hover:bg-line"
              >
                Jump to encounters
              </a>
            )}
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {record.generationIds.map((generationId) => {
            const generation = dex.meta.generations.find((item) => item.id === generationId)
            return (
              <span
                key={generationId}
                title={generation?.label}
                className="numeric rounded-chip border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim"
              >
                Gen {generation ? generationNumeral(generation.name) : generationId}
              </span>
            )
          })}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle eyebrow="Survey">Field report</SectionTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <Stat label="Distinct Pokémon" value={survey.distinct} accent />
            <Stat label="Sub-areas" value={record.areas.length} />
            <Stat label="Encounter slots" value={survey.slots.toLocaleString()} />
            <Stat label="Games" value={survey.versionIds.length} />
            <Stat label="Methods" value={survey.methodIds.length} />
            <Stat
              label="Level band"
              value={
                survey.distinct === 0
                  ? '—'
                  : survey.minLevel === survey.maxLevel
                    ? `Lv ${survey.minLevel}`
                    : `Lv ${survey.minLevel}–${survey.maxLevel}`
              }
            />
          </div>
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Lowest slot rate">Rarest catch</SectionTitle>
          {survey.rarest ? (
            <RarestCard rarest={survey.rarest} />
          ) : (
            <p className="text-sm text-dim">No wild encounters are recorded here.</p>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionTitle
            eyebrow="Ecology"
            actions={
              <span className="numeric text-[11px] text-faint">{survey.tallies.length} types</span>
            }
          >
            Type distribution
          </SectionTitle>
          {survey.tallies.length > 0 ? (
            <TypeDistribution tallies={survey.tallies} />
          ) : (
            <p className="text-sm text-dim">Nothing has been catalogued here yet.</p>
          )}
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Internal">Game indices</SectionTitle>
          {record.gameIndices.length > 0 ? (
            <ul className="divide-y divide-line-soft">
              {record.gameIndices.map((index) => {
                const generation = dex.meta.generations.find((item) => item.id === index.generationId)
                return (
                  <li
                    key={`${index.generationId}-${index.gameIndex}`}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <span className="truncate text-[13px] text-dim">{generation?.label ?? `Gen ${index.generationId}`}</span>
                    <span className="numeric text-[13px] font-semibold">{index.gameIndex}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-dim">This location carries no internal game index.</p>
          )}
        </Panel>
      </div>

      <section id="encounters" className="mt-8 scroll-mt-20">
        <SectionTitle
          eyebrow="Wild encounters"
          actions={
            versionId !== null ? (
              <span className="numeric text-[11px] text-faint">
                {countSpecies(record.areas, versionId)} species in this game
              </span>
            ) : undefined
          }
        >
          Encounter tables
        </SectionTitle>

        {survey.versionIds.length === 0 ? (
          <EmptyState
            title="No wild encounters recorded"
            hint="This location exists in the games but no Pokémon are catalogued as appearing here."
          />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-1.5">
              {survey.versionIds.map((id) => (
                <Chip
                  key={id}
                  active={id === versionId}
                  onClick={() =>
                    setParams(
                      (previous) => {
                        const next = new URLSearchParams(previous)
                        next.set('v', String(id))
                        return next
                      },
                      { replace: true },
                    )
                  }
                >
                  {dex.meta.versions.find((version) => version.id === id)?.label ?? `Version ${id}`}
                </Chip>
              ))}
            </div>

            <div className="space-y-4">
              {record.areas.map((area) => (
                <AreaPanel key={area.id} area={area} versionId={versionId} locationLabel={record.label} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function RarestCard({ rarest }: { rarest: RarestCatch }) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const entry = dex.byId.get(rarest.pokemonId)

  return (
    <div className="flex items-center gap-4">
      <Sprite
        sources={spriteSources(rarest.pokemonId, spriteStyle, shiny)}
        alt={entry?.label ?? `Pokémon ${rarest.pokemonId}`}
        className="h-20 w-20 shrink-0"
        pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
      />
      <div className="min-w-0">
        <p className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
          {entry ? formatDex(entry.dex) : `#${rarest.pokemonId}`}
        </p>
        {entry ? (
          <Link
            to={`/pokemon/${entry.name}`}
            className="block truncate font-display text-lg font-semibold leading-tight hover:text-accent"
          >
            {entry.label}
          </Link>
        ) : (
          <p className="truncate font-display text-lg font-semibold leading-tight">#{rarest.pokemonId}</p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {entry?.types.map((typeId) => (
            <TypeBadge key={typeId} typeId={typeId} label={dex.typeById.get(typeId)?.label ?? ''} size="xs" />
          ))}
        </div>
        <p className="numeric mt-2 text-[11px] text-dim">
          <span className="font-bold text-accent">{rarest.rarity}%</span> · Lv{' '}
          {rarest.minLevel === rarest.maxLevel ? rarest.minLevel : `${rarest.minLevel}–${rarest.maxLevel}`}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-faint" title={rarest.areaLabel}>
          {dex.nameOf('encounterMethods', rarest.methodId)}
        </p>
      </div>
    </div>
  )
}

function AreaPanel({
  area,
  versionId,
  locationLabel,
}: {
  area: LocationAreaDetail
  versionId: number | null
  locationLabel: string
}) {
  const dex = useDex()

  const groups = useMemo(() => groupByMethod(area, versionId, dex), [area, versionId, dex])
  const rateRows = useMemo(() => sortedRates(area, dex), [area, dex])
  const species = useMemo(
    () => new Set(groups.flatMap((group) => group.rows.map((row) => row[0]))).size,
    [groups],
  )

  return (
    <Panel padded={false}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">Area</p>
          <h3 className="truncate font-display text-[15px] font-semibold leading-tight">
            {area.label === locationLabel ? `${area.label} (main)` : area.label}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
            Species <span className="text-dim">{species}</span>
          </span>
          <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
            Methods <span className="text-dim">{groups.length}</span>
          </span>
        </div>
      </header>

      <div className="p-4">
        {groups.length === 0 ? (
          <p className="py-4 text-center text-sm text-dim">
            Nothing appears in this area in the selected game.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {groups.map((group) => (
              <EncounterGroup
                key={group.methodId}
                methodId={group.methodId}
                rows={group.rows}
                rate={group.rate}
              />
            ))}
          </div>
        )}

        {rateRows.length > 0 && (
          <details className="mt-4 rounded-plate border border-line-soft">
            <summary className="cursor-pointer select-none px-3 py-2 font-display text-[12px] font-medium text-dim transition hover:text-ink">
              Encounter rates across every game ({rateRows.length})
            </summary>
            <div className="overflow-x-auto border-t border-line-soft">
              <table className="w-full min-w-[360px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line-soft bg-surface">
                    <th className="numeric px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                      Game
                    </th>
                    <th className="numeric px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                      Method
                    </th>
                    <th className="numeric px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rateRows.map((rate) => (
                    <tr
                      key={`${rate.versionId}-${rate.methodId}`}
                      className={cx(
                        'border-b border-line-soft last:border-0',
                        rate.versionId === versionId &&
                          'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]',
                      )}
                    >
                      <td className="whitespace-nowrap px-3 py-1.5 text-[12px]">
                        {dex.nameOf('versions', rate.versionId)}
                      </td>
                      <td className="px-3 py-1.5 text-[12px] text-dim">
                        {dex.nameOf('encounterMethods', rate.methodId)}
                      </td>
                      <td className="numeric px-3 py-1.5 text-right text-[12px] font-semibold">{rate.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>
    </Panel>
  )
}

/// Aggregates every area of a location into the headline numbers shown above the encounter tables.
function buildSurvey(record: LocationRecord, dex: Dex): Survey {
  const distinct = new Set<number>()
  const versions = new Set<number>()
  const methods = new Set<number>()
  const typeCounts = new Map<number, number>()
  let slots = 0
  let minLevel = Infinity
  let maxLevel = 0
  let rarest: RarestCatch | null = null

  for (const area of record.areas) {
    for (const [pokemonId, min, max, rarity, methodId, versionId] of area.encounters) {
      slots += 1
      versions.add(versionId)
      methods.add(methodId)
      minLevel = Math.min(minLevel, min)
      maxLevel = Math.max(maxLevel, max)
      if (!distinct.has(pokemonId)) {
        distinct.add(pokemonId)
        for (const typeId of dex.byId.get(pokemonId)?.types ?? []) {
          typeCounts.set(typeId, (typeCounts.get(typeId) ?? 0) + 1)
        }
      }
      if (!rarest || rarity < rarest.rarity) {
        rarest = {
          pokemonId,
          rarity,
          areaLabel: area.label,
          versionId,
          methodId,
          minLevel: min,
          maxLevel: max,
        }
      }
    }
  }

  const tallies = [...typeCounts.entries()]
    .map(([typeId, count]) => ({ typeId, count }))
    .sort((a, b) => b.count - a.count || a.typeId - b.typeId)

  return {
    distinct: distinct.size,
    slots,
    versionIds: [...versions].sort((a, b) => a - b),
    methodIds: [...methods],
    minLevel: minLevel === Infinity ? 0 : minLevel,
    maxLevel,
    rarest,
    tallies,
    dominantTypeId: tallies[0]?.typeId ?? null,
  }
}

interface MethodGroup {
  methodId: number
  rows: AreaEncounterTuple[]
  rate: number | null
}

/// Splits one area's encounters for a single game into method buckets, rarest slot last.
function groupByMethod(area: LocationAreaDetail, versionId: number | null, dex: Dex): MethodGroup[] {
  if (versionId === null) return []
  const buckets = new Map<number, AreaEncounterTuple[]>()
  for (const row of area.encounters) {
    if (row[5] !== versionId) continue
    const bucket = buckets.get(row[4])
    if (bucket) bucket.push(row)
    else buckets.set(row[4], [row])
  }

  const order = new Map(dex.meta.encounterMethods.map((method) => [method.id, method.order]))
  return [...buckets.entries()]
    .map(([methodId, rows]) => ({
      methodId,
      rows: [...rows].sort((a, b) => b[3] - a[3] || a[1] - b[1] || a[0] - b[0]),
      rate:
        area.encounterRates.find((entry) => entry.versionId === versionId && entry.methodId === methodId)
          ?.rate ?? null,
    }))
    .sort((a, b) => (order.get(a.methodId) ?? 999) - (order.get(b.methodId) ?? 999))
}

function sortedRates(area: LocationAreaDetail, dex: Dex) {
  const order = new Map(dex.meta.encounterMethods.map((method) => [method.id, method.order]))
  return [...area.encounterRates].sort(
    (a, b) =>
      a.versionId - b.versionId || (order.get(a.methodId) ?? 999) - (order.get(b.methodId) ?? 999),
  )
}

function countSpecies(areas: LocationAreaDetail[], versionId: number): number {
  const seen = new Set<number>()
  for (const area of areas) {
    for (const row of area.encounters) {
      if (row[5] === versionId) seen.add(row[0])
    }
  }
  return seen.size
}
