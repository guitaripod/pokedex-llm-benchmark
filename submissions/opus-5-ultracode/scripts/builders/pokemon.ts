import {
  loadCsv,
  num,
  int,
  bool,
  cleanText,
  indexBy,
  groupBy,
  nameMap,
  localizedNames,
  ENGLISH,
  type Row,
} from '../lib/csv.ts'
import { emit, GENERATED_AT, titleize } from '../lib/emit.ts'
import { buildEvolutionChains, evolutionStages } from '../lib/evolution.ts'
import type {
  DexNumberTuple,
  EncounterTuple,
  FlavorTuple,
  HeldItemTuple,
  LearnsetTuple,
  PastAbilitySet,
  PastStatSet,
  PastTypeSet,
  PokemonDetail,
  PokemonForm,
  PokemonIndex,
  PokemonIndexEntry,
  PokemonVariety,
  StatBlock,
} from '../../src/types/data.ts'

const REGION_FORMS = new Set(['alola', 'galar', 'hisui', 'paldea'])

/**
 * Region names appear as one hyphen-delimited token of the form identifier, sometimes with a
 * qualifier around them (`totem-alola`, `galar-zen`, `paldea-combat-breed`). The cap Pikachus
 * (`alola-cap`) are event costumes commemorating a region, not regional variants.
 */
function regionOf(formIdentifier: string | null): string | null {
  if (!formIdentifier) return null
  const tokens = formIdentifier.split('-')
  if (tokens[tokens.length - 1] === 'cap') return null
  return tokens.find((token) => REGION_FORMS.has(token)) ?? null
}

const LEGACY_CRY_MAX_SPECIES = 649

/// Reads a CSV column, tolerating the UTF-8 BOM that a few source tables carry on their first header cell.
function cell(row: Row, key: string): string {
  const direct = row[key]
  if (direct !== undefined) return direct
  return row[`﻿${key}`] ?? ''
}

function emptyStats(): StatBlock {
  return [0, 0, 0, 0, 0, 0]
}

function statBlock(rows: Row[] | undefined, field: 'base_stat' | 'effort'): StatBlock {
  const block = emptyStats()
  for (const row of rows ?? []) {
    const slot = int(row.stat_id) - 1
    if (slot < 0 || slot > 5) continue
    block[slot] = int(row[field])
  }
  return block
}

function sortedTypeIds(rows: Row[] | undefined): number[] {
  return (rows ?? []).slice().sort((a, b) => int(a.slot) - int(b.slot)).map((r) => int(r.type_id))
}

interface FormName {
  formName: string | null
  pokemonName: string | null
}

/// English `pokemon_form_names` rows keyed by form id; `pokemon_name` is the full display name.
function englishFormNames(): Map<number, FormName> {
  const map = new Map<number, FormName>()
  for (const row of loadCsv('pokemon_form_names')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    map.set(int(row.pokemon_form_id), {
      formName: row.form_name || null,
      pokemonName: row.pokemon_name || null,
    })
  }
  return map
}

/// Species genus text keyed by species id, both the English string and the per-language map.
function speciesGenera(): { english: Map<number, string>; localized: Map<number, Record<string, string>> } {
  const languages = new Map<number, string>()
  for (const row of loadCsv('languages')) languages.set(int(row.id), row.identifier)
  const english = new Map<number, string>()
  const localized = new Map<number, Record<string, string>>()
  for (const row of loadCsv('pokemon_species_names')) {
    if (!row.genus) continue
    const speciesId = int(row.pokemon_species_id)
    const languageId = int(row.local_language_id)
    if (languageId === ENGLISH) english.set(speciesId, row.genus)
    const code = languages.get(languageId)
    if (!code) continue
    let entry = localized.get(speciesId)
    if (!entry) {
      entry = {}
      localized.set(speciesId, entry)
    }
    entry[code] = row.genus
  }
  return { english, localized }
}

/// English `form_description` from `pokemon_species_prose`, the only prose column that table carries.
function speciesFormDescriptions(): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv('pokemon_species_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    if (!row.form_description) continue
    map.set(int(row.pokemon_species_id), cleanText(row.form_description))
  }
  return map
}

interface ConditionLookups {
  triggers: Map<number, string>
  items: Map<number, string>
  abilities: Map<number, string>
  moves: Map<number, string>
}

