import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Chip, Segmented, Select, Toggle } from '@/components/ui/Controls'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { StatSparkline } from '@/components/pokemon/StatBars'
import { Distribution } from '@/components/leaderboard/Distribution'
import { RankRow } from '@/components/leaderboard/RankRow'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp, type SpriteStyle } from '@/lib/store'
import { BATTLE_TYPE_IDS, STAT_KEYS, STAT_LABELS, formatDex, formatHeight, formatWeight } from '@/lib/game'
import type { PokemonIndexEntry } from '@/types/data'

const TOP_COUNT = 100

interface Metric {
  key: string
  label: string
  group: string
  color: string
  unit?: string
  hint: string
  value: (entry: PokemonIndexEntry) => number
  format: (value: number) => string
  /** Zero means "not recorded" for these metrics, so those rows drop out of the ranking. */
  positiveOnly?: boolean
  detail?: (entry: PokemonIndexEntry) => string
}

const METRICS: Metric[] = [
  ...STAT_LABELS.map(
    (label, index): Metric => ({
      key: STAT_KEYS[index],
      label,
      group: 'Base stats',
      color: `var(--stat-${STAT_KEYS[index]})`,
      hint: `Base ${label} of every Pokémon that passes the filters`,
      value: (entry) => entry.stats[index],
      format: (value) => String(value),
    }),
  ),
  {
    key: 'bst',
    label: 'Base stat total',
    group: 'Base stats',
    color: 'var(--type-dragon)',
    hint: 'Sum of all six base stats',
    value: (entry) => entry.bst,
    format: (value) => String(value),
  },
  {
    key: 'height',
    label: 'Height',
    group: 'Physique',
    color: 'var(--type-flying)',
    unit: 'm',
    hint: 'Height in metres',
    value: (entry) => entry.height,
    format: (value) => (value / 10).toFixed(1),
    detail: (entry) => formatHeight(entry.height),
  },
  {
    key: 'weight',
    label: 'Weight',
    group: 'Physique',
    color: 'var(--type-rock)',
    unit: 'kg',
    hint: 'Weight in kilograms',
    value: (entry) => entry.weight,
    format: (value) => (value / 10).toFixed(1),
    detail: (entry) => formatWeight(entry.weight),
    positiveOnly: true,
  },
  {
    key: 'capture-rate',
    label: 'Capture rate',
    group: 'Meta',
    color: 'var(--type-fairy)',
    hint: 'Higher values are easier to catch — 255 is the ceiling',
    value: (entry) => entry.captureRate,
    format: (value) => String(value),
  },
  {
    key: 'base-exp',
    label: 'Base experience',
    group: 'Meta',
    color: 'var(--type-electric)',
    hint: 'Experience yielded when the Pokémon is defeated',
    value: (entry) => entry.baseExp,
    format: (value) => String(value),
    positiveOnly: true,
  },
]

const METRIC_GROUPS = ['Base stats', 'Physique', 'Meta']

interface Summary {
  values: number[]
  mean: number
  median: number
  min: number
  max: number
  deviation: number
}

/// Central tendency and spread for the filtered population, computed on a pre-sorted copy.
function summarize(values: number[]): Summary | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const total = sorted.reduce((sum, value) => sum + value, 0)
  const mean = total / sorted.length
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  const variance = sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sorted.length
  return {
    values: sorted,
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    deviation: Math.sqrt(variance),
  }
}

/// Trims "Generation VII" down to the roman numeral used on the filter chips.
function generationTag(label: string): string {
  const parts = label.split(' ')
  return parts[parts.length - 1]
}

