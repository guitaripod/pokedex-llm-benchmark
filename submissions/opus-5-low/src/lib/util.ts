import type { IndexEntry, TypeInfo } from './types'

export const TYPE_ORDER = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

export const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}
export const STAT_SHORT: Record<string, string> = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  'special-attack': 'SPA', 'special-defense': 'SPD', speed: 'SPE',
}

export const title = (s: string) =>
  s.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

export const padId = (n: number) => `#${String(n).padStart(n > 9999 ? 5 : 4, '0')}`

export const meters = (dm: number) => `${(dm / 10).toFixed(1)} m`
export const kilos = (hg: number) => `${(hg / 10).toFixed(1)} kg`
export const feet = (dm: number) => {
  const inches = Math.round((dm / 10) * 39.3701)
  return `${Math.floor(inches / 12)}′${String(inches % 12).padStart(2, '0')}″`
}
export const pounds = (hg: number) => `${((hg / 10) * 2.20462).toFixed(1)} lb`

export function buildChart(types: TypeInfo[]) {
  const chart: Record<string, Record<string, number>> = {}
  for (const t of types) {
    chart[t.name] = {}
    for (const d of types) chart[t.name][d.name] = 1
    for (const d of t.damage.double_to) chart[t.name][d] = 2
    for (const d of t.damage.half_to) chart[t.name][d] = 0.5
    for (const d of t.damage.no_to) chart[t.name][d] = 0
  }
  return chart
}

export function defenseProfile(chart: Record<string, Record<string, number>>, defTypes: string[]) {
  const out: Record<string, number> = {}
  for (const atk of TYPE_ORDER) {
    let mult = 1
    for (const def of defTypes) mult *= chart[atk]?.[def] ?? 1
    out[atk] = mult
  }
  return out
}

export function offenseProfile(chart: Record<string, Record<string, number>>, atkTypes: string[]) {
  const out: Record<string, number> = {}
  for (const def of TYPE_ORDER) {
    let best = 0
    for (const atk of atkTypes) best = Math.max(best, chart[atk]?.[def] ?? 1)
    out[def] = best
  }
  return out
}

export const effLabel = (m: number) =>
  m === 0 ? '0' : m === 0.25 ? '¼' : m === 0.5 ? '½' : m === 1 ? '1' : m === 2 ? '2' : m === 4 ? '4' : String(m)

export function statAtLevel(base: number, stat: string, level: number, iv: number, ev: number, natureMod = 1) {
  if (stat === 'hp') {
    if (base === 1) return 1
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
  }
  return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * natureMod)
}

export function genderText(rate: number) {
  if (rate < 0) return 'Genderless'
  const female = (rate / 8) * 100
  return `${(100 - female).toFixed(1)}% ♂ / ${female.toFixed(1)}% ♀`
}

export const catchRateApprox = (captureRate: number) => {
  const a = (captureRate * 1) / 3
  const p = Math.min(1, a / 255)
  return p
}

export function searchScore(entry: IndexEntry, q: string) {
  const n = entry.label.toLowerCase()
  const raw = entry.name.toLowerCase()
  if (n === q || raw === q) return 100
  if (n.startsWith(q) || raw.startsWith(q)) return 80
  if (n.includes(q) || raw.includes(q)) return 60
  if (String(entry.id) === q) return 95
  if (entry.genus?.toLowerCase().includes(q)) return 30
  if (entry.types.some((t) => t.startsWith(q))) return 20
  if (entry.abilities.some((a) => a.includes(q))) return 15
  return 0
}

export const spriteUrl = (e: { artwork: string | null; sprite: string | null; id: number }) =>
  e.artwork ?? e.sprite ?? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.id}.png`

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
