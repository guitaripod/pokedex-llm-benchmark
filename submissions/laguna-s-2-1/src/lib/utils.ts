import type { Pokemon, PokemonSpecies, SimplifiedPokemon, SimplifiedMove, SimplifiedItem, SimplifiedAbility } from '../types';
import { STAT_LABELS, TYPE_ORDER, GENERATION_NAMES } from '../types';

export function formatId(id: number): string {
  return `#${id.toString().padStart(4, '0')}`;
}

export function formatName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatMoveName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatItemName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatAbilityName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatTypeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatStatName(stat: string): string {
  return STAT_LABELS[stat] || stat;
}

export function formatHeight(height: number): string {
  const meters = height / 10;
  const feet = Math.floor(meters * 3.28084);
  const inches = Math.round((meters * 3.28084 - feet) * 12);
  return `${meters.toFixed(1)} m (${feet}'${inches}")`;
}

export function formatWeight(weight: number): string {
  const kg = weight / 10;
  const lbs = (kg * 2.20462).toFixed(1);
  return `${kg.toFixed(1)} kg (${lbs} lbs)`;
}

export function calculateBST(stats: { base_stat: number }[]): number {
  return stats.reduce((sum, stat) => sum + stat.base_stat, 0);
}

export function getStatColor(stat: number): string {
  if (stat >= 130) return 'text-green-500';
  if (stat >= 100) return 'text-blue-500';
  if (stat >= 70) return 'text-yellow-500';
  if (stat >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getStatBarColor(stat: number): string {
  if (stat >= 130) return 'bg-green-500';
  if (stat >= 100) return 'bg-blue-500';
  if (stat >= 70) return 'bg-yellow-500';
  if (stat >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getStatBarWidth(stat: number): string {
  const maxStat = 255;
  return `${Math.min((stat / maxStat) * 100, 100)}%`;
}

export function getTypeEffectiveness(type: string): { [key: string]: number } {
  const effectiveness: { [key: string]: number } = {};
  TYPE_ORDER.forEach((t) => {
    effectiveness[t] = 1;
  });
  return effectiveness;
}

export function calculateTypeEffectiveness(
  attackerTypes: string[],
  defenderTypes: string[],
  typeData: { [key: string]: any }
): number {
  let multiplier = 1;

  for (const attacker of attackerTypes) {
    for (const defender of defenderTypes) {
      const typeInfo = typeData[attacker];
      if (!typeInfo) continue;

      const relations = typeInfo.damage_relations;
      if (relations.double_damage_to.some((t: any) => t.name === defender)) multiplier *= 2;
      if (relations.half_damage_to.some((t: any) => t.name === defender)) multiplier *= 0.5;
      if (relations.no_damage_to.some((t: any) => t.name === defender)) multiplier *= 0;
    }
  }

  return multiplier;
}

export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier === 0) return 'No Effect';
  if (multiplier === 0.25) return 'Not Very Effective (¼)';
  if (multiplier === 0.5) return 'Not Very Effective (½)';
  if (multiplier === 1) return 'Normal';
  if (multiplier === 2) return 'Super Effective (2×)';
  if (multiplier === 4) return 'Super Effective (4×)';
  return `${multiplier}×`;
}

export function getEffectivenessColor(multiplier: number): string {
  if (multiplier === 0) return 'bg-gray-400';
  if (multiplier <= 0.5) return 'bg-blue-400 text-blue-900';
  if (multiplier === 1) return 'bg-gray-500 text-gray-900';
  if (multiplier >= 2) return 'bg-red-500 text-red-100';
  return 'bg-yellow-400 text-yellow-900';
}

export function getGenerationFromName(name: string): string {
  const genMap: { [key: string]: string } = {
    'red': 'generation-i', 'blue': 'generation-i', 'yellow': 'generation-i',
    'green': 'generation-i', 'red-japan': 'generation-i', 'blue-japan': 'generation-i',
    'gold': 'generation-ii', 'silver': 'generation-ii', 'crystal': 'generation-ii',
    'ruby': 'generation-iii', 'sapphire': 'generation-iii', 'emerald': 'generation-iii',
    'firered': 'generation-iii', 'leafgreen': 'generation-iii',
    'diamond': 'generation-iv', 'pearl': 'generation-iv', 'platinum': 'generation-iv',
    'heartgold': 'generation-iv', 'soulsilver': 'generation-iv',
    'black': 'generation-v', 'white': 'generation-v', 'black-2': 'generation-v', 'white-2': 'generation-v',
    'x': 'generation-vi', 'y': 'generation-vi', 'omega-ruby': 'generation-vi', 'alpha-sapphire': 'generation-vi',
    'sun': 'generation-vii', 'moon': 'generation-vii', 'ultra-sun': 'generation-vii', 'ultra-moon': 'generation-vii',
    'lets-go-pikachu': 'generation-vii', 'lets-go-eevee': 'generation-vii',
    'sword': 'generation-viii', 'shield': 'generation-viii',
    'brilliant-diamond': 'generation-viii', 'shining-pearl': 'generation-viii',
    'legends-arceus': 'generation-viii',
    'scarlet': 'generation-ix', 'violet': 'generation-ix',
    'the-isle-of-armor-sword': 'generation-viii', 'the-isle-of-armor-shield': 'generation-viii',
    'the-crown-tundra-sword': 'generation-viii', 'the-crown-tundra-shield': 'generation-viii',
    'champions': 'generation-ix',
  };
  return genMap[name] || 'generation-i';
}

export function getVersionGroupFromVersion(version: string): string {
  const vgMap: { [key: string]: string } = {
    'red': 'red-blue', 'blue': 'red-blue', 'yellow': 'yellow',
    'gold': 'gold-silver', 'silver': 'gold-silver', 'crystal': 'crystal',
    'ruby': 'ruby-sapphire', 'sapphire': 'ruby-sapphire', 'emerald': 'emerald',
    'firered': 'firered-leafgreen', 'leafgreen': 'firered-leafgreen',
    'diamond': 'diamond-pearl', 'pearl': 'diamond-pearl', 'platinum': 'platinum',
    'heartgold': 'heartgold-soulsilver', 'soulsilver': 'heartgold-soulsilver',
    'black': 'black-white', 'white': 'black-white',
    'black-2': 'black-2-white-2', 'white-2': 'black-2-white-2',
    'x': 'x-y', 'y': 'x-y',
    'omega-ruby': 'omega-ruby-alpha-sapphire', 'alpha-sapphire': 'omega-ruby-alpha-sapphire',
    'sun': 'sun-moon', 'moon': 'sun-moon',
    'ultra-sun': 'ultra-sun-ultra-moon', 'ultra-moon': 'ultra-sun-ultra-moon',
    'lets-go-pikachu': 'lets-go-pikachu-lets-go-eevee', 'lets-go-eevee': 'lets-go-pikachu-lets-go-eevee',
    'sword': 'sword-shield', 'shield': 'sword-shield',
    'brilliant-diamond': 'brilliant-diamond-shining-pearl', 'shining-pearl': 'brilliant-diamond-shining-pearl',
    'legends-arceus': 'legends-arceus',
    'scarlet': 'scarlet-violet', 'violet': 'scarlet-violet',
    'champions': 'champions',
  };
  return vgMap[version] || 'red-blue';
}

export function getGenerationLabel(gen: string): string {
  return GENERATION_NAMES[gen] || gen;
}

export function getGenerationId(gen: string): number {
  const genMap: { [key: string]: number } = {
    'generation-i': 1, 'generation-ii': 2, 'generation-iii': 3,
    'generation-iv': 4, 'generation-v': 5, 'generation-vi': 6,
    'generation-vii': 7, 'generation-viii': 8, 'generation-ix': 9,
  };
  return genMap[gen] || 1;
}

export function getGenerationRange(gen: string): { start: number; end: number } {
  const ranges: { [key: string]: { start: number; end: number } } = {
    'generation-i': { start: 1, end: 151 },
    'generation-ii': { start: 152, end: 251 },
    'generation-iii': { start: 252, end: 386 },
    'generation-iv': { start: 387, end: 493 },
    'generation-v': { start: 494, end: 649 },
    'generation-vi': { start: 650, end: 721 },
    'generation-vii': { start: 722, end: 809 },
    'generation-viii': { start: 810, end: 905 },
    'generation-ix': { start: 906, end: 1025 },
  };
  return ranges[gen] || { start: 1, end: 151 };
}

export function getGenerationFromId(id: number): string {
  for (const [gen, range] of Object.entries(getGenerationRange as any)) {
    if (id >= range.start && id <= range.end) return gen;
  }
  if (id <= 151) return 'generation-i';
  if (id <= 251) return 'generation-ii';
  if (id <= 386) return 'generation-iii';
  if (id <= 493) return 'generation-iv';
  if (id <= 649) return 'generation-v';
  if (id <= 721) return 'generation-vi';
  if (id <= 809) return 'generation-vii';
  if (id <= 905) return 'generation-viii';
  return 'generation-ix';
}

export function getRarity(pokemon: Pokemon, species: PokemonSpecies): string {
  if (species.is_mythical) return 'mythical';
  if (species.is_legendary) return 'legendary';
  if (species.is_baby) return 'baby';
  return 'common';
}

export function getRarityLabel(rarity: string): string {
  const labels: { [key: string]: string } = {
    common: 'Common',
    rare: 'Rare',
    ultra: 'Ultra Rare',
    legendary: 'Legendary',
    mythical: 'Mythical',
    baby: 'Baby',
    sub: 'Sub',
  };
  return labels[rarity] || rarity;
}

export function getRarityColor(rarity: string): string {
  const colors: { [key: string]: string } = {
    common: 'bg-gray-400',
    rare: 'bg-blue-400',
    ultra: 'bg-purple-400',
    legendary: 'bg-red-500',
    mythical: 'bg-orange-500',
    baby: 'bg-pink-400',
    sub: 'bg-yellow-400',
  };
  return colors[rarity] || 'bg-gray-400';
}

export function getGenderRatio(genderRate: number): { male: number; female: number; genderless: boolean } {
  if (genderRate === -1) return { male: 0, female: 0, genderless: true };
  const female = (genderRate / 8) * 100;
  const male = 100 - female;
  return { male, female, genderless: false };
}

export function getGenderSymbol(ratio: { male: number; female: number; genderless: boolean }): string {
  if (ratio.genderless) return '⚲';
  if (ratio.male === 100) return '♂';
  if (ratio.female === 100) return '♀';
  return `♂ ${ratio.male.toFixed(0)}% / ♀ ${ratio.female.toFixed(0)}%`;
}

export function getEggSteps(hatchCounter: number): number {
  return (255 * (1 + hatchCounter)) / 1;
}

export function getEggStepsLabel(hatchCounter: number): string {
  const steps = getEggSteps(hatchCounter);
  return `${steps} steps`;
}

export function getCatchRateLabel(rate: number): string {
  if (rate >= 190) return 'Very Easy';
  if (rate >= 127) return 'Easy';
  if (rate >= 64) return 'Medium';
  if (rate >= 31) return 'Hard';
  return 'Very Hard';
}

export function getCatchRateColor(rate: number): string {
  if (rate >= 190) return 'text-green-500';
  if (rate >= 127) return 'text-blue-500';
  if (rate >= 64) return 'text-yellow-500';
  if (rate >= 31) return 'text-orange-500';
  return 'text-red-500';
}

export function getBaseHappinessLabel(happiness: number): string {
  if (happiness >= 140) return 'High';
  if (happiness >= 70) return 'Medium';
  if (happiness >= 35) return 'Low';
  return 'Very Low';
}

export function getGrowthRateLabel(rate: string): string {
  const labels: { [key: string]: string } = {
    'fast': 'Fast',
    'medium': 'Medium',
    'medium-slow': 'Medium Slow',
    'slow': 'Slow',
    'fluctuating': 'Fluctuating',
    'erratic': 'Erratic',
  };
  return labels[rate] || rate;
}

export function getGrowthRateFormula(rate: string): string {
  const formulas: { [key: string]: string } = {
    'fast': '6/5 × n³',
    'medium': 'n³',
    'medium-slow': 'n³ - 10n² + 50n - 20',
    'slow': '5/4 × n³',
    'fluctuating': 'n³ × (1 + (n/75)) × (1 + (n/25000))',
    'erratic': 'n³ × (1 + (n/250)) × (1 + (n/25000))',
  };
  return formulas[rate] || rate;
}

export function getNatureStatChange(nature: any, stat: string): number {
  if (!nature) return 1;
  if (nature.increased_stat?.name === stat) return 1.1;
  if (nature.decreased_stat?.name === stat) return 0.9;
  return 1;
}

export function getNatureLabel(nature: any): string {
  if (!nature) return 'Hardy';
  const name = nature.name || 'Hardy';
  return name
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getNatureFlavor(nature: any): string {
  if (!nature) return '';
  const likes = nature.likes_flavor?.name;
  const hates = nature.hates_flavor?.name;
  if (likes && hates) return `Likes ${formatName(likes)}, hates ${formatName(hates)}`;
  return '';
}

export function getMoveCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    'physical': 'Physical',
    'special': 'Special',
    'status': 'Status',
  };
  return labels[category] || category;
}

export function getMoveCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'physical': 'bg-orange-500',
    'special': 'bg-blue-500',
    'status': 'bg-gray-500',
  };
  return colors[category] || 'bg-gray-500';
}

