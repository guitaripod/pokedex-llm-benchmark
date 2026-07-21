export const TYPE_COLORS: Record<string, { bg: string; text: string; from: string; to: string; solid: string }> = {
  normal:   { bg: '#A8A77A', text: '#fff', from: '#C6C6A7', to: '#9C9C6B', solid: '#A8A77A' },
  fire:     { bg: '#EE8130', text: '#fff', from: '#F5AC78', to: '#E0662B', solid: '#EE8130' },
  water:    { bg: '#6390F0', text: '#fff', from: '#8CB0F0', to: '#4A6FDB', solid: '#6390F0' },
  electric: { bg: '#F7D02C', text: '#222', from: '#FCE07A', to: '#E6BC0F', solid: '#F7D02C' },
  grass:    { bg: '#7AC74C', text: '#fff', from: '#A0DB7A', to: '#5CA536', solid: '#7AC74C' },
  ice:      { bg: '#96D9D6', text: '#222', from: '#BEEBE9', to: '#6FC6C2', solid: '#96D9D6' },
  fighting: { bg: '#C22E28', text: '#fff', from: '#E05A54', to: '#9E211C', solid: '#C22E28' },
  poison:   { bg: '#A33EA1', text: '#fff', from: '#C56FC3', to: '#822A80', solid: '#A33EA1' },
  ground:   { bg: '#E2BF65', text: '#222', from: '#EFD79A', to: '#CDA53F', solid: '#E2BF65' },
  flying:   { bg: '#A98FF3', text: '#fff', from: '#C6B4F7', to: '#8E6EE8', solid: '#A98FF3' },
  psychic:  { bg: '#F95587', text: '#fff', from: '#FB86AA', to: '#E62E68', solid: '#F95587' },
  bug:      { bg: '#A6B91A', text: '#fff', from: '#C7D63F', to: '#849413', solid: '#A6B91A' },
  rock:     { bg: '#B6A136', text: '#fff', from: '#D0BE5E', to: '#938128', solid: '#B6A136' },
  ghost:    { bg: '#735797', text: '#fff', from: '#9878B8', to: '#584175', solid: '#735797' },
  dragon:   { bg: '#6F35FC', text: '#fff', from: '#9B6BFD', to: '#5410E0', solid: '#6F35FC' },
  dark:     { bg: '#705746', text: '#fff', from: '#977E6C', to: '#54402F', solid: '#705746' },
  steel:    { bg: '#B7B7CE', text: '#222', from: '#D4D4E4', to: '#9494B0', solid: '#B7B7CE' },
  fairy:    { bg: '#D685AD', text: '#fff', from: '#E6ABC9', to: '#C55E8E', solid: '#D685AD' },
  stellar:  { bg: '#40B5A5', text: '#fff', from: '#6FD1C3', to: '#2E8C7F', solid: '#40B5A5' },
  unknown:  { bg: '#68A090', text: '#fff', from: '#8FBDB0', to: '#4E7B6D', solid: '#68A090' },
}

export const GENERATIONS = [
  { id: 1, name: 'Kanto', range: [1, 151], color: '#EE8130' },
  { id: 2, name: 'Johto', range: [152, 251], color: '#F7D02C' },
  { id: 3, name: 'Hoenn', range: [252, 386], color: '#7AC74C' },
  { id: 4, name: 'Sinnoh', range: [387, 493], color: '#6390F0' },
  { id: 5, name: 'Unova', range: [494, 649], color: '#705746' },
  { id: 6, name: 'Kalos', range: [650, 721], color: '#A98FF3' },
  { id: 7, name: 'Alola', range: [722, 809], color: '#F95587' },
  { id: 8, name: 'Galar', range: [810, 905], color: '#A33EA1' },
  { id: 9, name: 'Paldea', range: [906, 1025], color: '#6F35FC' },
]

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

export const STAT_SHORT: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SPA',
  'special-defense': 'SPD',
  speed: 'SPE',
}

export const STAT_COLORS: Record<string, string> = {
  hp: '#FF5959',
  attack: '#F5AC78',
  defense: '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense': '#A7DB8D',
  speed: '#FA92B2',
}

export const NATIONAL_DEX_MAX = 1025

export function genForId(id: number) {
  return GENERATIONS.find((g) => id >= g.range[0] && id <= g.range[1])
}
