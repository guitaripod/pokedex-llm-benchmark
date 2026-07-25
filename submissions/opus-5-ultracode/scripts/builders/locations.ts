import { loadCsv, int, num, cleanText, groupBy, localizedNames, ENGLISH } from '../lib/csv.ts'
import type { Row } from '../lib/csv.ts'
import { emit, GENERATED_AT, titleize } from '../lib/emit.ts'
import type {
  AreaEncounterTuple,
  LocationAreaDetail,
  LocationAreaLookup,
  LocationAreaRef,
  LocationDetail,
  LocationIndex,
  LocationIndexEntry,
} from '../../src/types/data.ts'

interface SlotInfo {
  methodId: number
  rarity: number
}

interface MergedEncounter {
  versionId: number
  methodId: number
  pokemonId: number
  minLevel: number
  maxLevel: number
  rarity: number
  slotIds: Set<number>
}

interface EnglishLabel {
  name: string
  subtitle: string
}

const FLOOR_TOKEN = /^b?\d+f$/i

/// Reads the English rows of `location_names`, keeping the Gen-VII `subtitle` used to disambiguate
/// same-named routes and city districts.
function englishLocationLabels(): Map<number, EnglishLabel> {
  const map = new Map<number, EnglishLabel>()
  for (const row of loadCsv('location_names')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    map.set(int(row.location_id), {
      name: cleanText(row.name ?? ''),
      subtitle: cleanText(row.subtitle ?? ''),
    })
  }
  return map
}

/// Reads the English rows of `location_area_prose`; most areas have no entry at all.
function englishAreaNames(): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv('location_area_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    const name = cleanText(row.name ?? '')
    if (name) map.set(int(row.location_area_id), name)
  }
  return map
}

/// Maps every encounter slot to the method it belongs to and the rarity it contributes.
function slotInfo(): Map<number, SlotInfo> {
  const map = new Map<number, SlotInfo>()
  for (const row of loadCsv('encounter_slots')) {
    map.set(int(row.id), { methodId: int(row.encounter_method_id), rarity: int(row.rarity) })
  }
  return map
}

/// Resolves `version_id -> generation_id` by walking versions through their version group.
function versionGenerations(): Map<number, number> {
  const groupGeneration = new Map<number, number>()
  for (const row of loadCsv('version_groups')) groupGeneration.set(int(row.id), int(row.generation_id))
  const map = new Map<number, number>()
  for (const row of loadCsv('versions')) {
    const generation = groupGeneration.get(int(row.version_group_id))
    if (generation !== undefined) map.set(int(row.id), generation)
  }
  return map
}

/// Removes a leading `<location>-` segment from an area identifier when the source data repeats it.
function stripLocationPrefix(identifier: string, locationIdentifier: string): string {
  if (identifier === locationIdentifier) return ''
  if (identifier.startsWith(`${locationIdentifier}-`)) return identifier.slice(locationIdentifier.length + 1)
  return identifier
}

/// Titleizes an area identifier suffix while keeping floor designators (`b1f`) fully upper-cased.
function humanizeSuffix(suffix: string): string {
  const tokens = suffix.split('-')
  return titleize(suffix)
    .split(' ')
    .map((word, i) => (FLOOR_TOKEN.test(tokens[i] ?? '') ? tokens[i].toUpperCase() : word))
    .join(' ')
}

/// Picks the best display label for an area: the parent location's name when the area covers the
/// whole location, otherwise curated prose and finally the humanized identifier suffix.
///
/// An area with no identifier suffix *is* the location, so the location's own name wins over the
/// prose table — English prose renames several Kanto/Johto routes to "Road N".
function areaLabel(prose: string | undefined, suffix: string, locationLabel: string): string {
  if (!suffix) return locationLabel
  return prose || humanizeSuffix(suffix)
}

