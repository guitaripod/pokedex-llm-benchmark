import type { Pokemon, PokemonSpecies, SimplifiedPokemon, SimplifiedMove, SimplifiedItem, SimplifiedAbility } from '../types';
import { calculateBST, getGenerationFromId, getGenerationFromName, getRarity, getGenerationRange } from './utils';

export function simplifyPokemon(pokemon: Pokemon, species: PokemonSpecies): SimplifiedPokemon {
  const types = pokemon.types.map((t) => t.type.name);
  const officialArtwork = pokemon.sprites.other?.['official-artwork']?.front_default || null;
  const sprite = pokemon.sprites.front_default || null;
  const shinySprite = pokemon.sprites.front_shiny || null;
  const bst = calculateBST(pokemon.stats);
  const generation = getGenerationFromName(species.generation.name);
  const rarity = getRarity(pokemon, species);
  const color = species.color?.name || null;
  const shape = species.shape?.name || null;
  const habitat = species.habitat?.name || null;
  const eggGroups = species.egg_groups.map((g) => g.name);
  const abilities = pokemon.abilities.map((a) => a.ability.name);

  return {
    id: pokemon.id,
    name: pokemon.name,
    types,
    sprite,
    shiny_sprite: shinySprite,
    official_artwork: officialArtwork,
    base_stat_total: bst,
    generation,
    is_legendary: species.is_legendary,
    is_mythical: species.is_mythical,
    is_baby: species.is_baby,
    color,
    shape,
    habitat,
    egg_groups: eggGroups,
    abilities,
  };
}

export function simplifyMove(move: any): SimplifiedMove {
  return {
    id: move.id,
    name: move.name,
    type: move.type?.name || 'normal',
    damage_class: move.damage_class?.name || 'status',
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    priority: move.priority || 0,
    generation: move.generation?.name || 'generation-i',
    learned_by_count: move.learned_by_pokemon?.length || 0,
  };
}

export function simplifyItem(item: any): SimplifiedItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category?.name || 'unknown',
    cost: item.cost || 0,
    sprite: item.sprites?.default || null,
    held_by_count: item.held_by_pokemon?.length || 0,
  };
}

export function simplifyAbility(ability: any): SimplifiedAbility {
  const shortEffect = ability.effect_entries?.find((e: any) => e.language.name === 'en')?.short_effect || '';
  return {
    id: ability.id,
    name: ability.name,
    generation: ability.generation?.name || 'generation-i',
    pokemon_count: ability.pokemon?.length || 0,
    short_effect: shortEffect,
  };
}

export function buildPokemonList(pokemon: Pokemon[], speciesList: PokemonSpecies[]): SimplifiedPokemon[] {
  const speciesMap = new Map(speciesList.map((s) => [s.name, s]));
  return pokemon
    .map((p) => {
      const species = speciesMap.get(p.name);
      if (!species) return null;
      return simplifyPokemon(p, species);
    })
    .filter((p): p is SimplifiedPokemon => p !== null);
}

export function buildTypeList(types: any[]): any[] {
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    names: t.names,
    damage_relations: t.damage_relations,
    pokemon_count: t.pokemon?.length || 0,
    moves_count: t.moves?.length || 0,
  }));
}

export function buildMoveList(moves: any[]): SimplifiedMove[] {
  return moves.map(simplifyMove);
}

export function buildItemList(items: any[]): SimplifiedItem[] {
  return items.map(simplifyItem);
}

export function buildAbilityList(abilities: any[]): SimplifiedAbility[] {
  return abilities.map(simplifyAbility);
}

