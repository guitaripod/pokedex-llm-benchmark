/**
 * Wire contract for every JSON file emitted by `scripts/build-data.ts` and consumed by the app.
 *
 * Large collections use positional tuples instead of keyed objects: a learnset averages ~470 rows
 * per Pokémon and the national dex ships ~638k rows in total, so field names would dominate payload
 * size. Tuple indices are documented next to each alias.
 */

export type Slug = string

/** `[moveId, versionGroupId, methodId, level, order]` */
export type LearnsetTuple = [number, number, number, number, number]

/** `[versionId, locationAreaId, methodId, minLevel, maxLevel, rarity, conditionValueIds]` */
export type EncounterTuple = [number, number, number, number, number, number, number[]]

/** `[pokemonId, minLevel, maxLevel, rarity, methodId, versionId]` */
export type AreaEncounterTuple = [number, number, number, number, number, number]

/** `[itemId, versionId, rarity]` */
export type HeldItemTuple = [number, number, number]

/** `[versionId, text]` */
export type FlavorTuple = [number, string]

/** `[pokedexId, entryNumber]` */
export type DexNumberTuple = [number, number]

export interface Named {
  id: number
  name: Slug
  label: string
}

export interface LocalizedNamed extends Named {
  names?: Record<string, string>
}

/* ------------------------------------------------------------------ meta */

export interface TypeInfo extends LocalizedNamed {
  generation: number
  damageClass: number | null
}

export interface GenerationInfo extends LocalizedNamed {
  mainRegionId: number | null
  versionGroupIds: number[]
}

export interface VersionInfo extends LocalizedNamed {
  versionGroupId: number
}

export interface VersionGroupInfo extends Named {
  generation: number
  order: number
  versionIds: number[]
  regionIds: number[]
  moveMethodIds: number[]
  pokedexIds: number[]
}

export interface RegionInfo extends LocalizedNamed {
  generationId: number | null
  locationIds: number[]
  pokedexIds: number[]
}

export interface PokedexInfo extends LocalizedNamed {
  regionId: number | null
  isMainSeries: boolean
  description: string | null
  versionGroupIds: number[]
  entryCount: number
}

export interface StatInfo extends LocalizedNamed {
  isBattleOnly: boolean
  damageClass: number | null
}

export interface NatureInfo extends LocalizedNamed {
  increasedStatId: number | null
  decreasedStatId: number | null
  likesFlavorId: number | null
  hatesFlavorId: number | null
  pokeathlon: { statId: number; maxChange: number }[]
}

export interface GrowthRateInfo extends Named {
  formula: string
  /** Cumulative experience required to reach index+1 (level 1 → 100). */
  levels: number[]
}

export interface EggGroupInfo extends LocalizedNamed {
  speciesCount: number
}

export interface AbilityLite extends LocalizedNamed {
  generation: number
  isMainSeries: boolean
  shortEffect: string | null
  pokemonCount: number
}

export interface ItemCategoryInfo extends LocalizedNamed {
  pocketId: number
}

export interface EncounterMethodInfo extends LocalizedNamed {
  order: number
}

export interface EncounterConditionValueInfo extends LocalizedNamed {
  conditionId: number
  isDefault: boolean
}

export interface MoveAilmentInfo extends LocalizedNamed {}

export interface MoveTargetInfo extends LocalizedNamed {
  description: string | null
}

export interface CharacteristicInfo {
  id: number
  statId: number
  geneModulo: number
  description: string
}

export interface BerryInfo {
  id: number
  itemId: number
  name: Slug
  label: string
  firmnessId: number
  naturalGiftPower: number
  naturalGiftTypeId: number | null
  size: number
  maxHarvest: number
  growthTime: number
  soilDryness: number
  smoothness: number
  flavors: { flavorId: number; potency: number }[]
}

export interface MachineInfo {
  itemId: number
  moveId: number
  versionGroupId: number
  number: number
}

