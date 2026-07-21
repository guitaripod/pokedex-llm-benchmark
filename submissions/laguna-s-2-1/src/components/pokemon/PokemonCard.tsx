import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { formatId, formatName, getStatBarColor, getStatBarWidth, getStatShortName, getLocalStorage, calculateBST } from '../../lib/utils';
import { applyTheme, updateSettings } from '../../lib/init';
import { POKEMON_OFFICIAL_ARTWORK_URL, POKEMON_SHOWDOWN_URL, POKEMON_CRY_URL } from '../../types';
import { TypeList } from '../ui/TypeBadge';
import { calculateBST } from '../../lib/utils';

interface PokemonCardProps {
  id: number;
  name: string;
  types: string[];
  sprite?: string | null;
  officialArtwork?: string | null;
  shinySprite?: string | null;
  baseStatTotal?: number;
  isShiny?: boolean;
  showSprite?: boolean;
  compact?: boolean;
  onClick?: () => void;
  class?: string;
}

export function PokemonCard({
  id,
  name,
  types,
  sprite,
  officialArtwork,
  shinySprite,
  baseStatTotal,
  isShiny = false,
  showSprite = true,
  compact = false,
  onClick,
  class: className = '',
}: PokemonCardProps) {
  const displaySprite = showSprite ? (officialArtwork || sprite || null) : null;
  const displayShiny = isShiny && shinySprite ? shinySprite : null;

  return (
    <button
      onClick={onClick}
      class={`pokemon-card relative group ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{formatId(id)}</span>
        {baseStatTotal !== undefined && (
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">BST: {baseStatTotal}</span>
        )}
      </div>

      {displaySprite && (
        <div class="relative flex justify-center mb-2">
          <img
            src={isShiny ? displayShiny || displaySprite : displaySprite}
            alt={name}
            class={`object-contain ${compact ? 'w-12 h-12' : 'w-20 h-20'} transition-transform group-hover:scale-110`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = sprite || '';
            }}
          />
          {isShiny && displayShiny && (
            <span class="absolute top-0 right-0 text-xs bg-yellow-400 text-yellow-900 px-1 rounded-full">
              ★
            </span>
          )}
        </div>
      )}

      <h3 class={`font-bold ${compact ? 'text-sm' : 'text-base'} capitalize`}>
        {formatName(name)}
      </h3>

      <div class="mt-2">
        <TypeList types={types} size="sm" />
      </div>
    </button>
  );
}

interface StatBarProps {
  stat: string;
  value: number;
  maxValue?: number;
  showLabel?: boolean;
  showValue?: boolean;
  animated?: boolean;
  class?: string;
}

export function StatBar({
  stat,
  value,
  maxValue = 255,
  showLabel = true,
  showValue = true,
  animated = true,
  class: className = '',
}: StatBarProps) {
  const width = getStatBarWidth(value);
  const colorClass = getStatBarColor(value);

  return (
    <div class={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span class="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStatShortName(stat)}
        </span>
      )}
      <div class="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class={`h-full rounded-full transition-all duration-500 ease-out ${colorClass} ${animated ? 'animate-fade-in' : ''}`}
          style={{ width }}
        />
      </div>
      {showValue && (
        <span class="w-8 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
          {value}
        </span>
      )}
    </div>
  );
}

export function StatVisualizer({
  stats,
  maxValue = 255,
  animated = true,
  showLabels = true,
  showValues = true,
}: {
  stats: { stat: string; base_stat: number; effort: number }[];
  maxValue?: number;
  animated?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
}) {
  return (
    <div class="space-y-2">
      {stats.map((stat) => (
        <StatBar
          key={stat.stat}
          stat={stat.stat}
          value={stat.base_stat}
          maxValue={maxValue}
          showLabel={showLabels}
          showValue={showValues}
          animated={animated}
        />
      ))}
    </div>
  );
}

export function StatRadar({
  stats,
  size = 150,
}: {
  stats: { stat: string; base_stat: number }[];
  size?: number;
}) {
  const statNames = stats.map((s) => s.stat);
  const values = stats.map((s) => s.base_stat);
  const maxStat = Math.max(...values, 100);
  const center = size / 2;
  const radius = size / 2 - 20;
  const numStats = statNames.length;

  const points = (values: number[], max: number) => {
    return values
      .map((v, i) => {
        const angle = (i * (360 / numStats) - 90) * (Math.PI / 180);
        const r = (v / max) * radius;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      })
      .join(' ');
  };

  const gridPoints = (level: number) => {
    const r = (level / maxStat) * radius;
    return statNames
      .map((_, i) => {
        const angle = (i * (360 / numStats) - 90) * (Math.PI / 180);
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      })
      .join(' ');
  };

  const axisPoints = statNames
    .map((_, i) => {
      const angle = (i * (360 / numStats) - 90) * (Math.PI / 180);
      const r = radius + 10;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, name: statNames[i] };
    });

  return (
    <div class="relative" style={{ width: size + 40, height: size + 40 }}>
      <svg width={size + 40} height={size + 40} class="transform -rotate-90">
        {[25, 50, 75, 100].map((level) => (
          <polygon
            key={level}
            points={gridPoints(level * maxStat / 100)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}
        {axisPoints.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}
        <polygon
          points={points(values, maxStat)}
          fill="rgba(240, 79, 79, 0.3)"
          stroke="rgb(240, 79, 79)"
          strokeWidth={2}
        />
        {values.map((v, i) => {
          const angle = (i * (360 / numStats) - 90) * (Math.PI / 180);
          const r = (v / maxStat) * radius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r={3} fill="rgb(240, 79, 79)" />;
        })}
      </svg>
      {axisPoints.map((p, i) => (
        <div
          key={i}
          class="absolute text-xs font-medium text-gray-600 dark:text-gray-400"
          style={{
            left: p.x + 40,
            top: p.y + 40,
            transform: 'translate(-50%, -50%) rotate(90deg)',
            transformOrigin: 'center',
          }}
        >
          {getStatShortName(statNames[i])}
        </div>
      ))}
    </div>
  );
}

export function BSTBadge({ bst }: { bst: number }) {
  const getBSTLabel = (bst: number): string => {
    if (bst >= 600) return 'Legendary';
    if (bst >= 540) return 'Pseudo-Legendary';
    if (bst >= 500) return 'Strong';
    if (bst >= 450) return 'Average';
    if (bst >= 400) return 'Weak';
    return 'Very Weak';
  };

  const getBSTColor = (bst: number): string => {
    if (bst >= 600) return 'bg-red-500';
    if (bst >= 540) return 'bg-orange-500';
    if (bst >= 500) return 'bg-yellow-500';
    if (bst >= 450) return 'bg-green-500';
    if (bst >= 400) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getBSTColor(bst)}`}>
      BST: {bst} ({getBSTLabel(bst)})
    </span>
  );
}

