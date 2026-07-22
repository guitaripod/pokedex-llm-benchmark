export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

export function formatHeight(dm: number): string {
  const meters = dm / 10;
  const feet = Math.floor(meters / 0.3048);
  const inches = Math.round((meters / 0.3048 - feet) * 12);
  return `${meters.toFixed(1)} m (${feet}'${inches}")`;
}

export function formatWeight(hg: number): string {
  const kg = hg / 10;
  const lbs = (kg * 2.20462).toFixed(1);
  return `${kg.toFixed(1)} kg (${lbs} lbs)`;
}

export function formatStatName(name: string): string {
  const map: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Attack',
    'special-defense': 'Sp. Defense',
    speed: 'Speed',
  };
  return map[name] || name;
}

export function formatGeneration(name: string): string {
  const map: Record<string, string> = {
    'generation-i': 'Generation I',
    'generation-ii': 'Generation II',
    'generation-iii': 'Generation III',
    'generation-iv': 'Generation IV',
    'generation-v': 'Generation V',
    'generation-vi': 'Generation VI',
    'generation-vii': 'Generation VII',
    'generation-viii': 'Generation VIII',
    'generation-ix': 'Generation IX',
  };
  return map[name] || name;
}

export function formatEvolutionTrigger(trigger: string): string {
  const map: Record<string, string> = {
    'level-up': 'Level Up',
    trade: 'Trade',
    'use-item': 'Use Item',
    shed: 'Shed',
    spin: 'Spin',
    'tower-of-darkness': 'Tower of Darkness',
    'tower-of-waters': 'Tower of Waters',
    'three-critical-hits': '3 Critical Hits',
    'take-damage': 'Take Damage',
    'other': 'Special',
    'agile-style-move': 'Agile Style Move',
    'strong-style-move': 'Strong Style Move',
    'recoil-damage': 'Recoil Damage',
  };
  return map[trigger] || trigger;
}

export function formatEggGroup(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
}

export function formatHabitat(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
}

export function sanitizeFlavorText(text: string): string {
  return text
    .replace(/\f/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\u00ad\n/g, '')
    .replace(/\u00ad/g, '')
    .replace(/ -\n/g, ' - ')
    .replace(/-\n/g, '-')
    .replace(/[ \n]/g, ' ')
    .replace(/POKéMON/g, 'Pokémon')
    .trim();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}