/// Renders a `pokemon_form_conditions` row as prose, since the table stores only trigger foreign keys.
function conditionText(row: Row, lookups: ConditionLookups): string | null {
  const trigger = lookups.triggers.get(int(row.form_trigger_id)) ?? null
  const item = num(row.trigger_item_id)
  const ability = num(row.trigger_ability_id)
  const move = num(row.trigger_move_id)
  const target =
    item !== null
      ? (lookups.items.get(item) ?? null)
      : ability !== null
        ? (lookups.abilities.get(ability) ?? null)
        : move !== null
          ? (lookups.moves.get(move) ?? null)
          : null
  if (trigger && target) return `${trigger}: ${target}`
  return trigger ?? target
}

interface PastGroup<T> {
  untilGeneration: number
  rows: T[]
}

/// Buckets a `*_past` table's rows by the generation they applied up to and including, oldest first.
function byGeneration(rows: Row[] | undefined): PastGroup<Row>[] {
  const map = new Map<number, Row[]>()
  for (const row of rows ?? []) {
    const generation = int(row.generation_id)
    const list = map.get(generation)
    if (list) list.push(row)
    else map.set(generation, [row])
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([untilGeneration, group]) => ({ untilGeneration, rows: group }))
}

interface Core {
  id: number
  speciesId: number
  name: string
  label: string
  isDefault: boolean
  form: string | null
  formLabel: string | null
  isMega: boolean
  isGmax: boolean
  isBattleOnly: boolean
  variantRegion: string | null
  types: number[]
  stats: StatBlock
  defaultFormId: number | null
}

