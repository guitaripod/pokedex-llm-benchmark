export interface NamedAPIResource {
  name: string;
  url: string;
}

export interface ApiStat {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface ApiType {
  slot: number;
  type: NamedAPIResource;
}

export interface ApiAbility {
  is_hidden: boolean;
  slot: number;
  ability: NamedAPIResource;
}

export interface VersionGroupDetail {
  level_learned_at: number;
  version_group: NamedAPIResource;
  move_learn_method: NamedAPIResource;
}

export interface ApiMove {
  move: NamedAPIResource;
  version_group_details: VersionGroupDetail[];
}

export interface SpriteSet {
  back_default: string | null;
  back_shiny: string | null;
  front_default: string | null;
  front_shiny: string | null;
  other?: {
    dream_world?: { front_default: string | null; front_female: string | null };
    home?: { front_default: string | null; front_shiny: string | null };
    "official-artwork"?: { front_default: string | null; front_shiny: string | null };
    showdown?: { front_default: string | null; front_shiny: string | null; back_default?: string | null };
  };
  versions?: Record<string, Record<string, { front_default?: string | null }>>;
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  is_default: boolean;
  order: number;
  stats: ApiStat[];
  types: ApiType[];
  abilities: ApiAbility[];
  moves: ApiMove[];
  sprites: SpriteSet;
  cries?: { latest: string | null; legacy: string | null };
  species: NamedAPIResource;
  forms: NamedAPIResource[];
  game_indices?: { version: NamedAPIResource }[];
  held_items?: {
    item: NamedAPIResource;
    version_details: { rarity: number; version: NamedAPIResource }[];
  }[];
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: { name: string };
  version: { name: string };
}

export interface GenusEntry {
  genus: string;
  language: { name: string };
}

export interface PokemonSpecies {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  genera: GenusEntry[];
  flavor_text_entries: FlavorTextEntry[];
  generation: NamedAPIResource;
  growth_rate: NamedAPIResource | null;
  habitat: NamedAPIResource | null;
  capture_rate: number;
  base_happiness: number | null;
  gender_rate: number;
  hatch_counter: number | null;
  egg_groups: NamedAPIResource[];
  evolution_chain: { url: string } | null;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  color: NamedAPIResource;
  shape: NamedAPIResource | null;
  varieties: { is_default: boolean; pokemon: NamedAPIResource }[];
}

export interface ChainLink {
  species: NamedAPIResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionDetail {
  min_level: number | null;
  trigger: NamedAPIResource;
  item: NamedAPIResource | null;
  held_item: NamedAPIResource | null;
  known_move: NamedAPIResource | null;
  known_move_type: NamedAPIResource | null;
  location: NamedAPIResource | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  gender: number | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedAPIResource | null;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: NamedAPIResource | null;
  chain: ChainLink;
}

export interface AbilityDetail {
  id: number;
  name: string;
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string }; version_group: { name: string } }[];
  generation: NamedAPIResource;
  pokemon: { is_hidden: boolean; pokemon: NamedAPIResource }[];
}

export interface MoveDetail {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  priority: number;
  damage_class: NamedAPIResource;
  type: NamedAPIResource;
  target: NamedAPIResource;
  generation: NamedAPIResource;
  effect_chance: number | null;
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  stat_changes: { change: number; stat: NamedAPIResource }[];
  meta?: {
    ailment: NamedAPIResource;
    ailment_chance: number;
    crit_rate: number;
    drain: number;
    flinch_chance: number;
    healing: number;
    stat_chance: number;
  };
  contest_type?: NamedAPIResource | null;
}

export interface ItemDetail {
  id: number;
  name: string;
  cost: number;
  category: NamedAPIResource;
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  flavor_text_entries: { text: string; language: { name: string } }[];
  sprites: { default: string | null };
  held_by_pokemon?: { pokemon: NamedAPIResource }[];
  fling_power?: number | null;
}
