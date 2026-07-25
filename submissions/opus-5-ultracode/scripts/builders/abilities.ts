import { loadCsv, int, bool, cleanText, groupBy, localizedNames, ENGLISH, type Row } from '../lib/csv.ts'
import { emit, GENERATED_AT, titleize } from '../lib/emit.ts'
import type { AbilityDetail, AbilityIndex, AbilityIndexEntry } from '../../src/types/data.ts'

interface Prose {
  shortEffect: string | null
  effect: string | null
}

type AbilityPokemon = [number, number, number]

function englishProse(): Map<number, Prose> {
  const map = new Map<number, Prose>()
  for (const row of loadCsv('ability_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    map.set(int(row.ability_id), {
      shortEffect: row.short_effect ? cleanText(row.short_effect) : null,
      effect: row.effect ? cleanText(row.effect) : null,
    })
  }
  return map
}

/// `ability_flavor_text` names its language column `language_id`, unlike the `*_names` tables.
function englishFlavorText(): Map<number, { versionGroupId: number; text: string }[]> {
  const map = new Map<number, { versionGroupId: number; text: string }[]>()
  for (const row of loadCsv('ability_flavor_text')) {
    if (int(row.language_id) !== ENGLISH) continue
    const text = cleanText(row.flavor_text)
    if (!text) continue
    const id = int(row.ability_id)
    let list = map.get(id)
    if (!list) {
      list = []
      map.set(id, list)
    }
    list.push({ versionGroupId: int(row.version_group_id), text })
  }
  for (const list of map.values()) list.sort((a, b) => a.versionGroupId - b.versionGroupId)
  return map
}

function englishChangelog(): Map<number, { versionGroupId: number; effect: string | null }[]> {
  const effects = new Map<number, string>()
  for (const row of loadCsv('ability_changelog_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    effects.set(int(row.ability_changelog_id), cleanText(row.effect))
  }
  const map = new Map<number, { versionGroupId: number; effect: string | null }[]>()
  for (const row of loadCsv('ability_changelog')) {
    const id = int(row.ability_id)
    let list = map.get(id)
    if (!list) {
      list = []
      map.set(id, list)
    }
    list.push({
      versionGroupId: int(row.changed_in_version_group_id),
      effect: effects.get(int(row.id)) ?? null,
    })
  }
  for (const list of map.values()) list.sort((a, b) => a.versionGroupId - b.versionGroupId)
  return map
}

/// Current holders plus historical ones (Gengar's pre-Gen-VII Levitate, Cofagrigus' lost Mummy slot, …),
/// keyed so a Pokémon that once had an ability is listed exactly once.
function pokemonByAbility(): Map<number, AbilityPokemon[]> {
  const current = groupBy(loadCsv('pokemon_abilities'), (row) => int(row.ability_id))
  const past = groupBy(
    loadCsv('pokemon_abilities_past').filter((row) => row.ability_id !== ''),
    (row) => int(row.ability_id),
  )
  const map = new Map<number, AbilityPokemon[]>()
  const abilityIds = new Set<number>([...current.keys(), ...past.keys()] as number[])
  for (const abilityId of abilityIds) {
    const seen = new Map<number, AbilityPokemon>()
    for (const row of current.get(abilityId) ?? []) addHolder(seen, row)
    for (const row of past.get(abilityId) ?? []) addHolder(seen, row)
    map.set(
      abilityId,
      [...seen.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    )
  }
  return map
}

function addHolder(seen: Map<number, AbilityPokemon>, row: Row): void {
  const pokemonId = int(row.pokemon_id)
  if (seen.has(pokemonId)) return
  seen.set(pokemonId, [pokemonId, int(row.slot), bool(row.is_hidden) ? 1 : 0])
}

export function buildAbilities(): void {
  const prose = englishProse()
  const flavor = englishFlavorText()
  const changelog = englishChangelog()
  const holders = pokemonByAbility()
  const names = localizedNames('ability_names', 'ability_id')

  const entries: AbilityIndexEntry[] = []
  const rows = [...loadCsv('abilities')].sort((a, b) => int(a.id) - int(b.id))

  for (const row of rows) {
    const id = int(row.id)
    const localized = names.get(id) ?? {}
    const pokemon = holders.get(id) ?? []
    const entry: AbilityIndexEntry = {
      id,
      name: row.identifier,
      label: localized.en ?? titleize(row.identifier),
      generation: int(row.generation_id),
      isMainSeries: bool(row.is_main_series),
      shortEffect: prose.get(id)?.shortEffect ?? null,
      pokemonCount: pokemon.length,
      names: localized,
    }
    entries.push(entry)

    const detail: AbilityDetail = {
      ...entry,
      effect: prose.get(id)?.effect ?? null,
      flavorText: flavor.get(id) ?? [],
      pokemon,
      changelog: changelog.get(id) ?? [],
    }
    emit(`abilities/${id}.json`, detail)
  }

  const index: AbilityIndex = { generatedAt: GENERATED_AT, entries }
  emit('abilities-index.json', index)
}
