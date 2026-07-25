import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export function NumberField({
  label,
  prefix,
  value,
  min,
  max,
  width = 'w-9',
  onChange,
}: {
  label: string
  prefix: string
  value: number
  min: number
  max: number
  width?: string
  onChange: (value: number) => void
}) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-chip border border-line bg-surface pl-1.5">
      <span aria-hidden className="numeric text-[9px] uppercase tracking-[0.12em] text-faint">
        {prefix}
      </span>
      <input
        type="number"
        aria-label={label}
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cx(
          'numeric h-full bg-transparent px-1 text-right text-[11px] text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          width,
        )}
      />
    </span>
  )
}

export function MiniButton({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode
  onClick: () => void
  title?: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cx(
        'numeric rounded-chip border px-2 py-1 text-[10px] uppercase tracking-[0.12em] transition',
        active
          ? 'border-transparent bg-accent text-[#0b0d12]'
          : 'border-line text-dim hover:bg-raised hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="numeric block text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
      {children}
    </span>
  )
}
