import type {
  AbilityDetail, AbilityIndex, Item, Meta, MoveDetail, MoveIndex,
  PokemonDetail, SpeciesIndex, TypesData
} from './types'

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

async function load<T>(file: string): Promise<T> {
  if (cache.has(file)) return cache.get(file) as T
  const pending = inflight.get(file)
  if (pending) return pending as Promise<T>
  const p = (async () => {
    try {
      const res = await fetch(`/data/${file}`)
      if (!res.ok) throw new Error(`Failed to load ${file} (${res.status})`)
      const data = await res.json()
      cache.set(file, data)
      return data
    } finally {
      inflight.delete(file)
    }
  })()
  inflight.set(file, p)
  return p as Promise<T>
}

export const getIndex = () => load<SpeciesIndex[]>('index.json')
export const getMeta = () => load<Meta>('meta.json')
export const getTypes = () => load<TypesData>('types.json')
export const getPokemon = (id: number | string) => load<PokemonDetail>(`pokemon/${id}.json`)
export const getMoves = () => load<MoveIndex[]>('moves.json')
export const getMove = (id: number | string) => load<MoveDetail>(`moves/${id}.json`)
export const getAbilities = () => load<AbilityIndex[]>('abilities.json')
export const getAbility = (id: number | string) => load<AbilityDetail>(`abilities/${id}.json`)
export const getItems = () => load<Item[]>('items.json')

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export const artUrl = (pid: number, shiny = false) =>
  `${SPRITE_BASE}/other/official-artwork/${shiny ? 'shiny/' : ''}${pid}.png`

export const spriteUrl = (pid: number) => `${SPRITE_BASE}/${pid}.png`

export function resolveSpeciesKey(key: string, index: SpeciesIndex[]): SpeciesIndex | undefined {
  const asNum = Number(key)
  if (Number.isInteger(asNum) && asNum > 0) return index.find(s => s.id === asNum)
  const lower = key.toLowerCase()
  return index.find(s => s.name === lower) ?? index.find(s => s.dname.toLowerCase() === lower)
}
