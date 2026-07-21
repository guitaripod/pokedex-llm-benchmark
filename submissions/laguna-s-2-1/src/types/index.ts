export interface PokemonType {
  name: string;
  url: string;
}

export interface PokemonTypeEntry {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokemonAbility {
  ability: { name: string; url: string };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonMoveVersionDetail {
  level_learned_at: number;
  move_learn_method: { name: string; url: string };
  order: number | null;
  version_group: { name: string; url: string };
}

export interface PokemonMove {
  move: { name: string; url: string };
  version_group_details: PokemonMoveVersionDetail[];
}

export interface PokemonSpriteUrls {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  front_shiny_female: string | null;
  back_default: string | null;
  back_shiny: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
    home: {
      front_default: string | null;
      front_shiny: string | null;
      front_female: string | null;
      front_shiny_female: string | null;
    };
    'dream-world': {
      front_default: string | null;
      front_female: string | null;
    };
    showdown: {
      front_default: string | null;
      front_shiny: string | null;
      back_default: string | null;
      back_shiny: string | null;
      front_female: string | null;
      front_shiny_female: string | null;
      back_female: string | null;
      back_shiny_female: string | null;
    };
  };
  versions: Record<string, Record<string, Record<string, string | null>>>;
}

export interface PokemonCry {
  latest: string;
  legacy: string;
}

export interface PokemonHeldItem {
  item: { name: string; url: string };
  version_details: {
    rarity: number;
    version: { name: string; url: string };
  }[];
}

export interface PokemonEncounter {
  location_area: { name: string; url: string };
  version_details: {
    encounter_details: {
      chance: number;
      condition_values: { name: string; url: string }[];
      max_level: number;
      method: { name: string; url: string };
      min_level: number;
    }[];
    max_chance: number;
    version: { name: string; url: string };
  }[];
}

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  is_default: boolean;
  order: number;
  stats: PokemonStat[];
  types: PokemonTypeEntry[];
  abilities: PokemonAbility[];
  moves: PokemonMove[];
  sprites: PokemonSpriteUrls;
  cries: PokemonCry;
  species: { name: string; url: string };
  held_items: PokemonHeldItem[];
  location_area_encounters: string;
  game_indices: { game_index: number; version: { name: string; url: string } }[];
  past_abilities: { abilities: any[]; generation: { name: string; url: string } }[];
  past_stats: { generation: { name: string; url: string }; stats: any[] }[];
  past_types: any[];
  forms: { name: string; url: string }[];
}

export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  generation: { name: string; url: string };
  growth_rate: { name: string; url: string };
  habitat: { name: string; url: string } | null;
  shape: { name: string; url: string };
  egg_groups: { name: string; url: string }[];
  color: { name: string; url: string };
  evolves_from_species: { name: string; url: string } | null;
  evolution_chain: { url: string };
  pokedex_numbers: { entry_number: number; pokedex: { name: string; url: string } }[];
  varieties: { is_default: boolean; pokemon: { name: string; url: string } }[];
  names: { language: { name: string; url: string }; name: string }[];
  genera: { genus: string; language: { name: string; url: string } }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string; url: string };
    version: { name: string; url: string };
  }[];
  effect_entries: { effect: string; language: { name: string; url: string } }[];
  form_descriptions: string[];
  pal_park_encounters: { area: { name: string; url: string }; base_score: number; rate: number }[];
}

export interface TypeDamageRelations {
  double_damage_from: { name: string; url: string }[];
  double_damage_to: { name: string; url: string }[];
  half_damage_from: { name: string; url: string }[];
  half_damage_to: { name: string; url: string }[];
  no_damage_from: { name: string; url: string }[];
  no_damage_to: { name: string; url: string }[];
}

export interface TypeData {
  id: number;
  name: string;
  damage_relations: TypeDamageRelations;
  past_damage_relations: any[];
  names: { language: { name: string; url: string }; name: string }[];
  pokemon: { pokemon: { name: string; url: string }; slot: number }[];
  moves: { name: string; url: string }[];
  generation: { name: string; url: string };
  sprites: Record<string, any>;
}

