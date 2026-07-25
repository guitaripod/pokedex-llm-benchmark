import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadCsv } from '../lib/csv.ts'
import { emit, GENERATED_AT, OUT_DIR } from '../lib/emit.ts'
import type {
  AbilityIndex,
  ItemIndex,
  LocationIndex,
  MetaData,
  MoveIndex,
  PokemonIndex,
  SearchIndex,
  SearchKind,
  SearchTuple,
} from '../../src/types/data.ts'

interface StaticPage {
  route: string
  label: string
}

const PAGES: StaticPage[] = [
  { route: '/pokedex', label: 'Pokédex' },
  { route: '/moves', label: 'Moves' },
  { route: '/items', label: 'Items' },
  { route: '/abilities', label: 'Abilities' },
  { route: '/locations', label: 'Locations' },
  { route: '/types', label: 'Types' },
  { route: '/natures', label: 'Natures' },
  { route: '/team-builder', label: 'Team Builder' },
  { route: '/damage-calculator', label: 'Damage Calculator' },
  { route: '/compare', label: 'Compare Pokémon' },
  { route: '/coverage', label: 'Type Coverage' },
  { route: '/berries', label: 'Berries' },
  { route: '/machines', label: 'Machines (TMs & HMs)' },
  { route: '/evolution', label: 'Evolution Chains' },
  { route: '/stats-leaderboard', label: 'Stats Leaderboard' },
  { route: '/whos-that-pokemon', label: "Who's That Pokémon?" },
  { route: '/favorites', label: 'Favorites' },
  { route: '/settings', label: 'Settings' },
]

const KIND_ORDER: SearchKind[] = ['pokemon', 'move', 'item', 'ability', 'location', 'type', 'nature', 'page']

const NON_BATTLE_TYPES = new Set(['unknown', 'shadow'])

interface DataStats {
  pokemon: number
  species: number
  forms: number
  moves: number
  items: number
  abilities: number
  locations: number
  learnsetRows: number
  encounterRows: number
}

/// Reads a JSON file that a previous builder emitted, failing loudly when the build order is wrong.
function readEmitted<T>(file: string): T {
  const path = join(OUT_DIR, file)
  if (!existsSync(path)) {
    throw new Error(
      `search builder: missing ${path} — run it after meta/pokemon/moves/items/abilities/locations have emitted`,
    )
  }
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

/// Orders entries by kind (palette grouping) then by id so the emitted corpus is byte-stable.
function byKindThenId(a: SearchTuple, b: SearchTuple): number {
  const rank = KIND_ORDER.indexOf(a[0]) - KIND_ORDER.indexOf(b[0])
  return rank !== 0 ? rank : a[1] - b[1]
}

export function buildSearchIndex(): void {
  const pokemon = readEmitted<PokemonIndex>('pokemon-index.json')
  const moves = readEmitted<MoveIndex>('moves-index.json')
  const items = readEmitted<ItemIndex>('items-index.json')
  const abilities = readEmitted<AbilityIndex>('abilities-index.json')
  const locations = readEmitted<LocationIndex>('locations-index.json')
  const meta = readEmitted<MetaData>('meta.json')

  const entries: SearchTuple[] = []

  for (const p of pokemon.entries) {
    entries.push(['pokemon', p.id, p.name, p.label, p.types.length ? p.types[0] : null])
  }
  for (const m of moves.entries) entries.push(['move', m.id, m.name, m.label, m.typeId])
  for (const i of items.entries) entries.push(['item', i.id, i.name, i.label, null])
  for (const a of abilities.entries) entries.push(['ability', a.id, a.name, a.label, null])
  for (const l of locations.entries) entries.push(['location', l.id, l.name, l.label, null])

  for (const t of meta.types) {
    if (NON_BATTLE_TYPES.has(t.name)) continue
    entries.push(['type', t.id, t.name, t.label, t.id])
  }
  for (const n of meta.natures) entries.push(['nature', n.id, n.name, n.label, null])

  PAGES.forEach((page, index) => {
    entries.push(['page', index + 1, page.route, page.label, null])
  })

  entries.sort(byKindThenId)

  const index: SearchIndex = { generatedAt: GENERATED_AT, entries }
  emit('search-index.json', index)

  const speciesIds = new Set<number>()
  for (const p of pokemon.entries) speciesIds.add(p.speciesId)

  const stats: DataStats = {
    pokemon: pokemon.entries.length,
    species: speciesIds.size,
    forms: pokemon.entries.length - speciesIds.size,
    moves: moves.entries.length,
    items: items.entries.length,
    abilities: abilities.entries.length,
    locations: locations.entries.length,
    learnsetRows: loadCsv('pokemon_moves').length,
    encounterRows: loadCsv('encounters').length,
  }
  emit('stats.json', stats)
}
