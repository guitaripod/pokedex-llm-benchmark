import raw from '../data/pokemon-index.json'

export interface IndexEntry {
  id: number
  name: string
  types: string[]
  gen: number
  total: number
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
  height: number
  weight: number
}

export const POKEDEX: IndexEntry[] = raw as IndexEntry[]

export const BY_ID = new Map(POKEDEX.map((p) => [p.id, p]))
export const BY_NAME = new Map(POKEDEX.map((p) => [p.name, p]))

export function searchIndex(q: string): IndexEntry[] {
  const s = q.trim().toLowerCase()
  if (!s) return POKEDEX
  if (/^\d+$/.test(s)) {
    const byId = BY_ID.get(Number(s))
    const contains = POKEDEX.filter((p) => String(p.id).includes(s))
    return byId ? [byId, ...contains.filter((p) => p.id !== byId.id)] : contains
  }
  return POKEDEX.filter((p) => p.name.includes(s))
}