export interface MoveData {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  priority: number;
  power_points: number | null;
  type: { name: string; url: string };
  damage_class: { name: string; url: string };
  effect_entries: { effect: string; short_effect: string; language: { name: string; url: string } }[];
  effect_changes: any[];
  flavor_text_entries: { flavor_text: string; language: { name: string; url: string }; version_group: { name: string; url: string } }[];
  learned_by_pokemon: { name: string; url: string }[];
  machines: { machine: { url: string }; version_group: { name: string; url: string } }[];
  meta: {
    ailment: { name: string; url: string };
    ailment_chance: number | null;
    category: { name: string; url: string };
    crit_rate: number | null;
    drain: number;
    flinch_chance: number | null;
    healing: number;
    max_hits: number | null;
    max_turns: number | null;
    min_hits: number | null;
    min_turns: number | null;
    stat_chance: number | null;
  };
  names: { language: { name: string; url: string }; name: string }[];
  contest_type: { name: string; url: string } | null;
  contest_effect: { url: string } | null;
  super_contest_effect: { url: string } | null;
  target: { name: string; url: string };
  generation: { name: string; url: string };
  past_values: any[];
  stat_changes: any[];
}

export interface ItemData {
  id: number;
  name: string;
  cost: number;
  category: { name: string; url: string };
  effect_entries: { effect: string; short_effect: string; language: { name: string; url: string } }[];
  flavor_text_entries: { text: string; language: { name: string; url: string }; version_group: { name: string; url: string } }[];
  game_indices: { game_index: number; generation: { name: string; url: string } }[];
  held_by_pokemon: { pokemon: { name: string; url: string }; version_details: any[] }[];
  machines: { machine: { url: string }; version_group: { name: string; url: string } }[];
  names: { language: { name: string; url: string }; name: string }[];
  sprites: { default: string | null };
  attributes: { name: string; url: string }[];
  baby_trigger_for: { url: string } | null;
  fling_effect: { name: string; url: string } | null;
  fling_power: number | null;
}

export interface AbilityData {
  id: number;
  name: string;
  effect_entries: { effect: string; short_effect: string; language: { name: string; url: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string; url: string }; version_group: { name: string; url: string } }[];
  effect_changes: any[];
  names: { language: { name: string; url: string }; name: string }[];
  pokemon: { is_hidden: boolean; pokemon: { name: string; url: string }; slot: number }[];
  generation: { name: string; url: string };
  is_main_series: boolean;
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: { name: string; url: string } | null;
  chain: EvolutionNode;
}

export interface EvolutionNode {
  is_baby: boolean;
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionNode[];
}

export interface EvolutionDetail {
  base_form: { name: string; url: string } | null;
  evolved_form: { name: string; url: string } | null;
  gender: { name: string; url: string } | null;
  held_item: { name: string; url: string } | null;
  is_default: boolean;
  item: { name: string; url: string } | null;
  known_move: { name: string; url: string } | null;
  known_move_type: { name: string; url: string } | null;
  location: { name: string; url: string } | null;
  min_affection: number | null;
  min_beauty: number | null;
  min_damage_taken: number | null;
  min_happiness: number | null;
  min_level: number | null;
  min_move_count: number | null;
  min_steps: number | null;
  near_special_rock: boolean;
  needs_multiplayer: boolean;
  needs_overworld_rain: boolean;
  party_species: { name: string; url: string } | null;
  party_type: { name: string; url: string } | null;
  region: { name: string; url: string } | null;
  relative_physical_stats: { name: string; url: string } | null;
  time_of_day: string;
  trade_species: { name: string; url: string } | null;
  trigger: { name: string; url: string };
  turn_upside_down: boolean;
  used_move: { name: string; url: string } | null;
  version_group: { name: string; url: string };
}

export interface RegionData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  main_generation: { name: string; url: string } | null;
  pokedexes: { name: string; url: string }[];
  version_groups: { name: string; url: string }[];
  locations: { name: string; url: string }[];
}

export interface LocationData {
  id: number;
  name: string;
  region: { name: string; url: string } | null;
  names: { language: { name: string; url: string }; name: string }[];
  game_indices: { game_index: number; generation: { name: string; url: string } }[];
  areas: { name: string; url: string }[];
}

export interface LocationAreaData {
  id: number;
  name: string;
  location: { name: string; url: string };
  names: { language: { name: string; url: string }; name: string }[];
  encounter_method_rates: any[];
  pokemon_encounters: { pokemon: { name: string; url: string }; version_details: any[] }[];
}

