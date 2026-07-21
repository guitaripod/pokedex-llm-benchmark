import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, BackButton, Pagination, SearchBar, SortSelect } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge } from '../components/ui/TypeBadge';
import { fetchAbilityList, fetchAbility } from '../lib/pokeapi';
import { simplifyAbility, filterAbilities, sortAbilities, paginateAbilities } from '../lib/data';

export function AbilityListPage({ page }: { page?: string }) {
  const currentPage = page ? parseInt(page) : 1;
  const [abilities, setAbilities] = useState<any[]>([]);
  const [filteredAbilities, setFilteredAbilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const perPage = 48;

  useEffect(() => {
    loadAbilities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [abilities, searchQuery, sortBy]);

  async function loadAbilities() {
    try {
      const list = await fetchAbilityList(373, 0);
      const simplified = list.results.map((a: any) => {
        const id = parseInt(a.url.split('/').slice(-2)[0]);
        return { id, name: a.name, generation: 'generation-i', is_hidden: false };
      });
      setAbilities(simplified);
    } catch (error) {
      console.error('Failed to load abilities:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...abilities];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    result = sortAbilities(result, sortBy);
    setFilteredAbilities(result);
  }

  const { items: pageItems, total, totalPages, currentPage: current } = paginateAbilities(filteredAbilities, currentPage, perPage);

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading abilities...</p>
      </div>
    );
  }

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">All Abilities</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{total} abilities found</p>

      <div class="flex items-center gap-4 mb-6">
        <SearchBar value={searchQuery} onSearch={setSearchQuery} placeholder="Search abilities..." class="max-w-md" />
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {pageItems.map((ability) => (
          <Link key={ability.id} href={`/abilities/${ability.name}/`}>
            <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-4 text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">#{ability.id}</div>
              <h3 class="font-bold capitalize text-sm">{ability.name.replace(/-/g, ' ')}</h3>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={current}
          totalPages={totalPages}
          onPageChange={(page) => { window.location.href = `/abilities/page/${page}/`; }}
        />
      )}
    </div>
  );
}

export function AbilityDetailPage({ id }: { id: string }) {
  const [ability, setAbility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAbility();
  }, [id]);

  async function loadAbility() {
    setLoading(true);
    try {
      const data = await fetchAbility(id);
      setAbility(data);
      document.title = `${data.name.replace(/-/g, ' ')} - Pokédex Fable 5 Low`;
    } catch (error) {
      console.error('Failed to load ability:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !ability) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading ability data...</p>
      </div>
    );
  }

  const shortEffect = ability.effect_entries?.find((e: any) => e.language.name === 'en')?.short_effect || 'No effect description available.';
  const fullEffect = ability.effect_entries?.find((e: any) => e.language.name === 'en')?.effect || '';

  return (
    <div class="animate-fade-in">
      <BackButton href="/abilities/" />

      <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <h1 class="text-3xl font-bold capitalize">{ability.name.replace(/-/g, ' ')}</h1>
          {ability.is_main_series && (
            <span class="px-2 py-1 text-xs bg-pokemon-red text-white rounded-full">Main Series</span>
          )}
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Generation</span>
            <p class="font-medium capitalize">{ability.generation?.name.replace(/-/g, ' ') || '—'}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Pokémon with this ability</span>
            <p class="font-medium">{ability.pokemon?.length || 0}</p>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Effect</h3>
          <p class="text-gray-700 dark:text-gray-300">{shortEffect}</p>
        </div>

        {fullEffect && (
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Detailed Effect</h3>
            <p class="text-gray-700 dark:text-gray-300">{fullEffect.replace(/\n/g, ' ')}</p>
          </div>
        )}

        {ability.pokemon && ability.pokemon.length > 0 && (
          <div>
            <h3 class="text-lg font-semibold mb-3">
              Pokémon with {ability.name.replace(/-/g, ' ')}
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {ability.pokemon.slice(0, 24).map((p: any) => (
                <Link key={p.pokemon.name} href={`/pokemon/${p.pokemon.name}/`}>
                  <PokemonCard
                    id={parseInt(p.pokemon.url.split('/').slice(-2)[0])}
                    name={p.pokemon.name}
                    types={[]}
                    compact={true}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
