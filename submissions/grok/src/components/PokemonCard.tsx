import { memo } from 'react'
import { Heart, Plus } from 'lucide-react'
import type { Pokemon } from '../types/pokemon'
import { getSprite } from '../types/pokemon'
import { TypeBadge } from './TypeBadge'

interface PokemonCardProps {
  pokemon: Pokemon
  isFavorite: boolean
  onClick: () => void
  onToggleFavorite: (e: React.MouseEvent) => void
  shiny?: boolean
  onAddToTeam?: (p: Pokemon) => void
  canAddToTeam?: boolean
  isCaught?: boolean
  isShinyCaught?: boolean
}

export const PokemonCard = memo(function PokemonCard({ pokemon, isFavorite, onClick, onToggleFavorite, shiny, onAddToTeam, canAddToTeam, isCaught, isShinyCaught }: PokemonCardProps) {
  const sprite = getSprite(pokemon, !!shiny)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToTeam) onAddToTeam(pokemon)
  }

  return (
    <div onClick={onClick} className="pokedex-card group bg-[#111827] rounded-3xl overflow-hidden cursor-pointer flex flex-col touch-manipulation">
      <div className="relative bg-[#0a0c14] px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 flex justify-center items-center h-[120px] sm:h-[138px]">
        <img
          src={sprite}
          className="pokemon-img max-h-[100px] max-w-[100px] sm:max-h-[118px] sm:max-w-[118px] object-contain drop-shadow-xl select-none"
          alt={pokemon.name}
          loading="lazy"
        />
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all ${isFavorite ? 'text-red-400' : 'text-white/30 group-hover:text-white/60'}`}
        >
          <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        {onAddToTeam && canAddToTeam && (
          <button
            onClick={handleAdd}
            aria-label="Add to team"
            className="absolute top-3 left-12 w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500/90 text-black hover:bg-emerald-400 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="absolute top-3 left-4 flex items-center gap-1">
          <span className="font-mono text-[10px] font-medium tracking-[1.5px] text-red-400/90">
            #{String(pokemon.id).padStart(3, '0')}
          </span>
          {isCaught && <span className="text-[8px] px-1 bg-green-500/80 rounded text-black">C</span>}
          {isShinyCaught && <span className="text-[8px] px-1 bg-yellow-400/80 rounded text-black">S</span>}
        </div>
      </div>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0.5 sm:pt-1 flex-1 flex flex-col">
        <div className="font-semibold text-sm sm:text-[15px] capitalize tracking-[-0.2px] mb-1.5 sm:mb-2">{pokemon.name}</div>
        <div className="flex gap-1 sm:gap-1.5 mt-auto">
          {pokemon.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} />)}
        </div>
      </div>
    </div>
  )
})
