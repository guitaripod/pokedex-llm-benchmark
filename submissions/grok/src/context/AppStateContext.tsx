import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Pokemon } from '../types/pokemon'

interface AppState {
  // Filters (synced via useUrlState but lifted here for simplicity in future)
  // Collection
  caught: Set<number>
  shinyCaught: Set<number>
  // Compare
  compareList: Pokemon[]
  // UI state
  shinyMode: boolean
  // Actions
  toggleCaught: (id: number) => void
  toggleShinyCaught: (id: number) => void
  addToCompare: (pokemon: Pokemon) => void
  removeFromCompare: (id: number) => void
  clearCompare: () => void
  setShinyMode: (val: boolean) => void
}

const AppStateContext = createContext<AppState | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [caught, setCaught] = useState<Set<number>>(new Set())
  const [shinyCaught, setShinyCaught] = useState<Set<number>>(new Set())
  const [compareList, setCompareList] = useState<Pokemon[]>([])
  const [shinyMode, setShinyMode] = useState(false)

  useEffect(() => {
    try {
      const c = localStorage.getItem('pokedex-caught')
      if (c) setCaught(new Set(JSON.parse(c)))
      const s = localStorage.getItem('pokedex-shiny')
      if (s) setShinyCaught(new Set(JSON.parse(s)))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('pokedex-caught', JSON.stringify([...caught]))
  }, [caught])

  useEffect(() => {
    localStorage.setItem('pokedex-shiny', JSON.stringify([...shinyCaught]))
  }, [shinyCaught])

  const toggleCaught = (id: number) => {
    setCaught(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleShinyCaught = (id: number) => {
    setShinyCaught(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const addToCompare = (pokemon: Pokemon) => {
    setCompareList(prev => {
      if (prev.length >= 4 || prev.some(p => p.id === pokemon.id)) return prev
      return [...prev, pokemon]
    })
  }

  const removeFromCompare = (id: number) => {
    setCompareList(prev => prev.filter(p => p.id !== id))
  }

  const clearCompare = () => setCompareList([])

  const value: AppState = {
    caught,
    shinyCaught,
    compareList,
    shinyMode,
    toggleCaught,
    toggleShinyCaught,
    addToCompare,
    removeFromCompare,
    clearCompare,
    setShinyMode,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}
