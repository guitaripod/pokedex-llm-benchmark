import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle } from '@/components/ui/Panel'
import { Button, Skeleton } from '@/components/ui/Controls'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import {
  ComparisonGrid,
  type ComparisonColumn,
  type ComparisonRow,
} from '@/components/compare/ComparisonGrid'
import { DefenceMatrix } from '@/components/compare/DefenceMatrix'
import { PokemonPicker } from '@/components/compare/PokemonPicker'
import { StatRadar, type RadarSeries } from '@/components/compare/StatRadar'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp, type SpriteStyle } from '@/lib/store'
import {
  STAT_KEYS,
  STAT_LABELS,
  defenseProfile,
  eggSteps,
  formatDex,
  formatHeight,
  formatWeight,
  genderRatio,
} from '@/lib/game'
import { cx } from '@/lib/cx'
import type { AbilityIndexEntry, PokemonIndexEntry } from '@/types/data'

const MAX_SLOTS = 6
const DASH_PATTERNS = ['7 4', '2 3', '11 4', '4 3 1 3']

/// Primary-type colour used to tint a Pokémon's series, card and highlights.
function typeColor(entry: PokemonIndexEntry): string {
  return `var(--type-${typeSlug(entry.types[0] ?? 1)})`
}

/// Reads `?ids=1,4,7` into a validated, de-duplicated, slot-capped selection.
function parseIds(raw: string | null, known: Map<number, PokemonIndexEntry>): number[] {
  if (!raw) return []
  const seen = new Set<number>()
  const ids: number[] = []
  for (const part of raw.split(',')) {
    const id = Number(part.trim())
    if (!Number.isFinite(id) || seen.has(id) || !known.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length === MAX_SLOTS) break
  }
  return ids
}

/// Restates a decimetre/hectogram gap in the metric unit the cell above it displays.
function tenthsDelta(delta: number, unit: string): string {
  const value = delta / 10
  return `${value > 0 ? '+' : ''}${value.toFixed(1)} ${unit}`
}

interface Superlative {
  winners: PokemonIndexEntry[]
  best: number
  gap: number | null
}

/// Collects every entry tied at the top of a score, plus the margin over the runner-up.
function bestOf(entries: PokemonIndexEntry[], score: (entry: PokemonIndexEntry) => number): Superlative {
  const scores = entries.map(score)
  const best = Math.max(...scores)
  const winners = entries.filter((_, index) => scores[index] === best)
  const rest = scores.filter((value) => value !== best)
  return { winners, best, gap: rest.length > 0 ? best - Math.max(...rest) : null }
}

