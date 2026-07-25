/**
 * Game mechanics shared by the detail pages and the calculators.
 * Formulas follow the Generation V–IX main-series implementations unless noted.
 */

export const TYPE_IDS = {
  normal: 1,
  fighting: 2,
  flying: 3,
  poison: 4,
  ground: 5,
  rock: 6,
  bug: 7,
  ghost: 8,
  steel: 9,
  fire: 10,
  water: 11,
  grass: 12,
  electric: 13,
  psychic: 14,
  ice: 15,
  dragon: 16,
  dark: 17,
  fairy: 18,
  stellar: 19,
} as const

export type TypeSlug = keyof typeof TYPE_IDS

/** The 18 battle types in national-dex order, excluding stellar/unknown/shadow. */
export const BATTLE_TYPE_IDS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
]

export const TYPE_SLUG_BY_ID: Record<number, TypeSlug> = Object.fromEntries(
  Object.entries(TYPE_IDS).map(([slug, id]) => [id, slug as TypeSlug]),
) as Record<number, TypeSlug>

export const STAT_IDS = {
  hp: 1,
  attack: 2,
  defense: 3,
  specialAttack: 4,
  specialDefense: 5,
  speed: 6,
} as const

export const STAT_ORDER = [1, 2, 3, 4, 5, 6]
export const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
export const STAT_LABELS = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']
export const STAT_SHORT = ['HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE']

/** Highest base stat observed in the dataset, used to scale stat bars consistently. */
export const MAX_BASE_STAT = 255
export const MAX_BST = 1125

export const DAMAGE_CLASS = { status: 1, physical: 2, special: 3 } as const

export type TypeChart = Record<number, Record<number, number>>

export function effectiveness(chart: TypeChart, attacking: number, defending: number[]): number {
  let multiplier = 1
  for (const defender of defending) {
    multiplier *= chart[attacking]?.[defender] ?? 1
  }
  return multiplier
}

export interface DefenseProfile {
  /** Multiplier taken from each attacking type, keyed by attacking type id. */
  byType: Record<number, number>
  weaknesses: number[]
  resistances: number[]
  immunities: number[]
}

export function defenseProfile(chart: TypeChart, defending: number[]): DefenseProfile {
  const byType: Record<number, number> = {}
  const weaknesses: number[] = []
  const resistances: number[] = []
  const immunities: number[] = []
  for (const attacking of BATTLE_TYPE_IDS) {
    const value = effectiveness(chart, attacking, defending)
    byType[attacking] = value
    if (value === 0) immunities.push(attacking)
    else if (value > 1) weaknesses.push(attacking)
    else if (value < 1) resistances.push(attacking)
  }
  return { byType, weaknesses, resistances, immunities }
}

/** Abilities that rewrite incoming type effectiveness before damage is applied. */
const DEFENSIVE_ABILITY_MODIFIERS: Record<string, (typeId: number, current: number) => number> = {
  levitate: (t, c) => (t === TYPE_IDS.ground ? 0 : c),
  'flash-fire': (t, c) => (t === TYPE_IDS.fire ? 0 : c),
  'water-absorb': (t, c) => (t === TYPE_IDS.water ? 0 : c),
  'dry-skin': (t, c) => (t === TYPE_IDS.water ? 0 : t === TYPE_IDS.fire ? c * 1.25 : c),
  'volt-absorb': (t, c) => (t === TYPE_IDS.electric ? 0 : c),
  'lightning-rod': (t, c) => (t === TYPE_IDS.electric ? 0 : c),
  motordrive: (t, c) => (t === TYPE_IDS.electric ? 0 : c),
  'motor-drive': (t, c) => (t === TYPE_IDS.electric ? 0 : c),
  'storm-drain': (t, c) => (t === TYPE_IDS.water ? 0 : c),
  'sap-sipper': (t, c) => (t === TYPE_IDS.grass ? 0 : c),
  'earth-eater': (t, c) => (t === TYPE_IDS.ground ? 0 : c),
  'well-baked-body': (t, c) => (t === TYPE_IDS.fire ? 0 : c),
  'thick-fat': (t, c) => (t === TYPE_IDS.fire || t === TYPE_IDS.ice ? c * 0.5 : c),
  heatproof: (t, c) => (t === TYPE_IDS.fire ? c * 0.5 : c),
  'water-bubble': (t, c) => (t === TYPE_IDS.fire ? c * 0.5 : c),
  'purifying-salt': (t, c) => (t === TYPE_IDS.ghost ? c * 0.5 : c),
  fluffy: (t, c) => (t === TYPE_IDS.fire ? c * 2 : c),
  'wonder-guard': (_, c) => (c > 1 ? c : 0),
}

