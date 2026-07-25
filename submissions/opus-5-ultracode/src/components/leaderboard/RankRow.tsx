import { memo } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge, TypeDot } from '@/components/ui/TypeBadge'
import { typeSlug, useDex } from '@/lib/dex'
import { formatDex } from '@/lib/game'
import { gameSprite, homeArt, icon } from '@/lib/sprites'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry } from '@/types/data'

/// Cheap row artwork: shiny requests skip the icon set, which has no shiny variants.
function rowSprites(id: number, shiny: boolean): string[] {
  return shiny
    ? [gameSprite(id, { shiny: true }), homeArt(id, { shiny: true }), icon(id)]
    : [icon(id), gameSprite(id), homeArt(id)]
}

export const RankRow = memo(function RankRow({
  rank,
  entry,
  display,
  unit,
  ratio,
  shiny,
  favorite,
  caught,
}: {
  rank: number
  entry: PokemonIndexEntry
  display: string
  unit?: string
  ratio: number
  shiny: boolean
  favorite: boolean
  caught: boolean
}) {
  const dex = useDex()
  const color = `var(--type-${typeSlug(entry.types[0] ?? 1)})`

  return (
    <Link
      to={`/pokemon/${entry.name}`}
      style={{ '--accent': color } as CSSProperties}
      className="flex items-center gap-3 rounded-chip px-2 py-1.5 transition hover:bg-raised/70"
    >
      <span
        className={cx(
          'numeric flex h-7 w-9 shrink-0 items-center justify-center rounded-chip text-[12px] font-bold',
          rank <= 3 ? 'text-[#0b0d12]' : 'bg-raised text-dim',
        )}
        style={
          rank <= 3
            ? { background: `color-mix(in oklab, ${color} ${92 - rank * 14}%, var(--ui-raised))` }
            : undefined
        }
      >
        {rank}
      </span>

      <Sprite sources={rowSprites(entry.id, shiny)} alt="" className="h-9 w-9 shrink-0" pixelated />

      <span className="flex min-w-0 flex-[1.4] flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-display text-[13px] font-semibold">{entry.label}</span>
          {favorite && (
            <span
              title="Favourite"
              aria-label="Favourite"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--type-fighting)]"
            />
          )}
          {caught && (
            <span
              title="Caught"
              aria-label="Caught"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--type-grass)]"
            />
          )}
        </span>
        <span className="numeric flex items-center gap-1.5 text-[10px] text-faint">
          {formatDex(entry.dex)}
          <span className="flex gap-1 sm:hidden">
            {entry.types.map((typeId) => (
              <TypeDot key={typeId} typeId={typeId} size={6} />
            ))}
          </span>
          <span className="hidden gap-1 sm:flex">
            {entry.types.map((typeId) => (
              <TypeBadge
                key={typeId}
                typeId={typeId}
                label={dex.typeById.get(typeId)?.label ?? ''}
                size="xs"
                variant="ghost"
                link={false}
              />
            ))}
          </span>
        </span>
      </span>

      <span className="hidden h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-raised sm:block">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(1.5, ratio * 100)}%`, background: color }}
        />
      </span>

      <span className="numeric w-[86px] shrink-0 text-right text-[14px] font-bold">
        {display}
        {unit && <span className="ml-0.5 text-[10px] font-medium text-faint">{unit}</span>}
      </span>
    </Link>
  )
})
