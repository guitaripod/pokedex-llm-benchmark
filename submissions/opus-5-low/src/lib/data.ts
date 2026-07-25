import type { AbilityIndex, Ability, Berry, IndexEntry, Item, ItemIndex, Meta, Move, MoveIndex, Pokemon, TypeInfo } from './types'

const cache = new Map<string, Promise<unknown>>()

function load<T>(path: string): Promise<T> {
  let p = cache.get(path)
  if (!p) {
    p = fetch(`/data/${path}`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${path}`)
      return r.json()
    })
    cache.set(path, p)
  }
  return p as Promise<T>
}

export const getIndex = () => load<IndexEntry[]>('index.json')
export const getMeta = () => load<Meta>('meta.json')
export const getTypes = () => load<TypeInfo[]>('types.json')
export const getMoves = () => load<MoveIndex[]>('moves.json')
export const getAbilities = () => load<AbilityIndex[]>('abilities.json')
export const getItems = () => load<ItemIndex[]>('items.json')
export const getBerries = () => load<Berry[]>('berries.json')
export const getPokemon = (id: number | string) => load<Pokemon>(`pokemon/${id}.json`)
export const getMove = (id: number | string) => load<Move>(`move/${id}.json`)
export const getAbility = (id: number | string) => load<Ability>(`ability/${id}.json`)
export const getItem = (id: number | string) => load<Item>(`item/${id}.json`)