export default function Leaderboard() {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const favorites = useApp((state) => state.favorites)
  const caught = useApp((state) => state.caught)

  const [params, setParams] = useSearchParams()

  const metric = METRICS.find((item) => item.key === params.get('metric')) ?? METRICS[6]
  const generation = clampGeneration(Number(params.get('gen')), dex.meta.generations.length)
  const typeId = BATTLE_TYPE_IDS.includes(Number(params.get('type'))) ? Number(params.get('type')) : 0
  const includeForms = params.get('forms') === '1'
  const includeLegendary = params.get('legendary') !== '0'
  const includeMythical = params.get('mythical') !== '0'
  const order = params.get('order') === 'asc' ? 'asc' : 'desc'

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const population = useMemo(
    () =>
      dex.entries.filter((entry) => {
        if (!includeForms && !entry.isDefault) return false
        if (!includeLegendary && entry.isLegendary) return false
        if (!includeMythical && entry.isMythical) return false
        if (generation > 0 && entry.generation !== generation) return false
        if (typeId > 0 && !entry.types.includes(typeId)) return false
        if (metric.positiveOnly && metric.value(entry) <= 0) return false
        return true
      }),
    [dex.entries, generation, includeForms, includeLegendary, includeMythical, metric, typeId],
  )

  const summary = useMemo(() => summarize(population.map(metric.value)), [metric, population])

  const ranked = useMemo(() => {
    const sorted = [...population].sort((a, b) =>
      order === 'desc' ? metric.value(b) - metric.value(a) : metric.value(a) - metric.value(b),
    )
    let previous: number | null = null
    let position = 0
    return sorted.slice(0, TOP_COUNT).map((entry, index) => {
      const value = metric.value(entry)
      if (previous === null || value !== previous) {
        position = index + 1
        previous = value
      }
      return { entry, value, rank: position }
    })
  }, [metric, order, population])

  const extremes = useMemo(() => {
    if (population.length === 0) return null
    let highest = population[0]
    let lowest = population[0]
    for (const entry of population) {
      if (metric.value(entry) > metric.value(highest)) highest = entry
      if (metric.value(entry) < metric.value(lowest)) lowest = entry
    }
    return { highest, lowest }
  }, [metric, population])

  const barScale = ranked.length > 0 ? Math.max(...ranked.map((row) => row.value)) || 1 : 1
  const favoriteSet = useMemo(() => new Set(favorites), [favorites])
  const caughtSet = useMemo(() => new Set(caught), [caught])
  const accent = typeId > 0 ? `var(--type-${typeSlug(typeId)})` : metric.color

  return (
    <div style={{ '--accent': accent } as CSSProperties}>
      <PageHeader
        eyebrow="Rankings"
        title="Leaderboard"
        subtitle={metric.hint}
        actions={
          <Segmented
            value={order}
            onChange={(value) => update({ order: value })}
            options={[
              { value: 'desc', label: 'Highest' },
              { value: 'asc', label: 'Lowest' },
            ]}
          />
        }
      />

      <div className="space-y-5">
        <Panel>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="leaderboard-metric"
                  className="numeric mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-faint"
                >
                  Ranked by
                </label>
                <Select
                  id="leaderboard-metric"
                  className="w-full"
                  value={metric.key}
                  onChange={(event) => update({ metric: event.target.value })}
                >
                  {METRIC_GROUPS.map((group) => (
                    <optgroup key={group} label={group}>
                      {METRICS.filter((item) => item.group === group).map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </div>

              <div className="border-t border-line-soft pt-1">
                <Toggle
                  checked={includeForms}
                  onChange={(value) => update({ forms: value ? '1' : null })}
                  label="Alternate forms"
                  hint="Megas, G-Max, regional variants"
                />
                <Toggle
                  checked={includeLegendary}
                  onChange={(value) => update({ legendary: value ? null : '0' })}
                  label="Legendaries"
                />
                <Toggle
                  checked={includeMythical}
                  onChange={(value) => update({ mythical: value ? null : '0' })}
                  label="Mythicals"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="numeric mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Generation
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={generation === 0} onClick={() => update({ gen: null })}>
                    All
                  </Chip>
                  {dex.meta.generations.map((item) => (
                    <Chip
                      key={item.id}
                      active={generation === item.id}
                      title={item.label}
                      onClick={() => update({ gen: generation === item.id ? null : String(item.id) })}
                    >
                      {generationTag(item.label)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="numeric mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Type
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={typeId === 0} onClick={() => update({ type: null })}>
                    All
                  </Chip>
                  {BATTLE_TYPE_IDS.map((id) => (
                    <Chip
                      key={id}
                      active={typeId === id}
                      color={`var(--type-${typeSlug(id)})`}
                      onClick={() => update({ type: typeId === id ? null : String(id) })}
                    >
                      {dex.typeById.get(id)?.label ?? ''}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {!summary || !extremes ? (
          <EmptyState
            title="No Pokémon match these filters"
            hint="Loosen a filter — or switch the metric, since base experience and weight drop entries with no recorded value."
          />
        ) : (
          <>
            <Panel>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Population" value={summary.values.length} />
                <Stat label="Mean" value={metric.format(round(summary.mean))} accent />
                <Stat label="Median" value={metric.format(summary.median)} />
                <Stat label="Std dev" value={metric.format(round(summary.deviation))} />
                <Stat label="Min" value={metric.format(summary.min)} />
                <Stat label="Max" value={metric.format(summary.max)} />
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Panel>
                <SectionTitle
                  eyebrow="Distribution"
                  actions={
                    <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
                      {metric.label}
                      {metric.unit ? ` (${metric.unit})` : ''}
                    </span>
                  }
                >
                  How the dex is spread
                </SectionTitle>
                <Distribution
                  values={summary.values}
                  mean={summary.mean}
                  median={summary.median}
                  color={metric.color}
                  format={metric.format}
                />
              </Panel>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1">
                <ExtremeCard
                  kind="Highest"
                  entry={extremes.highest}
                  metric={metric}
                  spriteStyle={spriteStyle}
                  shiny={shiny}
                />
                <ExtremeCard
                  kind="Lowest"
                  entry={extremes.lowest}
                  metric={metric}
                  spriteStyle={spriteStyle}
                  shiny={shiny}
                />
              </div>
            </div>

            <Panel>
              <SectionTitle
                eyebrow={order === 'desc' ? 'Top of the dex' : 'Bottom of the dex'}
                actions={
                  <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
                    {Math.min(TOP_COUNT, summary.values.length)} of {summary.values.length}
                  </span>
                }
              >
                {metric.label} ranking
              </SectionTitle>
              <ol className="space-y-0.5">
                {ranked.map((row) => (
                  <li key={row.entry.id}>
                    <RankRow
                      rank={row.rank}
                      entry={row.entry}
                      display={metric.format(row.value)}
                      unit={metric.unit}
                      ratio={row.value / barScale}
                      shiny={shiny}
                      favorite={favoriteSet.has(row.entry.id)}
                      caught={caughtSet.has(row.entry.id)}
                    />
                  </li>
                ))}
              </ol>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}

/// Keeps a URL-supplied generation inside the range the dataset actually ships.
function clampGeneration(value: number, count: number): number {
  return Number.isInteger(value) && value >= 1 && value <= count ? value : 0
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function ExtremeCard({
  kind,
  entry,
  metric,
  spriteStyle,
  shiny,
}: {
  kind: 'Highest' | 'Lowest'
  entry: PokemonIndexEntry
  metric: Metric
  spriteStyle: SpriteStyle
  shiny: boolean
}) {
  const dex = useDex()
  const color = `var(--type-${typeSlug(entry.types[0] ?? 1)})`

  return (
    <Panel className="flex flex-col" >
      <div style={{ '--accent': color } as CSSProperties} className="flex items-center gap-4">
        <Sprite
          sources={spriteSources(entry.id, spriteStyle, shiny)}
          alt={entry.label}
          className="h-20 w-20 shrink-0"
          pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
        />
        <div className="min-w-0 flex-1">
          <p className="numeric text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
            {kind} {metric.label}
          </p>
          <p className="numeric text-2xl font-bold leading-tight text-accent">
            {metric.format(metric.value(entry))}
            {metric.unit && <span className="ml-1 text-sm font-medium text-dim">{metric.unit}</span>}
          </p>
          <Link
            to={`/pokemon/${entry.name}`}
            className="mt-0.5 block truncate font-display text-sm font-semibold transition hover:text-accent"
          >
            {entry.label}
          </Link>
          <p className="numeric text-[10px] text-faint">
            {formatDex(entry.dex)} · {metric.detail?.(entry) ?? `BST ${entry.bst}`}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-3">
        <span className="flex flex-wrap gap-1">
          {entry.types.map((typeId) => (
            <TypeBadge
              key={typeId}
              typeId={typeId}
              label={dex.typeById.get(typeId)?.label ?? ''}
              size="xs"
            />
          ))}
        </span>
        <StatSparkline stats={entry.stats} />
      </div>
    </Panel>
  )
}
