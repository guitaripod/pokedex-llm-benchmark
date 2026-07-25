import { get, getAll, mapPool, en, enText, idOf, writeJson } from './lib.mjs'
import path from 'node:path'

const OUT = path.resolve('public/data')
const P = 12

const title = (s) =>
  s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

console.log('› resources')
const [speciesList, pokemonList, moveList, abilityList, itemList, typeList, berryList] =
  await Promise.all([
    getAll('pokemon-species'),
    getAll('pokemon'),
    getAll('move'),
    getAll('ability'),
    getAll('item'),
    getAll('type'),
    getAll('berry'),
  ])

console.log('› static tables')
const [generations, versionGroups, versions, pokedexes, eggGroups, natures, growthRates, regions, itemCategories, moveDamageClasses, moveAilments, stats] =
  await Promise.all([
    getAll('generation').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('version-group').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('version').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('pokedex').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('egg-group').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('nature').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('growth-rate').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('region').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('item-category').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('move-damage-class').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('move-ailment').then((l) => mapPool(l, P, (r) => get(r.url))),
    getAll('stat').then((l) => mapPool(l, P, (r) => get(r.url))),
  ])

console.log('› types')
const types = await mapPool(typeList, P, (r) => get(r.url))
const typeData = types
  .filter((t) => t.pokemon.length || ['stellar', 'unknown', 'shadow'].includes(t.name) === false)
  .map((t) => ({
    id: t.id,
    name: t.name,
    label: en(t.names) ?? title(t.name),
    generation: idOf(t.generation.url),
    damage: {
      double_from: t.damage_relations.double_damage_from.map((x) => x.name),
      half_from: t.damage_relations.half_damage_from.map((x) => x.name),
      no_from: t.damage_relations.no_damage_from.map((x) => x.name),
      double_to: t.damage_relations.double_damage_to.map((x) => x.name),
      half_to: t.damage_relations.half_damage_to.map((x) => x.name),
      no_to: t.damage_relations.no_damage_to.map((x) => x.name),
    },
    moveCount: t.moves.length,
    pokemonCount: t.pokemon.length,
  }))
writeJson(path.join(OUT, 'types.json'), typeData)

console.log('› abilities')
const abilities = await mapPool(abilityList, P, (r) => get(r.url))
const abilityIndex = []
for (const a of abilities) {
  if (!a) continue
  const detail = {
    id: a.id,
    name: a.name,
    label: en(a.names) ?? title(a.name),
    generation: idOf(a.generation.url),
    isMainSeries: a.is_main_series,
    effect: enText(a.effect_entries, 'effect'),
    shortEffect: enText(a.effect_entries, 'short_effect'),
    flavor: enText(a.flavor_text_entries, 'flavor_text'),
    changes: a.effect_changes.map((c) => ({
      versionGroup: c.version_group.name,
      effect: enText(c.effect_entries, 'effect'),
    })).filter((c) => c.effect),
    pokemon: a.pokemon.map((p) => ({ name: p.pokemon.name, id: idOf(p.pokemon.url), hidden: p.is_hidden })),
  }
  writeJson(path.join(OUT, 'ability', `${a.id}.json`), detail)
  abilityIndex.push({
    id: a.id, name: a.name, label: detail.label, generation: detail.generation,
    shortEffect: detail.shortEffect, count: detail.pokemon.length,
  })
}
writeJson(path.join(OUT, 'abilities.json'), abilityIndex)