export function buildEvolutionChain(chain: any, speciesMap: Map<string, PokemonSpecies>): any {
  const buildNode = (node: any): any => {
    const speciesName = node.species?.name;
    const species = speciesMap.get(speciesName);
    return {
      species: speciesName,
      is_baby: node.is_baby,
      evolution_details: node.evolution_details,
      evolves_to: node.evolves_to.map(buildNode),
      pokemon_id: species ? parseInt(species.id.toString()) : null,
      sprite: species ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.id}.png` : null,
    };
  };
  return buildNode(chain.chain);
}

export function buildTypeEffectivenessMatrix(types: any[]): { [key: string]: { [key: string]: number } } {
  const matrix: { [key: string]: { [key: string]: number } } = {};

  for (const attacker of types) {
    matrix[attacker.name] = {};
    for (const defender of types) {
      let multiplier = 1;
      const relations = attacker.damage_relations;

      if (relations.double_damage_to.some((t: any) => t.name === defender.name)) multiplier *= 2;
      if (relations.half_damage_to.some((t: any) => t.name === defender.name)) multiplier *= 0.5;
      if (relations.no_damage_to.some((t: any) => t.name === defender.name)) multiplier *= 0;

      matrix[attacker.name][defender.name] = multiplier;
    }
  }

  return matrix;
}

export function buildEncounterData(pokemonId: number, encounters: any[]): any[] {
  return encounters.map((enc) => ({
    location: enc.location_area.name,
    version_details: enc.version_details.map((vd: any) => ({
      version: vd.version.name,
      max_chance: vd.max_chance,
      encounter_details: vd.encounter_details.map((ed: any) => ({
        method: ed.method.name,
        min_level: ed.min_level,
        max_level: ed.max_level,
        chance: ed.chance,
        condition_values: ed.condition_values.map((cv: any) => cv.name),
      })),
    })),
  }));
}

export function buildMovePool(pokemon: Pokemon): any {
  const movePool: { [key: string]: { [key: string]: { move: string; level: number; method: string }[] } } = {};

  for (const move of pokemon.moves) {
    for (const vg of move.version_group_details) {
      const vgName = vg.version_group.name;
      if (!movePool[vgName]) movePool[vgName] = {};

      const method = vg.move_learn_method.name;
      if (!movePool[vgName][method]) movePool[vgName][method] = [];

      movePool[vgName][method].push({
        move: move.move.name,
        level: vg.level_learned_at || 0,
        method,
      });
    }
  }

  return movePool;
}

export function buildStatBlock(pokemon: Pokemon): any {
  const stats = pokemon.stats.reduce((acc: any, stat) => {
    acc[stat.stat.name] = stat.base_stat;
    acc[`${stat.stat.name}_effort`] = stat.effort;
    return acc;
  }, {});

  stats.base_stat_total = calculateBST(pokemon.stats);
  return stats;
}

export function buildTypeBlock(pokemon: Pokemon): string[] {
  return pokemon.types
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name);
}

export function buildAbilityBlock(pokemon: Pokemon): any[] {
  return pokemon.abilities.map((a) => ({
    name: a.ability.name,
    is_hidden: a.is_hidden,
    slot: a.slot,
  }));
}

export function buildSpriteBlock(pokemon: Pokemon): any {
  return {
    front_default: pokemon.sprites.front_default,
    front_shiny: pokemon.sprites.front_shiny,
    front_female: pokemon.sprites.front_female,
    front_shiny_female: pokemon.sprites.front_shiny_female,
    back_default: pokemon.sprites.back_default,
    back_shiny: pokemon.sprites.back_shiny,
    official_artwork: pokemon.sprites.other?.['official-artwork']?.front_default || null,
    official_artwork_shiny: pokemon.sprites.other?.['official-artwork']?.front_shiny || null,
    home: pokemon.sprites.other?.home?.front_default || null,
    home_shiny: pokemon.sprites.other?.home?.front_shiny || null,
    dream_world: pokemon.sprites.other?.['dream-world']?.front_default || null,
    showdown: pokemon.sprites.other?.showdown?.front_default || null,
    showdown_shiny: pokemon.sprites.other?.showdown?.front_shiny || null,
    showdown_animated: pokemon.sprites.other?.showdown?.front_default || null,
  };
}

export function buildCryBlock(pokemon: Pokemon): any {
  return {
    latest: pokemon.cries?.latest || null,
    legacy: pokemon.cries?.legacy || null,
  };
}

export function buildHeldItemBlock(pokemon: Pokemon): any[] {
  return pokemon.held_items.map((item) => ({
    name: item.item.name,
    version_details: item.version_details.map((vd) => ({
      version: vd.version.name,
      rarity: vd.rarity,
    })),
  }));
}

export function buildGameIndexBlock(pokemon: Pokemon): any[] {
  return pokemon.game_indices.map((gi) => ({
    game_index: gi.game_index,
    version: gi.version.name,
  }));
}

export function buildFlavorTextBlock(species: PokemonSpecies, language: string = 'en'): any[] {
  return species.flavor_text_entries
    .filter((ft) => ft.language.name === language)
    .map((ft) => ({
      text: ft.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ').replace(/\r/g, ' ').trim(),
      version: ft.version.name,
    }));
}

export function buildGeneraBlock(species: PokemonSpecies, language: string = 'en'): string | null {
  const genus = species.genera?.find((g) => g.language.name === language);
  return genus ? genus.genus : null;
}

export function buildPokedexNumberBlock(species: PokemonSpecies): any[] {
  return species.pokedex_numbers.map((pn) => ({
    entry_number: pn.entry_number,
    pokedex: pn.pokedex.name,
  }));
}

export function buildVarietiesBlock(species: PokemonSpecies): any[] {
  return species.varieties.map((v) => ({
    is_default: v.is_default,
    name: v.pokemon.name,
    id: parseInt(v.pokemon.url.split('/').slice(-2)[0]),
  }));
}

export function buildEggGroupBlock(species: PokemonSpecies): string[] {
  return species.egg_groups.map((eg) => eg.name);
}

export function buildBreedingData(species: PokemonSpecies): any {
  return {
    egg_groups: buildEggGroupBlock(species),
    gender_rate: species.gender_rate,
    hatch_counter: species.hatch_counter,
    is_baby: species.is_baby,
    has_gender_differences: species.has_gender_differences,
  };
}

export function buildLoreEntries(species: PokemonSpecies, language: string = 'en'): any[] {
  const entries = buildFlavorTextBlock(species, language);
  return entries.map((e) => ({
    version: e.version,
    text: e.text,
  }));
}

export function buildLegendData(pokemon: SimplifiedPokemon, species: PokemonSpecies): any | null {
  if (!species.is_legendary && !species.is_mythical) return null;

  const flavorTexts = buildFlavorTextBlock(species, 'en');
  const summary = flavorTexts.length > 0 ? flavorTexts[0].text : '';

  return {
    id: pokemon.id,
    name: pokemon.name,
    title: species.genera?.find((g) => g.language.name === 'en')?.genus || 'Legendary',
    description: summary,
    region: getGenerationFromName(species.generation.name),
    games: flavorTexts.map((ft) => ft.version),
    sprite: pokemon.official_artwork,
    is_mythical: species.is_mythical,
  };
}

export function buildSearchIndex(pokemonList: SimplifiedPokemon[]): any[] {
  return pokemonList.map((p) => ({
    id: p.id,
    name: p.name,
    name_formatted: p.name.replace(/-/g, ' '),
    types: p.types,
    generation: p.generation,
    is_legendary: p.is_legendary,
    is_mythical: p.is_mythical,
    is_baby: p.is_baby,
    base_stat_total: p.base_stat_total,
    color: p.color,
    shape: p.shape,
    habitat: p.habitat,
    egg_groups: p.egg_groups,
    abilities: p.abilities,
  }));
}

export function filterPokemon(
  pokemonList: SimplifiedPokemon[],
  filters: {
    search?: string;
    types?: string[];
    generation?: string;
    rarity?: string[];
    minBST?: number;
    maxBST?: number;
  }
): SimplifiedPokemon[] {
  let result = [...pokemonList];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.name.replace(/-/g, ' ').toLowerCase().includes(searchLower) ||
        p.id.toString() === searchLower ||
        p.id.toString().startsWith(searchLower)
    );
  }

  if (filters.types && filters.types.length > 0) {
    result = result.filter((p) => filters.types!.every((t) => p.types.includes(t)));
  }

  if (filters.generation) {
    result = result.filter((p) => p.generation === filters.generation);
  }

  if (filters.rarity && filters.rarity.length > 0) {
    result = result.filter((p) => {
      if (filters.rarity!.includes('legendary') && p.is_legendary) return true;
      if (filters.rarity!.includes('mythical') && p.is_mythical) return true;
      if (filters.rarity!.includes('baby') && p.is_baby) return true;
      if (filters.rarity!.includes('common') && !p.is_legendary && !p.is_mythical && !p.is_baby) return true;
      return false;
    });
  }

  if (filters.minBST !== undefined) {
    result = result.filter((p) => p.base_stat_total >= filters.minBST!);
  }

  if (filters.maxBST !== undefined) {
    result = result.filter((p) => p.base_stat_total <= filters.maxBST!);
  }

  return result;
}

export function sortPokemon(pokemonList: SimplifiedPokemon[], sortBy: string): SimplifiedPokemon[] {
  const result = [...pokemonList];
  switch (sortBy) {
    case 'id-asc':
      return result.sort((a, b) => a.id - b.id);
    case 'id-desc':
      return result.sort((a, b) => b.id - a.id);
    case 'name-asc':
      return result.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return result.sort((a, b) => b.name.localeCompare(a.name));
    case 'bst-asc':
      return result.sort((a, b) => a.base_stat_total - b.base_stat_total);
    case 'bst-desc':
      return result.sort((a, b) => b.base_stat_total - a.base_stat_total);
    case 'height-asc':
      return result.sort((a, b) => (a.height || 0) - (b.height || 0));
    case 'height-desc':
      return result.sort((a, b) => (b.height || 0) - (a.height || 0));
    case 'weight-asc':
      return result.sort((a, b) => (a.weight || 0) - (b.weight || 0));
    case 'weight-desc':
      return result.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    default:
      return result.sort((a, b) => a.id - b.id);
  }
}

export function paginatePokemon(pokemonList: SimplifiedPokemon[], page: number, perPage: number = 20): {
  items: SimplifiedPokemon[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
} {
  const total = pokemonList.length;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const items = pokemonList.slice(start, end);

  return {
    items,
    total,
    totalPages,
    currentPage,
    hasMore: currentPage < totalPages,
  };
}

export function getGenerationPokemons(pokemonList: SimplifiedPokemon[], generation: string): SimplifiedPokemon[] {
  const range = getGenerationRange(generation);
  return pokemonList.filter((p) => p.id >= range.start && p.id <= range.end);
}

export function getTypePokemons(pokemonList: SimplifiedPokemon[], type: string): SimplifiedPokemon[] {
  return pokemonList.filter((p) => p.types.includes(type));
}

export function getLegendaryPokemons(pokemonList: SimplifiedPokemon[]): SimplifiedPokemon[] {
  return pokemonList.filter((p) => p.is_legendary || p.is_mythical);
}

export function getBabyPokemons(pokemonList: SimplifiedPokemon[]): SimplifiedPokemon[] {
  return pokemonList.filter((p) => p.is_baby);
}

export function getStarterPokemons(pokemonList: SimplifiedPokemon[]): SimplifiedPokemon[] {
  const starterIds = [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 909, 912, 915];
  return pokemonList.filter((p) => starterIds.includes(p.id));
}

export function getPseudoLegendaryPokemons(pokemonList: SimplifiedPokemon[]): SimplifiedPokemon[] {
  const pseudoIds = [149, 248, 373, 445, 486, 610, 635, 700, 719, 890, 940];
  return pokemonList.filter((p) => pseudoIds.includes(p.id));
}

export function getUltraBeasts(pokemonList: SimplifiedPokemon[]): SimplifiedPokemon[] {
  const ubIds = [778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 800, 801, 802];
  return pokemonList.filter((p) => ubIds.includes(p.id));
}

export function getParadoxPokemons(pokemonList: SimplifiedPokemon[]): SimplifiedPokemon[] {
  const paradoxIds = [906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950];
  return pokemonList.filter((p) => paradoxIds.includes(p.id));
}

export function filterMoves(moves: any[], query: string): any[] {
  if (!query) return moves;
  const q = query.toLowerCase();
  return moves.filter((m) => m.name.toLowerCase().includes(q));
}

export function sortMoves(moves: any[], sortBy: string): any[] {
  const [key, direction] = sortBy.split('-') as [string, string];
  const dir = direction === 'desc' ? -1 : 1;
  return [...moves].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    return aVal < bVal ? -dir : dir;
  });
}

export function paginateMoves(moves: any[], page: number, perPage: number = 48): {
  items: any[];
  total: number;
  totalPages: number;
  currentPage: number;
} {
  const total = moves.length;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  return {
    items: moves.slice(start, end),
    total,
    totalPages,
    currentPage,
  };
}

export function filterItems(items: any[], query: string): any[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter((i) => i.name.toLowerCase().includes(q));
}

export function sortItems(items: any[], sortBy: string): any[] {
  const [key, direction] = sortBy.split('-') as [string, string];
  const dir = direction === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    return aVal < bVal ? -dir : dir;
  });
}

export function paginateItems(items: any[], page: number, perPage: number = 48): {
  items: any[];
  total: number;
  totalPages: number;
  currentPage: number;
} {
  const total = items.length;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  return {
    items: items.slice(start, end),
    total,
    totalPages,
    currentPage,
  };
}

export function filterAbilities(abilities: any[], query: string): any[] {
  if (!query) return abilities;
  const q = query.toLowerCase();
  return abilities.filter((a) => a.name.toLowerCase().includes(q));
}

export function sortAbilities(abilities: any[], sortBy: string): any[] {
  const [key, direction] = sortBy.split('-') as [string, string];
  const dir = direction === 'desc' ? -1 : 1;
  return [...abilities].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === bVal) return 0;
    return aVal < bVal ? -dir : dir;
  });
}

export function paginateAbilities(abilities: any[], page: number, perPage: number = 48): {
  items: any[];
  total: number;
  totalPages: number;
  currentPage: number;
} {
  const total = abilities.length;
  const totalPages = Math.ceil(total / perPage);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  return {
    items: abilities.slice(start, end),
    total,
    totalPages,
    currentPage,
  };
}
