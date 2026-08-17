export type TypeName =
   | "normal" | "fire" | "water" | "electric" | "grass" | "ice" | "fighting"
   | "poison" | "ground" | "flying" | "psychic" | "bug" | "rock" | "ghost"
   | "dragon" | "dark" | "steel" | "fairy";

export interface DexEntry {
   id: number;
   name: string;
}

export interface GameStat {
   base_stat: number;
   stat: { name: string; url: string };
}

export interface GameAbility {
   ability: { name: string; url: string };
   is_hidden: boolean;
   slot: number;
}

export interface GameMove {
   move: { name: string; url: string };
   version_group_details: any[];
}

export interface GameSpecies {
   flavor_text_entries: {
      flavor_text: string;
      language: { name: string; url: string };
      version: { name: string; url: string };
   }[];
   genera: { genus: string; language: { name: string; url: string } }[];
   genera_url?: string;
   name: string;
}

export interface Pokemon {
   id: number;
   name: string;
   base_experience?: number;
   height: number;
   weight: number;
   order?: number;
   types: { slot: number; type: { name: string; url: string } }[];
   stats: GameStat[];
   abilities: GameAbility[];
   moves: GameMove[];
   species: string;
   sprites: any;
   cries?: { latest?: string; legacy?: string };
   habitat?: unknown;
}

export interface EvolutionChain {
   chain: EvolutionNode;
}
export interface EvolutionNode {
   id?: number;
   species: { name: string; url: string };
   evolution_details: any[];
   evolves_to: EvolutionNode[];
}

export interface TypeChartRow {
   type: TypeName;
   double_damage_from: { name: string }[];
   double_damage_to: { name: string }[];
   half_damage_from: { name: string }[];
   half_damage_to: { name: string }[];
   no_damage_from: { name: string }[];
   no_damage_to: { name: string }[];
}

export interface Favorites {
   ids: number[];
}
