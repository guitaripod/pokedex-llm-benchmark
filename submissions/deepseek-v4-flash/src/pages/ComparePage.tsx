import { useState } from 'react';
import { motion } from 'framer-motion';
import { getPokemonById, getPokemonImageUrl } from '../api/pokeapi';
import type { Pokemon } from '../types/pokemon';
import { formatPokemonId, formatHeight, formatWeight } from '../utils/formatters';
import { TypeBadge } from '../components/pokemon/TypeBadge';

export function ComparePage() {
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('');
  const [pokemon1, setPokemon1] = useState<Pokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<Pokemon | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState('');
  const [error2, setError2] = useState('');

  async function loadPokemon(query: string, slot: 1 | 2) {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const setPokemon = slot === 1 ? setPokemon1 : setPokemon2;
    const setLoading = slot === 1 ? setLoading1 : setLoading2;
    const setError = slot === 1 ? setError1 : setError2;

    setLoading(true);
    setError('');

    try {
      if (/^\d+$/.test(q)) {
        const p = await getPokemonById(parseInt(q));
        setPokemon(p);
      } else {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`);
        if (!res.ok) throw new Error('Not found');
        const p = await res.json() as Pokemon;
        setPokemon(p);
      }
    } catch {
      setError('Pokémon not found');
      setPokemon(null);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-white text-glow mb-2">Compare</h1>
        <p className="text-gray-400 mb-8">Compare stats and attributes of any two Pokémon side by side.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <CompareInput
            placeholder="e.g. Charizard or 6"
            value={query1}
            onChange={setQuery1}
            onSearch={() => loadPokemon(query1, 1)}
            loading={loading1}
            error={error1}
            pokemon={pokemon1}
            onClear={() => { setPokemon1(null); setQuery1(''); }}
          />
          <CompareInput
            placeholder="e.g. Blastoise or 9"
            value={query2}
            onChange={setQuery2}
            onSearch={() => loadPokemon(query2, 2)}
            loading={loading2}
            error={error2}
            pokemon={pokemon2}
            onClear={() => { setPokemon2(null); setQuery2(''); }}
          />
        </div>

        {pokemon1 && pokemon2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-0">
              <CompareColumn pokemon={pokemon1} side="left" />
              <div className="border-x border-gray-800 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-white">VS</div>
                  <div className="text-xs text-gray-500 mt-1">Compare</div>
                </div>
              </div>
              <CompareColumn pokemon={pokemon2} side="right" />
            </div>

            <div className="border-t border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-white mb-4 text-center">Stat Comparison</h3>
              <div className="space-y-3 max-w-lg mx-auto">
                {pokemon1.stats.map((s, i) => {
                  const stat2 = pokemon2.stats[i];
                  const maxVal = Math.max(s.base_stat, stat2?.base_stat || 0);
                  const pct1 = maxVal > 0 ? (s.base_stat / maxVal) * 100 : 0;
                  const pct2 = maxVal > 0 ? ((stat2?.base_stat || 0) / maxVal) * 100 : 0;

                  return (
                    <div key={s.stat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-medium uppercase">{s.stat.name.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-right text-sm font-mono font-bold text-red-400">{s.base_stat}</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct1}%` }}
                            className="h-full bg-red-500 rounded-full"
                          />
                        </div>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct2}%` }}
                            className="h-full bg-blue-500 rounded-full"
                          />
                        </div>
                        <span className="w-8 text-left text-sm font-mono font-bold text-blue-400">{stat2?.base_stat || 0}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-center gap-4 pt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> {pokemon1.name.replace(/-/g, ' ')}</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> {pokemon2.name.replace(/-/g, ' ')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

interface CompareInputProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  error: string;
  pokemon: Pokemon | null;
  onClear: () => void;
}

function CompareInput({ placeholder, value, onChange, onSearch, loading, error, pokemon, onClear }: CompareInputProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
        <button
          onClick={onSearch}
          disabled={loading}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
        >
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" /> : 'Search'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {pokemon && (
        <div className="flex items-center gap-3 mt-3 p-2 bg-gray-950/50 rounded-lg">
          <img src={getPokemonImageUrl(pokemon.id)} alt={pokemon.name} className="w-12 h-12 object-contain" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-gray-500">{formatPokemonId(pokemon.id)}</span>
            <p className="text-sm font-medium text-white capitalize truncate">{pokemon.name.replace(/-/g, ' ')}</p>
          </div>
          <button onClick={onClear} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function CompareColumn({ pokemon, side }: { pokemon: Pokemon; side: 'left' | 'right' }) {
  return (
    <div className={`p-4 space-y-3 ${side === 'left' ? 'text-right' : 'text-left'}`}>
      <div className={`flex flex-col ${side === 'left' ? 'items-end' : 'items-start'} gap-1`}>
        <span className="text-xs font-mono text-gray-500">{formatPokemonId(pokemon.id)}</span>
        <h3 className="text-lg font-display font-semibold text-white capitalize">{pokemon.name.replace(/-/g, ' ')}</h3>
      </div>

      <div className={`flex ${side === 'left' ? 'justify-end' : 'justify-start'} gap-1.5 flex-wrap`}>
        {pokemon.types.map(t => <TypeBadge key={t.type.name} type={t.type.name} size="sm" />)}
      </div>

      <img
        src={getPokemonImageUrl(pokemon.id)}
        alt={pokemon.name}
        className="w-32 h-32 object-contain mx-auto drop-shadow-lg"
      />

      <div className="space-y-1 text-xs">
        <div className={`flex ${side === 'left' ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
          <span className="text-gray-300">{formatHeight(pokemon.height)}</span>
          <span className="text-gray-500">Height</span>
        </div>
        <div className={`flex ${side === 'left' ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
          <span className="text-gray-300">{formatWeight(pokemon.weight)}</span>
          <span className="text-gray-500">Weight</span>
        </div>
        <div className={`flex ${side === 'left' ? 'justify-between flex-row-reverse' : 'justify-between'}`}>
          <span className="text-gray-300">{pokemon.base_experience}</span>
          <span className="text-gray-500">Base XP</span>
        </div>
      </div>

      <div className="pt-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Abilities</h4>
        <div className={`flex flex-col ${side === 'left' ? 'items-end' : 'items-start'} gap-0.5`}>
          {pokemon.abilities.map(a => (
            <span key={a.ability.name} className={`text-sm capitalize ${a.is_hidden ? 'text-yellow-400/70' : 'text-gray-300'}`}>
              {a.ability.name.replace(/-/g, ' ')}
              {a.is_hidden && <span className="text-[10px] text-yellow-500/50 ml-1">(H)</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