export function getMovePowerLabel(power: number | null): string {
  if (power === null) return '—';
  return power.toString();
}

export function getMoveAccuracyLabel(accuracy: number | null): string {
  if (accuracy === null) return '—';
  return `${accuracy}%`;
}

export function getMovePPLabel(pp: number | null): string {
  if (pp === null) return '—';
  return pp.toString();
}

export function getMovePriorityLabel(priority: number): string {
  if (priority === 0) return '0';
  return priority > 0 ? `+${priority}` : priority.toString();
}

export function getMovePriorityColor(priority: number): string {
  if (priority > 0) return 'text-green-500';
  if (priority < 0) return 'text-red-500';
  return 'text-gray-500';
}

export function getMoveLearnMethodLabel(method: string): string {
  const labels: { [key: string]: string } = {
    'level-up': 'Level Up',
    'machine': 'TM/HM',
    'egg': 'Egg Move',
    'tutor': 'Tutor',
    'type-up': 'Type Up',
    'light-purchase': 'Light Purchase',
    'train': 'Train',
    'special': 'Special',
  };
  return labels[method] || method;
}

export function getMoveLearnMethodColor(method: string): string {
  const colors: { [key: string]: string } = {
    'level-up': 'bg-blue-500',
    'machine': 'bg-purple-500',
    'egg': 'bg-green-500',
    'tutor': 'bg-orange-500',
    'type-up': 'bg-pink-500',
    'light-purchase': 'bg-yellow-500',
    'train': 'bg-gray-500',
    'special': 'bg-red-500',
  };
  return colors[method] || 'bg-gray-500';
}

