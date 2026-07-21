import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const API = 'https://pokeapi.co/api/v2'
const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE = path.join(ROOT, '.cache', 'pokeapi')
const OUT = path.join(ROOT, 'public', 'data')
const CONCURRENCY = 16

let fetched = 0
let cached = 0

async function ensureDir(p) {
  await mkdir(p, { recursive: true })
}

function cachePath(url) {
  return path.join(CACHE, createHash('sha1').update(url).digest('hex') + '.json')
}

async function getJSON(url) {
  const cp = cachePath(url)
  if (existsSync(cp)) {
    cached++
    return JSON.parse(await readFile(cp, 'utf8'))
  }
  let lastErr
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      const data = await res.json()
      await writeFile(cp, JSON.stringify(data))
      fetched++
      if ((fetched + cached) % 250 === 0) {
        console.log(`  progress: ${fetched + cached} resources (${fetched} network, ${cached} cache)`)
      }
      return data
    } catch (err) {
      lastErr = err
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1) ** 2))
    }
  }
  throw lastErr
}

async function pool(items, fn) {
  const results = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
  return results
}

async function getList(endpoint) {
  const data = await getJSON(`${API}/${endpoint}?limit=100000`)
  return data.results
}

async function getAll(endpoint) {
  const list = await getList(endpoint)
  return pool(list, r => getJSON(r.url))
}

function idFromUrl(url) {
  return Number(url.replace(/\/$/, '').split('/').pop())
}

function en(entries, field = 'name') {
  const e = entries?.find(x => x.language.name === 'en')
  return e ? e[field] : null
}

