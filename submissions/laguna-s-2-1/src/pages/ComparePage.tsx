import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, BackButton, SearchBar } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge } from '../components/ui/TypeBadge';
import { fetchPokemon } from '../lib/pokeapi';
import { TYPE_ORDER } from '../types';

export function ComparePage() {
  const [pokemon1, setPokemon1] = useState<any>(null);
  const [pokemon2, setPokemon2] = useState<any>(null);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearch, setActiveSearch] = useState<1 | 2>(1);

  useEffect(() => {
    if (search1.length > 2) {
      searchPokemon(search1, 1);
    }
  }, [search1]);

  useEffect(() => {
    if (search2.length > 2) {
      searchPokemon(search2, 2);
    }
  }, [search2]);

  async function searchPokemon(query: string, slot: 1 | 2) {
    setIsSearching(true);
    try {
      const { fetchPokemonList } = await import('../lib/pokeapi');
      const list = await fetchPokemonList(1351, 0);
      const filtered = list.results
        .filter((p: any) => p.name.includes(query.toLowerCase()))
        .slice(0, 10)
        .map((p: any) => {
          const id = parseInt(p.url.split('/').slice(-2)[0]);
          return { id, name: p.name };
        });
      setSearchResults(filtered);
      setActiveSearch(slot);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }

  async function selectPokemon(pokemon: any, slot: 1 | 2) {
    if (slot === 1) {
      setLoading1(true);
      setSearch1('');
      try {
        const data = await fetchPokemonDetails(pokemon.name);
        setPokemon1(data);
      } catch (error) {
        console.error('Failed to load pokemon:', error);
      } finally {
        setLoading1(false);
      }
    } else {
      setLoading2(true);
      setSearch2('');
      try {
        const data = await fetchPokemonDetails(pokemon.name);
        setPokemon2(data);
      } catch (error) {
        console.error('Failed to load pokemon:', error);
      } finally {
        setLoading2(false);
      }
    }
  }

  function clearPokemon(slot: 1 | 2) {
    if (slot === 1) {
      setPokemon1(null);
      setSearch1('');
    } else {
      setPokemon2(null);
      setSearch2('');
    }
  }

  function renderStatBar(label: string, value1: number, value2: number, max = 255) {
    const pct1 = (value1 / max) * 100;
    const pct2 = (value2 / max) * 100;
    return (
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="font-medium">{label}</span>
          <span class="text-gray-500">
            {pokemon1 && <span class="font-bold">{value1}</span>} vs{' '}
            {pokemon2 && <span class="font-bold">{value2}</span>}
          </span>
        </div>
        <div class="flex gap-2">
          <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div class="h-full bg-pokemon-red rounded-full transition-all" style={{ width: `${pct1}%` }} />
          </div>
          <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div class="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct2}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">Compare Pokémon</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Compare two Pokémon side by side.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6">
          <h3 class="text-xl font-semibold mb-4">Pokémon 1</h3>
          {pokemon1 ? (
            <div class="text-center">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon1.id}.png`}
                alt={pokemon1.name}
                class="w-32 h-32 mx-auto"
              />
              <h4 class="text-2xl font-bold capitalize mt-2">{pokemon1.name.replace(/-/g, ' ')}</h4>
              <p class="text-gray-500">#{pokemon1.id}</p>
              <button
                onClick={() => clearPokemon(1)}
                class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
              >
                Clear
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={search1}
                onInput={(e) => setSearch1((e.target as HTMLInputElement).value)}
                placeholder="Search for a Pokémon..."
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-2"
              />
              {search1.length > 2 && (
                <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPokemon(p, 1)}
                      class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 capitalize"
                    >
                      #{p.id} {p.name.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6">
          <h3 class="text-xl font-semibold mb-4">Pokémon 2</h3>
          {pokemon2 ? (
            <div class="text-center">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon2.id}.png`}
                alt={pokemon2.name}
                class="w-32 h-32 mx-auto"
              />
              <h4 class="text-2xl font-bold capitalize mt-2">{pokemon2.name.replace(/-/g, ' ')}</h4>
              <p class="text-gray-500">#{pokemon2.id}</p>
              <button
                onClick={() => clearPokemon(2)}
                class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
              >
                Clear
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={search2}
                onInput={(e) => setSearch2((e.target as HTMLInputElement).value)}
                placeholder="Search for a Pokémon..."
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-2"
              />
              {search2.length > 2 && (
                <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPokemon(p, 2)}
                      class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 capitalize"
                    >
                      #{p.id} {p.name.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {pokemon1 && pokemon2 && (
        <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6">
          <h3 class="text-xl font-semibold mb-4">Stats Comparison</h3>
          <div class="space-y-4">
            {renderStatBar('HP', pokemon1.stats[0]?.base_stat || 0, pokemon2.stats[0]?.base_stat || 0)}
            {renderStatBar('Attack', pokemon1.stats[1]?.base_stat || 0, pokemon2.stats[1]?.base_stat || 0)}
            {renderStatBar('Defense', pokemon1.stats[2]?.base_stat || 0, pokemon2.stats[2]?.base_stat || 0)}
            {renderStatBar('Sp. Attack', pokemon1.stats[3]?.base_stat || 0, pokemon2.stats[3]?.base_stat || 0)}
            {renderStatBar('Sp. Defense', pokemon1.stats[4]?.base_stat || 0, pokemon2.stats[4]?.base_stat || 0)}
            {renderStatBar('Speed', pokemon1.stats[5]?.base_stat || 0, pokemon2.stats[5]?.base_stat || 0)}
          </div>
        </div>
      )}
    </div>
  );
}
