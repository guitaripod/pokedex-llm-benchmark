import { loadCsv, int, num, cleanText, groupBy, nameMap, localizedNames, ENGLISH } from '../lib/csv.ts'
import { emit, GENERATED_AT, titleize } from '../lib/emit.ts'
import type { BerryInfo, HeldItemTuple, ItemDetail, ItemIndex, ItemIndexEntry } from '../../src/types/data.ts'

interface Prose {
  shortEffect: string | null
  effect: string | null
}

interface FlavorEntry {
  versionGroupId: number
  text: string
}

interface GameIndexEntry {
  generationId: number
  gameIndex: number
}

interface MachineEntry {
  moveId: number
  versionGroupId: number
  number: number
}

interface EvolvesWithEntry {
  speciesId: number
  kind: 'trigger' | 'held'
}

/// Items carry no `effect_chance` column, so the placeholder collapses to an empty slot rather than a number.
function substituteEffectChance(text: string): string {
  return text.includes('$effect_chance') ? text.replace(/\$effect_chance%?/g, '') : text
}

/// Turns the veekun prose markup — definition lists and bullet lists — into flowing sentences.
function flattenProseMarkup(text: string): string {
  return text.replace(/\n:\s+/g, ': ').replace(/\n\s*\*\s+/g, ' • ')
}

function proseText(value: string | undefined): string | null {
  if (!value) return null
  const cleaned = cleanText(flattenProseMarkup(substituteEffectChance(value)))
  return cleaned.length ? cleaned : null
}

function loadProse(): Map<number, Prose> {
  const map = new Map<number, Prose>()
  for (const row of loadCsv('item_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    map.set(int(row.item_id), {
      shortEffect: proseText(row.short_effect),
      effect: proseText(row.effect),
    })
  }
  return map
}

/// English flavour text keyed by item id, keeping the first entry per version group.
function loadFlavorText(): Map<number, FlavorEntry[]> {
  const seen = new Map<number, Set<number>>()
  const map = new Map<number, FlavorEntry[]>()
  for (const row of loadCsv('item_flavor_text')) {
    if (int(row.language_id) !== ENGLISH) continue
    const itemId = int(row.item_id)
    const versionGroupId = int(row.version_group_id)
    let used = seen.get(itemId)
    if (!used) {
      used = new Set()
      seen.set(itemId, used)
    }
    if (used.has(versionGroupId)) continue
    used.add(versionGroupId)
    const text = cleanText(row.flavor_text ?? '')
    if (!text.length) continue
    const list = map.get(itemId)
    const entry: FlavorEntry = { versionGroupId, text }
    if (list) list.push(entry)
    else map.set(itemId, [entry])
  }
  for (const list of map.values()) list.sort((a, b) => a.versionGroupId - b.versionGroupId)
  return map
}

function loadGameIndices(): Map<number, GameIndexEntry[]> {
  const map = new Map<number, GameIndexEntry[]>()
  for (const row of loadCsv('item_game_indices')) {
    const itemId = int(row.item_id)
    const entry: GameIndexEntry = { generationId: int(row.generation_id), gameIndex: int(row.game_index) }
    const list = map.get(itemId)
    if (list) list.push(entry)
    else map.set(itemId, [entry])
  }
  for (const list of map.values()) list.sort((a, b) => a.generationId - b.generationId || a.gameIndex - b.gameIndex)
  return map
}

function loadAttributes(): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (const row of loadCsv('item_flag_map')) {
    const itemId = int(row.item_id)
    const flagId = int(row.item_flag_id)
    const list = map.get(itemId)
    if (list) list.push(flagId)
    else map.set(itemId, [flagId])
  }
  for (const list of map.values()) list.sort((a, b) => a - b)
  return map
}

function loadMachines(): Map<number, MachineEntry[]> {
  const map = new Map<number, MachineEntry[]>()
  for (const row of loadCsv('machines')) {
    const itemId = int(row.item_id)
    const entry: MachineEntry = {
      moveId: int(row.move_id),
      versionGroupId: int(row.version_group_id),
      number: int(row.machine_number),
    }
    const list = map.get(itemId)
    if (list) list.push(entry)
    else map.set(itemId, [entry])
  }
  for (const list of map.values())
    list.sort((a, b) => a.versionGroupId - b.versionGroupId || a.number - b.number || a.moveId - b.moveId)
  return map
}

