export interface SpeciesIndex {
  id: number
  name: string
  dname: string
  jname: string | null
  genus: string
  gen: number
  types: string[]
  stats: number[]
  bst: number
  height: number
  weight: number
  color: string | null
  shape: string | null
  habitat: string | null
  eggGroups: string[]
  captureRate: number
  genderRate: number
  growthRate: string | null
  legendary: boolean
  mythical: boolean
  baby: boolean
  abilities: { n: string; h: boolean }[]
  forms: number
}

export interface FlavorGroup {
  v: string[]
  t: string
}

export interface EvoNode {
  sid: number
  name: string
  dname: string
  conds: string[]
  to: EvoNode[]
}

export type CompactMove = [string, [number, number, number][]]

export interface Variety {
  pid: number
  name: string
  dname: string
  isDefault: boolean
  types: string[]
  pastTypes: { until: number; types: string[] }[]
  stats: number[]
  abilities: { n: string; h: boolean }[]
  height: number
  weight: number
  baseExp: number | null
  art: string | null
  artShiny: string | null
  home: string | null
  homeShiny: string | null
  sprite: string | null
  spriteShiny: string | null
  spriteBack: string | null
  cry: string | null
  heldItems: string[]
  moves: CompactMove[]
}

export interface SpriteEra {
  gen: number
  game: string
  front: string
  back: string | null
  shiny: string | null
  backShiny: string | null
}

export interface EncounterRow {
  v: string
  areas: string[]
}

export interface AdjacentSpecies {
  id: number
  dname: string
}

export interface PokemonDetail {
  id: number
  name: string
  dname: string
  jname: string | null
  genus: string
  gen: number
  flavor: FlavorGroup[]
  color: string | null
  shape: string | null
  habitat: string | null
  growthRate: string | null
  captureRate: number
  baseHappiness: number | null
  hatchCounter: number | null
  genderRate: number
  eggGroups: string[]
  legendary: boolean
  mythical: boolean
  baby: boolean
  evo: EvoNode | null
  varieties: Variety[]
  spriteHistory: SpriteEra[]
  encounters: EncounterRow[]
  prev: AdjacentSpecies | null
  next: AdjacentSpecies | null
}

export interface TypesData {
  order: string[]
  dnames: Record<string, string>
  matrix: number[][]
}

export interface MoveIndex {
  id: number
  name: string
  dname: string
  type: string
  dclass: string
  power: number | null
  acc: number | null
  pp: number | null
  priority: number
  gen: number
  effect: string
}

export interface MoveMeta {
  ailment: string | null
  ailmentChance: number | null
  critRate: number | null
  drain: number | null
  flinchChance: number | null
  healing: number | null
  minHits: number | null
  maxHits: number | null
}

export interface MoveDetail extends MoveIndex {
  effectFull: string
  flavor: FlavorGroup[]
  target: string
  meta: MoveMeta | null
  statChanges: { stat: string; change: number }[]
  learners: number[]
}

export interface AbilityIndex {
  id: number
  name: string
  dname: string
  gen: number
  effect: string
}

export interface AbilityHolder {
  sid: number
  pid: number
  pdname: string
  hidden: boolean
}

export interface AbilityDetail extends AbilityIndex {
  effectFull: string
  flavor: string | null
  holders: AbilityHolder[]
}

export interface Item {
  id: number
  name: string
  dname: string
  cat: string
  catD: string
  effect: string
  flavor: string
  cost: number
  fling: number | null
  sprite: string | null
  attrs: string[]
}

export interface GenMeta {
  id: number
  name: string
  dname: string
  region: string | null
  range: [number, number]
}

export interface VgMeta {
  name: string
  dname: string
  gen: number
  versions: string[]
}

export interface Meta {
  builtAt: string
  counts: {
    species: number
    pokemon: number
    moves: number
    abilities: number
    items: number
    types: number
  }
  gens: GenMeta[]
  vgs: VgMeta[]
  methods: { name: string; dname: string }[]
  versions: Record<string, string>
  eggGroups: Record<string, string>
  colors: Record<string, string>
  shapes: Record<string, string>
  habitats: Record<string, string>
  growthRates: Record<string, string>
  damageClasses: Record<string, string>
  statNames: string[]
}
