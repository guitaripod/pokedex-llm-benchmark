export interface NamedRef { name: string; url: string }

export interface ListResponse<T = NamedRef> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  base_experience: number
  order: number
  is_default: boolean
  types: { slot: number; type: NamedRef }[]
  abilities: { ability: NamedRef; is_hidden: boolean; slot: number }[]
  stats: { base_stat: number; effort: number; stat: NamedRef }[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: {
      'official-artwork'?: { front_default: string | null; front_shiny: string | null }
      home?: { front_default: string | null; front_shiny: string | null }
      showdown?: { front_default: string | null; front_shiny: string | null; back_default: string | null }
    }
  }
  moves: {
    move: NamedRef
    version_group_details: {
      level_learned_at: number
      move_learn_method: NamedRef
      version_group: NamedRef
    }[]
  }[]
  held_items: { item: NamedRef; version_details: { rarity: number; version: NamedRef }[] }[]
  cries?: { latest: string | null; legacy: string | null }
  forms: NamedRef[]
  species: NamedRef
}

export interface Species {
  id: number
  name: string
  names: { language: NamedRef; name: string }[]
  gender_rate: number
  capture_rate: number
  base_happiness: number
  is_baby: boolean
  is_legendary: boolean
  is_mythical: boolean
  hatch_counter: number
  has_gender_differences: boolean
  growth_rate: NamedRef
  egg_groups: NamedRef[]
  color: NamedRef
  shape: NamedRef | null
  habitat: NamedRef | null
  generation: NamedRef
  evolves_from_species: NamedRef | null
  evolution_chain: { url: string }
  flavor_text_entries: { flavor_text: string; language: NamedRef; version: NamedRef }[]
  genera: { genus: string; language: NamedRef }[]
  varieties: { is_default: boolean; pokemon: NamedRef }[]
  pokedex_numbers: { entry_number: number; pokedex: NamedRef }[]
}

export interface EvoDetail {
  min_level: number | null
  trigger: NamedRef
  item: NamedRef | null
  held_item: NamedRef | null
  min_happiness: number | null
  time_of_day: string
  known_move: NamedRef | null
  location: NamedRef | null
  gender: number | null
  min_affection: number | null
  needs_overworld_rain: boolean
}

export interface EvoNode {
  species: NamedRef
  evolves_to: EvoNode[]
  evolution_details: EvoDetail[]
  is_baby: boolean
}

export interface EvolutionChain {
  id: number
  chain: EvoNode
}

export interface Ability {
  id: number
  name: string
  names: { language: NamedRef; name: string }[]
  is_main_series: boolean
  generation: NamedRef
  effect_entries: { effect: string; short_effect: string; language: NamedRef }[]
  flavor_text_entries: { flavor_text: string; language: NamedRef }[]
  pokemon: { is_hidden: boolean; slot: number; pokemon: NamedRef }[]
}

export interface Move {
  id: number
  name: string
  names: { language: NamedRef; name: string }[]
  accuracy: number | null
  power: number | null
  pp: number | null
  priority: number
  damage_class: NamedRef | null
  type: NamedRef
  target: NamedRef
  generation: NamedRef
  effect_chance: number | null
  effect_entries: { effect: string; short_effect: string; language: NamedRef }[]
  flavor_text_entries: { flavor_text: string; language: NamedRef }[]
  learned_by_pokemon: NamedRef[]
  meta: { ailment: NamedRef; crit_rate: number; drain: number; healing: number; flinch_chance: number } | null
}

export interface Item {
  id: number
  name: string
  names: { language: NamedRef; name: string }[]
  cost: number
  fling_power: number | null
  category: NamedRef
  attributes: NamedRef[]
  effect_entries: { effect: string; short_effect: string; language: NamedRef }[]
  flavor_text_entries: { text: string; language: NamedRef }[]
  sprites: { default: string | null }
}

export interface TypeInfo {
  id: number
  name: string
  names: { language: NamedRef; name: string }[]
  damage_relations: {
    double_damage_from: NamedRef[]
    double_damage_to: NamedRef[]
    half_damage_from: NamedRef[]
    half_damage_to: NamedRef[]
    no_damage_from: NamedRef[]
    no_damage_to: NamedRef[]
  }
  pokemon: { pokemon: NamedRef; slot: number }[]
  moves: NamedRef[]
  generation: NamedRef
}