export function RarityBadge({ rarity }: { rarity: string }) {
  const labels: Record<string, string> = {
    common: 'Common',
    rare: 'Rare',
    ultra: 'Ultra Rare',
    legendary: 'Legendary',
    mythical: 'Mythical',
    baby: 'Baby',
  };

  const colors: Record<string, string> = {
    common: 'bg-gray-400',
    rare: 'bg-blue-400',
    ultra: 'bg-purple-400',
    legendary: 'bg-red-500',
    mythical: 'bg-orange-500',
    baby: 'bg-pink-400',
  };

  return (
    <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${colors[rarity] || 'bg-gray-400'}`}>
      {labels[rarity] || rarity}
    </span>
  );
}

export function FavoriteButton({ id, isFilled = false, size = 'md', onClick }: { id: number; isFilled?: boolean; size?: 'sm' | 'md' | 'lg'; onClick?: () => void }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <button
      onClick={onClick}
      class={`favorite-btn ${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        isFilled
          ? 'bg-red-500 text-white scale-110'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      title={isFilled ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        class="w-3 h-3"
        fill={isFilled ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={isFilled ? 0 : 2}
          d="M4.318 6.318A4.5 4.5 0 019 5.25h6a4.5 4.5 0 013.682 1.068M4.318 6.318L12 14l7.682-7.682A4.5 4.5 0 0015 4.25H9a4.5 4.5 0 00-4.682 2.068z"
        />
      </svg>
    </button>
  );
}

export function ShareButton({ url, title = 'Check out this Pokémon!' }: { url: string; title?: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        await copyToClipboard(url);
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title="Share"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.59 13.41l6.12 6.12M8.59 13.41l-2.44-2.44m2.44 2.44L12 14m-3.41-3.41l6.12-6.12M8.59 13.41l-2.44 2.44m2.44-2.44L12 14m-3.41-3.41l6.12-6.12"
        />
      </svg>
    </button>
  );
}

export function BackButton({ href = '/', label = 'Back' }: { href?: string; label?: string }) {
  return (
    <a
      href={href}
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pokemon-red transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </a>
  );
}

export function PokemonSprite({
  id,
  name,
  isShiny = false,
  size = 'md',
  showOfficialArtwork = false,
  showAnimated = false,
  class: className = '',
}: {
  id: number;
  name: string;
  isShiny?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOfficialArtwork?: boolean;
  showAnimated?: boolean;
  class?: string;
}) {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const spriteUrl = showOfficialArtwork
    ? isShiny
      ? POKEMON_OFFICIAL_ARTWORK_URL(id).replace('/official-artwork/', '/official-artwork/shiny/')
      : POKEMON_OFFICIAL_ARTWORK_URL(id)
    : showAnimated
    ? isShiny
      ? POKEMON_SHOWDOWN_URL(id).replace('/showdown/', '/showdown/shiny/')
      : POKEMON_SHOWDOWN_URL(id)
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  return (
    <div class={`relative inline-flex ${sizeClasses[size]} ${className}`}>
      <img
        src={spriteUrl}
        alt={name}
        class="object-contain"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        }}
      />
      {isShiny && (
        <span class="absolute top-0 right-0 text-xs bg-yellow-400 text-yellow-900 px-1 rounded-full">
          ★
        </span>
      )}
    </div>
  );
}

export function CryPlayer({ id, name }: { id: number; name: string }) {
  const handlePlay = () => {
    const audio = new Audio(POKEMON_CRY_URL(id));
    audio.play().catch((err) => console.error('Failed to play cry:', err));
  };

  return (
    <button
      onClick={handlePlay}
      class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Play ${name}'s cry`}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.54 6.54A1 1 0 0014 7v10a1 1 0 001 1 1 1 0 00.707-1.707L12.707 12l3-3a1 1 0 00-.163-1.454z"
        />
      </svg>
    </button>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
}) {
  const pages: (number | string)[] = [];
  const half = Math.floor(maxVisible / 2);

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > half + 1) pages.push('...');
    const start = Math.max(2, currentPage - half);
    const end = Math.min(totalPages - 1, currentPage + half);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - half) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav class="flex justify-center items-center gap-2 my-8" aria-label="Pagination">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        class="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Previous page"
      >
        ←
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} class="px-2 text-gray-500">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            class={`px-3 py-1 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-pokemon-red text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        class="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}

export function SearchBar({
  value,
  onSearch,
  placeholder = 'Search Pokémon...',
  class: className = '',
}: {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  class?: string;
}) {
  return (
    <div class={`relative ${className}`}>
      <input
        type="search"
        value={value}
        onInput={(e) => onSearch((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokemon-red transition-colors"
        aria-label="Search"
      />
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}

export function FilterBar({
  types,
  generations,
  rarities,
  selectedTypes,
  selectedGeneration,
  selectedRarities,
  onTypeToggle,
  onGenerationChange,
  onRarityToggle,
  onClearFilters,
}: {
  types: string[];
  generations: string[];
  rarities: string[];
  selectedTypes: string[];
  selectedGeneration: string | null;
  selectedRarities: string[];
  onTypeToggle: (type: string) => void;
  onGenerationChange: (gen: string | null) => void;
  onRarityToggle: (rarity: string) => void;
  onClearFilters: () => void;
}) {
  return (
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Types</label>
        <div class="flex flex-wrap gap-1">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => onTypeToggle(type)}
              class={`type-badge bg-type-${type} ${
                selectedTypes.includes(type) ? 'ring-2 ring-offset-2 ring-pokemon-red' : 'opacity-60'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Generation</label>
        <select
          value={selectedGeneration || ''}
          onChange={(e) => onGenerationChange((e.target as HTMLSelectElement).value || null)}
          class="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokemon-red"
        >
          <option value="">All Generations</option>
          {generations.map((gen) => (
            <option key={gen} value={gen}>
              {gen.replace('generation-', 'Generation ').replace(/-/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Rarity</label>
        <div class="flex flex-wrap gap-1">
          {rarities.map((rarity) => (
            <button
              key={rarity}
              onClick={() => onRarityToggle(rarity)}
              class={`px-3 py-1 rounded-full text-xs font-medium text-white transition-all ${
                selectedRarities.includes(rarity) ? 'ring-2 ring-offset-2 ring-pokemon-red' : 'opacity-60'
              } ${
                rarity === 'legendary'
                  ? 'bg-red-500'
                  : rarity === 'mythical'
                  ? 'bg-orange-500'
                  : rarity === 'baby'
                  ? 'bg-pink-400'
                  : rarity === 'common'
                  ? 'bg-gray-400'
                  : 'bg-blue-400'
              }`}
            >
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {(selectedTypes.length > 0 || selectedGeneration || selectedRarities.length > 0) && (
        <button
          onClick={onClearFilters}
          class="px-3 py-1 text-sm text-pokemon-red hover:text-red-600 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

export function SortSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { value: 'id-asc', label: 'ID (Ascending)' },
    { value: 'id-desc', label: 'ID (Descending)' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'bst-desc', label: 'Highest BST' },
    { value: 'bst-asc', label: 'Lowest BST' },
    { value: 'height-asc', label: 'Shortest' },
    { value: 'height-desc', label: 'Tallest' },
    { value: 'weight-asc', label: 'Lightest' },
    { value: 'weight-desc', label: 'Heaviest' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      class="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pokemon-red"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    const saved = getLocalStorage('pokedex-settings', {}).theme || 'system';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  return (
    <button
      onClick={toggleTheme}
      class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m8.66-9.66l-.71.71M4.05 12.34l-.71.71M18.36 5.64l-.71.71M6.34 17.66l-.71.71M12 5a7 7 0 100 14 7 7 0 000-14z"
          />
        </svg>
      ) : (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.35 11H18a1 1 0 00-1-1h-4a1 1 0 00-1 1v2a1 1 0 001 1h4a1 1 0 001-1v-1m-6 0H7a1 1 0 01-1-1V7a1 1 0 011-1h4a1 1 0 011 1v5z"
          />
        </svg>
      )}
    </button>
  );
}