export function applyDefensiveAbility(profile: DefenseProfile, abilitySlug: string | null): DefenseProfile {
  const modifier = abilitySlug ? DEFENSIVE_ABILITY_MODIFIERS[abilitySlug] : undefined
  if (!modifier) return profile
  const byType: Record<number, number> = {}
  const weaknesses: number[] = []
  const resistances: number[] = []
  const immunities: number[] = []
  for (const attacking of BATTLE_TYPE_IDS) {
    const value = modifier(attacking, profile.byType[attacking] ?? 1)
    byType[attacking] = value
    if (value === 0) immunities.push(attacking)
    else if (value > 1) weaknesses.push(attacking)
    else if (value < 1) resistances.push(attacking)
  }
  return { byType, weaknesses, resistances, immunities }
}

export function hasDefensiveAbilityEffect(abilitySlug: string): boolean {
  return abilitySlug in DEFENSIVE_ABILITY_MODIFIERS
}

/* ------------------------------------------------------------------- stats */

export interface StatInputs {
  base: number
  iv: number
  ev: number
  level: number
  natureMultiplier: number
}

export function computeHp({ base, iv, ev, level }: Omit<StatInputs, 'natureMultiplier'>): number {
  if (base === 1) return 1
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
}

export function computeStat({ base, iv, ev, level, natureMultiplier }: StatInputs): number {
  const raw = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5
  return Math.floor(raw * natureMultiplier)
}

export function statRange(base: number, level: number, statIndex: number) {
  const isHp = statIndex === 0
  const min = isHp
    ? computeHp({ base, iv: 0, ev: 0, level })
    : computeStat({ base, iv: 0, ev: 0, level, natureMultiplier: 0.9 })
  const max = isHp
    ? computeHp({ base, iv: 31, ev: 252, level })
    : computeStat({ base, iv: 31, ev: 252, level, natureMultiplier: 1.1 })
  const neutral = isHp
    ? computeHp({ base, iv: 31, ev: 0, level })
    : computeStat({ base, iv: 31, ev: 0, level, natureMultiplier: 1 })
  return { min, max, neutral }
}

export function natureMultiplier(
  statId: number,
  increasedStatId: number | null,
  decreasedStatId: number | null,
): number {
  if (increasedStatId === decreasedStatId) return 1
  if (statId === increasedStatId) return 1.1
  if (statId === decreasedStatId) return 0.9
  return 1
}

const STAGE_MULTIPLIER = [2 / 8, 2 / 7, 2 / 6, 2 / 5, 2 / 4, 2 / 3, 1, 1.5, 2, 2.5, 3, 3.5, 4]

export function stageMultiplier(stage: number): number {
  return STAGE_MULTIPLIER[Math.max(-6, Math.min(6, stage)) + 6]
}

/* ------------------------------------------------------------------ damage */

export interface DamageInputs {
  level: number
  power: number
  attack: number
  defense: number
  /** Product of every non-random multiplier applied after the base calculation. */
  stab: number
  typeEffectiveness: number
  critical: boolean
  burned: boolean
  weather: number
  screen: number
  other: number
  targets: number
}

