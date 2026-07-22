import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllTypes } from '../api/pokeapi';
import { POKEMON_TYPES } from '../types/pokemon';
import { getTypeColor } from '../utils/typeColors';
import type { DamageRelations } from '../types/pokemon';

export function TypeCalculatorPage() {
  const [attackingType, setAttackingType] = useState<string>('fire');
  const [defendingTypes, setDefendingTypes] = useState<string[]>(['grass']);
  const [allTypes, setAllTypes] = useState<{ name: string; damage_relations: DamageRelations }[]>([]);
  const [result, setResult] = useState<number>(1);

  useEffect(() => {
    getAllTypes().then(types => setAllTypes(types.map(t => ({ name: t.name, damage_relations: t.damage_relations }))));
  }, []);

  useEffect(() => {
    let multiplier = 1;
    for (const defender of defendingTypes) {
      const defInfo = allTypes.find(t => t.name === defender);
      if (!defInfo) continue;
      if (defInfo.damage_relations.no_damage_from.some(t => t.name === attackingType)) { multiplier = 0; break; }
      if (defInfo.damage_relations.half_damage_from.some(t => t.name === attackingType)) multiplier *= 0.5;
      if (defInfo.damage_relations.double_damage_from.some(t => t.name === attackingType)) multiplier *= 2;
    }
    setResult(multiplier);
  }, [attackingType, defendingTypes, allTypes]);

  function toggleDefendingType(type: string) {
    setDefendingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type].slice(0, 2)
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-white text-glow mb-2">Type Calculator</h1>
        <p className="text-gray-400 mb-8">Calculate type matchup effectiveness between attacking and defending types.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Attacking Type</h2>
            <div className="flex flex-wrap gap-2">
              {POKEMON_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setAttackingType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    attackingType === type
                      ? 'text-white scale-105 shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: attackingType === type ? getTypeColor(type) : 'rgb(31 41 55)',
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Defending Type(s)</h2>
            <div className="flex flex-wrap gap-2">
              {POKEMON_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleDefendingType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    defendingTypes.includes(type)
                      ? 'ring-2 ring-white/20 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: defendingTypes.includes(type)
                      ? `${getTypeColor(type)}44`
                      : 'rgb(31 41 55)',
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            {defendingTypes.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Select at least one defending type</p>
            )}
          </div>
        </div>

        <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Effectiveness</p>
          <motion.div
            key={`${attackingType}-${defendingTypes.join('-')}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-display font-bold"
            style={{
              color: result === 0 ? '#6B7280'
                : result < 1 ? '#EF4444'
                : result === 1 ? '#FBBF24'
                : '#22C55E',
            }}
          >
            {result}×
          </motion.div>
          <p className="text-sm text-gray-400 mt-2">
            {result === 0 ? 'No effect — immune!' :
             result < 1 ? 'Not very effective...' :
             result === 1 ? 'Normal effectiveness' :
             result === 2 ? 'Super effective!' :
             'Double super effective!'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span
              className="px-3 py-1 rounded text-xs font-semibold text-white"
              style={{ backgroundColor: getTypeColor(attackingType) }}
            >
              {attackingType}
            </span>
            <span className="text-gray-500">→</span>
            {defendingTypes.map(t => (
              <span
                key={t}
                className="px-3 py-1 rounded text-xs font-semibold text-white"
                style={{ backgroundColor: getTypeColor(t) }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">All Type Matchups</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">Attack ↓ / Defense →</th>
                  {POKEMON_TYPES.map(t => (
                    <th key={t} className="py-2 px-1.5 text-center font-medium">
                      <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: getTypeColor(t) }} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {POKEMON_TYPES.map(atk => {
                  const defInfo = allTypes.find(t => t.name === atk);
                  return (
                    <tr key={atk} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-1.5 pr-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                          style={{ backgroundColor: getTypeColor(atk) }}
                        >
                          {atk}
                        </span>
                      </td>
                      {POKEMON_TYPES.map(def => {
                        let mult = 1;
                        if (defInfo) {
                          if (defInfo.damage_relations.no_damage_to.some(t => t.name === def)) mult = 0;
                          else if (defInfo.damage_relations.half_damage_to.some(t => t.name === def)) mult = 0.5;
                          else if (defInfo.damage_relations.double_damage_to.some(t => t.name === def)) mult = 2;
                        }
                        return (
                          <td key={def} className="py-1.5 px-1.5 text-center font-mono font-bold">
                            <span style={{
                              color: mult === 0 ? '#4B5563'
                                : mult === 0.5 ? '#EF4444'
                                : mult === 1 ? '#9CA3AF'
                                : '#22C55E',
                            }}>
                              {mult}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
