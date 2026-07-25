import type { CSSProperties } from 'react'
import { BATTLE_TYPE_IDS, defenseProfile, type TypeChart } from '@/lib/game'
import type { MetaData, TypeInfo } from '@/types/data'

export interface TypeEra {
  key: string
  /** First generation the chart applies to. */
  from: number
  /** Last generation the chart applies to. */
  to: number
  short: string
  label: string
  current: boolean
}

export interface ChartChange {
  attacker: number
  defender: number
  past: number
  present: number
}

export interface DefensiveRow {
  /** Second defending type, or null for the mono-type baseline. */
  partnerId: number | null
  byType: Record<number, number>
  weaknesses: number
  quadWeaknesses: number
  resistances: number
  quadResistances: number
  immunities: number
  /** Mean incoming multiplier across all 18 attacking types; lower is tankier. */
  mean: number
}

/// Rebuilds the efficacy chart as it stood in `generation` by replaying every override still in force.
export function chartForGeneration(meta: MetaData, generation: number): TypeChart {
  const chart: TypeChart = {}
  for (const [attacker, row] of Object.entries(meta.typeChart)) {
    chart[Number(attacker)] = { ...row }
  }
  const ordered = [...meta.typeChartPast].sort((a, b) => b.untilGeneration - a.untilGeneration)
  for (const past of ordered) {
    if (past.untilGeneration < generation) continue
    for (const [attacker, row] of Object.entries(past.chart)) {
      const target = chart[Number(attacker)] ?? {}
      for (const [defender, value] of Object.entries(row)) target[Number(defender)] = value
      chart[Number(attacker)] = target
    }
  }
  return chart
}

/// Splits the generation timeline at every point where the efficacy chart was rewritten.
export function typeEras(meta: MetaData): TypeEra[] {
  const latest = meta.generations.reduce((max, generation) => Math.max(max, generation.id), 1)
  const boundaries = [...new Set(meta.typeChartPast.map((past) => past.untilGeneration))]
    .filter((boundary) => boundary >= 1 && boundary < latest)
    .sort((a, b) => a - b)

  const eras: TypeEra[] = []
  let from = 1
  for (const boundary of boundaries) {
    if (boundary < from) continue
    eras.push(makeEra(meta, from, boundary, false))
    from = boundary + 1
  }
  eras.push(makeEra(meta, from, latest, true))
  return eras
}

function makeEra(meta: MetaData, from: number, to: number, current: boolean): TypeEra {
  const first = romanFor(meta, from)
  const last = romanFor(meta, to)
  const short = from === to ? `Gen ${first}` : current ? `Gen ${first}+` : `Gen ${first}–${last}`
  const label = from === to ? `Generation ${first}` : `Generations ${first}–${last}`
  return { key: `era-${from}`, from, to, short, label, current }
}

function romanFor(meta: MetaData, id: number): string {
  const generation = meta.generations.find((entry) => entry.id === id)
  return generation ? generation.label.replace(/^Generation\s*/i, '') : String(id)
}

/// The battle types that existed by the end of an era, in national order.
export function typesForEra(meta: MetaData, era: TypeEra): TypeInfo[] {
  const battle = new Set(BATTLE_TYPE_IDS)
  return meta.types.filter((type) => battle.has(type.id) && type.generation <= era.to)
}

export function chartDifferences(past: TypeChart, present: TypeChart, typeIds: number[]): ChartChange[] {
  const changes: ChartChange[] = []
  for (const attacker of typeIds) {
    for (const defender of typeIds) {
      const before = past[attacker]?.[defender] ?? 1
      const after = present[attacker]?.[defender] ?? 1
      if (before !== after) changes.push({ attacker, defender, past: before, present: after })
    }
  }
  return changes
}

/// Three-letter column key derived from the type label so the matrix stays readable at 360px.
export function typeAbbr(label: string): string {
  return label.slice(0, 3).toUpperCase()
}

export function matchupWord(value: number): string {
  if (value === 0) return 'No effect'
  if (value > 2) return 'Doubly super effective'
  if (value > 1) return 'Super effective'
  if (value === 1) return 'Normal damage'
  if (value < 0.5) return 'Doubly resisted'
  return 'Not very effective'
}