console.log('› moves')
const moves = await mapPool(moveList, P, (r) => get(r.url))
const moveIndex = []
const moveById = new Map()
for (const m of moves) {
  if (!m) continue
  const detail = {
    id: m.id,
    name: m.name,
    label: en(m.names) ?? title(m.name),
    type: m.type.name,
    damageClass: m.damage_class?.name ?? 'status',
    power: m.power,
    pp: m.pp,
    accuracy: m.accuracy,
    priority: m.priority,
    generation: idOf(m.generation.url),
    effect: enText(m.effect_entries, 'effect')?.replace(/\$effect_chance/g, String(m.effect_chance ?? 0)),
    shortEffect: enText(m.effect_entries, 'short_effect')?.replace(/\$effect_chance/g, String(m.effect_chance ?? 0)),
    effectChance: m.effect_chance,
    flavor: enText(m.flavor_text_entries, 'flavor_text'),
    target: m.target?.name ?? null,
    ailment: m.meta?.ailment?.name ?? null,
    ailmentChance: m.meta?.ailment_chance ?? 0,
    critRate: m.meta?.crit_rate ?? 0,
    drain: m.meta?.drain ?? 0,
    healing: m.meta?.healing ?? 0,
    flinchChance: m.meta?.flinch_chance ?? 0,
    statChance: m.meta?.stat_chance ?? 0,
    minHits: m.meta?.min_hits ?? null,
    maxHits: m.meta?.max_hits ?? null,
    minTurns: m.meta?.min_turns ?? null,
    maxTurns: m.meta?.max_turns ?? null,
    category: m.meta?.category?.name ?? null,
    statChanges: m.stat_changes.map((s) => ({ stat: s.stat.name, change: s.change })),
    machines: m.machines.map((x) => ({ versionGroup: x.version_group.name, url: x.machine.url })),
    contestType: m.contest_type?.name ?? null,
    learnedBy: m.learned_by_pokemon.map((p) => ({ name: p.name, id: idOf(p.url) })),
  }
  writeJson(path.join(OUT, 'move', `${m.id}.json`), detail)
  const idx = {
    id: m.id, name: m.name, label: detail.label, type: m.type.name, damageClass: detail.damageClass,
    power: m.power, pp: m.pp, accuracy: m.accuracy, priority: m.priority,
    generation: detail.generation, shortEffect: detail.shortEffect, learners: detail.learnedBy.length,
  }
  moveIndex.push(idx)
  moveById.set(m.id, idx)
}
writeJson(path.join(OUT, 'moves.json'), moveIndex)

console.log('› items')
const items = await mapPool(itemList, P, (r) => get(r.url))
const itemIndex = []
for (const it of items) {
  if (!it) continue
  const detail = {
    id: it.id,
    name: it.name,
    label: en(it.names) ?? title(it.name),
    cost: it.cost,
    category: it.category.name,
    attributes: it.attributes.map((a) => a.name),
    sprite: it.sprites?.default ?? null,
    effect: enText(it.effect_entries, 'effect'),
    shortEffect: enText(it.effect_entries, 'short_effect'),
    flavor: enText(it.flavor_text_entries, 'text'),
    flingPower: it.fling_power,
    flingEffect: it.fling_effect?.name ?? null,
    heldBy: it.held_by_pokemon?.map((p) => ({ name: p.pokemon.name, id: idOf(p.pokemon.url) })) ?? [],
    babyTrigger: it.baby_trigger_for ? idOf(it.baby_trigger_for.url) : null,
  }
  writeJson(path.join(OUT, 'item', `${it.id}.json`), detail)
  itemIndex.push({
    id: it.id, name: it.name, label: detail.label, cost: it.cost, category: it.category.name,
    sprite: detail.sprite, shortEffect: detail.shortEffect, attributes: detail.attributes,
  })
}
writeJson(path.join(OUT, 'items.json'), itemIndex)

console.log('› berries')
const berries = (await mapPool(berryList, P, (r) => get(r.url))).filter(Boolean).map((b) => ({
  id: b.id,
  name: b.name,
  item: b.item.name,
  growthTime: b.growth_time,
  maxHarvest: b.max_harvest,
  naturalGiftPower: b.natural_gift_power,
  naturalGiftType: b.natural_gift_type?.name ?? null,
  size: b.size,
  smoothness: b.smoothness,
  soilDryness: b.soil_dryness,
  firmness: b.firmness?.name ?? null,
  flavors: b.flavors.map((f) => ({ flavor: f.flavor.name, potency: f.potency })),
}))
writeJson(path.join(OUT, 'berries.json'), berries)

console.log('› species')
const species = await mapPool(speciesList, P, (r) => get(r.url))
const speciesById = new Map(species.filter(Boolean).map((s) => [s.id, s]))

