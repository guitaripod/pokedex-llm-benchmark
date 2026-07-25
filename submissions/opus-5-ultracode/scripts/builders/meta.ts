import type { Row } from '../lib/csv.ts'
import { loadCsv, int, num, bool, cleanText, groupBy, nameMap, localizedNames, ENGLISH } from '../lib/csv.ts'
import { emit, GENERATED_AT, titleize } from '../lib/emit.ts'
import type {
  BerryInfo,
  CharacteristicInfo,
  EggGroupInfo,
  EncounterConditionValueInfo,
  EncounterMethodInfo,
  GenerationInfo,
  GrowthRateInfo,
  ItemCategoryInfo,
  LocalizedNamed,
  MachineInfo,
  MetaData,
  MoveTargetInfo,
  Named,
  NatureInfo,
  PokedexInfo,
  RegionInfo,
  StatInfo,
  TypeInfo,
  VersionGroupInfo,
  VersionInfo,
} from '../../src/types/data.ts'

/// PokéAPI prose ships English names inconsistently: some are entirely lowercase (`medium slow`,
/// `water's edge`) and some keep raw slug underscores (`Usable_overworld`). Both are normalised for
/// display; names that already read as prose are left untouched.
function displayCase(value: string): string {
  const spaced = value.replace(/_/g, ' ')
  if (!value.includes('_') && spaced !== spaced.toLowerCase()) return spaced
  return spaced.replace(/(^|[\s-])([a-z])/g, (_match, lead: string, letter: string) => lead + letter.toUpperCase())
}

function sortById<T extends { id: number }>(list: T[]): T[] {
  return list.sort((a, b) => a.id - b.id)
}

function languageCodes(): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv('languages')) map.set(int(row.id), row.identifier)
  return map
}

/// English value of an arbitrary prose column (`description`, `message`, `flavor`, …).
function englishColumn(table: string, idField: string, column: string): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv(table)) {
    if (int(row.local_language_id) !== ENGLISH) continue
    const value = row[column]
    if (value) map.set(int(row[idField]), value)
  }
  return map
}

/// Localized values of an arbitrary prose column, keyed by language identifier.
function localizedColumn(table: string, idField: string, column: string): Map<number, Record<string, string>> {
  const codes = languageCodes()
  const map = new Map<number, Record<string, string>>()
  for (const row of loadCsv(table)) {
    const code = codes.get(int(row.local_language_id))
    const value = row[column]
    if (!code || !value) continue
    const id = int(row[idField])
    let entry = map.get(id)
    if (!entry) {
      entry = {}
      map.set(id, entry)
    }
    entry[code] = cleanText(value)
  }
  return map
}

/// Sorted, deduplicated id lists gathered from a join (or foreign-key) table; blank keys are dropped.
function joinIds(table: string, ownerField: string, valueField: string): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (const row of loadCsv(table)) {
    const owner = num(row[ownerField])
    const value = num(row[valueField])
    if (owner === null || value === null) continue
    const list = map.get(owner)
    if (list) list.push(value)
    else map.set(owner, [value])
  }
  for (const [key, list] of map) map.set(key, [...new Set(list)].sort((a, b) => a - b))
  return map
}

function counted(table: string, field: string): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of loadCsv(table)) {
    const id = num(row[field])
    if (id === null) continue
    map.set(id, (map.get(id) ?? 0) + 1)
  }
  return map
}

interface Labels {
  label: Map<number, string>
  names: Map<number, Record<string, string>>
}

function labelsFrom(namesTable: string, idField: string): Labels {
  return { label: nameMap(namesTable, idField), names: localizedNames(namesTable, idField) }
}

/// Standard `<table>` + `<table>_names/_prose` pairing: slug from `identifier`, label from English prose.
function localizedList(table: string, namesTable: string, idField: string): LocalizedNamed[] {
  const { label, names } = labelsFrom(namesTable, idField)
  return sortById(
    loadCsv(table).map((row) => {
      const id = int(row.id)
      const english = label.get(id)
      return {
        id,
        name: row.identifier,
        label: english ? displayCase(english) : titleize(row.identifier),
        names: names.get(id),
      }
    }),
  )
}

function buildTypeChart(rows: Row[]): Record<number, Record<number, number>> {
  const chart: Record<number, Record<number, number>> = {}
  for (const row of rows) {
    const attacker = int(row.damage_type_id)
    let entry = chart[attacker]
    if (!entry) {
      entry = {}
      chart[attacker] = entry
    }
    entry[int(row.target_type_id)] = int(row.damage_factor) / 100
  }
  return chart
}