export interface MetaData {
  generatedAt: string
  counts: Record<string, number>
  types: TypeInfo[]
  /** `typeChart[attackerId][defenderId]` as a multiplier (0, 0.5, 1, 2). */
  typeChart: Record<number, Record<number, number>>
  /** Pre-Gen-VI efficacy overrides keyed by the generation they stopped applying after. */
  typeChartPast: { untilGeneration: number; chart: Record<number, Record<number, number>> }[]
  generations: GenerationInfo[]
  versions: VersionInfo[]
  versionGroups: VersionGroupInfo[]
  regions: RegionInfo[]
  pokedexes: PokedexInfo[]
  stats: StatInfo[]
  natures: NatureInfo[]
  growthRates: GrowthRateInfo[]
  eggGroups: EggGroupInfo[]
  habitats: LocalizedNamed[]
  shapes: LocalizedNamed[]
  colors: LocalizedNamed[]
  damageClasses: LocalizedNamed[]
  moveTargets: MoveTargetInfo[]
  moveMethods: LocalizedNamed[]
  moveAilments: MoveAilmentInfo[]
  moveCategories: LocalizedNamed[]
  moveFlags: LocalizedNamed[]
  itemPockets: LocalizedNamed[]
  itemCategories: ItemCategoryInfo[]
  itemAttributes: LocalizedNamed[]
  itemFlingEffects: Named[]
  encounterMethods: EncounterMethodInfo[]
  encounterConditions: LocalizedNamed[]
  encounterConditionValues: EncounterConditionValueInfo[]
  evolutionTriggers: LocalizedNamed[]
  contestTypes: LocalizedNamed[]
  berryFirmnesses: LocalizedNamed[]
  berryFlavors: LocalizedNamed[]
  berries: BerryInfo[]
  machines: MachineInfo[]
  characteristics: CharacteristicInfo[]
  palParkAreas: LocalizedNamed[]
  languages: { id: number; code: string; label: string }[]
  genders: Named[]
}

/* --------------------------------------------------------------- pokémon */

export type StatBlock = [number, number, number, number, number, number]

export interface PokemonIndexEntry {
  id: number
  speciesId: number
  name: Slug
  label: string
  /** National dex number; equals speciesId for every main-series species. */
  dex: number
  types: number[]
  stats: StatBlock
  bst: number
  height: number
  weight: number
  baseExp: number
  generation: number
  isDefault: boolean
  /** Form suffix such as `alola`, `mega-x`, `gmax`; null for the base form. */
  form: string | null
  formLabel: string | null
  isMega: boolean
  isGmax: boolean
  isBattleOnly: boolean
  /** Region a regional variant belongs to, derived from its form name. */
  variantRegion: string | null
  abilities: { id: number; slot: number; hidden: boolean }[]
  eggGroups: number[]
  colorId: number
  shapeId: number | null
  habitatId: number | null
  growthRateId: number
  captureRate: number
  baseHappiness: number
  hatchCounter: number
  /** -1 = genderless, otherwise eighths female. */
  genderRate: number
  isLegendary: boolean
  isMythical: boolean
  isBaby: boolean
  hasGenderDifferences: boolean
  evolutionChainId: number | null
  evolvesFromSpeciesId: number | null
  /** 1-indexed position within the evolution chain. */
  stage: number
  isFullyEvolved: boolean
  genus: string | null
  /** Localized species names, keyed by language identifier (`ja`, `fr`, …). */
  names: Record<string, string>
  /** National + regional dex numbers for pokédex filtering. */
  dexNumbers: DexNumberTuple[]
  hasCry: boolean
}

export interface PokemonIndex {
  generatedAt: string
  entries: PokemonIndexEntry[]
}

export interface EvolutionDetail {
  triggerId: number
  triggerItemId: number | null
  minLevel: number | null
  genderId: number | null
  locationId: number | null
  heldItemId: number | null
  timeOfDay: string | null
  knownMoveId: number | null
  knownMoveTypeId: number | null
  minHappiness: number | null
  minBeauty: number | null
  minAffection: number | null
  relativePhysicalStats: number | null
  partySpeciesId: number | null
  partyTypeId: number | null
  tradeSpeciesId: number | null
  needsOverworldRain: boolean
  turnUpsideDown: boolean
  needsMultiplayer: boolean
  nearSpecialRock: boolean
  regionId: number | null
  usedMoveId: number | null
  minMoveCount: number | null
  minSteps: number | null
  minDamageTaken: number | null
  versionGroupId: number | null
  /** Human-readable rendering of the whole condition set. */
  text: string
}

