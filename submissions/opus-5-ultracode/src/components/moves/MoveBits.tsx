import type { ReactNode } from 'react'
import { typeSlug } from '@/lib/dex'
import { cx } from '@/lib/cx'

export const GENERATION_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

export const DAMAGE_CLASS_COLOR: Record<number, string> = {
  1: 'var(--type-normal)',
  2: 'var(--stat-attack)',
  3: 'var(--stat-special-attack)',
}

export function typeAccent(typeId: number): string {
  return `var(--type-${typeSlug(typeId)})`
}

export function generationRoman(generation: number): string {
  return GENERATION_ROMAN[generation] ?? String(generation)
}

/// Power and accuracy are stored as 0 for moves the games print as a dash, so both collapse to `null`.
export function meaningfulNumber(value: number | null): number | null {
  return value === null || value === 0 ? null : value
}

export function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

/// PP Ups add a fifth of the base value three times over.
export function maxPp(pp: number): number {
  return pp + Math.floor(pp / 5) * 3
}

export function DamageClassGlyph({ classId, size = 14 }: { classId: number; size?: number }) {
  const color = DAMAGE_CLASS_COLOR[classId] ?? 'var(--type-normal)'
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden
      style={{ color }}
      className="shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {classId === 2 && (
        <path d="m8 1.4 1.9 4.7 4.7 1.9-4.7 1.9L8 14.6l-1.9-4.7L1.4 8l4.7-1.9z" fill="currentColor" stroke="none" />
      )}
      {classId === 3 && (
        <>
          <circle cx="8" cy="8" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="8" cy="8" r="5.4" strokeDasharray="3 2.2" />
        </>
      )}
      {classId !== 2 && classId !== 3 && (
        <>
          <path d="M8 1.9 13.3 5v6L8 14.1 2.7 11V5z" />
          <path d="M8 5.6v4.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

export function DamageClassTag({
  classId,
  label,
  compact = false,
}: {
  classId: number
  label: string
  compact?: boolean
}) {
  const color = DAMAGE_CLASS_COLOR[classId] ?? 'var(--type-normal)'
  return (
    <span
      style={{ '--dc': color } as React.CSSProperties}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-chip border font-display font-semibold uppercase leading-none',
        'border-[color-mix(in_oklab,var(--dc)_45%,transparent)] bg-[color-mix(in_oklab,var(--dc)_12%,transparent)] text-[var(--dc)]',
        compact ? 'h-[22px] px-1.5 text-[10px] tracking-[0.1em]' : 'h-7 px-2.5 text-[11px] tracking-[0.1em]',
      )}
    >
      <DamageClassGlyph classId={classId} size={compact ? 11 : 13} />
      {label}
    </span>
  )
}

export function PriorityTag({ priority }: { priority: number }) {
  if (priority === 0) return <span className="numeric text-dim">0</span>
  return (
    <span
      className="numeric font-semibold"
      style={{ color: priority > 0 ? 'var(--stat-special-defense)' : 'var(--stat-hp)' }}
      title={priority > 0 ? 'Moves earlier in the turn' : 'Moves later in the turn'}
    >
      {formatSigned(priority)}
    </span>
  )
}

export function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('numeric text-[10px] uppercase tracking-[0.16em] text-faint', className)}>
      {children}
    </span>
  )
}

export function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-1.5 last:border-0">
      <MicroLabel className="shrink-0">{label}</MicroLabel>
      <span className="min-w-0 text-right text-[13px] leading-snug text-ink">{children}</span>
    </div>
  )
}

export function Dash() {
  return <span className="text-faint">—</span>
}
