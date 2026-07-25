import {
  BATTLE_TYPE_IDS,
  DAMAGE_CLASS,
  applyDefensiveAbility,
  computeHp,
  computeStat,
  defenseProfile,
  effectiveness,
  hasDefensiveAbilityEffect,
  natureMultiplier,
} from '@/lib/game'
import type { DefenseProfile, TypeChart } from '@/lib/game'
import type { MoveIndexEntry, NatureInfo, PokemonIndexEntry, StatBlock } from '@/types/data'
import type { TeamSlot } from '@/lib/store'

/** A weakness shared by this many members is the signal a team is structurally exploitable. */
export const SHARED_WEAKNESS_THRESHOLD = 3

export const EV_TOTAL_CAP = 510
export const EV_STAT_CAP = 252
export const IV_CAP = 31

export interface AbilityRef {
  slug: string
  label: string
}

export interface TeamMember {
  index: number
  slot: TeamSlot
  entry: PokemonIndexEntry
  nature: NatureInfo | null
  ability: AbilityRef | null
  /** True when the selected ability rewrites incoming effectiveness (Levitate, Thick Fat, …). */
  abilityAltersDefense: boolean
  defense: DefenseProfile
  finalStats: StatBlock
  moves: MoveIndexEntry[]
  moveTypeIds: number[]
}

export interface TypeColumn {
  typeId: number
  weak: number
  resist: number
  immune: number
  neutral: number
  shared: boolean
  unresisted: boolean
}

export interface OffensiveColumn {
  typeId: number
  best: number
  coveredBy: number[]
}

export interface TeamAnalysis {
  members: TeamMember[]
  columns: TypeColumn[]
  sharedWeaknesses: number[]
  unresistedTypes: number[]
  offense: OffensiveColumn[]
  attackingTypes: number[]
  superEffectiveTypes: number[]
  offensiveGaps: number[]
  totalBst: number
  averageBst: number
  typeDistribution: { typeId: number; count: number }[]
  speedTiers: { index: number; label: string; speed: number; base: number; level: number }[]
  damageClassSplit: { physical: number; special: number; status: number }
  moveCount: number
}

export interface TeamAnalysisInput {
  team: (TeamSlot | null)[]
  chart: TypeChart
  entryOf: (id: number) => PokemonIndexEntry | undefined
  natureOf: (id: number | null) => NatureInfo | null
  abilityOf: (id: number | null) => AbilityRef | null
  moveOf: (id: number | null) => MoveIndexEntry | null
}