export interface NatureData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  descriptions: { description: string; language: { name: string; url: string } }[];
  increased_stat: { name: string; url: string } | null;
  decreased_stat: { name: string; url: string } | null;
  likes_flavor: { name: string; url: string } | null;
  hates_flavor: { name: string; url: string } | null;
  move_chance: number | null;
  pokeathlon_stat_changes: any[];
}

export interface EggGroupData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  pokemon_species: { name: string; url: string }[];
}

export interface GrowthRateData {
  id: number;
  name: string;
  descriptions: { description: string; language: { name: string; url: string } }[];
  formula: string;
  pokemon_species: { name: string; url: string }[];
}

export interface PokemonShapeData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  awesome_names: { awesome_name: string; language: { name: string; url: string } }[];
  pokemon_species: { name: string; url: string }[];
}

export interface PokemonHabitatData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  pokemon_species: { name: string; url: string }[];
}

export interface PokemonColorData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  pokemon_species: { name: string; url: string }[];
}

export interface PokedexEntry {
  name: string;
  url: string;
}

export interface PokedexData {
  id: number;
  name: string;
  descriptions: { description: string; language: { name: string; url: string } }[];
  pokemon_entries: { entry_number: number; pokemon: { name: string; url: string } }[];
  region: { name: string; url: string } | null;
  version: { name: string; url: string } | null;
  names: { language: { name: string; url: string }; name: string }[];
}

export interface EncounterMethodData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  order: number;
}

export interface EncounterConditionData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  values: { name: string; url: string }[];
}

export interface EncounterConditionValueData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  condition: { name: string; url: string };
  is_default: boolean;
}

export interface VersionData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  version_group: { name: string; url: string };
}

export interface VersionGroupData {
  id: number;
  name: string;
  order: number;
  generations: { name: string; url: string }[];
  move_learn_methods: { name: string; url: string }[];
  pokedexes: { name: string; url: string }[];
  regions: { name: string; url: string }[];
  versions: { name: string; url: string }[];
  pokemon_move_method: { name: string; url: string }[];
}

export interface LanguageData {
  id: number;
  name: string;
  official: boolean;
  names: { language: { name: string; url: string }; name: string }[];
}

export interface ContestTypeData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  berry_flavor: { name: string; url: string };
  pokemon: { name: string; url: string }[];
}

export interface ContestEffectData {
  id: number;
  appeal: number;
  jam: number;
  effect_entries: { effect: string; language: { name: string; url: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string; url: string } }[];
}

export interface SuperContestEffectData {
  id: number;
  appeal: number;
  flavor_text_entries: { flavor_text: string; language: { name: string; url: string } }[];
  move: { name: string; url: string }[];
}

export interface ItemAttributeData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  items: { name: string; url: string }[];
  descriptions: { description: string; language: { name: string; url: string } }[];
}

export interface ItemCategoryData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  items: { name: string; url: string }[];
  pocket: { name: string; url: string };
}

export interface ItemFlingEffectData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  effect_entries: { effect: string; language: { name: string; url: string } }[];
  pokemon_items: any[];
}

export interface ItemPocketData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  categories: { name: string; url: string }[];
}

export interface MoveAilmentData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  moves: { name: string; url: string }[];
  pokemon: { name: string; url: string }[];
}

export interface MoveBattleStyleData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
}

export interface MoveCategoryData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  descriptions: { description: string; language: { name: string; url: string } }[];
  moves: { name: string; url: string }[];
  pokemon: { name: string; url: string }[];
}

export interface MoveDamageClassData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  descriptions: { description: string; language: { name: string; url: string } }[];
  moves: { name: string; url: string }[];
}

export interface MoveLearnMethodData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  descriptions: { description: string; language: { name: string; url: string } }[];
  pokemon: { name: string; url: string }[];
}

export interface MoveTargetData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  descriptions: { description: string; language: { name: string; url: string } }[];
  moves: { name: string; url: string }[];
}

export interface BerryData {
  id: number;
  name: string;
  growth_time: number;
  max_harvest: number;
  size: number;
  spiciness: number;
  kindness: number;
  natural_gift_power: number;
  natural_gift_type: { name: string; url: string };
  soil_dryness: number;
  firmness: { name: string; url: string };
  flavors: { flavor: { name: string; url: string }; potency: number }[];
  item: { name: string; url: string };
  item_power: number;
  lingering_chances: number;
  max_bleed_chances: number;
  min_happiness: number;
  min_level: number;
  natural_gift_type: { name: string; url: string };
  pal_park_encounters: any[];
  past_pokemon: any[];
}

