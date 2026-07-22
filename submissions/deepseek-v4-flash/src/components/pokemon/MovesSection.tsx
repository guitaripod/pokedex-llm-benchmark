import { useState, useMemo } from 'react';
import type { PokemonMove } from '../../types/pokemon';

interface Props {
  moves: PokemonMove[];
}

export function MovesSection({ moves }: Props) {
  const [sortBy, setSortBy] = useState<'level' | 'name' | 'type'>('level');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const learnMethods = useMemo(() => {
    const methods = new Set<string>();
    moves.forEach(m => m.version_group_details.forEach(d => methods.add(d.move_learn_method.name)));
    return Array.from(methods).sort();
  }, [moves]);

  const filtered = useMemo(() => {
    let list = [...moves];

    if (filterMethod !== 'all') {
      list = list.filter(m =>
        m.version_group_details.some(d => d.move_learn_method.name === filterMethod)
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.move.name.includes(q));
    }

    const maxLevelMoves = new Map<string, PokemonMove>();
    for (const m of list) {
      const minLevel = Math.min(...m.version_group_details.map(d => d.level_learned_at));
      if (!maxLevelMoves.has(m.move.name) || minLevel < Math.min(...maxLevelMoves.get(m.move.name)!.version_group_details.map(d => d.level_learned_at))) {
        maxLevelMoves.set(m.move.name, m);
      }
    }
    list = Array.from(maxLevelMoves.values());

    list.sort((a, b) => {
      if (sortBy === 'level') {
        const aLevel = Math.min(...a.version_group_details.map(d => d.level_learned_at));
        const bLevel = Math.min(...b.version_group_details.map(d => d.level_learned_at));
        return aLevel - bLevel;
      }
      if (sortBy === 'name') return a.move.name.localeCompare(b.move.name);
      return 0;
    });

    return list.slice(0, 50);
  }, [moves, sortBy, filterMethod, searchQuery]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white font-display">Moves ({moves.length})</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search move..."
          className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none"
        >
          <option value="level">By Level</option>
          <option value="name">By Name</option>
        </select>
        <select
          value={filterMethod}
          onChange={e => setFilterMethod(e.target.value)}
          className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none"
        >
          <option value="all">All Methods</option>
          {learnMethods.map(m => (
            <option key={m} value={m}>{m.replace(/-/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase">
              <th className="text-left py-2 pr-4 font-medium">Level</th>
              <th className="text-left py-2 pr-4 font-medium">Move</th>
              <th className="text-left py-2 pr-4 font-medium">Type</th>
              <th className="text-left py-2 font-medium">Method</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const detail = m.version_group_details[m.version_group_details.length - 1];
              const level = Math.min(...m.version_group_details.map(d => d.level_learned_at));
              return (
                <tr key={`${m.move.name}-${level}`} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-2 pr-4 font-mono text-gray-400">
                    {level > 0 ? level : '—'}
                  </td>
                  <td className="py-2 pr-4 capitalize text-gray-200 font-medium">
                    {m.move.name.replace(/-/g, ' ')}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold">
                      {/* Type info is fetched lazily — show placeholder */}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-gray-500 capitalize">
                    {detail?.move_learn_method.name.replace(/-/g, ' ') || '—'}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-600 text-sm">
                  No moves found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
