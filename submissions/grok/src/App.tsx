import { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, Fragment } from 'react'
import { Heart, Search, X, ChevronLeft, ChevronRight, RefreshCw, Plus, Volume2, Sparkles, Star, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import type { Pokemon, SortKey } from './types/pokemon'
import { GEN_RANGES, SORT_OPTIONS, getSprite, getBst } from './types/pokemon'
import { useFavorites } from './hooks/useFavorites'
import { usePokedexData } from './hooks/usePokedexData'
import { useUrlState } from './hooks/useUrlState'
import { useTeams } from './hooks/useTeams'

import { PokemonCard } from './components/PokemonCard'
import { StatBar } from './components/StatBar'
import { TypeBadge } from './components/TypeBadge'
import { TeamLab } from './components/TeamLab'
import { StatRadar } from './components/StatRadar'
import { Filters } from './components/Filters'
import { VirtualPokemonGrid } from './components/VirtualPokemonGrid'
import { exportPokemonCard } from './lib/export'

function App() {
  const { state: urlState, update: updateUrl, reset: resetUrl } = useUrlState()
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const pokedex = usePokedexData()
  const teamsHook = useTeams()

  const [search, setSearch] = useState(urlState.search)
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(urlState.activeTypes))
  const [currentGen, setCurrentGen] = useState<'all' | string>(urlState.currentGen)
  const [sortKey, setSortKey] = useState<SortKey>(urlState.sortKey)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(urlState.showFavoritesOnly)

  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [modalPokemon, setModalPokemon] = useState<Pokemon | null>(null)
  const [modalShiny, setModalShiny] = useState(false)
  const [matchups, setMatchups] = useState<any>(null)
  const [shinyMode, setShinyMode] = useState(false)
  const [showTeamLab, setShowTeamLab] = useState(false)
  const [matchupCache, setMatchupCache] = useState<Record<number, any>>({})
  const [encounters, setEncounters] = useState<any[]>([])
  const [onlySpecial, setOnlySpecial] = useState(false)
  const [minBst, setMinBst] = useState(0)
  const [abilityFilter, setAbilityFilter] = useState('')
  const [compareList, setCompareList] = useState<Pokemon[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [caught, setCaught] = useState<Set<number>>(new Set())
  const [shinyCaught, setShinyCaught] = useState<Set<number>>(new Set())

  const searchInputRef = useRef<HTMLInputElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const deferredSearch = useDeferredValue(search)

  // Sync local filter state to URL
  useEffect(() => {
    updateUrl({
      search,
      activeTypes: Array.from(activeTypes),
      currentGen,
      sortKey,
      showFavoritesOnly,
      onlySpecial,
      minBst,
      abilityFilter,
    })
  }, [search, activeTypes, currentGen, sortKey, showFavoritesOnly, onlySpecial, minBst, abilityFilter, updateUrl])

  // Initialize from URL on first load (one-time)
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    if (urlState.search) setSearch(urlState.search)
    if (urlState.activeTypes.length) setActiveTypes(new Set(urlState.activeTypes))
    if (urlState.currentGen !== 'all') setCurrentGen(urlState.currentGen)
    if (urlState.sortKey !== 'id-asc') setSortKey(urlState.sortKey)
    if (urlState.showFavoritesOnly) setShowFavoritesOnly(true)
    if (urlState.onlySpecial) setOnlySpecial(true)
    if (urlState.minBst > 0) setMinBst(urlState.minBst)
    if (urlState.abilityFilter) setAbilityFilter(urlState.abilityFilter)
  }, [urlState])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTeamLab) setShowTeamLab(false)
        else if (selectedPokemon) closeModal()
      } else if (e.key === '/' && !selectedPokemon && !showTeamLab) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowTeamLab(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPokemon, showTeamLab])

  const { allPokemon, isLoading, hasMore, error, setError, loadInitial, loadMore, ensureDataForGen, fetchTypeMatchups, enrichPokemon, totalAvailable } = pokedex

  // Load initial
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  // Load caught/shiny
  useEffect(() => {
    try {
      const c = localStorage.getItem('pokedex-caught')
      if (c) setCaught(new Set(JSON.parse(c)))
      const s = localStorage.getItem('pokedex-shiny')
      if (s) setShinyCaught(new Set(JSON.parse(s)))
    } catch {}
  }, [])
  useEffect(() => { localStorage.setItem('pokedex-caught', JSON.stringify([...caught])) }, [caught])
  useEffect(() => { localStorage.setItem('pokedex-shiny', JSON.stringify([...shinyCaught])) }, [shinyCaught])

  const playCry = useCallback((p: Pokemon) => {
    const url = p.cries?.latest || p.cries?.legacy
    if (!url) {
      toast.error('No cry available')
      return
    }
    const audio = new Audio(url)
    audio.addEventListener('error', () => toast.error('Could not play cry'), { once: true })
    audio.play().catch(() => {})
  }, [])

  const toggleType = (type: string) => {
    const next = new Set(activeTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setActiveTypes(next)
  }

  const clearTypes = () => setActiveTypes(new Set())

  const toggleFavoritesView = () => {
    const next = !showFavoritesOnly
    setShowFavoritesOnly(next)
    if (next) {
      setSearch('')
      setActiveTypes(new Set())
      setCurrentGen('all')
    }
  }

  const changeSort = () => {
    const currentIdx = SORT_OPTIONS.findIndex(o => o.value === sortKey)
    const next = SORT_OPTIONS[(currentIdx + 1) % SORT_OPTIONS.length].value
    setSortKey(next)
  }

  const filtered = useMemo(() => {
    let result = [...allPokemon]

    const range = GEN_RANGES[currentGen]
    if (range) {
      result = result.filter(p => p.id >= range[0] && p.id <= range[1])
    }

    if (deferredSearch) {
      const term = deferredSearch.trim().toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        String(p.id).includes(term)
      )
    }

    if (activeTypes.size > 0) {
      result = result.filter(p => {
        const types = p.types.map(t => t.type.name)
        return Array.from(activeTypes).some(t => types.includes(t))
      })
    }

    if (showFavoritesOnly) {
      result = result.filter(p => isFavorite(p.id))
    }

    if (onlySpecial) {
      result = result.filter(p => p.is_legendary || p.is_mythical)
    }

    if (minBst > 0) {
      result = result.filter(p => getBst(p) >= minBst)
    }

    if (abilityFilter) {
      const term = abilityFilter.trim().toLowerCase()
      result = result.filter(p =>
        p.abilities.some(a => a.ability.name.toLowerCase().includes(term))
      )
    }

    result.sort((a, b) => {
      if (sortKey === 'id-asc') return a.id - b.id
      if (sortKey === 'id-desc') return b.id - a.id
      if (sortKey === 'name-asc') return a.name.localeCompare(b.name)
      if (sortKey === 'name-desc') return b.name.localeCompare(a.name)
      if (sortKey === 'hp') {
        const ha = a.stats.find(s => s.stat.name === 'hp')?.base_stat || 0
        const hb = b.stats.find(s => s.stat.name === 'hp')?.base_stat || 0
        return hb - ha
      }
      if (sortKey === 'bst') {
        return getBst(b) - getBst(a)
      }
      return 0
    })

    return result
  }, [allPokemon, deferredSearch, activeTypes, currentGen, sortKey, showFavoritesOnly, isFavorite, onlySpecial, minBst, abilityFilter])

  const openModal = async (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon)
    setModalPokemon(pokemon)
    setModalShiny(false)
    setMatchups(null)

    const enriched = await enrichPokemon(pokemon)
    if (enriched) {
      setModalPokemon(enriched)
    }

    if (pokemon.types?.[0]) {
      const m = await fetchTypeMatchups(pokemon.types[0].type.name)
      if (m) {
        setMatchups(m)
        setMatchupCache(prev => ({ ...prev, [pokemon.id]: m }))
      }
    }

    // lazy encounters
    try {
      const encRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}/encounters`)
      if (encRes.ok) {
        const encData = await encRes.json()
        setEncounters(encData.slice(0, 5)) // top few
      }
    } catch {}
  }

  const closeModal = () => {
    setSelectedPokemon(null)
    setModalPokemon(null)
    setMatchups(null)
    setModalShiny(false)
    setEncounters([])
  }

  const navigateModal = (dir: number) => {
    if (!selectedPokemon) return
    const pool = showFavoritesOnly ? filtered : (filtered.length > 0 ? filtered : allPokemon)
    const idx = pool.findIndex(p => p.id === selectedPokemon.id)
    if (idx === -1) return
    let nextIdx = idx + dir
    if (nextIdx < 0) nextIdx = pool.length - 1
    if (nextIdx >= pool.length) nextIdx = 0
    openModal(pool[nextIdx])
  }

  const retry = () => {
    setError(null)
    loadInitial()
  }

  const displayed = filtered
  const isFavView = showFavoritesOnly
  const resultLabel = isFavView
    ? `${displayed.length} favorite${displayed.length === 1 ? '' : 's'}`
    : `${displayed.length} Pokémon`

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label

  const canShowLoadMore = !showFavoritesOnly && hasMore && !search && activeTypes.size === 0 && currentGen === 'all'

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !canShowLoadMore || pokedex.offset === 0) return
    const el = loadMoreRef.current
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !pokedex.isLoading) {
        void loadMore()
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [canShowLoadMore, pokedex.isLoading, loadMore, pokedex.offset])

  const updateGen = (gen: string) => {
    setCurrentGen(gen as any)
    setShowFavoritesOnly(false)
    if (gen !== 'all') {
      void ensureDataForGen(gen)
    }
  }

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

  const resetFilters = () => {
    setSearch('')
    setActiveTypes(new Set())
    setCurrentGen('all')
    setShowFavoritesOnly(false)
    setSortKey('id-asc')
    setOnlySpecial(false)
    setMinBst(0)
    setAbilityFilter('')
    resetUrl()
  }

  const openRandom = () => {
    const pool = filtered.length > 0 ? filtered : allPokemon
    if (pool.length === 0) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    openModal(pick)
  }

  const displayedForTeam = allPokemon.length > 0 ? allPokemon : []

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0c14]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-x-2 sm:gap-x-3 cursor-pointer min-w-0" onClick={resetFilters} aria-label="Reset all filters">
            <div className="pokeball" />
            <span className="text-2xl sm:text-3xl font-semibold tracking-tighter">Pokédex</span>
          </div>

          <div className="flex-1 max-w-[180px] sm:max-w-md mx-2 sm:mx-4 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5 sm:left-4 sm:top-3 sm:w-4 sm:h-4" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or #"
                className="search-input w-full bg-[#111827] border border-white/10 focus:border-red-500/50 pl-8 sm:pl-11 pr-8 sm:pr-9 py-2 sm:py-2.5 rounded-2xl text-sm placeholder:text-gray-500 outline-none"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); searchInputRef.current?.focus() }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-x-1 sm:gap-x-2">
            <button
              onClick={() => setShowTeamLab(true)}
              aria-label="Open Team Lab"
              className="flex items-center gap-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-medium border border-white/10 hover:bg-white/5"
              title="Team Lab (⌘K)"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Team Lab</span>
            </button>

            <button
              onClick={() => { if (compareList.length > 0) setShowCompare(true); else { toast('Add Pokémon to compare from details modal') } }}
              aria-label="Open Compare"
              className={`flex items-center gap-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-medium border transition ${showCompare || compareList.length > 0 ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'border-white/10 hover:bg-white/5'}`}
              title="Compare Pokémon"
            >
              <span>Compare</span>
              {compareList.length > 0 && <span className="text-[10px] px-1">{compareList.length}</span>}
            </button>

            <button
              onClick={toggleFavoritesView}
              aria-label={showFavoritesOnly ? 'Show all Pokémon' : 'Show favorites only'}
              className={`flex items-center gap-x-1.5 sm:gap-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-medium border transition-colors ${showFavoritesOnly ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 hover:bg-white/5'}`}
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              <span>{favorites.size}</span>
            </button>

            <button
              onClick={() => setShinyMode(!shinyMode)}
              aria-label={shinyMode ? 'Disable shiny mode' : 'Enable shiny mode'}
              className={`flex items-center gap-x-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-medium border transition-colors ${shinyMode ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' : 'border-white/10 hover:bg-white/5'}`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={openRandom}
              aria-label="Open random Pokémon"
              className="flex items-center gap-x-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-medium border border-white/10 hover:bg-white/5"
            >
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="relative">
              <select
                value={currentGen}
                onChange={(e) => updateGen(e.target.value)}
                aria-label="Filter by generation"
                className="appearance-none bg-[#111827] border border-white/10 text-xs sm:text-sm rounded-2xl px-2 sm:px-4 py-1 sm:py-2 pr-6 sm:pr-9 font-medium cursor-pointer hover:border-white/20 focus:outline-none focus:border-red-500/40 max-w-[110px] sm:max-w-none"
              >
                <option value="all">National Dex</option>
                <option value="1">Kanto (1–151)</option>
                <option value="2">Johto (152–251)</option>
                <option value="3">Hoenn (252–386)</option>
                <option value="4">Sinnoh (387–493)</option>
                <option value="5">Unova (494–649)</option>
                <option value="6">Kalos (650–721)</option>
                <option value="7">Alola (722–809)</option>
                <option value="8">Galar (810–905)</option>
                <option value="9">Paldea (906–1025)</option>
              </select>
              <ChevronRight className="w-3 h-3 absolute right-3.5 top-3 rotate-90 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      <Filters
        activeTypes={activeTypes}
        onToggleType={toggleType}
        onClearTypes={clearTypes}
        onlySpecial={onlySpecial}
        onToggleSpecial={() => setOnlySpecial(!onlySpecial)}
        minBst={minBst}
        onToggleMinBst={() => setMinBst(minBst === 0 ? 500 : 0)}
        abilityFilter={abilityFilter}
        onAbilityChange={setAbilityFilter}
      />

      {/* Results header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-1.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-x-2 sm:gap-x-3 text-gray-400">
          <div className="font-medium text-white">{resultLabel}</div>
          <div className="w-px h-3 bg-white/10" />
          <div className="text-[10px] sm:text-xs">{allPokemon.length} / {totalAvailable} loaded</div>
          <div className="w-px h-3 bg-white/10" />
          <div className="text-[10px] text-green-400">Caught: {caught.size} • Shiny: {shinyCaught.size}</div>
        </div>

        <button
          onClick={changeSort}
          aria-label="Change sort order"
          className="flex items-center gap-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#111827] hover:bg-[#1f2937] border border-white/10 rounded-2xl text-[10px] sm:text-xs font-medium transition-colors"
        >
          <span>{currentSortLabel}</span>
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {error && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="text-red-400 mb-3">{error}</div>
            <button onClick={retry} className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {!error && displayed.length === 0 && !isLoading && (
          <div className="text-center py-10 sm:py-16">
            <div className="text-gray-500 mb-2 text-sm">No results found</div>
            {currentGen !== 'all' && (
              <div className="text-[10px] sm:text-xs text-gray-600 mb-3">Load more to reveal this generation</div>
            )}
            <button onClick={resetFilters} className="text-sm text-red-400 hover:text-red-300">Reset filters</button>
          </div>
        )}

        {isLoading && allPokemon.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="bg-[#111827] rounded-3xl overflow-hidden border border-white/5">
                <div className="h-[138px] skeleton" />
                <div className="px-4 pb-4 pt-3">
                  <div className="h-4 w-20 skeleton rounded mb-3" />
                  <div className="flex gap-1.5">
                    <div className="h-4 w-12 skeleton rounded-full" />
                    <div className="h-4 w-12 skeleton rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <VirtualPokemonGrid
            items={displayed}
            rowHeight={170}
            renderItem={(pokemon) => (
              <PokemonCard
                pokemon={pokemon}
                isFavorite={isFavorite(pokemon.id)}
                onClick={() => openModal(pokemon)}
                onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(pokemon.id); }}
                shiny={shinyMode}
                onAddToTeam={showTeamLab ? (p) => teamsHook.addPokemonToActive(p) : undefined}
                canAddToTeam={showTeamLab && teamsHook.getActiveMembers().length < 6}
                isCaught={caught.has(pokemon.id)}
                isShinyCaught={shinyCaught.has(pokemon.id)}
              />
            )}
          />
        )}

        {canShowLoadMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="flex items-center gap-x-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-[#111827] hover:bg-white/5 border border-white/10 rounded-3xl text-sm font-semibold transition-all active:scale-[0.985] disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{isLoading ? 'Loading...' : 'Load more Pokémon'}</span>
            </button>
          </div>
        )}
        {hasMore && !showFavoritesOnly && (
          <div ref={loadMoreRef} className="h-2" />
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {modalPokemon && selectedPokemon && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4" onClick={closeModal}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Pokémon details"
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.985 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-[460px] mx-auto bg-[#111827] rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[90vh] pokemon-modal overflow-hidden"
            >
              <div className="relative px-4 sm:px-6 pt-3 sm:pt-6 pb-1 sm:pb-2 bg-gradient-to-b from-black/40 to-transparent">
                <div className="flex items-center justify-between">
                  <button onClick={closeModal} aria-label="Close details" className="modal-close w-9 h-9 flex items-center justify-center rounded-2xl text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex gap-x-1">
                    <button onClick={() => navigateModal(-1)} aria-label="Previous Pokémon" className="modal-close w-9 h-9 flex items-center justify-center rounded-2xl text-white/70 hover:text-white">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigateModal(1)} aria-label="Next Pokémon" className="modal-close w-9 h-9 flex items-center justify-center rounded-2xl text-white/70 hover:text-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 pb-5 sm:pb-6 -mt-1 flex-1 overflow-y-auto">
                <div className="flex justify-center -mt-2 mb-2">
                  <div className="relative w-40 h-40 sm:w-52 sm:h-52 flex items-center justify-center bg-[#0a0c14] rounded-[2.5rem] sm:rounded-[3rem]">
                    <img
                      src={getSprite(modalPokemon, modalShiny)}
                      className="max-h-[130px] max-w-[130px] sm:max-h-[190px] sm:max-w-[190px] drop-shadow-2xl select-none"
                      alt={modalPokemon.name + (modalShiny ? ' shiny' : '')}
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-xs tracking-[2px] text-red-400 font-semibold flex items-center gap-2">
                      #{String(modalPokemon.id).padStart(3, '0')}
                      {modalPokemon.is_legendary && <span className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-400 rounded">LEGENDARY</span>}
                      {modalPokemon.is_mythical && <span className="text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-400 rounded">MYTHICAL</span>}
                      {modalPokemon.is_baby && <span className="text-[10px] px-1.5 py-0 bg-pink-500/20 text-pink-400 rounded">BABY</span>}
                    </div>
                    <div className="text-4xl font-semibold tracking-tighter capitalize flex items-center gap-2">{modalPokemon.name}</div>
                    {modalPokemon.genus && (
                      <div className="text-sm text-gray-400 mt-0.5">{modalPokemon.genus}</div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => toggleCaught(modalPokemon.id)} className={`text-[10px] px-2 py-0.5 rounded border ${caught.has(modalPokemon.id) ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-white/20'}`}>
                      {caught.has(modalPokemon.id) ? 'CAUGHT' : 'Mark Caught'}
                    </button>
                    <button onClick={() => toggleShinyCaught(modalPokemon.id)} className={`text-[10px] px-2 py-0.5 rounded border ${shinyCaught.has(modalPokemon.id) ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-white/20'}`}>
                      {shinyCaught.has(modalPokemon.id) ? 'SHINY CAUGHT' : 'Mark Shiny'}
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => toggleFavorite(modalPokemon.id)}
                      aria-label={isFavorite(modalPokemon.id) ? 'Remove from favorites' : 'Add to favorites'}
                      className="w-10 h-10 flex items-center justify-center text-2xl text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      <Heart fill={isFavorite(modalPokemon.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => setModalShiny(!modalShiny)} aria-label="Toggle shiny" className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${modalShiny ? 'border-yellow-400 text-yellow-400' : 'border-white/20 text-white/60'}`}>
                      <Sparkles className="w-3 h-3" /> {modalShiny ? 'SHINY' : 'SHINY'}
                    </button>
                    {(modalPokemon.cries?.latest || modalPokemon.cries?.legacy) && (
                      <button onClick={() => playCry(modalPokemon)} aria-label="Play cry" className="text-xs px-2 py-0.5 rounded border border-white/20 text-white/60 flex items-center gap-1 hover:text-white">
                        <Volume2 className="w-3 h-3" /> CRY
                      </button>
                    )}
                    <button
                      onClick={() => teamsHook.addPokemonToActive(modalPokemon)}
                      className="text-xs px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400 flex items-center gap-1 hover:bg-emerald-500/10"
                    >
                      + TEAM
                    </button>
                    <button
                      onClick={() => {
                        if (compareList.length < 4 && !compareList.some(p => p.id === modalPokemon.id)) {
                          setCompareList([...compareList, modalPokemon])
                          setShowCompare(true)
                        }
                      }}
                      className="text-xs px-2 py-0.5 rounded border border-blue-500/40 text-blue-400 flex items-center gap-1 hover:bg-blue-500/10"
                    >
                      + COMPARE
                    </button>
                    <button
                      onClick={() => exportPokemonCard(modalPokemon, modalShiny)}
                      className="text-xs px-2 py-0.5 rounded border border-white/20 text-white/60 flex items-center gap-1 hover:text-white"
                    >
                      PNG
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  {modalPokemon.types.map(t => (
                    <TypeBadge
                      key={t.type.name}
                      type={t.type.name}
                      interactive
                      onClick={() => { closeModal(); setShowFavoritesOnly(false); toggleType(t.type.name) }}
                    />
                  ))}
                </div>

                {modalPokemon.flavor_text && (
                  <div className="text-sm leading-relaxed text-gray-300 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-6">
                    {modalPokemon.flavor_text}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-px">Height</div>
                    <div className="text-xl font-semibold tabular-nums">{(modalPokemon.height / 10).toFixed(1)} m</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-px">Weight</div>
                    <div className="text-xl font-semibold tabular-nums">{(modalPokemon.weight / 10).toFixed(1)} kg</div>
                  </div>
                  {modalPokemon.base_experience !== undefined && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                      <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-px">Base Exp</div>
                      <div className="text-xl font-semibold tabular-nums">{modalPokemon.base_experience}</div>
                    </div>
                  )}
                  {modalPokemon.capture_rate !== undefined && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                      <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-px">Capture Rate</div>
                      <div className="text-xl font-semibold tabular-nums">{modalPokemon.capture_rate}</div>
                    </div>
                  )}
                </div>

                {(modalPokemon.gender_rate !== undefined || modalPokemon.egg_groups?.length || modalPokemon.base_happiness !== undefined) && (
                  <div className="mb-6">
                    <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-2 px-1">Pokédex Data</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {modalPokemon.gender_rate !== undefined && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                          <div className="text-[9px] text-gray-400">Gender</div>
                          {modalPokemon.gender_rate === -1 ? 'Genderless' : (
                            <div>
                              ♂ {(8 - modalPokemon.gender_rate) / 8 * 100}% / ♀ {modalPokemon.gender_rate / 8 * 100}%
                            </div>
                          )}
                        </div>
                      )}
                      {modalPokemon.egg_groups && modalPokemon.egg_groups.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                          <div className="text-[9px] text-gray-400">Egg Groups</div>
                          <div className="capitalize">{modalPokemon.egg_groups.join(', ').replace(/-/g, ' ')}</div>
                        </div>
                      )}
                      {modalPokemon.base_happiness !== undefined && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                          <div className="text-[9px] text-gray-400">Base Happiness</div>
                          <div>{modalPokemon.base_happiness}</div>
                        </div>
                      )}
                      {modalPokemon.growth_rate && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                          <div className="text-[9px] text-gray-400">Growth Rate</div>
                          <div className="capitalize">{modalPokemon.growth_rate.replace(/-/g, ' ')}</div>
                        </div>
                      )}
                      {modalPokemon.hatch_counter !== undefined && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                          <div className="text-[9px] text-gray-400">Hatch Steps</div>
                          <div>{modalPokemon.hatch_counter * 255}</div>
                        </div>
                      )}
                      {modalPokemon.color && (
                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                          <div className="text-[9px] text-gray-400">Color</div>
                          <div className="capitalize">{modalPokemon.color}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-3 px-1 flex justify-between">
                    <span>Base Stats</span>
                    <span className="font-mono">Total {getBst(modalPokemon)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-2 flex-1">
                      {modalPokemon.stats.map(s => {
                        const label = s.stat.name === 'hp' ? 'HP' :
                          s.stat.name === 'attack' ? 'Attack' :
                          s.stat.name === 'defense' ? 'Defense' :
                          s.stat.name === 'special-attack' ? 'Sp. Atk' :
                          s.stat.name === 'special-defense' ? 'Sp. Def' : 'Speed'
                        return <StatBar key={s.stat.name} label={label} value={s.base_stat} />
                      })}
                    </div>
                    <div className="flex-shrink-0 -mt-2 sm:mt-0">
                      <StatRadar stats={modalPokemon.stats} size={150} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-2.5 px-1">Abilities</div>
                  <div className="flex flex-wrap gap-2">
                    {modalPokemon.abilities.map((a) => (
                      <div key={`${a.ability.name}-${a.is_hidden}`} className={`px-3 py-1 text-xs rounded-2xl border ${a.is_hidden ? 'border-white/20 bg-white/5 text-gray-300' : 'border-white/10 bg-white/5'}`}>
                        <span className="capitalize">{a.ability.name.replace('-', ' ')}</span>
                        {a.is_hidden && <span className="ml-1 text-[9px] text-gray-400">(hidden)</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {modalPokemon.levelUpMoves && modalPokemon.levelUpMoves.length > 0 && (
                  <div className="mb-5 mt-2">
                    <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-2 px-1">Level-up Moves</div>
                    <div className="flex flex-wrap gap-1.5">
                      {modalPokemon.levelUpMoves.map((m, i) => (
                        <div key={i} className="px-2 py-0.5 text-[10px] rounded-xl bg-white/5 border border-white/10 capitalize">{m.level ? `${m.level} ` : ''}{m.name.replace(/-/g, ' ')}</div>
                      ))}
                    </div>
                  </div>
                )}
                {modalPokemon.fullMoves && modalPokemon.fullMoves.length > 0 && (
                  <div className="mb-5">
                    <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-2 px-1">Sample Learnset</div>
                    <div className="flex flex-wrap gap-1.5 text-[9px]">
                      {modalPokemon.fullMoves.map((m, i) => (
                        <div key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 capitalize">{m.name.replace(/-/g, ' ')} ({m.method})</div>
                      ))}
                    </div>
                  </div>
                )}

                {modalPokemon.evolutions && modalPokemon.evolutions.length > 1 && (
                  <div className="mb-2">
                    <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-2 px-1">Evolution Chain</div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {modalPokemon.evolutions.map((evo, idx) => (
                        <Fragment key={evo.id}>
                          <button
                            onClick={() => {
                              const evoPokemon = allPokemon.find(p => p.id === evo.id) || { id: evo.id, name: evo.name } as Pokemon
                              closeModal()
                              setTimeout(() => openModal(evoPokemon as Pokemon), 50)
                            }}
                            className="flex flex-col items-center text-center px-2 py-1 rounded-xl hover:bg-white/5 min-w-[64px]"
                          >
                            <img
                              src={getSprite({ id: evo.id, name: evo.name, sprites: { front_default: null } as any } as Pokemon, false)}
                              className="w-10 h-10 object-contain"
                              alt={evo.name}
                            />
                            <span className="text-[10px] capitalize mt-0.5">{evo.name}</span>
                            {evo.condition && <span className="text-[9px] text-gray-400 mt-px">{evo.condition}</span>}
                          </button>
                          {idx < (modalPokemon.evolutions?.length || 0) - 1 && <span className="text-gray-500 mx-0.5">→</span>}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {matchups && (
                <div className="px-4 sm:px-6 pb-3">
                  <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-1.5">Type Matchups (defensive)</div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    {matchups.weak?.length > 0 && <div className="bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5">Weak: {matchups.weak.join(', ')}</div>}
                    {matchups.resist?.length > 0 && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5">Resist: {matchups.resist.join(', ')}</div>}
                    {matchups.immune?.length > 0 && <div className="bg-slate-500/10 border border-slate-500/30 rounded px-1.5 py-0.5">Immune: {matchups.immune.join(', ')}</div>}
                  </div>
                </div>
              )}

              {(modalPokemon.habitat || modalPokemon.shape) && (
                <div className="px-4 sm:px-6 pb-2 text-[10px] text-gray-400">Habitat: {modalPokemon.habitat || '—'} • Shape: {modalPokemon.shape || '—'}</div>
              )}

              {encounters.length > 0 && (
                <div className="px-4 sm:px-6 pb-2 text-[10px]">
                  <div className="text-gray-400 mb-1">Encounters (sample)</div>
                  <div className="text-white/70">{encounters.map((e: any) => e.location_area?.name?.replace(/-/g, ' ')).filter(Boolean).slice(0,3).join(' • ')}</div>
                </div>
              )}

              <div className="border-t border-white/10 px-4 sm:px-6 py-3 sm:py-4 bg-[#0a0c14]/60 flex items-center justify-between text-xs">
                <div className="text-gray-400">Data from PokéAPI</div>
                <button onClick={closeModal} className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-medium">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Lab */}
      <AnimatePresence>
        {showTeamLab && (
          <TeamLab
            allPokemon={displayedForTeam}
            favorites={favorites}
            matchupCache={matchupCache}
            teams={teamsHook.teams}
            activeTeam={teamsHook.activeTeam}
            activeTeamId={teamsHook.activeTeamId}
            onAddPokemon={(p) => teamsHook.addPokemonToActive(p)}
            onRemovePokemon={teamsHook.removePokemonFromActive}
            onClear={teamsHook.clearActive}
            onCreateTeam={() => teamsHook.createTeam()}
            onDeleteTeam={teamsHook.deleteTeam}
            onRenameTeam={teamsHook.renameTeam}
            onSetActive={teamsHook.setActive}
            onClose={() => setShowTeamLab(false)}
            onEnsureMatchups={async (ids: number[]) => {
              for (const id of ids) {
                if (!matchupCache[id]) {
                  const p = allPokemon.find(x => x.id === id)
                  if (p?.types?.[0]) {
                    const m = await fetchTypeMatchups(p.types[0].type.name)
                    if (m) setMatchupCache(prev => ({ ...prev, [id]: m }))
                  }
                }
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Compare View */}
      <AnimatePresence>
        {showCompare && compareList.length > 0 && (
          <div className="fixed inset-0 z-[120] bg-black/90 flex flex-col p-4" onClick={() => setShowCompare(false)}>
            <div className="max-w-7xl mx-auto w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-semibold">Compare Pokémon</div>
                <div className="flex gap-2">
                  <button onClick={() => setCompareList([])} className="px-3 py-1 text-sm rounded border border-white/10">Clear</button>
                  <button onClick={() => setShowCompare(false)} className="px-3 py-1 text-sm rounded border border-white/10">Close</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {compareList.map((p, idx) => (
                  <div key={p.id} className="bg-[#111827] rounded-3xl p-4 border border-white/10">
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="font-mono text-xs text-red-400">#{String(p.id).padStart(3,'0')}</div>
                        <div className="text-lg capitalize font-semibold">{p.name}</div>
                      </div>
                      <button onClick={() => setCompareList(compareList.filter((_,i)=>i!==idx))} className="text-white/50 hover:text-red-400">×</button>
                    </div>
                    <img src={getSprite(p)} className="w-24 h-24 mx-auto object-contain" alt={p.name} />
                    <div className="flex gap-1 justify-center my-2">{p.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} />)}</div>
                    <div className="text-xs text-gray-400">BST {getBst(p)}</div>
                    <div className="mt-2 space-y-1 text-xs">
                      {p.stats.slice(0,3).map(s => <div key={s.stat.name} className="flex justify-between"><span>{s.stat.name}</span><span>{s.base_stat}</span></div>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-xs text-gray-500 mt-4">Add up to 4 from detail modals • Click outside to close</div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-6 pb-8 pt-4 text-center text-[10px] text-gray-600">
        Production-ready Pokédex • React 19 + TypeScript + Tailwind 4 • Powered by PokéAPI • Team Lab included
      </footer>
    </div>
  )
}

export default App