export interface DamageResult {
  min: number
  max: number
  rolls: number[]
}

/// Applies the Gen V+ damage formula across all 16 random rolls, flooring at each documented step.
export function calculateDamage(input: DamageInputs): DamageResult {
  const {
    level,
    power,
    attack,
    defense,
    stab,
    typeEffectiveness,
    critical,
    burned,
    weather,
    screen,
    other,
    targets,
  } = input

  if (power <= 0 || typeEffectiveness === 0) return { min: 0, max: 0, rolls: new Array(16).fill(0) }

  const base = Math.floor(Math.floor((Math.floor((2 * level) / 5 + 2) * power * attack) / defense) / 50) + 2
  const rolls: number[] = []

  for (let roll = 85; roll <= 100; roll++) {
    let damage = base
    damage = pokeRound(damage * targets)
    damage = pokeRound(damage * weather)
    if (critical) damage = pokeRound(damage * 1.5)
    damage = Math.floor((damage * roll) / 100)
    damage = pokeRound(damage * stab)
    damage = Math.floor(damage * typeEffectiveness)
    if (burned) damage = Math.floor(damage / 2)
    damage = pokeRound(damage * screen)
    damage = pokeRound(damage * other)
    rolls.push(Math.max(1, damage))
  }

  return { min: rolls[0], max: rolls[rolls.length - 1], rolls }
}

/// The games round .5 down, unlike Math.round.
function pokeRound(value: number): number {
  const floored = Math.floor(value)
  return value - floored > 0.5 ? floored + 1 : floored
}

/* ------------------------------------------------------------------- catch */

export const STATUS_BONUS: Record<string, number> = {
  none: 1,
  burn: 1.5,
  paralysis: 1.5,
  poison: 1.5,
  sleep: 2.5,
  freeze: 2.5,
}

export interface CatchInputs {
  captureRate: number
  maxHp: number
  currentHp: number
  ballBonus: number
  statusBonus: number
  level: number
  /** Gen VIII+ applies a low-level bonus for Pokémon at or below level 20. */
  applyLevelBonus: boolean
}

export interface CatchResult {
  /** Chance the Pokémon is caught in a single throw, 0–1. */
  probability: number
  shakeProbability: number
  /** Expected number of balls to land a catch. */
  expectedBalls: number
  guaranteed: boolean
}

export function calculateCatchRate(input: CatchInputs): CatchResult {
  const { captureRate, maxHp, currentHp, ballBonus, statusBonus, level, applyLevelBonus } = input
  const hp = Math.max(1, currentHp)
  const levelBonus = applyLevelBonus && level <= 20 ? Math.max(1, (30 - level) / 10) : 1

  const a =
    (((3 * maxHp - 2 * hp) * captureRate * ballBonus) / (3 * maxHp)) * statusBonus * levelBonus

  if (a >= 255) return { probability: 1, shakeProbability: 1, expectedBalls: 1, guaranteed: true }

  const shake = 65536 / Math.pow(255 / a, 3 / 16)
  const shakeProbability = Math.min(1, shake / 65536)
  const probability = Math.pow(shakeProbability, 4)
  return {
    probability,
    shakeProbability,
    expectedBalls: probability > 0 ? 1 / probability : Infinity,
    guaranteed: false,
  }
}

