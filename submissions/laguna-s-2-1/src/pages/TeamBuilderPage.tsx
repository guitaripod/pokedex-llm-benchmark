import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, BackButton, SearchBar } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge } from '../components/ui/TypeBadge';
import { fetchPokemonDetails, fetchPokemonList } from '../lib/pokeapi';
import { TYPE_ORDER } from '../types';

export function TeamBuilderPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [allPokemon, setAllPokemon] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    loadAllPokemon();
    loadTeam();
  }, []);

  async function loadAllPokemon() {
    try {
      const list = await fetchPokemonList(1351, 0);
      setAllPokemon(list.results.map((p: any) => ({
        id: parseInt(p.url.split('/').slice(-2)[0]),
        name: p.name,
      })));
    } catch (error) {
      console.error('Failed to load pokemon list:', error);
    } finally {
      setLoadingAll(false);
    }
  }

  function loadTeam() {
    const saved = localStorage.getItem('pokedex-team');
    if (saved) {
      setTeam(JSON.parse(saved));
    }
  }

  function saveTeam(newTeam: any[]) {
    setTeam(newTeam);
    localStorage.setItem('pokedex-team', JSON.stringify(newTeam));
  }

  function addToTeam(pokemon: any) {
    if (team.length >= 6) return;
    if (team.some((p) => p.id === pokemon.id)) return;
    saveTeam([...team, pokemon]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  }

  function removeFromTeam(id: number) {
    saveTeam(team.filter((p) => p.id !== id));
  }

  function moveInTeam(from: number, to: number) {
    if (to < 0 || to >= 6) return;
    const newTeam = [...team];
    const [moved] = newTeam.splice(from, 1);
    newTeam.splice(to, 0, moved);
    saveTeam(newTeam);
  }

  async function searchPokemon(query: string) {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const filtered = allPokemon
        .filter((p) => p.name.includes(query.toLowerCase()))
        .slice(0, 20);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPokemon(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function getTeamStats() {
    if (team.length === 0) return null;
    const types: { [key: string]: number } = {};
    let totalBST = 0;
    let totalHP = 0;

    team.forEach((p) => {
      if (p.types) {
        p.types.forEach((t: string) => {
          types[t] = (types[t] || 0) + 1;
        });
      }
      if (p.stats) {
        totalBST += p.stats.reduce((sum: number, s: any) => sum + s.base_stat, 0);
        totalHP += p.stats[0]?.base_stat || 0;
      }
    });

    return { types, totalBST, totalHP, avgLevel: 50 };
  }

  const teamStats = getTeamStats();

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">Team Builder</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Build and save your dream team of up to 6 Pokémon.
      </p>

      <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">Your Team ({team.length}/6)</h3>
          <button
            onClick={() => setShowSearch(!showSearch)}
            class="px-4 py-2 bg-pokemon-red text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Add Pokémon
          </button>
        </div>

        {showSearch && (
          <div class="mb-4">
            <input
              type="text"
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              placeholder="Search for a Pokémon..."
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
            {searchQuery && (
              <div class="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToTeam(p)}
                    class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 capitalize flex items-center gap-2"
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/regular/${p.id}.png`}
                      alt={p.name}
                      class="w-8 h-8"
                    />
                    #{p.id} {p.name.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => {
            const pokemon = team[i];
            return (
              <div
                key={i}
                class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center min-h-[150px] flex flex-col items-center justify-center"
              >
                {pokemon ? (
                  <div class="w-full">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                      alt={pokemon.name}
                      class="w-20 h-20 mx-auto"
                    />
                    <h4 class="font-bold capitalize mt-1 text-sm">
                      {pokemon.name.replace(/-/g, ' ')}
                    </h4>
                    {pokemon.types && (
                      <div class="flex justify-center gap-1 mt-1">
                        {pokemon.types.map((t: string) => (
                          <TypeBadge key={t} type={t} size="sm" />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => removeFromTeam(pokemon.id)}
                      class="mt-2 text-xs text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p class="text-gray-500 dark:text-gray-400 text-sm">Slot {i + 1}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {teamStats && (
        <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6">
          <h3 class="text-xl font-semibold mb-4">Team Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 class="font-medium mb-2">Type Coverage</h4>
              <div class="flex flex-wrap gap-1">
                {Object.entries(teamStats.types)
                  .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
                  .map(([type, count]) => (
                    <div key={type} class="flex items-center gap-1">
                      <TypeBadge type={type} size="sm" />
                      <span class="text-xs text-gray-500 dark:text-gray-400">×{count}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 class="font-medium mb-2">Total Base Stats</h4>
              <p class="text-2xl font-bold">{teamStats.totalBST}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Average: {Math.round(teamStats.totalBST / team.length)}</p>
            </div>
            <div>
              <h4 class="font-medium mb-2">Total HP</h4>
              <p class="text-2xl font-bold">{teamStats.totalHP}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Average: {Math.round(teamStats.totalHP / team.length)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
