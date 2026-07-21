import { h } from 'preact';
import { TYPE_ORDER, TYPE_SYMBOL_URL } from '../../types';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  class?: string;
}

export function TypeBadge({ type, size = 'md', showIcon = true, class: className = '' }: TypeBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
  const typeClass = `type-badge bg-type-${type} ${sizeClasses[size]} ${className}`;

  return (
    <span class={typeClass}>
      {showIcon && (
        <img
          src={TYPE_SYMBOL_URL(type)}
          alt={type}
          class={`inline-block mr-1 ${iconSize[size]} object-contain`}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      {formattedType}
    </span>
  );
}

export function TypeList({ types, size = 'md', showIcon = true }: { types: string[]; size?: 'sm' | 'md' | 'lg'; showIcon?: boolean }) {
  return (
    <div class="flex flex-wrap gap-1">
      {types.map((type) => (
        <TypeBadge key={type} type={type} size={size} showIcon={showIcon} />
      ))}
    </div>
  );
}

export function TypeEffectivenessCell({
  attacker,
  defender,
  multiplier,
  onClick,
}: {
  attacker: string;
  defender: string;
  multiplier: number;
  onClick?: () => void;
}) {
  const getMultiplierColor = (m: number): string => {
    if (m === 0) return 'bg-gray-400 text-gray-800';
    if (m <= 0.5) return 'bg-blue-400 text-blue-900';
    if (m === 1) return 'bg-gray-500 text-gray-900';
    if (m >= 2) return 'bg-red-500 text-red-100';
    return 'bg-yellow-400 text-yellow-900';
  };

  const getMultiplierText = (m: number): string => {
    if (m === 0) return '0';
    if (m === 0.25) return '¼';
    if (m === 0.5) return '½';
    if (m === 1) return '1';
    if (m === 2) return '2';
    if (m === 4) return '4';
    return m.toString();
  };

  return (
    <button
      onClick={onClick}
      class={`w-10 h-10 rounded-lg font-bold text-sm transition-all hover:scale-110 ${getMultiplierColor(multiplier)}`}
      title={`${attacker} vs ${defender}: ${getMultiplierText(multiplier)}x`}
    >
      {getMultiplierText(multiplier)}
    </button>
  );
}

export function TypeEffectivenessMatrix({
  types,
  matrix,
  onCellClick,
}: {
  types: string[];
  matrix: { [attacker: string]: { [defender: string]: number } };
  onCellClick?: (attacker: string, defender: string) => void;
}) {
  return (
    <div class="overflow-x-auto">
      <table class="border-collapse">
        <thead>
          <tr>
            <th class="w-12 h-12" />
            {types.map((type) => (
              <th key={type} class="w-10 h-12">
                <TypeBadge type={type} size="sm" showIcon={true} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map((attacker) => (
            <tr key={attacker}>
              <td class="w-12 h-12">
                <TypeBadge type={attacker} size="sm" showIcon={true} />
              </td>
              {types.map((defender) => (
                <TypeEffectivenessCell
                  key={`${attacker}-${defender}`}
                  attacker={attacker}
                  defender={defender}
                  multiplier={matrix[attacker]?.[defender] ?? 1}
                  onClick={() => onCellClick?.(attacker, defender)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TypeDefenseChart({
  defendingTypes,
  attackingTypes,
  matrix,
}: {
  defendingTypes: string[];
  attackingTypes: string[];
  matrix: { [attacker: string]: { [defender: string]: number } };
}) {
  const effectiveness: { [key: string]: number } = {};

  for (const attacker of attackingTypes) {
    let total = 1;
    for (const defender of defendingTypes) {
      total *= matrix[attacker]?.[defender] ?? 1;
    }
    effectiveness[attacker] = total;
  }

  const sorted = Object.entries(effectiveness).sort(([, a], [, b]) => b - a);

  return (
    <div class="space-y-2">
      {sorted.map(([attacker, mult]) => {
        const label = mult === 0 ? 'No Effect' : mult === 0.25 ? '¼' : mult === 0.5 ? '½' : mult === 1 ? '1' : mult === 2 ? '2' : mult === 4 ? '4' : mult.toString();
        const color =
          mult === 0
            ? 'bg-gray-400'
            : mult <= 0.5
            ? 'bg-blue-400'
            : mult === 1
            ? 'bg-gray-500'
            : 'bg-red-500';

        return (
          <div key={attacker} class="flex items-center gap-2">
            <TypeBadge type={attacker} size="sm" />
            <div class={`w-12 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${color}`}>
              {label}×
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TypeOffensiveChart({
  attackingType,
  matrix,
  allTypes,
}: {
  attackingType: string;
  matrix: { [attacker: string]: { [defender: string]: number } };
  allTypes: string[];
}) {
  const row = matrix[attackingType] || {};
  const entries = allTypes.map((t) => ({ type: t, multiplier: row[t] ?? 1 }));

  const weak = entries.filter((e) => e.multiplier > 1);
  const resistant = entries.filter((e) => e.multiplier < 1 && e.multiplier > 0);
  const immune = entries.filter((e) => e.multiplier === 0);
  const normal = entries.filter((e) => e.multiplier === 1);

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {weak.length > 0 && (
        <div>
          <h4 class="text-sm font-semibold text-red-500 mb-2">Super Effective (2×)</h4>
          <div class="flex flex-wrap gap-1">
            {weak.map((e) => (
              <TypeBadge key={e.type} type={e.type} size="sm" />
            ))}
          </div>
        </div>
      )}
      {resistant.length > 0 && (
        <div>
          <h4 class="text-sm font-semibold text-blue-500 mb-2">Not Very Effective (½)</h4>
          <div class="flex flex-wrap gap-1">
            {resistant.map((e) => (
              <TypeBadge key={e.type} type={e.type} size="sm" />
            ))}
          </div>
        </div>
      )}
      {immune.length > 0 && (
        <div>
          <h4 class="text-sm font-semibold text-gray-500 mb-2">No Effect (0)</h4>
          <div class="flex flex-wrap gap-1">
            {immune.map((e) => (
              <TypeBadge key={e.type} type={e.type} size="sm" />
            ))}
          </div>
        </div>
      )}
      {normal.length > 0 && (
        <div>
          <h4 class="text-sm font-semibold text-gray-500 mb-2">Normal (1×)</h4>
          <div class="flex flex-wrap gap-1">
            {normal.map((e) => (
              <TypeBadge key={e.type} type={e.type} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
