import { h } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, SearchBar, FilterBar, SortSelect, Pagination, BackButton } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TYPE_ORDER } from '../types';
import { getLocalStorage, setLocalStorage, getGenerationRange, getGenerationFromId, getRarity, getGenerationFromName } from '../lib/utils';

export function PokemonListPage({ page }: { page?: string }) {
  const currentPage = page ? parseInt(page) : 1;
  const [pokemonList, setPokemonList] = useState<any[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<string | null>(null);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('id-asc');
  const perPage = 48;

  useEffect(() => {
    loadPokemonList();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pokemonList, searchQuery, selectedTypes, selectedGeneration, selectedRarities, sortBy]);

  async function loadPokemonList() {
    try {
      const cached = getLocalStorage('pokedex-pokemon-list', null);
      if (cached) {
        setPokemonList(cached);
        return;
      }

      const { fetchPokemonList, fetchPokemonSpeciesList, fetchAllPokemonConcurrent, fetchAllSpeciesConcurrent } = await import('../lib/pokeapi');
      const { simplifyPokemon } = await import('../lib/data');

      const [pokemonListResponse, speciesListResponse] = await Promise.all([
        fetchPokemonList(1351, 0),
        fetchPokemonSpeciesList(1025, 0),
      ]);

      const pokemonDetails = await fetchAllPokemonConcurrent(
        pokemonListResponse.results.map((p: any) => parseInt(p.url.split('/').slice(-2)[0]))
      );

      const speciesDetails = await fetchAllSpeciesConcurrent(
        speciesListResponse.results.map((s: any) => parseInt(s.url.split('/').slice(-2)[0]))
      );

      const speciesMap = new Map(speciesDetails.filter((s): s is any => s !== null).map((s) => [s.name, s]));

      const simplifiedList: any[] = [];
      for (const pokemon of pokemonDetails.filter((p): p is any => p !== null)) {
        const species = speciesMap.get(pokemon.name);
        if (species) {
          simplifiedList.push(simplifyPokemon(pokemon, species));
        }
      }

      setPokemonList(simplifiedList);
      setLocalStorage('pokedex-pokemon-list', simplifiedList);
    } catch (error) {
      console.error('Failed to load Pokémon list:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = filterPokemon(pokemonList, {
      search: searchQuery,
      types: selectedTypes,
      generation: selectedGeneration,
      rarity: selectedRarities,
    });
    result = sortPokemon(result, sortBy);
    setFilteredPokemon(result);
  }

  function handleTypeToggle(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleRarityToggle(rarity: string) {
    setSelectedRarities((prev) =>
      prev.includes(rarity) ? prev.filter((r) => r !== rarity) : [...prev, rarity]
    );
  }

  function handleClearFilters() {
    setSelectedTypes([]);
    setSelectedGeneration(null);
    setSelectedRarities([]);
    setSearchQuery('');
  }

  const { items, total, totalPages, currentPage: current, hasMore } = paginatePokemon(
    filteredPokemon,
    currentPage,
    perPage
  );

  const generations = Array.from({ length: 9 }, (_, i) => `generation-${i + 1}`);

  const rarities = ['common', 'legendary', 'mythical', 'baby'];

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading Pokémon list...</p>
      </div>
    );
  }

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />

      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">All Pokémon</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {total} Pokémon found
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-1">
          <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 sticky top-24">
            <FilterBar
              types={TYPES}
              generations={generations}
              rarities={rarities}
              selectedTypes={selectedTypes}
              selectedGeneration={selectedGeneration}
              selectedRarities={selectedRarities}
              onTypeToggle={handleTypeToggle}
              onGenerationChange={setSelectedGeneration}
              onRarityToggle={handleRarityToggle}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        <div class="lg:col-span-3">
          <div class="flex items-center justify-between mb-4">
            <SearchBar
              value={searchQuery}
              onSearch={setSearchQuery}
              placeholder="Search Pokémon..."
              class="max-w-md"
            />
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>

          {items.length === 0 ? (
            <div class="text-center py-12">
              <p class="text-gray-600 dark:text-gray-400">No Pokémon found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((p) => (
                <Link key={p.id} href={`/pokemon/${p.id}/`}>
                  <PokemonCard
                    id={p.id}
                    name={p.name}
                    types={p.types}
                    officialArtwork={p.official_artwork}
                    baseStatTotal={p.base_stat_total}
                    compact={true}
                  />
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={current}
              totalPages={totalPages}
              onPageChange={(page) => {
                window.location.href = `/pokemon/page/${page}/`;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