console.log('› evolution chains')
const chainIds = [...new Set(species.filter((s) => s?.evolution_chain).map((s) => idOf(s.evolution_chain.url)))]
const chains = await mapPool(chainIds, P, (id) => get(`evolution-chain/${id}`))
const chainById = new Map()

const evoNode = (node) => ({
  species: node.species.name,
  id: idOf(node.species.url),
  isBaby: node.is_baby,
  details: node.evolution_details.map((d) => ({
    trigger: d.trigger?.name ?? null,
    item: d.item?.name ?? null,
    heldItem: d.held_item?.name ?? null,
    knownMove: d.known_move?.name ?? null,
    knownMoveType: d.known_move_type?.name ?? null,
    location: d.location?.name ?? null,
    minLevel: d.min_level,
    minHappiness: d.min_happiness,
    minBeauty: d.min_beauty,
    minAffection: d.min_affection,
    gender: d.gender,
    needsOverworldRain: d.needs_overworld_rain,
    partySpecies: d.party_species?.name ?? null,
    partyType: d.party_type?.name ?? null,
    relativePhysicalStats: d.relative_physical_stats,
    timeOfDay: d.time_of_day || null,
    tradeSpecies: d.trade_species?.name ?? null,
    turnUpsideDown: d.turn_upside_down,
  })),
  evolvesTo: node.evolves_to.map(evoNode),
})

for (const c of chains) {
  if (!c) continue
  chainById.set(c.id, {
    id: c.id,
    babyTriggerItem: c.baby_trigger_item?.name ?? null,
    root: evoNode(c.chain),
  })
}

console.log('› pokemon')
const pokemon = await mapPool(pokemonList, P, (r) => get(r.url))
console.log('› encounters')
const encounters = await mapPool(pokemon.filter(Boolean), P, (p) => get(`pokemon/${p.id}/encounters`))
const encById = new Map(pokemon.filter(Boolean).map((p, i) => [p.id, encounters[i]]))

const methodOrder = { 'level-up': 0, machine: 1, egg: 2, tutor: 3 }
const vgById = new Map(versionGroups.map((v) => [v.name, v]))

const index = []
const varietiesBySpecies = new Map()
for (const p of pokemon) {
  if (!p) continue
  const sid = idOf(p.species.url)
  if (!varietiesBySpecies.has(sid)) varietiesBySpecies.set(sid, [])
  varietiesBySpecies.get(sid).push(p)
}

const forms = await mapPool(
  pokemon.filter(Boolean).flatMap((p) => p.forms.map((f) => f.url)),
  P,
  (u) => get(u),
)
const formByName = new Map(forms.filter(Boolean).map((f) => [f.name, f]))

