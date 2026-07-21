import { useState, useEffect } from 'react'
import { X, Plus, Download, Sparkles, Trash2, Edit2, Users } from 'lucide-react'
import type { Pokemon } from '../types/pokemon'
import { getSprite, getBst } from '../types/pokemon'
import { TypeBadge } from './TypeBadge'
import { computeAdvancedCoverage, suggestForTeam } from '../lib/analysis'
import { calculateDamage } from '../lib/damage'
import { exportTeamToShowdown, parseShowdownTeam } from '../lib/showdown'
import { exportTeamImage } from '../lib/export'
import { toast } from 'sonner'

export interface SavedTeam {
  id: string
  name: string
  members: Pokemon[]
}

interface TeamLabProps {
  allPokemon: Pokemon[]
  favorites: Set<number>
  matchupCache: Record<number, any>
  teams: SavedTeam[]
  activeTeam: SavedTeam | null
  activeTeamId: string | null
  onAddPokemon: (p: Pokemon) => void
  onRemovePokemon: (id: number) => void
  onClear: () => void
  onCreateTeam: () => void
  onDeleteTeam: (id: string) => void
  onRenameTeam: (id: string, name: string) => void
  onSetActive: (id: string) => void
  onClose: () => void
  onEnsureMatchups?: (ids: number[]) => Promise<void>
}

const MAX_TEAM = 6

