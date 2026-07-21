import { useSyncExternalStore } from 'react'

function createStore<T>(key: string, initial: T, valid: (v: unknown) => boolean) {
  let value: T = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) {
      const parsed: unknown = JSON.parse(raw)
      if (valid(parsed)) value = parsed as T
    }
  } catch {
    value = initial
  }
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set(next: T | ((prev: T) => T)) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        void 0
      }
      listeners.forEach(l => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    }
  }
}

export type Theme = 'system' | 'dark' | 'light'

const isIdArray = (v: unknown) => Array.isArray(v) && v.every(n => typeof n === 'number')

export const settingsStore = createStore<{ theme: Theme }>('pdx-settings', { theme: 'system' }, v =>
  typeof v === 'object' && v !== null && ['system', 'dark', 'light'].includes((v as { theme?: string }).theme ?? '')
)
export const favoritesStore = createStore<number[]>('pdx-favorites', [], isIdArray)
export const teamStore = createStore<number[]>('pdx-team', [], isIdArray)

export function useSettings() {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get)
}

export function useFavorites() {
  const favs = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.get)
  const toggle = (id: number) =>
    favoritesStore.set(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  return { favs, isFav: (id: number) => favs.includes(id), toggle }
}

export const TEAM_MAX = 6

export function useTeam() {
  const team = useSyncExternalStore(teamStore.subscribe, teamStore.get)
  return {
    team,
    inTeam: (id: number) => team.includes(id),
    add: (id: number) =>
      teamStore.set(prev => (prev.includes(id) || prev.length >= TEAM_MAX ? prev : [...prev, id])),
    remove: (id: number) => teamStore.set(prev => prev.filter(x => x !== id)),
    setTeam: (ids: number[]) => teamStore.set(ids.slice(0, TEAM_MAX)),
    clear: () => teamStore.set([])
  }
}

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme() {
  const { theme } = settingsStore.get()
  const dark = theme === 'dark' || (theme === 'system' && systemDark())
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function initTheme() {
  applyTheme()
  settingsStore.subscribe(applyTheme)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
}

export function cycleTheme() {
  const order: Theme[] = ['system', 'dark', 'light']
  const cur = settingsStore.get().theme
  settingsStore.set({ theme: order[(order.indexOf(cur) + 1) % order.length] })
}
