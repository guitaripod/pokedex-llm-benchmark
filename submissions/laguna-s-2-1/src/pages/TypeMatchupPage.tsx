import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import { PokemonCard, BackButton } from '../components/pokemon/PokemonCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TypeBadge } from '../components/ui/TypeBadge';
import { fetchType, fetchPokemonList } from '../lib/pokeapi';
import { TYPE_ORDER } from '../types';

export function TypeMatchupPage() {
  const [attackingType, setAttackingType] = useState<string>('fire');
  const [defendingTypes, setDefendingTypes] = useState<string[]>(['normal']);
  const [attackerData, setAttackerData] = useState<any>(null);
  const [defenderData, setDefenderData] = useState<any[]>([]);
  const [allTypes, setAllTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pokemonPool, setPokemonPool] = useState<any[]>([]);

  useEffect(() => {
    loadAllTypes();
  }, []);

  useEffect(() => {
    if (attackingType) {
      loadAttackerData();
    }
  }, [attackingType]);

  useEffect(() => {
    loadDefenderData();
  }, [defendingTypes]);

  async function loadAllTypes() {
    try {
      const types = await Promise.all(
        TYPE_ORDER.slice(0, 18).map((t) => fetchType(t))
      );
      setAllTypes(types.filter((t): t is any => t !== null));
    } catch (error) {
      console.error('Failed to load types:', error);
    }
  }

  async function loadAttackerData() {
    try {
      const data = await fetchType(attackingType);
      setAttackerData(data);
    } catch (error) {
      console.error('Failed to load attacker type:', error);
    }
  }

  async function loadDefenderData() {
    try {
      const data = await Promise.all(
        defendingTypes.map((t) => fetchType(t))
      );
      setDefenderData(data.filter((t): t is any => t !== null));
    } catch (error) {
      console.error('Failed to load defender types:', error);
    }
  }

  function getEffectiveness(attacker: string, defender: string[]): number {
    let multiplier = 1;
    for (const def of defender) {
      const defenderType = allTypes.find((t) => t.name === def);
      if (!defenderType) continue;
      const relations = defenderType.damage_relations;
      if (relations.double_damage_from.some((t: any) => t.name === attacker)) multiplier *= 2;
      if (relations.half_damage_from.some((t: any) => t.name === attacker)) multiplier *= 0.5;
      if (relations.no_damage_from.some((t: any) => t.name === attacker)) multiplier *= 0;
    }
    return multiplier;
  }

  function getEffectiveTypes(defender: string[], multiplier: number): string[] {
    return TYPE_ORDER.slice(0, 18).filter((t) => getEffectiveness(t, defender) === multiplier);
  }

  function getEffectivenessLabel(mult: number): string {
    if (mult === 0) return 'No Damage';
    if (mult === 0.25) return 'Not Very Effective (¼)';
    if (mult === 0.5) return 'Not Very Effective (½)';
    if (mult === 1) return 'Normal';
    if (mult === 2) return 'Super Effective (2×)';
    if (mult === 4) return 'Super Effective (4×)';
    return 'Unknown';
  }

  function getEffectivenessColor(mult: number): string {
    if (mult === 0) return 'bg-gray-400';
    if (mult <= 0.5) return 'bg-blue-400';
    if (mult === 1) return 'bg-gray-500';
    return 'bg-red-500';
  }

  const toggleDefendingType = (type: string) => {
    if (defendingTypes.includes(type)) {
      setDefendingTypes(defendingTypes.filter((t) => t !== type));
    } else if (defendingTypes.length < 2) {
      setDefendingTypes([...defendingTypes, type]);
    }
  };

  return (
    <div class="animate-fade-in">
      <BackButton href="/" />
      <h1 class="text-3xl font-bold mb-2">Type Matchup</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Check type effectiveness and find Pokémon that are strong against specific types.
      </p>

      <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-3">Attacking Type</h3>
            <div class="flex flex-wrap gap-2">
              {TYPE_ORDER.slice(0, 18).map((t) => (
                <button
                  key={t}
                  onClick={() => setAttackingType(t)}
                  class={`transition-transform ${
                    attackingType === t ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <TypeBadge type={t} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold mb-3">Defending Type(s)</h3>
            <div class="flex flex-wrap gap-2">
              {TYPE_ORDER.slice(0, 18).map((t) => (
                <button
                  key={t}
                  onClick={() => toggleDefendingType(t)}
                  class={`transition-transform ${
                    defendingTypes.includes(t) ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <TypeBadge type={t} size="sm" />
                </button>
              ))}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Selected: {defendingTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-pokemon-card dark:bg-pokemon-card-dark rounded-xl p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">
          {attackingType.charAt(0).toUpperCase() + attackingType.slice(1)} vs {defendingTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ')}
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[0, 0.25, 0.5, 1, 2, 4].map((mult) => {
            const effectiveTypes = getEffectiveTypes(defendingTypes, mult);
            return (
              <div key={mult} class="text-center">
                <div class={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center text-white font-bold mb-2 ${getEffectivenessColor(mult)}`}>
                  {mult === 0 ? '0' : mult === 0.25 ? '¼' : mult === 0.5 ? '½' : mult.toString()}×
                </div>
                <p class="text-sm font-medium mb-2">{getEffectivenessLabel(mult)}</p>
                <div class="flex flex-wrap gap-1 justify-center">
                  {effectiveTypes.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
