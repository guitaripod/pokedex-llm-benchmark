import { Link } from 'react-router-dom'
import { Panel, SectionTitle } from '@/components/ui/Panel'
import { KeyRow, Micro } from './shared'
import { useDex } from '@/lib/dex'
import {
  STAT_KEYS,
  STAT_LABELS,
  calculateCatchRate,
  computeHp,
  eggSteps,
  genderRatio,
} from '@/lib/game'
import { cx } from '@/lib/cx'
import type { AbilityIndexEntry, PokemonDetail } from '@/types/data'

export function ProfileBand({
  detail,
  abilityById,
}: {
  detail: PokemonDetail
  abilityById: Map<number, AbilityIndexEntry> | null
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <AbilitiesPanel detail={detail} abilityById={abilityById} />
      <BreedingPanel detail={detail} />
      <TrainingPanel detail={detail} />
    </div>
  )
}

function AbilitiesPanel({
  detail,
  abilityById,
}: {
  detail: PokemonDetail
  abilityById: Map<number, AbilityIndexEntry> | null
}) {
  const ordered = [...detail.abilities].sort((a, b) => a.slot - b.slot)

  return (
    <Panel className="min-w-0 lg:col-span-1">
      <SectionTitle eyebrow="Traits">Abilities</SectionTitle>
      <ul className="space-y-2.5">
        {ordered.map((slot) => {
          const ability = abilityById?.get(slot.id)
          return (
            <li key={`${slot.id}-${slot.slot}`} className="rounded-chip border border-line-soft bg-surface/60 p-3">
              <div className="flex items-center justify-between gap-3">
                {ability ? (
                  <Link
                    to={`/abilities/${ability.name}`}
                    className="truncate font-display text-sm font-semibold hover:text-accent"
                  >
                    {ability.label}
                  </Link>
                ) : (
                  <span className="numeric truncate text-sm text-dim">Ability #{slot.id}</span>
                )}
                <span
                  className={cx(
                    'numeric shrink-0 rounded-chip px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
                    slot.hidden ? 'bg-accent/15 text-accent' : 'bg-raised text-faint',
                  )}
                >
                  {slot.hidden ? 'Hidden' : `Slot ${slot.slot}`}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-dim">
                {ability?.shortEffect ?? 'Effect unavailable.'}
              </p>
            </li>
          )
        })}
        {ordered.length === 0 && <li className="text-[13px] text-dim">No abilities recorded.</li>}
      </ul>

      {detail.pastAbilities.length > 0 && (
        <div className="mt-3 border-t border-line-soft pt-3">
          <Micro className="mb-1.5">Past generations</Micro>
          <ul className="space-y-1">
            {detail.pastAbilities.map((past) => (
              <li key={past.untilGeneration} className="text-[11px] text-faint">
                Until gen {past.untilGeneration}: {describePastAbilities(past.abilities, abilityById)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

/// A null slot means the ability simply did not exist yet, not that a name is missing.
function describePastAbilities(
  slots: { id: number | null; slot: number; hidden: boolean }[],
  abilityById: Map<number, AbilityIndexEntry> | null,
): string {
  return slots
    .map((slot) => {
      if (slot.id !== null) return abilityById?.get(slot.id)?.label ?? `#${slot.id}`
      return slot.hidden ? 'no hidden ability' : `no slot ${slot.slot} ability`
    })
    .join(', ')
}

function BreedingPanel({ detail }: { detail: PokemonDetail }) {
  const dex = useDex()
  const species = detail.species
  const ratio = genderRatio(species.genderRate)
  const cycles = species.hatchCounter

  return (
    <Panel className="min-w-0">
      <SectionTitle eyebrow="Breeding">Egg &amp; gender</SectionTitle>

      <div className="mb-3">
        <Micro className="mb-1.5">Egg groups</Micro>
        <div className="flex flex-wrap gap-1.5">
          {species.eggGroups.map((groupId) => (
            <span
              key={groupId}
              className="rounded-chip border border-line px-2 py-1 text-[12px] text-dim"
            >
              {dex.nameOf('eggGroups', groupId)}
            </span>
          ))}
          {species.eggGroups.length === 0 && <span className="text-[12px] text-faint">Unknown</span>}
        </div>
      </div>

      <div className="mb-3">
        <Micro className="mb-1.5">Gender ratio</Micro>
        {ratio ? (
          <>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${ratio.male.toFixed(1)} percent male, ${ratio.female.toFixed(1)} percent female`}>
              <span style={{ width: `${ratio.male}%`, background: 'var(--stat-special-attack)' }} />
              <span style={{ width: `${ratio.female}%`, background: 'var(--stat-speed)' }} />
            </div>
            <div className="numeric mt-1.5 flex justify-between text-[11px] font-semibold">
              <span style={{ color: 'var(--stat-special-attack)' }}>♂ {ratio.male.toFixed(1)}%</span>
              <span style={{ color: 'var(--stat-speed)' }}>♀ {ratio.female.toFixed(1)}%</span>
            </div>
          </>
        ) : (
          <p className="numeric text-[13px] font-semibold text-dim">Genderless</p>
        )}
      </div>

      <div>
        <KeyRow label="Egg cycles" value={cycles} />
        <KeyRow label="Steps to hatch" value={eggSteps(cycles).toLocaleString()} />
        <KeyRow label="Pre-gen VIII" value={`${eggSteps(cycles, false).toLocaleString()} steps`} />
        <KeyRow label="Base happiness" value={species.baseHappiness} />
        <KeyRow label="Gender differences" value={species.hasGenderDifferences ? 'Yes' : 'No'} />
      </div>
    </Panel>
  )
}

function TrainingPanel({ detail }: { detail: PokemonDetail }) {
  const dex = useDex()
  const growth = dex.meta.growthRates.find((rate) => rate.id === detail.species.growthRateId)
  const maxHp = computeHp({ base: detail.stats[0], iv: 31, ev: 0, level: 50 })
  const catchResult = calculateCatchRate({
    captureRate: detail.species.captureRate,
    maxHp,
    currentHp: maxHp,
    ballBonus: 1,
    statusBonus: 1,
    level: 50,
    applyLevelBonus: false,
  })
  const yields = detail.effortYield
    .map((value, index) => ({ value, label: STAT_LABELS[index], index }))
    .filter((item) => item.value > 0)

  return (
    <Panel className="min-w-0">
      <SectionTitle eyebrow="Training">Yield &amp; capture</SectionTitle>

      <div className="mb-3">
        <Micro className="mb-1.5">Effort values</Micro>
        <div className="flex flex-wrap gap-1.5">
          {yields.map((item) => (
            <span
              key={item.label}
              className="numeric inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-[11px] font-semibold"
              style={{
                color: `var(--stat-${STAT_KEYS[item.index]})`,
                background: `color-mix(in oklab, var(--stat-${STAT_KEYS[item.index]}) 14%, transparent)`,
              }}
            >
              +{item.value} {item.label}
            </span>
          ))}
          {yields.length === 0 && <span className="text-[12px] text-faint">No effort yield.</span>}
        </div>
      </div>

      <div className="mb-3">
        <KeyRow label="Base exp" value={detail.baseExp || '—'} />
        <KeyRow label="Growth rate" value={growth?.label ?? '—'} />
        <KeyRow label="Exp to level 100" value={growth ? growth.levels[99].toLocaleString() : '—'} />
        <KeyRow label="Capture rate" value={`${detail.species.captureRate} / 255`} />
      </div>

      <div className="rounded-chip border border-line-soft bg-surface/60 p-3">
        <Micro>Poké Ball at full HP · level 50</Micro>
        <p className="numeric mt-1.5 text-2xl font-bold leading-none text-accent">
          {(catchResult.probability * 100).toFixed(1)}%
        </p>
        <p className="mt-1 text-[11px] text-dim">
          ≈ {catchResult.guaranteed ? 1 : Math.ceil(catchResult.expectedBalls)} balls per catch
        </p>
        <Link
          to="/calc/catch"
          className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
        >
          Open catch calculator
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M4 2.5 7.5 6 4 9.5" />
          </svg>
        </Link>
      </div>
    </Panel>
  )
}