function buildTypes(): TypeInfo[] {
  const { label, names } = labelsFrom('type_names', 'type_id')
  return sortById(
    loadCsv('types').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        generation: int(row.generation_id),
        damageClass: num(row.damage_class_id),
      }
    }),
  )
}

function buildTypeChartPast(): MetaData['typeChartPast'] {
  const grouped = groupBy(loadCsv('type_efficacy_past'), (row) => int(row.generation_id))
  return [...grouped]
    .map(([generation, rows]) => ({ untilGeneration: Number(generation), chart: buildTypeChart(rows) }))
    .sort((a, b) => a.untilGeneration - b.untilGeneration)
}

function buildGenerations(): GenerationInfo[] {
  const { label, names } = labelsFrom('generation_names', 'generation_id')
  const versionGroups = joinIds('version_groups', 'generation_id', 'id')
  return sortById(
    loadCsv('generations').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: label.get(id) ?? titleize(row.identifier),
        names: names.get(id),
        mainRegionId: num(row.main_region_id),
        versionGroupIds: versionGroups.get(id) ?? [],
      }
    }),
  )
}

function buildVersions(): VersionInfo[] {
  const { label, names } = labelsFrom('version_names', 'version_id')
  return sortById(
    loadCsv('versions').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: label.get(id) ?? titleize(row.identifier),
        names: names.get(id),
        versionGroupId: int(row.version_group_id),
      }
    }),
  )
}

/// `red-blue` reads better as `Red/Blue`, so version-group labels are assembled from their versions.
function versionGroupLabel(versionIds: number[], versionLabels: Map<number, string>, identifier: string): string {
  const parts = versionIds.map((id) => versionLabels.get(id)).filter((part): part is string => Boolean(part))
  return parts.length ? parts.join('/') : titleize(identifier)
}

/// `version_group_pokemon_move_methods` stops at Sword/Shield, so groups introduced afterwards (BDSP,
/// Legends: Arceus, Scarlet/Violet, Champions) fall back to the methods their learnsets actually use.
function moveMethodsByVersionGroup(): Map<number, number[]> {
  const declared = joinIds('version_group_pokemon_move_methods', 'version_group_id', 'pokemon_move_method_id')
  const missing = loadCsv('version_groups')
    .map((row) => int(row.id))
    .filter((id) => !declared.has(id))
  if (!missing.length) return declared
  const wanted = new Set(missing)
  const observed = new Map<number, Set<number>>()
  for (const row of loadCsv('pokemon_moves')) {
    const versionGroup = int(row.version_group_id)
    if (!wanted.has(versionGroup)) continue
    let methods = observed.get(versionGroup)
    if (!methods) {
      methods = new Set<number>()
      observed.set(versionGroup, methods)
    }
    methods.add(int(row.pokemon_move_method_id))
  }
  for (const [versionGroup, methods] of observed) declared.set(versionGroup, [...methods].sort((a, b) => a - b))
  return declared
}

function buildVersionGroups(): VersionGroupInfo[] {
  const versionLabels = nameMap('version_names', 'version_id')
  const versions = joinIds('versions', 'version_group_id', 'id')
  const regions = joinIds('version_group_regions', 'version_group_id', 'region_id')
  const methods = moveMethodsByVersionGroup()
  const pokedexes = joinIds('pokedex_version_groups', 'version_group_id', 'pokedex_id')
  return sortById(
    loadCsv('version_groups').map((row) => {
      const id = int(row.id)
      const versionIds = versions.get(id) ?? []
      return {
        id,
        name: row.identifier,
        label: versionGroupLabel(versionIds, versionLabels, row.identifier),
        generation: int(row.generation_id),
        order: int(row.order),
        versionIds,
        regionIds: regions.get(id) ?? [],
        moveMethodIds: methods.get(id) ?? [],
        pokedexIds: pokedexes.get(id) ?? [],
      }
    }),
  )
}

/// `regions` carries no generation column: the main-series mapping comes from `generations.main_region_id`,
/// and side regions such as Hisui fall back to the earliest generation whose version groups cover them.
function regionGenerations(): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of loadCsv('generations')) {
    const regionId = num(row.main_region_id)
    if (regionId !== null) map.set(regionId, int(row.id))
  }
  const mainSeries = new Set(map.keys())
  const versionGroupGenerations = new Map<number, number>()
  for (const row of loadCsv('version_groups')) versionGroupGenerations.set(int(row.id), int(row.generation_id))
  for (const row of loadCsv('version_group_regions')) {
    const regionId = int(row.region_id)
    if (mainSeries.has(regionId)) continue
    const generation = versionGroupGenerations.get(int(row.version_group_id))
    if (generation === undefined) continue
    const current = map.get(regionId)
    if (current === undefined || generation < current) map.set(regionId, generation)
  }
  return map
}

