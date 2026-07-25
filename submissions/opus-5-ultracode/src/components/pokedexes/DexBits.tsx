import { Sprite } from '@/components/ui/Sprite'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { useApp } from '@/lib/store'
import { cx } from '@/lib/cx'

export function ProgressBar({
  value,
  height = 'h-1.5',
  className,
}: {
  value: number
  height?: string
  className?: string
}) {
  return (
    <div className={cx('relative w-full overflow-hidden rounded-full bg-raised', height, className)}>
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-700 ease-[var(--ease-out-expo)]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/// Circular completion gauge; the dash offset encodes the ratio so it reads at any size.
export function CompletionRing({
  ratio,
  size = 96,
  label,
}: {
  ratio: number
  size?: number
  label: string
}) {
  const stroke = Math.max(5, Math.round(size * 0.085))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, ratio))

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ui-raised)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out-expo)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="numeric text-lg font-bold leading-none">{clamped.toFixed(0)}%</span>
        <span className="numeric mt-0.5 text-[9px] uppercase tracking-[0.16em] text-faint">{label}</span>
      </div>
    </div>
  )
}

export function CaughtToggle({
  pokemonId,
  label,
  size = 'md',
}: {
  pokemonId: number
  label: string
  size?: 'sm' | 'md'
}) {
  const caught = useApp((state) => state.caught.includes(pokemonId))
  const toggleCaught = useApp((state) => state.toggleCaught)

  return (
    <button
      type="button"
      aria-pressed={caught}
      aria-label={caught ? `Mark ${label} as not caught` : `Mark ${label} as caught`}
      title={caught ? 'Caught — click to clear' : 'Mark as caught'}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        toggleCaught(pokemonId)
      }}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition',
        size === 'sm' ? 'h-6 w-6' : 'h-7 w-7',
        caught
          ? 'border-transparent bg-[var(--type-grass)]/20 text-[var(--type-grass)]'
          : 'border-line bg-surface text-faint hover:border-[color-mix(in_oklab,var(--accent)_55%,var(--ui-line))] hover:text-ink',
      )}
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="10" cy="10" r="7.25" />
        <path d="M2.75 10h4.1M13.15 10h4.1" />
        <circle cx="10" cy="10" r="2.6" fill={caught ? 'currentColor' : 'none'} />
      </svg>
    </button>
  )
}

/// Overlapping preview avatars for the first few species of a pokédex.
export function SpriteStrip({
  ids,
  labels,
  size = 34,
}: {
  ids: number[]
  labels: string[]
  size?: number
}) {
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)

  return (
    <div className="flex items-center">
      {ids.map((id, index) => (
        <span
          key={id}
          className="relative -ml-2 flex shrink-0 items-center justify-center rounded-full border border-line bg-surface first:ml-0"
          style={{ width: size, height: size, zIndex: ids.length - index }}
        >
          <Sprite
            sources={spriteSources(id, spriteStyle, shiny)}
            alt={labels[index] ?? ''}
            className="h-[80%] w-[80%]"
            pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
          />
        </span>
      ))}
    </div>
  )
}
