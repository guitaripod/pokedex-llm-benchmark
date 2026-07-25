import { DAMAGE_CLASS, TYPE_IDS, stageMultiplier } from '@/lib/game'

export type WeatherKey = 'none' | 'rain' | 'sun'
export type ScreenKey = 'none' | 'reflect' | 'light-screen'

export const WEATHER_OPTIONS: { value: WeatherKey; label: string }[] = [
  { value: 'none', label: 'Clear' },
  { value: 'rain', label: 'Rain' },
  { value: 'sun', label: 'Sun' },
]

export const SCREEN_OPTIONS: { value: ScreenKey; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'reflect', label: 'Reflect' },
  { value: 'light-screen', label: 'Light Screen' },
]

/// Rain and harsh sunlight scale Water and Fire moves in opposite directions.
export function weatherMultiplier(weather: WeatherKey, moveTypeId: number): number {
  if (weather === 'rain') {
    if (moveTypeId === TYPE_IDS.water) return 1.5
    if (moveTypeId === TYPE_IDS.fire) return 0.5
  }
  if (weather === 'sun') {
    if (moveTypeId === TYPE_IDS.fire) return 1.5
    if (moveTypeId === TYPE_IDS.water) return 0.5
  }
  return 1
}

/// Screens halve damage of the matching class; critical hits break through them.
export function screenMultiplier(screen: ScreenKey, damageClassId: number, critical: boolean): number {
  if (critical || screen === 'none') return 1
  if (screen === 'reflect' && damageClassId === DAMAGE_CLASS.physical) return 0.5
  if (screen === 'light-screen' && damageClassId === DAMAGE_CLASS.special) return 0.5
  return 1
}

/// Critical hits ignore the attacker's stat drops and the defender's stat boosts.
export function effectiveStage(stage: number, side: 'offense' | 'defense', critical: boolean): number {
  if (!critical) return stage
  return side === 'offense' ? Math.max(0, stage) : Math.min(0, stage)
}

export function applyStage(stat: number, stage: number): number {
  return Math.floor(stat * stageMultiplier(stage))
}

export interface ItemContext {
  damageClassId: number
  typeEffectiveness: number
}

export interface HeldItemOption {
  slug: string | null
  label: string
  note?: string
  multiplier: (context: ItemContext) => number
}

/** Held items whose only battle relevance here is the final damage multiplier. */
export const ATTACK_ITEMS: HeldItemOption[] = [
  { slug: null, label: 'None', multiplier: () => 1 },
  { slug: 'life-orb', label: 'Life Orb', note: '×1.3 · 10% recoil', multiplier: () => 5324 / 4096 },
  {
    slug: 'choice-band',
    label: 'Choice Band',
    note: '×1.5 physical · locked in',
    multiplier: (context) => (context.damageClassId === DAMAGE_CLASS.physical ? 1.5 : 1),
  },
  {
    slug: 'choice-specs',
    label: 'Choice Specs',
    note: '×1.5 special · locked in',
    multiplier: (context) => (context.damageClassId === DAMAGE_CLASS.special ? 1.5 : 1),
  },
  {
    slug: 'expert-belt',
    label: 'Expert Belt',
    note: '×1.2 when super-effective',
    multiplier: (context) => (context.typeEffectiveness > 1 ? 1.2 : 1),
  },
  {
    slug: 'muscle-band',
    label: 'Muscle Band',
    note: '×1.1 physical',
    multiplier: (context) => (context.damageClassId === DAMAGE_CLASS.physical ? 1.1 : 1),
  },
  {
    slug: 'wise-glasses',
    label: 'Wise Glasses',
    note: '×1.1 special',
    multiplier: (context) => (context.damageClassId === DAMAGE_CLASS.special ? 1.1 : 1),
  },
  {
    slug: 'silk-scarf',
    label: 'Type-boost item',
    note: '×1.2 · plate, incense, Charcoal…',
    multiplier: () => 1.2,
  },
  { slug: 'leftovers', label: 'Leftovers', note: 'No damage effect', multiplier: () => 1 },
  { slug: 'focus-sash', label: 'Focus Sash', note: 'No damage effect', multiplier: () => 1 },
  { slug: 'assault-vest', label: 'Assault Vest', note: 'No damage effect', multiplier: () => 1 },
]

export interface KoOutcome {
  hits: number
  chance: number
}

const CERTAIN = 0.9999995

/// Exact KO probability per hit count, convolving the 16 equally likely damage rolls.
export function koChances(rolls: number[], remainingHp: number, maxHits = 8): KoOutcome[] {
  const outcomes: KoOutcome[] = []
  if (rolls.length === 0 || Math.max(...rolls) <= 0 || remainingHp <= 0) return outcomes

  let alive = new Map<number, number>([[0, 1]])
  let dead = 0

  for (let hits = 1; hits <= maxHits && dead < CERTAIN; hits++) {
    const next = new Map<number, number>()
    for (const [sum, probability] of alive) {
      const share = probability / rolls.length
      for (const roll of rolls) {
        const total = sum + roll
        if (total >= remainingHp) dead += share
        else next.set(total, (next.get(total) ?? 0) + share)
      }
    }
    alive = next
    outcomes.push({ hits, chance: Math.min(1, dead) })
  }

  return outcomes
}

export interface KoVerdict {
  headline: string
  detail: string | null
}

/// Turns the per-hit KO distribution into the phrasing competitive players expect.
export function koVerdict(outcomes: KoOutcome[], maxHits = 8): KoVerdict {
  if (outcomes.length === 0) return { headline: 'No damage', detail: 'This move cannot KO the target.' }

  const possible = outcomes.find((outcome) => outcome.chance > 0)
  const guaranteed = outcomes.find((outcome) => outcome.chance >= CERTAIN)

  if (!possible) {
    return { headline: `No KO within ${maxHits} hits`, detail: 'Damage is too low to model further.' }
  }
  if (guaranteed && guaranteed.hits === possible.hits) {
    return { headline: `Guaranteed ${guaranteed.hits}HKO`, detail: null }
  }
  const chance = `${(possible.chance * 100).toFixed(1)}%`
  if (guaranteed) {
    return {
      headline: `${chance} chance to ${possible.hits}HKO`,
      detail: `Guaranteed ${guaranteed.hits}HKO`,
    }
  }
  return {
    headline: `${chance} chance to ${possible.hits}HKO`,
    detail: `No guaranteed KO within ${maxHits} hits`,
  }
}

export function formatMultiplier(value: number): string {
  if (value === 1) return '×1'
  return `×${Number(value.toFixed(3))}`
}
