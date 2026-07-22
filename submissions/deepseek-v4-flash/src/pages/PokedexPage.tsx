import { motion } from 'framer-motion';
import { PokemonGrid } from '../components/pokemon/PokemonGrid';

export function PokedexPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-white text-glow">
          National Pokédex
        </h1>
        <p className="text-gray-400 mt-1">
          Complete Pokémon database — search, filter, and explore.
        </p>
      </motion.div>
      <PokemonGrid />
    </div>
  );
}
