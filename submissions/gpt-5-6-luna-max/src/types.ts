export interface NamedResource {
  name: string;
  url: string;
}

export interface PokemonSummary {
  id: number;
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedResource[];
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedResource;
}

export interface PokemonAbilitySlot {
  ability: NamedResource;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedResource;
}

export interface PokemonMoveVersionDetail {
  level_learned_at: number;
  move_learn_method: NamedResource;
  version_group: NamedResource;
}

export interface PokemonMove {
  move: NamedResource;
  version_group_details: PokemonMoveVersionDetail[];
}

export interface OfficialArtwork {
  front_default: string | null;
  front_shiny: string | null;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  back_default: string | null;
  back_shiny: string | null;
  other?: {
    "official-artwork"?: OfficialArtwork;
    dream_world?: {
      front_default: string | null;
      front_female: string | null;
    };
    home?: OfficialArtwork;
    showdown?: {
      front_default: string | null;
      front_shiny: string | null;
      back_default: string | null;
      back_shiny: string | null;
    };
  };
}

export interface PokemonCries {
  latest: string | null;
  legacy: string | null;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  is_default: boolean;
  order: number;
  abilities: PokemonAbilitySlot[];
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  moves: PokemonMove[];
  sprites: PokemonSprites;
  cries?: PokemonCries;
  species: NamedResource;
}

export interface SpeciesFlavorText {
  flavor_text: string;
  language: NamedResource;
  version: NamedResource;
}

export interface SpeciesGenus {
  genus: string;
  language: NamedResource;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number | null;
  is_baby: boolean;
  hatch_counter: number | null;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  color: NamedResource | null;
  shape: NamedResource | null;
  habitat: NamedResource | null;
  growth_rate: NamedResource | null;
  egg_groups: NamedResource[];
  evolution_chain: NamedResource;
  flavor_text_entries: SpeciesFlavorText[];
  genera: SpeciesGenus[];
  varieties: Array<{
    is_default: boolean;
    pokemon: NamedResource;
  }>;
}

export interface EvolutionDetail {
  gender: number | null;
  held_item: NamedResource | null;
  item: NamedResource | null;
  known_move: NamedResource | null;
  known_move_type: NamedResource | null;
  location: NamedResource | null;
  min_happiness: number | null;
  min_level: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedResource | null;
  party_type: NamedResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedResource | null;
  trigger: NamedResource;
  turn_upside_down: boolean;
}

export interface EvolutionNode {
  is_baby: boolean;
  species: NamedResource;
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionNode[];
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedResource | null;
  chain: EvolutionNode;
}

export interface TypeRelations {
  no_damage_to: NamedResource[];
  half_damage_to: NamedResource[];
  double_damage_to: NamedResource[];
  no_damage_from: NamedResource[];
  half_damage_from: NamedResource[];
  double_damage_from: NamedResource[];
}

export interface TypeDetail {
  id: number;
  name: string;
  damage_relations: TypeRelations;
  pokemon: Array<{
    pokemon: NamedResource;
    slot: number;
  }>;
  moves: NamedResource[];
  generation: NamedResource;
}

export interface PokemonProfile {
  pokemon: PokemonDetail;
  species: PokemonSpecies;
  evolution: EvolutionChain | null;
}