export interface BerryFirmnessData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  berries: { name: string; url: string }[];
}

export interface BerryFlavorData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  berries: { name: string; url: string; potency: number }[];
  contest_type: { name: string; url: string };
}

export interface CharacteristicData {
  id: number;
  gene_mod: number;
  is_highest_stat: boolean;
  stat: { name: string; url: string };
  species: { name: string; url: string }[];
}

export interface GenderData {
  id: number;
  name: string;
  pokemon_species_details: { rate: number; pokemon_species: { name: string; url: string } }[];
  requires_baton_pass: boolean;
}

export interface PalParkAreaData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  encounters: { base_score: number; rate: number; pokemon: { name: string; url: string } }[];
}

export interface PokeathlonStatData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  affecting_berries: any[];
  affecting_natures: any[];
  affecting_pokemon: any[];
}

export interface PokemonFormData {
  id: number;
  name: string;
  form_name: string;
  names: { language: { name: string; url: string }; name: string }[];
  pokemon: { name: string; url: string };
  is_battle_only: boolean;
  is_default: boolean;
  is_mega: boolean;
  form_order: number;
  gender: number;
  sprites: Record<string, string | null>;
  version_group: { name: string; url: string };
}

export interface PokemonColorData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  pokemon_species: { name: string; url: string }[];
}

export interface PokemonHabitatData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  pokemon_species: { name: string; url: string }[];
}

export interface PokemonShapeData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  awesome_names: { awesome_name: string; language: { name: string; url: string } }[];
  pokemon_species: { name: string; url: string }[];
}

export interface GenerationData {
  id: number;
  name: string;
  names: { language: { name: string; url: string }; name: string }[];
  main_region: { name: string; url: string };
  pokemon_species: { name: string; url: string }[];
  types: { name: string; url: string }[];
  moves: { name: string; url: string }[];
  version_groups: { name: string; url: string }[];
  versions: { name: string; url: string }[];
  pokedexes: { name: string; url: string }[];
  regions: { name: string; url: string }[];
  abilities: { name: string; url: string }[];
  items: { name: string; url: string }[];
  natures: { name: string; url: string }[];
  egg_groups: { name: string; url: string }[];
  pokemon: { name: string; url: string }[];
  pokemon_colors: { name: string; url: string }[];
  pokemon_habitats: { name: string; url: string }[];
  pokemon_shapes: { name: string; url: string }[];
  pokemon_forms: { name: string; url: string }[];
  pokemon_species: { name: string; url: string }[];
  pokemon_types: { name: string; url: string }[];
  pokemon_abilities: { name: string; url: string }[];
  pokemon_moves: { name: string; url: string }[];
  pokemon_items: { name: string; url: string }[];
  pokemon_natures: { name: string; url: string }[];
  pokemon_egg_groups: { name: string; url: string }[];
  pokemon_colors: { name: string; url: string }[];
  pokemon_habitats: { name: string; url: string }[];
  pokemon_shapes: { name: string; url: string }[];
  pokemon_forms: { name: string; url: string }[];
  pokemon_species: { name: string; url: string }[];
  pokemon_types: { name: string; url: string }[];
  pokemon_abilities: { name: string; url: string }[];
  pokemon_moves: { name: string; url: string }[];
  pokemon_items: { name: string; url: string }[];
  pokemon_natures: { name: string; url: string }[];
  pokemon_egg_groups: { name: string; url: string }[];
}

export interface SimplifiedPokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string | null;
  shiny_sprite: string | null;
  official_artwork: string | null;
  base_stat_total: number;
  generation: string;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  color: string | null;
  shape: string | null;
  habitat: string | null;
  egg_groups: string[];
  abilities: string[];
}

export interface SimplifiedMove {
  id: number;
  name: string;
  type: string;
  damage_class: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  generation: string;
  learned_by_count: number;
}

export interface SimplifiedItem {
  id: number;
  name: string;
  category: string;
  cost: number;
  sprite: string | null;
  held_by_count: number;
}

export interface SimplifiedAbility {
  id: number;
  name: string;
  generation: string;
  pokemon_count: number;
  short_effect: string;
}

