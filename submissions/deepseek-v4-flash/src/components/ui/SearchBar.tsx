import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPokemon } from '../../api/pokeapi';
import type { Pokemon } from '../../types/pokemon';
import { formatPokemonId } from '../../utils/formatters';
import { getTypeColor } from '../../utils/typeColors';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pokemon[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchPokemon(query)); }
      catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectPokemon(id: number) {
    setIsOpen(false);
    setQuery('');
    navigate(`/pokemon/${id}`);
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (results.length) setIsOpen(true); }}
          placeholder="Search Pokémon..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => selectPokemon(p.id)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-800 transition-colors text-left"
              >
                <img
                  src={p.sprites.other['official-artwork'].front_default || ''}
                  alt={p.name}
                  className="w-10 h-10 object-contain"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 font-mono">{formatPokemonId(p.id)}</span>
                  <p className="text-sm font-medium text-white truncate capitalize">{p.name.replace(/-/g, ' ')}</p>
                </div>
                <div className="flex gap-1.5">
                  {p.types.map(t => (
                    <span
                      key={t.type.name}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: getTypeColor(t.type.name) }}
                    >
                      {t.type.name}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