export function buildPokemon(): void {
  const pokemonRows = loadCsv('pokemon')
  const speciesById = indexBy(loadCsv('pokemon_species'), (r) => int(r.id))

  const statsByPokemon = groupBy(loadCsv('pokemon_stats'), (r) => int(r.pokemon_id))
  const pastStatsByPokemon = groupBy(loadCsv('pokemon_stats_past'), (r) => int(r.pokemon_id))
  const typesByPokemon = groupBy(loadCsv('pokemon_types'), (r) => int(r.pokemon_id))
  const pastTypesByPokemon = groupBy(loadCsv('pokemon_types_past'), (r) => int(r.pokemon_id))
  const abilitiesByPokemon = groupBy(loadCsv('pokemon_abilities'), (r) => int(r.pokemon_id))
  const pastAbilitiesByPokemon = groupBy(loadCsv('pokemon_abilities_past'), (r) => int(r.pokemon_id))

  const formRows = loadCsv('pokemon_forms')
  const formsByPokemon = groupBy(formRows, (r) => int(r.pokemon_id))
  const formTypesByForm = groupBy(loadCsv('pokemon_form_types'), (r) => int(r.pokemon_form_id))
  const formConditionsByForm = groupBy(loadCsv('pokemon_form_conditions'), (r) => int(r.pokemon_form_id))
  const pokeathlonByForm = groupBy(loadCsv('pokemon_form_pokeathlon_stats'), (r) => int(r.pokemon_form_id))
  const formNames = englishFormNames()

  const conditionLookups: ConditionLookups = {
    triggers: nameMap('pokemon_form_trigger_prose', 'pokemon_form_trigger_id'),
    items: nameMap('item_names', 'item_id'),
    abilities: nameMap('ability_names', 'ability_id'),
    moves: nameMap('move_names', 'move_id'),
  }

  const movesByPokemon = groupBy(loadCsv('pokemon_moves'), (r) => int(r.pokemon_id))
  const encountersByPokemon = groupBy(loadCsv('encounters'), (r) => int(r.pokemon_id))
  const slotsById = indexBy(loadCsv('encounter_slots'), (r) => int(r.id))
  const conditionValuesByEncounter = groupBy(
    loadCsv('encounter_condition_value_map'),
    (r) => int(r.encounter_id),
  )

  const itemsByPokemon = groupBy(loadCsv('pokemon_items'), (r) => int(r.pokemon_id))
  const gameIndicesByPokemon = groupBy(loadCsv('pokemon_game_indices'), (r) => int(r.pokemon_id))
  const palParkBySpecies = groupBy(loadCsv('pal_park'), (r) => int(r.species_id))
  const eggGroupsBySpecies = groupBy(loadCsv('pokemon_egg_groups'), (r) => int(r.species_id))
  const dexNumbersBySpecies = groupBy(loadCsv('pokemon_dex_numbers'), (r) => int(cell(r, 'species_id')))

  const flavorBySpecies = groupBy(
    loadCsv('pokemon_species_flavor_text').filter((r) => int(r.language_id) === ENGLISH),
    (r) => int(r.species_id),
  )

  const speciesNames = nameMap('pokemon_species_names', 'pokemon_species_id')
  const speciesLocalized = localizedNames('pokemon_species_names', 'pokemon_species_id')
  const genera = speciesGenera()
  const formDescriptions = speciesFormDescriptions()

  const chains = buildEvolutionChains()
  const stages = evolutionStages()

  const varietiesBySpecies = groupBy(pokemonRows, (r) => int(r.species_id))

  const cores = new Map<number, Core>()
  for (const row of pokemonRows) {
    const id = int(row.id)
    const speciesId = int(row.species_id)
    const species = speciesById.get(speciesId)
    const isDefault = bool(row.is_default)
    const forms = formsByPokemon.get(id) ?? []
    const primary = forms.find((f) => bool(f.is_default)) ?? forms[0] ?? null
    const formIdentifier = primary?.form_identifier || null
    const primaryNames = primary ? formNames.get(int(primary.id)) : undefined
    const speciesLabel = species
      ? (speciesNames.get(speciesId) ?? titleize(species.identifier))
      : titleize(row.identifier)

    cores.set(id, {
      id,
      speciesId,
      name: row.identifier,
      label: isDefault ? speciesLabel : (primaryNames?.pokemonName ?? titleize(row.identifier)),
      isDefault,
      form: formIdentifier,
      formLabel: primaryNames?.formName ?? (formIdentifier ? titleize(formIdentifier) : null),
      isMega: primary ? bool(primary.is_mega) : false,
      isGmax: formIdentifier !== null && formIdentifier.includes('gmax'),
      isBattleOnly: primary ? bool(primary.is_battle_only) : false,
      variantRegion: regionOf(formIdentifier),
      types: sortedTypeIds(typesByPokemon.get(id)),
      stats: statBlock(statsByPokemon.get(id), 'base_stat'),
      defaultFormId: primary ? int(primary.id) : null,
    })
  }

  const entries: PokemonIndexEntry[] = []

  for (const row of pokemonRows) {
    const id = int(row.id)
    const core = cores.get(id)!
    const speciesId = core.speciesId
    const species = speciesById.get(speciesId)

    const abilities = (abilitiesByPokemon.get(id) ?? [])
      .slice()
      .sort((a, b) => int(a.slot) - int(b.slot))
      .map((r) => ({ id: int(r.ability_id), slot: int(r.slot), hidden: bool(r.is_hidden) }))

    const eggGroups = (eggGroupsBySpecies.get(speciesId) ?? [])
      .map((r) => int(r.egg_group_id))
      .sort((a, b) => a - b)

    const dexNumbers: DexNumberTuple[] = (dexNumbersBySpecies.get(speciesId) ?? [])
      .map((r): DexNumberTuple => [int(r.pokedex_id), int(r.pokedex_number)])
      .sort((a, b) => a[0] - b[0])

    const stage = stages.get(speciesId)
    const bst = core.stats.reduce((sum, value) => sum + value, 0)
    const generation = species ? int(species.generation_id) : 0
    const legacyCry = speciesId <= LEGACY_CRY_MAX_SPECIES && core.isDefault

    entries.push({
      id,
      speciesId,
      name: core.name,
      label: core.label,
      dex: speciesId,
      types: core.types,
      stats: core.stats,
      bst,
      height: int(row.height),
      weight: int(row.weight),
      baseExp: int(row.base_experience),
      generation,
      isDefault: core.isDefault,
      form: core.form,
      formLabel: core.formLabel,
      isMega: core.isMega,
      isGmax: core.isGmax,
      isBattleOnly: core.isBattleOnly,
      variantRegion: core.variantRegion,
      abilities,
      eggGroups,
      colorId: species ? int(species.color_id) : 0,
      shapeId: species ? num(species.shape_id) : null,
      habitatId: species ? num(species.habitat_id) : null,
      growthRateId: species ? int(species.growth_rate_id) : 0,
      captureRate: species ? int(species.capture_rate) : 0,
      baseHappiness: species ? int(species.base_happiness) : 0,
      hatchCounter: species ? int(species.hatch_counter) : 0,
      genderRate: species ? int(species.gender_rate) : -1,
      isLegendary: species ? bool(species.is_legendary) : false,
      isMythical: species ? bool(species.is_mythical) : false,
      isBaby: species ? bool(species.is_baby) : false,
      hasGenderDifferences: species ? bool(species.has_gender_differences) : false,
      evolutionChainId: species ? num(species.evolution_chain_id) : null,
      evolvesFromSpeciesId: species ? num(species.evolves_from_species_id) : null,
      stage: stage?.stage ?? 1,
      isFullyEvolved: stage?.isFullyEvolved ?? true,
      genus: genera.english.get(speciesId) ?? null,
      names: speciesLocalized.get(speciesId) ?? {},
      dexNumbers,
      hasCry: true,
    })

    const pastTypes: PastTypeSet[] = byGeneration(pastTypesByPokemon.get(id)).map((group) => ({
      untilGeneration: group.untilGeneration,
      types: sortedTypeIds(group.rows),
    }))

    const pastStats: PastStatSet[] = byGeneration(pastStatsByPokemon.get(id)).map((group) => {
      const stats: Partial<Record<number, number>> = {}
      for (const statRow of group.rows) stats[int(statRow.stat_id)] = int(statRow.base_stat)
      return { untilGeneration: group.untilGeneration, stats }
    })

    const pastAbilities: PastAbilitySet[] = byGeneration(pastAbilitiesByPokemon.get(id)).map((group) => ({
      untilGeneration: group.untilGeneration,
      abilities: group.rows
        .slice()
        .sort((a, b) => int(a.slot) - int(b.slot))
        .map((r) => ({ id: num(r.ability_id), slot: int(r.slot), hidden: bool(r.is_hidden) })),
    }))

    const varieties: PokemonVariety[] = (varietiesBySpecies.get(speciesId) ?? [])
      .map((r) => cores.get(int(r.id))!)
      .sort((a, b) => a.id - b.id)
      .map((variety) => ({
        id: variety.id,
        name: variety.name,
        label: variety.label,
        isDefault: variety.isDefault,
        form: variety.form,
        isMega: variety.isMega,
        isGmax: variety.isGmax,
        isBattleOnly: variety.isBattleOnly,
        types: variety.types,
        stats: variety.stats,
      }))

    const forms: PokemonForm[] = (formsByPokemon.get(id) ?? [])
      .slice()
      .sort((a, b) => int(a.form_order) - int(b.form_order) || int(a.id) - int(b.id))
      .map((form) => {
        const formId = int(form.id)
        const names = formNames.get(formId)
        const formTypes = formTypesByForm.get(formId)
        const isDefaultForm = bool(form.is_default)
        return {
          id: formId,
          name: form.identifier,
          label: names?.pokemonName ?? titleize(form.identifier),
          formName: names?.formName ?? (form.form_identifier ? titleize(form.form_identifier) : null),
          isDefault: isDefaultForm,
          isBattleOnly: bool(form.is_battle_only),
          isMega: bool(form.is_mega),
          formOrder: int(form.form_order),
          introducedInVersionGroupId: num(form.introduced_in_version_group_id),
          types: formTypes ? sortedTypeIds(formTypes) : null,
          spriteId: formId !== id && !isDefaultForm ? formId : id,
          conditions: (formConditionsByForm.get(formId) ?? []).map((condition) => ({
            versionGroupId: int(form.introduced_in_version_group_id),
            description: conditionText(condition, conditionLookups),
          })),
        }
      })

    const moves: LearnsetTuple[] = (movesByPokemon.get(id) ?? [])
      .map((r): LearnsetTuple => [
        int(r.move_id),
        int(r.version_group_id),
        int(r.pokemon_move_method_id),
        int(r.level),
        int(r.order),
      ])
      .sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[3] - b[3] || a[0] - b[0])

    const encounters: EncounterTuple[] = (encountersByPokemon.get(id) ?? [])
      .map((r): EncounterTuple => {
        const slot = slotsById.get(int(r.encounter_slot_id))
        const conditionValues = (conditionValuesByEncounter.get(int(r.id)) ?? [])
          .map((c) => int(c.encounter_condition_value_id))
          .sort((a, b) => a - b)
        return [
          int(r.version_id),
          int(r.location_area_id),
          slot ? int(slot.encounter_method_id) : 0,
          int(r.min_level),
          int(r.max_level),
          slot ? int(slot.rarity) : 0,
          conditionValues,
        ]
      })
      .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3] || a[4] - b[4])

    const heldItems: HeldItemTuple[] = (itemsByPokemon.get(id) ?? [])
      .map((r): HeldItemTuple => [int(r.item_id), int(r.version_id), int(r.rarity)])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])

    const gameIndices = (gameIndicesByPokemon.get(id) ?? [])
      .map((r) => ({ versionId: int(r.version_id), gameIndex: int(r.game_index) }))
      .sort((a, b) => a.versionId - b.versionId)

    const palPark = (palParkBySpecies.get(speciesId) ?? [])
      .map((r) => ({ areaId: int(r.area_id), baseScore: int(r.base_score), rate: int(r.rate) }))
      .sort((a, b) => a.areaId - b.areaId)

    const pokeathlon = (core.defaultFormId === null ? [] : (pokeathlonByForm.get(core.defaultFormId) ?? []))
      .map((r) => ({
        statId: int(r.pokeathlon_stat_id),
        base: int(r.base_stat),
        min: int(r.minimum_stat),
        max: int(r.maximum_stat),
      }))
      .sort((a, b) => a.statId - b.statId)

    const flavorText: FlavorTuple[] = (flavorBySpecies.get(speciesId) ?? [])
      .map((r): FlavorTuple => [int(r.version_id), cleanText(r.flavor_text)])
      .sort((a, b) => a[0] - b[0])

    const chainId = species ? num(species.evolution_chain_id) : null

    const detail: PokemonDetail = {
      id,
      speciesId,
      name: core.name,
      label: core.label,
      dex: speciesId,
      order: int(row.order),
      isDefault: core.isDefault,
      form: core.form,
      formLabel: core.formLabel,
      isMega: core.isMega,
      isGmax: core.isGmax,
      isBattleOnly: core.isBattleOnly,
      variantRegion: core.variantRegion,
      height: int(row.height),
      weight: int(row.weight),
      baseExp: int(row.base_experience),
      generation,
      types: core.types,
      pastTypes,
      stats: core.stats,
      effortYield: statBlock(statsByPokemon.get(id), 'effort'),
      pastStats,
      abilities,
      pastAbilities,
      species: {
        id: speciesId,
        name: species ? species.identifier : core.name,
        label: species ? (speciesNames.get(speciesId) ?? titleize(species.identifier)) : core.label,
        genus: genera.english.get(speciesId) ?? null,
        names: speciesLocalized.get(speciesId) ?? {},
        genera: genera.localized.get(speciesId) ?? {},
        generation,
        colorId: species ? int(species.color_id) : 0,
        shapeId: species ? num(species.shape_id) : null,
        habitatId: species ? num(species.habitat_id) : null,
        growthRateId: species ? int(species.growth_rate_id) : 0,
        captureRate: species ? int(species.capture_rate) : 0,
        baseHappiness: species ? int(species.base_happiness) : 0,
        hatchCounter: species ? int(species.hatch_counter) : 0,
        genderRate: species ? int(species.gender_rate) : -1,
        eggGroups,
        isLegendary: species ? bool(species.is_legendary) : false,
        isMythical: species ? bool(species.is_mythical) : false,
        isBaby: species ? bool(species.is_baby) : false,
        hasGenderDifferences: species ? bool(species.has_gender_differences) : false,
        formsSwitchable: species ? bool(species.forms_switchable) : false,
        evolutionChainId: chainId,
        evolvesFromSpeciesId: species ? num(species.evolves_from_species_id) : null,
        description: null,
        formDescription: formDescriptions.get(speciesId) ?? null,
      },
      flavorText,
      dexNumbers,
      varieties,
      forms,
      moves,
      encounters,
      heldItems,
      gameIndices,
      palPark,
      pokeathlon,
      evolutionChain: chainId === null ? null : (chains.get(chainId) ?? null),
      cries: { latest: true, legacy: legacyCry },
    }

    emit(`pokemon/${id}.json`, detail)
  }

  entries.sort((a, b) => a.id - b.id)

  const index: PokemonIndex = { generatedAt: GENERATED_AT, entries }
  emit('pokemon-index.json', index)
}