function cleanText(t) {
  return t
    .replace(/­\n/g, '')
    .replace(/­/g, '')
    .replace(/[\f\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(s) {
  return s.split('-').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
}

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const TYPE_ORDER = [
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel',
  'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'
]

function statArray(stats) {
  const byName = Object.fromEntries(stats.map(s => [s.stat.name, s.base_stat]))
  return STAT_ORDER.map(n => byName[n] ?? 0)
}

console.log('Pokedex data pipeline starting')
await ensureDir(CACHE)
await ensureDir(OUT)
await ensureDir(path.join(OUT, 'pokemon'))
await ensureDir(path.join(OUT, 'moves'))
await ensureDir(path.join(OUT, 'abilities'))

console.log('Fetching core lists and small taxonomies...')
const [
  generations, versionGroups, versions, learnMethods, damageClasses,
  eggGroupsAll, colorsAll, shapesAll, habitatsAll, growthRatesAll, itemCategories, typesAll
] = await Promise.all([
  getAll('generation'), getAll('version-group'), getAll('version'),
  getAll('move-learn-method'), getAll('move-damage-class'),
  getAll('egg-group'), getAll('pokemon-color'), getAll('pokemon-shape'),
  getAll('pokemon-habitat'), getAll('growth-rate'), getAll('item-category'), getAll('type')
])

console.log('Fetching pokemon, species, moves, abilities, items...')
const [pokemonAll, speciesAll, movesAll, abilitiesAll, itemsAll] = await Promise.all([
  getAll('pokemon'), getAll('pokemon-species'), getAll('move'), getAll('ability'), getAll('item')
])

console.log('Fetching evolution chains...')
const chainUrls = [...new Set(speciesAll.filter(s => s.evolution_chain).map(s => s.evolution_chain.url))]
const chains = await pool(chainUrls, u => getJSON(u))
const chainByUrl = new Map(chainUrls.map((u, i) => [u, chains[i]]))

console.log('Fetching encounters...')
const speciesIds = speciesAll.map(s => s.id).sort((a, b) => a - b)
const encountersById = new Map()
await pool(speciesIds, async sid => {
  const data = await getJSON(`${API}/pokemon/${sid}/encounters`)
  encountersById.set(sid, data ?? [])
})

console.log(`Fetched: ${fetched} network, ${cached} cache. Transforming...`)

const versionDname = new Map(versions.map(v => [v.name, en(v.names) ?? titleCase(v.name)]))
const vgSorted = [...versionGroups].sort((a, b) => a.order - b.order)
const vgIndex = new Map(vgSorted.map((vg, i) => [vg.name, i]))
const vgMeta = vgSorted.map(vg => ({
  name: vg.name,
  dname: vg.versions.map(v => versionDname.get(v.name) ?? titleCase(v.name)).join('/'),
  gen: idFromUrl(vg.generation.url),
  versions: vg.versions.map(v => v.name)
}))
const methodsSorted = [...learnMethods].sort((a, b) => a.id - b.id)
const methodIndex = new Map(methodsSorted.map((m, i) => [m.name, i]))
const methodMeta = methodsSorted.map(m => ({ name: m.name, dname: en(m.names) ?? titleCase(m.name) }))

const dnameMap = list => Object.fromEntries(list.map(x => [x.name, en(x.names) ?? titleCase(x.name)]))
const eggGroupD = dnameMap(eggGroupsAll)
const colorD = dnameMap(colorsAll)
const shapeD = dnameMap(shapesAll)
const habitatD = dnameMap(habitatsAll)
const growthD = dnameMap(growthRatesAll)
const damageClassD = dnameMap(damageClasses)
const itemCatD = dnameMap(itemCategories)

const speciesById = new Map(speciesAll.map(s => [s.id, s]))
const speciesByName = new Map(speciesAll.map(s => [s.name, s]))
const pokemonByName = new Map(pokemonAll.map(p => [p.name, p]))
const moveByName = new Map(movesAll.map(m => [m.name, m]))
const itemByName = new Map(itemsAll.map(i => [i.name, i]))
const abilityMainSeries = abilitiesAll.filter(a => a.is_main_series)

const speciesD = name => {
  const s = speciesByName.get(name)
  return s ? (en(s.names) ?? titleCase(name)) : titleCase(name)
}
const moveD = name => {
  const m = moveByName.get(name)
  return m ? (en(m.names) ?? titleCase(name)) : titleCase(name)
}
const itemD = name => {
  const i = itemByName.get(name)
  return i ? (en(i.names) ?? titleCase(name)) : titleCase(name)
}

const FORM_TOKEN_D = {
  f: 'F', m: 'M', x: 'X', y: 'Y', 'gmax': 'Gigantamax',
  '10': '10%', '50': '50%', 'complete': 'Complete',
  'own-tempo': 'Own Tempo', 'battle-bond': 'Battle Bond',
  'power-construct': 'Power Construct', 'ash': 'Ash',
  'eternamax': 'Eternamax', 'totem': 'Totem', 'cap': 'Cap'
}

function varietyDname(pokemonName, speciesName, speciesDn) {
  if (pokemonName === speciesName) return speciesDn
  if (!pokemonName.startsWith(speciesName + '-')) return titleCase(pokemonName)
  const suffix = pokemonName.slice(speciesName.length + 1)
  const tokens = suffix.split('-')
  if (tokens[0] === 'mega') {
    const rest = tokens.slice(1).map(t => FORM_TOKEN_D[t] ?? titleCase(t)).join(' ')
    return `Mega ${speciesDn}${rest ? ' ' + rest : ''}`
  }
  if (tokens[0] === 'gmax') return `Gigantamax ${speciesDn}`
  const regional = { alola: 'Alolan', galar: 'Galarian', hisui: 'Hisuian', paldea: 'Paldean' }[tokens[0]]
  if (regional) {
    const rest = tokens.slice(1).map(t => FORM_TOKEN_D[t] ?? titleCase(t)).join(' ')
    return `${regional} ${speciesDn}${rest ? ` (${rest})` : ''}`
  }
  if (tokens[tokens.length - 1] === 'gmax') {
    const rest = tokens.slice(0, -1).map(t => FORM_TOKEN_D[t] ?? titleCase(t)).join(' ')
    return `Gigantamax ${speciesDn} (${rest})`
  }
  const label = tokens.map(t => FORM_TOKEN_D[t] ?? titleCase(t)).join(' ')
  return `${speciesDn} (${label})`
}

const TIME_D = { day: 'daytime', night: 'nighttime', dusk: 'at dusk', 'full-moon': 'full moon' }

function evoCondition(d) {
  const parts = []
  const trigger = d.trigger?.name
  if (trigger === 'level-up') parts.push(d.min_level ? `Lv. ${d.min_level}` : 'Level up')
  else if (trigger === 'trade') parts.push('Trade')
  else if (trigger === 'use-item') parts.push(`Use ${itemD(d.item.name)}`)
  else if (trigger === 'shed') parts.push('Lv. 20 with an empty party slot and a Poké Ball')
  else if (trigger === 'spin') parts.push('Spin holding Sweet')
  else if (trigger === 'three-critical-hits') parts.push('Land 3 critical hits in one battle')
  else if (trigger === 'take-damage') parts.push('Take damage, then visit a specific spot')
  else if (trigger === 'tower-of-darkness') parts.push('Train in the Tower of Darkness')
  else if (trigger === 'tower-of-waters') parts.push('Train in the Tower of Waters')
  else if (trigger === 'agile-style-move') parts.push('Use its signature move in Agile Style 20 times')
  else if (trigger === 'strong-style-move') parts.push('Use its signature move in Strong Style 20 times')
  else if (trigger === 'recoil-damage') parts.push('Lose 294+ HP to recoil damage')
  else if (trigger === 'other') parts.push('Special condition')
  else if (trigger) parts.push(titleCase(trigger))
  if (d.item && trigger !== 'use-item') parts.push(`use ${itemD(d.item.name)}`)
  if (d.held_item) parts.push(`holding ${itemD(d.held_item.name)}`)
  if (d.min_happiness != null) parts.push('high friendship')
  if (d.min_affection != null) parts.push(`affection ${d.min_affection}+`)
  if (d.min_beauty != null) parts.push('max Beauty')
  if (d.time_of_day) parts.push(TIME_D[d.time_of_day] ?? d.time_of_day)
  if (d.gender === 1) parts.push('female only')
  if (d.gender === 2) parts.push('male only')
  if (d.known_move) parts.push(`knowing ${moveD(d.known_move.name)}`)
  if (d.known_move_type) parts.push(`knowing a ${titleCase(d.known_move_type.name)}-type move`)
  if (d.location) parts.push(`at ${titleCase(d.location.name).replace(/^Mt /, 'Mt. ')}`)
  if (d.needs_overworld_rain) parts.push('while raining')
  if (d.party_species) parts.push(`with ${speciesD(d.party_species.name)} in party`)
  if (d.party_type) parts.push(`with a ${titleCase(d.party_type.name)}-type in party`)
  if (d.relative_physical_stats === 1) parts.push('Attack > Defense')
  if (d.relative_physical_stats === -1) parts.push('Attack < Defense')
  if (d.relative_physical_stats === 0) parts.push('Attack = Defense')
  if (d.trade_species) parts.push(`for ${speciesD(d.trade_species.name)}`)
  if (d.turn_upside_down) parts.push('with device upside down')
  return parts.join(', ')
}

function evoTree(chainLink) {
  const sid = idFromUrl(chainLink.species.url)
  const conds = [...new Set(chainLink.evolution_details.map(evoCondition).filter(Boolean))]
  return {
    sid,
    name: chainLink.species.name,
    dname: speciesD(chainLink.species.name),
    conds,
    to: chainLink.evolves_to.map(evoTree)
  }
}

function pickSprites(p) {
  const s = p.sprites ?? {}
  const other = s.other ?? {}
  const oa = other['official-artwork'] ?? {}
  const home = other.home ?? {}
  return {
    art: oa.front_default ?? home.front_default ?? s.front_default ?? null,
    artShiny: oa.front_shiny ?? home.front_shiny ?? s.front_shiny ?? null,
    home: home.front_default ?? null,
    homeShiny: home.front_shiny ?? null,
    sprite: s.front_default ?? null,
    spriteShiny: s.front_shiny ?? null,
    spriteBack: s.back_default ?? null
  }
}

const GEN_ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 }
function genNumber(genName) {
  return GEN_ROMAN[genName.replace('generation-', '')] ?? 0
}

function spriteHistory(p) {
  const out = []
  const vers = p.sprites?.versions ?? {}
  for (const [genKey, games] of Object.entries(vers)) {
    const gn = genNumber(genKey)
    for (const [game, sp] of Object.entries(games)) {
      if (game === 'icons') continue
      let use = sp
      if (sp.animated?.front_default) use = sp.animated
      if (!use.front_default) continue
      out.push({
        gen: gn,
        game: game.split('-').map(v => versionDname.get(v) ?? titleCase(v)).join('/'),
        front: use.front_default,
        back: use.back_default ?? null,
        shiny: use.front_shiny ?? null,
        backShiny: use.back_shiny ?? null
      })
    }
  }
  return out.sort((a, b) => a.gen - b.gen)
}

function compactMoves(p) {
  const rows = []
  for (const mv of p.moves) {
    const learns = []
    for (const vgd of mv.version_group_details) {
      const vg = vgIndex.get(vgd.version_group.name)
      const method = methodIndex.get(vgd.move_learn_method.name)
      if (vg == null || method == null) continue
      learns.push([vg, method, vgd.level_learned_at])
    }
    if (learns.length) rows.push([mv.move.name, learns])
  }
  return rows
}

function groupFlavor(entries, keyFn) {
  const groups = []
  const byText = new Map()
  for (const e of entries) {
    if (e.language.name !== 'en') continue
    const t = cleanText(e.flavor_text ?? e.text ?? '')
    if (!t) continue
    const key = keyFn(e)
    if (!key) continue
    if (byText.has(t)) byText.get(t).v.push(key)
    else {
      const g = { v: [key], t }
      byText.set(t, g)
      groups.push(g)
    }
  }
  return groups
}

console.log('Writing types.json...')
const mainTypes = typesAll.filter(t => TYPE_ORDER.includes(t.name))
const typeIdx = new Map(TYPE_ORDER.map((n, i) => [n, i]))
const matrix = TYPE_ORDER.map(() => TYPE_ORDER.map(() => 1))
for (const t of mainTypes) {
  const ai = typeIdx.get(t.name)
  for (const d of t.damage_relations.double_damage_to) matrix[ai][typeIdx.get(d.name)] = 2
  for (const d of t.damage_relations.half_damage_to) matrix[ai][typeIdx.get(d.name)] = 0.5
  for (const d of t.damage_relations.no_damage_to) matrix[ai][typeIdx.get(d.name)] = 0
}
await writeFile(path.join(OUT, 'types.json'), JSON.stringify({
  order: TYPE_ORDER,
  dnames: Object.fromEntries(mainTypes.map(t => [t.name, en(t.names) ?? titleCase(t.name)])),
  matrix
}))

console.log('Writing moves...')
const movesSorted = movesAll.filter(m => m.id < 10000).sort((a, b) => a.id - b.id)
const moveEffect = m => {
  let e = en(m.effect_entries, 'short_effect')
  if (!e) {
    const fl = m.flavor_text_entries?.filter(f => f.language.name === 'en')
    e = fl?.length ? cleanText(fl[fl.length - 1].flavor_text) : ''
  }
  return e.replace(/\$effect_chance/g, String(m.effect_chance ?? ''))
}
const moveIndexRows = movesSorted.map(m => ({
  id: m.id,
  name: m.name,
  dname: en(m.names) ?? titleCase(m.name),
  type: m.type?.name ?? 'normal',
  dclass: m.damage_class?.name ?? 'status',
  power: m.power,
  acc: m.accuracy,
  pp: m.pp,
  priority: m.priority,
  gen: genNumber(m.generation.name),
  effect: moveEffect(m)
}))
await writeFile(path.join(OUT, 'moves.json'), JSON.stringify(moveIndexRows))

const pokemonToSid = new Map(pokemonAll.map(p => [p.name, idFromUrl(p.species.url)]))
for (const [i, m] of movesSorted.entries()) {
  const row = moveIndexRows[i]
  const learners = [...new Set((m.learned_by_pokemon ?? []).map(p => pokemonToSid.get(p.name)).filter(Boolean))].sort((a, b) => a - b)
  const detail = {
    ...row,
    effectFull: (en(m.effect_entries, 'effect') ?? row.effect).replace(/\$effect_chance/g, String(m.effect_chance ?? '')),
    flavor: groupFlavor(m.flavor_text_entries ?? [], e => e.version_group?.name),
    target: titleCase(m.target?.name ?? ''),
    meta: m.meta ? {
      ailment: m.meta.ailment?.name !== 'none' ? m.meta.ailment?.name ?? null : null,
      ailmentChance: m.meta.ailment_chance || null,
      critRate: m.meta.crit_rate || null,
      drain: m.meta.drain || null,
      flinchChance: m.meta.flinch_chance || null,
      healing: m.meta.healing || null,
      minHits: m.meta.min_hits,
      maxHits: m.meta.max_hits
    } : null,
    statChanges: (m.stat_changes ?? []).map(sc => ({ stat: sc.stat.name, change: sc.change })),
    learners
  }
  await writeFile(path.join(OUT, 'moves', `${m.id}.json`), JSON.stringify(detail))
}

console.log('Writing abilities...')
const abilitiesSorted = abilityMainSeries.sort((a, b) => a.id - b.id)
const abilityEffect = a => {
  let e = en(a.effect_entries, 'short_effect')
  if (!e) {
    const fl = a.flavor_text_entries?.filter(f => f.language.name === 'en')
    e = fl?.length ? cleanText(fl[fl.length - 1].flavor_text) : ''
  }
  return e
}
const abilityIndexRows = abilitiesSorted.map(a => ({
  id: a.id,
  name: a.name,
  dname: en(a.names) ?? titleCase(a.name),
  gen: genNumber(a.generation.name),
  effect: abilityEffect(a)
}))
await writeFile(path.join(OUT, 'abilities.json'), JSON.stringify(abilityIndexRows))

for (const [i, a] of abilitiesSorted.entries()) {
  const holders = (a.pokemon ?? []).map(ap => {
    const p = pokemonByName.get(ap.pokemon.name)
    if (!p) return null
    const sid = idFromUrl(p.species.url)
    const sp = speciesById.get(sid)
    return {
      sid,
      pid: p.id,
      pdname: varietyDname(p.name, sp?.name ?? p.name, sp ? (en(sp.names) ?? titleCase(sp.name)) : titleCase(p.name)),
      hidden: ap.is_hidden
    }
  }).filter(Boolean).sort((x, y) => x.sid - y.sid || x.pid - y.pid)
  const fl = (a.flavor_text_entries ?? []).filter(f => f.language.name === 'en')
  await writeFile(path.join(OUT, 'abilities', `${a.id}.json`), JSON.stringify({
    ...abilityIndexRows[i],
    effectFull: en(a.effect_entries, 'effect') ?? abilityIndexRows[i].effect,
    flavor: fl.length ? cleanText(fl[fl.length - 1].flavor_text) : null,
    holders
  }))
}

console.log('Writing items.json...')
const itemsSorted = itemsAll
  .filter(Boolean)
  .filter(it => it.category?.name !== 'dynamax-crystals')
  .sort((a, b) => a.id - b.id)
const itemRows = itemsSorted.map(it => {
  const fl = (it.flavor_text_entries ?? []).filter(f => f.language.name === 'en')
  let effect = en(it.effect_entries, 'short_effect') ?? ''
  const flavor = fl.length ? cleanText(fl[fl.length - 1].text) : ''
  if (!effect) effect = flavor
  return {
    id: it.id,
    name: it.name,
    dname: en(it.names) ?? titleCase(it.name),
    cat: it.category?.name ?? 'unknown',
    catD: itemCatD[it.category?.name] ?? titleCase(it.category?.name ?? 'unknown'),
    effect,
    flavor,
    cost: it.cost,
    fling: it.fling_power,
    sprite: it.sprites?.default ?? null,
    attrs: (it.attributes ?? []).map(x => x.name)
  }
})
await writeFile(path.join(OUT, 'items.json'), JSON.stringify(itemRows))

console.log('Writing species index and per-pokemon files...')
const sortedSpecies = [...speciesAll].sort((a, b) => a.id - b.id)
const indexRows = []

for (const sp of sortedSpecies) {
  const dn = en(sp.names) ?? titleCase(sp.name)
  const defaultVar = sp.varieties.find(v => v.is_default) ?? sp.varieties[0]
  const defaultPokemon = defaultVar ? pokemonByName.get(defaultVar.pokemon.name) : null
  if (!defaultPokemon) continue
  const stats = statArray(defaultPokemon.stats)
  indexRows.push({
    id: sp.id,
    name: sp.name,
    dname: dn,
    jname: sp.names?.find(n => n.language.name === 'ja-hrkt')?.name ?? null,
    genus: en(sp.genera, 'genus') ?? '',
    gen: genNumber(sp.generation.name),
    types: defaultPokemon.types.map(t => t.type.name),
    stats,
    bst: stats.reduce((a, b) => a + b, 0),
    height: defaultPokemon.height,
    weight: defaultPokemon.weight,
    color: sp.color?.name ?? null,
    shape: sp.shape?.name ?? null,
    habitat: sp.habitat?.name ?? null,
    eggGroups: sp.egg_groups.map(g => g.name),
    captureRate: sp.capture_rate,
    genderRate: sp.gender_rate,
    growthRate: sp.growth_rate?.name ?? null,
    legendary: sp.is_legendary,
    mythical: sp.is_mythical,
    baby: sp.is_baby,
    abilities: defaultPokemon.abilities.map(a => ({ n: a.ability.name, h: a.is_hidden })),
    forms: sp.varieties.length - 1
  })
}
await writeFile(path.join(OUT, 'index.json'), JSON.stringify(indexRows))

const maxSid = sortedSpecies[sortedSpecies.length - 1].id
for (const sp of sortedSpecies) {
  const dn = en(sp.names) ?? titleCase(sp.name)
  const chain = sp.evolution_chain ? chainByUrl.get(sp.evolution_chain.url) : null
  const varieties = sp.varieties
    .map(v => pokemonByName.get(v.pokemon.name))
    .filter(Boolean)
    .map(p => {
      const sprites = pickSprites(p)
      return {
        pid: p.id,
        name: p.name,
        dname: varietyDname(p.name, sp.name, dn),
        isDefault: p.is_default,
        types: p.types.map(t => t.type.name),
        pastTypes: (p.past_types ?? []).map(pt => ({
          until: genNumber(pt.generation.name),
          types: pt.types.map(t => t.type.name)
        })),
        stats: statArray(p.stats),
        abilities: p.abilities.map(a => ({ n: a.ability.name, h: a.is_hidden })),
        height: p.height,
        weight: p.weight,
        baseExp: p.base_experience,
        ...sprites,
        cry: p.cries?.latest ?? p.cries?.legacy ?? null,
        heldItems: (p.held_items ?? []).map(h => h.item.name),
        moves: compactMoves(p)
      }
    })

  const defaultP = sp.varieties.find(v => v.is_default) && pokemonByName.get(sp.varieties.find(v => v.is_default).pokemon.name)
  const encounters = []
  for (const enc of encountersById.get(sp.id) ?? []) {
    const area = titleCase(enc.location_area.name.replace(/-area$/, ''))
    for (const vd of enc.version_details) {
      const v = versionDname.get(vd.version.name) ?? titleCase(vd.version.name)
      let row = encounters.find(e => e.v === v)
      if (!row) encounters.push(row = { v, areas: [] })
      if (!row.areas.includes(area)) row.areas.push(area)
    }
  }

  const prevSp = speciesById.get(sp.id - 1)
  const nextSp = speciesById.get(sp.id + 1)
  const detail = {
    id: sp.id,
    name: sp.name,
    dname: dn,
    jname: sp.names?.find(n => n.language.name === 'ja-hrkt')?.name ?? null,
    genus: en(sp.genera, 'genus') ?? '',
    gen: genNumber(sp.generation.name),
    flavor: groupFlavor(sp.flavor_text_entries ?? [], e => versionDname.get(e.version?.name) ?? e.version?.name),
    color: sp.color?.name ?? null,
    shape: sp.shape?.name ?? null,
    habitat: sp.habitat?.name ?? null,
    growthRate: sp.growth_rate?.name ?? null,
    captureRate: sp.capture_rate,
    baseHappiness: sp.base_happiness,
    hatchCounter: sp.hatch_counter,
    genderRate: sp.gender_rate,
    eggGroups: sp.egg_groups.map(g => g.name),
    legendary: sp.is_legendary,
    mythical: sp.is_mythical,
    baby: sp.is_baby,
    evo: chain ? evoTree(chain.chain) : null,
    varieties,
    spriteHistory: defaultP ? spriteHistory(defaultP) : [],
    encounters,
    prev: prevSp ? { id: prevSp.id, dname: en(prevSp.names) ?? titleCase(prevSp.name) } : null,
    next: nextSp && sp.id < maxSid ? { id: nextSp.id, dname: en(nextSp.names) ?? titleCase(nextSp.name) } : null
  }
  await writeFile(path.join(OUT, 'pokemon', `${sp.id}.json`), JSON.stringify(detail))
}

console.log('Writing meta.json...')
const gens = [...generations].sort((a, b) => a.id - b.id).map(g => {
  const ids = g.pokemon_species.map(s => idFromUrl(s.url))
  return {
    id: g.id,
    name: g.name,
    dname: en(g.names) ?? titleCase(g.name),
    region: g.main_region ? titleCase(g.main_region.name) : null,
    range: [Math.min(...ids), Math.max(...ids)]
  }
})
await writeFile(path.join(OUT, 'meta.json'), JSON.stringify({
  builtAt: new Date().toISOString(),
  counts: {
    species: indexRows.length,
    pokemon: pokemonAll.length,
    moves: moveIndexRows.length,
    abilities: abilityIndexRows.length,
    items: itemRows.length,
    types: TYPE_ORDER.length
  },
  gens,
  vgs: vgMeta,
  methods: methodMeta,
  versions: Object.fromEntries(versionDname),
  eggGroups: eggGroupD,
  colors: colorD,
  shapes: shapeD,
  habitats: habitatD,
  growthRates: growthD,
  damageClasses: damageClassD,
  statNames: ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed']
}))

async function dirSize(dir) {
  let total = 0
  for (const f of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (f.isFile()) total += (await stat(path.join(f.parentPath, f.name))).size
  }
  return total
}

const totalMB = ((await dirSize(OUT)) / 1024 / 1024).toFixed(1)
console.log(`DONE. species=${indexRows.length} pokemon=${pokemonAll.length} moves=${moveIndexRows.length} abilities=${abilityIndexRows.length} items=${itemRows.length}`)
console.log(`Output size: ${totalMB} MB in public/data`)
if (indexRows.length < 1000) throw new Error('Sanity check failed: fewer than 1000 species')
