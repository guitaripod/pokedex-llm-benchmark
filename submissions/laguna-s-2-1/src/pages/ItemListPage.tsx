import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, BackButton, Pagination, SearchBar, SortSelect } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { fetchItemList, fetchItem } from '../lib/pokeapi';
import { simplifyItem, filterItems, sortItems, paginateItems } from '../lib/data';

export function ItemListPage({ page }: { page?: string }) {
  const currentPage = page ? parseInt(page) : 1;
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('name-asc');
  const perPage = 48;

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, searchQuery, selectedCategory, sortBy]);

  async function loadItems() {
    try {
      const list = await fetchItemList(2221, 0);
      const simplified = list.results.map((item: any) => {
        const id = parseInt(item.url.split('/').slice(-2)[0]);
        return { id, name: item.name, category: 'item', cost: 0, fling_power: null, fling_effect: null, generation: 'generation-i' };
      });
      setItems(simplified);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...items];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      result = result.filter((i) => i.category === selectedCategory);
    }
    result = sortItems(result, sortBy);
    setFilteredItems(result);
  }

  const { items: pageItems, total, totalPages, currentPage: current } = paginateItems(filteredItems, currentPage, perPage);

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading items...</p>
      </div>
    );
  }

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">All Items</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{total} items found</p>

      <div class="flex items-center gap-4 mb-6">
        <SearchBar value={searchQuery} onSearch={setSearchQuery} placeholder="Search items..." class="max-w-md" />
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {pageItems.map((item) => (
          <Link key={item.id} href={`/items/${item.name}/`}>
            <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-4 text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">#{item.id}</div>
              <h3 class="font-bold capitalize text-sm">{item.name.replace(/-/g, ' ')}</h3>
              {item.cost > 0 && (
                <p class="text-xs text-yellow-600 mt-1">¥{item.cost}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={current}
          totalPages={totalPages}
          onPageChange={(page) => { window.location.href = `/items/page/${page}/`; }}
        />
      )}
    </div>
  );
}

export function ItemDetailPage({ id }: { id: string }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    setLoading(true);
    try {
      const data = await fetchItem(id);
      setItem(data);
      document.title = `${data.name.replace(/-/g, ' ')} - Pokédex Fable 5 Low`;
    } catch (error) {
      console.error('Failed to load item:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !item) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading item data...</p>
      </div>
    );
  }

  const shortEffect = item.effect_entries?.find((e: any) => e.language.name === 'en')?.short_effect || 'No effect description available.';
  const fullEffect = item.effect_entries?.find((e: any) => e.language.name === 'en')?.effect || '';

  return (
    <div class="animate-fade-in">
      <BackButton href="/items/" />

      <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <h1 class="text-3xl font-bold capitalize">{item.name.replace(/-/g, ' ')}</h1>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Cost</span>
            <p class="font-medium">{item.cost > 0 ? `¥${item.cost}` : 'Free'}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Category</span>
            <p class="font-medium capitalize">{item.category?.name.replace(/-/g, ' ') || '—'}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Generation</span>
            <p class="font-medium capitalize">{item.generation?.name.replace(/-/g, ' ') || '—'}</p>
          </div>
          {item.fling_power && (
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Fling Power</span>
              <p class="font-medium">{item.fling_power}</p>
            </div>
          )}
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

        {item.flavor_text_entries && item.flavor_text_entries.length > 0 && (
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Flavor Text</h3>
            <div class="space-y-2">
              {item.flavor_text_entries
                .filter((e: any) => e.language.name === 'en')
                .slice(0, 3)
                .map((e: any, i: number) => (
                  <p key={i} class="italic text-gray-700 dark:text-gray-300">
                    "{e.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ')}"
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