export const POKEBALLS: { slug: string; label: string; bonus: number; note?: string }[] = [
  { slug: 'poke-ball', label: 'Poké Ball', bonus: 1 },
  { slug: 'great-ball', label: 'Great Ball', bonus: 1.5 },
  { slug: 'ultra-ball', label: 'Ultra Ball', bonus: 2 },
  { slug: 'master-ball', label: 'Master Ball', bonus: 255, note: 'Never fails' },
  { slug: 'safari-ball', label: 'Safari Ball', bonus: 1.5 },
  { slug: 'net-ball', label: 'Net Ball', bonus: 3.5, note: '3.5× on Water or Bug' },
  { slug: 'dive-ball', label: 'Dive Ball', bonus: 3.5, note: '3.5× when fishing or surfing' },
  { slug: 'nest-ball', label: 'Nest Ball', bonus: 3, note: 'Up to 3.9× on low-level targets' },
  { slug: 'repeat-ball', label: 'Repeat Ball', bonus: 3.5, note: '3.5× if already registered' },
  { slug: 'timer-ball', label: 'Timer Ball', bonus: 4, note: 'Grows to 4× by turn 10' },
  { slug: 'quick-ball', label: 'Quick Ball', bonus: 5, note: '5× on the first turn' },
  { slug: 'dusk-ball', label: 'Dusk Ball', bonus: 3, note: '3× at night or in caves' },
  { slug: 'heal-ball', label: 'Heal Ball', bonus: 1 },
  { slug: 'luxury-ball', label: 'Luxury Ball', bonus: 1 },
  { slug: 'premier-ball', label: 'Premier Ball', bonus: 1 },
  { slug: 'level-ball', label: 'Level Ball', bonus: 8, note: 'Up to 8× by level difference' },
  { slug: 'lure-ball', label: 'Lure Ball', bonus: 5, note: '5× while fishing' },
  { slug: 'moon-ball', label: 'Moon Ball', bonus: 4, note: '4× on Moon Stone families' },
  { slug: 'friend-ball', label: 'Friend Ball', bonus: 1 },
  { slug: 'love-ball', label: 'Love Ball', bonus: 8, note: '8× on the opposite gender' },
  { slug: 'heavy-ball', label: 'Heavy Ball', bonus: 1, note: 'Flat bonus scaled by weight' },
  { slug: 'fast-ball', label: 'Fast Ball', bonus: 4, note: '4× on base Speed 100+' },
  { slug: 'sport-ball', label: 'Sport Ball', bonus: 1.5 },
  { slug: 'dream-ball', label: 'Dream Ball', bonus: 4, note: '4× on sleeping targets' },
  { slug: 'beast-ball', label: 'Beast Ball', bonus: 5, note: '5× on Ultra Beasts, 0.1× otherwise' },
]

/* ---------------------------------------------------------------- breeding */

/** Steps required to hatch, using the Gen VIII+ cycle length of 128. */
export function eggSteps(hatchCounter: number, modern = true): number {
  return (hatchCounter + 1) * (modern ? 128 : 255)
}

export function genderRatio(genderRate: number): { female: number; male: number } | null {
  if (genderRate < 0) return null
  return { female: (genderRate / 8) * 100, male: ((8 - genderRate) / 8) * 100 }
}

/* --------------------------------------------------------------- utilities */

export function formatHeight(decimetres: number): string {
  const metres = decimetres / 10
  const totalInches = Math.round(metres * 39.3701)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${metres.toFixed(1)} m · ${feet}′${String(inches).padStart(2, '0')}″`
}

export function formatWeight(hectograms: number): string {
  const kg = hectograms / 10
  return `${kg.toFixed(1)} kg · ${(kg * 2.20462).toFixed(1)} lb`
}

export function formatDex(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

export function effectivenessLabel(value: number): string {
  if (value === 0) return '0×'
  if (value === 0.25) return '¼×'
  if (value === 0.5) return '½×'
  if (value === 1) return '1×'
  if (value === 2) return '2×'
  if (value === 4) return '4×'
  return `${value}×`
}

/** Experience gained for defeating a Pokémon, using the Gen V+ scaled formula. */
export function experienceYield(baseExp: number, defeatedLevel: number, winnerLevel: number): number {
  const a = (baseExp * defeatedLevel) / 5
  const b = Math.pow((2 * defeatedLevel + 10) / (defeatedLevel + winnerLevel + 10), 2.5)
  return Math.floor(a * b + 1)
}
