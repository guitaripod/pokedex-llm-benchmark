import { X } from 'lucide-react'
import { ALL_TYPES, TYPE_COLORS } from '../types/pokemon'

interface FiltersProps {
  activeTypes: Set<string>
  onToggleType: (type: string) => void
  onClearTypes: () => void
  onlySpecial: boolean
  onToggleSpecial: () => void
  minBst: number
  onToggleMinBst: () => void
  abilityFilter: string
  onAbilityChange: (val: string) => void
}

export function Filters({
  activeTypes,
  onToggleType,
  onClearTypes,
  onlySpecial,
  onToggleSpecial,
  minBst,
  onToggleMinBst,
  abilityFilter,
  onAbilityChange,
}: FiltersProps) {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <div className="uppercase text-[10px] sm:text-xs tracking-[1.5px] font-semibold text-gray-400">Types</div>
          {activeTypes.size > 0 && (
            <button onClick={onClearTypes} aria-label="Clear type filters" className="text-[10px] sm:text-xs text-gray-400 hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible">
          {ALL_TYPES.map(type => {
            const active = activeTypes.has(type)
            const color = TYPE_COLORS[type]
            return (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={`type-filter px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-2xl border border-transparent flex-shrink-0 snap-start ${active ? 'active' : ''}`}
                style={{
                  backgroundColor: active ? color.bg : '#111827',
                  color: active ? color.text : '#d1d5db'
                }}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleSpecial}
          className={`px-3 py-1 text-xs rounded-2xl border transition ${onlySpecial ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' : 'border-white/10 hover:bg-white/5 text-gray-300'}`}
        >
          Legendaries + Mythicals
        </button>
        <button
          onClick={onToggleMinBst}
          className={`px-3 py-1 text-xs rounded-2xl border transition ${minBst > 0 ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'border-white/10 hover:bg-white/5 text-gray-300'}`}
        >
          {minBst > 0 ? 'BST ≥ 500 (clear)' : 'High BST (≥500)'}
        </button>
        <div className="relative">
          <input
            value={abilityFilter}
            onChange={(e) => onAbilityChange(e.target.value)}
            placeholder="Ability (e.g. overgrow)"
            className="bg-[#111827] border border-white/10 focus:border-red-500/50 text-xs rounded-2xl pl-3 pr-7 py-1 w-40 outline-none placeholder:text-gray-500"
          />
          {abilityFilter && (
            <button onClick={() => onAbilityChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
