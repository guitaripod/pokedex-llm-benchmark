const REGION_ACCENT: Record<number, string> = {
  1: 'var(--type-fire)',
  2: 'var(--type-electric)',
  3: 'var(--type-grass)',
  4: 'var(--type-ice)',
  5: 'var(--type-dark)',
  6: 'var(--type-fairy)',
  7: 'var(--type-water)',
  8: 'var(--type-steel)',
  9: 'var(--type-ghost)',
  10: 'var(--type-poison)',
  11: 'var(--type-ground)',
}

export const UNASSIGNED_TAB = 'other'
export const ALL_TAB = 'all'

/// Gives every region a stable signature colour so the atlas reads as a map legend.
export function regionAccent(regionId: number | null | undefined): string {
  if (regionId == null) return 'var(--type-normal)'
  return REGION_ACCENT[regionId] ?? 'var(--type-normal)'
}

/// Turns `generation-iv` into the bare `IV` used by the compact generation chips.
export function generationNumeral(name: string): string {
  return name.replace('generation-', '').toUpperCase()
}
