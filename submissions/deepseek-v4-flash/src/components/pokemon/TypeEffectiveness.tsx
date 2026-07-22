import { useState, useEffect } from 'react';
import { getAllTypes } from '../../api/pokeapi';
import { getTypeColor } from '../../utils/typeColors';


interface Props {
  types: string[];
}

export function TypeEffectiveness({ types }: Props) {
  const [effectiveness, setEffectiveness] = useState<Record<string, number>>({});

  useEffect(() => {
    async function calc() {
      const allTypes = await getAllTypes();

      const defensive: Record<string, number> = {};

      for (const attackingType of allTypes) {
        let multiplier = 1;
        for (const defenderType of types) {
          const defInfo = allTypes.find(t => t.name === defenderType);
          if (!defInfo) continue;
          if (defInfo.damage_relations.no_damage_from.some(t => t.name === attackingType.name)) multiplier = 0;
          if (defInfo.damage_relations.half_damage_from.some(t => t.name === attackingType.name)) multiplier *= 0.5;
          if (defInfo.damage_relations.double_damage_from.some(t => t.name === attackingType.name)) multiplier *= 2;
        }
        if (multiplier !== 1) defensive[attackingType.name] = multiplier;
      }

      setEffectiveness(defensive);
    }
    calc();
  }, [types]);

  const sorted = Object.entries(effectiveness).sort(([, a], [, b]) => b - a);

  const weaknesses = sorted.filter(([, v]) => v > 1);
  const resistances = sorted.filter(([, v]) => v < 1 && v > 0);
  const immunities = sorted.filter(([, v]) => v === 0);

  if (weaknesses.length === 0 && resistances.length === 0 && immunities.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white font-display">Type Effectiveness</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {immunities.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Immune</h4>
            <div className="flex flex-wrap gap-1.5">
              {immunities.map(([type]) => <MiniTypeBadge key={type} type={type} label="0×" />)}
            </div>
          </div>
        )}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Weak Against</h4>
          <div className="flex flex-wrap gap-1.5">
            {weaknesses.map(([type, mult]) => <MiniTypeBadge key={type} type={type} label={`${mult}×`} strong />)}
            {weaknesses.length === 0 && <span className="text-xs text-gray-600">None</span>}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resists</h4>
          <div className="flex flex-wrap gap-1.5">
            {resistances.map(([type, mult]) => <MiniTypeBadge key={type} type={type} label={`${mult}×`} />)}
            {resistances.length === 0 && <span className="text-xs text-gray-600">None</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniTypeBadge({ type, label, strong }: { type: string; label: string; strong?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
        strong ? 'text-red-300' : 'text-green-300'
      }`}
      style={{ backgroundColor: `${getTypeColor(type)}33` }}
    >
      <span className="capitalize">{type}</span>
      <span>{label}</span>
    </span>
  );
}
