import { BATTLE_TYPE_IDS } from '@/lib/game'
import type { PokemonIndexEntry } from '@/types/data'

export type TypeMode = 'any' | 'all' | 'exact'
export type SortDirection = 'asc' | 'desc'

export type TraitKey =
  | 'legendary'
  | 'mythical'
  | 'baby'
  | 'fullyEvolved'
  | 'genderDiff'
  | 'mega'
  | 'gmax'
  | 'regional'
  | 'favorite'
  | 'caught'

export const TRAITS: { key: TraitKey; label: string }[] = [
  { key: 'legendary', label: 'Legendary' },
  { key: 'mythical', label: 'Mythical' },
  { key: 'baby', label: 'Baby' },
  { key: 'fullyEvolved', label: 'Final stage' },
  { key: 'genderDiff', label: 'Gender diff' },
  { key: 'mega', label: 'Mega' },
  { key: 'gmax', label: 'Gigantamax' },
  { key: 'regional', label: 'Regional' },
  { key: 'favorite', label: 'Favourites' },
  { key: 'caught', label: 'Caught' },
]

const TRAIT_LABEL = new Map(TRAITS.map((trait) => [trait.key, trait.label]))
const TRAIT_KEYS = new Set<string>(TRAITS.map((trait) => trait.key))

/** Traits that only ever match alternate forms, so selecting one must reveal them. */
const FORM_ONLY_TRAITS: TraitKey[] = ['mega', 'gmax', 'regional']

export type RangeKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'spAttack'
  | 'spDefense'
  | 'speed'
  | 'bst'
  | 'height'
  | 'weight'
  | 'capture'

export type Range = [number, number]
export type Bounds = Record<RangeKey, Range>

/// Trims the "Generation " prefix so all nine fit as chips ("Generation IV" → "IV").
export function generationShortLabel(label: string): string {
  return label.replace(/^Generation\s+/i, '')
}

/// Metric-only height for slider read-outs, where `formatHeight`'s imperial half would overflow.
export function compactHeight(decimetres: number): string {
  return `${(decimetres / 10).toFixed(1)} m`
}

