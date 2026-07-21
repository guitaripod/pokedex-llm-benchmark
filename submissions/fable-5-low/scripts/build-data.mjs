import { writeFile, mkdir } from 'node:fs/promises'

const API = 'https://pokeapi.co/api/v2'
const OUT = new URL('../public/data/', import.meta.url)
const CONCURRENCY = 25

async function getJSON(url, attempt = 1) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status} ${url}`)
    return await res.json()
  } catch (e) {
    if (attempt >= 5) throw e
    await new Promise(r => setTimeout(r, attempt * 1500))
    return getJSON(url, attempt + 1)
  }
}

async function pool(items, fn) {
  const results = new Array(items.length)
  let i = 0, done = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
      if (++done % 100 === 0) console.log(`  ${done}/${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return results
}

const idOf = url => Number(url.split('/').filter(Boolean).pop())

function pickFlavor(entries) {
  const en = entries.filter(e => e.language.name === 'en')
  return en.length ? en[en.length - 1].flavor_text.replace(/[\n\f\r]+/g, ' ').trim() : ''
}

function englishName(names, fallback) {
  const en = names?.find(n => n.language.name === 'en')
  return en ? en.name : fallback
}

console.log('Fetching lists...')
const [pokeList, speciesList, typeList] = await Promise.all([
  getJSON(`${API}/pokemon?limit=100000`),
  getJSON(`${API}/pokemon-species?limit=100000`),
  getJSON(`${API}/type?limit=100`),
])

console.log(`Pokemon: ${pokeList.results.length}, Species: ${speciesList.results.length}`)

console.log('Fetching species...')
const speciesRaw = await pool(speciesList.results, s => getJSON(s.url))
const speciesById = new Map(speciesRaw.map(s => [s.id, s]))

console.log('Fetching pokemon...')
const pokeRaw = await pool(pokeList.results, p => getJSON(p.url))

console.log('Fetching evolution chains...')
const chainIds = [...new Set(speciesRaw.map(s => s.evolution_chain ? idOf(s.evolution_chain.url) : null).filter(Boolean))]
const chainsRaw = await pool(chainIds, id => getJSON(`${API}/evolution-chain/${id}`))

console.log('Fetching types...')
const mainTypes = typeList.results.filter(t => !['unknown', 'shadow', 'stellar'].includes(t.name))
const typesRaw = await pool(mainTypes, t => getJSON(t.url))

console.log('Fetching abilities...')
const abilityList = await getJSON(`${API}/ability?limit=1000`)
const abilitiesRaw = await pool(abilityList.results, a => getJSON(a.url))

console.log('Fetching generations...')
const genList = await getJSON(`${API}/generation?limit=50`)
const gensRaw = await pool(genList.results, g => getJSON(g.url))
const genBySpecies = new Map()
for (const g of gensRaw) for (const s of g.pokemon_species) genBySpecies.set(idOf(s.url), g.id)

function simplifyChain(node) {
  return {
    species: idOf(node.species.url),
    name: node.species.name,
    evolves_to: node.evolves_to.map(simplifyChain),
    details: (node.evolution_details || []).slice(0, 1).map(d => ({
      trigger: d.trigger?.name || null,
      min_level: d.min_level,
      item: d.item?.name || null,
      held_item: d.held_item?.name || null,
      min_happiness: d.min_happiness,
      min_beauty: d.min_beauty,
      min_affection: d.min_affection,
      time_of_day: d.time_of_day || null,
      location: d.location?.name || null,
      known_move: d.known_move?.name || null,
      known_move_type: d.known_move_type?.name || null,
      trade_species: d.trade_species?.name || null,
      needs_overworld_rain: d.needs_overworld_rain || false,
      gender: d.gender,
    }))[0] || null,
  }
}

const evolution = {}
for (const c of chainsRaw) evolution[c.id] = simplifyChain(c.chain)

const abilities = {}
for (const a of abilitiesRaw) {
  const en = a.effect_entries.find(e => e.language.name === 'en')
  const flavorEn = a.flavor_text_entries.filter(e => e.language.name === 'en')
  abilities[a.name] = {
    name: englishName(a.names, a.name),
    effect: en ? en.short_effect : (flavorEn.length ? flavorEn[flavorEn.length - 1].flavor_text.replace(/[\n\f]+/g, ' ') : ''),
  }
}

const types = {}
for (const t of typesRaw) {
  types[t.name] = {
    double_to: t.damage_relations.double_damage_to.map(x => x.name),
    half_to: t.damage_relations.half_damage_to.map(x => x.name),
    no_to: t.damage_relations.no_damage_to.map(x => x.name),
    double_from: t.damage_relations.double_damage_from.map(x => x.name),
    half_from: t.damage_relations.half_damage_from.map(x => x.name),
    no_from: t.damage_relations.no_damage_from.map(x => x.name),
  }
}

const statOrder = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

const dex = pokeRaw.filter(Boolean).map(p => {
  const sp = speciesById.get(idOf(p.species.url))
  if (!sp) return null
  const stats = statOrder.map(name => p.stats.find(s => s.stat.name === name)?.base_stat ?? 0)
  const evs = statOrder.map(name => p.stats.find(s => s.stat.name === name)?.effort ?? 0)
  return {
    id: p.id,
    name: p.name,
    label: englishName(sp.names, sp.name),
    species: sp.id,
    default: p.is_default,
    types: p.types.sort((a, b) => a.slot - b.slot).map(t => t.type.name),
    stats,
    evs,
    height: p.height,
    weight: p.weight,
    base_exp: p.base_experience,
    abilities: p.abilities.sort((a, b) => a.slot - b.slot).map(a => ({ n: a.ability.name, h: a.is_hidden })),
    genus: englishName(sp.genera?.map(g => ({ ...g, name: g.genus })), '') || (sp.genera?.find(g => g.language.name === 'en')?.genus ?? ''),
    flavor: pickFlavor(sp.flavor_text_entries || []),
    gen: genBySpecies.get(sp.id) || sp.generation ? (genBySpecies.get(sp.id) ?? idOf(sp.generation.url)) : null,
    color: sp.color?.name || null,
    shape: sp.shape?.name || null,
    habitat: sp.habitat?.name || null,
    capture_rate: sp.capture_rate,
    base_happiness: sp.base_happiness,
    growth: sp.growth_rate?.name || null,
    egg_groups: sp.egg_groups.map(e => e.name),
    gender_rate: sp.gender_rate,
    hatch_counter: sp.hatch_counter,
    legendary: sp.is_legendary,
    mythical: sp.is_mythical,
    baby: sp.is_baby,
    chain: sp.evolution_chain ? idOf(sp.evolution_chain.url) : null,
    varieties: sp.varieties.map(v => idOf(v.pokemon.url)),
    has_art: !!p.sprites.other?.['official-artwork']?.front_default,
    has_anim: !!p.sprites.other?.showdown?.front_default,
    cry: !!p.cries?.latest,
  }
}).filter(Boolean).sort((a, b) => a.id - b.id)

await mkdir(OUT, { recursive: true })
await writeFile(new URL('pokedex.json', OUT), JSON.stringify(dex))
await writeFile(new URL('evolution.json', OUT), JSON.stringify(evolution))
await writeFile(new URL('types.json', OUT), JSON.stringify(types))
await writeFile(new URL('abilities.json', OUT), JSON.stringify(abilities))
console.log(`Wrote ${dex.length} pokemon, ${Object.keys(evolution).length} chains, ${Object.keys(types).length} types, ${Object.keys(abilities).length} abilities`)
