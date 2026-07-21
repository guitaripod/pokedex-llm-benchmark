import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { TypeBadge, TypeOffensiveChart, TypeDefenseChart } from '../components/ui/TypeBadge';
import { PokemonCard, BackButton } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { fetchType, fetchTypeList, fetchAllTypesConcurrent } from '../lib/pokeapi';
import { TYPE_ORDER } from '../types';
import { getGenerationFromName, getGenerationLabel, getVersionGroupLabel } from '../lib/utils';

export function TypePage({ type }: { type: string }) {
  const [typeData, setTypeData] = useState<any>(null);
  const [allTypes, setAllTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTypeData();
  }, [type]);

  async function loadTypeData() {
    setLoading(true);
    try {
      const data = await fetchType(type);
      setTypeData(data);

      const list = await fetchAllTypesConcurrent(TYPE_ORDER.slice(0, 18));
      setAllTypes(list.filter((t): t is any => t !== null));

      document.title = `${type.charAt(0).toUpperCase() + type.slice(1)} Type - Pokédex Fable 5 Low`;
    } catch (error) {
      console.error('Failed to load type data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !typeData) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading type data...</p>
      </div>
    );
  }

  const buildTypeEffectivenessMatrix = () => {
    const matrix: { [key: string]: { [key: string]: number } } = {};
    for (const attacker of TYPE_ORDER.slice(0, 18)) {
      matrix[attacker] = {};
      const typeInfo = allTypes.find((t) => t.name === attacker);
      if (!typeInfo) continue;
      for (const defender of TYPE_ORDER.slice(0, 18)) {
        let multiplier = 1;
        const relations = typeInfo.damage_relations;
        if (relations.double_damage_to.some((t: any) => t.name === defender)) multiplier *= 2;
        if (relations.half_damage_to.some((t: any) => t.name === defender)) multiplier *= 0.5;
        if (relations.no_damage_to.some((t: any) => t.name === defender)) multiplier *= 0;
        matrix[attacker][defender] = multiplier;
      }
    }
    return matrix;
  };

  const matrix = buildTypeEffectivenessMatrix();

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'pokemon', label: 'Pokémon' },
    { id: 'moves', label: 'Moves' },
    { id: 'matrix', label: 'Effectiveness Matrix' },
  ];

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />

      <div class="flex items-center gap-4 mb-6">
        <TypeBadge type={type} size="lg" />
        <h1 class="text-3xl font-bold capitalize">{type} Type</h1>
      </div>

      <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                class={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-pokemon-red border-b-2 border-pokemon-red'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div class="p-6">
          {activeTab === 'overview' && (
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold mb-3">Offensive Profile</h3>
                <TypeOffensiveChart
                  attackingType={type}
                  matrix={matrix}
                  allTypes={TYPE_ORDER.slice(0, 18)}
                />
              </div>

              <div>
                <h3 class="text-lg font-semibold mb-3">Defensive Profile</h3>
                <TypeDefenseChart
                  defendingTypes={[type]}
                  attackingTypes={TYPE_ORDER.slice(0, 18)}
                  matrix={matrix}
                />
              </div>

              {typeData.generation && (
                <div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    Generation: {getGenerationLabel(getGenerationFromName(typeData.generation.name))}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pokemon' && (
            <div class="space-y-4">
              <h3 class="text-lg font-semibold mb-3">
                Pokémon of this Type ({typeData.pokemon.length})
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {typeData.pokemon.map((p: any) => (
                  <Link key={p.pokemon.name} href={`/pokemon/${p.pokemon.name}/`}>
                    <PokemonCard
                      id={parseInt(p.pokemon.url.split('/').slice(-2)[0])}
                      name={p.pokemon.name}
                      types={[type]}
                      compact={true}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'moves' && (
            <div class="space-y-4">
              <h3 class="text-lg font-semibold mb-3">
                Moves of this Type ({typeData.moves.length})
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th class="text-left py-2">Move</th>
                      <th class="text-left py-2">Category</th>
                      <th class="text-left py-2">Power</th>
                      <th class="text-left py-2">Accuracy</th>
                      <th class="text-left py-2">PP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeData.moves.map((m: any) => (
                      <MoveRow key={m.name} moveName={m.name} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div class="overflow-x-auto">
              <table class="border-collapse">
                <thead>
                  <tr>
                    <th class="w-12 h-12" />
                    {TYPE_ORDER.slice(0, 18).map((t) => (
                      <th key={t} class="w-10 h-12">
                        <TypeBadge type={t} size="sm" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TYPE_ORDER.slice(0, 18).map((attacker) => (
                    <tr key={attacker}>
                      <td class="w-12 h-12">
                        <TypeBadge type={attacker} size="sm" />
                      </td>
                      {TYPE_ORDER.slice(0, 18).map((defender) => {
                        const mult = matrix[attacker]?.[defender] ?? 1;
                        const label = mult === 0 ? '0' : mult === 0.25 ? '¼' : mult === 0.5 ? '½' : mult.toString();
                        const color =
                          mult === 0
                            ? 'bg-gray-400'
                            : mult <= 0.5
                            ? 'bg-blue-400'
                            : mult === 1
                            ? 'bg-gray-500'
                            : 'bg-red-500';
                        return (
                          <td key={`${attacker}-${defender}`} class="w-10 h-10">
                            <div class={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${color}`}>
                              {label}×
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MoveRow({ moveName }: { moveName: string }) {
  const [move, setMove] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMove();
  }, [moveName]);

  async function loadMove() {
    try {
      const { fetchMove } = await import('../lib/pokeapi');
      const data = await fetchMove(moveName);
      setMove(data);
    } catch (error) {
      console.error('Failed to load move:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !move) {
    return (
      <tr>
        <td class="py-2">{moveName.replace(/-/g, ' ')}</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
      </tr>
    );
  }

  return (
    <tr class="border-b border-gray-100 dark:border-gray-800">
      <td class="py-2">
        <Link
          href={`/moves/${move.name}/`}
          class="font-medium text-pokemon-red hover:text-red-600"
        >
          {move.name.replace(/-/g, ' ')}
        </Link>
      </td>
      <td class="py-2 capitalize">{move.damage_class?.name || 'status'}</td>
      <td class="py-2">{move.power || '—'}</td>
      <td class="py-2">{move.accuracy || '—'}</td>
      <td class="py-2">{move.pp || '—'}</td>
    </tr>
  );
}
