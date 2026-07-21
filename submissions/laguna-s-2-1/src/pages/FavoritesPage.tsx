import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, BackButton } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge } from '../components/ui/TypeBadge';
import { fetchPokemonList, fetchPokemonDetails } from '../lib/pokeapi';

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const saved = localStorage.getItem('pokedex-favorites');
      if (saved) {
        const ids = JSON.parse(saved);
        const pokemonList = await fetchPokemonList(1351, 0);
        const favoritePokemon = ids
          .map((id: number) => {
            const p = pokemonList.results.find((p: any) => {
              const pid = parseInt(p.url.split('/').slice(-2)[0]);
              return pid === id;
            });
            return p
              ? {
                  id,
                  name: p.name,
                  types: [],
                  sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
                }
              : null;
          })
          .filter(Boolean);
        setFavorites(favoritePokemon);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">My Favorites</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {favorites.length} favorite Pokémon
      </p>

      {favorites.length === 0 ? (
        <div class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400 mb-4">You haven't favorited any Pokémon yet.</p>
          <Link
            href="/"
            class="inline-block px-6 py-3 bg-pokemon-red text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Browse Pokémon
          </Link>
        </div>
      ) : (
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {favorites.map((pokemon) => (
            <Link key={pokemon.id} href={`/pokemon/${pokemon.name}/`}>
              <PokemonCard
                id={pokemon.id}
                name={pokemon.name}
                types={pokemon.types}
                compact={true}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
