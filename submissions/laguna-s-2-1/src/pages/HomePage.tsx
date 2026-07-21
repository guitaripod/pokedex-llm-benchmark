import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, SearchBar, RarityBadge, BSTBadge } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge } from '../components/ui/TypeBadge';
import { fetchPokemonList, fetchPokemonSpeciesList, fetchAllPokemonConcurrent, fetchAllSpeciesConcurrent } from '../lib/pokeapi';
import { simplifyPokemon, buildSearchIndex, filterPokemon, sortPokemon, getStarterPokemons, getLegendaryPokemons, getPseudoLegendaryPokemons, getBabyPokemons, getUltraBeasts } from '../lib/data';
import { getGenerationRange, getGenerationFromId, TYPE_ORDER, POKEMON_OFFICIAL_ARTWORK_URL } from '../types';
import { getLocalStorage, setLocalStorage, randomChoice, randomInt } from '../lib/utils';

export function HomePage() {
  const [featuredPokemon, setFeaturedPokemon] = useState<any[]>([]);
  const [starterPokemon, setStarterPokemon] = useState<any[]>([]);
  const [legendaryPokemon, setLegendaryPokemon] = useState<any[]>([]);
  const [pseudoPokemon, setPseudoPokemon] = useState<any[]>([]);
  const [babyPokemon, setBabyPokemon] = useState<any[]>([]);
  const [ultraBeasts, setUltraBeasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHomePageData();
  }, []);

  async function loadHomePageData() {
    try {
      const [pokemonList, speciesList] = await Promise.all([
        fetchPokemonList(1351, 0),
        fetchPokemonSpeciesList(1025, 0),
      ]);

      const speciesMap = new Map(speciesList.results.map((s: any) => [s.name, s]));

      const pokemonDetails = await fetchAllPokemonConcurrent(
        pokemonList.results.map((p: any) => parseInt(p.url.split('/').slice(-2)[0]))
      );

      const speciesDetails = await fetchAllSpeciesConcurrent(
        speciesList.results.map((s: any) => parseInt(s.url.split('/').slice(-2)[0]))
      );

      const speciesMapFull = new Map(speciesDetails.filter((s): s is any => s !== null).map((s) => [s.name, s]));
      const pokemonMap = new Map(pokemonDetails.filter((p): p is any => p !== null).map((p) => [p.name, p]));

      const simplifiedList: any[] = [];
      for (const pokemon of pokemonDetails.filter((p): p is any => p !== null)) {
        const species = speciesMapFull.get(pokemon.name);
        if (species) {
          simplifiedList.push(simplifyPokemon(pokemon, species));
        }
      }

      setFeaturedPokemon(simplifiedList.slice(0, 12));
      setStarterPokemon(getStarterPokemons(simplifiedList));
      setLegendaryPokemon(getLegendaryPokemons(simplifiedList).slice(0, 12));
      setPseudoPokemon(getPseudoLegendaryPokemons(simplifiedList));
      setBabyPokemon(getBabyPokemons(simplifiedList));
      setUltraBeasts(getUltraBeasts(simplifiedList));

      const searchIndex = buildSearchIndex(simplifiedList);
      setLocalStorage('pokedex-search-index', searchIndex);
      setLocalStorage('pokedex-pokemon-list', simplifiedList);
    } catch (error) {
      console.error('Failed to load home page data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      window.location.href = `/pokemon/${searchTerm.replace(/\s+/g, '-')}/`;
    }
  };

  const handleRandomPokemon = () => {
    const randomId = randomInt(1, 1025);
    window.location.href = `/pokemon/${randomId}/`;
  };

  const renderPokemonSection = (title: string, pokemon: any[], href: string) => {
    if (!pokemon.length) return null;
    return (
      <section class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <Link
            href={href}
            class="text-sm font-medium text-pokemon-red hover:text-red-600 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {pokemon.map((p) => (
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
      </section>
    );
  };

  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" class="mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Loading Pokédex data...</p>
      </div>
    );
  }

  return (
    <div class="animate-fade-in">
      <section class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-pokemon-red mb-4">
          Pokédex Fable 5 Low
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          The greatest Pokédex ever built. Every Pokémon, every form, every stat — powered by PokéAPI data on Cloudflare Workers.
        </p>

        <div class="max-w-2xl mx-auto mb-6">
          <SearchBar
            value={searchQuery}
            onSearch={handleSearch}
            placeholder="Search by name or Pokédex number... (press /)"
          />
        </div>

        <button
          onClick={handleRandomPokemon}
          class="px-6 py-2 bg-pokemon-red text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
        >
          Random Pokémon (R)
        </button>
      </section>

      {renderPokemonSection('Featured Pokémon', featuredPokemon, '/pokemon/')}
      {renderPokemonSection('Starter Pokémon', starterPokemon, '/pokemon/')}
      {renderPokemonSection('Legendary & Mythical', legendaryPokemon, '/legends')}
      {renderPokemonSection('Pseudo-Legendary', pseudoPokemon, '/pokemon/')}
      {renderPokemonSection('Baby Pokémon', babyPokemon, '/pokemon/')}
      {renderPokemonSection('Ultra Beasts', ultraBeasts, '/pokemon/')}
    </div>
  );
}
