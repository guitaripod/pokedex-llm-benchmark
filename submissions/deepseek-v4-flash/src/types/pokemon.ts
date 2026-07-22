export interface PokemonListEntry {
  name: string;
  url: string;
}

export interface PokemonType {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonAbility {
  ability: { name: string; url: string };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokemonMove {
  move: { name: string; url: string };
  version_group_details: {
    level_learned_at: number;
    move_learn_method: { name: string };
    version_group: { name: string };
  }[];
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  back_default: string | null;
  back_shiny: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
    showdown: {
      front_default: string | null;
      front_shiny: string | null;
    };
    home: {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  types: PokemonType[];
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  moves: PokemonMove[];
  sprites: PokemonSprites;
  species: { name: string; url: string };
}

export interface PokemonSpecies {
  id: number;
  name: string;
  genera: { genus: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[];
  generation: { name: string; url: string };
  evolution_chain: { url: string };
  hatch_counter: number;
  capture_rate: number;
  base_happiness: number;
  growth_rate: { name: string };
  egg_groups: { name: string }[];
  habitat: { name: string } | null;
  color: { name: string };
  shape: { name: string } | null;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  gender_rate: number;
}

export interface EvolutionChain {
  id: number;
  chain: EvolutionNode;
}

export interface EvolutionNode {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionNode[];
}

export interface EvolutionDetail {
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  item: { name: string; url: string } | null;
  trigger: { name: string; url: string };
  held_item: { name: string; url: string } | null;
  known_move: { name: string; url: string } | null;
  known_move_type: { name: string; url: string } | null;
  location: { name: string; url: string } | null;
  gender: number | null;
  time_of_day: string;
  trade_species: { name: string; url: string } | null;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;
}

export interface TypeInfo {
  id: number;
  name: string;
  damage_relations: DamageRelations;
  pokemon: { pokemon: { name: string; url: string }; slot: number }[];
}

export interface DamageRelations {
  double_damage_from: { name: string; url: string }[];
  double_damage_to: { name: string; url: string }[];
  half_damage_from: { name: string; url: string }[];
  half_damage_to: { name: string; url: string }[];
  no_damage_from: { name: string; url: string }[];
  no_damage_to: { name: string; url: string }[];
}

export interface Move {
  id: number;
  name: string;
  accuracy: number | null;
  pp: number | null;
  power: number | null;
  type: { name: string };
  damage_class: { name: string };
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
}

export interface Generation {
  id: number;
  name: string;
  pokemon_species: { name: string; url: string }[];
}

export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type PokemonTypeName = typeof POKEMON_TYPES[number];

export const GENERATIONS = [
  { id: 1, name: 'Generation I', display: 'Kanto' },
  { id: 2, name: 'Generation II', display: 'Johto' },
  { id: 3, name: 'Generation III', display: 'Hoenn' },
  { id: 4, name: 'Generation IV', display: 'Sinnoh' },
  { id: 5, name: 'Generation V', display: 'Unova' },
  { id: 6, name: 'Generation VI', display: 'Kalos' },
  { id: 7, name: 'Generation VII', display: 'Alola' },
  { id: 8, name: 'Generation VIII', display: 'Galar' },
  { id: 9, name: 'Generation IX', display: 'Paldea' },
] as const;

export const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'SPD',
};

export const STAT_MAX: Record<string, number> = {
  hp: 255,
  attack: 190,
  defense: 230,
  'special-attack': 194,
  'special-defense': 230,
  speed: 200,
};