function buildRegions(): RegionInfo[] {
  const { label, names } = labelsFrom('region_names', 'region_id')
  const locations = joinIds('locations', 'region_id', 'id')
  const pokedexes = joinIds('pokedexes', 'region_id', 'id')
  const generations = regionGenerations()
  return sortById(
    loadCsv('regions').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        generationId: generations.get(id) ?? null,
        locationIds: locations.get(id) ?? [],
        pokedexIds: pokedexes.get(id) ?? [],
      }
    }),
  )
}

function buildPokedexes(): PokedexInfo[] {
  const { label, names } = labelsFrom('pokedex_prose', 'pokedex_id')
  const descriptions = englishColumn('pokedex_prose', 'pokedex_id', 'description')
  const versionGroups = joinIds('pokedex_version_groups', 'pokedex_id', 'version_group_id')
  const entries = counted('pokemon_dex_numbers', 'pokedex_id')
  return sortById(
    loadCsv('pokedexes').map((row) => {
      const id = int(row.id)
      const description = descriptions.get(id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        regionId: num(row.region_id),
        isMainSeries: bool(row.is_main_series),
        description: description ? cleanText(description) : null,
        versionGroupIds: versionGroups.get(id) ?? [],
        entryCount: entries.get(id) ?? 0,
      }
    }),
  )
}

function buildStats(): StatInfo[] {
  const { label, names } = labelsFrom('stat_names', 'stat_id')
  return sortById(
    loadCsv('stats').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        isBattleOnly: bool(row.is_battle_only),
        damageClass: num(row.damage_class_id),
      }
    }),
  )
}

function buildNatures(): NatureInfo[] {
  const { label, names } = labelsFrom('nature_names', 'nature_id')
  const pokeathlon = groupBy(loadCsv('nature_pokeathlon_stats'), (row) => int(row.nature_id))
  return sortById(
    loadCsv('natures').map((row) => {
      const id = int(row.id)
      const changes = (pokeathlon.get(id) ?? [])
        .map((entry) => ({ statId: int(entry.pokeathlon_stat_id), maxChange: int(entry.max_change) }))
        .sort((a, b) => a.statId - b.statId)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        increasedStatId: num(row.increased_stat_id),
        decreasedStatId: num(row.decreased_stat_id),
        likesFlavorId: num(row.likes_flavor_id),
        hatesFlavorId: num(row.hates_flavor_id),
        pokeathlon: changes,
      }
    }),
  )
}

/// `experience.csv` holds one row per level; index 0 is level 1 so `levels[99]` is the level-100 total.
function experienceCurves(): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (const row of loadCsv('experience')) {
    const id = int(row.growth_rate_id)
    let levels = map.get(id)
    if (!levels) {
      levels = new Array<number>(100).fill(0)
      map.set(id, levels)
    }
    const level = int(row.level)
    if (level >= 1 && level <= 100) levels[level - 1] = int(row.experience)
  }
  return map
}

function buildGrowthRates(): GrowthRateInfo[] {
  const label = nameMap('growth_rate_prose', 'growth_rate_id')
  const curves = experienceCurves()
  return sortById(
    loadCsv('growth_rates').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        formula: row.formula,
        levels: curves.get(id) ?? [],
      }
    }),
  )
}

function buildEggGroups(): EggGroupInfo[] {
  const { label, names } = labelsFrom('egg_group_prose', 'egg_group_id')
  const species = counted('pokemon_egg_groups', 'egg_group_id')
  return sortById(
    loadCsv('egg_groups').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        speciesCount: species.get(id) ?? 0,
      }
    }),
  )
}

function buildMoveTargets(): MoveTargetInfo[] {
  const { label, names } = labelsFrom('move_target_prose', 'move_target_id')
  const descriptions = englishColumn('move_target_prose', 'move_target_id', 'description')
  return sortById(
    loadCsv('move_targets').map((row) => {
      const id = int(row.id)
      const description = descriptions.get(id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        description: description ? cleanText(description) : null,
      }
    }),
  )
}

