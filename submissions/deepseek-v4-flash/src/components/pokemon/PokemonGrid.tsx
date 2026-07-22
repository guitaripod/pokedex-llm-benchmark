import { useState, useEffect, useMemo } from 'react';
import { getPokemonById } from '../../api/pokeapi';
import type { Pokemon } from '../../types/pokemon';
import { POKEMON_TYPES, GENERATIONS } from '../../types/pokemon';
import { PokemonCard } from './PokemonCard';
import { SkeletonCard } from '../ui/LoadingSpinner';
import { SearchBar } from '../ui/SearchBar';

const GEN_LIMITS: Record<number, number> = {
  1: 151, 2: 100, 3: 135, 4: 107, 5: 156, 6: 72, 7: 88, 8: 96, 9: 120,
};

const GEN_OFFSETS: Record<number, number> = {
  1: 0, 2: 151, 3: 251, 4: 386, 5: 493, 6: 649, 7: 721, 8: 809, 9: 905,
};

export function PokemonGrid() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'height' | 'weight'>('id');
  const [displayCount, setDisplayCount] = useState(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const limit = selectedGen ? GEN_LIMITS[selectedGen] : 151;
      const offset = selectedGen ? GEN_OFFSETS[selectedGen] : 0;
      const ids = Array.from({ length: limit }, (_, i) => offset + i + 1);
      const chunks: number[][] = [];
      for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
      const results: Pokemon[] = [];
      for (const chunk of chunks) {
        const pokemon = await Promise.all(chunk.map(id => getPokemonById(id)));
        results.push(...pokemon);
      }
      setAllPokemon(results);
      setLoading(false);
    }
    load();
  }, [selectedGen]);

  const filtered = useMemo(() => {
    let list = [...allPokemon];
    if (selectedTypes.length > 0) {
      list = list.filter(p =>
        selectedTypes.every(t => p.types.some(pt => pt.type.name === t))
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'height') return b.height - a.height;
      return b.weight - a.weight;
    });
    return list;
  }, [allPokemon, selectedTypes, sortBy]);

  const displayed = filtered.slice(0, displayCount);

  function toggleType(type: string) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchBar />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="id"># Number</option>
              <option value="name">Name</option>
              <option value="height">Height</option>
              <option value="weight">Weight</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {GENERATIONS.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGen(selectedGen === g.id ? null : g.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedGen === g.id
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {g.display}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {POKEMON_TYPES.map(type => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedTypes.includes(type)
                    ? 'ring-2 ring-offset-1 ring-offset-gray-950 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: selectedTypes.includes(type) ? `${typeToHex(type)}` : 'rgb(31 41 55)',
                  borderColor: selectedTypes.includes(type) ? typeToHex(type) : 'transparent',
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Showing {Math.min(displayCount, filtered.length)} of {filtered.length} Pokémon</span>
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {displayed.map((p, i) => (
              <PokemonCard key={p.id} pokemon={p} index={i} />
            ))}
          </div>
          {displayCount < filtered.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setDisplayCount(d => d + 30)}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function typeToHex(type: string): string {
  const map: Record<string, string> = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD',
  };
  return map[type] || '#999';
}
