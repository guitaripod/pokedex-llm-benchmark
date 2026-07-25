import { useMemo } from 'react'
import { typeSlug, useDex } from '@/lib/dex'
import {
  BATTLE_TYPE_IDS,
  applyDefensiveAbility,
  defenseProfile,
  effectivenessLabel,
} from '@/lib/game'
import { cx } from '@/lib/cx'

/// Colour band for a damage multiplier: immunity reads neutral, resistance green, weakness red.
function multiplierTone(value: number): string {
  if (value === 0) return 'var(--type-ghost)'
  if (value < 1) return 'var(--type-grass)'
  if (value > 1) return 'var(--type-fighting)'
  return 'var(--ui-text-faint)'
}

export function DefensiveShift({
  types,
  abilitySlug,
  className,
}: {
  types: number[]
  abilitySlug: string
  className?: string
}) {
  const dex = useDex()

  const { base, shifted, changed } = useMemo(() => {
    const baseProfile = defenseProfile(dex.meta.typeChart, types)
    const shiftedProfile = applyDefensiveAbility(baseProfile, abilitySlug)
    const changedTypes = BATTLE_TYPE_IDS.filter(
      (typeId) => baseProfile.byType[typeId] !== shiftedProfile.byType[typeId],
    )
    return { base: baseProfile, shifted: shiftedProfile, changed: new Set(changedTypes) }
  }, [dex.meta.typeChart, types, abilitySlug])

  return (
    <div className={cx('min-w-0', className)}>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {BATTLE_TYPE_IDS.map((typeId) => {
          const before = base.byType[typeId] ?? 1
          const after = shifted.byType[typeId] ?? 1
          const isChanged = changed.has(typeId)
          return (
            <div
              key={typeId}
              className={cx(
                'relative overflow-hidden rounded-chip border px-2 py-1.5 transition',
                isChanged
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]'
                  : 'border-line-soft bg-surface',
              )}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: `var(--type-${typeSlug(typeId)})` }}
              />
              <p className="numeric truncate pl-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
                {dex.typeById.get(typeId)?.label ?? typeSlug(typeId)}
              </p>
              <p className="flex items-baseline gap-1.5 pl-1.5">
                {isChanged && (
                  <span className="numeric text-[11px] text-faint line-through">
                    {effectivenessLabel(before)}
                  </span>
                )}
                <span
                  className="numeric text-[15px] font-bold leading-tight"
                  style={{ color: multiplierTone(after) }}
                >
                  {effectivenessLabel(after)}
                </span>
              </p>
            </div>
          )
        })}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line-soft pt-3">
        <ShiftCount label="Weak to" before={base.weaknesses.length} after={shifted.weaknesses.length} />
        <ShiftCount label="Resists" before={base.resistances.length} after={shifted.resistances.length} />
        <ShiftCount label="Immune" before={base.immunities.length} after={shifted.immunities.length} />
      </dl>
    </div>
  )
}

function ShiftCount({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before
  return (
    <div className="min-w-0">
      <dt className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="numeric mt-0.5 flex items-baseline gap-1.5 text-[15px] font-semibold">
        {after}
        {delta !== 0 && (
          <span
            className={cx(
              'text-[11px] font-semibold',
              delta > 0 ? 'text-[var(--type-fighting)]' : 'text-[var(--type-grass)]',
            )}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </dd>
    </div>
  )
}
