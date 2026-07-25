import { useEffect, useRef, useState } from 'react'
import type {
  AbilityDetail,
  AbilityIndex,
  ItemDetail,
  ItemIndex,
  LocationAreaLookup,
  LocationDetail,
  LocationIndex,
  MetaData,
  MoveDetail,
  MoveIndex,
  PokemonDetail,
  PokemonIndex,
  SearchIndex,
} from '@/types/data'

const BASE = '/data'

const memory = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

export class DataError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`Failed to load ${path} (${status})`)
    this.name = 'DataError'
  }
}

export function loadJson<T>(path: string): Promise<T> {
  const cached = memory.get(path)
  if (cached) return Promise.resolve(cached as T)
  const pending = inflight.get(path)
  if (pending) return pending as Promise<T>

  const request = fetch(`${BASE}/${path}`, { headers: { accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new DataError(path, response.status)
      return response.json() as Promise<T>
    })
    .then((value) => {
      memory.set(path, value)
      inflight.delete(path)
      return value
    })
    .catch((error) => {
      inflight.delete(path)
      throw error
    })

  inflight.set(path, request)
  return request
}

export function peekJson<T>(path: string): T | undefined {
  return memory.get(path) as T | undefined
}

export const load = {
  meta: () => loadJson<MetaData>('meta.json'),
  pokemonIndex: () => loadJson<PokemonIndex>('pokemon-index.json'),
  pokemon: (id: number) => loadJson<PokemonDetail>(`pokemon/${id}.json`),
  moveIndex: () => loadJson<MoveIndex>('moves-index.json'),
  move: (id: number) => loadJson<MoveDetail>(`moves/${id}.json`),
  itemIndex: () => loadJson<ItemIndex>('items-index.json'),
  item: (id: number) => loadJson<ItemDetail>(`items/${id}.json`),
  abilityIndex: () => loadJson<AbilityIndex>('abilities-index.json'),
  ability: (id: number) => loadJson<AbilityDetail>(`abilities/${id}.json`),
  locationIndex: () => loadJson<LocationIndex>('locations-index.json'),
  location: (id: number) => loadJson<LocationDetail>(`locations/${id}.json`),
  locationAreas: () => loadJson<LocationAreaLookup>('location-areas.json'),
  pokedex: <T>(id: number) => loadJson<T>(`pokedex/${id}.json`),
  search: () => loadJson<SearchIndex>('search-index.json'),
}

export interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
}

/// Runs a data loader whose identity is captured by `key`, cancelling stale results on key change.
export function useAsync<T>(key: string | null, loader: () => Promise<T>): AsyncState<T> {
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const [state, setState] = useState<AsyncState<T>>(() => ({
    data: undefined,
    error: undefined,
    loading: key !== null,
  }))

  useEffect(() => {
    if (key === null) {
      setState({ data: undefined, error: undefined, loading: false })
      return
    }
    let cancelled = false
    setState({ data: undefined, error: undefined, loading: true })
    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ data: undefined, error, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return state
}

/** Warms the cache for records the user is likely to open next. */
export function prefetch(paths: string[]) {
  for (const path of paths) {
    if (!memory.has(path) && !inflight.has(path)) void loadJson(path).catch(() => undefined)
  }
}
