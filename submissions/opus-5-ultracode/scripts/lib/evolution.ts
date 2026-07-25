import { loadCsv, num, int, bool, nameMap, groupBy, indexBy, type Row } from './csv.ts'
import { titleize } from './emit.ts'
import type { EvolutionChain, EvolutionDetail, EvolutionNode } from '../../src/types/data.ts'

const ORDINAL_STATS = ['Attack < Defense', 'Attack = Defense', 'Attack > Defense']

function describe(row: Row, lookups: Lookups): string {
  const parts: string[] = []
  const trigger = lookups.triggers.get(int(row.evolution_trigger_id)) ?? 'level-up'
  const level = num(row.minimum_level)

  switch (trigger) {
    case 'level-up':
      parts.push(level === null ? 'Level up' : `Level ${level}`)
      break
    case 'trade':
      parts.push('Trade')
      break
    case 'use-item':
      parts.push(`Use ${lookups.items.get(int(row.trigger_item_id)) ?? 'an item'}`)
      break
    case 'shed':
      parts.push('Level 20 with an empty party slot and a Poké Ball in the bag')
      break
    case 'spin':
      parts.push('Spin while holding a Sweet')
      break
    case 'tower-of-darkness':
      parts.push('Complete the Tower of Darkness trial')
      break
    case 'tower-of-waters':
      parts.push('Complete the Tower of Waters trial')
      break
    case 'three-critical-hits':
      parts.push('Land three critical hits in one battle')
      break
    case 'take-damage':
      parts.push('Take damage after walking under the rock arch in Dusty Bowl')
      break
    case 'agile-style-move':
      parts.push(
        `Use ${lookups.moves.get(int(row.used_move_id)) ?? 'a move'} in Agile Style ${num(row.minimum_move_count) ?? 0} times`,
      )
      break
    case 'strong-style-move':
      parts.push(
        `Use ${lookups.moves.get(int(row.used_move_id)) ?? 'a move'} in Strong Style ${num(row.minimum_move_count) ?? 0} times`,
      )
      break
    case 'recoil-damage':
      parts.push(`Take ${num(row.minimum_damage_taken) ?? 0} recoil damage without fainting`)
      break
    case 'use-move': {
      const count = num(row.minimum_move_count)
      const move = lookups.moves.get(int(row.used_move_id)) ?? 'a move'
      parts.push(count === null ? `Use ${move}` : `Use ${move} ${count} times`)
      break
    }
    case 'three-defeated-bisharp':
      parts.push("Defeat three Bisharp that lead a pack of Pawniard while holding a Leader's Crest")
      break
    case 'gimmighoul-coins':
      parts.push('Level up holding 999 Gimmighoul Coins')
      break
    default:
      parts.push(titleize(trigger))
  }

  if (trigger !== 'level-up' && level !== null) parts.push(`at level ${level}`)
  if (trigger === 'use-item' && row.trigger_item_id === '' && level !== null) parts.push(`at level ${level}`)

  const heldItem = num(row.held_item_id)
  if (heldItem !== null) parts.push(`holding ${lookups.items.get(heldItem) ?? 'an item'}`)

  const happiness = num(row.minimum_happiness)
  if (happiness !== null) parts.push(`with ${happiness}+ friendship`)

  const beauty = num(row.minimum_beauty)
  if (beauty !== null) parts.push(`with ${beauty}+ beauty`)

  const affection = num(row.minimum_affection)
  if (affection !== null) parts.push(`with ${affection}+ affection hearts`)

  const knownMove = num(row.known_move_id)
  if (knownMove !== null) parts.push(`knowing ${lookups.moves.get(knownMove) ?? 'a move'}`)

  const knownMoveType = num(row.known_move_type_id)
  if (knownMoveType !== null) parts.push(`knowing a ${lookups.types.get(knownMoveType) ?? ''}-type move`)

  if (row.time_of_day) parts.push(`during the ${row.time_of_day}`)

  const location = num(row.location_id)
  if (location !== null) parts.push(`at ${lookups.locations.get(location) ?? 'a special location'}`)

  if (bool(row.near_special_rock)) parts.push('near a special rock')
  if (bool(row.needs_overworld_rain)) parts.push('while it is raining in the overworld')
  if (bool(row.turn_upside_down)) parts.push('with the console turned upside down')
  if (bool(row.needs_multiplayer)) parts.push('in a multiplayer session')

  const gender = num(row.gender_id)
  if (gender !== null) parts.push(`when ${lookups.genders.get(gender) ?? 'a given gender'}`)

  const relative = num(row.relative_physical_stats)
  if (relative !== null) parts.push(`with ${ORDINAL_STATS[relative + 1] ?? ''}`)

  const partySpecies = num(row.party_species_id)
  if (partySpecies !== null) parts.push(`with ${lookups.species.get(partySpecies) ?? 'a species'} in the party`)

  const partyType = num(row.party_type_id)
  if (partyType !== null) parts.push(`with a ${lookups.types.get(partyType) ?? ''}-type Pokémon in the party`)

  const tradeSpecies = num(row.trade_species_id)
  if (tradeSpecies !== null) parts.push(`for ${lookups.species.get(tradeSpecies) ?? 'a species'}`)

  const steps = num(row.minimum_steps)
  if (steps !== null) parts.push(`after walking ${steps} steps together`)

  const region = num(row.region_id)
  if (region !== null) parts.push(`in ${lookups.regions.get(region) ?? 'a region'}`)

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

interface Lookups {
  triggers: Map<number, string>
  items: Map<number, string>
  moves: Map<number, string>
  types: Map<number, string>
  locations: Map<number, string>
  species: Map<number, string>
  regions: Map<number, string>
  genders: Map<number, string>
}

function buildLookups(): Lookups {
  const triggers = new Map<number, string>()
  for (const row of loadCsv('evolution_triggers')) triggers.set(int(row.id), row.identifier)

  const genders = new Map<number, string>()
  for (const row of loadCsv('genders')) genders.set(int(row.id), titleize(row.identifier))

  const regions = new Map<number, string>()
  for (const row of loadCsv('regions')) regions.set(int(row.id), titleize(row.identifier))

  return {
    triggers,
    genders,
    regions,
    items: nameMap('item_names', 'item_id'),
    moves: nameMap('move_names', 'move_id'),
    types: nameMap('type_names', 'type_id'),
    locations: nameMap('location_names', 'location_id'),
    species: nameMap('pokemon_species_names', 'pokemon_species_id'),
  }
}

function toDetail(row: Row, text: string): EvolutionDetail {
  return {
    triggerId: int(row.evolution_trigger_id),
    triggerItemId: num(row.trigger_item_id),
    minLevel: num(row.minimum_level),
    genderId: num(row.gender_id),
    locationId: num(row.location_id),
    heldItemId: num(row.held_item_id),
    timeOfDay: row.time_of_day || null,
    knownMoveId: num(row.known_move_id),
    knownMoveTypeId: num(row.known_move_type_id),
    minHappiness: num(row.minimum_happiness),
    minBeauty: num(row.minimum_beauty),
    minAffection: num(row.minimum_affection),
    relativePhysicalStats: num(row.relative_physical_stats),
    partySpeciesId: num(row.party_species_id),
    partyTypeId: num(row.party_type_id),
    tradeSpeciesId: num(row.trade_species_id),
    needsOverworldRain: bool(row.needs_overworld_rain),
    turnUpsideDown: bool(row.turn_upside_down),
    needsMultiplayer: bool(row.needs_multiplayer),
    nearSpecialRock: bool(row.near_special_rock),
    regionId: num(row.region_id),
    usedMoveId: num(row.used_move_id),
    minMoveCount: num(row.minimum_move_count),
    minSteps: num(row.minimum_steps),
    minDamageTaken: num(row.minimum_damage_taken),
    versionGroupId: num(row.version_group_id),
    text,
  }
}

/**
 * Walks `evolves_from_species_id` to the topmost ancestor. The ancestor can sit in a different
 * evolution chain — Meltan is filed under chain 428 while Melmetal, which evolves from it, is
 * filed under 429 — so a chain's root cannot be found by looking only within the chain.
 */
function ancestorOf(speciesId: number, speciesById: Map<string | number, Row>): number {
  let current = speciesId
  const seen = new Set<number>([current])
  for (;;) {
    const parent = num(speciesById.get(current)?.evolves_from_species_id)
    if (parent === null || seen.has(parent)) return current
    seen.add(parent)
    current = parent
  }
}

let cached: Map<number, EvolutionChain> | null = null

/// Assembles every evolution chain as a tree, resolving each transition's conditions into prose.
export function buildEvolutionChains(): Map<number, EvolutionChain> {
  if (cached) return cached
  const lookups = buildLookups()

  const speciesRows = loadCsv('pokemon_species')
  const speciesById = indexBy(speciesRows, (r) => int(r.id))
  const speciesNames = nameMap('pokemon_species_names', 'pokemon_species_id')

  const defaultPokemon = new Map<number, number>()
  const pokemonTypes = groupBy(loadCsv('pokemon_types'), (r) => int(r.pokemon_id))
  for (const row of loadCsv('pokemon')) {
    if (bool(row.is_default)) defaultPokemon.set(int(row.species_id), int(row.id))
  }

  const evolutionRows = groupBy(loadCsv('pokemon_evolution'), (r) => int(r.evolved_species_id))
  const childrenOf = groupBy(
    speciesRows.filter((r) => r.evolves_from_species_id !== ''),
    (r) => int(r.evolves_from_species_id),
  )

  const chains = new Map<number, EvolutionChain>()
  const collected = new Map<number, number[]>()

  function node(speciesId: number, chainId: number): EvolutionNode {
    const species = speciesById.get(speciesId)!
    const pokemonId = defaultPokemon.get(speciesId) ?? speciesId
    const types = (pokemonTypes.get(pokemonId) ?? [])
      .sort((a, b) => int(a.slot) - int(b.slot))
      .map((r) => int(r.type_id))

    const list = collected.get(chainId)
    if (list) list.push(speciesId)
    else collected.set(chainId, [speciesId])

    return {
      speciesId,
      name: species.identifier,
      label: speciesNames.get(speciesId) ?? titleize(species.identifier),
      pokemonId,
      types,
      isBaby: bool(species.is_baby),
      details: (evolutionRows.get(speciesId) ?? []).map((r) => toDetail(r, describe(r, lookups))),
      children: (childrenOf.get(speciesId) ?? [])
        .sort((a, b) => int(a.id) - int(b.id))
        .map((child) => node(int(child.id), chainId)),
    }
  }

  const membersByChain = groupBy(speciesRows, (r) => int(r.evolution_chain_id))

  for (const row of loadCsv('evolution_chains')) {
    const chainId = int(row.id)
    const members = membersByChain.get(chainId) ?? []
    if (members.length === 0) continue

    const rootIds = new Set<number>()
    for (const member of members) rootIds.add(ancestorOf(int(member.id), speciesById))

    const roots = [...rootIds].sort((a, b) => a - b).map((id) => node(id, chainId))
    chains.set(chainId, {
      id: chainId,
      babyTriggerItemId: num(row.baby_trigger_item_id),
      roots,
      speciesIds: collected.get(chainId) ?? [...rootIds],
    })
  }

  cached = chains
  return chains
}

/// Depth of a species within its chain (1-indexed) and whether anything evolves from it.
export function evolutionStages(): Map<number, { stage: number; isFullyEvolved: boolean }> {
  const result = new Map<number, { stage: number; isFullyEvolved: boolean }>()
  for (const chain of buildEvolutionChains().values()) {
    const walk = (n: EvolutionNode, depth: number) => {
      result.set(n.speciesId, { stage: depth, isFullyEvolved: n.children.length === 0 })
      for (const child of n.children) walk(child, depth + 1)
    }
    for (const root of chain.roots) walk(root, 1)
  }
  return result
}