export interface EvolutionNode {
  speciesId: number
  name: Slug
  label: string
  /** Default Pokémon id for artwork. */
  pokemonId: number
  types: number[]
  isBaby: boolean
  details: EvolutionDetail[]
  children: EvolutionNode[]
}

export interface EvolutionChain {
  id: number
  babyTriggerItemId: number | null
  /**
   * Usually one tree. A few chains are genuinely a forest: Phione and Manaphy share chain 250 while
   * neither evolves from the other, so both are roots.
   */
  roots: EvolutionNode[]
  speciesIds: number[]
}

export interface PokemonVariety {
  id: number
  name: Slug
  label: string
  isDefault: boolean
  form: string | null
  isMega: boolean
  isGmax: boolean
  isBattleOnly: boolean
  types: number[]
  stats: StatBlock
}

export interface PokemonForm {
  id: number
  name: Slug
  label: string
  formName: string | null
  isDefault: boolean
  isBattleOnly: boolean
  isMega: boolean
  formOrder: number
  introducedInVersionGroupId: number | null
  types: number[] | null
  /** Sprite key; form sprites live under the form's own id in the sprite repo. */
  spriteId: number
  conditions: { versionGroupId: number; description: string | null }[]
}

export interface PastTypeSet {
  untilGeneration: number
  types: number[]
}

export interface PastAbilitySet {
  untilGeneration: number
  abilities: { id: number | null; slot: number; hidden: boolean }[]
}

export interface PastStatSet {
  untilGeneration: number
  stats: Partial<Record<number, number>>
}

export interface PokemonDetail {
  id: number
  speciesId: number
  name: Slug
  label: string
  dex: number
  order: number
  isDefault: boolean
  form: string | null
  formLabel: string | null
  isMega: boolean
  isGmax: boolean
  isBattleOnly: boolean
  variantRegion: string | null
  height: number
  weight: number
  baseExp: number
  generation: number
  types: number[]
  pastTypes: PastTypeSet[]
  stats: StatBlock
  effortYield: StatBlock
  pastStats: PastStatSet[]
  abilities: { id: number; slot: number; hidden: boolean }[]
  pastAbilities: PastAbilitySet[]

  species: {
    id: number
    name: Slug
    label: string
    genus: string | null
    names: Record<string, string>
    genera: Record<string, string>
    generation: number
    colorId: number
    shapeId: number | null
    habitatId: number | null
    growthRateId: number
    captureRate: number
    baseHappiness: number
    hatchCounter: number
    genderRate: number
    eggGroups: number[]
    isLegendary: boolean
    isMythical: boolean
    isBaby: boolean
    hasGenderDifferences: boolean
    formsSwitchable: boolean
    evolutionChainId: number | null
    evolvesFromSpeciesId: number | null
    description: string | null
    formDescription: string | null
  }

  flavorText: FlavorTuple[]
  dexNumbers: DexNumberTuple[]
  varieties: PokemonVariety[]
  forms: PokemonForm[]
  moves: LearnsetTuple[]
  encounters: EncounterTuple[]
  heldItems: HeldItemTuple[]
  gameIndices: { versionId: number; gameIndex: number }[]
  palPark: { areaId: number; baseScore: number; rate: number }[]
  pokeathlon: { statId: number; base: number; min: number; max: number }[]
  evolutionChain: EvolutionChain | null
  /** Species ids sharing this evolution chain, for quick sibling navigation. */
  cries: { latest: boolean; legacy: boolean }
}

/* ----------------------------------------------------------------- moves */

export interface MoveIndexEntry {
  id: number
  name: Slug
  label: string
  typeId: number
  damageClassId: number
  power: number | null
  pp: number | null
  accuracy: number | null
  priority: number
  generation: number
  targetId: number
  categoryId: number | null
  ailmentId: number | null
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
  effectChance: number | null
  shortEffect: string | null
  flags: number[]
  contestTypeId: number | null
  learnedByCount: number
  names: Record<string, string>
}

