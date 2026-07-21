import { useEffect, useState } from 'react'
import type { SortKey } from '../types/pokemon'

export interface FilterState {
  search: string
  activeTypes: string[]
  currentGen: string
  sortKey: SortKey
  showFavoritesOnly: boolean
  onlySpecial: boolean
  minBst: number
  abilityFilter: string
}

const DEFAULTS: FilterState = {
  search: '',
  activeTypes: [],
  currentGen: 'all',
  sortKey: 'id-asc',
  showFavoritesOnly: false,
  onlySpecial: false,
  minBst: 0,
  abilityFilter: '',
}

function parseFromUrl(): FilterState {
  const params = new URLSearchParams(window.location.search)
  const typesParam = params.get('types')
  return {
    search: params.get('q') || '',
    activeTypes: typesParam ? typesParam.split(',').filter(Boolean) : [],
    currentGen: params.get('gen') || 'all',
    sortKey: (params.get('sort') as SortKey) || 'id-asc',
    showFavoritesOnly: params.get('fav') === '1',
    onlySpecial: params.get('special') === '1',
    minBst: parseInt(params.get('bst') || '0', 10) || 0,
    abilityFilter: params.get('ability') || '',
  }
}

function toSearchParams(state: FilterState): string {
  const p = new URLSearchParams()
  if (state.search) p.set('q', state.search)
  if (state.activeTypes.length) p.set('types', state.activeTypes.join(','))
  if (state.currentGen !== 'all') p.set('gen', state.currentGen)
  if (state.sortKey !== 'id-asc') p.set('sort', state.sortKey)
  if (state.showFavoritesOnly) p.set('fav', '1')
  if (state.onlySpecial) p.set('special', '1')
  if (state.minBst > 0) p.set('bst', String(state.minBst))
  if (state.abilityFilter) p.set('ability', state.abilityFilter)
  return p.toString()
}

export function useUrlState() {
  const [state, setState] = useState<FilterState>(() => {
    // Only parse on client
    if (typeof window === 'undefined') return DEFAULTS
    return parseFromUrl()
  })

  useEffect(() => {
    const qs = toSearchParams(state)
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [state])

  const update = (partial: Partial<FilterState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }

  const reset = () => setState(DEFAULTS)

  return { state, update, reset, setState }
}