for (const p of pokemon) {
  if (!p) continue
  const sid = idOf(p.species.url)
  const s = speciesById.get(sid)
  if (!s) continue
  const form = formByName.get(p.name)
  const baseLabel = en(s.names) ?? title(s.name)
  const formLabel = form ? (en(form.form_names) ?? en(form.names)) : null
  const label = p.is_default ? baseLabel : (formLabel || title(p.name))

  const statMap = Object.fromEntries(p.stats.map((st) => [st.stat.name, st.base_stat]))
  const evMap = Object.fromEntries(p.stats.filter((st) => st.effort).map((st) => [st.stat.name, st.effort]))
  const bst = p.stats.reduce((a, b) => a + b.base_stat, 0)

  const detail = {
    id: p.id,
    name: p.name,
    label,
    speciesId: sid,
    speciesName: s.name,
    speciesLabel: baseLabel,
    isDefault: p.is_default,
    formLabel,
    order: p.order,
    generation: idOf(s.generation.url),
    genus: en(s.genera, 'genus'),
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    pastTypes: p.past_types?.map((pt) => ({
      generation: pt.generation.name,
      types: pt.types.map((t) => t.type.name),
    })) ?? [],
    stats: statMap,
    bst,
    evYield: evMap,
    height: p.height,
    weight: p.weight,
    baseExperience: p.base_experience,
    abilities: p.abilities.map((a) => ({ name: a.ability.name, id: idOf(a.ability.url), hidden: a.is_hidden, slot: a.slot })),
    heldItems: p.held_items.map((h) => ({
      name: h.item.name,
      versions: h.version_details.map((v) => ({ version: v.version.name, rarity: v.rarity })),
    })),
    cries: p.cries ?? null,
    sprites: {
      front: p.sprites.front_default,
      back: p.sprites.back_default,
      shiny: p.sprites.front_shiny,
      shinyBack: p.sprites.back_shiny,
      female: p.sprites.front_female,
      shinyFemale: p.sprites.front_shiny_female,
      artwork: p.sprites.other?.['official-artwork']?.front_default ?? null,
      artworkShiny: p.sprites.other?.['official-artwork']?.front_shiny ?? null,
      home: p.sprites.other?.home?.front_default ?? null,
      homeShiny: p.sprites.other?.home?.front_shiny ?? null,
      showdown: p.sprites.other?.showdown?.front_default ?? null,
      showdownShiny: p.sprites.other?.showdown?.front_shiny ?? null,
      dreamWorld: p.sprites.other?.dream_world?.front_default ?? null,
      versions: p.sprites.versions ?? null,
    },
    species: {
      captureRate: s.capture_rate,
      baseHappiness: s.base_happiness,
      genderRate: s.gender_rate,
      hatchCounter: s.hatch_counter,
      growthRate: s.growth_rate?.name ?? null,
      eggGroups: s.egg_groups.map((e) => e.name),
      color: s.color?.name ?? null,
      shape: s.shape?.name ?? null,
      habitat: s.habitat?.name ?? null,
      isBaby: s.is_baby,
      isLegendary: s.is_legendary,
      isMythical: s.is_mythical,
      hasGenderDifferences: s.has_gender_differences,
      formsSwitchable: s.forms_switchable,
      evolvesFrom: s.evolves_from_species?.name ?? null,
      evolvesFromId: s.evolves_from_species ? idOf(s.evolves_from_species.url) : null,
      chainId: s.evolution_chain ? idOf(s.evolution_chain.url) : null,
    },
    pokedexNumbers: s.pokedex_numbers.map((n) => ({ pokedex: n.pokedex.name, entry: n.entry_number })),
    flavorText: [...new Map(
      s.flavor_text_entries
        .filter((f) => f.language.name === 'en')
        .map((f) => [f.version.name, (f.flavor_text || '').replace(/[\n\f]/g, ' ').replace(/\s+/g, ' ').trim()]),
    )].map(([version, text]) => ({ version, text })),
    varieties: (varietiesBySpecies.get(sid) ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      isDefault: v.is_default,
      label: v.is_default ? baseLabel : (en(formByName.get(v.name)?.form_names ?? []) || title(v.name)),
    })),
    evolution: s.evolution_chain ? chainById.get(idOf(s.evolution_chain.url)) ?? null : null,
    moves: p.moves.flatMap((m) =>
      m.version_group_details.map((d) => ({
        move: m.move.name,
        id: idOf(m.move.url),
        method: d.move_learn_method.name,
        level: d.level_learned_at,
        versionGroup: d.version_group.name,
      })),
    ).sort((a, b) =>
      (methodOrder[a.method] ?? 9) - (methodOrder[b.method] ?? 9) || a.level - b.level || a.move.localeCompare(b.move)),
    encounters: (encById.get(p.id) ?? []).map((e) => ({
      location: e.location_area.name,
      versions: e.version_details.map((v) => ({
        version: v.version.name,
        maxChance: v.max_chance,
        details: v.encounter_details.map((d) => ({
          method: d.method.name,
          chance: d.chance,
          minLevel: d.min_level,
          maxLevel: d.max_level,
          conditions: d.condition_values.map((c) => c.name),
        })),
      })),
    })),
  }
  writeJson(path.join(OUT, 'pokemon', `${p.id}.json`), detail)

  index.push({
    id: p.id,
    name: p.name,
    label,
    speciesId: sid,
    isDefault: p.is_default,
    generation: detail.generation,
    types: detail.types,
    stats: [statMap.hp, statMap.attack, statMap.defense, statMap['special-attack'], statMap['special-defense'], statMap.speed],
    bst,
    height: p.height,
    weight: p.weight,
    genus: detail.genus,
    color: detail.species.color,
    shape: detail.species.shape,
    habitat: detail.species.habitat,
    eggGroups: detail.species.eggGroups,
    growthRate: detail.species.growthRate,
    captureRate: s.capture_rate,
    genderRate: s.gender_rate,
    baseExperience: p.base_experience,
    abilities: detail.abilities.map((a) => a.name),
    legendary: s.is_legendary,
    mythical: s.is_mythical,
    baby: s.is_baby,
    hasArtwork: !!detail.sprites.artwork,
    sprite: detail.sprites.front,
    artwork: detail.sprites.artwork,
    kanto: s.pokedex_numbers.find((n) => n.pokedex.name === 'national')?.entry_number ?? null,
  })
}