/// Collapses the per-slot encounter rows of one area into one tuple per (version, method, Pokémon).
///
/// A single slot can yield different Pokémon under different conditions (time of day, swarms), and
/// the same slot is repeated once per condition, so slot rarity is counted only once per Pokémon
/// while the level range widens across every contributing row.
function mergeAreaEncounters(rows: Row[], slots: Map<number, SlotInfo>): AreaEncounterTuple[] {
  const merged = new Map<string, MergedEncounter>()
  for (const row of rows) {
    const slotId = int(row.encounter_slot_id)
    const slot = slots.get(slotId)
    if (!slot) continue
    const versionId = int(row.version_id)
    const pokemonId = int(row.pokemon_id)
    const minLevel = int(row.min_level)
    const maxLevel = int(row.max_level)
    const key = `${versionId}:${slot.methodId}:${pokemonId}`
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, {
        versionId,
        methodId: slot.methodId,
        pokemonId,
        minLevel,
        maxLevel,
        rarity: slot.rarity,
        slotIds: new Set([slotId]),
      })
      continue
    }
    if (minLevel < existing.minLevel) existing.minLevel = minLevel
    if (maxLevel > existing.maxLevel) existing.maxLevel = maxLevel
    if (!existing.slotIds.has(slotId)) {
      existing.slotIds.add(slotId)
      existing.rarity += slot.rarity
    }
  }
  return [...merged.values()]
    .sort(
      (a, b) => a.versionId - b.versionId || a.methodId - b.methodId || a.pokemonId - b.pokemonId,
    )
    .map((e) => [e.pokemonId, e.minLevel, e.maxLevel, e.rarity, e.methodId, e.versionId] as AreaEncounterTuple)
}

export function buildLocations(): void {
  const labels = englishLocationLabels()
  const areaNames = englishAreaNames()
  const localized = localizedNames('location_names', 'location_id')
  const slots = slotInfo()
  const generationOfVersion = versionGenerations()

  const areasByLocation = groupBy(loadCsv('location_areas'), (row) => int(row.location_id))
  const encountersByArea = groupBy(loadCsv('encounters'), (row) => int(row.location_area_id))
  const ratesByArea = groupBy(loadCsv('location_area_encounter_rates'), (row) => int(row.location_area_id))
  const gameIndicesByLocation = groupBy(loadCsv('location_game_indices'), (row) => int(row.location_id))

  const entries: LocationIndexEntry[] = []
  const areaLookup: Record<number, LocationAreaRef> = {}

  for (const location of loadCsv('locations')) {
    const id = int(location.id)
    const identifier = location.identifier
    const english = labels.get(id)
    const baseLabel = english?.name || titleize(identifier)
    const label = english?.subtitle ? `${baseLabel} (${english.subtitle})` : baseLabel

    const areas: LocationAreaDetail[] = []
    const pokemonIds = new Set<number>()
    const generationIds = new Set<number>()

    const areaRows = (areasByLocation.get(id) ?? []).slice().sort((a, b) => int(a.id) - int(b.id))
    for (const area of areaRows) {
      const areaId = int(area.id)
      const suffix = stripLocationPrefix(area.identifier ?? '', identifier)
      const encounters = mergeAreaEncounters(encountersByArea.get(areaId) ?? [], slots)
      for (const [pokemonId, , , , , versionId] of encounters) {
        pokemonIds.add(pokemonId)
        const generation = generationOfVersion.get(versionId)
        if (generation !== undefined) generationIds.add(generation)
      }
      const rates = (ratesByArea.get(areaId) ?? [])
        .map((row) => ({
          versionId: int(row.version_id),
          methodId: int(row.encounter_method_id),
          rate: int(row.rate),
        }))
        .sort((a, b) => a.versionId - b.versionId || a.methodId - b.methodId)
      const resolvedAreaLabel = areaLabel(areaNames.get(areaId), suffix, label)
      areaLookup[areaId] = [id, identifier, resolvedAreaLabel]
      areas.push({
        id: areaId,
        name: suffix ? `${identifier}-${suffix}` : identifier,
        label: resolvedAreaLabel,
        encounters,
        encounterRates: rates,
      })
    }

    const gameIndices = (gameIndicesByLocation.get(id) ?? [])
      .map((row) => ({ generationId: int(row.generation_id), gameIndex: int(row.game_index) }))
      .sort((a, b) => a.generationId - b.generationId || a.gameIndex - b.gameIndex)

    if (generationIds.size === 0) for (const index of gameIndices) generationIds.add(index.generationId)

    const entry: LocationIndexEntry = {
      id,
      name: identifier,
      label,
      regionId: num(location.region_id),
      areaCount: areas.length,
      pokemonCount: pokemonIds.size,
      generationIds: [...generationIds].sort((a, b) => a - b),
      names: localized.get(id) ?? {},
    }
    entries.push(entry)

    const detail: LocationDetail = { ...entry, gameIndices, areas }
    emit(`locations/${id}.json`, detail)
  }

  entries.sort((a, b) => a.id - b.id)
  const index: LocationIndex = { generatedAt: GENERATED_AT, entries }
  emit('locations-index.json', index)

  const lookup: LocationAreaLookup = { generatedAt: GENERATED_AT, areas: areaLookup }
  emit('location-areas.json', lookup)
}
