import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useDex } from '@/lib/dex'
import { cx } from '@/lib/cx'
import { TypeBadge } from '@/components/ui/TypeBadge'
import {
  DamageClassGlyph,
  Dash,
  MicroLabel,
  generationRoman,
  meaningfulNumber,
  typeAccent,
} from './MoveBits'
import type { MoveIndexEntry } from '@/types/data'

export const MoveCard = memo(function MoveCard({ move }: { move: MoveIndexEntry }) {
  const dex = useDex()
  const power = meaningfulNumber(move.power)
  const accuracy = meaningfulNumber(move.accuracy)

  return (
    <Link
      to={`/moves/${move.name}`}
      style={{ '--accent': typeAccent(move.typeId) } as React.CSSProperties}
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-plate border border-line bg-[var(--ui-plate)] p-3.5 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-expo)]',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_70%,transparent)]',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-16 h-24 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 70%)',
        }}
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: 'var(--accent)' }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate pl-1 font-display text-[15px] font-semibold leading-tight" title={move.label}>
          {move.label}
        </h3>
        <span className="numeric shrink-0 text-[10px] font-semibold text-faint">
          {String(move.id).padStart(3, '0')}
        </span>
      </div>

      <div className="relative mt-2 flex flex-wrap items-center gap-1.5 pl-1">
        <TypeBadge
          typeId={move.typeId}
          label={dex.typeById.get(move.typeId)?.label ?? '—'}
          size="xs"
          link={false}
        />
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-dim">
          <DamageClassGlyph classId={move.damageClassId} size={11} />
          {dex.nameOf('damageClasses', move.damageClassId)}
        </span>
        {move.priority !== 0 && (
          <span className="numeric text-[10px] font-semibold text-accent">
            PRI {move.priority > 0 ? `+${move.priority}` : move.priority}
          </span>
        )}
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-1 rounded-chip border border-line-soft bg-surface/60 px-2 py-1.5 pl-2.5">
        <Readout label="Pow" value={power} />
        <Readout label="Acc" value={accuracy} suffix="%" />
        <Readout label="PP" value={move.pp} />
      </div>

      <p className="relative mt-2.5 line-clamp-2 min-h-[2.5em] pl-1 text-[12px] leading-snug text-dim">
        {move.shortEffect ?? 'No effect summary recorded.'}
      </p>

      <div className="relative mt-2.5 flex items-center justify-between border-t border-line-soft pt-2 pl-1">
        <MicroLabel>Gen {generationRoman(move.generation)}</MicroLabel>
        <span className="numeric text-[10px] text-faint">
          {move.learnedByCount} <span className="uppercase tracking-[0.14em]">learners</span>
        </span>
      </div>
    </Link>
  )
})

function Readout({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="min-w-0 text-center">
      <MicroLabel className="block leading-none">{label}</MicroLabel>
      <span className="numeric mt-0.5 block text-[13px] font-semibold leading-none">
        {value === null ? <Dash /> : `${value}${suffix ?? ''}`}
      </span>
    </div>
  )
}
