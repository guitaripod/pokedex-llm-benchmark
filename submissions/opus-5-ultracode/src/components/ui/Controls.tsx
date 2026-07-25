import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/lib/cx'

const BUTTON_VARIANTS = {
  solid: 'bg-accent text-[#0b0d12] hover:brightness-110 font-semibold',
  soft: 'bg-raised text-ink hover:bg-line',
  outline: 'border border-line text-ink hover:bg-raised hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--ui-line))]',
  ghost: 'text-dim hover:text-ink hover:bg-raised',
  danger: 'border border-[color-mix(in_oklab,var(--type-fighting)_45%,transparent)] text-[var(--type-fighting)] hover:bg-[color-mix(in_oklab,var(--type-fighting)_12%,transparent)]',
} as const

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-9 w-9 text-sm',
  'icon-sm': 'h-8 w-8 text-xs',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS
  size?: keyof typeof BUTTON_SIZES
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-chip transition-[background,color,border-color,filter] duration-150 disabled:pointer-events-none disabled:opacity-40',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    />
  )
})

export function Chip({
  active,
  children,
  onClick,
  color,
  className,
  title,
  disabled,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  color?: string
  className?: string
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      style={color ? ({ '--chip': color } as React.CSSProperties) : undefined}
      className={cx(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-chip border px-2.5 font-display text-[11px] font-semibold uppercase tracking-[0.1em] transition disabled:opacity-35',
        active
          ? color
            ? 'border-transparent text-[#0b0d12] [background:var(--chip)]'
            : 'border-transparent bg-accent text-[#0b0d12]'
          : color
            ? 'border-line text-dim hover:border-[color-mix(in_oklab,var(--chip)_60%,transparent)] hover:text-[var(--chip)]'
            : 'border-line text-dim hover:border-line hover:bg-raised hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: { value: T; label: ReactNode; title?: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={cx(
        'inline-flex shrink-0 items-center gap-0.5 rounded-chip border border-line bg-surface p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="tab"
          title={option.title}
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cx(
            'rounded-[4px] font-display font-medium transition',
            size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-3 text-xs',
            value === option.value
              ? 'bg-raised text-ink shadow-[0_1px_2px_rgb(0_0_0/0.18)]'
              : 'text-dim hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: ReactNode
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1.5">
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-dim">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors',
          checked ? 'border-transparent bg-accent' : 'border-line bg-raised',
        )}
      >
        <span
          className={cx(
            'absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    </label>
  )
}

export const Select = forwardRef<
  HTMLSelectElement,
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { size?: 'sm' | 'md' }
>(function Select({ className, size = 'md', children, ...props }, ref) {
  return (
    <div className={cx('relative inline-flex min-w-0', className)}>
      <select
        ref={ref}
        {...props}
        className={cx(
          'w-full min-w-0 appearance-none truncate rounded-chip border border-line bg-surface pl-3 pr-8 text-ink transition hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--ui-line))]',
          size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
        )}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M3 4.5 6 7.5 9 4.5" />
      </svg>
    </div>
  )
})

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={cx(
          'h-9 w-full rounded-chip border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint transition hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--ui-line))] focus:border-accent',
          className,
        )}
      />
    )
  },
)

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cx('relative flex min-w-0 items-center', className)}>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute left-3 h-4 w-4 text-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="m10.5 10.5 3 3" />
      </svg>
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="h-9 w-full rounded-chip border border-line bg-surface pl-9 pr-8 text-sm text-ink placeholder:text-faint transition hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--ui-line))] focus:border-accent"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full text-faint transition hover:bg-raised hover:text-ink"
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m3 3 6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  format,
}: {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  label: string
  format?: (value: number) => string
}) {
  const render = format ?? ((value: number) => String(value))
  const lowPercent = ((value[0] - min) / (max - min)) * 100
  const highPercent = ((value[1] - min) / (max - min)) * 100

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          {label}
        </span>
        <span className="numeric text-[11px] text-dim">
          {render(value[0])} – {render(value[1])}
        </span>
      </div>
      <div className="relative h-5">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-raised" />
        <span
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
        />
        <input
          type="range"
          aria-label={`${label} minimum`}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(event) => onChange([Math.min(Number(event.target.value), value[1]), value[1]])}
          className="pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-surface [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-surface"
        />
        <input
          type="range"
          aria-label={`${label} maximum`}
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(event) => onChange([value[0], Math.max(Number(event.target.value), value[0])])}
          className="pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-surface [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-surface"
        />
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'animate-pulse rounded-chip bg-[color-mix(in_oklab,var(--ui-text-faint)_14%,transparent)]',
        className,
      )}
    />
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-5 w-5 animate-spin text-accent', className)} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
