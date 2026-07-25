import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { CaughtToggle } from './DexBits'
import { accentForType } from './dexData'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokedexEntryRecord } from './dexData'

export interface DexEntryCardProps {
  record: PokedexEntryRecord
  bst?: number
  eager?: boolean
}

export const DexEntryCard = memo(function DexEntryCard({ record, bst, eager }: DexEntryCardProps) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const caught = useApp((state) => state.caught.includes(record.pokemonId))

  return (
    <article
      style={{ '--accent': accentForType(record.types[0]) } as React.CSSProperties}
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-plate border bg-[var(--ui-plate)] p-2.5 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-expo)]',
        'hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_70%,transparent)]',
        caught
          ? 'border-[color-mix(in_oklab,var(--type-grass)_38%,var(--ui-line))]'
          : 'border-line hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))]',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-1/3 h-2/3 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--accent) 28%, transparent), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <span className="numeric rounded-chip bg-raised px-1.5 py-0.5 text-[11px] font-bold leading-none text-accent">
          {String(record.entryNumber).padStart(3, '0')}
        </span>
        <CaughtToggle pokemonId={record.pokemonId} label={record.label} size="sm" />
      </div>

      <Link
        to={`/pokemon/${record.name}`}
        className="relative flex flex-col rounded-chip focus-visible:outline-2"
      >
        <span className="relative mx-auto flex h-[92px] w-full items-center justify-center">
          <Sprite
            sources={spriteSources(record.pokemonId, spriteStyle, shiny)}
            alt={record.label}
            loading={eager ? 'eager' : 'lazy'}
            className="h-[86px] w-[86px] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
            pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
            imgClassName="drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)]"
          />
        </span>
        <h3 className="truncate font-display text-[13px] font-semibold leading-snug" title={record.label}>
          {record.label}
        </h3>
      </Link>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {record.types.map((typeId) => (
          <TypeBadge
            key={typeId}
            typeId={typeId}
            label={dex.typeById.get(typeId)?.label ?? ''}
            size="xs"
            link={false}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-1.5">
        <span className="numeric text-[10px] font-semibold text-faint">{formatDex(record.speciesId)}</span>
        {bst !== undefined && (
          <span className="numeric text-[10px] font-semibold text-faint">
            BST <span className="text-dim">{bst}</span>
          </span>
        )}
      </div>
    </article>
  )
})
