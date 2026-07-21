import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { ThemeToggle } from '../pokemon/PokemonCard';
import { getLocalStorage, setLocalStorage, applyTheme, updateSettings, getSettings } from '../../lib/utils';
import { SUPPORTED_LANGUAGES } from '../../types';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target !== document.activeElement) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: Event) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/pokemon/${encodeURIComponent(searchQuery.toLowerCase().replace(/\s+/g, '-'))}/`;
    }
  };

  const handleSearchInput = (e: Event) => {
    setSearchQuery((e.target as HTMLInputElement).value);
  };

  return (
    <header class="bg-pokemon-card dark:bg-pokemon-card-dark shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <Link href="/" class="flex items-center gap-2 text-xl font-bold text-pokemon-red">
            <span class="text-2xl">🔍</span>
            <span>Pokédex Fable 5 Low</span>
          </Link>

          <div class="hidden md:flex items-center gap-4">
            <nav class="flex items-center gap-2">
              <Link href="/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Home
              </Link>
              <Link href="/pokemon/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Pokémon
              </Link>
              <Link href="/types/normal" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Types
              </Link>
              <Link href="/moves/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Moves
              </Link>
              <Link href="/items/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Items
              </Link>
              <Link href="/abilities/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Abilities
              </Link>
              <Link href="/tools/type-matchup" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Tools
              </Link>
              <Link href="/lore" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Lore
              </Link>
              <Link href="/legends" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Legends
              </Link>
            </nav>

            <form onSubmit={handleSearch} class="relative">
              <input
                id="search-input"
                type="search"
                value={searchQuery}
                onInput={handleSearchInput}
                placeholder="Search Pokémon... (press /)"
                class="w-64 pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokemon-red transition-colors"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>

            <ThemeToggle />
          </div>

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            class="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {showMobileMenu && (
          <div class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav class="flex flex-col gap-2">
              <Link href="/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Home
              </Link>
              <Link href="/pokemon/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Pokémon
              </Link>
              <Link href="/types/normal" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Types
              </Link>
              <Link href="/moves/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Moves
              </Link>
              <Link href="/items/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Items
              </Link>
              <Link href="/abilities/" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Abilities
              </Link>
              <Link href="/tools/type-matchup" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Tools
              </Link>
              <Link href="/lore" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Lore
              </Link>
              <Link href="/legends" class="px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Legends
              </Link>
              <form onSubmit={handleSearch} class="px-3 py-2">
                <input
                  type="search"
                  value={searchQuery}
                  onInput={handleSearchInput}
                  placeholder="Search Pokémon..."
                  class="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokemon-red"
                />
              </form>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
