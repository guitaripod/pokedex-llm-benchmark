import { Link } from 'react-router-dom'
import { Sprite } from '@/components/ui/Sprite'
import { TypeDot } from '@/components/ui/TypeBadge'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { AreaEncounterTuple } from '@/types/data'

export interface EncounterGroupProps {
  methodId: number
  rows: AreaEncounterTuple[]
  /** Slot rate for this method in the selected version, when the dataset records one. */
  rate: number | null
}

export function EncounterGroup({ methodId, rows, rate }: EncounterGroupProps) {
  const dex = useDex()
  const method = dex.meta.encounterMethods.find((item) => item.id === methodId)
  const peak = rows.reduce((max, row) => Math.max(max, row[3]), 0)

  return (
    <section className="rounded-plate border border-line-soft">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line-soft px-3 py-2">
        <h4 className="min-w-0 truncate font-display text-[13px] font-semibold">
          {method?.label ?? `Method ${methodId}`}
        </h4>
        <div className="flex shrink-0 items-center gap-3">
          {rate !== null && (
            <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
              Rate <span className="text-dim">{rate}%</span>
            </span>
          )}
          <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
            {rows.length} slot{rows.length === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      <ul className="divide-y divide-line-soft">
        {rows.map((row) => (
          <EncounterRow key={`${row[0]}-${row[1]}-${row[2]}-${row[3]}`} row={row} peak={peak} />
        ))}
      </ul>
    </section>
  )
}

function EncounterRow({ row, peak }: { row: AreaEncounterTuple; peak: number }) {
  const [pokemonId, minLevel, maxLevel, rarity] = row
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const entry = dex.byId.get(pokemonId)
  const width = peak > 0 ? Math.max(3, (rarity / peak) * 100) : 0
  const accent = entry?.types[0] ? `var(--type-${typeSlug(entry.types[0])})` : 'var(--accent)'

  return (
    <li className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 transition-colors hover:bg-raised/60 sm:gap-3">
      <span className="flex h-8 w-8 items-center justify-center">
        <Sprite
          sources={spriteSources(pokemonId, spriteStyle, shiny)}
          alt={entry?.label ?? `Pokémon ${pokemonId}`}
          className="h-8 w-8"
          pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
        />
      </span>

      <span className="min-w-0">
        {entry ? (
          <Link
            to={`/pokemon/${entry.name}`}
            className="block truncate font-display text-[13px] font-medium leading-tight hover:text-accent"
          >
            {entry.label}
          </Link>
        ) : (
          <span className="block truncate font-display text-[13px] leading-tight text-dim">
            #{pokemonId}
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1.5">
          {entry?.types.map((typeId) => <TypeDot key={typeId} typeId={typeId} size={6} />)}
          <span className="numeric text-[10px] tracking-[0.06em] text-faint">
            {entry ? formatDex(entry.dex) : ''}
          </span>
          <span className="numeric text-[10px] text-dim">
            Lv {minLevel === maxLevel ? minLevel : `${minLevel}–${maxLevel}`}
          </span>
        </span>
      </span>

      <span className="w-[74px] shrink-0 sm:w-[128px]">
        <span
          className={cx(
            'numeric block text-right text-[12px] font-semibold leading-none',
            rarity >= 25 ? 'text-ink' : 'text-dim',
          )}
        >
          {rarity}%
        </span>
        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-raised">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.min(100, width)}%`, background: accent }}
          />
        </span>
      </span>
    </li>
  )
}
