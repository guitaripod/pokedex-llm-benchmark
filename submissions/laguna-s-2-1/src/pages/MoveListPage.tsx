import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, BackButton, Pagination, SearchBar, SortSelect } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge } from '../components/ui/TypeBadge';
import { fetchMoveList, fetchMove } from '../lib/pokeapi';
import { simplifyMove, filterMoves, sortMoves, paginateMoves } from '../lib/data';

export function MoveListPage({ page }: { page?: string }) {
  const currentPage = page ? parseInt(page) : 1;
  const [moves, setMoves] = useState<any[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('name-asc');
  const perPage = 48;

  useEffect(() => {
    loadMoves();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [moves, searchQuery, selectedType, selectedCategory, sortBy]);

  async function loadMoves() {
    try {
      const list = await fetchMoveList(937, 0);
      const simplified = list.results.map((m: any) => {
        const id = parseInt(m.url.split('/').slice(-2)[0]);
        return { id, name: m.name, type: 'normal', damage_class: 'status', power: null, accuracy: null, pp: null, priority: 0, generation: 'generation-i', learned_by_count: 0 };
      });
      setMoves(simplified);
    } catch (error) {
      console.error('Failed to load moves:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...moves];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    if (selectedType) {
      result = result.filter((m) => m.type === selectedType);
    }
    if (selectedCategory) {
      result = result.filter((m) => m.damage_class === selectedCategory);
    }
    result = sortMoves(result, sortBy);
    setFilteredMoves(result);
  }

  const { items, total, totalPages, currentPage: current } = paginateMoves(filteredMoves, currentPage, perPage);

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading moves...</p>
      </div>
    );
  }

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">All Moves</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{total} moves found</p>

      <div class="flex items-center gap-4 mb-6">
        <SearchBar value={searchQuery} onSearch={setSearchQuery} placeholder="Search moves..." class="max-w-md" />
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((m) => (
          <Link key={m.id} href={`/moves/${m.name}/`}>
            <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-4 text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">#{m.id}</div>
              <h3 class="font-bold capitalize">{m.name.replace(/-/g, ' ')}</h3>
              <div class="mt-2 flex justify-center">
                <TypeBadge type={m.type} size="sm" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={current}
          totalPages={totalPages}
          onPageChange={(page) => { window.location.href = `/moves/page/${page}/`; }}
        />
      )}
    </div>
  );
}

export function MoveDetailPage({ id }: { id: string }) {
  const [move, setMove] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMove();
  }, [id]);

  async function loadMove() {
    setLoading(true);
    try {
      const data = await fetchMove(id);
      setMove(data);
      document.title = `${data.name.replace(/-/g, ' ')} - Pokédex Fable 5 Low`;
    } catch (error) {
      console.error('Failed to load move:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !move) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading move data...</p>
      </div>
    );
  }

  const shortEffect = move.effect_entries?.find((e: any) => e.language.name === 'en')?.short_effect || 'No effect description available.';
  const fullEffect = move.effect_entries?.find((e: any) => e.language.name === 'en')?.effect || '';
  const flavorText = move.flavor_text_entries?.find((e: any) => e.language.name === 'en')?.flavor_text || '';

  return (
    <div class="animate-fade-in">
      <BackButton href="/moves/" />

      <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <h1 class="text-3xl font-bold capitalize">{move.name.replace(/-/g, ' ')}</h1>
          <TypeBadge type={move.type?.name || 'normal'} size="md" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Category</span>
            <p class="font-medium capitalize">{move.damage_class?.name || 'status'}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Power</span>
            <p class="font-medium">{move.power || '—'}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Accuracy</span>
            <p class="font-medium">{move.accuracy || '—'}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">PP</span>
            <p class="font-medium">{move.pp || '—'}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Priority</span>
            <p class="font-medium">{move.priority}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Generation</span>
            <p class="font-medium capitalize">{move.generation?.name.replace(/-/g, ' ') || '—'}</p>
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

        {flavorText && (
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Flavor Text</h3>
            <p class="italic text-gray-700 dark:text-gray-300">{flavorText.replace(/\n/g, ' ').replace(/\f/g, ' ')}</p>
          </div>
        )}

        {move.meta && (
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Meta</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {move.meta.ailment?.name && (
                <div><span class="text-gray-500">Ailment:</span> {move.meta.ailment.name}</div>
              )}
              {move.meta.ailment_chance && (
                <div><span class="text-gray-500">Ailment Chance:</span> {move.meta.ailment_chance}%</div>
              )}
              {move.meta.flinch_chance && (
                <div><span class="text-gray-500">Flinch Chance:</span> {move.meta.flinch_chance}%</div>
              )}
              {move.meta.crit_rate && (
                <div><span class="text-gray-500">Crit Rate:</span> {move.meta.crit_rate}</div>
              )}
              {move.meta.min_hits && (
                <div><span class="text-gray-500">Min Hits:</span> {move.meta.min_hits}</div>
              )}
              {move.meta.max_hits && (
                <div><span class="text-gray-500">Max Hits:</span> {move.meta.max_hits}</div>
              )}
              {move.meta.min_turns && (
                <div><span class="text-gray-500">Min Turns:</span> {move.meta.min_turns}</div>
              )}
              {move.meta.max_turns && (
                <div><span class="text-gray-500">Max Turns:</span> {move.meta.max_turns}</div>
              )}
              {move.meta.healing && move.meta.healing !== 0 && (
                <div><span class="text-gray-500">Healing:</span> {move.meta.healing}</div>
              )}
              {move.meta.drain && move.meta.drain !== 0 && (
                <div><span class="text-gray-500">Drain:</span> {move.meta.drain}</div>
              )}
            </div>
          </div>
        )}

        {move.learned_by_pokemon && move.learned_by_pokemon.length > 0 && (
          <div>
            <h3 class="text-lg font-semibold mb-3">
              Learned by {move.learned_by_pokemon.length} Pokémon
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {move.learned_by_pokemon.slice(0, 24).map((p: any) => (
                <Link key={p.name} href={`/pokemon/${p.name}/`}>
                  <PokemonCard
                    id={parseInt(p.url.split('/').slice(-2)[0])}
                    name={p.name}
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
