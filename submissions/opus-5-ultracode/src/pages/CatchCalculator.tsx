import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Panel, PageHeader, SectionTitle } from '@/components/ui/Panel'
import { Segmented, Toggle } from '@/components/ui/Controls'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Sprite } from '@/components/ui/Sprite'
import { PokemonPicker } from '@/components/calc/PokemonPicker'
import { MicroLabel, NumberField, Readout, SliderField } from '@/components/calc/Fields'
import { CatchCurve, type CurvePoint } from '@/components/calc/CatchCurve'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { itemSprite } from '@/lib/sprites'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { POKEBALLS, STATUS_BONUS, calculateCatchRate, computeHp, formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'

const DEFAULT_TARGET = 'snorlax'
const MAX_CAPTURE_RATE = 255

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'Healthy' },
  { value: 'burn', label: 'Burn' },
  { value: 'paralysis', label: 'Paralysis' },
  { value: 'poison', label: 'Poison' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'freeze', label: 'Freeze' },
]

interface BallRow {
  slug: string
  label: string
  bonus: number
  note?: string
  probability: number
  shakeProbability: number
  expectedBalls: number
  guaranteed: boolean
  withinThree: number
  withinFive: number
}

/// Probability of at least one success across `throws` independent attempts.
function chanceWithin(probability: number, throws: number): number {
  return 1 - Math.pow(1 - probability, throws)
}

/// Maps a raw capture rate onto a human tier so 3 versus 255 reads at a glance.
function catchDifficulty(rate: number): { label: string; tone: 'good' | 'bad' | 'default' } {
  if (rate >= 200) return { label: 'Trivial', tone: 'good' }
  if (rate >= 120) return { label: 'Easy', tone: 'good' }
  if (rate >= 60) return { label: 'Moderate', tone: 'default' }
  if (rate >= 30) return { label: 'Hard', tone: 'default' }
  if (rate >= 10) return { label: 'Very hard', tone: 'bad' }
  return { label: 'Brutal', tone: 'bad' }
}

function formatPercent(value: number): string {
  if (value >= 0.9999) return '100%'
  if (value === 0) return '0%'
  if (value < 0.001) return `${(value * 100).toFixed(4)}%`
  if (value < 0.1) return `${(value * 100).toFixed(2)}%`
  return `${(value * 100).toFixed(1)}%`
}