index.sort((a, b) => a.id - b.id)
writeJson(path.join(OUT, 'index.json'), index)

console.log('› meta')
writeJson(path.join(OUT, 'meta.json'), {
  generations: generations.map((g) => ({
    id: g.id, name: g.name, label: en(g.names) ?? title(g.name),
    region: g.main_region?.name ?? null,
    versionGroups: g.version_groups.map((v) => v.name),
    speciesCount: g.pokemon_species.length,
    moveCount: g.moves.length,
  })),
  versionGroups: versionGroups.map((v) => ({
    id: v.id, name: v.name, label: title(v.name), generation: idOf(v.generation.url),
    versions: v.versions.map((x) => x.name), order: v.order,
    regions: v.regions.map((r) => r.name),
  })).sort((a, b) => a.order - b.order),
  versions: versions.map((v) => ({ id: v.id, name: v.name, label: en(v.names) ?? title(v.name), versionGroup: v.version_group.name })),
  pokedexes: pokedexes.map((d) => ({
    id: d.id, name: d.name, label: en(d.names) ?? title(d.name),
    description: enText(d.descriptions, 'description'),
    region: d.region?.name ?? null,
    isMainSeries: d.is_main_series,
    entries: d.pokemon_entries.map((e) => [e.entry_number, idOf(e.pokemon_species.url)]),
  })),
  eggGroups: eggGroups.map((g) => ({ id: g.id, name: g.name, label: en(g.names) ?? title(g.name), count: g.pokemon_species.length })),
  natures: natures.map((n) => ({
    id: n.id, name: n.name, label: title(n.name),
    increased: n.increased_stat?.name ?? null,
    decreased: n.decreased_stat?.name ?? null,
    likes: n.likes_flavor?.name ?? null,
    hates: n.hates_flavor?.name ?? null,
  })),
  growthRates: growthRates.map((g) => ({
    id: g.id, name: g.name, formula: g.formula,
    levels: g.levels.map((l) => [l.level, l.experience]),
  })),
  regions: regions.map((r) => ({
    id: r.id, name: r.name, label: en(r.names) ?? title(r.name),
    generation: r.main_generation ? idOf(r.main_generation.url) : null,
    locations: r.locations.length,
    pokedexes: r.pokedexes.map((p) => p.name),
  })),
  itemCategories: itemCategories.map((c) => ({ id: c.id, name: c.name, label: en(c.names) ?? title(c.name), pocket: c.pocket.name, count: c.items.length })),
  damageClasses: moveDamageClasses.map((c) => ({ id: c.id, name: c.name, description: enText(c.descriptions, 'description') })),
  ailments: moveAilments.map((a) => ({ id: a.id, name: a.name, moves: a.moves.length })),
  stats: stats.filter((s) => s.game_index > 0).map((s) => ({ id: s.id, name: s.name, label: en(s.names) ?? title(s.name) })),
  counts: {
    pokemon: index.length,
    species: species.filter(Boolean).length,
    moves: moveIndex.length,
    abilities: abilityIndex.length,
    items: itemIndex.length,
    types: typeData.length,
    berries: berries.length,
  },
})

console.log('done:', index.length, 'pokemon,', moveIndex.length, 'moves,', abilityIndex.length, 'abilities,', itemIndex.length, 'items')
