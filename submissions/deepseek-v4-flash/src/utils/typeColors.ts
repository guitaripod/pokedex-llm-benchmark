export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

export const TYPE_GRADIENTS: Record<string, string> = {
  normal: 'from-[#A8A77A] to-[#C6C6A7]',
  fire: 'from-[#EE8130] to-[#F5A060]',
  water: 'from-[#6390F0] to-[#8DB0F5]',
  electric: 'from-[#F7D02C] to-[#FAE078]',
  grass: 'from-[#7AC74C] to-[#A7DB8D]',
  ice: 'from-[#96D9D6] to-[#BCE6E3]',
  fighting: 'from-[#C22E28] to-[#D56756]',
  poison: 'from-[#A33EA1] to-[#C183C1]',
  ground: 'from-[#E2BF65] to-[#EBD69D]',
  flying: 'from-[#A98FF3] to-[#C6B7F7]',
  psychic: 'from-[#F95587] to-[#FB88A8]',
  bug: 'from-[#A6B91A] to-[#C6D36E]',
  rock: 'from-[#B6A136] to-[#D1C17D]',
  ghost: 'from-[#735797] to-[#9B7FBA]',
  dragon: 'from-[#6F35FC] to-[#9B6FFC]',
  dark: 'from-[#705746] to-[#9B8271]',
  steel: 'from-[#B7B7CE] to-[#D1D1E0]',
  fairy: 'from-[#D685AD] to-[#E4A9C7]',
};

export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || '#999999';
}

export function getTypeGradient(type: string): string {
  return TYPE_GRADIENTS[type] || 'from-gray-400 to-gray-500';
}
