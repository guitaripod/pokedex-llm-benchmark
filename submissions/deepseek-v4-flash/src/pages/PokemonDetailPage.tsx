import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getFullPokemonData } from '../api/pokeapi';
import type { Pokemon, PokemonSpecies, EvolutionChain } from '../types/pokemon';
import { formatPokemonId, formatHeight, formatWeight, sanitizeFlavorText, capitalize, formatGeneration, formatEggGroup, formatHabitat } from '../utils/formatters';
import { getTypeColor } from '../utils/typeColors';
import { TypeBadge } from '../components/pokemon/TypeBadge';
import { StatBar, StatRadar } from '../components/pokemon/StatBar';
import { EvolutionChain as EvolutionChainComponent } from '../components/pokemon/EvolutionChain';
import { TypeEffectiveness } from '../components/pokemon/TypeEffectiveness';
import { MovesSection } from '../components/pokemon/MovesSection';
import { LocationsSection } from '../components/pokemon/LocationsSection';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function PokemonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [spriteMode, setSpriteMode] = useState<'default' | 'shiny'>('default');
  const [prevId, setPrevId] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const numId = parseInt(id);
      setLoading(true);
      try {
        const data = await getFullPokemonData(numId);
        setPokemon(data.pokemon);
        setSpecies(data.species);
        setEvolutionChain(data.evolutionChain);
        setPrevId(numId > 1 ? numId - 1 : null);
        setNextId(numId < 1010 ? numId + 1 : null);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-16"><LoadingSpinner size="lg" /></div>;
  if (!pokemon || !species) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 text-lg">Pokémon not found</p>
      <Link to="/pokedex" className="text-red-400 hover:text-red-300 mt-4 inline-block">← Back to Pokédex</Link>
    </div>
  );

  const primaryType = pokemon.types[0]?.type.name || 'normal';
  const flavorText = species.flavor_text_entries
    .filter(f => f.language.name === 'en')
    .at(-1)?.flavor_text || '';
  const genus = species.genera.find(g => g.language.name === 'en')?.genus || '';

  const officialArt = spriteMode === 'shiny'
    ? pokemon.sprites.other['official-artwork'].front_shiny
    : pokemon.sprites.other['official-artwork'].front_default;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link to="/pokedex" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Pokédex
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div
              className="relative rounded-3xl overflow-hidden border border-gray-800"
              style={{ background: `linear-gradient(135deg, ${getTypeColor(primaryType)}22, ${getTypeColor(primaryType)}08)` }}
            >
              <div className="flex items-center justify-between px-5 pt-4">
                <div className="flex items-center gap-2">
                  {pokemon.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} />)}
                </div>
                <span className="text-lg font-mono font-bold text-gray-500">{formatPokemonId(pokemon.id)}</span>
              </div>

              <div className="px-5 pt-2 pb-1">
                <h1 className="text-3xl font-display font-bold text-white capitalize">{pokemon.name.replace(/-/g, ' ')}</h1>
                <p className="text-sm text-gray-500">{genus}</p>
              </div>

              <div className="relative px-8 py-4 flex justify-center">
                <div
                  className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-32 rounded-full opacity-20 blur-2xl"
                  style={{ backgroundColor: getTypeColor(primaryType) }}
                />
                <img
                  src={officialArt || ''}
                  alt={pokemon.name}
                  className="relative w-64 h-64 object-contain drop-shadow-2xl"
                />
              </div>

              <div className="flex justify-center gap-2 pb-4">
                <button
                  onClick={() => setSpriteMode('default')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    spriteMode === 'default' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setSpriteMode('shiny')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    spriteMode === 'shiny' ? 'bg-yellow-400/20 text-yellow-300' : 'text-gray-500 hover:text-yellow-300'
                  }`}
                >
                  ✨ Shiny
                </button>
              </div>

              <div className="flex items-center justify-between px-3 pb-4">
                {prevId ? (
                  <Link to={`/pokemon/${prevId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    {formatPokemonId(prevId)}
                  </Link>
                ) : <div />}
                {nextId ? (
                  <Link to={`/pokemon/${nextId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                    {formatPokemonId(nextId)}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ) : <div />}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {flavorText && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm text-gray-300 leading-relaxed italic">
                  "{sanitizeFlavorText(flavorText)}"
                </p>
              </div>
            )}

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-white font-display mb-4">Base Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  {pokemon.stats.map((s, i) => (
                    <StatBar key={s.stat.name} statName={s.stat.name} baseStat={s.base_stat} delay={i * 0.1} />
                  ))}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                    <span className="w-10 text-xs font-semibold text-gray-400 text-right">TOT</span>
                    <span className="w-8 text-sm font-bold text-white font-mono text-right">
                      {pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0)}
                    </span>
                    <div className="flex-1" />
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <StatRadar stats={pokemon.stats} types={pokemon.types.map(t => t.type.name)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-white font-display mb-3">Profile</h2>
                <ProfileRow label="Height" value={formatHeight(pokemon.height)} />
                <ProfileRow label="Weight" value={formatWeight(pokemon.weight)} />
                <ProfileRow label="Base XP" value={pokemon.base_experience?.toString() || '—'} />
                <ProfileRow label="Capture Rate" value={species.capture_rate != null ? `${Math.round((species.capture_rate / 255) * 100)}%` : '—'} />
                <ProfileRow label="Base Happiness" value={species.base_happiness != null ? `${species.base_happiness}/255` : '—'} />
                <ProfileRow label="Growth Rate" value={species.growth_rate?.name ? formatEggGroup(species.growth_rate.name) : '—'} />
                <ProfileRow label="Habitat" value={species.habitat ? formatHabitat(species.habitat.name) : '—'} />
                <ProfileRow label="Gender Ratio" value={formatGenderRatio(species.gender_rate)} />
                <ProfileRow label="Generation" value={species.generation ? formatGeneration(species.generation.name) : '—'} />
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-white font-display mb-3">Classification</h2>
                <ProfileRow label="Egg Groups" value={species.egg_groups?.map(g => formatEggGroup(g.name)).join(', ') || '—'} />
                <ProfileRow label="Egg Cycles" value={species.hatch_counter != null ? `${species.hatch_counter} (${species.hatch_counter * 257} steps)` : '—'} />
                <ProfileRow label="Color" value={species.color?.name ? capitalize(species.color.name) : '—'} />
                <ProfileRow label="Shape" value={species.shape?.name ? capitalize(species.shape.name) : '—'} />
                <ProfileRow label="Legendary" value={species.is_legendary ? 'Yes' : 'No'} />
                <ProfileRow label="Mythical" value={species.is_mythical ? 'Yes' : 'No'} />
                <ProfileRow label="Baby" value={species.is_baby ? 'Yes' : 'No'} />
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-white font-display mb-3">Abilities</h2>
              <div className="space-y-2">
                {pokemon.abilities.map(a => (
                  <div key={a.ability.name} className="flex items-center gap-2">
                    <span className={`text-sm font-medium capitalize ${a.is_hidden ? 'text-yellow-400' : 'text-white'}`}>
                      {a.ability.name.replace(/-/g, ' ')}
                    </span>
                    {a.is_hidden && <span className="text-[10px] text-yellow-500/60 font-medium">(Hidden)</span>}
                  </div>
                ))}
              </div>
            </div>

            {evolutionChain && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <EvolutionChainComponent chain={evolutionChain} />
              </div>
            )}

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <TypeEffectiveness types={pokemon.types.map(t => t.type.name)} />
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <MovesSection moves={pokemon.moves} />
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <LocationsSection pokemonId={pokemon.id} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-200 text-right">{value}</span>
    </div>
  );
}

function formatGenderRatio(rate: number): string {
  if (rate === -1) return 'Genderless';
  const female = (rate / 8) * 100;
  const male = 100 - female;
  return `${Math.round(male)}% ♂ / ${Math.round(female)}% ♀`;
}