/// Applies the level/IV/EV/nature formulas to a base stat block, HP using its own formula.
export function computeFinalStats(base: StatBlock, slot: TeamSlot, nature: NatureInfo | null): StatBlock {
  const increased = nature?.increasedStatId ?? null
  const decreased = nature?.decreasedStatId ?? null
  const level = clampLevel(slot.level)
  const values = base.map((value, index) => {
    const iv = clamp(slot.ivs?.[index] ?? IV_CAP, 0, IV_CAP)
    const ev = clamp(slot.evs?.[index] ?? 0, 0, EV_STAT_CAP)
    if (index === 0) return computeHp({ base: value, iv, ev, level })
    return computeStat({
      base: value,
      iv,
      ev,
      level,
      natureMultiplier: natureMultiplier(index + 1, increased, decreased),
    })
  })
  return values as StatBlock
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function clampLevel(level: number): number {
  return clamp(level, 1, 100)
}

export function evTotal(evs: number[]): number {
  return evs.reduce((sum, value) => sum + clamp(value, 0, EV_STAT_CAP), 0)
}

/// Caps a single EV edit against both the per-stat maximum and what the 510 budget still allows.
export function applyEvEdit(evs: number[], index: number, next: number): number[] {
  const spentElsewhere = evs.reduce(
    (sum, value, position) => (position === index ? sum : sum + clamp(value, 0, EV_STAT_CAP)),
    0,
  )
  const allowed = Math.max(0, Math.min(EV_STAT_CAP, EV_TOTAL_CAP - spentElsewhere))
  const updated = [...evs]
  updated[index] = clamp(next, 0, allowed)
  return updated
}

export function natureSummary(nature: NatureInfo | null, statShort: string[]): string {
  if (!nature) return 'Neutral'
  const { increasedStatId, decreasedStatId } = nature
  if (increasedStatId === null || decreasedStatId === null || increasedStatId === decreasedStatId) {
    return 'Neutral'
  }
  return `+${statShort[increasedStatId - 1]} / −${statShort[decreasedStatId - 1]}`
}

export function buildTeamAnalysis(input: TeamAnalysisInput): TeamAnalysis {
  const { team, chart, entryOf, natureOf, abilityOf, moveOf } = input
  const members: TeamMember[] = []

  team.forEach((slot, index) => {
    if (!slot) return
    const entry = entryOf(slot.pokemonId)
    if (!entry) return
    const nature = natureOf(slot.natureId)
    const ability = abilityOf(slot.abilityId)
    const base = defenseProfile(chart, entry.types)
    const defense = ability ? applyDefensiveAbility(base, ability.slug) : base
    const moves = slot.moveIds
      .map((id) => moveOf(id))
      .filter((move): move is MoveIndexEntry => move !== null)

    members.push({
      index,
      slot,
      entry,
      nature,
      ability,
      abilityAltersDefense: ability ? hasDefensiveAbilityEffect(ability.slug) : false,
      defense,
      finalStats: computeFinalStats(entry.stats, slot, nature),
      moves,
      moveTypeIds: unique(
        moves.filter((move) => move.damageClassId !== DAMAGE_CLASS.status).map((move) => move.typeId),
      ),
    })
  })

  const columns: TypeColumn[] = BATTLE_TYPE_IDS.map((typeId) => {
    let weak = 0
    let resist = 0
    let immune = 0
    for (const member of members) {
      const value = member.defense.byType[typeId] ?? 1
      if (value === 0) immune += 1
      else if (value > 1) weak += 1
      else if (value < 1) resist += 1
    }
    return {
      typeId,
      weak,
      resist,
      immune,
      neutral: members.length - weak - resist - immune,
      shared: weak >= SHARED_WEAKNESS_THRESHOLD,
      unresisted: members.length > 0 && resist + immune === 0,
    }
  })

  const attackingTypes = unique(members.flatMap((member) => member.moveTypeIds))
  const offense: OffensiveColumn[] = BATTLE_TYPE_IDS.map((typeId) => {
    let best = attackingTypes.length > 0 ? 0 : 1
    const coveredBy: number[] = []
    for (const member of members) {
      for (const attacking of member.moveTypeIds) {
        const value = effectiveness(chart, attacking, [typeId])
        if (value > best) best = value
        if (value > 1 && !coveredBy.includes(member.index)) coveredBy.push(member.index)
      }
    }
    return { typeId, best, coveredBy }
  })

  const distribution = new Map<number, number>()
  for (const member of members) {
    for (const typeId of member.entry.types) {
      distribution.set(typeId, (distribution.get(typeId) ?? 0) + 1)
    }
  }

  const allMoves = members.flatMap((member) => member.moves)
  const damageClassSplit = {
    physical: allMoves.filter((move) => move.damageClassId === DAMAGE_CLASS.physical).length,
    special: allMoves.filter((move) => move.damageClassId === DAMAGE_CLASS.special).length,
    status: allMoves.filter((move) => move.damageClassId === DAMAGE_CLASS.status).length,
  }

  const totalBst = members.reduce((sum, member) => sum + member.entry.bst, 0)

  return {
    members,
    columns,
    sharedWeaknesses: columns.filter((column) => column.shared).map((column) => column.typeId),
    unresistedTypes: columns.filter((column) => column.unresisted).map((column) => column.typeId),
    offense,
    attackingTypes,
    superEffectiveTypes: offense.filter((column) => column.best > 1).map((column) => column.typeId),
    offensiveGaps: offense.filter((column) => column.best <= 1).map((column) => column.typeId),
    totalBst,
    averageBst: members.length > 0 ? Math.round(totalBst / members.length) : 0,
    typeDistribution: [...distribution.entries()]
      .map(([typeId, count]) => ({ typeId, count }))
      .sort((a, b) => b.count - a.count || a.typeId - b.typeId),
    speedTiers: members
      .map((member) => ({
        index: member.index,
        label: member.slot.nickname?.trim() || member.entry.label,
        speed: member.finalStats[5],
        base: member.entry.stats[5],
        level: clampLevel(member.slot.level),
      }))
      .sort((a, b) => b.speed - a.speed),
    damageClassSplit,
    moveCount: allMoves.length,
  }
}

function unique(values: number[]): number[] {
  return [...new Set(values)]
}
