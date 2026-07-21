import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import {
  PokemonSprite,
  CryPlayer,
  StatBar,
  StatRadar,
  BSTBadge,
  RarityBadge,
  FavoriteButton,
  ShareButton,
  BackButton,
  Pagination,
} from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge, TypeList, TypeDefenseChart } from '../components/ui/TypeBadge';
import {
  fetchPokemon,
  fetchPokemonSpecies,
  fetchEvolutionChain,
  fetchType,
  fetchMove,
  fetchAbility,
  fetchItem,
  fetchAllTypesConcurrent,
  fetchPokemonEncounters,
} from '../lib/pokeapi';
import {
  formatId,
  formatName,
  formatHeight,
  formatWeight,
  calculateBST,
  getRarity,
  getRarityLabel,
  getRarityColor,
  getGenderRatio,
  getGenderSymbol,
  getEggSteps,
  getCatchRateLabel,
  getCatchRateColor,
  getBaseHappinessLabel,
  getGrowthRateLabel,
  getNatureStatChange,
  getMoveCategoryLabel,
  getMoveCategoryColor,
  getMovePowerLabel,
  getMoveAccuracyLabel,
  getMovePPLabel,
  getMovePriorityLabel,
  getMovePriorityColor,
  getMoveLearnMethodLabel,
  getMoveLearnMethodColor,
  getEncounterMethodLabel,
  getEncounterMethodColor,
  getVersionGroupLabel,
  getVersionLabel,
  getEggGroupLabel,
  getShapeLabel,
  getHabitatLabel,
  getColorLabel,
  getGenerationFromName,
  getGenerationLabel,
  getGenerationRange,
  getGenerationFromId,
  getGenerationId,
  getFlavorText,
  getEffectText,
  getShortEffectText,
  getLanguageFlag,
  getLanguageLabel,
  getLocalStorage,
  setLocalStorage,
} from '../lib/utils';
import {
  addFavorite,
  removeFavorite,
  isFavorite,
  toggleFavorite,
  getSettings,
} from '../lib/init';
import {
  TYPE_ORDER,
  TYPE_SYMBOL_URL,
  POKEMON_OFFICIAL_ARTWORK_URL,
  POKEMON_OFFICIAL_ARTWORK_SHINY_URL,
  POKEMON_SHOWDOWN_URL,
  POKEMON_SHOWDOWN_SHINY_URL,
} from '../types';
import {
  buildEvolutionChain,
  buildMovePool,
  buildStatBlock,
  buildTypeBlock,
  buildAbilityBlock,
  buildSpriteBlock,
  buildCryBlock,
  buildHeldItemBlock,
  buildGameIndexBlock,
  buildFlavorTextBlock,
  buildGeneraBlock,
  buildPokedexNumberBlock,
  buildVarietiesBlock,
  buildBreedingData,
  buildLoreEntries,
  buildLegendData,
} from '../lib/data';

