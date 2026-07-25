import { useMemo } from 'react'
import { PickerDialog, type PickerItem } from './PickerDialog'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Chip } from '@/components/ui/Controls'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { typeSlug } from '@/lib/dex'
import { DAMAGE_CLASS } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { MoveIndexEntry } from '@/types/data'

interface MoveOption extends PickerItem {
  entry: MoveIndexEntry
  legal: boolean
}

export function MovePicker({
  moves,
  loading,
  error,
  legalIds,
  legalOnly,
  onLegalOnlyChange,
  pokemonLabel,
  typeLabel,
  damageClassLabel,
  onSelect,
  onClear,
  onClose,
}: {
  moves: MoveIndexEntry[] | undefined
  loading: boolean
  error: Error | undefined
  legalIds: Set<number> | null
  legalOnly: boolean
  onLegalOnlyChange: (value: boolean) => void
  pokemonLabel: string
  typeLabel: (id: number) => string
  damageClassLabel: (id: number) => string
  onSelect: (entry: MoveIndexEntry) => void
  onClear: () => void
  onClose: () => void
}) {
  const options = useMemo(() => {
    const list: MoveOption[] = []
    for (const entry of moves ?? []) {
      const legal = legalIds ? legalIds.has(entry.id) : true
      if (legalOnly && legalIds && !legal) continue
      list.push({
        id: entry.id,
        label: entry.label,
        keywords: `${entry.name} ${entry.label} ${typeSlug(entry.typeId)} ${entry.shortEffect ?? ''}`.toLowerCase(),
        entry,
        legal,
      })
    }
    return list
  }, [moves, legalIds, legalOnly])

  const awaitingLearnset = legalOnly && !legalIds

  return (
    <PickerDialog
      title="Choose a move"
      subtitle={legalOnly ? `Legal learnset for ${pokemonLabel}.` : 'Every move in the index.'}
      placeholder="Flamethrower, dragon, priority…"
      options={options}
      onSelect={(option) => onSelect(option.entry)}
      onClose={onClose}
      onClear={onClear}
      clearLabel="Empty slot"
      status={
        error ? (
          <ErrorState message={error.message} />
        ) : loading || !moves || awaitingLearnset ? (
          <InlineLoader label={awaitingLearnset ? 'Loading learnset' : 'Loading moves'} />
        ) : undefined
      }
      filters={
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={legalOnly} onClick={() => onLegalOnlyChange(true)}>
            Legal only
          </Chip>
          <Chip active={!legalOnly} onClick={() => onLegalOnlyChange(false)}>
            Any move
          </Chip>
          <span className="numeric ml-auto text-[10px] uppercase tracking-[0.16em] text-faint">
            {options.length} moves
          </span>
        </div>
      }
      renderRow={(option) => (
        <MoveRow
          entry={option.entry}
          legal={option.legal}
          typeLabel={typeLabel}
          damageClassLabel={damageClassLabel}
        />
      )}
    />
  )
}

function MoveRow({
  entry,
  legal,
  typeLabel,
  damageClassLabel,
}: {
  entry: MoveIndexEntry
  legal: boolean
  typeLabel: (id: number) => string
  damageClassLabel: (id: number) => string
}) {
  return (
    <>
      <TypeBadge typeId={entry.typeId} label={typeLabel(entry.typeId)} size="xs" link={false} className="w-[68px]" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-display text-[13px] font-semibold">{entry.label}</span>
          <span
            className={cx(
              'numeric shrink-0 text-[10px] uppercase tracking-[0.14em]',
              entry.damageClassId === DAMAGE_CLASS.physical && 'text-[var(--type-fighting)]',
              entry.damageClassId === DAMAGE_CLASS.special && 'text-[var(--type-water)]',
              entry.damageClassId === DAMAGE_CLASS.status && 'text-faint',
            )}
          >
            {damageClassLabel(entry.damageClassId)}
          </span>
          {!legal && (
            <span className="numeric shrink-0 rounded-chip bg-raised px-1.5 py-px text-[9px] uppercase tracking-[0.14em] text-faint">
              Illegal
            </span>
          )}
        </span>
        {entry.shortEffect && (
          <span className="mt-0.5 line-clamp-1 block text-[11px] text-dim">{entry.shortEffect}</span>
        )}
      </span>
      <span className="numeric hidden shrink-0 gap-3 text-right text-[11px] text-dim sm:flex">
        <span className="w-9">{entry.power ?? '—'}</span>
        <span className="w-9">{entry.accuracy === null ? '—' : `${entry.accuracy}%`}</span>
        <span className="w-7">{entry.pp ?? '—'}</span>
      </span>
    </>
  )
}