/// `titleize` renders the `ohko` slug as `Ohko`; move categories are the only place that token surfaces.
function moveCategoryLabel(identifier: string): string {
  return titleize(identifier).replace(/\bOhko\b/, 'OHKO')
}

/// `move_meta_category_prose` carries only a description, so the slug supplies the short label and the
/// localized descriptions ride along in `names` for tooltips.
function buildMoveCategories(): LocalizedNamed[] {
  const descriptions = localizedColumn('move_meta_category_prose', 'move_meta_category_id', 'description')
  return sortById(
    loadCsv('move_meta_categories').map((row) => {
      const id = int(row.id)
      return { id, name: row.identifier, label: moveCategoryLabel(row.identifier), names: descriptions.get(id) }
    }),
  )
}

function buildItemCategories(): ItemCategoryInfo[] {
  const { label, names } = labelsFrom('item_category_prose', 'item_category_id')
  return sortById(
    loadCsv('item_categories').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        pocketId: int(row.pocket_id),
      }
    }),
  )
}

function buildItemFlingEffects(): Named[] {
  return sortById(
    loadCsv('item_fling_effects').map((row) => ({
      id: int(row.id),
      name: row.identifier,
      label: titleize(row.identifier),
    })),
  )
}

function buildEncounterMethods(): EncounterMethodInfo[] {
  const { label, names } = labelsFrom('encounter_method_prose', 'encounter_method_id')
  return sortById(
    loadCsv('encounter_methods').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        order: int(row.order),
      }
    }),
  )
}

function buildEncounterConditionValues(): EncounterConditionValueInfo[] {
  const { label, names } = labelsFrom('encounter_condition_value_prose', 'encounter_condition_value_id')
  return sortById(
    loadCsv('encounter_condition_values').map((row) => {
      const id = int(row.id)
      return {
        id,
        name: row.identifier,
        label: displayCase(label.get(id) ?? titleize(row.identifier)),
        names: names.get(id),
        conditionId: int(row.encounter_condition_id),
        isDefault: bool(row.is_default),
      }
    }),
  )
}

/// Berry flavours are not their own table: `contest_type_names` pairs each contest type with its flavour.
function buildBerryFlavors(): LocalizedNamed[] {
  const english = englishColumn('contest_type_names', 'contest_type_id', 'flavor')
  const localized = localizedColumn('contest_type_names', 'contest_type_id', 'flavor')
  return sortById(
    loadCsv('contest_types').map((row) => {
      const id = int(row.id)
      const flavor = english.get(id)
      return {
        id,
        name: flavor ? flavor.toLowerCase().replace(/\s+/g, '-') : `${row.identifier}-flavor`,
        label: flavor ? displayCase(flavor) : titleize(row.identifier),
        names: localized.get(id),
      }
    }),
  )
}

function buildBerries(): BerryInfo[] {
  const itemLabels = nameMap('item_names', 'item_id')
  const itemSlugs = new Map<number, string>()
  for (const row of loadCsv('items')) itemSlugs.set(int(row.id), row.identifier)
  const flavors = groupBy(loadCsv('berry_flavors'), (row) => int(row.berry_id))
  return sortById(
    loadCsv('berries').map((row) => {
      const id = int(row.id)
      const itemId = int(row.item_id)
      const slug = itemSlugs.get(itemId) ?? `berry-${id}`
      return {
        id,
        itemId,
        name: slug,
        label: itemLabels.get(itemId) ?? titleize(slug),
        firmnessId: int(row.firmness_id),
        naturalGiftPower: int(row.natural_gift_power),
        naturalGiftTypeId: num(row.natural_gift_type_id),
        size: int(row.size),
        maxHarvest: int(row.max_harvest),
        growthTime: int(row.growth_time),
        soilDryness: int(row.soil_dryness),
        smoothness: int(row.smoothness),
        flavors: (flavors.get(id) ?? [])
          .map((entry) => ({ flavorId: int(entry.contest_type_id), potency: int(entry.flavor) }))
          .sort((a, b) => a.flavorId - b.flavorId),
      }
    }),
  )
}

function buildMachines(): MachineInfo[] {
  return loadCsv('machines')
    .map((row) => ({
      itemId: int(row.item_id),
      moveId: int(row.move_id),
      versionGroupId: int(row.version_group_id),
      number: int(row.machine_number),
    }))
    .sort((a, b) => a.versionGroupId - b.versionGroupId || a.number - b.number || a.itemId - b.itemId)
}

