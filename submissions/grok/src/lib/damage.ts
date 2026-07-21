import type { Pokemon } from '../types/pokemon'

export interface DamageResult {
  min: number
  max: number
  percentMin: number
  percentMax: number
  effectiveness: number
}

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export function getEffectiveness(attackingType: string, defendingTypes: string[]): number {
  let eff = 1
  defendingTypes.forEach(defType => {
    eff *= TYPE_CHART[attackingType]?.[defType] ?? 1
  })
  return eff
}

export function calculateDamage(
  attacker: Pokemon,
  defender: Pokemon,
  movePower: number = 60,
  level: number = 50,
  isCritical: boolean = false,
  attackerBoost: number = 0,
  defenderBoost: number = 0
): DamageResult {
  const atkStat = attacker.stats.find(s => s.stat.name === 'attack')?.base_stat || 80
  const defStat = defender.stats.find(s => s.stat.name === 'defense')?.base_stat || 80

  // Use physical or special based on move, default physical for preview
  const attack = atkStat
  const defense = defStat

  let base = Math.floor(Math.floor((2 * level / 5 + 2) * attack * movePower / defense) / 50) + 2

  const eff = getEffectiveness(attacker.types[0]?.type.name || 'normal', defender.types.map(t => t.type.name))

  base = Math.floor(base * eff)

  if (isCritical) base = Math.floor(base * 1.5)

  // Random roll 85-100%
  const minRoll = Math.floor(base * 0.85)
  const maxRoll = base

  // Boosts approx
  const atkMod = Math.pow(1.5, attackerBoost) // simplified
  const defMod = Math.pow(1.5, defenderBoost)
  const adjustedMin = Math.floor(minRoll * atkMod / defMod)
  const adjustedMax = Math.floor(maxRoll * atkMod / defMod)

  const defenderHP = defender.stats.find(s => s.stat.name === 'hp')?.base_stat || 80
  const percentMin = Math.min(100, Math.round((adjustedMin / defenderHP) * 100))
  const percentMax = Math.min(100, Math.round((adjustedMax / defenderHP) * 100))

  return {
    min: adjustedMin,
    max: adjustedMax,
    percentMin,
    percentMax,
    effectiveness: eff,
  }
}