export function getEncounterMethodLabel(method: string): string {
  const labels: { [key: string]: string } = {
    'walk': 'Walk',
    'old-rod': 'Old Rod',
    'good-rod': 'Good Rod',
    'super-rod': 'Super Rod',
    'surf': 'Surf',
    'scent': 'Scent',
    'headbutt': 'Headbutt',
    'rock-smash': 'Rock Smash',
    'dig': 'Dig',
    'item': 'Item',
    'trap': 'Trap',
    'gift': 'Gift',
    'fossil': 'Fossil',
    'safari': 'Safari',
    'starters': 'Starters',
    'static': 'Static',
    'radar': 'PokéRadar',
    'honey-tree': 'Honey Tree',
    'swarm': 'Swarm',
    'raid': 'Raid',
    'overworld': 'Overworld',
    'overworld-special': 'Overworld (Special)',
    'island-scan': 'Island Scan',
    'fortune-teller': 'Fortune Teller',
    'event': 'Event',
    'fateful': 'Fateful',
  };
  return labels[method] || method;
}

export function getEncounterMethodColor(method: string): string {
  const colors: { [key: string]: string } = {
    'walk': 'bg-green-500',
    'old-rod': 'bg-blue-500',
    'good-rod': 'bg-cyan-500',
    'super-rod': 'bg-teal-500',
    'surf': 'bg-sky-500',
    'scent': 'bg-purple-500',
    'headbutt': 'bg-amber-500',
    'rock-smash': 'bg-stone-500',
    'dig': 'bg-brown-500',
    'item': 'bg-yellow-500',
    'trap': 'bg-red-500',
    'gift': 'bg-pink-500',
    'fossil': 'bg-gray-500',
    'safari': 'bg-lime-500',
    'starters': 'bg-emerald-500',
    'static': 'bg-violet-500',
    'radar': 'bg-indigo-500',
    'honey-tree': 'bg-orange-500',
    'swarm': 'bg-rose-500',
    'raid': 'bg-fuchsia-500',
    'overworld': 'bg-aqua-500',
    'overworld-special': 'bg-cyan-400',
    'island-scan': 'bg-blue-400',
    'fortune-teller': 'bg-purple-400',
    'event': 'bg-gold-500',
    'fateful': 'bg-red-400',
  };
  return colors[method] || 'bg-gray-500';
}

