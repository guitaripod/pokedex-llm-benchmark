import { BATTLE_TYPE_IDS, effectiveness, type TypeChart } from '@/lib/game'

export interface Typing {
  key: string
  types: number[]
}

export function typingKey(types: number[]): string {
  return [...types].sort((a, b) => a - b).join('-')
}

/// The 171 legal defensive typings: 18 mono types plus every unordered dual pairing.
export function allTypings(): Typing[] {
  const list: Typing[] = []
  for (let i = 0; i < BATTLE_TYPE_IDS.length; i++) {
    const first = BATTLE_TYPE_IDS[i]
    list.push({ key: String(first), types: [first] })
    for (let j = i + 1; j < BATTLE_TYPE_IDS.length; j++) {
      const second = BATTLE_TYPE_IDS[j]
      list.push({ key: `${first}-${second}`, types: [first, second] })
    }
  }
  return list
}

/// The strongest multiplier a set of attacking types achieves against one defensive typing.
export function bestMultiplier(chart: TypeChart, attackTypes: number[], defending: number[]): number {
  let best = 0
  for (const attacking of attackTypes) {
    const value = effectiveness(chart, attacking, defending)
    if (value > best) best = value
  }
  return best
}

export interface CoverageRow {
  typing: Typing
  best: number
  speciesCount: number
}

export interface CoverageReport {
  rows: CoverageRow[]
  holes: CoverageRow[]
  neutral: number
  superEffective: number
  speciesTotal: number
  speciesCovered: number
  byKey: Map<string, number>
}

export function analyseCoverage(
  chart: TypeChart,
  attackTypes: number[],
  speciesByTyping: Map<string, number>,
): CoverageReport {
  const rows: CoverageRow[] = []
  const byKey = new Map<string, number>()
  let neutral = 0
  let superEffective = 0
  let speciesTotal = 0
  let speciesCovered = 0

  for (const typing of allTypings()) {
    const best = attackTypes.length === 0 ? 0 : bestMultiplier(chart, attackTypes, typing.types)
    const speciesCount = speciesByTyping.get(typing.key) ?? 0
    byKey.set(typing.key, best)
    speciesTotal += speciesCount
    if (best >= 1) {
      neutral++
      speciesCovered += speciesCount
    }
    if (best > 1) superEffective++
    rows.push({ typing, best, speciesCount })
  }

  const holes = rows
    .filter((row) => row.best < 1)
    .sort((a, b) => b.speciesCount - a.speciesCount || a.best - b.best)

  return { rows, holes, neutral, superEffective, speciesTotal, speciesCovered, byKey }
}

export interface Suggestion {
  typeId: number
  holesClosed: number
  speciesClosed: number
  superEffective: number
}

/// Scores each unused attacking type by how many of the current holes it would open up.
export function suggestAdditions(
  chart: TypeChart,
  attackTypes: number[],
  holes: CoverageRow[],
): Suggestion[] {
  const suggestions: Suggestion[] = []
  for (const candidate of BATTLE_TYPE_IDS) {
    if (attackTypes.includes(candidate)) continue
    let holesClosed = 0
    let speciesClosed = 0
    let superEffective = 0
    for (const hole of holes) {
      const value = effectiveness(chart, candidate, hole.typing.types)
      if (value >= 1) {
        holesClosed++
        speciesClosed += hole.speciesCount
        if (value > 1) superEffective++
      }
    }
    suggestions.push({ typeId: candidate, holesClosed, speciesClosed, superEffective })
  }
  return suggestions.sort(
    (a, b) => b.holesClosed - a.holesClosed || b.speciesClosed - a.speciesClosed || a.typeId - b.typeId,
  )
}
