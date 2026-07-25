import { loadCsv, num, int, bool, cleanText, ENGLISH, type Row } from '../lib/csv.ts'
import { emit, titleize } from '../lib/emit.ts'

export interface PokedexEntry {
  entryNumber: number
  speciesId: number
  name: string
  label: string
  pokemonId: number
  types: number[]
}

export interface PokedexFile {
  id: number
  name: string
  label: string
  regionId: number | null
  isMainSeries: boolean
  description: string | null
  versionGroupIds: number[]
  entries: PokedexEntry[]
}

interface Prose {
  name: string
  description: string | null
}

const BOM = '﻿'

/// Reads a CSV column, tolerating the UTF-8 BOM glued onto the first header cell of some tables.
function cell(row: Row, key: string): string {
  return row[key] ?? row[BOM + key] ?? ''
}

function englishProse(): Map<number, Prose> {
  const map = new Map<number, Prose>()
  for (const row of loadCsv('pokedex_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    const description = cleanText(row.description ?? '')
    map.set(int(row.pokedex_id), { name: row.name, description: description || null })
  }
  return map
}

function versionGroupsByPokedex(): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (const row of loadCsv('pokedex_version_groups')) {
    const id = int(row.pokedex_id)
    const list = map.get(id)
    if (list) list.push(int(row.version_group_id))
    else map.set(id, [int(row.version_group_id)])
  }
  for (const list of map.values()) list.sort((a, b) => a - b)
  return map
}

/// Maps every species to its `is_default` Pokémon, the variety used for artwork and typing.
function defaultPokemonBySpecies(): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of loadCsv('pokemon')) {
    if (!bool(row.is_default)) continue
    map.set(int(row.species_id), int(row.id))
  }
  return map
}

function typesByPokemon(): Map<number, number[]> {
  const slots = new Map<number, { typeId: number; slot: number }[]>()
  for (const row of loadCsv('pokemon_types')) {
    const id = int(row.pokemon_id)
    const entry = { typeId: int(row.type_id), slot: int(row.slot) }
    const list = slots.get(id)
    if (list) list.push(entry)
    else slots.set(id, [entry])
  }
  const map = new Map<number, number[]>()
  for (const [id, list] of slots) {
    list.sort((a, b) => a.slot - b.slot)
    map.set(
      id,
      list.map((t) => t.typeId),
    )
  }
  return map
}

function speciesSlugs(): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv('pokemon_species')) map.set(int(row.id), row.identifier)
  return map
}

function speciesLabels(): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv('pokemon_species_names')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    map.set(int(row.pokemon_species_id), row.name)
  }
  return map
}

function entriesByPokedex(): Map<number, PokedexEntry[]> {
  const defaults = defaultPokemonBySpecies()
  const types = typesByPokemon()
  const slugs = speciesSlugs()
  const labels = speciesLabels()
  const map = new Map<number, PokedexEntry[]>()
  for (const row of loadCsv('pokemon_dex_numbers')) {
    const speciesId = int(cell(row, 'species_id'))
    const pokedexId = int(cell(row, 'pokedex_id'))
    const slug = slugs.get(speciesId) ?? `species-${speciesId}`
    const pokemonId = defaults.get(speciesId) ?? speciesId
    const entry: PokedexEntry = {
      entryNumber: int(cell(row, 'pokedex_number')),
      speciesId,
      name: slug,
      label: labels.get(speciesId) ?? titleize(slug),
      pokemonId,
      types: types.get(pokemonId) ?? [],
    }
    const list = map.get(pokedexId)
    if (list) list.push(entry)
    else map.set(pokedexId, [entry])
  }
  for (const list of map.values()) list.sort((a, b) => a.entryNumber - b.entryNumber)
  return map
}

export function buildPokedexes(): void {
  const prose = englishProse()
  const versionGroups = versionGroupsByPokedex()
  const entries = entriesByPokedex()
  const dexes = loadCsv('pokedexes')
    .map((row) => ({ id: int(row.id), row }))
    .sort((a, b) => a.id - b.id)

  for (const { id, row } of dexes) {
    const text = prose.get(id)
    const file: PokedexFile = {
      id,
      name: row.identifier,
      label: text?.name ?? titleize(row.identifier),
      regionId: num(row.region_id),
      isMainSeries: bool(row.is_main_series),
      description: text?.description ?? null,
      versionGroupIds: versionGroups.get(id) ?? [],
      entries: entries.get(id) ?? [],
    }
    emit(`pokedex/${id}.json`, file)
  }
}