export function getVersionGroupLabel(vg: string): string {
  const labels: { [key: string]: string } = {
    'red-blue': 'Red/Blue',
    'yellow': 'Yellow',
    'gold-silver': 'Gold/Silver',
    'crystal': 'Crystal',
    'ruby-sapphire': 'Ruby/Sapphire',
    'emerald': 'Emerald',
    'firered-leafgreen': 'FireRed/LeafGreen',
    'diamond-pearl': 'Diamond/Pearl',
    'platinum': 'Platinum',
    'heartgold-soulsilver': 'HeartGold/SoulSilver',
    'black-white': 'Black/White',
    'black-2-white-2': 'Black 2/White 2',
    'x-y': 'X/Y',
    'omega-ruby-alpha-sapphire': 'Omega Ruby/Alpha Sapphire',
    'sun-moon': 'Sun/Moon',
    'ultra-sun-ultra-moon': 'Ultra Sun/Ultra Moon',
    'lets-go-pikachu-lets-go-eevee': 'Let\'s Go Pikachu/Eevee',
    'sword-shield': 'Sword/Shield',
    'brilliant-diamond-shining-pearl': 'Brilliant Diamond/Shining Pearl',
    'legends-arceus': 'Legends: Arceus',
    'scarlet-violet': 'Scarlet/Violet',
    'champions': 'Champions',
  };
  return labels[vg] || vg;
}

