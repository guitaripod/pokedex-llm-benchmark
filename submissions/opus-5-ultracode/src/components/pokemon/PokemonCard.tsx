import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { StatSparkline } from './StatBars'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { artwork, homeArt, gameSprite, showdownSprite } from '@/lib/sprites'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry, SpriteStyleKey } from './types'

export type { SpriteStyleKey }

export function spriteSources(id: number, style: SpriteStyleKey, shiny: boolean): string[] {
  switch (style) {
    case 'home':
      return [homeArt(id, { shiny }), artwork(id, shiny), gameSprite(id, { shiny })]
    case 'showdown':
      return [showdownSprite(id, { shiny }), homeArt(id, { shiny }), artwork(id, shiny)]
    case 'game':
      return [gameSprite(id, { shiny }), homeArt(id, { shiny }), artwork(id, shiny)]
    default:
      return [artwork(id, shiny), homeArt(id, { shiny }), gameSprite(id, { shiny })]
  }
}

export interface PokemonCardProps {
  entry: PokemonIndexEntry
  compact?: boolean
  eager?: boolean
  badge?: React.ReactNode
}

export const PokemonCard = memo(function PokemonCard({
  entry,
  compact = false,
  eager = false,
  badge,
}: PokemonCardProps) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const showDexNumbers = useApp((state) => state.showDexNumbers)
  const caught = useApp((state) => state.caught.includes(entry.id))
  const favorite = useApp((state) => state.favorites.includes(entry.id))

  const primary = entry.types[0] ?? 1
  const accent = `var(--type-${typeSlug(primary)})`

  return (
    <Link
      to={`/pokemon/${entry.name}`}
      style={{ '--accent': accent } as React.CSSProperties}
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-plate border border-line bg-[var(--ui-plate)] transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-expo)]',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_70%,transparent)]',
        compact ? 'p-2.5' : 'p-3',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-1/3 h-2/3 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--accent) 30%, transparent), transparent 70%)`,
        }}
      />

      {showDexNumbers && (
        <span
          aria-hidden
          className={cx(
            'numeric pointer-events-none absolute select-none font-bold leading-none text-ink/[0.045] transition-colors group-hover:text-ink/[0.07]',
            compact ? '-right-1 top-1 text-4xl' : '-right-1.5 top-1 text-5xl',
          )}
        >
          {String(entry.dex).padStart(3, '0')}
        </span>
      )}

      <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1">
        {favorite && <Pip color="var(--type-fighting)" title="Favourite" />}
        {caught && <Pip color="var(--type-grass)" title="Caught" />}
      </div>
      {badge && <div className="absolute right-2.5 top-2.5 z-10">{badge}</div>}

      <div
        className={cx(
          'relative mx-auto flex w-full items-center justify-center',
          compact ? 'h-[86px]' : 'h-[120px]',
        )}
      >
        <Sprite
          sources={spriteSources(entry.id, spriteStyle, shiny)}
          alt={entry.label}
          loading={eager ? 'eager' : 'lazy'}
          className={cx(
            'transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.07]',
            compact ? 'h-[78px] w-[78px]' : 'h-[110px] w-[110px]',
          )}
          pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
          imgClassName="drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)]"
        />
      </div>

      <div className="relative mt-1.5 min-w-0">
        {showDexNumbers && (
          <p className="numeric text-[10px] font-semibold tracking-[0.12em] text-faint">
            {formatDex(entry.dex)}
          </p>
        )}
        <h3
          className={cx(
            'truncate font-display font-semibold leading-snug',
            compact ? 'text-[13px]' : 'text-sm',
          )}
          title={entry.label}
        >
          {entry.label}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {entry.types.map((typeId) => (
            <TypeBadge
              key={typeId}
              typeId={typeId}
              label={dex.typeById.get(typeId)?.label ?? ''}
              size={compact ? 'xs' : 'sm'}
              link={false}
            />
          ))}
        </div>

        {!compact && (
          <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-1.5">
            <StatSparkline stats={entry.stats} />
            <span className="numeric text-[10px] font-semibold text-faint">
              BST <span className="text-dim">{entry.bst}</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  )
})

function Pip({ color, title }: { color: string; title: string }) {
  return (
    <span
      title={title}
      className="h-1.5 w-1.5 rounded-full ring-2 ring-[var(--ui-surface)]"
      style={{ background: color }}
    />
  )
}
