import type { MachineInfo, VersionGroupInfo } from '@/types/data'

export type MachineKind = 'tm' | 'hm' | 'tr'

const MACHINE_SLUG = /^(tm|hm|tr)(\d+)$/

/** Pocket id → the type colour the pocket borrows for its accent tint. */
export const POCKET_ACCENT: Record<number, string> = {
  1: 'var(--type-normal)',
  2: 'var(--type-psychic)',
  3: 'var(--type-fighting)',
  4: 'var(--type-steel)',
  5: 'var(--type-grass)',
  6: 'var(--type-flying)',
  7: 'var(--type-fire)',
  8: 'var(--type-electric)',
}

export function pocketAccent(pocketId: number | null): string {
  if (pocketId == null) return 'var(--type-normal)'
  return POCKET_ACCENT[pocketId] ?? 'var(--type-normal)'
}

export function machineKind(slug: string): MachineKind | null {
  const match = MACHINE_SLUG.exec(slug)
  return match ? (match[1] as MachineKind) : null
}

export function machineNumber(slug: string): number | null {
  const match = MACHINE_SLUG.exec(slug)
  return match ? Number(match[2]) : null
}

/// A machine item teaches a different move in every era, so the newest version group carries the
/// identity players recognise — TM01 is Hone Claws today, not the Mega Punch of Red and Blue.
export function latestMachineMoveByItem(
  machines: MachineInfo[],
  versionGroups: VersionGroupInfo[],
): Map<number, number> {
  const order = new Map(versionGroups.map((group) => [group.id, group.order]))
  const best = new Map<number, { rank: number; moveId: number }>()
  for (const machine of machines) {
    const rank = order.get(machine.versionGroupId) ?? 0
    const current = best.get(machine.itemId)
    if (!current || rank > current.rank) best.set(machine.itemId, { rank, moveId: machine.moveId })
  }
  const result = new Map<number, number>()
  for (const [itemId, value] of best) result.set(itemId, value.moveId)
  return result
}

export function formatCost(cost: number): string {
  return cost === 0 ? '—' : `₽${cost.toLocaleString('en-US')}`
}

/** Kind order used to keep TMs, HMs and TRs in separate blocks inside a machine list. */
export const MACHINE_KIND_RANK: Record<MachineKind, number> = { tm: 0, hm: 1, tr: 2 }
