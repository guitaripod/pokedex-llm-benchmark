import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'system'
export type SpriteStyle = 'artwork' | 'home' | 'showdown' | 'game'
export type CardDensity = 'comfortable' | 'compact'

export interface TeamSlot {
  pokemonId: number
  level: number
  natureId: number | null
  abilityId: number | null
  itemId: number | null
  moveIds: (number | null)[]
  ivs: [number, number, number, number, number, number]
  evs: [number, number, number, number, number, number]
  shiny: boolean
  nickname: string | null
}

export function emptySlot(pokemonId: number): TeamSlot {
  return {
    pokemonId,
    level: 50,
    natureId: null,
    abilityId: null,
    itemId: null,
    moveIds: [null, null, null, null],
    ivs: [31, 31, 31, 31, 31, 31],
    evs: [0, 0, 0, 0, 0, 0],
    shiny: false,
    nickname: null,
  }
}

interface Settings {
  theme: ThemeMode
  spriteStyle: SpriteStyle
  shiny: boolean
  density: CardDensity
  language: string
  animateSprites: boolean
  showDexNumbers: boolean
  preferredVersionGroup: number | null
}

interface AppState extends Settings {
  favorites: number[]
  caught: number[]
  team: (TeamSlot | null)[]
  compare: number[]
  recent: number[]

  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  toggleFavorite: (id: number) => void
  toggleCaught: (id: number) => void
  clearCaught: () => void
  setTeamSlot: (index: number, slot: TeamSlot | null) => void
  updateTeamSlot: (index: number, patch: Partial<TeamSlot>) => void
  addToTeam: (pokemonId: number) => number
  clearTeam: () => void
  toggleCompare: (id: number) => void
  clearCompare: () => void
  pushRecent: (id: number) => void
}

const MAX_RECENT = 24
const MAX_COMPARE = 6

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      spriteStyle: 'artwork',
      shiny: false,
      density: 'comfortable',
      language: 'en',
      animateSprites: true,
      showDexNumbers: true,
      preferredVersionGroup: null,

      favorites: [],
      caught: [],
      team: [null, null, null, null, null, null],
      compare: [],
      recent: [],

      setSetting: (key, value) => set({ [key]: value } as Partial<AppState>),

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),

      toggleCaught: (id) =>
        set((state) => ({
          caught: state.caught.includes(id) ? state.caught.filter((c) => c !== id) : [...state.caught, id],
        })),

      clearCaught: () => set({ caught: [] }),

      setTeamSlot: (index, slot) =>
        set((state) => {
          const team = [...state.team]
          team[index] = slot
          return { team }
        }),

      updateTeamSlot: (index, patch) =>
        set((state) => {
          const team = [...state.team]
          const current = team[index]
          if (!current) return {}
          team[index] = { ...current, ...patch }
          return { team }
        }),

      addToTeam: (pokemonId) => {
        const team = [...get().team]
        const index = team.findIndex((slot) => slot === null)
        const target = index === -1 ? team.length - 1 : index
        team[target] = emptySlot(pokemonId)
        set({ team })
        return target
      },

      clearTeam: () => set({ team: [null, null, null, null, null, null] }),

      toggleCompare: (id) =>
        set((state) => {
          if (state.compare.includes(id)) return { compare: state.compare.filter((c) => c !== id) }
          if (state.compare.length >= MAX_COMPARE) return { compare: [...state.compare.slice(1), id] }
          return { compare: [...state.compare, id] }
        }),

      clearCompare: () => set({ compare: [] }),

      pushRecent: (id) =>
        set((state) => ({
          recent: [id, ...state.recent.filter((r) => r !== id)].slice(0, MAX_RECENT),
        })),
    }),
    {
      name: 'pokedex-ultracode',
      version: 2,
      partialize: (state) => ({
        theme: state.theme,
        spriteStyle: state.spriteStyle,
        shiny: state.shiny,
        density: state.density,
        language: state.language,
        animateSprites: state.animateSprites,
        showDexNumbers: state.showDexNumbers,
        preferredVersionGroup: state.preferredVersionGroup,
        favorites: state.favorites,
        caught: state.caught,
        team: state.team,
        compare: state.compare,
        recent: state.recent,
      }),
    },
  ),
)

export const useIsFavorite = (id: number) => useApp((state) => state.favorites.includes(id))
export const useIsCaught = (id: number) => useApp((state) => state.caught.includes(id))

/// Applies the persisted theme choice to the document root, following the OS when set to `system`.
export function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = mode === 'dark' || (mode === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#0a0d14' : '#f5f4f1')
}