export interface MoveIndex {
  generatedAt: string
  entries: MoveIndexEntry[]
}

export interface MoveDetail extends MoveIndexEntry {
  effect: string | null
  effectId: number | null
  flavorText: { versionGroupId: number; text: string }[]
  statChanges: { statId: number; change: number }[]
  machines: { versionGroupId: number; itemId: number; number: number }[]
  /** `[pokemonId, versionGroupId, methodId, level]` */
  learnedBy: [number, number, number, number][]
  contestEffect: { appeal: number; jam: number; effect: string | null } | null
  superContestEffect: { appeal: number; effect: string | null } | null
  contestCombos: { useBefore: number[]; useAfter: number[] }
  changelog: {
    versionGroupId: number
    typeId: number | null
    power: number | null
    pp: number | null
    accuracy: number | null
    effectChance: number | null
    effectId: number | null
  }[]
}

/* ------------------------------------------------------------- abilities */

export interface AbilityIndexEntry {
  id: number
  name: Slug
  label: string
  generation: number
  isMainSeries: boolean
  shortEffect: string | null
  pokemonCount: number
  names: Record<string, string>
}

export interface AbilityIndex {
  generatedAt: string
  entries: AbilityIndexEntry[]
}

export interface AbilityDetail extends AbilityIndexEntry {
  effect: string | null
  flavorText: { versionGroupId: number; text: string }[]
  /** `[pokemonId, slot, isHidden]` */
  pokemon: [number, number, number][]
  changelog: { versionGroupId: number; effect: string | null }[]
}

/* ----------------------------------------------------------------- items */

export interface ItemIndexEntry {
  id: number
  name: Slug
  label: string
  categoryId: number
  pocketId: number
  cost: number
  flingPower: number | null
  flingEffectId: number | null
  attributes: number[]
  shortEffect: string | null
  /** Sprite slug under `sprites/items/`; null when the repo has no art. */
  sprite: string | null
  isBerry: boolean
  names: Record<string, string>
}

export interface ItemIndex {
  generatedAt: string
  entries: ItemIndexEntry[]
}

export interface ItemDetail extends ItemIndexEntry {
  effect: string | null
  flavorText: { versionGroupId: number; text: string }[]
  gameIndices: { generationId: number; gameIndex: number }[]
  /** Pokémon found holding this item: `[pokemonId, versionId, rarity]` */
  heldBy: HeldItemTuple[]
  /** Move taught when this item is a TM/HM/TR. */
  machine: { moveId: number; versionGroupId: number; number: number }[]
  berry: BerryInfo | null
  babyTriggerFor: number[]
  evolvesWith: { speciesId: number; kind: 'trigger' | 'held' }[]
}

/* ------------------------------------------------------------- locations */

export interface LocationIndexEntry {
  id: number
  name: Slug
  label: string
  regionId: number | null
  areaCount: number
  pokemonCount: number
  generationIds: number[]
  names: Record<string, string>
}

export interface LocationIndex {
  generatedAt: string
  entries: LocationIndexEntry[]
}

export interface LocationAreaDetail {
  id: number
  name: Slug
  label: string
  encounters: AreaEncounterTuple[]
  encounterRates: { versionId: number; methodId: number; rate: number }[]
}

export interface LocationDetail extends LocationIndexEntry {
  gameIndices: { generationId: number; gameIndex: number }[]
  areas: LocationAreaDetail[]
}

/** `[locationId, locationSlug, areaLabel]` — resolves the bare area ids inside EncounterTuple. */
export type LocationAreaRef = [number, string, string]

export interface LocationAreaLookup {
  generatedAt: string
  areas: Record<number, LocationAreaRef>
}

/* -------------------------------------------------------- search palette */

export type SearchKind = 'pokemon' | 'move' | 'item' | 'ability' | 'location' | 'type' | 'nature' | 'page'

/** `[kind, id, slug, label, extra]` — extra is a type id for Pokémon/moves, else null. */
export type SearchTuple = [SearchKind, number, string, string, number | null]

export interface SearchIndex {
  generatedAt: string
  entries: SearchTuple[]
}
