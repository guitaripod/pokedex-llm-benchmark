import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sprite } from '@/components/ui/Sprite'
import { load, useAsync } from '@/lib/data'
import { itemSprite } from '@/lib/sprites'
import { cx } from '@/lib/cx'
import type { AbilityIndexEntry, ItemIndexEntry, MoveIndexEntry } from '@/types/data'

export function Micro({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'numeric block text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-faint',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Fact({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-chip border border-line-soft bg-surface/60 px-3 py-2">
      <Micro>{label}</Micro>
      <p className="numeric mt-1.5 truncate text-[15px] font-semibold leading-none">{value}</p>
      {hint && <p className="mt-1 truncate text-[11px] leading-tight text-dim">{hint}</p>}
    </div>
  )
}

export function KeyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-1.5 last:border-0">
      <Micro className="shrink-0">{label}</Micro>
      <span className="numeric min-w-0 truncate text-right text-[13px] font-semibold">{value}</span>
    </div>
  )
}

export function LevelSlider({
  value,
  onChange,
  min = 1,
  max = 100,
  label = 'Level',
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <Micro>{label}</Micro>
        <span className="numeric text-[13px] font-bold text-accent">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-surface [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-raised [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-raised [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-surface"
      />
    </div>
  )
}

export interface Lookup<T> {
  byId: Map<number, T> | null
  loading: boolean
  error: Error | undefined
}

/// Loads the 2 223-entry item index only once a panel actually needs item names or art.
export function useItemLookup(enabled: boolean): Lookup<ItemIndexEntry> {
  const state = useAsync(enabled ? 'items-index' : null, () => load.itemIndex())
  const byId = useMemo(
    () => (state.data ? new Map(state.data.entries.map((item) => [item.id, item])) : null),
    [state.data],
  )
  return { byId, loading: state.loading, error: state.error }
}

export function useAbilityLookup(): Lookup<AbilityIndexEntry> {
  const state = useAsync('abilities-index', () => load.abilityIndex())
  const byId = useMemo(
    () => (state.data ? new Map(state.data.entries.map((ability) => [ability.id, ability])) : null),
    [state.data],
  )
  return { byId, loading: state.loading, error: state.error }
}

export function useMoveLookup(): Lookup<MoveIndexEntry> {
  const state = useAsync('moves-index', () => load.moveIndex())
  const byId = useMemo(
    () => (state.data ? new Map(state.data.entries.map((move) => [move.id, move])) : null),
    [state.data],
  )
  return { byId, loading: state.loading, error: state.error }
}

export function ItemChip({
  itemId,
  item,
  hint,
}: {
  itemId: number
  item: ItemIndexEntry | undefined
  hint?: ReactNode
}) {
  const body = (
    <>
      <Sprite
        sources={item?.sprite ? [itemSprite(item.sprite)] : []}
        alt=""
        className="h-6 w-6 shrink-0"
        pixelated
      />
      <span className="min-w-0 truncate text-[13px] font-medium">{item?.label ?? `Item #${itemId}`}</span>
      {hint && <span className="numeric shrink-0 text-[11px] text-faint">{hint}</span>}
    </>
  )

  if (!item) {
    return (
      <span className="inline-flex items-center gap-2 rounded-chip border border-line px-2 py-1 text-dim">
        {body}
      </span>
    )
  }

  return (
    <Link
      to={`/items/${item.name}`}
      className="inline-flex items-center gap-2 rounded-chip border border-line px-2 py-1 transition hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:bg-raised"
    >
      {body}
    </Link>
  )
}

const DAMAGE_CLASS_COLOR: Record<number, string> = {
  1: 'var(--type-normal)',
  2: 'var(--type-fighting)',
  3: 'var(--type-psychic)',
}

export function DamageClassTag({ id, label }: { id: number; label: string }) {
  return (
    <span
      className="numeric inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
      style={{ color: DAMAGE_CLASS_COLOR[id] ?? 'var(--ui-text-dim)' }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
