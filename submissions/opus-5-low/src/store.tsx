import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from './lib/hooks'

type Store = {
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  favorites: number[]
  toggleFavorite: (id: number) => void
  isFavorite: (id: number) => boolean
  team: (number | null)[]
  setTeam: (t: (number | null)[] | ((p: (number | null)[]) => (number | null)[])) => void
  compare: number[]
  toggleCompare: (id: number) => void
  shiny: boolean
  setShiny: (v: boolean) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('pdx.theme', 'dark')
  const [favorites, setFavorites] = useLocalStorage<number[]>('pdx.favorites', [])
  const [team, setTeam] = useLocalStorage<(number | null)[]>('pdx.team', [null, null, null, null, null, null])
  const [compare, setCompare] = useLocalStorage<number[]>('pdx.compare', [])
  const [shiny, setShiny] = useLocalStorage<boolean>('pdx.shiny', false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo<Store>(() => ({
    theme,
    setTheme,
    favorites,
    toggleFavorite: (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    isFavorite: (id) => favorites.includes(id),
    team,
    setTeam,
    compare,
    toggleCompare: (id) =>
      setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 6 ? c : [...c, id])),
    shiny,
    setShiny,
  }), [theme, setTheme, favorites, setFavorites, team, setTeam, compare, setCompare, shiny, setShiny])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