function loadHeldBy(): Map<number, HeldItemTuple[]> {
  const map = new Map<number, HeldItemTuple[]>()
  for (const row of loadCsv('pokemon_items')) {
    const itemId = int(row.item_id)
    const tuple: HeldItemTuple = [int(row.pokemon_id), int(row.version_id), int(row.rarity)]
    const list = map.get(itemId)
    if (list) list.push(tuple)
    else map.set(itemId, [tuple])
  }
  for (const list of map.values()) list.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return map
}

/// Species belonging to an evolution chain that this item unlocks the baby stage of.
function loadBabyTriggers(): Map<number, number[]> {
  const speciesByChain = groupBy(
    loadCsv('pokemon_species').filter((row) => num(row.evolution_chain_id) !== null),
    (row) => int(row.evolution_chain_id),
  )
  const map = new Map<number, number[]>()
  for (const row of loadCsv('evolution_chains')) {
    const itemId = num(row.baby_trigger_item_id)
    if (itemId === null) continue
    const species = speciesByChain.get(int(row.id)) ?? []
    const list = map.get(itemId) ?? []
    for (const entry of species) list.push(int(entry.id))
    map.set(itemId, list)
  }
  for (const list of map.values()) list.sort((a, b) => a - b)
  return map
}

function loadEvolvesWith(): Map<number, EvolvesWithEntry[]> {
  const map = new Map<number, EvolvesWithEntry[]>()
  const seen = new Set<string>()
  const add = (itemId: number, speciesId: number, kind: 'trigger' | 'held') => {
    const key = `${itemId}:${speciesId}:${kind}`
    if (seen.has(key)) return
    seen.add(key)
    const list = map.get(itemId)
    const entry: EvolvesWithEntry = { speciesId, kind }
    if (list) list.push(entry)
    else map.set(itemId, [entry])
  }
  for (const row of loadCsv('pokemon_evolution')) {
    const speciesId = int(row.evolved_species_id)
    const trigger = num(row.trigger_item_id)
    const held = num(row.held_item_id)
    if (trigger !== null) add(trigger, speciesId, 'trigger')
    if (held !== null) add(held, speciesId, 'held')
  }
  for (const list of map.values())
    list.sort((a, b) => a.speciesId - b.speciesId || a.kind.localeCompare(b.kind))
  return map
}

/// Berry rows keyed by the item they are sold as, with contest-type flavour potencies attached.
function loadBerries(itemLabel: (id: number) => string, itemSlug: Map<number, string>): Map<number, BerryInfo> {
  const flavors = groupBy(loadCsv('berry_flavors'), (row) => int(row.berry_id))
  const map = new Map<number, BerryInfo>()
  for (const row of loadCsv('berries')) {
    const berryId = int(row.id)
    const itemId = int(row.item_id)
    const potencies = (flavors.get(berryId) ?? [])
      .map((flavor) => ({ flavorId: int(flavor.contest_type_id), potency: int(flavor.flavor) }))
      .sort((a, b) => a.flavorId - b.flavorId)
    map.set(itemId, {
      id: berryId,
      itemId,
      name: itemSlug.get(itemId) ?? `berry-${berryId}`,
      label: itemLabel(itemId),
      firmnessId: int(row.firmness_id),
      naturalGiftPower: int(row.natural_gift_power),
      naturalGiftTypeId: num(row.natural_gift_type_id),
      size: int(row.size),
      maxHarvest: int(row.max_harvest),
      growthTime: int(row.growth_time),
      soilDryness: int(row.soil_dryness),
      smoothness: int(row.smoothness),
      flavors: potencies,
    })
  }
  return map
}

const MACHINE_IDENTIFIER = /^(tm|hm|tr)\d+$/

/**
 * TM/HM/TR discs have no per-number art in the sprite repository — they are stored once per move
 * type as `tm-<type>.png` / `hm-<type>.png`. TRs have no art at all and reuse the TM disc.
 */