function buildCharacteristics(): CharacteristicInfo[] {
  const text = englishColumn('characteristic_text', 'characteristic_id', 'message')
  return sortById(
    loadCsv('characteristics').map((row) => {
      const id = int(row.id)
      return {
        id,
        statId: int(row.stat_id),
        geneModulo: int(row.gene_mod_5),
        description: cleanText(text.get(id) ?? ''),
      }
    }),
  )
}

function buildLanguages(): MetaData['languages'] {
  const label = nameMap('language_names', 'language_id')
  return loadCsv('languages')
    .map((row) => {
      const id = int(row.id)
      return { id, code: row.identifier, label: label.get(id) ?? titleize(row.identifier) }
    })
    .sort((a, b) => a.id - b.id)
}

function buildGenders(): Named[] {
  return sortById(
    loadCsv('genders').map((row) => ({
      id: int(row.id),
      name: row.identifier,
      label: titleize(row.identifier),
    })),
  )
}

/// Types a Pokémon can actually be: excludes the Terastal-only `stellar` type and PokéAPI's
/// internal `unknown`/`shadow` placeholders.
function countBattleTypes(types: TypeInfo[]): number {
  const internal = new Set(['stellar', 'unknown', 'shadow'])
  return types.filter((type) => !internal.has(type.name)).length
}

function buildCounts(types: TypeInfo[]): Record<string, number> {
  return {
    pokemon: loadCsv('pokemon').length,
    species: loadCsv('pokemon_species').length,
    moves: loadCsv('moves').length,
    items: loadCsv('items').length,
    abilities: loadCsv('abilities').length,
    locations: loadCsv('locations').length,
    encounters: loadCsv('encounters').length,
    machines: loadCsv('machines').length,
    berries: loadCsv('berries').length,
    types: countBattleTypes(types),
    generations: loadCsv('generations').length,
    versions: loadCsv('versions').length,
  }
}

export function buildMeta(): void {
  const types = buildTypes()
  const meta: MetaData = {
    generatedAt: GENERATED_AT,
    counts: buildCounts(types),
    types,
    typeChart: buildTypeChart(loadCsv('type_efficacy')),
    typeChartPast: buildTypeChartPast(),
    generations: buildGenerations(),
    versions: buildVersions(),
    versionGroups: buildVersionGroups(),
    regions: buildRegions(),
    pokedexes: buildPokedexes(),
    stats: buildStats(),
    natures: buildNatures(),
    growthRates: buildGrowthRates(),
    eggGroups: buildEggGroups(),
    habitats: localizedList('pokemon_habitats', 'pokemon_habitat_names', 'pokemon_habitat_id'),
    shapes: localizedList('pokemon_shapes', 'pokemon_shape_prose', 'pokemon_shape_id'),
    colors: localizedList('pokemon_colors', 'pokemon_color_names', 'pokemon_color_id'),
    damageClasses: localizedList('move_damage_classes', 'move_damage_class_prose', 'move_damage_class_id'),
    moveTargets: buildMoveTargets(),
    moveMethods: localizedList('pokemon_move_methods', 'pokemon_move_method_prose', 'pokemon_move_method_id'),
    moveAilments: localizedList('move_meta_ailments', 'move_meta_ailment_names', 'move_meta_ailment_id'),
    moveCategories: buildMoveCategories(),
    moveFlags: localizedList('move_flags', 'move_flag_prose', 'move_flag_id'),
    itemPockets: localizedList('item_pockets', 'item_pocket_names', 'item_pocket_id'),
    itemCategories: buildItemCategories(),
    itemAttributes: localizedList('item_flags', 'item_flag_prose', 'item_flag_id'),
    itemFlingEffects: buildItemFlingEffects(),
    encounterMethods: buildEncounterMethods(),
    encounterConditions: localizedList('encounter_conditions', 'encounter_condition_prose', 'encounter_condition_id'),
    encounterConditionValues: buildEncounterConditionValues(),
    evolutionTriggers: localizedList('evolution_triggers', 'evolution_trigger_prose', 'evolution_trigger_id'),
    contestTypes: localizedList('contest_types', 'contest_type_names', 'contest_type_id'),
    berryFirmnesses: localizedList('berry_firmness', 'berry_firmness_names', 'berry_firmness_id'),
    berryFlavors: buildBerryFlavors(),
    berries: buildBerries(),
    machines: buildMachines(),
    characteristics: buildCharacteristics(),
    palParkAreas: localizedList('pal_park_areas', 'pal_park_area_names', 'pal_park_area_id'),
    languages: buildLanguages(),
    genders: buildGenders(),
  }
  emit('meta.json', meta)
}
