import { cx } from '@/lib/cx'

const ROMAN = ['—', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

/// Renders a generation id as its roman numeral, matching how the games are numbered.
export function generationRoman(generation: number): string {
  return ROMAN[generation] ?? String(generation)
}

export function GenerationTag({ generation, className }: { generation: number; className?: string }) {
  return (
    <span
      title={`Introduced in Generation ${generationRoman(generation)}`}
      className={cx(
        'numeric inline-flex h-[18px] shrink-0 items-center rounded-chip border border-line px-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim',
        className,
      )}
    >
      GEN {generationRoman(generation)}
    </span>
  )
}

/// Marks abilities that rewrite the holder's incoming type chart — the strongest defensive signal.
export function TypeShiftBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="Alters incoming type effectiveness"
      className={cx(
        'inline-flex h-[18px] shrink-0 items-center gap-1 rounded-chip px-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.12em]',
        'border border-[color-mix(in_oklab,var(--type-dragon)_55%,transparent)] text-[var(--type-dragon)] [background:color-mix(in_oklab,var(--type-dragon)_14%,transparent)]',
      )}
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M1.5 4h7M6.5 1.5 9 4 6.5 6.5M10.5 8h-7M5.5 5.5 3 8l2.5 2.5" strokeLinecap="round" />
      </svg>
      {!compact && 'Type shift'}
    </span>
  )
}

export function NonMainSeriesTag() {
  return (
    <span
      title="Not used in the main-series games"
      className="numeric inline-flex h-[18px] shrink-0 items-center rounded-chip border border-dashed border-line px-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint"
    >
      Side
    </span>
  )
}
