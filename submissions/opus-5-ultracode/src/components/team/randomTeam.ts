import { load } from '@/lib/data'
import { DAMAGE_CLASS, STAT_IDS } from '@/lib/game'
import { emptySlot } from '@/lib/store'
import type { MoveIndexEntry, NatureInfo, PokemonIndexEntry } from '@/types/data'
import type { TeamSlot } from '@/lib/store'

const MIN_RANDOM_BST = 400

/// Rolls six fully-evolved default forms and gives each a coherent nature, spread and move set.
export async function buildRandomTeam(
  entries: PokemonIndexEntry[],
  natures: NatureInfo[],
): Promise<TeamSlot[]> {
  const pool = entries.filter(
    (entry) =>
      entry.isDefault &&
      !entry.isBattleOnly &&
      !entry.isMega &&
      !entry.isGmax &&
      entry.isFullyEvolved &&
      entry.bst >= MIN_RANDOM_BST,
  )
  const picks = sample(pool.length >= 6 ? pool : entries, 6)

  const [moveIndex, details] = await Promise.all([
    load.moveIndex(),
    Promise.all(picks.map((entry) => load.pokemon(entry.id).catch(() => null))),
  ])
  const moveById = new Map(moveIndex.entries.map((move) => [move.id, move]))

  return picks.map((entry, index) => {
    const physical = entry.stats[1] >= entry.stats[3]
    const attackIndex = physical ? 1 : 3
    const boostStatId = physical ? STAT_IDS.attack : STAT_IDS.specialAttack
    const dumpStatId = physical ? STAT_IDS.specialAttack : STAT_IDS.attack

    const slot = emptySlot(entry.id)
    slot.natureId =
      natures.find(
        (nature) => nature.increasedStatId === boostStatId && nature.decreasedStatId === dumpStatId,
      )?.id ?? null
    slot.abilityId = (entry.abilities.find((ability) => !ability.hidden) ?? entry.abilities[0])?.id ?? null
    slot.evs = spreadFor(attackIndex)
    slot.moveIds = pickMoves(details[index], moveById, {
      preferredClass: physical ? DAMAGE_CLASS.physical : DAMAGE_CLASS.special,
      stabTypes: entry.types,
    })
    return slot
  })
}

function spreadFor(attackIndex: number): TeamSlot['evs'] {
  const evs: TeamSlot['evs'] = [4, 0, 0, 0, 0, 0]
  evs[attackIndex] = 252
  evs[5] = 252
  return evs
}

/// Prefers the best-scoring attack of each distinct type so the roll has real coverage.
function pickMoves(
  detail: { moves: [number, number, number, number, number][] } | null,
  moveById: Map<number, MoveIndexEntry>,
  preferences: { preferredClass: number; stabTypes: number[] },
): (number | null)[] {
  if (!detail) return [null, null, null, null]

  const learnable: MoveIndexEntry[] = []
  const seen = new Set<number>()
  for (const [moveId] of detail.moves) {
    if (seen.has(moveId)) continue
    seen.add(moveId)
    const move = moveById.get(moveId)
    if (move && move.damageClassId !== DAMAGE_CLASS.status && (move.power ?? 0) > 0) learnable.push(move)
  }
  learnable.sort((a, b) => moveScore(b, preferences) - moveScore(a, preferences))

  const chosen: number[] = []
  const usedTypes = new Set<number>()
  for (const move of learnable) {
    if (chosen.length >= 4) break
    if (usedTypes.has(move.typeId)) continue
    usedTypes.add(move.typeId)
    chosen.push(move.id)
  }
  for (const move of learnable) {
    if (chosen.length >= 4) break
    if (!chosen.includes(move.id)) chosen.push(move.id)
  }

  return [0, 1, 2, 3].map((index) => chosen[index] ?? null)
}

const CHARGE_FLAG = 2
const RECHARGE_FLAG = 3

/** Moves whose raw power is paid for with the user's own KO, so a bot should rarely pick them. */
const SELF_KO_MOVES = new Set([
  'explosion',
  'self-destruct',
  'misty-explosion',
  'final-gambit',
  'memento',
  'healing-wish',
  'lunar-dance',
])

/// Discounts raw power by accuracy, PP, charge/recharge turns and self-KO, rewarding STAB and the spread's attacking stat.
function moveScore(move: MoveIndexEntry, preferences: { preferredClass: number; stabTypes: number[] }): number {
  let score = (move.power ?? 0) * ((move.accuracy ?? 100) / 100)
  score *= move.pp === null || move.pp >= 15 ? 1 : move.pp >= 10 ? 0.92 : 0.72
  if (move.flags.includes(CHARGE_FLAG)) score *= 0.7
  if (move.flags.includes(RECHARGE_FLAG)) score *= 0.7
  if (move.priority < 0) score *= 0.85
  if (SELF_KO_MOVES.has(move.name)) score *= 0.2
  if (move.damageClassId === preferences.preferredClass) score *= 1.15
  if (preferences.stabTypes.includes(move.typeId)) score *= 1.2
  return score
}

function sample<T>(list: T[], count: number): T[] {
  const pool = [...list]
  const picked: T[] = []
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(index, 1)[0])
  }
  return picked
}
