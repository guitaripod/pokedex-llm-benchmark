import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { load } from './data'
import { TYPE_SLUG_BY_ID } from './game'
import type { MetaData, PokemonIndexEntry, TypeInfo } from '@/types/data'

export interface Dex {
  meta: MetaData
  entries: PokemonIndexEntry[]
  byId: Map<number, PokemonIndexEntry>
  bySlug: Map<string, PokemonIndexEntry>
  /** Default (non-form) Pokémon for each species id. */
  defaultBySpecies: Map<number, PokemonIndexEntry>
  typeById: Map<number, TypeInfo>
  typeBySlug: Map<string, TypeInfo>
  nameOf: (kind: MetaListKey, id: number | null | undefined) => string
  labelFor: (id: number) => string
}

type MetaListKey =
  | 'types'
  | 'generations'
  | 'versions'
  | 'versionGroups'
  | 'regions'
  | 'pokedexes'
  | 'stats'
  | 'natures'
  | 'growthRates'
  | 'eggGroups'
  | 'habitats'
  | 'shapes'
  | 'colors'
  | 'damageClasses'
  | 'moveTargets'
  | 'moveMethods'
  | 'moveAilments'
  | 'moveCategories'
  | 'moveFlags'
  | 'itemPockets'
  | 'itemCategories'
  | 'itemAttributes'
  | 'itemFlingEffects'
  | 'encounterMethods'
  | 'encounterConditions'
  | 'encounterConditionValues'
  | 'evolutionTriggers'
  | 'contestTypes'
  | 'berryFirmnesses'
  | 'berryFlavors'
  | 'palParkAreas'

const DexContext = createContext<Dex | null>(null)

export function useDex(): Dex {
  const value = useContext(DexContext)
  if (!value) throw new Error('useDex must be used inside <DexProvider>')
  return value
}

export function typeSlug(id: number): string {
  return TYPE_SLUG_BY_ID[id] ?? 'unknown'
}

function buildDex(meta: MetaData, entries: PokemonIndexEntry[]): Dex {
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  const bySlug = new Map(entries.map((entry) => [entry.name, entry]))
  const defaultBySpecies = new Map<number, PokemonIndexEntry>()
  for (const entry of entries) {
    if (entry.isDefault || !defaultBySpecies.has(entry.speciesId)) {
      defaultBySpecies.set(entry.speciesId, entry)
    }
  }

  const typeById = new Map(meta.types.map((type) => [type.id, type]))
  const typeBySlug = new Map(meta.types.map((type) => [type.name, type]))

  const lookups = new Map<MetaListKey, Map<number, string>>()
  const lookupFor = (kind: MetaListKey) => {
    let map = lookups.get(kind)
    if (!map) {
      const list = (meta[kind] ?? []) as { id: number; label: string }[]
      map = new Map(list.map((item) => [item.id, item.label]))
      lookups.set(kind, map)
    }
    return map
  }

  return {
    meta,
    entries,
    byId,
    bySlug,
    defaultBySpecies,
    typeById,
    typeBySlug,
    nameOf: (kind, id) => (id == null ? '—' : (lookupFor(kind).get(id) ?? '—')),
    labelFor: (id) => byId.get(id)?.label ?? `#${id}`,
  }
}

export function DexProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [state, setState] = useState<{ meta: MetaData; entries: PokemonIndexEntry[] } | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([load.meta(), load.pokemonIndex()])
      .then(([meta, index]) => {
        if (!cancelled) setState({ meta, entries: index.entries })
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const dex = useMemo(() => (state ? buildDex(state.meta, state.entries) : null), [state])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-display text-xl">The dex could not be loaded.</p>
        <p className="text-sm text-dim">{error.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 rounded-chip border border-line px-4 py-2 text-sm hover:bg-raised"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!dex) return <>{fallback}</>

  return <DexContext.Provider value={dex}>{children}</DexContext.Provider>
}