export function PokemonDetailPage({ id }: { id: string }) {
  const [pokemon, setPokemon] = useState<any>(null);
  const [species, setSpecies] = useState<any>(null);
  const [evolutionChain, setEvolutionChain] = useState<any>(null);
  const [typeData, setTypeData] = useState<any>(null);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVersionGroup, setSelectedVersionGroup] = useState('scarlet-violet');
  const [showShiny, setShowShiny] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [spriteVariant, setSpriteVariant] = useState<'official' | 'showdown' | 'default'>('official');

  const pokemonId = parseInt(id);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPokemonData();
  }, [id]);

  useEffect(() => {
    setIsFav(isFavorite(pokemonId));
  }, [pokemonId]);

  async function loadPokemonData() {
    setLoading(true);
    try {
      const [pokemonData, speciesData] = await Promise.all([
        fetchPokemon(pokemonId),
        fetchPokemonSpecies(pokemonId),
      ]);

      setPokemon(pokemonData);
      setSpecies(speciesData);

      const evolutionChainUrl = speciesData.evolution_chain.url;
      const chainId = parseInt(evolutionChainUrl.split('/').slice(-2)[0]);
      const chainData = await fetchEvolutionChain(chainId);

      const speciesMap = new Map();
      speciesMap.set(speciesData.name, speciesData);
      setEvolutionChain(buildEvolutionChain(chainData, speciesMap));

      const typeList = await fetchAllTypesConcurrent(TYPE_ORDER.slice(0, 18));
      const typeMap: Record<string, any> = {};
      typeList.forEach((t, i) => {
        if (t) typeMap[TYPE_ORDER[i]] = t;
      });
      setTypeData(typeMap);

      const encounterData = await fetchPokemonEncounters(pokemonId);
      setEncounters(encounterData);

      document.title = `${formatName(pokemonData.name)} - Pokédex Fable 5 Low`;
    } catch (error) {
      console.error('Failed to load Pokémon data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFavoriteToggle() {
    toggleFavorite(pokemonId);
    setIsFav(!isFav);
  }

  if (loading || !pokemon || !species) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading Pokémon data...</p>
      </div>
    );
  }

  const types = buildTypeBlock(pokemon);
  const stats = buildStatBlock(pokemon);
  const bst = stats.base_stat_total;
  const rarity = getRarity(pokemon, species);
  const genderRatio = getGenderRatio(species.gender_rate);
  const spriteBlock = buildSpriteBlock(pokemon);
  const cryBlock = buildCryBlock(pokemon);
  const heldItems = buildHeldItemBlock(pokemon);
  const gameIndices = buildGameIndexBlock(pokemon);
  const flavorTexts = buildFlavorTextBlock(species, getSettings().language);
  const genera = buildGeneraBlock(species, getSettings().language);
  const pokedexNumbers = buildPokedexNumberBlock(species);
  const varieties = buildVarietiesBlock(species);
  const breedingData = buildBreedingData(species);
  const movePool = buildMovePool(pokemon);
  const loreEntries = buildLoreEntries(species, getSettings().language);

  const currentMovePool = movePool[selectedVersionGroup] || movePool['scarlet-violet'] || {};

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'moves', label: 'Moves' },
    { id: 'sprites', label: 'Sprites' },
    { id: 'encounters', label: 'Encounters' },
    { id: 'lore', label: 'Lore' },
    { id: 'evolution', label: 'Evolution' },
  ];

  return (
    <div class="animate-fade-in">
      <BackButton href="/pokemon/" />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-1">
          <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 text-center">
            <div class="flex items-center justify-center gap-2 mb-4">
              <span class="text-2xl font-bold text-pokemon-red">{formatId(pokemon.id)}</span>
              <h1 class="text-2xl font-bold capitalize">{formatName(pokemon.name)}</h1>
              {genera && <span class="text-sm text-gray-500 dark:text-gray-400">({genera})</span>}
            </div>

            <div class="flex items-center justify-center gap-2 mb-4">
              <RarityBadge rarity={rarity} />
              <BSTBadge bst={bst} />
            </div>

            <div class="relative inline-block mb-4">
              <img
                src={showShiny ? spriteBlock.official_artwork_shiny || spriteBlock.official_artwork : spriteBlock.official_artwork}
                alt={pokemon.name}
                class="w-48 h-48 object-contain mx-auto"
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
                }}
              />
              {showShiny && (
                <span class="absolute top-0 right-0 text-xs bg-yellow-400 text-yellow-900 px-1 rounded-full">
                  ★ Shiny
                </span>
              )}
            </div>

            <div class="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setShowShiny(!showShiny)}
                class={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  showShiny
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {showShiny ? 'Shiny ON' : 'Shiny OFF'}
              </button>
              <CryPlayer id={pokemon.id} name={pokemon.name} />
              <FavoriteButton id={pokemon.id} isFilled={isFav} onClick={handleFavoriteToggle} />
              <ShareButton url={window.location.href} title={`Check out ${formatName(pokemon.name)}!`} />
            </div>

            <TypeList types={types} size="md" />

            <div class="mt-4 flex justify-center">
              <StatRadar stats={pokemon.stats.map((s: any) => ({ stat: s.stat.name, base_stat: s.base_stat }))} size={140} />
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl mb-6">
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
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'moves' && renderMoves()}
              {activeTab === 'sprites' && renderSprites()}
              {activeTab === 'encounters' && renderEncounters()}
              {activeTab === 'lore' && renderLore()}
              {activeTab === 'evolution' && renderEvolution()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function renderOverview() {
    return (
      <div class="space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Height</span>
            <p class="font-medium">{formatHeight(pokemon.height)}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Weight</span>
            <p class="font-medium">{formatWeight(pokemon.weight)}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Base Experience</span>
            <p class="font-medium">{pokemon.base_experience} XP</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Catch Rate</span>
            <p class={`font-medium ${getCatchRateColor(species.capture_rate)}`}>
              {species.capture_rate} ({getCatchRateLabel(species.capture_rate)})
            </p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-3">Base Stats</h3>
          <StatBar stat="hp" value={stats.hp} maxValue={255} />
          <StatBar stat="attack" value={stats.attack} maxValue={255} />
          <StatBar stat="defense" value={stats.defense} maxValue={255} />
          <StatBar stat="special-attack" value={stats['special-attack']} maxValue={255} />
          <StatBar stat="special-defense" value={stats['special-defense']} maxValue={255} />
          <StatBar stat="speed" value={stats.speed} maxValue={255} />
          <div class="mt-3 text-right">
            <span class="font-bold">Total: {bst}</span>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-3">Abilities</h3>
          <div class="space-y-2">
            {buildAbilityBlock(pokemon).map((ab: any) => (
              <div key={ab.slot} class="flex items-center gap-2">
                <Link
                  href={`/abilities/${ab.name}/`}
                  class="font-medium text-pokemon-red hover:text-red-600 capitalize"
                >
                  {formatName(ab.name)}
                </Link>
                {ab.is_hidden && <span class="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">Hidden</span>}
              </div>
            ))}
          </div>
        </div>

        {typeData && (
          <div>
            <h3 class="text-lg font-semibold mb-3">Defensive Type Effectiveness</h3>
            <TypeDefenseChart
              defendingTypes={types}
              attackingTypes={TYPE_ORDER.slice(0, 18)}
              matrix={buildTypeEffectivenessMatrix()}
            />
          </div>
        )}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold mb-3">Breeding Data</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Egg Groups:</span>
                <span class="ml-2">
                  {breedingData.egg_groups.map((eg: string) => getEggGroupLabel(eg)).join(', ')}
                </span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Gender Ratio:</span>
                <span class="ml-2">{getGenderSymbol(genderRatio)}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Steps to Hatch:</span>
                <span class="ml-2">{getEggSteps(breedingData.hatch_counter)}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Is Baby:</span>
                <span class="ml-2">{breedingData.is_baby ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold mb-3">Other Data</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Color:</span>
                <span class="ml-2">{getColorLabel(species.color?.name || 'unknown')}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Shape:</span>
                <span class="ml-2">{getShapeLabel(species.shape?.name || 'unknown')}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Habitat:</span>
                <span class="ml-2">{getHabitatLabel(species.habitat?.name || 'unknown')}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Generation:</span>
                <span class="ml-2">{getGenerationLabel(getGenerationFromName(species.generation.name))}</span>
              </div>
            </div>
          </div>
        </div>

        {heldItems.length > 0 && (
          <div>
            <h3 class="text-lg font-semibold mb-3">Held Items</h3>
            <div class="space-y-2">
              {heldItems.map((item: any) => (
                <div key={item.name} class="flex items-center gap-2">
                  <Link
                    href={`/items/${item.name}/`}
                    class="font-medium text-pokemon-red hover:text-red-600 capitalize"
                  >
                    {formatName(item.name)}
                  </Link>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    Rarity: {item.version_details[0]?.rarity || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pokedexNumbers.length > 0 && (
          <div>
            <h3 class="text-lg font-semibold mb-3">Pokédex Numbers</h3>
            <div class="flex flex-wrap gap-2">
              {pokedexNumbers.map((pn: any) => (
                <span key={pn.pokedex} class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {pn.pokedex}: #{pn.entry_number}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderMoves() {
    return (
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Version Group</label>
          <select
            value={selectedVersionGroup}
            onChange={(e) => setSelectedVersionGroup((e.target as HTMLSelectElement).value)}
            class="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokemon-red"
          >
            {Object.keys(movePool).map((vg) => (
              <option key={vg} value={vg}>
                {getVersionGroupLabel(vg)}
              </option>
            ))}
          </select>
        </div>

        {Object.keys(currentMovePool).length === 0 ? (
          <p class="text-gray-600 dark:text-gray-400">No moves available for this version group.</p>
        ) : (
          Object.entries(currentMovePool).map(([method, moves]: [string, any[]]) => (
            <div key={method}>
              <h4 class="text-md font-semibold mb-2 capitalize">
                {getMoveLearnMethodLabel(method)}
              </h4>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th class="text-left py-2">Move</th>
                      <th class="text-left py-2">Type</th>
                      <th class="text-left py-2">Category</th>
                      <th class="text-left py-2">Power</th>
                      <th class="text-left py-2">Accuracy</th>
                      <th class="text-left py-2">PP</th>
                      <th class="text-left py-2">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moves
                      .sort((a: any, b: any) => (a.method === 'level-up' ? a.level - b.level : 0))
                      .map((m: any) => (
                        <MoveRow key={m.move} moveName={m.move} level={m.level} />
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  function renderSprites() {
    const spriteVariants = [
      { key: 'official', label: 'Official Artwork', url: spriteBlock.official_artwork },
      { key: 'official-shiny', label: 'Official Artwork (Shiny)', url: spriteBlock.official_artwork_shiny },
      { key: 'home', label: 'Home', url: spriteBlock.home },
      { key: 'home-shiny', label: 'Home (Shiny)', url: spriteBlock.home_shiny },
      { key: 'dream', label: 'Dream World', url: spriteBlock.dream_world },
      { key: 'showdown', label: 'Animated (Showdown)', url: spriteBlock.showdown },
      { key: 'showdown-shiny', label: 'Animated (Shiny)', url: spriteBlock.showdown_shiny },
      { key: 'front', label: 'Front Default', url: spriteBlock.front_default },
      { key: 'front-shiny', label: 'Front Shiny', url: spriteBlock.front_shiny },
      { key: 'back', label: 'Back Default', url: spriteBlock.back_default },
      { key: 'back-shiny', label: 'Back Shiny', url: spriteBlock.back_shiny },
    ];

    return (
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Sprites</h3>
          <select
            value={spriteVariant}
            onChange={(e) => setSpriteVariant((e.target as HTMLSelectElement).value as any)}
            class="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokemon-red"
          >
            {spriteVariants.map((sv) => (
              <option key={sv.key} value={sv.key}>
                {sv.label}
              </option>
            ))}
          </select>
        </div>

        {spriteVariants.map((sv) => (
          sv.url && (
            <div key={sv.key} class="flex items-center gap-4">
              <span class="w-24 text-sm font-medium">{sv.label}</span>
              <img
                src={sv.url}
                alt={sv.label}
                class="w-20 h-20 object-contain bg-gray-100 dark:bg-gray-800 rounded-lg p-2"
                loading="lazy"
              />
            </div>
          )
        ))}
      </div>
    );
  }

  function renderEncounters() {
    if (encounters.length === 0) {
      return <p class="text-gray-600 dark:text-gray-400">No encounter data available.</p>;
    }

    return (
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Where to Find {formatName(pokemon.name)}</h3>
        {encounters.map((enc: any, i: number) => (
          <div key={i} class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 class="font-medium capitalize">{enc.location_area.name.replace(/-/g, ' ')}</h4>
            <div class="mt-2 space-y-2">
              {enc.version_details.map((vd: any, j: number) => (
                <div key={j} class="text-sm">
                  <span class="font-medium">{getVersionLabel(vd.version.name)}:</span>
                  <span class="text-gray-600 dark:text-gray-400 ml-2">
                    Max Chance: {vd.max_chance}%
                  </span>
                  <div class="mt-1">
                    {vd.encounter_details.map((ed: any, k: number) => (
                      <div key={k} class="flex items-center gap-2 text-xs">
                        <span class={`px-1.5 py-0.5 rounded ${getEncounterMethodColor(ed.method.name)} text-white`}>
                          {getEncounterMethodLabel(ed.method.name)}
                        </span>
                        <span>Lv. {ed.min_level}-{ed.max_level}</span>
                        <span class="text-gray-500">({ed.chance}% chance)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderLore() {
    return (
      <div class="space-y-6">
        <h3 class="text-lg font-semibold">Pokédex Entries</h3>
        <div class="space-y-4">
          {flavorTexts.map((ft: any, i: number) => (
            <div key={i} class="border-l-4 border-pokemon-red pl-4 py-2">
              <p class="italic text-gray-700 dark:text-gray-300">{ft.text}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">— {getVersionLabel(ft.version)}</p>
            </div>
          ))}
        </div>

        {loreEntries.length > 0 && (
          <div class="mt-8">
            <h4 class="text-md font-semibold mb-3">Lore Summary</h4>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              {loreEntries[0].text}
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderEvolution() {
    if (!evolutionChain) {
      return <p class="text-gray-600 dark:text-gray-400">No evolution data available.</p>;
    }

    return (
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Evolution Chain</h3>
        <div class="overflow-x-auto">
          <EvolutionTree chain={evolutionChain} />
        </div>
      </div>
    );
  }

  function buildTypeEffectivenessMatrix() {
    const matrix: { [key: string]: { [key: string]: number } } = {};
    if (!typeData) return matrix;

    for (const attacker of TYPE_ORDER.slice(0, 18)) {
      matrix[attacker] = {};
      const typeInfo = typeData[attacker];
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
  }
}

function MoveRow({ moveName, level }: { moveName: string; level: number }) {
  const [move, setMove] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMove();
  }, [moveName]);

  async function loadMove() {
    try {
      const data = await fetchMove(moveName);
      setMove(data);
    } catch (error) {
      console.error('Failed to load move:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <tr>
        <td class="py-2">{formatName(moveName)}</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">{level > 0 ? level : '—'}</td>
      </tr>
    );
  }

  if (!move) {
    return (
      <tr>
        <td class="py-2">{formatName(moveName)}</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">—</td>
        <td class="py-2">{level > 0 ? level : '—'}</td>
      </tr>
    );
  }

  return (
    <tr class="border-b border-gray-100 dark:border-gray-800">
      <td class="py-2">
        <Link
          href={`/moves/${move.name}/`}
          class="font-medium text-pokemon-red hover:text-red-600 capitalize"
        >
          {formatName(move.name)}
        </Link>
      </td>
      <td class="py-2">
        <TypeBadge type={move.type?.name || 'normal'} size="sm" />
      </td>
      <td class="py-2">
        <span class={`px-2 py-0.5 rounded text-xs font-medium ${getMoveCategoryColor(move.damage_class?.name || 'status')}`}>
          {getMoveCategoryLabel(move.damage_class?.name || 'status')}
        </span>
      </td>
      <td class="py-2">{getMovePowerLabel(move.power)}</td>
      <td class="py-2">{getMoveAccuracyLabel(move.accuracy)}</td>
      <td class="py-2">{getMovePPLabel(move.pp)}</td>
      <td class="py-2">{level > 0 ? level : '—'}</td>
    </tr>
  );
}

function EvolutionTree({ chain }: { chain: any }) {
  return (
    <div class="flex flex-col items-center">
      <EvolutionNode node={chain} />
    </div>
  );
}

function EvolutionNode({ node }: { node: any }) {
  const pokemonId = node.pokemon_id;
  const spriteUrl = pokemonId
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`
    : null;

  return (
    <div class="flex flex-col items-center">
      <div class="relative">
        {pokemonId && spriteUrl && (
          <img
            src={spriteUrl}
            alt={node.species}
            class="w-24 h-24 object-contain"
            loading="lazy"
          />
        )}
        <div class="text-center mt-2">
          <span class="font-medium capitalize">{formatName(node.species)}</span>
          {node.is_baby && <span class="text-xs text-gray-500 block">Baby</span>}
        </div>
      </div>

      {node.evolution_details.length > 0 && node.evolves_to.length > 0 && (
        <div class="mt-4">
          {node.evolves_to.map((evolved: any, i: number) => (
            <div key={i} class="flex flex-col items-center mt-4">
              <div class="text-center mb-2">
                <div class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {getEvolutionDetails(evolved.evolution_details[0])}
                </div>
              </div>
              <div class="border-l-2 border-dashed border-gray-300 dark:border-gray-600 h-6" />
              <EvolutionNode node={evolved} />
            </div>
          ))}
        </div>
      )}

      {node.evolution_details.length > 0 && node.evolves_to.length === 0 && (
        <div class="mt-4 text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {getEvolutionDetails(node.evolution_details[0])}
          </div>
        </div>
      )}
    </div>
  );
}

function getEvolutionDetails(details: any): string {
  const parts: string[] = [];

  if (details.min_level) parts.push(`Lv. ${details.min_level}`);
  if (details.item) parts.push(`Use ${formatName(details.item.name)}`);
  if (details.held_item) parts.push(`Hold ${formatName(details.held_item.name)}`);
  if (details.trade_species) parts.push('Trade');
  if (details.location) parts.push(`At ${formatName(details.location.name)}`);
  if (details.known_move) parts.push(`Know ${formatName(details.known_move.name)}`);
  if (details.known_move_type) parts.push(`Know ${formatName(details.known_move_type.name)} move`);
  if (details.min_happiness) parts.push(`Happiness: ${details.min_happiness}`);
  if (details.min_affection) parts.push(`Affection: ${details.min_affection}`);
  if (details.min_beauty) parts.push(`Beauty: ${details.min_beauty}`);
  if (details.needs_rain) parts.push('Rain');
  if (details.needs_overworld_rain) parts.push('Overworld Rain');
  if (details.needs_multiplayer) parts.push('Multiplayer');
  if (details.party_species) parts.push('Party has species');
  if (details.party_type) parts.push('Party has type');
  if (details.relative_physical_stats) parts.push('Physical stats');
  if (details.turn_upside_down) parts.push('Upside down');
  if (details.time_of_day) parts.push(`${details.time_of_day} time`);
  if (details.baby_trigger_item) parts.push(`Use ${formatName(details.baby_trigger_item.name)}`);
  if (details.min_move_count) parts.push(`Min moves: ${details.min_move_count}`);
  if (details.min_steps) parts.push(`Steps: ${details.min_steps}`);
  if (details.gender) parts.push(`Gender: ${details.gender}`);
  if (details.region) parts.push(`Region: ${formatName(details.region.name)}`);

  if (details.trigger?.name) {
    parts.push(details.trigger.name.replace(/-/g, ' '));
  }

  return parts.length > 0 ? parts.join(' + ') : 'Level up';
}
