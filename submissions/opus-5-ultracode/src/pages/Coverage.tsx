import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Panel, PageHeader, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { Button, Chip } from '@/components/ui/Controls'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Sprite } from '@/components/ui/Sprite'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { PokemonPicker } from '@/components/calc/PokemonPicker'
import { MicroLabel } from '@/components/calc/Fields'
import { CoverageMatrix } from '@/components/coverage/CoverageMatrix'
import { analyseCoverage, suggestAdditions, typingKey, type CoverageRow } from '@/components/coverage/analysis'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { thumbCandidates } from '@/lib/sprites'
import { BATTLE_TYPE_IDS, DAMAGE_CLASS, effectivenessLabel } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry } from '@/types/data'

const MAX_TYPES = 8
const DEFAULT_TYPES = ['fire', 'water', 'grass']
const PERFECT_TYPES = ['fire', 'ice', 'ground']
const TOTAL_TYPINGS = 171
const VISIBLE_HOLES = 24
const SPECIES_PER_HOLE = 6

export default function Coverage() {
  const dex = useDex()
  const [params, setParams] = useSearchParams()
  const [showAllHoles, setShowAllHoles] = useState(false)

  const selected = useMemo(() => {
    const raw = params.get('types')
    const slugs = raw === null ? DEFAULT_TYPES : raw.split(',').filter(Boolean)
    const ids: number[] = []
    for (const slug of slugs) {
      const id = dex.typeBySlug.get(slug)?.id
      if (id && BATTLE_TYPE_IDS.includes(id) && !ids.includes(id)) ids.push(id)
    }
    return ids.slice(0, MAX_TYPES)
  }, [params, dex.typeBySlug])

  const setSelected = (ids: number[]) => {
    const next = new URLSearchParams(params)
    next.set('types', ids.map((id) => typeSlug(id)).join(','))
    setParams(next, { replace: true })
  }

  const toggleType = (typeId: number) => {
    if (selected.includes(typeId)) setSelected(selected.filter((id) => id !== typeId))
    else if (selected.length < MAX_TYPES) setSelected([...selected, typeId])
  }

  const source = dex.bySlug.get(params.get('from') ?? '') ?? null
  const sourceDetail = useAsync(source ? `pokemon/${source.id}` : null, () => load.pokemon(source!.id))
  const moveIndex = useAsync(source ? 'moves-index' : null, () => load.moveIndex())

  const sourceTypes = useMemo(() => {
    if (!sourceDetail.data || !moveIndex.data) return []
    const moveById = new Map(moveIndex.data.entries.map((move) => [move.id, move]))
    const buckets = new Map<number, { count: number; maxPower: number }>()
    const seen = new Set<number>()
    for (const tuple of sourceDetail.data.moves) {
      if (seen.has(tuple[0])) continue
      seen.add(tuple[0])
      const move = moveById.get(tuple[0])
      if (!move || move.damageClassId === DAMAGE_CLASS.status) continue
      const bucket = buckets.get(move.typeId) ?? { count: 0, maxPower: 0 }
      bucket.count++
      bucket.maxPower = Math.max(bucket.maxPower, move.power ?? 0)
      buckets.set(move.typeId, bucket)
    }
    return [...buckets.entries()]
      .map(([typeId, bucket]) => ({ typeId, ...bucket }))
      .sort((a, b) => b.maxPower - a.maxPower || b.count - a.count)
  }, [sourceDetail.data, moveIndex.data])

  const speciesByTyping = useMemo(() => {
    const map = new Map<string, PokemonIndexEntry[]>()
    for (const entry of dex.entries) {
      if (!entry.isDefault || entry.types.length === 0) continue
      const key = typingKey(entry.types)
      const list = map.get(key)
      if (list) list.push(entry)
      else map.set(key, [entry])
    }
    return map
  }, [dex.entries])

  const speciesCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const [key, list] of speciesByTyping) map.set(key, list.length)
    return map
  }, [speciesByTyping])

  const report = useMemo(
    () => analyseCoverage(dex.meta.typeChart, selected, speciesCounts),
    [dex.meta.typeChart, selected, speciesCounts],
  )

  const suggestions = useMemo(
    () => (selected.length === 0 ? [] : suggestAdditions(dex.meta.typeChart, selected, report.holes)),
    [dex.meta.typeChart, selected, report.holes],
  )

  const accent = `var(--type-${typeSlug(selected[0] ?? 1)})`
  const coveragePercent = (report.neutral / TOTAL_TYPINGS) * 100
  const speciesPercent = report.speciesTotal > 0 ? (report.speciesCovered / report.speciesTotal) * 100 : 0
  const visibleHoles = showAllHoles ? report.holes : report.holes.slice(0, VISIBLE_HOLES)

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow="Offensive analysis"
        title="Type Coverage"
        subtitle="Pick the attacking types on your team and see exactly which of the 171 possible defensive typings shrug them off."
        actions={
          <>
            <Button variant="ghost" onClick={() => setSelected([])}>
              Clear
            </Button>
            <Button
              variant="soft"
              title="Fire · Ice · Ground reaches all 171 typings for neutral damage or better"
              onClick={() => setSelected(PERFECT_TYPES.map((slug) => dex.typeBySlug.get(slug)!.id))}
            >
              Perfect three
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <Panel>
          <SectionTitle
            eyebrow="Move types"
            actions={
              <span className="numeric text-[11px] text-faint">
                {selected.length} / {MAX_TYPES}
              </span>
            }
          >
            Attacking set
          </SectionTitle>

          <div className="flex flex-wrap gap-1.5">
            {BATTLE_TYPE_IDS.map((typeId) => {
              const active = selected.includes(typeId)
              return (
                <Chip
                  key={typeId}
                  active={active}
                  color={`var(--type-${typeSlug(typeId)})`}
                  disabled={!active && selected.length >= MAX_TYPES}
                  onClick={() => toggleType(typeId)}
                >
                  {dex.typeById.get(typeId)?.label}
                </Chip>
              )
            })}
          </div>

          {selected.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-4 sm:grid-cols-4">
              <Metric
                label="Typings hit"
                value={`${report.neutral} / ${TOTAL_TYPINGS}`}
                hint={`${coveragePercent.toFixed(1)}% at neutral or better`}
                accent
              />
              <Metric
                label="Super-effective"
                value={String(report.superEffective)}
                hint={`${((report.superEffective / TOTAL_TYPINGS) * 100).toFixed(1)}% of typings`}
              />
              <Metric
                label="Holes"
                value={String(report.holes.length)}
                hint={`${report.holes.filter((hole) => hole.best === 0).length} outright immune`}
              />
              <Metric
                label="Species reached"
                value={`${speciesPercent.toFixed(1)}%`}
                hint={`${report.speciesCovered} of ${report.speciesTotal} species`}
              />
            </div>
          )}
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Shortcut">Pull types from a Pokémon</SectionTitle>
          <PokemonPicker
            label="Source Pokémon"
            size="sm"
            value={source}
            onSelect={(entry) => {
              const next = new URLSearchParams(params)
              next.set('from', entry.name)
              setParams(next, { replace: true })
            }}
          />

          {source && (sourceDetail.loading || moveIndex.loading) && <InlineLoader label="Reading learnset" />}
          {source && sourceDetail.error && <ErrorState message={sourceDetail.error.message} />}

          {sourceTypes.length > 0 && (
            <>
              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                {source?.label} can learn damaging moves of {sourceTypes.length} types. Ordered by the strongest
                move available in each — tap to add, or take the top {MAX_TYPES}.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sourceTypes.map((entry) => (
                  <Chip
                    key={entry.typeId}
                    active={selected.includes(entry.typeId)}
                    color={`var(--type-${typeSlug(entry.typeId)})`}
                    onClick={() => toggleType(entry.typeId)}
                    title={`${entry.count} moves · best power ${entry.maxPower || '—'}`}
                  >
                    {dex.typeById.get(entry.typeId)?.label}
                    <span className="numeric opacity-70">{entry.maxPower || '—'}</span>
                  </Chip>
                ))}
              </div>
              <Button
                className="mt-3"
                variant="soft"
                onClick={() => setSelected(sourceTypes.slice(0, MAX_TYPES).map((entry) => entry.typeId))}
              >
                Use top {MAX_TYPES}
              </Button>
            </>
          )}

          {!source && (
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              Loads that Pokémon's full learnset and ranks every attacking type it can reach by best base
              power.
            </p>
          )}
        </Panel>
      </div>

      {selected.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No attacking types selected"
            hint="Choose up to eight move types, or pull them from a Pokémon's learnset, to map the holes in your coverage."
          />
        </div>
      ) : (
        <>
          <Panel className="mt-4">
            <SectionTitle eyebrow="Every defensive typing">Coverage matrix</SectionTitle>
            <CoverageMatrix byKey={report.byKey} />
          </Panel>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel>
              <SectionTitle
                eyebrow="Holes"
                actions={
                  report.holes.length > VISIBLE_HOLES && (
                    <Button size="sm" variant="ghost" onClick={() => setShowAllHoles((current) => !current)}>
                      {showAllHoles ? 'Show top 24' : `Show all ${report.holes.length}`}
                    </Button>
                  )
                }
              >
                Typings that resist everything you have
              </SectionTitle>

              {report.holes.length === 0 ? (
                <p className="text-sm text-dim">
                  Perfect coverage — every one of the {TOTAL_TYPINGS} typings takes at least neutral damage.
                </p>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {visibleHoles.map((hole) => (
                    <HoleRow key={hole.typing.key} hole={hole} species={speciesByTyping.get(hole.typing.key) ?? []} />
                  ))}
                </ul>
              )}
            </Panel>

            <Panel>
              <SectionTitle eyebrow="Suggestion engine">One more move type</SectionTitle>
              {suggestions.length === 0 || report.holes.length === 0 ? (
                <p className="text-sm text-dim">Nothing left to patch.</p>
              ) : (
                <>
                  <p className="mb-3 text-[12px] leading-relaxed text-dim">
                    Adding{' '}
                    <strong className="text-ink">{dex.typeById.get(suggestions[0].typeId)?.label}</strong> closes{' '}
                    <strong className="text-ink">{suggestions[0].holesClosed}</strong> of{' '}
                    {report.holes.length} holes and reaches {suggestions[0].speciesClosed} more species.
                  </p>
                  <ul className="space-y-1.5">
                    {suggestions.map((suggestion) => {
                      const share =
                        report.holes.length > 0 ? suggestion.holesClosed / report.holes.length : 0
                      return (
                        <li
                          key={suggestion.typeId}
                          className="grid grid-cols-[78px_1fr_58px] items-center gap-2"
                        >
                          <TypeBadge
                            typeId={suggestion.typeId}
                            label={dex.typeById.get(suggestion.typeId)?.label ?? ''}
                            size="xs"
                            link={false}
                            className="w-full"
                          />
                          <button
                            type="button"
                            onClick={() => toggleType(suggestion.typeId)}
                            disabled={selected.length >= MAX_TYPES}
                            aria-label={`Add ${dex.typeById.get(suggestion.typeId)?.label} to the set`}
                            title={`Closes ${suggestion.holesClosed} holes · ${suggestion.superEffective} super-effective`}
                            className="relative h-2 overflow-hidden rounded-full bg-raised disabled:cursor-not-allowed"
                          >
                            <span
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                width: `${share * 100}%`,
                                background: `var(--type-${typeSlug(suggestion.typeId)})`,
                              }}
                            />
                          </button>
                          <span className="numeric text-right text-[11px] text-dim">
                            {suggestion.holesClosed}
                            <span className="text-faint"> / {report.holes.length}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="mt-3 text-[11px] leading-relaxed text-faint">
                    A hole counts as closed once the new type hits it for neutral damage or better. Species
                    figures weight each typing by how many default-form Pokémon actually use it.
                  </p>
                </>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div className="min-w-0">
      <MicroLabel>{label}</MicroLabel>
      <p className={cx('numeric mt-1 text-xl font-bold leading-none', accent && 'text-accent')}>{value}</p>
      <p className="numeric mt-1 truncate text-[11px] text-faint">{hint}</p>
    </div>
  )
}

function HoleRow({ hole, species }: { hole: CoverageRow; species: PokemonIndexEntry[] }) {
  const dex = useDex()
  const shown = species.slice(0, SPECIES_PER_HOLE)

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
      <span className="flex w-[132px] shrink-0 flex-wrap gap-1">
        {hole.typing.types.map((typeId) => (
          <TypeBadge key={typeId} typeId={typeId} label={dex.typeById.get(typeId)?.label ?? ''} size="xs" />
        ))}
      </span>
      <span
        className={cx(
          'numeric w-8 shrink-0 text-[12px] font-semibold',
          hole.best === 0 ? 'text-[var(--type-fighting)]' : 'text-dim',
        )}
      >
        {effectivenessLabel(hole.best)}
      </span>
      <span className="numeric w-16 shrink-0 text-[11px] text-faint">
        {hole.speciesCount} {hole.speciesCount === 1 ? 'species' : 'species'}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {shown.map((entry) => (
          <Link
            key={entry.id}
            to={`/pokemon/${entry.name}`}
            className="flex min-w-0 max-w-full items-center gap-1 rounded-chip border border-line-soft bg-surface py-0.5 pl-0.5 pr-1.5 text-[11px] text-dim transition hover:border-line hover:text-ink"
          >
            <Sprite sources={thumbCandidates(entry.id, false)} alt="" className="h-5 w-5 shrink-0" />
            <span className="min-w-0 truncate">{entry.label}</span>
          </Link>
        ))}
        {species.length > shown.length && (
          <span className="numeric text-[11px] text-faint">+{species.length - shown.length} more</span>
        )}
        {species.length === 0 && <span className="text-[11px] text-faint">No species uses this typing</span>}
      </span>
    </li>
  )
}
