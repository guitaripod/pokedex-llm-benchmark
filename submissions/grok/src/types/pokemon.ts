export interface PokemonType {
  type: { name: string }
}

export interface Stat {
  base_stat: number
  stat: { name: string }
}

export interface Ability {
  ability: { name: string }
  is_hidden: boolean
}

export interface Sprites {
  front_default: string | null
  front_shiny?: string | null
  other?: {
    'official-artwork'?: { front_default: string | null; front_shiny?: string | null }
    home?: { front_default?: string | null; front_shiny?: string | null }
  }
}

export interface EvolutionStep {
  name: string
  id: number
  condition?: string
}

export interface Pokemon {
  id: number
  name: string
  types: PokemonType[]
  sprites: Sprites
  height: number
  weight: number
  stats: Stat[]
  abilities: Ability[]
  flavor_text?: string
  base_experience?: number
  capture_rate?: number
  base_happiness?: number
  growth_rate?: string
  hatch_counter?: number
  gender_rate?: number
  egg_groups?: string[]
  color?: string
  habitat?: string
  shape?: string
  genus?: string
  evolution_chain_url?: string
  evolutions?: EvolutionStep[]
  cries?: { latest?: string | null; legacy?: string | null }
  levelUpMoves?: { name: string; level: number }[]
  fullMoves?: { name: string; method: string; level?: number }[]
  is_legendary?: boolean
  is_mythical?: boolean
  is_baby?: boolean
}

export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: '#A8A77A', text: '#111827' },
  fire: { bg: '#EE8130', text: '#111827' },
  water: { bg: '#6390F0', text: '#fff' },
  electric: { bg: '#F7D02C', text: '#111827' },
  grass: { bg: '#7AC74C', text: '#111827' },
  ice: { bg: '#96D9D6', text: '#111827' },
  fighting: { bg: '#C22E28', text: '#fff' },
  poison: { bg: '#A33EA1', text: '#fff' },
  ground: { bg: '#E2BF65', text: '#111827' },
  flying: { bg: '#A98FF3', text: '#111827' },
  psychic: { bg: '#F95587', text: '#fff' },
  bug: { bg: '#A6B91A', text: '#111827' },
  rock: { bg: '#B6A136', text: '#111827' },
  ghost: { bg: '#735797', text: '#fff' },
  dragon: { bg: '#6F35FC', text: '#fff' },
  dark: { bg: '#705746', text: '#fff' },
  steel: { bg: '#B7B7CE', text: '#111827' },
  fairy: { bg: '#D685AD', text: '#111827' },
}

export const ALL_TYPES = Object.keys(TYPE_COLORS)

export const GEN_RANGES: Record<string, [number, number]> = {
  '1': [1, 151],
  '2': [152, 251],
  '3': [252, 386],
  '4': [387, 493],
  '5': [494, 649],
  '6': [650, 721],
  '7': [722, 809],
  '8': [810, 905],
  '9': [906, 1025],
}

export const SORT_OPTIONS = [
  { value: 'id-asc', label: 'ID (Low to High)' },
  { value: 'id-desc', label: 'ID (High to Low)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'hp', label: 'Highest HP' },
  { value: 'bst', label: 'Highest BST' },
] as const

export type SortKey = typeof SORT_OPTIONS[number]['value']

export function getSprite(p: Pokemon, shiny = false): string {
  const o = p.sprites.other?.['official-artwork']
  if (shiny) {
    if (o?.front_shiny) return o.front_shiny
    if (p.sprites.front_shiny) return p.sprites.front_shiny
  }
  if (o?.front_default) return o.front_default
  if (p.sprites.front_default) return p.sprites.front_default
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
}

export function getBst(p: Pokemon): number {
  return p.stats.reduce((s, st) => s + (st.base_stat || 0), 0)
}
