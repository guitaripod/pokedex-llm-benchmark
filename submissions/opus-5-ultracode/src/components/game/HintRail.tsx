import { useDex } from '@/lib/dex'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { cx } from '@/lib/cx'
import { HINT_COST, MAX_HINTS, maskLabel } from './quiz'
import type { PokemonIndexEntry } from '@/types/data'

const HINT_LABELS = ['Typing', 'Origin', 'Initial']

export interface HintRailProps {
  entry: PokemonIndexEntry
  revealedHints: number
  onReveal: () => void
  locked: boolean
}

export function HintRail({ entry, revealedHints, onReveal, locked }: HintRailProps) {
  const dex = useDex()

  const contents = [
    <span key="typing" className="flex flex-wrap items-center gap-1">
      {entry.types.map((typeId) => (
        <TypeBadge
          key={typeId}
          typeId={typeId}
          label={dex.typeById.get(typeId)?.label ?? ''}
          size="xs"
          variant="outline"
          link={false}
        />
      ))}
    </span>,
    <span key="origin" className="block truncate text-[12px] text-ink">
      {dex.nameOf('generations', entry.generation)}
      {entry.genus ? <span className="text-dim"> · {entry.genus}</span> : null}
    </span>,
    <span key="initial" className="numeric block truncate text-[13px] font-semibold tracking-[0.28em] text-ink">
      {maskLabel(entry.label)}
    </span>,
  ]

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {HINT_LABELS.map((label, index) => {
        const unlocked = index < revealedHints
        const next = index === revealedHints
        return (
          <div
            key={label}
            className={cx(
              'flex min-h-[54px] flex-col justify-center gap-1 rounded-chip border px-3 py-2 transition',
              unlocked
                ? 'border-[color-mix(in_oklab,var(--accent)_35%,var(--ui-line))] bg-[color-mix(in_oklab,var(--accent)_7%,transparent)]'
                : 'border-dashed border-line bg-surface/40',
            )}
          >
            <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
              Hint {index + 1} · {label}
            </span>
            {unlocked ? (
              contents[index]
            ) : (
              <button
                type="button"
                onClick={onReveal}
                disabled={locked || !next}
                aria-label={`Reveal hint ${index + 1}: ${label}, costs ${HINT_COST} points`}
                className={cx(
                  'self-start text-[12px] font-semibold transition',
                  locked || !next ? 'cursor-not-allowed text-faint' : 'text-accent hover:brightness-125',
                )}
              >
                {next && !locked ? `Reveal · −${HINT_COST}` : 'Locked'}
              </button>
            )}
          </div>
        )
      })}
      <span className="sr-only">
        {revealedHints} of {MAX_HINTS} hints used
      </span>
    </div>
  )
}
