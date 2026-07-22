import { getTypeColor } from '../../utils/typeColors';

export function TypeBadge({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const icons: Record<string, string> = {
    fire: '🔥', water: '💧', grass: '🌿', electric: '⚡',
    ice: '❄️', fighting: '👊', poison: '☠️', ground: '🏜️',
    flying: '🕊️', psychic: '🔮', bug: '🐛', rock: '🪨',
    ghost: '👻', dragon: '🐉', dark: '🌙', steel: '⚙️',
    fairy: '✨', normal: '⬜',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold text-white shadow-sm ${sizeClasses[size]}`}
      style={{ backgroundColor: getTypeColor(type) }}
    >
      <span className="text-[1em] leading-none">{icons[type] || ''}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}