/// Metric-only weight for slider read-outs, where `formatWeight`'s imperial half would overflow.
export function compactWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`
}

export interface RangeSpec {
  key: RangeKey
  param: string
  label: string
  group: 'stat' | 'physique'
  step: number
  color?: string
  value: (entry: PokemonIndexEntry) => number
  format: (value: number) => string
}

const plain = (value: number) => String(value)

export const RANGE_SPECS: RangeSpec[] = [
  { key: 'hp', param: 'hp', label: 'HP', group: 'stat', step: 1, color: 'var(--stat-hp)', value: (e) => e.stats[0], format: plain },
  { key: 'attack', param: 'atk', label: 'Attack', group: 'stat', step: 1, color: 'var(--stat-attack)', value: (e) => e.stats[1], format: plain },
  { key: 'defense', param: 'def', label: 'Defense', group: 'stat', step: 1, color: 'var(--stat-defense)', value: (e) => e.stats[2], format: plain },
  { key: 'spAttack', param: 'spa', label: 'Sp. Atk', group: 'stat', step: 1, color: 'var(--stat-special-attack)', value: (e) => e.stats[3], format: plain },
  { key: 'spDefense', param: 'spd', label: 'Sp. Def', group: 'stat', step: 1, color: 'var(--stat-special-defense)', value: (e) => e.stats[4], format: plain },
  { key: 'speed', param: 'spe', label: 'Speed', group: 'stat', step: 1, color: 'var(--stat-speed)', value: (e) => e.stats[5], format: plain },
  { key: 'bst', param: 'bst', label: 'Base stat total', group: 'stat', step: 5, value: (e) => e.bst, format: plain },
  { key: 'height', param: 'ht', label: 'Height', group: 'physique', step: 1, value: (e) => e.height, format: compactHeight },
  { key: 'weight', param: 'wt', label: 'Weight', group: 'physique', step: 10, value: (e) => e.weight, format: compactWeight },
  { key: 'capture', param: 'cap', label: 'Capture rate', group: 'physique', step: 1, value: (e) => e.captureRate, format: plain },
]

export type SortKey =
  | 'dex'
  | 'name'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'spAttack'
  | 'spDefense'
  | 'speed'
  | 'bst'
  | 'height'
  | 'weight'
  | 'capture'
  | 'baseExp'
  | 'hatch'

export const SORTS: {
  key: SortKey
  label: string
  value: (entry: PokemonIndexEntry) => number | string
}[] = [
  { key: 'dex', label: 'Dex number', value: (e) => e.dex },
  { key: 'name', label: 'Name', value: (e) => e.label },
  { key: 'hp', label: 'HP', value: (e) => e.stats[0] },
  { key: 'attack', label: 'Attack', value: (e) => e.stats[1] },
  { key: 'defense', label: 'Defense', value: (e) => e.stats[2] },
  { key: 'spAttack', label: 'Sp. Attack', value: (e) => e.stats[3] },
  { key: 'spDefense', label: 'Sp. Defense', value: (e) => e.stats[4] },
  { key: 'speed', label: 'Speed', value: (e) => e.stats[5] },
  { key: 'bst', label: 'Base stat total', value: (e) => e.bst },
  { key: 'height', label: 'Height', value: (e) => e.height },
  { key: 'weight', label: 'Weight', value: (e) => e.weight },
  { key: 'capture', label: 'Capture rate', value: (e) => e.captureRate },
  { key: 'baseExp', label: 'Base experience', value: (e) => e.baseExp },
  { key: 'hatch', label: 'Hatch counter', value: (e) => e.hatchCounter },
]

const SORT_BY_KEY = new Map(SORTS.map((sort) => [sort.key, sort]))

export interface Filters {
  q: string
  types: number[]
  typeMode: TypeMode
  generations: number[]
  pokedex: number | null
  eggGroup: number | null
  ability: number | null
  growthRate: number | null
  habitat: number | null
  shape: number | null
  color: number | null
  stage: number | null
  traits: TraitKey[]
  forms: boolean
  ranges: Bounds
  sort: SortKey
  dir: SortDirection
}

export interface MarkSets {
  favorites: Set<number>
  caught: Set<number>
}

function snap(value: number, step: number, direction: 'up' | 'down'): number {
  if (step <= 1) return Math.round(value)
  return direction === 'up' ? Math.ceil(value / step) * step : Math.floor(value / step) * step
}

/// Widest observed value per range filter, so a full-width slider always means "not filtering".
export function computeBounds(entries: PokemonIndexEntry[]): Bounds {
  const bounds = {} as Bounds
  for (const spec of RANGE_SPECS) {
    let low = Infinity
    let high = -Infinity
    for (const entry of entries) {
      const value = spec.value(entry)
      if (value < low) low = value
      if (value > high) high = value
    }
    bounds[spec.key] = Number.isFinite(low)
      ? [snap(low, spec.step, 'down'), snap(high, spec.step, 'up')]
      : [0, 0]
  }
  return bounds
}

export function defaultFilters(bounds: Bounds): Filters {
  return {
    q: '',
    types: [],
    typeMode: 'any',
    generations: [],
    pokedex: null,
    eggGroup: null,
    ability: null,
    growthRate: null,
    habitat: null,
    shape: null,
    color: null,
    stage: null,
    traits: [],
    forms: false,
    ranges: { ...bounds },
    sort: 'dex',
    dir: 'asc',
  }
}

export function isFullRange(value: Range, bound: Range): boolean {
  return value[0] === bound[0] && value[1] === bound[1]
}

export function countActiveFilters(filters: Filters, bounds: Bounds): number {
  let count = 0
  if (filters.q.trim()) count++
  count += filters.types.length
  count += filters.generations.length
  count += filters.traits.length
  if (filters.forms) count++
  for (const key of ['pokedex', 'eggGroup', 'ability', 'growthRate', 'habitat', 'shape', 'color', 'stage'] as const) {
    if (filters[key] !== null) count++
  }
  for (const spec of RANGE_SPECS) {
    if (!isFullRange(filters.ranges[spec.key], bounds[spec.key])) count++
  }
  return count
}

/* ------------------------------------------------------------ url encoding */

function readIntList(raw: string | null, allow: (value: number) => boolean): number[] {
  if (!raw) return []
  const seen = new Set<number>()
  const result: number[] = []
  for (const part of raw.split(',')) {
    const value = Number(part)
    if (!Number.isInteger(value) || !allow(value) || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

function readInt(raw: string | null): number | null {
  if (!raw) return null
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : null
}

function clamp(value: number, [low, high]: Range): number {
  return Math.min(high, Math.max(low, value))
}

function readRange(raw: string | null, spec: RangeSpec, bound: Range): Range {
  if (!raw) return bound
  const parts = raw.split('-')
  if (parts.length !== 2) return bound
  const low = Number(parts[0])
  const high = Number(parts[1])
  if (!Number.isFinite(low) || !Number.isFinite(high)) return bound
  const lowSnapped = clamp(snap(low, spec.step, 'down'), bound)
  const highSnapped = clamp(snap(high, spec.step, 'up'), bound)
  return lowSnapped <= highSnapped ? [lowSnapped, highSnapped] : bound
}

const TYPE_ID_SET = new Set(BATTLE_TYPE_IDS)

export function parseFilters(params: URLSearchParams, bounds: Bounds): Filters {
  const typeMode = params.get('tm')
  const sort = params.get('s')
  const traits = (params.get('tr') ?? '').split(',').filter((key) => TRAIT_KEYS.has(key)) as TraitKey[]
  const ranges = { ...bounds }
  for (const spec of RANGE_SPECS) {
    ranges[spec.key] = readRange(params.get(spec.param), spec, bounds[spec.key])
  }

  return {
    q: params.get('q') ?? '',
    types: readIntList(params.get('t'), (value) => TYPE_ID_SET.has(value)),
    typeMode: typeMode === 'all' || typeMode === 'exact' ? typeMode : 'any',
    generations: readIntList(params.get('g'), (value) => value >= 1 && value <= 9),
    pokedex: readInt(params.get('dx')),
    eggGroup: readInt(params.get('egg')),
    ability: readInt(params.get('ab')),
    growthRate: readInt(params.get('gr')),
    habitat: readInt(params.get('hab')),
    shape: readInt(params.get('shp')),
    color: readInt(params.get('col')),
    stage: readInt(params.get('stg')),
    traits: [...new Set(traits)],
    forms: params.get('forms') === '1',
    ranges,
    sort: sort && SORT_BY_KEY.has(sort as SortKey) ? (sort as SortKey) : 'dex',
    dir: params.get('d') === 'desc' ? 'desc' : 'asc',
  }
}

export function serializeFilters(filters: Filters, bounds: Bounds): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q)
  if (filters.types.length) params.set('t', filters.types.join(','))
  if (filters.typeMode !== 'any') params.set('tm', filters.typeMode)
  if (filters.generations.length) params.set('g', filters.generations.join(','))
  if (filters.pokedex !== null) params.set('dx', String(filters.pokedex))
  if (filters.eggGroup !== null) params.set('egg', String(filters.eggGroup))
  if (filters.ability !== null) params.set('ab', String(filters.ability))
  if (filters.growthRate !== null) params.set('gr', String(filters.growthRate))
  if (filters.habitat !== null) params.set('hab', String(filters.habitat))
  if (filters.shape !== null) params.set('shp', String(filters.shape))
  if (filters.color !== null) params.set('col', String(filters.color))
  if (filters.stage !== null) params.set('stg', String(filters.stage))
  if (filters.traits.length) params.set('tr', filters.traits.join(','))
  if (filters.forms) params.set('forms', '1')
  for (const spec of RANGE_SPECS) {
    const value = filters.ranges[spec.key]
    if (!isFullRange(value, bounds[spec.key])) params.set(spec.param, `${value[0]}-${value[1]}`)
  }
  if (filters.sort !== 'dex') params.set('s', filters.sort)
  if (filters.dir !== 'asc') params.set('d', filters.dir)
  return params
}

/* --------------------------------------------------------------- searching */

/// Case-, accent- and punctuation-insensitive key, so "mr mime" finds Mr. Mime and "Bisasam" finds Bulbasaur.
export function fold(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

export type SearchTerms = Map<number, string[]>

/// One folded term per localized name, kept separate so a query can never straddle two names.
export function buildSearchTerms(entries: PokemonIndexEntry[]): SearchTerms {
  const terms: SearchTerms = new Map()
  for (const entry of entries) {
    const bucket = new Set<string>()
    bucket.add(fold(entry.label))
    bucket.add(fold(entry.name))
    if (entry.formLabel) bucket.add(fold(entry.formLabel))
    if (entry.genus) bucket.add(fold(entry.genus))
    for (const name of Object.values(entry.names)) bucket.add(fold(name))
    terms.set(entry.id, [...bucket].filter(Boolean))
  }
  return terms
}

/* --------------------------------------------------------------- filtering */

function traitMatches(key: TraitKey, entry: PokemonIndexEntry, marks: MarkSets): boolean {
  switch (key) {
    case 'legendary':
      return entry.isLegendary
    case 'mythical':
      return entry.isMythical
    case 'baby':
      return entry.isBaby
    case 'fullyEvolved':
      return entry.isFullyEvolved
    case 'genderDiff':
      return entry.hasGenderDifferences
    case 'mega':
      return entry.isMega
    case 'gmax':
      return entry.isGmax
    case 'regional':
      return entry.variantRegion !== null
    case 'favorite':
      return marks.favorites.has(entry.id)
    case 'caught':
      return marks.caught.has(entry.id)
  }
}

function typeMatches(entry: PokemonIndexEntry, selected: number[], mode: TypeMode): boolean {
  if (mode === 'any') return entry.types.some((id) => selected.includes(id))
  if (mode === 'all') return selected.every((id) => entry.types.includes(id))
  return entry.types.length === selected.length && selected.every((id) => entry.types.includes(id))
}

/** Alternate forms stay hidden unless explicitly revealed, or implied by a form-only trait. */
export function showsAlternateForms(filters: Filters): boolean {
  return filters.forms || FORM_ONLY_TRAITS.some((trait) => filters.traits.includes(trait))
}

export interface FilterContext extends MarkSets {
  terms: SearchTerms
}

export function filterEntries(
  entries: PokemonIndexEntry[],
  filters: Filters,
  context: FilterContext,
): PokemonIndexEntry[] {
  const defaultsOnly = !showsAlternateForms(filters)
  const trimmed = filters.q.trim()
  const query = fold(trimmed)
  const dexQuery = /^#?\d+$/.test(trimmed) ? Number(trimmed.replace('#', '')) : null

  const result: PokemonIndexEntry[] = []
  for (const entry of entries) {
    if (defaultsOnly && !entry.isDefault) continue
    if (filters.generations.length && !filters.generations.includes(entry.generation)) continue
    if (filters.types.length && !typeMatches(entry, filters.types, filters.typeMode)) continue
    if (filters.stage !== null && entry.stage !== filters.stage) continue
    if (filters.growthRate !== null && entry.growthRateId !== filters.growthRate) continue
    if (filters.habitat !== null && entry.habitatId !== filters.habitat) continue
    if (filters.shape !== null && entry.shapeId !== filters.shape) continue
    if (filters.color !== null && entry.colorId !== filters.color) continue
    if (filters.eggGroup !== null && !entry.eggGroups.includes(filters.eggGroup)) continue
    if (filters.ability !== null && !entry.abilities.some((ability) => ability.id === filters.ability)) continue
    if (filters.pokedex !== null && !entry.dexNumbers.some(([id]) => id === filters.pokedex)) continue
    if (filters.traits.some((trait) => !traitMatches(trait, entry, context))) continue

    let withinRanges = true
    for (const spec of RANGE_SPECS) {
      const [low, high] = filters.ranges[spec.key]
      const value = spec.value(entry)
      if (value < low || value > high) {
        withinRanges = false
        break
      }
    }
    if (!withinRanges) continue

    if (query) {
      const matchesDex = dexQuery !== null && entry.dex === dexQuery
      if (!matchesDex && !(context.terms.get(entry.id) ?? []).some((term) => term.includes(query))) continue
    }

    result.push(entry)
  }
  return result
}

export function sortEntries(
  entries: PokemonIndexEntry[],
  sort: SortKey,
  dir: SortDirection,
): PokemonIndexEntry[] {
  const spec = SORT_BY_KEY.get(sort)
  if (!spec) return entries
  const factor = dir === 'asc' ? 1 : -1
  return [...entries].sort((a, b) => {
    const left = spec.value(a)
    const right = spec.value(b)
    const primary =
      typeof left === 'string' || typeof right === 'string'
        ? String(left).localeCompare(String(right))
        : left - right
    if (primary !== 0) return primary * factor
    return a.dex - b.dex || a.id - b.id
  })
}

/* ------------------------------------------------------------ active chips */

export interface FilterLabels {
  type: (id: number) => string
  generation: (id: number) => string
  pokedex: (id: number) => string
  eggGroup: (id: number) => string
  ability: (id: number) => string
  growthRate: (id: number) => string
  habitat: (id: number) => string
  shape: (id: number) => string
  color: (id: number) => string
}

export interface ActiveFilter {
  id: string
  label: string
  value: string
  color?: string
  patch: Partial<Filters>
}

const TYPE_MODE_LABEL: Record<TypeMode, string> = { any: 'Any of', all: 'All of', exact: 'Exactly' }

type SingleKey = 'pokedex' | 'eggGroup' | 'ability' | 'growthRate' | 'habitat' | 'shape' | 'color'

export function describeFilters(
  filters: Filters,
  bounds: Bounds,
  labels: FilterLabels,
  typeColor: (id: number) => string,
): ActiveFilter[] {
  const chips: ActiveFilter[] = []

  if (filters.q.trim()) {
    chips.push({ id: 'q', label: 'Search', value: filters.q.trim(), patch: { q: '' } })
  }

  for (const id of filters.types) {
    chips.push({
      id: `type-${id}`,
      label: TYPE_MODE_LABEL[filters.typeMode],
      value: labels.type(id),
      color: typeColor(id),
      patch: { types: filters.types.filter((value) => value !== id) },
    })
  }

  for (const id of filters.generations) {
    chips.push({
      id: `gen-${id}`,
      label: 'Gen',
      value: labels.generation(id),
      patch: { generations: filters.generations.filter((value) => value !== id) },
    })
  }

  const singles: { key: SingleKey; label: string; render: (id: number) => string }[] = [
    { key: 'pokedex', label: 'Pokédex', render: labels.pokedex },
    { key: 'eggGroup', label: 'Egg group', render: labels.eggGroup },
    { key: 'ability', label: 'Ability', render: labels.ability },
    { key: 'growthRate', label: 'Growth', render: labels.growthRate },
    { key: 'habitat', label: 'Habitat', render: labels.habitat },
    { key: 'shape', label: 'Shape', render: labels.shape },
    { key: 'color', label: 'Colour', render: labels.color },
  ]

  for (const single of singles) {
    const value = filters[single.key]
    if (value === null) continue
    chips.push({
      id: single.key,
      label: single.label,
      value: single.render(value),
      patch: { [single.key]: null } as Partial<Filters>,
    })
  }

  if (filters.stage !== null) {
    chips.push({ id: 'stage', label: 'Stage', value: `${filters.stage}`, patch: { stage: null } })
  }

  for (const trait of filters.traits) {
    chips.push({
      id: `trait-${trait}`,
      label: 'Only',
      value: TRAIT_LABEL.get(trait) ?? trait,
      patch: { traits: filters.traits.filter((value) => value !== trait) },
    })
  }

  if (filters.forms) {
    chips.push({ id: 'forms', label: 'Including', value: 'Alternate forms', patch: { forms: false } })
  }

  for (const spec of RANGE_SPECS) {
    const value = filters.ranges[spec.key]
    if (isFullRange(value, bounds[spec.key])) continue
    chips.push({
      id: `range-${spec.key}`,
      label: spec.label,
      value: `${spec.format(value[0])} – ${spec.format(value[1])}`,
      color: spec.color,
      patch: { ranges: { ...filters.ranges, [spec.key]: bounds[spec.key] } },
    })
  }

  return chips
}
