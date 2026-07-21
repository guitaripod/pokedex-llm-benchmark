import type { TypesData } from './types'

export function defenseProfile(defTypes: string[], td: TypesData): Record<string, number> {
  const out: Record<string, number> = {}
  for (let a = 0; a < td.order.length; a++) {
    let mult = 1
    for (const dt of defTypes) {
      const di = td.order.indexOf(dt)
      if (di >= 0) mult *= td.matrix[a][di]
    }
    out[td.order[a]] = mult
  }
  return out
}

export function offenseProfile(attType: string, td: TypesData): Record<string, number> {
  const ai = td.order.indexOf(attType)
  const out: Record<string, number> = {}
  if (ai < 0) return out
  for (let d = 0; d < td.order.length; d++) out[td.order[d]] = td.matrix[ai][d]
  return out
}

export interface WeaknessBuckets {
  x4: string[]
  x2: string[]
  half: string[]
  quarter: string[]
  immune: string[]
}

export function weaknessBuckets(profile: Record<string, number>): WeaknessBuckets {
  const b: WeaknessBuckets = { x4: [], x2: [], half: [], quarter: [], immune: [] }
  for (const [type, m] of Object.entries(profile)) {
    if (m === 4) b.x4.push(type)
    else if (m === 2) b.x2.push(type)
    else if (m === 0.5) b.half.push(type)
    else if (m === 0.25) b.quarter.push(type)
    else if (m === 0) b.immune.push(type)
  }
  return b
}

export function multLabel(m: number): string {
  if (m === 0.5) return '½'
  if (m === 0.25) return '¼'
  if (m === 0) return '0'
  return `${m}`
}