export interface CellVisual {
  style: CSSProperties
  bold: boolean
}

const HATCH =
  'repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in oklab, var(--type-water) 34%, transparent) 4px 5px)'

const SLASH =
  'linear-gradient(to top right, transparent calc(50% - 0.75px), color-mix(in oklab, var(--ui-text-faint) 60%, transparent) calc(50% - 0.75px) calc(50% + 0.75px), transparent calc(50% + 0.75px))'

/// Encodes a multiplier as colour temperature plus a texture so the chart survives greyscale.
export function cellVisual(value: number): CellVisual {
  if (value === 0) {
    return {
      style: {
        backgroundColor: 'color-mix(in oklab, var(--ui-void) 72%, transparent)',
        backgroundImage: SLASH,
        color: 'var(--ui-text-faint)',
      },
      bold: false,
    }
  }
  if (value > 2) {
    return {
      style: {
        backgroundColor: 'color-mix(in oklab, var(--type-fighting) 88%, transparent)',
        color: '#0b0d12',
      },
      bold: true,
    }
  }
  if (value > 1) {
    return {
      style: {
        backgroundColor: 'color-mix(in oklab, var(--type-fire) 80%, transparent)',
        color: '#0b0d12',
      },
      bold: true,
    }
  }
  if (value < 0.5) {
    return {
      style: {
        backgroundColor: 'color-mix(in oklab, var(--type-water) 46%, transparent)',
        backgroundImage: HATCH,
        color: 'var(--ui-text)',
      },
      bold: true,
    }
  }
  if (value < 1) {
    return {
      style: {
        backgroundColor: 'color-mix(in oklab, var(--type-water) 20%, transparent)',
        backgroundImage: HATCH,
        color: 'var(--type-water)',
      },
      bold: true,
    }
  }
  return {
    style: {
      backgroundColor: 'transparent',
      color: 'color-mix(in oklab, var(--ui-text-faint) 65%, transparent)',
    },
    bold: false,
  }
}

/**
 * Summarises how a defending type combination absorbs the attacking types available to it.
 *
 * `attackingIds` must be narrowed when viewing a historical chart: counting Fairy against a
 * Generation I matchup would report weaknesses from a type that did not exist yet.
 */
export function defensiveRow(
  chart: TypeChart,
  defending: number[],
  partnerId: number | null,
  attackingIds: number[] = BATTLE_TYPE_IDS,
): DefensiveRow {
  const profile = defenseProfile(chart, defending)
  let total = 0
  let weaknesses = 0
  let resistances = 0
  let immunities = 0
  let quadWeaknesses = 0
  let quadResistances = 0
  for (const attacking of attackingIds) {
    const value = profile.byType[attacking] ?? 1
    total += value
    if (value === 0) immunities += 1
    else if (value > 1) weaknesses += 1
    else if (value < 1) resistances += 1
    if (value > 2) quadWeaknesses += 1
    if (value > 0 && value < 0.5) quadResistances += 1
  }
  return {
    partnerId,
    byType: profile.byType,
    weaknesses,
    quadWeaknesses,
    resistances,
    quadResistances,
    immunities,
    mean: attackingIds.length > 0 ? total / attackingIds.length : 1,
  }
}

/// Fewest weaknesses first, breaking ties on damage soaked then on average multiplier.
export function compareDefensive(a: DefensiveRow, b: DefensiveRow): number {
  if (a.weaknesses !== b.weaknesses) return a.weaknesses - b.weaknesses
  const aSoak = a.resistances + a.immunities * 2
  const bSoak = b.resistances + b.immunities * 2
  if (aSoak !== bSoak) return bSoak - aSoak
  return a.mean - b.mean
}

export interface MultiplierGroup {
  value: number
  typeIds: number[]
}

export function groupByMultiplier(byType: Record<number, number>, typeIds: number[]): MultiplierGroup[] {
  const buckets = new Map<number, number[]>()
  for (const typeId of typeIds) {
    const value = byType[typeId] ?? 1
    const bucket = buckets.get(value)
    if (bucket) bucket.push(typeId)
    else buckets.set(value, [typeId])
  }
  return [...buckets.entries()]
    .map(([value, ids]) => ({ value, typeIds: ids }))
    .sort((a, b) => b.value - a.value)
}
