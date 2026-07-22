import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Pokemon } from '../../types/pokemon';
import { formatPokemonId } from '../../utils/formatters';
import { getTypeColor } from '../../utils/typeColors';
import { TypeBadge } from './TypeBadge';

interface PokemonCardProps {
  pokemon: Pokemon;
  index: number;
}

export function PokemonCard({ pokemon, index }: PokemonCardProps) {
  const primaryType = pokemon.types[0]?.type.name || 'normal';
  const bgColor = getTypeColor(primaryType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link
        to={`/pokemon/${pokemon.id}`}
        className="group block relative rounded-2xl bg-gray-900/60 border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-300 card-glow hover:shadow-xl hover:shadow-red-500/5"
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${bgColor}22, transparent)` }}
        />
        <div className="relative p-4">
          <div className="aspect-square mb-3 relative flex items-center justify-center">
            <div
              className="absolute inset-4 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ backgroundColor: bgColor }}
            />
            <img
              src={pokemon.sprites.other['official-artwork'].front_default || ''}
              alt={pokemon.name}
              className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-gray-500 font-medium">{formatPokemonId(pokemon.id)}</span>
            <h3 className="text-sm font-semibold text-white capitalize truncate group-hover:text-glow transition-all">
              {pokemon.name.replace(/-/g, ' ')}
            </h3>
            <div className="flex gap-1.5 flex-wrap">
              {pokemon.types.map(t => (
                <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