export function getVersionLabel(version: string): string {
  const labels: { [key: string]: string } = {
    'red': 'Red', 'blue': 'Blue', 'yellow': 'Yellow',
    'green': 'Green', 'red-japan': 'Red (Japan)', 'blue-japan': 'Blue (Japan)',
    'gold': 'Gold', 'silver': 'Silver', 'crystal': 'Crystal',
    'ruby': 'Ruby', 'sapphire': 'Sapphire', 'emerald': 'Emerald',
    'firered': 'FireRed', 'leafgreen': 'LeafGreen',
    'diamond': 'Diamond', 'pearl': 'Pearl', 'platinum': 'Platinum',
    'heartgold': 'HeartGold', 'soulsilver': 'SoulSilver',
    'black': 'Black', 'white': 'White',
    'black-2': 'Black 2', 'white-2': 'White 2',
    'x': 'X', 'y': 'Y',
    'omega-ruby': 'Omega Ruby', 'alpha-sapphire': 'Alpha Sapphire',
    'sun': 'Sun', 'moon': 'Moon',
    'ultra-sun': 'Ultra Sun', 'ultra-moon': 'Ultra Moon',
    'lets-go-pikachu': 'Let\'s Go Pikachu', 'lets-go-eevee': 'Let\'s Go Eevee',
    'sword': 'Sword', 'shield': 'Shield',
    'brilliant-diamond': 'Brilliant Diamond', 'shining-pearl': 'Shining Pearl',
    'legends-arceus': 'Legends: Arceus',
    'scarlet': 'Scarlet', 'violet': 'Violet',
    'champions': 'Champions',
    'the-isle-of-armor-sword': 'Isle of Armor (Sword)',
    'the-isle-of-armor-shield': 'Isle of Armor (Shield)',
    'the-crown-tundra-sword': 'Crown Tundra (Sword)',
    'the-crown-tundra-shield': 'Crown Tundra (Shield)',
  };
  return labels[version] || version;
}

export function getEggGroupLabel(group: string): string {
  const labels: { [key: string]: string } = {
    'monster': 'Monster',
    'water1': 'Water 1',
    'water2': 'Water 2',
    'water3': 'Water 3',
    'fairy': 'Fairy',
    'ground': 'Ground',
    'bug': 'Bug',
    'flying': 'Flying',
    'field': 'Field',
    'grass': 'Grass',
    'humanshape': 'Human Shape',
    'mineral': 'Mineral',
    'indeterminate': 'Indeterminate',
    'ditto': 'Ditto',
    'genderless': 'Genderless',
    'no-eggs': 'No Eggs',
  };
  return labels[group] || group;
}