export function TeamLab({
  allPokemon,
  favorites,
  matchupCache,
  teams,
  activeTeam,
  activeTeamId,
  onAddPokemon,
  onRemovePokemon,
  onClear,
  onCreateTeam,
  onDeleteTeam,
  onRenameTeam,
  onSetActive,
  onClose,
  onEnsureMatchups,
}: TeamLabProps) {
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [battleAttacker, setBattleAttacker] = useState<Pokemon | undefined>(undefined)
  const [battleDefender, setBattleDefender] = useState<Pokemon | undefined>(undefined)
  const [calcLevel, setCalcLevel] = useState(50)
  const [calcPower, setCalcPower] = useState(80)

  const team = activeTeam?.members || []
  const canAdd = team.length < MAX_TEAM

  useEffect(() => {
    if (team.length > 0) {
      setBattleAttacker(team[0])
      setBattleDefender(team.length > 1 ? team[1] : team[0])
    }
  }, [activeTeamId, team])

  // Ensure matchups for current team members when active team changes
  useEffect(() => {
    if (onEnsureMatchups && activeTeam) {
      const ids = activeTeam.members.map(m => m.id)
      if (ids.length) {
        void onEnsureMatchups(ids)
      }
    }
  }, [activeTeamId, onEnsureMatchups, activeTeam])

  const addToTeam = (p: Pokemon) => {
    if (!canAdd || team.some(t => t.id === p.id)) return
    onAddPokemon(p)
  }

  const removeFromTeam = (id: number) => {
    onRemovePokemon(id)
  }

  const teamIds = new Set(team.map(t => t.id))
  const favPokemon = allPokemon.filter(p => favorites.has(p.id) && !teamIds.has(p.id))

  const coverage = computeAdvancedCoverage(team, matchupCache)

  const suggestions = showSuggestions
    ? suggestForTeam(allPokemon, team).filter(p => !teamIds.has(p.id)).slice(0, 8)
    : []



  const addRandom = () => {
    const pool = allPokemon.filter(p => !teamIds.has(p.id))
    if (pool.length === 0) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    addToTeam(pick)
  }

  const startRename = (t: SavedTeam) => {
    setEditingId(t.id)
    setEditName(t.name)
  }

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRenameTeam(editingId, editName.trim())
    }
    setEditingId(null)
    setEditName('')
  }

  const currentTeamName = activeTeam?.name || 'No team'

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-[#0a0c14]">
        <div className="flex items-center gap-3">
          <div className="text-xl font-semibold tracking-tighter flex items-center gap-2">
            <Users className="w-5 h-5" /> Team Lab
          </div>
          <div className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/60">{team.length} / {MAX_TEAM}</div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={onCreateTeam} className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-white/10 hover:bg-white/5">
            <Plus className="w-4 h-4" /> New Team
          </button>
          <button onClick={addRandom} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-2xl border border-white/10 hover:bg-white/5">
            <Sparkles className="w-4 h-4" /> Random
          </button>
          <button onClick={() => {
            const text = exportTeamToShowdown(team)
            navigator.clipboard.writeText(text).then(() => toast.success('Exported to clipboard'))
          }} disabled={team.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-2xl border border-white/10 hover:bg-white/5 disabled:opacity-40">
            <Download className="w-4 h-4" /> Export Showdown
          </button>
          <button onClick={() => exportTeamImage(team)} disabled={team.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-2xl border border-white/10 hover:bg-white/5 disabled:opacity-40">
            PNG Team
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-2xl border border-white/10 hover:bg-white/5 cursor-pointer">
            <input type="file" accept=".txt" className="hidden" onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => {
                const parsed = parseShowdownTeam(ev.target?.result as string || '')
                parsed.forEach(p => {
                  const match = allPokemon.find(ap => ap.name.toLowerCase() === p.name?.toLowerCase())
                  if (match) onAddPokemon(match)
                })
                toast.success('Imported team')
              }
              reader.readAsText(file)
            }} />
            Import Showdown
          </label>
          <button onClick={onClear} disabled={team.length === 0} className="px-3 py-1.5 text-sm rounded-2xl border border-white/10 hover:bg-white/5 disabled:opacity-40">Clear</button>
          <button onClick={onClose} className="ml-1 w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Teams switcher */}
        {teams.length > 0 && (
          <div className="mb-6">
            <div className="uppercase tracking-[1.5px] text-xs text-gray-400 mb-2">Saved Teams</div>
            <div className="flex flex-wrap gap-2">
              {teams.map(t => {
                const isActive = t.id === activeTeamId
                const isEditing = editingId === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => !isEditing && onSetActive(t.id)}
                    className={`group flex items-center gap-2 px-3 py-1 rounded-2xl border text-sm cursor-pointer ${isActive ? 'bg-white/10 border-white/30' : 'border-white/10 hover:bg-white/5'}`}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setEditingId(null); setEditName('') } }}
                        className="bg-transparent border-b border-white/40 outline-none text-sm w-28"
                      />
                    ) : (
                      <span className="capitalize">{t.name}</span>
                    )}
                    <span className="text-[10px] text-white/40">({t.members.length})</span>
                    {!isEditing && (
                      <button onClick={(e) => { e.stopPropagation(); startRename(t) }} className="opacity-40 group-hover:opacity-100 hover:text-white ml-1">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDeleteTeam(t.id) }} className="opacity-40 group-hover:opacity-100 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Current active team header */}
        <div className="flex items-center justify-between mb-3">
          <div className="uppercase tracking-[1.5px] text-xs text-gray-400">Current: <span className="text-white font-medium">{currentTeamName}</span></div>
          {team.length === 0 && teams.length === 0 && (
            <div className="text-xs text-gray-500">Create a team above or add Pokémon from the grid / suggestions</div>
          )}
        </div>

        {/* Current Team slots */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: MAX_TEAM }).map((_, i) => {
              const p = team[i]
              return p ? (
                <div key={p.id} className="bg-[#111827] rounded-3xl p-3 relative group">
                  <button onClick={() => removeFromTeam(p.id)} className="absolute top-2 right-2 text-white/40 hover:text-red-400 z-10">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col items-center">
                    <img src={getSprite(p)} className="w-20 h-20 object-contain" alt={p.name} />
                    <div className="capitalize font-medium mt-1">{p.name}</div>
                    <div className="flex gap-1 mt-1">{p.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} />)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">BST {getBst(p)}</div>
                  </div>
                </div>
              ) : (
                <div key={i} className="bg-[#111827]/50 border border-white/10 rounded-3xl h-[140px] flex items-center justify-center text-white/30 text-sm">Empty slot</div>
              )
            })}
          </div>
        </div>

        {/* Coverage */}
        <div className="mb-8">
          <div className="uppercase tracking-[1.5px] text-xs text-gray-400 mb-3">Coverage Analysis</div>
          <div className="bg-[#111827] rounded-3xl p-4 sm:p-5 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-emerald-400 text-xs mb-1.5">OFFENSIVE TYPES</div>
              <div className="flex flex-wrap gap-1.5">
                {coverage.offensive.length > 0
                  ? coverage.offensive.map(t => <TypeBadge key={t} type={t} />)
                  : <span className="text-gray-500">Add Pokémon to see coverage</span>}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-red-400 text-xs mb-1.5">DEFENSIVE WEAKNESSES (from matchups)</div>
                <div className="flex flex-wrap gap-1.5">
                  {coverage.defensiveWeak.length ? coverage.defensiveWeak.map(t => <TypeBadge key={t} type={t} />) : <span className="text-gray-500">—</span>}
                </div>
              </div>
              <div>
                <div className="text-emerald-400 text-xs mb-1.5">RESISTS + IMMUNITIES</div>
                <div className="flex flex-wrap gap-1.5">
                  {[...coverage.defensiveResist, ...coverage.defensiveImmune].length
                    ? [...new Set([...coverage.defensiveResist, ...coverage.defensiveImmune])].map(t => <TypeBadge key={t} type={t} />)
                    : <span className="text-gray-500">—</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 mt-2 px-1">Matchups are populated when you view details for Pokémon. Add more for richer data.</div>
        </div>

        {/* Suggestions + Favorites */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="uppercase tracking-[1.5px] text-xs text-gray-400">Smart Suggestions</div>
            <button onClick={() => setShowSuggestions(!showSuggestions)} className="text-xs text-red-400 hover:text-red-300">
              {showSuggestions ? 'Hide' : 'Show'}
            </button>
          </div>

          {showSuggestions && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-6">
              {suggestions.length > 0 ? (
                suggestions.map(p => (
                  <div key={p.id} onClick={() => addToTeam(p)} className="pokedex-card bg-[#111827] rounded-3xl p-3 cursor-pointer flex flex-col items-center hover:border-white/30 border border-white/10">
                    <img src={getSprite(p)} className="w-16 h-16 object-contain" alt={p.name} />
                    <div className="capitalize text-sm mt-1">{p.name}</div>
                    <div className="flex gap-1 mt-1 scale-90">{p.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} />)}</div>
                    <button className="mt-2 text-[10px] flex items-center gap-1 text-emerald-400">
                      <Plus className="w-3 h-3" /> ADD
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-gray-500 text-sm">Suggestions appear based on your current team composition.</div>
              )}
            </div>
          )}

          {favPokemon.length > 0 && (
            <div>
              <div className="uppercase tracking-[1.5px] text-xs text-gray-400 mb-3">From your Favorites</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {favPokemon.slice(0, 12).map(p => (
                  <div key={p.id} onClick={() => addToTeam(p)} className="pokedex-card bg-[#111827] rounded-3xl p-2.5 cursor-pointer flex items-center gap-3 hover:border-white/30 border border-white/10">
                    <img src={getSprite(p)} className="w-12 h-12 object-contain" alt={p.name} />
                    <div>
                      <div className="capitalize text-sm">{p.name}</div>
                      <div className="flex gap-1 mt-0.5">{p.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} />)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Basic Battle Preview */}
        <div className="mt-8">
          <div className="uppercase tracking-[1.5px] text-xs text-gray-400 mb-3">Quick Battle Preview (approx)</div>
          <div className="bg-[#111827] rounded-3xl p-4 text-sm">
            {team.length >= 2 ? (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <select className="bg-[#0a0c14] border border-white/10 rounded px-3 py-1" onChange={e => {
                  const p = team.find(t => t.id === parseInt(e.target.value))
                  if (p) setBattleAttacker(p)
                }} value={battleAttacker?.id || ''}>
                  {team.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <span className="text-gray-500">vs</span>
                <select className="bg-[#0a0c14] border border-white/10 rounded px-3 py-1" onChange={e => {
                  const p = team.find(t => t.id === parseInt(e.target.value))
                  if (p) setBattleDefender(p)
                }} value={battleDefender?.id || ''}>
                  {team.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="text-emerald-400 font-medium">
                  Est. damage: {(() => {
                    if (!battleAttacker || !battleDefender) return '—'
                    const res = calculateDamage(battleAttacker, battleDefender, calcPower, calcLevel)
                    return `${res.min}-${res.max} (${res.percentMin}-${res.percentMax}%)`
                  })()} 
                </div>
                <div className="flex gap-2 text-xs">
                  <input type="range" min="1" max="100" value={calcLevel} onChange={e => setCalcLevel(+e.target.value)} className="w-20" /> Lvl {calcLevel}
                  <input type="range" min="10" max="150" value={calcPower} onChange={e => setCalcPower(+e.target.value)} className="w-20" /> Pow {calcPower}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Add at least 2 Pokémon to team for battle preview.</div>
            )}
            <div className="text-[10px] text-gray-500 mt-2">Rough calc: Atk * 60 / Def * type effectiveness. For fun/learning only.</div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4 text-center text-xs text-gray-500 bg-[#0a0c14]">
        Add Pokémon from suggestions, favorites, or the main grid (green + buttons appear when Team Lab is open). Teams persist locally.
      </div>
    </div>
  )
}


