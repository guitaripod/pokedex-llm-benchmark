import type { MoveIndexEntry } from '@/types/data'

export type Range = [number, number]
export type MoveView = 'table' | 'grid'

export const POWER_BOUNDS: Range = [0, 250]
export const ACCURACY_BOUNDS: Range = [0, 100]
export const PP_BOUNDS: Range = [1, 40]
export const PRIORITY_BOUNDS: Range = [-7, 5]

export interface MoveFilters {
  query: string
  types: number[]
  damageClasses: number[]
  generations: number[]
  flags: number[]
  target: number | null
  ailment: number | null
  category: number | null
  machineOnly: boolean
  power: Range
  accuracy: Range
  pp: Range
  priority: Range
}

export const DEFAULT_FILTERS: MoveFilters = {
  query: '',
  types: [],
  damageClasses: [],
  generations: [],
  flags: [],
  target: null,
  ailment: null,
  category: null,
  machineOnly: false,
  power: POWER_BOUNDS,
  accuracy: ACCURACY_BOUNDS,
  pp: PP_BOUNDS,
  priority: PRIORITY_BOUNDS,
}

export function sameRange(value: Range, bounds: Range): boolean {
  return value[0] === bounds[0] && value[1] === bounds[1]
}

export function activeFilterCount(filters: MoveFilters): number {
  let count = 0
  if (filters.query.trim()) count++
  count += filters.types.length ? 1 : 0
  count += filters.damageClasses.length ? 1 : 0
  count += filters.generations.length ? 1 : 0
  count += filters.flags.length
  if (filters.target !== null) count++
  if (filters.ailment !== null) count++
  if (filters.category !== null) count++
  if (filters.machineOnly) count++
  if (!sameRange(filters.power, POWER_BOUNDS)) count++
  if (!sameRange(filters.accuracy, ACCURACY_BOUNDS)) count++
  if (!sameRange(filters.pp, PP_BOUNDS)) count++
  if (!sameRange(filters.priority, PRIORITY_BOUNDS)) count++
  return count
}

export function toggleIn(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/// Serializes only the filters that differ from their defaults so shared URLs stay readable.
export function toSearchParams(filters: MoveFilters, view: MoveView): URLSearchParams {
  const params = new URLSearchParams()
  const query = filters.query.trim()
  if (query) params.set('q', query)
  if (filters.types.length) params.set('type', filters.types.join(','))
  if (filters.damageClasses.length) params.set('class', filters.damageClasses.join(','))
  if (filters.generations.length) params.set('gen', filters.generations.join(','))
  if (filters.flags.length) params.set('flag', filters.flags.join(','))
  if (filters.target !== null) params.set('target', String(filters.target))
  if (filters.ailment !== null) params.set('ailment', String(filters.ailment))
  if (filters.category !== null) params.set('category', String(filters.category))
  if (filters.machineOnly) params.set('machine', '1')
  if (!sameRange(filters.power, POWER_BOUNDS)) params.set('power', filters.power.join('-'))
  if (!sameRange(filters.accuracy, ACCURACY_BOUNDS)) params.set('acc', filters.accuracy.join('-'))
  if (!sameRange(filters.pp, PP_BOUNDS)) params.set('pp', filters.pp.join('-'))
  if (!sameRange(filters.priority, PRIORITY_BOUNDS)) {
    params.set('pri', `${filters.priority[0]}~${filters.priority[1]}`)
  }
  if (view !== 'table') params.set('view', view)
  return params
}

/// Rebuilds state from a URL, discarding anything malformed rather than throwing.
export function fromSearchParams(params: URLSearchParams): { filters: MoveFilters; view: MoveView } {
  return {
    filters: {
      query: params.get('q') ?? '',
      types: readList(params.get('type')),
      damageClasses: readList(params.get('class')),
      generations: readList(params.get('gen')),
      flags: readList(params.get('flag')),
      target: readNumber(params.get('target')),
      ailment: readNumber(params.get('ailment')),
      category: readNumber(params.get('category')),
      machineOnly: params.get('machine') === '1',
      power: readRange(params.get('power'), POWER_BOUNDS, '-'),
      accuracy: readRange(params.get('acc'), ACCURACY_BOUNDS, '-'),
      pp: readRange(params.get('pp'), PP_BOUNDS, '-'),
      priority: readRange(params.get('pri'), PRIORITY_BOUNDS, '~'),
    },
    view: params.get('view') === 'grid' ? 'grid' : 'table',
  }
}

function readList(raw: string | null): number[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value))
}

function readNumber(raw: string | null): number | null {
  if (raw === null || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function readRange(raw: string | null, bounds: Range, separator: string): Range {
  if (!raw) return bounds
  const [low, high] = raw.split(separator).map((part) => Number(part))
  if (!Number.isFinite(low) || !Number.isFinite(high)) return bounds
  return [Math.max(bounds[0], Math.min(low, high)), Math.min(bounds[1], Math.max(low, high))]
}

function matchesQuery(move: MoveIndexEntry, needle: string): boolean {
  if (move.label.toLowerCase().includes(needle)) return true
  if (move.name.includes(needle)) return true
  if (move.shortEffect?.toLowerCase().includes(needle)) return true
  for (const localized of Object.values(move.names)) {
    if (localized.toLowerCase().includes(needle)) return true
  }
  return false
}

/// A narrowed numeric range also excludes rows the dataset leaves blank, since "—" is not a value.
function withinRange(value: number | null, range: Range, bounds: Range): boolean {
  if (sameRange(range, bounds)) return true
  if (value === null) return false
  return value >= range[0] && value <= range[1]
}

export function filterMoves(
  entries: MoveIndexEntry[],
  filters: MoveFilters,
  machineMoveIds: Set<number>,
): MoveIndexEntry[] {
  const needle = filters.query.trim().toLowerCase()
  const types = new Set(filters.types)
  const damageClasses = new Set(filters.damageClasses)
  const generations = new Set(filters.generations)

  return entries.filter((move) => {
    if (needle && !matchesQuery(move, needle)) return false
    if (types.size && !types.has(move.typeId)) return false
    if (damageClasses.size && !damageClasses.has(move.damageClassId)) return false
    if (generations.size && !generations.has(move.generation)) return false
    if (filters.target !== null && move.targetId !== filters.target) return false
    if (filters.ailment !== null && move.ailmentId !== filters.ailment) return false
    if (filters.category !== null && move.categoryId !== filters.category) return false
    if (filters.machineOnly && !machineMoveIds.has(move.id)) return false
    if (filters.flags.length && !filters.flags.every((flag) => move.flags.includes(flag))) return false
    if (!withinRange(move.power, filters.power, POWER_BOUNDS)) return false
    if (!withinRange(move.accuracy, filters.accuracy, ACCURACY_BOUNDS)) return false
    if (!withinRange(move.pp, filters.pp, PP_BOUNDS)) return false
    if (!withinRange(move.priority, filters.priority, PRIORITY_BOUNDS)) return false
    return true
  })
}