export function getShapeLabel(shape: string): string {
  const labels: { [key: string]: string } = {
    'ball': 'Ball',
    'snake': 'Snake',
    'naginata': 'Naginata',
    'arms': 'Arms',
    'tail': 'Tail',
    'head': 'Head',
    'body': 'Body',
    'wings': 'Wings',
    'tentacles': 'Tentacles',
    'sensors': 'Sensors',
    'tentacool': 'Tentacool',
    'reptile': 'Reptile',
    'fish': 'Fish',
    'humanoid': 'Humanoid',
  };
  return labels[shape] || shape;
}

export function getHabitatLabel(habitat: string): string {
  const labels: { [key: string]: string } = {
    'cave': 'Cave',
    'forest': 'Forest',
    'grass': 'Grass',
    'mountain': 'Mountain',
    'rare': 'Rare',
    'rough-terrain': 'Rough Terrain',
    'sea': 'Sea',
    'urban': 'Urban',
    'waters-edge': 'Waters Edge',
  };
  return labels[habitat] || habitat;
}

export function getColorLabel(color: string): string {
  const labels: { [key: string]: string } = {
    'black': 'Black',
    'blue': 'Blue',
    'brown': 'Brown',
    'gray': 'Gray',
    'green': 'Green',
    'pink': 'Pink',
    'purple': 'Purple',
    'red': 'Red',
    'white': 'White',
    'yellow': 'Yellow',
  };
  return labels[color] || color;
}

export function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    'bitter': 'Bitter',
    'bottle-caps': 'Bottle Caps',
    'candy': 'Candy',
    'charcoal': 'Charcoal',
    'clothing': 'Clothing',
    'cologne': 'Cologne',
    'medicine': 'Medicine',
    'mulch': 'Mulch',
    'nerve': 'Nerve',
    'parcel': 'Parcel',
    'pecha': 'Pecha',
    'pok-ball': 'Poké Ball',
    'powder': 'Powder',
    'protector': 'Protector',
    'revival': 'Revival',
    'sour': 'Sour',
    'sweet': 'Sweet',
    'tableware': 'Tableware',
    'tiny-mushroom': 'Tiny Mushroom',
    'vitamin': 'Vitamin',
    'x-item': 'X Item',
  };
  return labels[category] || category;
}

export function getStatName(stat: string): string {
  return STAT_LABELS[stat] || stat;
}

export function getStatShortName(stat: string): string {
  const short: { [key: string]: string } = {
    'hp': 'HP',
    'attack': 'Atk',
    'defense': 'Def',
    'special-attack': 'SpA',
    'special-defense': 'SpD',
    'speed': 'Spe',
  };
  return short[stat] || stat;
}

export function getNatureImpact(nature: any): { increased: string | null; decreased: string | null } {
  return {
    increased: nature?.increased_stat?.name || null,
    decreased: nature?.decreased_stat?.name || null,
  };
}

export function getNatureImpactLabel(nature: any): string {
  const inc = nature?.increased_stat?.name;
  const dec = nature?.decreased_stat?.name;
  if (!inc && !dec) return 'No effect';
  if (inc && !dec) return `+${getStatShortName(inc)}`;
  if (!inc && dec) return `-${getStatShortName(dec)}`;
  return `+${getStatShortName(inc!)} / -${getStatShortName(dec!)}`;
}