function machineSprites(): Map<number, string> {
  const typeOfMove = new Map<number, number>()
  for (const row of loadCsv('moves')) typeOfMove.set(int(row.id), int(row.type_id))

  const typeSlug = new Map<number, string>()
  for (const row of loadCsv('types')) typeSlug.set(int(row.id), row.identifier)

  const tallies = new Map<number, Map<number, number>>()
  for (const row of loadCsv('machines')) {
    const itemId = int(row.item_id)
    const typeId = typeOfMove.get(int(row.move_id))
    if (typeId === undefined) continue
    let counts = tallies.get(itemId)
    if (!counts) {
      counts = new Map<number, number>()
      tallies.set(itemId, counts)
    }
    counts.set(typeId, (counts.get(typeId) ?? 0) + 1)
  }

  const sprites = new Map<number, string>()
  for (const [itemId, counts] of tallies) {
    let bestType = 0
    let bestCount = -1
    for (const [typeId, count] of counts) {
      if (count > bestCount || (count === bestCount && typeId < bestType)) {
        bestType = typeId
        bestCount = count
      }
    }
    const slug = typeSlug.get(bestType)
    if (slug) sprites.set(itemId, slug)
  }
  return sprites
}

function machineSpriteFor(identifier: string, typeSlug: string | undefined): string {
  const match = MACHINE_IDENTIFIER.exec(identifier)
  if (!match || !typeSlug) return identifier
  return `${match[1] === 'hm' ? 'hm' : 'tm'}-${typeSlug}`
}

export function buildItems(): void {
  const items = loadCsv('items')
  const machineTypeSlugs = machineSprites()
  const englishNames = nameMap('item_names', 'item_id')
  const allNames = localizedNames('item_names', 'item_id')
  const pocketByCategory = new Map<number, number>()
  for (const row of loadCsv('item_categories')) pocketByCategory.set(int(row.id), int(row.pocket_id))

  const slugs = new Map<number, string>()
  for (const row of items) slugs.set(int(row.id), row.identifier)
  const labelFor = (id: number) => englishNames.get(id) ?? titleize(slugs.get(id) ?? String(id))

  const prose = loadProse()
  const flavorText = loadFlavorText()
  const gameIndices = loadGameIndices()
  const attributes = loadAttributes()
  const machines = loadMachines()
  const heldBy = loadHeldBy()
  const babyTriggers = loadBabyTriggers()
  const evolvesWith = loadEvolvesWith()
  const berries = loadBerries(labelFor, slugs)

  const entries: ItemIndexEntry[] = []
  const details: ItemDetail[] = []

  for (const row of items) {
    const id = int(row.id)
    const categoryId = int(row.category_id)
    const text = prose.get(id)
    const berry = berries.get(id) ?? null
    const entry: ItemIndexEntry = {
      id,
      name: row.identifier,
      label: labelFor(id),
      categoryId,
      pocketId: pocketByCategory.get(categoryId) ?? 0,
      cost: int(row.cost),
      flingPower: num(row.fling_power),
      flingEffectId: num(row.fling_effect_id),
      attributes: attributes.get(id) ?? [],
      shortEffect: text?.shortEffect ?? null,
      sprite: machineSpriteFor(row.identifier, machineTypeSlugs.get(id)),
      isBerry: berry !== null,
      names: allNames.get(id) ?? {},
    }
    entries.push(entry)
    details.push({
      ...entry,
      effect: text?.effect ?? null,
      flavorText: flavorText.get(id) ?? [],
      gameIndices: gameIndices.get(id) ?? [],
      heldBy: heldBy.get(id) ?? [],
      machine: machines.get(id) ?? [],
      berry,
      babyTriggerFor: babyTriggers.get(id) ?? [],
      evolvesWith: evolvesWith.get(id) ?? [],
    })
  }

  entries.sort((a, b) => a.id - b.id)
  details.sort((a, b) => a.id - b.id)

  const index: ItemIndex = { generatedAt: GENERATED_AT, entries }
  emit('items-index.json', index)
  for (const detail of details) emit(`items/${detail.id}.json`, detail)
}
