export type IndexEntry = {
  id: number
  name: string
  label: string
  speciesId: number
  isDefault: boolean
  generation: number
  types: string[]
  stats: [number, number, number, number, number, number]
  bst: number
  height: number
  weight: number
  genus: string | null
  color: string | null
  shape: string | null
  habitat: string | null
  eggGroups: string[]
  growthRate: string | null
  captureRate: number
  genderRate: number
  baseExperience: number | null
  abilities: string[]
  legendary: boolean
  mythical: boolean
  baby: boolean
  sprite: string | null
  artwork: string | null
}

export type EvoDetail = {
  trigger: string | null
  item: string | null
  heldItem: string | null
  knownMove: string | null
  knownMoveType: string | null
  location: string | null
  minLevel: number | null
  minHappiness: number | null
  minBeauty: number | null
  minAffection: number | null
  gender: number | null
  needsOverworldRain: boolean
  partySpecies: string | null
  partyType: string | null
  relativePhysicalStats: number | null
  timeOfDay: string | null
  tradeSpecies: string | null
  turnUpsideDown: boolean
}

export type EvoNode = {
  species: string
  id: number
  isBaby: boolean
  details: EvoDetail[]
  evolvesTo: EvoNode[]
}

export type Pokemon = {
  id: number
  name: string
  label: string
  speciesId: number
  speciesName: string
  speciesLabel: string
  isDefault: boolean
  formLabel: string | null
  order: number
  generation: number
  genus: string | null
  types: string[]
  pastTypes: { generation: string; types: string[] }[]
  stats: Record<string, number>
  bst: number
  evYield: Record<string, number>
  height: number
  weight: number
  baseExperience: number | null
  abilities: { name: string; id: number; hidden: boolean; slot: number }[]
  heldItems: { name: string; versions: { version: string; rarity: number }[] }[]
  cries: { latest: string | null; legacy: string | null } | null
  sprites: {
    front: string | null
    back: string | null
    shiny: string | null
    shinyBack: string | null
    female: string | null
    shinyFemale: string | null
    artwork: string | null
    artworkShiny: string | null
    home: string | null
    homeShiny: string | null
    showdown: string | null
    showdownShiny: string | null
    dreamWorld: string | null
    versions: Record<string, Record<string, Record<string, unknown>>> | null
  }
  species: {
    captureRate: number
    baseHappiness: number | null
    genderRate: number
    hatchCounter: number | null
    growthRate: string | null
    eggGroups: string[]
    color: string | null
    shape: string | null
    habitat: string | null
    isBaby: boolean
    isLegendary: boolean
    isMythical: boolean
    hasGenderDifferences: boolean
    formsSwitchable: boolean
    evolvesFrom: string | null
    evolvesFromId: number | null
    chainId: number | null
  }
  pokedexNumbers: { pokedex: string; entry: number }[]
  flavorText: { version: string; text: string }[]
  varieties: { id: number; name: string; isDefault: boolean; label: string }[]
  evolution: { id: number; babyTriggerItem: string | null; root: EvoNode } | null
  moves: { move: string; id: number; method: string; level: number; versionGroup: string }[]
  encounters: {
    location: string
    versions: {
      version: string
      maxChance: number
      details: { method: string; chance: number; minLevel: number; maxLevel: number; conditions: string[] }[]
    }[]
  }[]
}

export type MoveIndex = {
  id: number
  name: string
  label: string
  type: string
  damageClass: string
  power: number | null
  pp: number | null
  accuracy: number | null
  priority: number
  generation: number
  shortEffect: string | null
  learners: number
}

export type Move = MoveIndex & {
  effect: string | null
  effectChance: number | null
  flavor: string | null
  target: string | null
  ailment: string | null
  ailmentChance: number
  critRate: number
  drain: number
  healing: number
  flinchChance: number
  statChance: number
  minHits: number | null
  maxHits: number | null
  minTurns: number | null
  maxTurns: number | null
  category: string | null
  statChanges: { stat: string; change: number }[]
  machines: { versionGroup: string; url: string }[]
  contestType: string | null
  learnedBy: { name: string; id: number }[]
}

export type AbilityIndex = {
  id: number
  name: string
  label: string
  generation: number
  shortEffect: string | null
  count: number
}

export type Ability = AbilityIndex & {
  isMainSeries: boolean
  effect: string | null
  flavor: string | null
  changes: { versionGroup: string; effect: string | null }[]
  pokemon: { name: string; id: number; hidden: boolean }[]
}

export type ItemIndex = {
  id: number
  name: string
  label: string
  cost: number
  category: string
  sprite: string | null
  shortEffect: string | null
  attributes: string[]
}

export type Item = ItemIndex & {
  effect: string | null
  flavor: string | null
  flingPower: number | null
  flingEffect: string | null
  heldBy: { name: string; id: number }[]
}

export type TypeInfo = {
  id: number
  name: string
  label: string
  generation: number
  damage: {
    double_from: string[]
    half_from: string[]
    no_from: string[]
    double_to: string[]
    half_to: string[]
    no_to: string[]
  }
  moveCount: number
  pokemonCount: number
}

export type Berry = {
  id: number
  name: string
  item: string
  growthTime: number
  maxHarvest: number
  naturalGiftPower: number | null
  naturalGiftType: string | null
  size: number
  smoothness: number
  soilDryness: number
  firmness: string | null
  flavors: { flavor: string; potency: number }[]
}

export type Meta = {
  generations: { id: number; name: string; label: string; region: string | null; versionGroups: string[]; speciesCount: number; moveCount: number }[]
  versionGroups: { id: number; name: string; label: string; generation: number; versions: string[]; order: number; regions: string[] }[]
  versions: { id: number; name: string; label: string; versionGroup: string }[]
  pokedexes: { id: number; name: string; label: string; description: string | null; region: string | null; isMainSeries: boolean; entries: [number, number][] }[]
  eggGroups: { id: number; name: string; label: string; count: number }[]
  natures: { id: number; name: string; label: string; increased: string | null; decreased: string | null; likes: string | null; hates: string | null }[]
  growthRates: { id: number; name: string; formula: string; levels: [number, number][] }[]
  regions: { id: number; name: string; label: string; generation: number | null; locations: number; pokedexes: string[] }[]
  itemCategories: { id: number; name: string; label: string; pocket: string; count: number }[]
  damageClasses: { id: number; name: string; description: string | null }[]
  ailments: { id: number; name: string; moves: number }[]
  stats: { id: number; name: string; label: string }[]
  counts: Record<string, number>
}