export function getFlavorText(text: string): string {
  return text
    .replace(/\n/g, ' ')
    .replace(/\f/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getEffectText(text: string): string {
  return text
    .replace(/\n/g, ' ')
    .replace(/\f/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getShortEffectText(text: string): string {
  return text
    .replace(/\n/g, ' ')
    .replace(/\f/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getLanguageFlag(lang: string): string {
  const flags: { [key: string]: string } = {
    'en': '🇬🇧',
    'ja': '🇯🇵',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'es': '🇪🇸',
    'it': '🇮🇹',
    'ko': '🇰🇷',
    'zh-hans': '🇨🇳',
    'zh-hant': '🇹🇼',
    'ja-hrkt': '🇯🇵',
    'es-419': '🇲🇽',
  };
  return flags[lang] || '🌐';
}

export function getLanguageLabel(lang: string): string {
  const labels: { [key: string]: string } = {
    'en': 'English',
    'ja': '日本語',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'it': 'Italiano',
    'ko': '한국어',
    'zh-hans': '简体中文',
    'zh-hant': '繁體中文',
    'ja-hrkt': '日本語(ひらがな)',
    'es-419': 'Español (Latinoamérica)',
  };
  return labels[lang] || lang;
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function sortBy<T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupBy<T>(arr: T[], key: keyof T): { [key: string]: T[] } {
  return arr.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {} as { [key: string]: T[] });
}

export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const k = String(item[key]);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelCaseToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function deslugify(str: string): string {
  return str.replace(/-/g, ' ');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercentage(num: number): string {
  return `${Math.round(num)}%`;
}

export function formatDecimal(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function prefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error('Clipboard not available'));
}

export function downloadJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readJSONFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target!.result as string));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function getUrlParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

export function setUrlParam(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState({}, '', url);
}

export function removeUrlParam(name: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete(name);
  window.history.replaceState({}, '', url);
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof localStorage === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function removeLocalStorage(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function clearLocalStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.clear();
  } catch {}
}

export function getSessionStorage<T>(key: string, defaultValue: T): T {
  if (typeof sessionStorage === 'undefined') return defaultValue;
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setSessionStorage<T>(key: string, value: T): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function removeSessionStorage(key: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function clearSessionStorage(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.clear();
  } catch {}
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days: number = 30): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatSpeed(kmh: number): string {
  return `${kmh} km/h`;
}

export function formatTemperature(celsius: number): string {
  return `${celsius}°C`;
}

export function formatPressure(hpa: number): string {
  return `${hpa} hPa`;
}

export function formatHumidity(percent: number): string {
  return `${percent}%`;
}

export function formatWindSpeed(ms: number): string {
  return `${ms} m/s`;
}

export function formatVisibility(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatVolume(liters: number): string {
  return `${liters} L`;
}

export function formatAge(years: number): string {
  return `${years} years`;
}

export function formatCount(count: number): string {
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

export function formatRatio(ratio: number): string {
  return `1:${ratio.toFixed(1)}`;
}

export function formatOdds(odds: number): string {
  return `1 in ${Math.round(1 / odds)}`;
}

export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatScore(score: number): string {
  return score.toString().padStart(5, '0');
}

export function formatLevel(level: number): string {
  return `Lv. ${level}`;
}

export function formatHP(current: number, max: number): string {
  return `${current}/${max}`;
}

export function formatPP(current: number, max: number): string {
  return `${current}/${max}`;
}

export function formatExp(current: number, next: number): string {
  return `${current.toLocaleString()} / ${next.toLocaleString()}`;
}

export function formatExpPercent(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(1)}%`;
}

export function formatExpBar(current: number, next: number): string {
  const percent = Math.min((current / next) * 100, 100);
  return `${percent.toFixed(1)}%`;
}

export function formatExpBarWidth(current: number, next: number): string {
  const percent = Math.min((current / next) * 100, 100);
  return `${percent}%`;
}

export function formatExpBarColor(current: number, next: number): string {
  const percent = Math.min((current / next) * 100, 100);
  if (percent < 25) return 'bg-red-500';
  if (percent < 50) return 'bg-orange-500';
  if (percent < 75) return 'bg-yellow-500';
  if (percent < 100) return 'bg-green-400';
  return 'bg-green-500';
}

export function formatExpBarTextColor(current: number, next: number): string {
  const percent = Math.min((current / next) * 100, 100);
  if (percent < 25) return 'text-red-500';
  if (percent < 50) return 'text-orange-500';
  if (percent < 75) return 'text-yellow-500';
  if (percent < 100) return 'text-green-400';
  return 'text-green-500';
}

export function formatExpBarText(current: number, next: number): string {
  return `${current.toLocaleString()} / ${next.toLocaleString()}`;
}

export function formatExpBarTextShort(current: number, next: number): string {
  return `${(current / 1000).toFixed(1)}k / ${(next / 1000).toFixed(1)}k`;
}

export function formatExpBarTextPercent(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(0)}%`;
}

export function formatExpBarTextPercentShort(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(0)}%`;
}

export function formatExpBarTextPercentLong(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(1)}%`;
}

export function formatExpBarTextPercentLongShort(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(1)}%`;
}

export function formatExpBarTextPercentLongShortShort(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(0)}%`;
}

export function formatExpBarTextPercentLongShortShortShort(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(0)}%`;
}

export function formatExpBarTextPercentLongShortShortShortShort(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(0)}%`;
}

export function formatExpBarTextPercentLongShortShortShortShortShort(current: number, next: number): string {
  return `${((current / next) * 100).toFixed(0)}%`;
}
