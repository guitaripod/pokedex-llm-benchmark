import { useMemo, useState } from 'react'
import { PickerDialog, type PickerItem } from './PickerDialog'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Chip } from '@/components/ui/Controls'
import { useDex, typeSlug } from '@/lib/dex'
import { formatDex } from '@/lib/game'
import { gameSprite, homeArt, icon } from '@/lib/sprites'
import type { PokemonIndexEntry } from '@/types/data'

interface PokemonOption extends PickerItem {
  entry: PokemonIndexEntry
}

export function pokemonThumbSources(id: number): string[] {
  return [icon(id), gameSprite(id), homeArt(id)]
}

export function PokemonPicker({
  title = 'Choose a Pokémon',
  onSelect,
  onClose,
}: {
  title?: string
  onSelect: (entry: PokemonIndexEntry) => void
  onClose: () => void
}) {
  const dex = useDex()
  const [defaultsOnly, setDefaultsOnly] = useState(true)

  const options = useMemo(() => {
    const list: PokemonOption[] = []
    for (const entry of dex.entries) {
      if (defaultsOnly && !entry.isDefault) continue
      const types = entry.types.map((typeId) => typeSlug(typeId)).join(' ')
      list.push({
        id: entry.id,
        label: entry.label,
        keywords: `${entry.name} ${entry.label} ${types} ${entry.dex} ${entry.formLabel ?? ''} gen${entry.generation}`.toLowerCase(),
        entry,
      })
    }
    return list
  }, [dex.entries, defaultsOnly])

  return (
    <PickerDialog
      title={title}
      subtitle="Search by name, type, dex number or generation."
      placeholder="Charizard, fire flying, 006…"
      options={options}
      onSelect={(option) => onSelect(option.entry)}
      onClose={onClose}
      filters={
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={defaultsOnly} onClick={() => setDefaultsOnly(true)}>
            Default forms
          </Chip>
          <Chip active={!defaultsOnly} onClick={() => setDefaultsOnly(false)}>
            All forms
          </Chip>
          <span className="numeric ml-auto text-[10px] uppercase tracking-[0.16em] text-faint">
            {options.length} entries
          </span>
        </div>
      }
      renderRow={(option) => <PokemonRow entry={option.entry} typeLabel={(id) => dex.typeById.get(id)?.label ?? ''} />}
    />
  )
}

function PokemonRow({
  entry,
  typeLabel,
}: {
  entry: PokemonIndexEntry
  typeLabel: (id: number) => string
}) {
  return (
    <>
      <Sprite
        sources={pokemonThumbSources(entry.id)}
        alt={entry.label}
        className="h-9 w-9 shrink-0"
        pixelated
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-display text-[13px] font-semibold">{entry.label}</span>
          <span className="numeric shrink-0 text-[10px] text-faint">{formatDex(entry.dex)}</span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          {entry.types.map((typeId) => (
            <TypeBadge key={typeId} typeId={typeId} label={typeLabel(typeId)} size="xs" link={false} />
          ))}
        </span>
      </span>
      <span className="numeric shrink-0 text-right">
        <span className="block text-[10px] uppercase tracking-[0.16em] text-faint">BST</span>
        <span className="block text-[13px] font-semibold">{entry.bst}</span>
      </span>
    </>
  )
}
