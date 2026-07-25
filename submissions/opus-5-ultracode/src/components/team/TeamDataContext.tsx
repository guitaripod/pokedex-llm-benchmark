import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAsync } from '@/lib/data'
import type { AbilityIndexEntry, ItemIndexEntry, MoveIndexEntry } from '@/types/data'

export interface IndexBundle<T> {
  entries: T[] | undefined
  byId: Map<number, T> | null
  loading: boolean
  error: Error | undefined
  request: () => void
}

export interface TeamData {
  abilities: IndexBundle<AbilityIndexEntry>
  items: IndexBundle<ItemIndexEntry>
  moves: IndexBundle<MoveIndexEntry>
}

const TeamDataContext = createContext<TeamData | null>(null)

export function TeamDataProvider({ value, children }: { value: TeamData; children: ReactNode }) {
  return <TeamDataContext.Provider value={value}>{children}</TeamDataContext.Provider>
}

export function useTeamData(): TeamData {
  const value = useContext(TeamDataContext)
  if (!value) throw new Error('useTeamData must be used inside <TeamDataProvider>')
  return value
}

/// Defers a large index fetch until the roster references it or a picker explicitly asks for it.
export function useIndexBundle<T extends { id: number }>(
  key: string,
  loader: () => Promise<{ entries: T[] }>,
  needed: boolean,
): IndexBundle<T> {
  const [requested, setRequested] = useState(false)
  const armed = needed || requested
  const state = useAsync(armed ? key : null, loader)

  const byId = useMemo(
    () => (state.data ? new Map(state.data.entries.map((entry) => [entry.id, entry])) : null),
    [state.data],
  )

  const request = useCallback(() => setRequested(true), [])

  return { entries: state.data?.entries, byId, loading: state.loading, error: state.error, request }
}
