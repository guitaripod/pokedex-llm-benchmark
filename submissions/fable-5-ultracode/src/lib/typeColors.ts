export const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a77a',
  fighting: '#c22e28',
  flying: '#a98ff3',
  poison: '#a33ea1',
  ground: '#e2bf65',
  rock: '#b6a136',
  bug: '#a6b91a',
  ghost: '#735797',
  steel: '#b7b7ce',
  fire: '#ee8130',
  water: '#6390f0',
  grass: '#7ac74c',
  electric: '#f7d02c',
  psychic: '#f95587',
  ice: '#96d9d6',
  dragon: '#6f35fc',
  dark: '#705746',
  fairy: '#d685ad'
}

const DARK_INK_TYPES = new Set([
  'normal', 'flying', 'ground', 'rock', 'bug', 'steel', 'grass', 'electric', 'ice', 'fairy'
])

export const typeColor = (type: string) => TYPE_COLORS[type] ?? '#8a929e'

export const typeInk = (type: string) => (DARK_INK_TYPES.has(type) ? '#10141a' : '#ffffff')

export const DMG_CLASS_COLORS: Record<string, string> = {
  physical: '#c92112',
  special: '#4f5edc',
  status: '#8c888c'
}
