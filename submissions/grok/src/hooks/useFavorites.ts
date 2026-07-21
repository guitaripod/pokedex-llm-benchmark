import { useState, useEffect } from 'react'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pokedex-favorites')
      if (saved) setFavorites(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('pokedex-favorites', JSON.stringify([...favorites]))
  }, [favorites])

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isFavorite = (id: number) => favorites.has(id)

  return { favorites, toggleFavorite, isFavorite, setFavorites }
}
