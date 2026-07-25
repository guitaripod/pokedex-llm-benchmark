import { STAT_KEYS, STAT_SHORT } from '@/lib/game'
import { cx } from '@/lib/cx'
import { MiniButton, NumberField } from './Fields'
import { EV_STAT_CAP, EV_TOTAL_CAP, IV_CAP, applyEvEdit, clamp, evTotal } from './analysis'
import type { NatureInfo, StatBlock } from '@/types/data'
import type { TeamSlot } from '@/lib/store'

export function StatEditor({
  base,
  slot,
  finalStats,
  nature,
  scaleMax,
  onChange,
}: {
  base: StatBlock
  slot: TeamSlot
  finalStats: StatBlock
  nature: NatureInfo | null
  scaleMax: number
  onChange: (patch: Partial<TeamSlot>) => void
}) {
  const spent = evTotal(slot.evs)
  const remaining = Math.max(0, EV_TOTAL_CAP - spent)

  const setIv = (index: number, value: number) => {
    const ivs = [...slot.ivs] as TeamSlot['ivs']
    ivs[index] = clamp(value, 0, IV_CAP)
    onChange({ ivs })
  }

  const setEv = (index: number, value: number) => {
    onChange({ evs: applyEvEdit(slot.evs, index, value) as TeamSlot['evs'] })
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          IV / EV spread
        </p>
        <div className="flex items-center gap-1.5">
          <MiniButton onClick={() => onChange({ ivs: [31, 31, 31, 31, 31, 31] })}>Max IVs</MiniButton>
          <MiniButton onClick={() => onChange({ ivs: [0, 0, 0, 0, 0, 0] })}>Zero IVs</MiniButton>
          <MiniButton onClick={() => onChange({ evs: [0, 0, 0, 0, 0, 0] })}>Clear EVs</MiniButton>
        </div>
      </div>

      <div className="space-y-2.5">
        {base.map((baseValue, index) => {
          const key = STAT_KEYS[index]
          const boosted = nature?.increasedStatId === index + 1 && nature.increasedStatId !== nature.decreasedStatId
          const lowered = nature?.decreasedStatId === index + 1 && nature.increasedStatId !== nature.decreasedStatId
          const width = Math.max(2, Math.min(100, (finalStats[index] / scaleMax) * 100))

          return (
            <div key={key} className="grid grid-cols-[42px_1fr] items-center gap-x-2 gap-y-1">
              <span
                className={cx(
                  'numeric text-[10px] font-semibold uppercase tracking-[0.12em]',
                  boosted ? 'text-[var(--type-grass)]' : lowered ? 'text-[var(--type-fighting)]' : 'text-faint',
                )}
              >
                {STAT_SHORT[index]}
                {boosted && <span aria-label="boosted by nature"> ▲</span>}
                {lowered && <span aria-label="lowered by nature"> ▼</span>}
              </span>

              <div className="flex min-w-0 items-center gap-2">
                <span className="numeric w-7 shrink-0 text-right text-[11px] text-faint" title="Base stat">
                  {baseValue}
                </span>
                <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-raised">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]"
                    style={{ width: `${width}%`, background: `var(--stat-${key})` }}
                  />
                </span>
                <span className="numeric w-10 shrink-0 text-right text-[13px] font-semibold">
                  {finalStats[index]}
                </span>
              </div>

              <span className="numeric col-start-2 flex min-w-0 items-center gap-2">
                <NumberField
                  label={`${STAT_SHORT[index]} IV`}
                  prefix="IV"
                  value={slot.ivs[index]}
                  min={0}
                  max={IV_CAP}
                  onChange={(value) => setIv(index, value)}
                />
                <NumberField
                  label={`${STAT_SHORT[index]} EV`}
                  prefix="EV"
                  value={slot.evs[index]}
                  min={0}
                  max={EV_STAT_CAP}
                  onChange={(value) => setEv(index, value)}
                />
                <input
                  type="range"
                  aria-label={`${STAT_SHORT[index]} effort values`}
                  min={0}
                  max={EV_STAT_CAP}
                  step={4}
                  value={slot.evs[index]}
                  onChange={(event) => setEv(index, Number(event.target.value))}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-raised [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent"
                />
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 border-t border-line-soft pt-2.5">
        <div className="flex items-baseline justify-between">
          <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            EV budget
          </span>
          <span
            className={cx(
              'numeric text-[11px] font-semibold',
              remaining === 0 ? 'text-accent' : 'text-dim',
            )}
          >
            {spent} / {EV_TOTAL_CAP} · {remaining} left
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ width: `${(spent / EV_TOTAL_CAP) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

