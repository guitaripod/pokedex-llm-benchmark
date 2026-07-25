import { useMemo, useState } from 'react'
import { Panel, SectionTitle } from '@/components/ui/Panel'
import { Select } from '@/components/ui/Controls'
import { StatBars } from '@/components/pokemon/StatBars'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { LevelSlider, Micro } from './shared'
import { useDex, typeSlug } from '@/lib/dex'
import {
  BATTLE_TYPE_IDS,
  STAT_LABELS,
  applyDefensiveAbility,
  defenseProfile,
  effectivenessLabel,
  hasDefensiveAbilityEffect,
  statRange,
} from '@/lib/game'
import { cx } from '@/lib/cx'
import type { AbilityIndexEntry, PokemonDetail } from '@/types/data'

export function StatsTab({
  detail,
  abilityById,
}: {
  detail: PokemonDetail
  abilityById: Map<number, AbilityIndexEntry> | null
}) {
  const [level, setLevel] = useState(50)

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel className="min-w-0">
        <SectionTitle
          eyebrow="Base stats"
          actions={
            <span className="numeric text-[11px] text-faint">
              BST <span className="text-ink">{detail.stats.reduce((sum, value) => sum + value, 0)}</span>
            </span>
          }
        >
          Distribution
        </SectionTitle>
        <StatBars stats={detail.stats} />
        <div className="mt-4 border-t border-line-soft pt-4">
          <LevelSlider value={level} onChange={setLevel} />
        </div>
      </Panel>

      <Panel className="min-w-0">
        <SectionTitle eyebrow={`Level ${level}`}>Computed range</SectionTitle>
        <RangeTable stats={detail.stats} level={level} />
        {detail.pastStats.length > 0 && (
          <div className="mt-4 border-t border-line-soft pt-3">
            <Micro className="mb-1.5">Past base stats</Micro>
            <PastStats detail={detail} />
          </div>
        )}
      </Panel>

      <Panel className="min-w-0 xl:col-span-2">
        <MatchupChart detail={detail} abilityById={abilityById} />
      </Panel>
    </div>
  )
}

function RangeTable({ stats, level }: { stats: PokemonDetail['stats']; level: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {['Stat', 'Min', 'Neutral', 'Max'].map((header, index) => (
              <th
                key={header}
                scope="col"
                className={cx(
                  'numeric px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint',
                  index === 0 ? 'text-left' : 'text-right',
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((base, index) => {
            const range = statRange(base, level, index)
            return (
              <tr key={STAT_LABELS[index]} className="border-b border-line-soft last:border-0">
                <td className="numeric px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-dim">
                  {STAT_LABELS[index]}
                </td>
                <td className="numeric px-2 py-2 text-right tabular-nums text-dim">{range.min}</td>
                <td className="numeric px-2 py-2 text-right tabular-nums">{range.neutral}</td>
                <td className="numeric px-2 py-2 text-right font-semibold tabular-nums text-accent">
                  {range.max}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Min = 0 IV / 0 EV with a hindering nature. Max = 31 IV / 252 EV with a boosting nature.
      </p>
    </div>
  )
}

function PastStats({ detail }: { detail: PokemonDetail }) {
  const dex = useDex()
  return (
    <ul className="space-y-1">
      {detail.pastStats.map((past) => (
        <li key={past.untilGeneration} className="text-[11px] text-faint">
          Until gen {past.untilGeneration}:{' '}
          {Object.entries(past.stats)
            .map(([statId, value]) => `${dex.nameOf('stats', Number(statId))} ${value}`)
            .join(', ')}
        </li>
      ))}
      {detail.pastTypes.map((past) => (
        <li key={`types-${past.untilGeneration}`} className="text-[11px] text-faint">
          Until gen {past.untilGeneration}:{' '}
          {past.types.map((typeId) => dex.nameOf('types', typeId)).join(' / ')}
        </li>
      ))}
    </ul>
  )
}

function MatchupChart({
  detail,
  abilityById,
}: {
  detail: PokemonDetail
  abilityById: Map<number, AbilityIndexEntry> | null
}) {
  const dex = useDex()
  const [abilityId, setAbilityId] = useState(0)

  const defensiveAbilities = useMemo(() => {
    const list: AbilityIndexEntry[] = []
    if (!abilityById) return list
    for (const slot of detail.abilities) {
      const ability = abilityById.get(slot.id)
      if (ability && hasDefensiveAbilityEffect(ability.name)) list.push(ability)
    }
    return list
  }, [detail.abilities, abilityById])

  const active = defensiveAbilities.find((ability) => ability.id === abilityId) ?? null

  const buckets = useMemo(() => {
    const base = defenseProfile(dex.meta.typeChart, detail.types)
    const profile = applyDefensiveAbility(base, active?.name ?? null)
    const grouped = new Map<number, number[]>()
    for (const typeId of BATTLE_TYPE_IDS) {
      const value = profile.byType[typeId] ?? 1
      const list = grouped.get(value)
      if (list) list.push(typeId)
      else grouped.set(value, [typeId])
    }
    return [...grouped.entries()].sort((a, b) => b[0] - a[0])
  }, [dex.meta.typeChart, detail.types, active])

  return (
    <>
      <SectionTitle
        eyebrow="Defence"
        actions={
          defensiveAbilities.length > 0 ? (
            <Select
              value={abilityId}
              aria-label="Defensive ability"
              onChange={(event) => setAbilityId(Number(event.target.value))}
              className="w-[190px]"
            >
              <option value={0}>No ability effect</option>
              {defensiveAbilities.map((ability) => (
                <option key={ability.id} value={ability.id}>
                  {ability.label}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      >
        Type matchup
      </SectionTitle>

      <div className="space-y-2">
        {buckets.map(([multiplier, typeIds]) => (
          <div
            key={multiplier}
            className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3 rounded-chip border border-line-soft bg-surface/50 p-2"
          >
            <span
              className={cx(
                'numeric flex h-7 items-center justify-center rounded-chip text-[13px] font-bold',
                multiplier > 1 && 'bg-[color-mix(in_oklab,var(--type-fighting)_16%,transparent)] text-[var(--type-fighting)]',
                multiplier === 1 && 'bg-raised text-dim',
                multiplier > 0 && multiplier < 1 && 'bg-[color-mix(in_oklab,var(--type-grass)_16%,transparent)] text-[var(--type-grass)]',
                multiplier === 0 && 'bg-raised text-faint',
              )}
            >
              {effectivenessLabel(multiplier)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {typeIds.map((typeId) => (
                <TypeBadge
                  key={typeId}
                  typeId={typeId}
                  label={dex.typeById.get(typeId)?.label ?? typeSlug(typeId)}
                  size="sm"
                  variant={multiplier === 1 ? 'outline' : 'solid'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {active && (
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Chart adjusted for <span className="text-dim">{active.label}</span>: {active.shortEffect}
        </p>
      )}
    </>
  )
}
