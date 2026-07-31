export interface Card {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  artwork: string;
  baseStatTotal: number;
  height: number;
  weight: number;
  generation: number;
  legendary: boolean;
  mythical: boolean;
}

export interface SpeciesInfo {
  captureRate: number;
  baseHappiness: number;
  genderRate: number;
  hatchCounter: number;
  growthRate: string;
  habitat: string | null;
  eggGroups: string[];
  isLegendary: boolean;
  isMythical: boolean;
  isBaby: boolean;
  generation: number;
  color: string;
  shape: string | null;
}

export interface TypeRelation {
  noDamageTo: string[];
  halfDamageTo: string[];
  doubleDamageTo: string[];
  noDamageFrom: string[];
  halfDamageFrom: string[];
  doubleDamageFrom: string[];
}

export interface EvolutionTrigger {
  kind: string;
  label: string;
  minLevel?: number;
  item?: string;
  heldItem?: string;
  location?: string;
  minHappiness?: number;
  minAffection?: number;
  timeOfDay?: string;
  gender?: string;
  knownMove?: string;
  knownMoveType?: string;
  tradeSpecies?: string;
  randomLevel?: boolean;
  stat?: string;
  needsOverworldRain?: boolean;
  turnUpsideDown?: boolean;
}

export interface EvolutionNode {
  id: number;
  name: string;
  sprite: string;
  triggers: EvolutionTrigger[];
  evolvesTo: EvolutionNode[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  names: Record<string, string>;
  genus: string;
  genera: Record<string, string>;
  flavorText: Record<string, string>;
  types: string[];
  height: number;
  weight: number;
  baseExperience: number;
  stats: { name: string; base: number }[];
  moves: { name: string; minLevel: number | null; methods: string[] }[];
  abilities: { name: string; isHidden: boolean; slot: number }[];
  sprites: {
    artwork: string;
    artworkShiny: string;
    home: string;
    homeShiny: string;
    dream: string;
    default: string;
    shiny: string;
  };
  cry: string;
  species: SpeciesInfo;
  evolution: EvolutionNode | null;
  typeInfo: Record<string, TypeRelation>;
}

export interface Move {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  damageClass: string;
  priority: number;
  effect: string | null;
  shortEffect: string | null;
}

export interface Ability {
  name: string;
  effect: string | null;
  shortEffect: string | null;
  flavorText: string | null;
}

export interface Item {
  name: string;
  sprite: string | null;
  category: string | null;
}

export interface Meta {
  total: number;
  generations: number[];
  types: string[];
  generatedAt: string;
  source: string;
}
