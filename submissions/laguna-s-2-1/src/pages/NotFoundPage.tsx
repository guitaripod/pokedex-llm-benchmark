import { h } from 'preact';
import { Link } from 'preact-router/match';
import { BackButton } from '../components/pokemon/PokemonCard';

export function NotFoundPage() {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center text-center">
      <BackButton href="/" />

      <div class="mb-8">
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png"
          alt="Ditto"
          class="w-32 h-32 mx-auto opacity-50"
        />
      </div>

      <h1 class="text-6xl font-bold text-pokemon-red mb-4">404</h1>
      <p class="text-2xl text-gray-700 dark:text-gray-300 mb-2">
        Pokémon Not Found
      </p>
      <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        The page you're looking for doesn't exist. It may have been moved, deleted, or never existed in the first place.
      </p>

      <Link
        href="/"
        class="inline-block px-6 py-3 bg-pokemon-red text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
      >
        Return to Home
      </Link>
    </div>
  );
}
