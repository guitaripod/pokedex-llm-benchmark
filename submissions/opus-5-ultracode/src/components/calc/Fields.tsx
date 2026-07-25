import { useEffect, useId, useState, type ReactNode } from 'react'
import { stageMultiplier } from '@/lib/game'
import { cx } from '@/lib/cx'

export function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'numeric block text-[10px] font-semibold uppercase tracking-[0.16em] text-faint',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Field({
  label,
  children,
  hint,
  htmlFor,
  className,
}: {
  label: string
  children: ReactNode
  hint?: ReactNode
  htmlFor?: string
  className?: string
}) {
  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1 block">
        <MicroLabel>{label}</MicroLabel>
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-snug text-faint">{hint}</p>}
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
  className,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  hint?: ReactNode
  className?: string
}) {
  const id = useId()
  const [text, setText] = useState(String(value))

  useEffect(() => setText(String(value)), [value])

  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          const parsed = Number(event.target.value)
          if (event.target.value !== '' && Number.isFinite(parsed)) onChange(clamp(parsed, min, max))
        }}
        onBlur={() => setText(String(value))}
        className="numeric h-9 w-full rounded-chip border border-line bg-surface px-2.5 text-sm text-ink transition hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--ui-line))] focus:border-accent"
      />
    </Field>
  )
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  readout,
  className,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  readout: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={cx('min-w-0', className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id}>
          <MicroLabel>{label}</MicroLabel>
        </label>
        <span className="numeric text-[12px] font-semibold text-ink">{readout}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-5 w-full accent-[var(--accent)]"
      />
    </div>
  )
}

/// Renders a -6…+6 battle stage picker alongside the multiplier the stage resolves to.
export function StageField({
  label,
  value,
  onChange,
  className,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}) {
  const multiplier = stageMultiplier(value)
  return (
    <div className={cx('min-w-0', className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <MicroLabel>{label}</MicroLabel>
        <span
          className={cx(
            'numeric text-[12px] font-semibold',
            value > 0 ? 'text-[var(--type-grass)]' : value < 0 ? 'text-[var(--type-fighting)]' : 'text-dim',
          )}
        >
          {value > 0 ? `+${value}` : value} · ×{multiplier.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <StageStep label={`Lower ${label}`} disabled={value <= -6} onClick={() => onChange(value - 1)}>
          −
        </StageStep>
        <input
          type="range"
          aria-label={label}
          min={-6}
          max={6}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-5 min-w-0 flex-1 accent-[var(--accent)]"
        />
        <StageStep label={`Raise ${label}`} disabled={value >= 6} onClick={() => onChange(value + 1)}>
          +
        </StageStep>
      </div>
    </div>
  )
}

function StageStep({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-chip border border-line text-xs text-dim transition hover:bg-raised hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function Readout({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'accent' | 'good' | 'bad'
}) {
  return (
    <div className="rounded-chip border border-line-soft bg-surface px-2.5 py-1.5">
      <MicroLabel>{label}</MicroLabel>
      <p
        className={cx(
          'numeric mt-0.5 truncate text-[15px] font-semibold leading-none',
          tone === 'accent' && 'text-accent',
          tone === 'good' && 'text-[var(--type-grass)]',
          tone === 'bad' && 'text-[var(--type-fighting)]',
        )}
      >
        {value}
      </p>
    </div>
  )
}
