import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPokemonById } from '../api/pokeapi';
import type { Pokemon } from '../types/pokemon';
import { SearchBar } from '../components/ui/SearchBar';
import { formatPokemonId } from '../utils/formatters';
import { getTypeColor } from '../utils/typeColors';

const FEATURED_IDS = [6, 25, 150, 384, 448, 9, 3, 149, 248, 658, 700, 887];

export function HomePage() {
  const [featured, setFeatured] = useState<Pokemon[]>([]);

  useEffect(() => {
    Promise.all(FEATURED_IDS.map(id => getPokemonById(id))).then(setFeatured);
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-6xl font-display font-bold text-white text-glow"
            >
              Gotta Cache
              <span className="block text-red-400">'Em All</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 text-lg"
            >
              The ultimate Pokédex — every Pokémon, every stat, every evolution.
              Powered by PokeAPI.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center"
            >
              <SearchBar />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 pt-2"
            >
              <Link
                to="/pokedex"
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold transition-colors"
              >
                Browse All Pokémon
              </Link>
              <Link
                to="/compare"
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Compare
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-white">Featured Pokémon</h2>
          <Link to="/pokedex" className="text-sm text-red-400 hover:text-red-300 transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {featured.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/pokemon/${p.id}`}
                className="block group relative rounded-2xl bg-gray-900/60 border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-300"
              >
                <div className="p-3">
                  <div className="aspect-square mb-2 relative">
                    <div
                      className="absolute inset-2 rounded-full opacity-20"
                      style={{ backgroundColor: getTypeColor(p.types[0]?.type.name || 'normal') }}
                    />
                    <img
                      src={p.sprites.other['official-artwork'].front_default || ''}
                      alt={p.name}
                      className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500">{formatPokemonId(p.id)}</span>
                  <p className="text-sm font-semibold text-white capitalize truncate">{p.name.replace(/-/g, ' ')}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLinkCard
            to="/pokedex"
            icon="🔍"
            title="Full Pokédex"
            description="Browse all 1000+ Pokémon with search, filter by type and generation"
          />
          <QuickLinkCard
            to="/compare"
            icon="⚖️"
            title="Compare"
            description="Compare stats and types of any two Pokémon side by side"
          />
          <QuickLinkCard
            to="/type-calc"
            icon="🧮"
            title="Type Calculator"
            description="Check type matchups and effectiveness between any Pokémon types"
          />
        </div>
      </section>
    </div>
  );
}

function QuickLinkCard({ to, icon, title, description }: { to: string; icon: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group p-6 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-gray-600 transition-all duration-300 card-glow"
    >
      <span className="text-3xl mb-3 block">{icon}</span>
      <h3 className="font-display font-semibold text-white text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}
