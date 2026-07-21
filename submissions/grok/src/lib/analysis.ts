import type { Pokemon } from '../types/pokemon'
import { TYPE_COLORS } from '../types/pokemon'

export type Team = number[] // pokemon ids

const ALL_TYPES = Object.keys(TYPE_COLORS)

export interface Coverage {
  offensive: string[]   // types this team can hit for super effective
  defensiveWeak: string[]
  defensiveResist: string[]
  defensiveImmune: string[]
}

export function computeTeamCoverage(teamPokemon: Pokemon[]): Coverage {
  const offensive = new Set<string>()
  const weakCount: Record<string, number> = {}
  const resistCount: Record<string, number> = {}
  const immuneCount: Record<string, number> = {}

  for (const t of ALL_TYPES) {
    weakCount[t] = 0
    resistCount[t] = 0
    immuneCount[t] = 0
  }

  for (const p of teamPokemon) {
    for (const tp of p.types) {
      // Very simplified offensive: assume can hit with its type
      // Real would need actual moves, but good enough for analysis
      offensive.add(tp.type.name)
    }

    // For defensive, we would normally use the matchups fetched per type.
    // Here we approximate by counting presence. Full version will use real matchups.
  }

  // For this lean version we return basic. Enhanced version below uses matchups.
  return {
    offensive: Array.from(offensive),
    defensiveWeak: [],
    defensiveResist: [],
    defensiveImmune: [],
  }
}

// Better version that takes precomputed per-pokemon matchups or computes from known relations
// For practicality we'll provide a function that accepts matchup map per team member.

export function getTypeEffectiveness(attacking: string, defending: string): number {
  // Minimal matrix for key interactions (expandable)
  const chart: Record<string, Record<string, number>> = {
    fire: { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
    water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
    grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, ground: 0 },
    // Add more as needed; others default to 1
  }
  return chart[attacking]?.[defending] ?? 1
}

export function computeAdvancedCoverage(team: Pokemon[], matchupMap: Record<number, any>): Coverage {
  const offensive = new Set<string>()
  const weakTo = new Set<string>()
  const resistTo = new Set<string>()
  const immuneTo = new Set<string>()

  team.forEach(p => {
    p.types.forEach(t => offensive.add(t.type.name))

    const m = matchupMap[p.id]
    if (m) {
      m.weak?.forEach((w: string) => weakTo.add(w))
      m.resist?.forEach((r: string) => resistTo.add(r))
      m.immune?.forEach((i: string) => immuneTo.add(i))
    }
  })

  return {
    offensive: Array.from(offensive),
    defensiveWeak: Array.from(weakTo),
    defensiveResist: Array.from(resistTo),
    defensiveImmune: Array.from(immuneTo),
  }
}

export function suggestForTeam(allPokemon: Pokemon[], currentTeam: Pokemon[], maxSuggestions = 6): Pokemon[] {
  // Score by how many new offensive types + coverage against common weaknesses
  if (currentTeam.length === 0) return allPokemon.slice(0, maxSuggestions)

  const currentOff = new Set<string>()
  currentTeam.forEach(p => p.types.forEach(t => currentOff.add(t.type.name)))

  const scores = allPokemon
    .filter(p => !currentTeam.some(t => t.id === p.id))
    .map(p => {
      let score = 0
      const newTypes = p.types.filter(t => !currentOff.has(t.type.name))
      score += newTypes.length * 10
      // Bonus for legendaries / high BST lightly
      if (p.is_legendary || p.is_mythical) score += 4
      score += Math.floor((p.stats.reduce((s, st) => s + st.base_stat, 0) - 400) / 50)
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)

  return scores.slice(0, maxSuggestions).map(s => s.p)
}
