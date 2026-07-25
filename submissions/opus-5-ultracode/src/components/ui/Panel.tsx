import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return <section className={cx('plate shadow-plate', padded && 'p-5', className)}>{children}</section>
}

export function SectionTitle({
  children,
  actions,
  eyebrow,
  className,
}: {
  children: ReactNode
  actions?: ReactNode
  eyebrow?: string
  className?: string
}) {
  return (
    <header className={cx('mb-4 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="numeric mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-faint">
            {eyebrow}
          </p>
        )}
        <h2 className="truncate font-display text-lg font-semibold leading-tight">{children}</h2>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  eyebrow?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="mb-6 border-b border-line pb-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="numeric mb-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dim">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-plate border border-dashed border-line px-6 py-16 text-center">
      {icon && <div className="mb-1 text-faint">{icon}</div>}
      <p className="font-display text-base font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-dim">{hint}</p>}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: ReactNode
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="numeric text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">{label}</p>
      <p
        className={cx(
          'numeric mt-1 truncate text-[15px] font-semibold leading-tight',
          accent && 'text-accent',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 truncate text-[11px] text-dim">{hint}</p>}
    </div>
  )
}
