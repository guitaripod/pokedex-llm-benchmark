import { useMemo, useState } from 'react'
import { PickerDialog, type PickerItem } from './PickerDialog'
import { Sprite } from '@/components/ui/Sprite'
import { Chip } from '@/components/ui/Controls'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { itemSprite } from '@/lib/sprites'
import type { ItemIndexEntry } from '@/types/data'

/**
 * Categories whose members are battle-relevant held items. The dataset's `holdable` attribute is
 * incomplete (Assault Vest and Eviolite carry no attributes at all), so category is the reliable cut.
 */
const HELD_CATEGORY_IDS = new Set([12, 13, 14, 15, 16, 17, 18, 19, 36, 42, 44, 45, 46])

interface ItemOption extends PickerItem {
  entry: ItemIndexEntry
}

export function ItemPicker({
  items,
  loading,
  error,
  categoryLabel,
  onSelect,
  onClear,
  onClose,
}: {
  items: ItemIndexEntry[] | undefined
  loading: boolean
  error: Error | undefined
  categoryLabel: (id: number) => string
  onSelect: (entry: ItemIndexEntry) => void
  onClear: () => void
  onClose: () => void
}) {
  const [heldOnly, setHeldOnly] = useState(true)

  const options = useMemo(() => {
    const list: ItemOption[] = []
    for (const entry of items ?? []) {
      if (heldOnly && !HELD_CATEGORY_IDS.has(entry.categoryId) && !entry.isBerry) continue
      list.push({
        id: entry.id,
        label: entry.label,
        keywords: `${entry.name} ${entry.label} ${entry.shortEffect ?? ''}`.toLowerCase(),
        entry,
      })
    }
    return list
  }, [items, heldOnly])

  return (
    <PickerDialog
      title="Held item"
      subtitle="Held items, berries and battle gear."
      placeholder="Leftovers, choice, sash…"
      options={options}
      onSelect={(option) => onSelect(option.entry)}
      onClose={onClose}
      onClear={onClear}
      clearLabel="No item"
      status={
        error ? (
          <ErrorState message={error.message} />
        ) : loading || !items ? (
          <InlineLoader label="Loading items" />
        ) : undefined
      }
      filters={
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={heldOnly} onClick={() => setHeldOnly(true)}>
            Held items
          </Chip>
          <Chip active={!heldOnly} onClick={() => setHeldOnly(false)}>
            Every item
          </Chip>
        </div>
      }
      renderRow={(option) => <ItemRow entry={option.entry} categoryLabel={categoryLabel} />}
    />
  )
}

function ItemRow({
  entry,
  categoryLabel,
}: {
  entry: ItemIndexEntry
  categoryLabel: (id: number) => string
}) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        {entry.sprite ? (
          <Sprite sources={[itemSprite(entry.sprite)]} alt={entry.label} className="h-7 w-7" pixelated />
        ) : (
          <span aria-hidden className="h-2 w-2 rounded-full bg-raised" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-display text-[13px] font-semibold">{entry.label}</span>
          <span className="numeric shrink-0 text-[10px] uppercase tracking-[0.14em] text-faint">
            {categoryLabel(entry.categoryId)}
          </span>
        </span>
        {entry.shortEffect && (
          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-dim">
            {entry.shortEffect}
          </span>
        )}
      </span>
    </>
  )
}