export default function Compare() {
  const dex = useDex()
  const compare = useApp((state) => state.compare)
  const toggleCompare = useApp((state) => state.toggleCompare)
  const clearCompare = useApp((state) => state.clearCompare)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const shiny = useApp((state) => state.shiny)

  const [searchParams, setSearchParams] = useSearchParams()
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      const requested = parseIds(searchParams.get('ids'), dex.byId)
      if (requested.length > 0 && requested.join(',') !== compare.join(',')) {
        useApp.setState({ compare: requested })
        return
      }
    }
    const next = compare.join(',')
    if ((searchParams.get('ids') ?? '') === next) return
    const params = new URLSearchParams(searchParams)
    if (next) params.set('ids', next)
    else params.delete('ids')
    setSearchParams(params, { replace: true })
  }, [compare, dex.byId, searchParams, setSearchParams])

  const entries = useMemo(
    () =>
      compare
        .map((id) => dex.byId.get(id))
        .filter((entry): entry is PokemonIndexEntry => entry !== undefined),
    [compare, dex.byId],
  )

  const abilityIndex = useAsync('abilities-index', load.abilityIndex)
  const abilityById = useMemo(() => {
    const map = new Map<number, AbilityIndexEntry>()
    for (const ability of abilityIndex.data?.entries ?? []) map.set(ability.id, ability)
    return map
  }, [abilityIndex.data])

  const series = useMemo<RadarSeries[]>(() => {
    const usage = new Map<string, number>()
    return entries.map((entry) => {
      const color = typeColor(entry)
      const seen = usage.get(color) ?? 0
      usage.set(color, seen + 1)
      return {
        id: entry.id,
        label: entry.label,
        color,
        dash: seen > 0 ? DASH_PATTERNS[(seen - 1) % DASH_PATTERNS.length] : undefined,
        stats: entry.stats,
      }
    })
  }, [entries])

  const columns = useMemo<ComparisonColumn[]>(
    () =>
      entries.map((entry) => ({
        key: entry.id,
        header: (
          <span className="flex flex-col items-center gap-1">
            <Sprite
              sources={spriteSources(entry.id, spriteStyle, shiny)}
              alt={entry.label}
              className="h-12 w-12"
              pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
            />
            <Link
              to={`/pokemon/${entry.name}`}
              className="numeric max-w-[132px] truncate font-display text-[12px] font-semibold transition hover:text-accent"
              title={entry.label}
            >
              {entry.label}
            </Link>
            <span className="flex flex-wrap justify-center gap-1">
              {entry.types.map((typeId) => (
                <TypeBadge
                  key={typeId}
                  typeId={typeId}
                  label={dex.typeById.get(typeId)?.label ?? ''}
                  size="xs"
                  link={false}
                />
              ))}
            </span>
          </span>
        ),
      })),
    [dex.typeById, entries, shiny, spriteStyle],
  )

  const rows = useMemo<ComparisonRow[]>(() => {
    if (entries.length === 0) return []

    const statRows: ComparisonRow[] = STAT_LABELS.map((label, index) => ({
      key: STAT_KEYS[index],
      label,
      color: `var(--stat-${STAT_KEYS[index]})`,
      better: 'high',
      values: entries.map((entry) => entry.stats[index]),
      cells: entries.map((entry) => (
        <span key={entry.id} className="numeric text-[15px] font-semibold">
          {entry.stats[index]}
        </span>
      )),
    }))

    return [
      ...statRows,
      {
        key: 'bst',
        label: 'Total',
        hint: 'BST',
        color: 'var(--accent)',
        better: 'high',
        values: entries.map((entry) => entry.bst),
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[15px] font-bold">
            {entry.bst}
          </span>
        )),
      },
      {
        key: 'height',
        label: 'Height',
        hint: 'tallest',
        better: 'high',
        values: entries.map((entry) => entry.height),
        formatDelta: (delta) => tenthsDelta(delta, 'm'),
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[12px] text-dim">
            {formatHeight(entry.height)}
          </span>
        )),
      },
      {
        key: 'weight',
        label: 'Weight',
        hint: 'heaviest',
        better: 'high',
        values: entries.map((entry) => entry.weight),
        formatDelta: (delta) => tenthsDelta(delta, 'kg'),
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[12px] text-dim">
            {formatWeight(entry.weight)}
          </span>
        )),
      },
      {
        key: 'base-exp',
        label: 'Base exp',
        hint: 'yield',
        better: 'high',
        values: entries.map((entry) => (entry.baseExp > 0 ? entry.baseExp : null)),
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[13px]">
            {entry.baseExp > 0 ? entry.baseExp : '—'}
          </span>
        )),
      },
      {
        key: 'capture-rate',
        label: 'Capture rate',
        hint: 'easier',
        better: 'high',
        values: entries.map((entry) => entry.captureRate),
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[13px]">
            {entry.captureRate}
            <span className="text-faint"> /255</span>
          </span>
        )),
      },
      {
        key: 'base-happiness',
        label: 'Happiness',
        better: 'high',
        values: entries.map((entry) => entry.baseHappiness),
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[13px]">
            {entry.baseHappiness}
          </span>
        )),
      },
      {
        key: 'egg-steps',
        label: 'Egg steps',
        hint: 'fewer',
        better: 'low',
        values: entries.map((entry) => eggSteps(entry.hatchCounter)),
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[13px]">
            {eggSteps(entry.hatchCounter).toLocaleString()}
          </span>
        )),
      },
      {
        key: 'growth-rate',
        label: 'Growth rate',
        cells: entries.map((entry) => (
          <span key={entry.id} className="text-[12px] text-dim">
            {dex.nameOf('growthRates', entry.growthRateId)}
          </span>
        )),
      },
      {
        key: 'gender',
        label: 'Gender',
        cells: entries.map((entry) => {
          const ratio = genderRatio(entry.genderRate)
          return (
            <span key={entry.id} className="numeric text-[12px] text-dim">
              {ratio ? `♂ ${ratio.male}% · ♀ ${ratio.female}%` : 'Genderless'}
            </span>
          )
        }),
      },
      {
        key: 'egg-groups',
        label: 'Egg groups',
        cells: entries.map((entry) => (
          <span key={entry.id} className="flex flex-wrap gap-1">
            {entry.eggGroups.length === 0 ? (
              <span className="text-[12px] text-faint">—</span>
            ) : (
              entry.eggGroups.map((groupId) => (
                <span key={groupId} className="rounded-chip bg-raised px-1.5 py-0.5 text-[10px] text-dim">
                  {dex.nameOf('eggGroups', groupId)}
                </span>
              ))
            )}
          </span>
        )),
      },
      {
        key: 'abilities',
        label: 'Abilities',
        cells: entries.map((entry) => (
          <AbilityList
            key={entry.id}
            slots={entry.abilities}
            abilityById={abilityById}
            loading={abilityIndex.loading}
            failed={Boolean(abilityIndex.error)}
          />
        )),
      },
      {
        key: 'generation',
        label: 'Generation',
        cells: entries.map((entry) => (
          <span key={entry.id} className="numeric text-[12px] text-dim">
            {dex.nameOf('generations', entry.generation)}
          </span>
        )),
      },
      {
        key: 'traits',
        label: 'Traits',
        cells: entries.map((entry) => <TraitList key={entry.id} entry={entry} />),
      },
    ]
  }, [abilityById, abilityIndex.error, abilityIndex.loading, dex, entries])

  const verdicts = useMemo(() => {
    if (entries.length < 2) return []
    const fastest = bestOf(entries, (entry) => entry.stats[5])
    const bulkiest = bestOf(entries, (entry) => entry.stats[0] + entry.stats[2] + entry.stats[4])
    const attacker = bestOf(entries, (entry) => Math.max(entry.stats[1], entry.stats[3]))
    const total = bestOf(entries, (entry) => entry.bst)
    const sturdy = bestOf(entries, (entry) => {
      const profile = defenseProfile(dex.meta.typeChart, entry.types)
      return profile.resistances.length + profile.immunities.length * 2 - profile.weaknesses.length * 3
    })

    return [
      {
        key: 'speed',
        label: 'Fastest',
        hint: 'Base Speed',
        result: fastest,
        display: String(fastest.best),
      },
      {
        key: 'bulk',
        label: 'Bulkiest',
        hint: 'HP + Def + Sp. Def',
        result: bulkiest,
        display: String(bulkiest.best),
      },
      {
        key: 'attacker',
        label: 'Strongest attacker',
        hint: 'Higher of Atk / Sp. Atk',
        result: attacker,
        display: String(attacker.best),
      },
      {
        key: 'bst',
        label: 'Highest total',
        hint: 'Base stat total',
        result: total,
        display: String(total.best),
      },
      {
        key: 'typing',
        label: 'Best typing',
        hint: 'Resists and immunities minus weaknesses',
        result: sturdy,
        display: sturdy.best > 0 ? `+${sturdy.best}` : String(sturdy.best),
      },
    ]
  }, [dex.meta.typeChart, entries])

  const accent = entries.length > 0 ? typeColor(entries[0]) : 'var(--type-normal)'

  const copyLink = () => {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      })
      .catch(() => setCopied(false))
  }

  return (
    <div style={{ '--accent': accent } as CSSProperties}>
      <PageHeader
        eyebrow="Analysis"
        title="Compare"
        subtitle="Overlay up to six Pokémon: base stats on a shared radar, every species attribute side by side, and the defensive matchups that decide who covers whom."
        actions={
          <>
            <span className="numeric hidden text-[11px] uppercase tracking-[0.16em] text-faint sm:inline">
              {entries.length} / {MAX_SLOTS} slots
            </span>
            <Button size="sm" onClick={copyLink} disabled={entries.length === 0}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button size="sm" variant="danger" onClick={clearCompare} disabled={entries.length === 0}>
              Clear
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        <div id="compare-picker" className="scroll-mt-20">
          <Panel>
            <SectionTitle eyebrow="Selection">Add Pokémon</SectionTitle>
            <PokemonPicker
              selected={compare}
              onToggle={toggleCompare}
              full={compare.length >= MAX_SLOTS}
              suggest={entries.length === 0}
            />
          </Panel>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            title="Nothing selected yet"
            hint="Search above, or add Pokémon from anywhere in the dex. Every comparison is shareable — the selected ids live in the page URL."
          />
        ) : (
          <>
            <Panel>
              <SectionTitle
                eyebrow="Roster"
                actions={
                  <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
                    {entries.length} selected
                  </span>
                }
              >
                Line-up
              </SectionTitle>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <RosterCard
                      entry={entry}
                      spriteStyle={spriteStyle}
                      shiny={shiny}
                      onRemove={() => toggleCompare(entry.id)}
                      typeLabel={(typeId) => dex.typeById.get(typeId)?.label ?? ''}
                    />
                  </li>
                ))}
                {Array.from({ length: MAX_SLOTS - entries.length }).map((_, index) => (
                  <li key={`slot-${entries.length + index}`}>
                    <a
                      href="#compare-picker"
                      className="flex h-full min-h-[152px] flex-col items-center justify-center gap-1 rounded-plate border border-dashed border-line text-faint transition hover:border-accent hover:text-accent"
                    >
                      <span aria-hidden className="text-lg leading-none">
                        +
                      </span>
                      <span className="numeric text-[10px] uppercase tracking-[0.16em]">
                        Slot {entries.length + index + 1}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <Panel>
                <SectionTitle
                  eyebrow="Base stats"
                  actions={
                    <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
                      Tap a name to isolate
                    </span>
                  }
                >
                  Stat radar
                </SectionTitle>
                <StatRadar series={series} focusedId={focusedId} onFocus={setFocusedId} />
              </Panel>

              <Panel>
                <SectionTitle eyebrow="Head to head">Verdicts</SectionTitle>
                {verdicts.length === 0 ? (
                  <p className="text-sm text-dim">
                    Add a second Pokémon to run head-to-head verdicts.
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                    {verdicts.map((verdict) => (
                      <li key={verdict.key}>
                        <VerdictCard
                          label={verdict.label}
                          hint={verdict.hint}
                          winners={verdict.result.winners}
                          display={verdict.display}
                          gap={verdict.result.gap}
                          spriteStyle={spriteStyle}
                          shiny={shiny}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <Panel>
              <SectionTitle
                eyebrow="Attributes"
                actions={
                  abilityIndex.error ? (
                    <span className="text-[11px] text-[var(--type-fighting)]">
                      Ability names unavailable
                    </span>
                  ) : undefined
                }
              >
                Full comparison
              </SectionTitle>
              <ComparisonGrid columns={columns} rows={rows} />
            </Panel>

            <Panel>
              <SectionTitle
                eyebrow="Defence"
                actions={
                  <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
                    Damage taken
                  </span>
                }
              >
                Type matchups
              </SectionTitle>
              <DefenceMatrix entries={entries} />
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}

function RosterCard({
  entry,
  spriteStyle,
  shiny,
  onRemove,
  typeLabel,
}: {
  entry: PokemonIndexEntry
  spriteStyle: SpriteStyle
  shiny: boolean
  onRemove: () => void
  typeLabel: (typeId: number) => string
}) {
  return (
    <div
      style={{ '--accent': typeColor(entry) } as CSSProperties}
      className="relative flex h-full flex-col items-center gap-1 rounded-plate border border-line bg-[var(--ui-plate)] p-2.5 text-center"
    >
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${entry.label} from the comparison`}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-chip text-faint transition hover:bg-raised hover:text-[var(--type-fighting)]"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m3 3 6 6M9 3l-6 6" />
        </svg>
      </button>
      <Link to={`/pokemon/${entry.name}`} className="flex flex-col items-center gap-1">
        <Sprite
          sources={spriteSources(entry.id, spriteStyle, shiny)}
          alt={entry.label}
          className="h-16 w-16"
          pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
        />
        <span className="numeric text-[10px] tracking-[0.12em] text-faint">{formatDex(entry.dex)}</span>
        <span className="line-clamp-2 font-display text-[13px] font-semibold leading-tight">
          {entry.label}
        </span>
      </Link>
      <span className="mt-auto flex flex-wrap justify-center gap-1 pt-1.5">
        {entry.types.map((typeId) => (
          <TypeBadge key={typeId} typeId={typeId} label={typeLabel(typeId)} size="xs" link={false} />
        ))}
      </span>
      <span className="numeric text-[10px] text-faint">BST {entry.bst}</span>
    </div>
  )
}

function VerdictCard({
  label,
  hint,
  winners,
  display,
  gap,
  spriteStyle,
  shiny,
}: {
  label: string
  hint: string
  winners: PokemonIndexEntry[]
  display: string
  gap: number | null
  spriteStyle: SpriteStyle
  shiny: boolean
}) {
  const leader = winners[0]
  const tie = winners.length > 1

  return (
    <div
      style={{ '--accent': typeColor(leader) } as CSSProperties}
      className="flex items-center gap-3 rounded-plate border border-line bg-surface/60 p-3"
    >
      <Sprite
        sources={spriteSources(leader.id, spriteStyle, shiny)}
        alt=""
        className="h-11 w-11 shrink-0"
        pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
      />
      <div className="min-w-0 flex-1">
        <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          {label}
        </p>
        <p className="truncate font-display text-sm font-semibold">
          {tie ? `${winners.length}-way tie` : leader.label}
        </p>
        <p className="truncate text-[11px] text-dim">
          {tie ? winners.map((entry) => entry.label).join(' · ') : hint}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="numeric text-lg font-bold leading-none text-accent">{display}</p>
        {gap !== null && gap > 0 && <p className="numeric mt-1 text-[10px] text-faint">+{gap} clear</p>}
      </div>
    </div>
  )
}

function AbilityList({
  slots,
  abilityById,
  loading,
  failed,
}: {
  slots: { id: number; slot: number; hidden: boolean }[]
  abilityById: Map<number, AbilityIndexEntry>
  loading: boolean
  failed: boolean
}) {
  if (loading) {
    return (
      <span className="flex flex-col gap-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </span>
    )
  }

  return (
    <span className="flex flex-col gap-0.5">
      {slots.map((slot) => {
        const ability = abilityById.get(slot.id)
        const body: ReactNode = ability ? (
          <Link to={`/abilities/${ability.name}`} className="text-[12px] transition hover:text-accent">
            {ability.label}
          </Link>
        ) : (
          <span className={cx('text-[12px]', failed ? 'text-faint' : 'text-dim')}>
            {failed ? `Ability #${slot.id}` : '—'}
          </span>
        )
        return (
          <span key={`${slot.id}-${slot.slot}`} className="flex items-center gap-1">
            {body}
            {slot.hidden && (
              <span
                title="Hidden ability"
                className="numeric rounded-[3px] bg-raised px-1 text-[9px] font-bold text-faint"
              >
                H
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

function TraitList({ entry }: { entry: PokemonIndexEntry }) {
  const traits: { label: string; color: string }[] = []
  if (entry.isLegendary) traits.push({ label: 'Legendary', color: 'var(--type-dragon)' })
  if (entry.isMythical) traits.push({ label: 'Mythical', color: 'var(--type-fairy)' })
  if (entry.isBaby) traits.push({ label: 'Baby', color: 'var(--type-normal)' })
  if (entry.isMega) traits.push({ label: 'Mega', color: 'var(--type-psychic)' })
  if (entry.isGmax) traits.push({ label: 'G-Max', color: 'var(--type-poison)' })
  if (!entry.isDefault && !entry.isMega && !entry.isGmax) {
    traits.push({ label: entry.formLabel ?? 'Alt form', color: 'var(--type-steel)' })
  }
  if (entry.isFullyEvolved) traits.push({ label: 'Final stage', color: 'var(--type-grass)' })

  if (traits.length === 0) return <span className="text-[12px] text-faint">—</span>

  return (
    <span className="flex flex-wrap gap-1">
      {traits.map((trait) => (
        <span
          key={trait.label}
          className="numeric rounded-chip px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
          style={{
            background: `color-mix(in oklab, ${trait.color} 18%, transparent)`,
            color: trait.color,
          }}
        >
          {trait.label}
        </span>
      ))}
    </span>
  )
}
