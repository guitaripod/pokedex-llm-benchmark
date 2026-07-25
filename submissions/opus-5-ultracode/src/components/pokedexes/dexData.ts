import { useMemo } from 'react'
import { useDex, typeSlug } from '@/lib/dex'
import type { PokemonIndexEntry } from '@/types/data'

export interface PokedexEntryRecord {
  entryNumber: number
  speciesId: number
  name: string
  label: string
  pokemonId: number
  types: number[]
}

/** Shape of `/data/pokedex/{id}.json`. */
export interface PokedexFile {
  id: number
  name: string
  label: string
  regionId: number | null
  isMainSeries: boolean
  description: string | null
  versionGroupIds: number[]
  entries: PokedexEntryRecord[]
}

export interface DexMember {
  entryNumber: number
  entry: PokemonIndexEntry
}

/// Groups the boot-loaded national index by pokédex id using each species' regional dex numbers,
/// which lets the index page show membership and progress without fetching 35 dex files.
export function useDexMembers(): Map<number, DexMember[]> {
  const dex = useDex()
  return useMemo(() => {
    const grouped = new Map<number, DexMember[]>()
    for (const entry of dex.entries) {
      if (!entry.isDefault) continue
      for (const [pokedexId, entryNumber] of entry.dexNumbers) {
        const list = grouped.get(pokedexId)
        if (list) list.push({ entryNumber, entry })
        else grouped.set(pokedexId, [{ entryNumber, entry }])
      }
    }
    for (const list of grouped.values()) list.sort((a, b) => a.entryNumber - b.entryNumber)
    return grouped
  }, [dex])
}

export function accentForType(typeId: number | undefined): string {
  return typeId === undefined ? 'var(--type-normal)' : `var(--type-${typeSlug(typeId)})`
}

/// Picks the most frequent primary type in a set of type lists so a collection can tint itself.
export function dominantTypeId(typeLists: number[][]): number | undefined {
  const tally = new Map<number, number>()
  for (const types of typeLists) {
    const primary = types[0]
    if (primary === undefined) continue
    tally.set(primary, (tally.get(primary) ?? 0) + 1)
  }
  let best: number | undefined
  let bestCount = 0
  for (const [typeId, count] of tally) {
    if (count > bestCount) {
      best = typeId
      bestCount = count
    }
  }
  return best
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}
