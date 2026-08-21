import { TYPE_RELATIONS } from "./data";

export const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type TypeName = (typeof TYPES)[number];

export const typeColor = (t: string) => `var(--color-t-${t})`;

export const STAT_META: Record<string, { label: string; short: string; max: number }> = {
  hp: { label: "HP", short: "HP", max: 255 },
  attack: { label: "Attack", short: "Atk", max: 190 },
  defense: { label: "Defense", short: "Def", max: 250 },
  "special-attack": { label: "Sp. Atk", short: "SpA", max: 194 },
  "special-defense": { label: "Sp. Def", short: "SpD", max: 250 },
  speed: { label: "Speed", short: "Spe", max: 200 },
};

export const formatId = (id: number) => `#${String(id).padStart(4, "0")}`;

export const formatName = (name: string) =>
  name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const decimetresToM = (h: number) => (h / 10).toFixed(1);
export const hectogramsToKg = (w: number) => (w / 10).toFixed(1);

export function effectiveness(attacker: string, defenders: string[]): number {
  const rel = TYPE_RELATIONS[attacker];
  if (!rel) return 1;
  let mult = 1;
  for (const d of defenders) {
    if (rel.double.includes(d)) mult *= 2;
    else if (rel.half.includes(d)) mult *= 0.5;
    else if (rel.zero.includes(d)) mult *= 0;
  }
  return mult;
}

export function defensiveProfile(defenders: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const atk of TYPES) out[atk] = effectiveness(atk, defenders);
  return out;
}

export const MULT_LABEL: Record<number, string> = {
  0: "0",
  0.25: "¼",
  0.5: "½",
  1: "",
  2: "2",
  4: "4",
};

export function statTotal(stats: number[]): number {
  return stats.reduce((a, b) => a + b, 0);
}

export function genderSplit(rate: number): { female: number; male: number; genderless: boolean } {
  if (rate < 0) return { female: 0, male: 0, genderless: true };
  const female = (rate / 8) * 100;
  return { female, male: 100 - female, genderless: false };
}

export function hatchSteps(counter: number | null): string {
  if (counter == null) return "—";
  return `${(counter + 1) * 128} steps`;
}

export function evolutionText(d: {
  trigger?: string | { name: string } | null;
  min_level?: number | null;
  item?: { name: string } | null;
  held_item?: { name: string } | null;
  known_move?: { name: string } | null;
  known_move_type?: { name: string } | null;
  location?: { name: string } | null;
  min_happiness?: number | null;
  min_beauty?: number | null;
  min_affection?: number | null;
  gender?: number | null;
  relative_physical_stats?: number | null;
  time_of_day?: string;
  trade_species?: { name: string } | null;
  needs_overworld_rain?: boolean;
  turn_upside_down?: boolean;
}): string[] {
  const parts: string[] = [];
  const trig = typeof d.trigger === "string" ? d.trigger : d.trigger?.name;
  const t = trig ?? "level-up";
  if (d.min_level != null && t === "level-up") parts.push(`Lv. ${d.min_level}`);
  if (d.item) parts.push(`use ${formatName(d.item.name)}`);
  if (d.held_item) parts.push(`holding ${formatName(d.held_item.name)}`);
  if (d.known_move) parts.push(`knows ${formatName(d.known_move.name)}`);
  if (d.known_move_type) parts.push(`knows a ${formatName(d.known_move_type.name)}-type move`);
  if (d.location) parts.push(`at ${formatName(d.location.name)}`);
  if (d.min_happiness != null) parts.push(`high friendship (${d.min_happiness}+)`);
  if (d.min_affection != null) parts.push(`affection ${d.min_affection}+`);
  if (d.min_beauty != null) parts.push(`beauty ${d.min_beauty}+`);
  if (d.gender === 1) parts.push("♀ only");
  if (d.gender === 2) parts.push("♂ only");
  if (d.relative_physical_stats === 1) parts.push("Atk > Def");
  if (d.relative_physical_stats === -1) parts.push("Atk < Def");
  if (d.relative_physical_stats === 0) parts.push("Atk = Def");
  if (d.time_of_day) parts.push(d.time_of_day);
  if (d.trade_species) parts.push(`trade for ${formatName(d.trade_species.name)}`);
  else if (t === "trade") parts.push("trade");
  if (d.needs_overworld_rain) parts.push("in rain");
  if (d.turn_upside_down) parts.push("hold console upside-down");
  if (t !== "level-up" && !d.item && !parts.length) parts.push(formatName(t));
  if (!parts.length) parts.push("level up");
  return parts;
}
