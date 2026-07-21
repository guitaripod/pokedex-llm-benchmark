import { useState, useEffect, useCallback } from 'react'
import type { Pokemon } from '../types/pokemon'

export interface SavedTeam {
  id: string
  name: string
  members: Pokemon[]
}

const STORAGE_KEY = 'pokedex-teams'

export function useTeams() {
  const [teams, setTeams] = useState<SavedTeam[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: SavedTeam[] = JSON.parse(saved)
        setTeams(parsed)
        if (parsed.length > 0) setActiveTeamId(parsed[0].id)
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams))
  }, [teams])

  const activeTeam = teams.find(t => t.id === activeTeamId) || null

  const createTeam = useCallback((name?: string) => {
    const newTeam: SavedTeam = {
      id: 'team-' + Date.now().toString(36),
      name: name || `Team ${teams.length + 1}`,
      members: [],
    }
    setTeams(prev => [...prev, newTeam])
    setActiveTeamId(newTeam.id)
    return newTeam.id
  }, [teams.length])

  const deleteTeam = useCallback((id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id))
    if (activeTeamId === id) {
      const remaining = teams.filter(t => t.id !== id)
      setActiveTeamId(remaining.length > 0 ? remaining[0].id : null)
    }
  }, [activeTeamId, teams])

  const renameTeam = useCallback((id: string, name: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t))
  }, [])

  const setActive = useCallback((id: string | null) => {
    setActiveTeamId(id)
  }, [])

  const addPokemonToActive = useCallback((pokemon: Pokemon) => {
    if (!activeTeamId) {
      const newId = createTeam()
      // after create, add
      setTimeout(() => {
        setTeams(prev => prev.map(t =>
          t.id === newId
            ? { ...t, members: [...t.members.filter(m => m.id !== pokemon.id), pokemon].slice(0, 6) }
            : t
        ))
      }, 0)
      return
    }
    setTeams(prev => prev.map(t => {
      if (t.id !== activeTeamId) return t
      const exists = t.members.some(m => m.id === pokemon.id)
      if (exists) return t
      return {
        ...t,
        members: [...t.members, pokemon].slice(0, 6)
      }
    }))
  }, [activeTeamId, createTeam])

  const removePokemonFromActive = useCallback((id: number) => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t =>
      t.id === activeTeamId
        ? { ...t, members: t.members.filter(m => m.id !== id) }
        : t
    ))
  }, [activeTeamId])

  const clearActive = useCallback(() => {
    if (!activeTeamId) return
    setTeams(prev => prev.map(t => t.id === activeTeamId ? { ...t, members: [] } : t))
  }, [activeTeamId])

  const getActiveMembers = useCallback((): Pokemon[] => {
    return activeTeam?.members || []
  }, [activeTeam])

  return {
    teams,
    activeTeam,
    activeTeamId,
    createTeam,
    deleteTeam,
    renameTeam,
    setActive,
    addPokemonToActive,
    removePokemonFromActive,
    clearActive,
    getActiveMembers,
  }
}