export default function CatchCalculator() {
  const dex = useDex()
  const [params, setParams] = useSearchParams()
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)

  const target = dex.bySlug.get(params.get('target') ?? '') ?? dex.bySlug.get(DEFAULT_TARGET) ?? dex.entries[0]

  const [level, setLevel] = useState(50)
  const [hpPercent, setHpPercent] = useState(100)
  const [status, setStatus] = useState('none')
  const [levelBonus, setLevelBonus] = useState(true)
  const [curveBall, setCurveBall] = useState('poke-ball')

  const statusBonus = STATUS_BONUS[status] ?? 1
  const maxHp = computeHp({ base: target.stats[0], iv: 31, ev: 0, level })
  const currentHp = Math.max(1, Math.round((maxHp * hpPercent) / 100))
  const appliedLevelBonus = levelBonus && level <= 20 ? Math.max(1, (30 - level) / 10) : 1

  const rows = useMemo<BallRow[]>(() => {
    return POKEBALLS.map((ball) => {
      const result = calculateCatchRate({
        captureRate: target.captureRate,
        maxHp,
        currentHp,
        ballBonus: ball.bonus,
        statusBonus,
        level,
        applyLevelBonus: levelBonus,
      })
      return {
        slug: ball.slug,
        label: ball.label,
        bonus: ball.bonus,
        note: ball.note,
        probability: result.probability,
        shakeProbability: result.shakeProbability,
        expectedBalls: result.expectedBalls,
        guaranteed: result.guaranteed,
        withinThree: chanceWithin(result.probability, 3),
        withinFive: chanceWithin(result.probability, 5),
      }
    })
  }, [target.captureRate, maxHp, currentHp, statusBonus, level, levelBonus])

  const selected = rows.find((row) => row.slug === curveBall) ?? rows[0]
  const bestRealistic = useMemo(
    () =>
      [...rows]
        .filter((row) => row.slug !== 'master-ball')
        .sort((a, b) => b.probability - a.probability)[0],
    [rows],
  )

  const curve = useMemo<CurvePoint[]>(() => {
    const ball = POKEBALLS.find((entry) => entry.slug === curveBall) ?? POKEBALLS[0]
    const points: CurvePoint[] = []
    for (let percent = 1; percent <= 100; percent++) {
      const hp = Math.max(1, Math.round((maxHp * percent) / 100))
      const result = calculateCatchRate({
        captureRate: target.captureRate,
        maxHp,
        currentHp: hp,
        ballBonus: ball.bonus,
        statusBonus,
        level,
        applyLevelBonus: levelBonus,
      })
      points.push({ hpPercent: percent, probability: result.probability })
    }
    return points
  }, [curveBall, maxHp, target.captureRate, statusBonus, level, levelBonus])

  const modifiedRate =
    (((3 * maxHp - 2 * currentHp) * target.captureRate * (selected?.bonus ?? 1)) / (3 * maxHp)) *
    statusBonus *
    appliedLevelBonus

  const difficulty = catchDifficulty(target.captureRate)
  const accent = `var(--type-${typeSlug(target.types[0] ?? 1)})`

  const columns: Column<BallRow>[] = [
    {
      key: 'ball',
      header: 'Ball',
      sort: (row) => row.label,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Sprite sources={[itemSprite(row.slug)]} alt="" className="h-7 w-7 shrink-0" pixelated />
          <div className="min-w-0">
            <Link
              to={`/items/${row.slug}`}
              className="block truncate font-display text-[13px] font-semibold hover:text-accent"
            >
              {row.label}
            </Link>
            {row.note && <span className="block truncate text-[11px] text-faint">{row.note}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'bonus',
      header: 'Bonus',
      align: 'right',
      sort: (row) => row.bonus,
      cell: (row) => <span className="numeric text-[12px] text-dim">×{row.bonus}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'throw',
      header: 'Per throw',
      align: 'right',
      sort: (row) => row.probability,
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <span className="relative hidden h-1.5 w-16 overflow-hidden rounded-full bg-raised sm:block">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-accent"
              style={{ width: `${Math.min(100, row.probability * 100)}%` }}
            />
          </span>
          <span className="numeric text-[12px] font-semibold">{formatPercent(row.probability)}</span>
        </div>
      ),
    },
    {
      key: 'three',
      header: '3 throws',
      align: 'right',
      sort: (row) => row.withinThree,
      cell: (row) => <span className="numeric text-[12px] text-dim">{formatPercent(row.withinThree)}</span>,
      hideBelow: 'sm',
    },
    {
      key: 'five',
      header: '5 throws',
      align: 'right',
      sort: (row) => row.withinFive,
      cell: (row) => <span className="numeric text-[12px] text-dim">{formatPercent(row.withinFive)}</span>,
      hideBelow: 'md',
    },
    {
      key: 'expected',
      header: 'Balls needed',
      align: 'right',
      sort: (row) => row.expectedBalls,
      cell: (row) => (
        <span className="numeric text-[12px] text-dim">
          {Number.isFinite(row.expectedBalls) ? row.expectedBalls.toFixed(1) : '∞'}
        </span>
      ),
    },
    {
      key: 'curve',
      header: 'Curve',
      align: 'center',
      cell: (row) => (
        <button
          type="button"
          aria-label={`Plot ${row.label}`}
          aria-pressed={row.slug === curveBall}
          onClick={() => setCurveBall(row.slug)}
          className={cx(
            'h-6 rounded-chip border px-2 font-display text-[10px] uppercase tracking-[0.12em] transition',
            row.slug === curveBall
              ? 'border-transparent bg-accent text-[#0b0d12]'
              : 'border-line text-dim hover:bg-raised hover:text-ink',
          )}
        >
          Plot
        </button>
      ),
    },
  ]

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow="Capture odds"
        title="Catch Calculator"
        subtitle="Every ball in the bag, ranked against one target. Odds use the Generation III–IX shake-check model."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="grid min-w-0 grid-cols-1 gap-4 self-start">
          <Panel>
            <SectionTitle eyebrow="Target">{target.label}</SectionTitle>

            <div className="flex items-center gap-3">
              <Sprite
                sources={spriteSources(target.id, spriteStyle, shiny)}
                alt={target.label}
                className="h-20 w-20 shrink-0"
                pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
              />
              <div className="min-w-0">
                <p className="numeric text-[11px] text-faint">{formatDex(target.dex)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {target.types.map((typeId) => (
                    <TypeBadge
                      key={typeId}
                      typeId={typeId}
                      label={dex.typeById.get(typeId)?.label ?? ''}
                      size="xs"
                    />
                  ))}
                </div>
                <Link
                  to={`/pokemon/${target.name}`}
                  className="numeric mt-1.5 inline-block text-[11px] text-dim underline-offset-2 hover:text-ink hover:underline"
                >
                  Dex entry →
                </Link>
              </div>
            </div>

            <div className="mt-3">
              <PokemonPicker
                label="Target"
                value={target}
                size="sm"
                onSelect={(entry) => {
                  const next = new URLSearchParams(params)
                  next.set('target', entry.name)
                  setParams(next, { replace: true })
                }}
              />
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-2">
                <MicroLabel>Capture rate</MicroLabel>
                <span
                  className={cx(
                    'numeric text-[12px] font-semibold',
                    difficulty.tone === 'good' && 'text-[var(--type-grass)]',
                    difficulty.tone === 'bad' && 'text-[var(--type-fighting)]',
                  )}
                >
                  {target.captureRate} / {MAX_CAPTURE_RATE} · {difficulty.label}
                </span>
              </div>
              <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-raised">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-accent"
                  style={{ width: `${(target.captureRate / MAX_CAPTURE_RATE) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <NumberField label="Level" min={1} max={100} value={level} onChange={setLevel} />
              <Readout label="Max HP" value={maxHp} />
            </div>

            <div className="mt-3">
              <SliderField
                label="Remaining HP"
                min={1}
                max={100}
                value={hpPercent}
                onChange={setHpPercent}
                readout={`${hpPercent}% · ${currentHp} HP`}
              />
            </div>

            <div className="mt-3">
              <MicroLabel className="mb-1.5">Status condition</MicroLabel>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={status === option.value}
                    onClick={() => setStatus(option.value)}
                    className={cx(
                      'inline-flex h-7 items-center gap-1.5 rounded-chip border px-2.5 font-display text-[11px] font-semibold uppercase tracking-[0.08em] transition',
                      status === option.value
                        ? 'border-transparent bg-accent text-[#0b0d12]'
                        : 'border-line text-dim hover:bg-raised hover:text-ink',
                    )}
                  >
                    {option.label}
                    <span className="numeric opacity-70">×{STATUS_BONUS[option.value] ?? 1}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 border-t border-line-soft pt-1">
              <Toggle
                checked={levelBonus}
                onChange={setLevelBonus}
                label="Gen VIII+ low-level bonus"
                hint={
                  level <= 20
                    ? `Applies ×${appliedLevelBonus.toFixed(2)} at level ${level}`
                    : 'Only affects targets at level 20 or below'
                }
              />
            </div>
          </Panel>

          <Panel>
            <SectionTitle eyebrow="Sensitivity">Weakening the target</SectionTitle>
            <CatchCurve
              points={curve}
              currentHpPercent={hpPercent}
              currentProbability={selected?.probability ?? 0}
              ballLabel={selected?.label ?? 'Poké Ball'}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              Damage matters more than any ball short of a Master Ball: the HP term moves the modified rate
              from ⅓ of its value at full health to nearly the whole of it at 1 HP.
            </p>
          </Panel>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 self-start">
          <Panel>
            <SectionTitle
              eyebrow="Ranking"
              actions={
                <Segmented
                  size="sm"
                  value={hpPercent === 100 ? '100' : hpPercent === 50 ? '50' : hpPercent === 1 ? '1' : ''}
                  onChange={(value) => setHpPercent(Number(value))}
                  options={[
                    { value: '100', label: 'Full HP' },
                    { value: '50', label: 'Half' },
                    { value: '1', label: 'Sliver' },
                  ]}
                />
              }
            >
              Every ball, best first
            </SectionTitle>

            {bestRealistic && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-plate border border-line bg-surface p-3">
                <Sprite sources={[itemSprite(bestRealistic.slug)]} alt="" className="h-9 w-9 shrink-0" pixelated />
                <div className="min-w-0 flex-1">
                  <MicroLabel>Best ball for this state</MicroLabel>
                  <p className="font-display text-sm font-semibold">{bestRealistic.label}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right">
                  <Readout label="Per throw" value={formatPercent(bestRealistic.probability)} tone="accent" />
                  <Readout label="Within 5" value={formatPercent(bestRealistic.withinFive)} />
                  <Readout
                    label="Balls"
                    value={Number.isFinite(bestRealistic.expectedBalls) ? bestRealistic.expectedBalls.toFixed(1) : '∞'}
                  />
                </div>
              </div>
            )}

            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(row) => row.slug}
              initialSort={{ key: 'throw', direction: 'desc' }}
              pageSize={POKEBALLS.length}
              dense
            />
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              Conditional balls are listed at their best-case bonus — a Dusk Ball is ×3 only at night or in a
              cave, a Quick Ball ×5 only on turn one. The note on each row states the condition.
            </p>
          </Panel>

          <Panel>
            <SectionTitle eyebrow="Method">How the odds are derived</SectionTitle>
            <div className="space-y-3 text-sm leading-relaxed text-dim">
              <p>
                A throw first computes the <strong className="text-ink">modified catch rate</strong> — a value
                on the same 0–255 scale as the species' capture rate, scaled by how hurt, asleep and low-level
                the target is:
              </p>
              <div className="overflow-x-auto rounded-plate border border-line bg-surface p-3">
                <p className="numeric whitespace-nowrap text-[12px] text-ink">
                  a = (3 × {maxHp} − 2 × {currentHp}) × {target.captureRate} × {selected?.bonus ?? 1} ÷ (3 ×{' '}
                  {maxHp}) × {statusBonus} × {appliedLevelBonus.toFixed(2)}
                </p>
                <p className="numeric mt-1.5 whitespace-nowrap text-[12px] text-accent">
                  a = {modifiedRate.toFixed(2)}
                  {modifiedRate >= 255 ? ' → capped, the ball never fails' : ''}
                </p>
              </div>
              <p>
                The ball then performs four shake checks. Each one succeeds with probability{' '}
                <span className="numeric text-ink">b = 65536 ÷ (255 ÷ a)^(3/16) ÷ 65536</span>, so the catch
                chance is <span className="numeric text-ink">b⁴</span>.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Readout label="Modified rate a" value={modifiedRate.toFixed(2)} />
                <Readout label="Shake check b" value={formatPercent(selected?.shakeProbability ?? 0)} />
                <Readout label="Catch b⁴" value={formatPercent(selected?.probability ?? 0)} tone="accent" />
              </div>
              <p className="text-[11px] text-faint">
                Expected balls is 1 ÷ catch chance — the mean of a geometric distribution, so it is the average
                over many attempts rather than a guarantee.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
