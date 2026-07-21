import { h } from 'preact';
import { Link } from 'preact-router/match';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-pokemon-card dark:bg-pokemon-card-dark border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-lg font-bold text-pokemon-red mb-4">Pokédex Fable 5 Low</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              The greatest Pokédex ever built. Powered by PokéAPI data on Cloudflare Workers.
            </p>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Pokémon</h4>
            <ul class="space-y-2 text-sm">
              <li><Link href="/pokemon/" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">All Pokémon</Link></li>
              <li><Link href="/favorites" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">My Favorites</Link></li>
              <li><Link href="/tools/team-builder" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Team Builder</Link></li>
              <li><Link href="/tools/compare" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Compare</Link></li>
            </ul>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Tools</h4>
            <ul class="space-y-2 text-sm">
              <li><Link href="/tools/type-matchup" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Type Matchup</Link></li>
              <li><Link href="/lore" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Pokémon Lore</Link></li>
              <li><Link href="/legends" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Legends</Link></li>
            </ul>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Data</h4>
            <ul class="space-y-2 text-sm">
              <li><Link href="/moves/" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Moves</Link></li>
              <li><Link href="/items/" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Items</Link></li>
              <li><Link href="/abilities/" class="text-gray-600 dark:text-gray-400 hover:text-pokemon-red transition-colors">Abilities</Link></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Data from <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer" class="text-pokemon-red hover:text-red-600">PokéAPI</a>
            {' '}· Made with ❤️ on Cloudflare Workers
          </p>
          <p class="mt-1">
            &copy; {currentYear} Pokédex Fable 5 Low. This project is licensed under GPL-3.0.
          </p>
        </div>
      </div>
    </footer>
  );
}