export interface Language {
  name: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { name: 'en', label: 'English', flag: '🇬🇧' },
  { name: 'ja', label: '日本語', flag: '🇯🇵' },
  { name: 'fr', label: 'Français', flag: '🇫🇷' },
  { name: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { name: 'es', label: 'Español', flag: '🇪🇸' },
  { name: 'it', label: 'Italiano', flag: '🇮🇹' },
  { name: 'ko', label: '한국어', flag: '🇰🇷' },
  { name: 'zh-hans', label: '简体中文', flag: '🇨🇳' },
  { name: 'zh-hant', label: '繁體中文', flag: '🇹🇼' },
  { name: 'ja-hrkt', label: '日本語(ひらがな)', flag: '🇯🇵' },
  { name: 'es-419', label: 'Español (Latinoamérica)', flag: '🇲🇽' },
];

export const TYPE_ORDER = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'ghost', 'dragon', 'dark', 'steel', 'fairy', 'stellar', 'unknown'
];

export const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
};

export const DAMAGE_CLASS_COLORS: Record<string, string> = {
  physical: '#E6A74E',
  special: '#6390F0',
  status: '#A8A77A',
};

export const GENERATION_NAMES: Record<string, string> = {
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

export const VERSION_GROUP_NAMES: Record<string, string> = {
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

export const MOVE_LEARN_METHODS: Record<string, string> = {
  'level-up': 'Level Up',
  'machine': 'TM/HM',
  'egg': 'Egg Move',
  'tutor': 'Tutor',
  'type-up': 'Type Up',
  'light-purchase': 'Light Purchase',
  'train': 'Train',
  'special': 'Special',
};

export const ENCOUNTER_METHODS: Record<string, string> = {
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
  ' pokeathlon': 'Pokéathlon',
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

export const RARITY_COLORS: Record<string, string> = {
  common: '#4CAF50',
  rare: '#2196F3',
  ultra: '#9C27B0',
  legendary: '#F44336',
  mythical: '#FF9800',
  sub: '#FFEB3B',
};

export const EGG_GROUP_NAMES: Record<string, string> = {
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

export const SHAPE_NAMES: Record<string, string> = {
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

export const HABITAT_NAMES: Record<string, string> = {
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

export const COLOR_NAMES: Record<string, string> = {
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

export const ITEM_CATEGORY_NAMES: Record<string, string> = {
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

export const STANDARD_POKEBALL_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
export const POKEMON_ICON_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
export const POKEMON_SHINY_ICON_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
export const POKEMON_OFFICIAL_ARTWORK_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
export const POKEMON_OFFICIAL_ARTWORK_SHINY_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
export const POKEMON_SHOWDOWN_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
export const POKEMON_SHOWDOWN_SHINY_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${id}.gif`;
export const POKEMON_CRY_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
export const POKEMON_LEGACY_CRY_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${id}.ogg`;
export const TYPE_ICON_URL = (type: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${type}.png`;
export const TYPE_SYMBOL_URL = (type: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/small/${type}.png`;
export const ITEM_SPRITE_URL = (name: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
export const MOVE_ICON_URL = (type: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${type}.png`;

export interface AppState {
  language: string;
  theme: 'light' | 'dark' | 'system';
  favorites: number[];
  teams: Team[];
  searchHistory: string[];
  showShiny: boolean;
  showGenderDifferences: boolean;
  versionGroup: string;
}

export interface Team {
  id: string;
  name: string;
  pokemon: TeamMember[];
  createdAt: number;
  updatedAt: number;
}

export interface TeamMember {
  id: number;
  nickname: string;
  heldItem: string | null;
  moves: string[];
  ability: string | null;
  nature: string | null;
}

export interface SearchFilters {
  types: string[];
  generation: string | null;
  rarity: string[];
  minBST: number | null;
  maxBST: number | null;
  sort: string;
  search: string;
}

export interface TypeEffectiveness {
  [attacker: string]: {
    [defender: string]: number;
  };
}

export interface ComparisonData {
  pokemonA: number;
  pokemonB: number;
}

export interface EncounterData {
  location: string;
  version: string;
  method: string;
  minLevel: number;
  maxLevel: number;
  chance: number;
}

export interface LoreEntry {
  version: string;
  text: string;
  year: string;
}

export interface PokemonLore {
  pokemonId: number;
  entries: LoreEntry[];
  summary: string;
  legend: boolean;
}

export interface LegendData {
  id: number;
  name: string;
  title: string;
  description: string;
  region: string;
  games: string[];
  sprite: string | null;
}
