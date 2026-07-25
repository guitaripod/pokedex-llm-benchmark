import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { load, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { BATTLE_TYPE_IDS, STAT_LABELS, STAT_KEYS, effectiveness, effectivenessLabel } from '@/lib/game'
import { cx } from '@/lib/cx'
import { Panel, PageHeader, SectionTitle, EmptyState, Stat } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Controls'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { LearnedBy } from '@/components/moves/LearnedBy'
import { ChangelogPanel, ContestPanel, FlavorPanel, MachinesPanel } from '@/components/moves/MoveLore'
import {
  DamageClassTag,
  Dash,
  FactRow,
  MicroLabel,
  formatSigned,
  generationRoman,
  maxPp,
  meaningfulNumber,
  typeAccent,
} from '@/components/moves/MoveBits'
import type { MoveDetail as MoveDetailData, MoveIndexEntry } from '@/types/data'

const LOCALE_ORDER = ['ja', 'ja-hrkt', 'ko', 'zh-hant', 'zh-hans', 'fr', 'de', 'es', 'es-419', 'it']

export default function MoveDetail() {
  const { slug } = useParams<{ slug: string }>()
  const index = useAsync('moves-index', () => load.moveIndex())

  const ordered = useMemo(
    () => [...(index.data?.entries ?? [])].sort((a, b) => a.id - b.id),
    [index.data],
  )
  const position = useMemo(() => ordered.findIndex((entry) => entry.name === slug), [ordered, slug])
  const entry = position === -1 ? undefined : ordered[position]

  const detail = useAsync(entry ? `move:${entry.id}` : null, () => load.move(entry!.id))

  if (index.error) return <ErrorState message={index.error.message} />
  if (!index.data) return <InlineLoader label="Loading movedex" />

  if (!entry) {
    return (
      <div>
        <PageHeader eyebrow="Movedex" title="Unknown move" />
        <EmptyState title={`No move is called “${slug}”`} hint="It may have been renamed, or the link is wrong." />
        <div className="mt-4 flex justify-center">
          <Link to="/moves">
            <Button variant="soft">Back to all moves</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <MoveView
      entry={entry}
      detail={detail.data}
      error={detail.error}
      previous={ordered[position - 1]}
      next={ordered[position + 1]}
      moveById={ordered}
    />
  )
}

function MoveView({
  entry,
  detail,
  error,
  previous,
  next,
  moveById,
}: {
  entry: MoveIndexEntry
  detail: MoveDetailData | undefined
  error: Error | undefined
  previous: MoveIndexEntry | undefined
  next: MoveIndexEntry | undefined
  moveById: MoveIndexEntry[]
}) {
  const dex = useDex()
  const byId = useMemo(() => new Map(moveById.map((move) => [move.id, move])), [moveById])
  const typeLabel = dex.typeById.get(entry.typeId)?.label ?? '—'
  const power = meaningfulNumber(entry.power)
  const accuracy = meaningfulNumber(entry.accuracy)
  const target = dex.meta.moveTargets.find((option) => option.id === entry.targetId)

  return (
    <div style={{ '--accent': typeAccent(entry.typeId) } as React.CSSProperties}>
      <PageHeader
        eyebrow={`Move · No. ${String(entry.id).padStart(3, '0')}`}
        title={entry.label}
        subtitle={entry.shortEffect ?? undefined}
        actions={
          <>
            <NeighbourLink move={previous} direction="prev" />
            <NeighbourLink move={next} direction="next" />
            <Link to="/moves">
              <Button variant="soft">All moves</Button>
            </Link>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TypeBadge typeId={entry.typeId} label={typeLabel} size="lg" />
          <DamageClassTag classId={entry.damageClassId} label={dex.nameOf('damageClasses', entry.damageClassId)} />
          <span className="numeric rounded-chip border border-line px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-dim">
            Gen {generationRoman(entry.generation)}
          </span>
          {entry.contestTypeId !== null && (
            <span className="numeric rounded-chip border border-line px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-dim">
              {dex.nameOf('contestTypes', entry.contestTypeId)}
            </span>
          )}
        </div>
        <LocalizedNames names={entry.names} />
      </PageHeader>

      <Panel className="mb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="Power"
            value={power ?? <Dash />}
            hint={power === null ? 'Deals no fixed damage' : undefined}
            accent
          />
          <Stat
            label="Accuracy"
            value={accuracy === null ? <Dash /> : `${accuracy}%`}
            hint={accuracy === null ? 'Bypasses accuracy checks' : undefined}
          />
          <Stat
            label="PP"
            value={entry.pp ?? <Dash />}
            hint={entry.pp ? `${maxPp(entry.pp)} with PP Ups` : undefined}
          />
          <Stat
            label="Priority"
            value={formatSigned(entry.priority)}
            hint={entry.priority === 0 ? 'Normal turn order' : entry.priority > 0 ? 'Strikes early' : 'Strikes late'}
          />
          <Stat
            label="Effect chance"
            value={entry.effectChance === null ? <Dash /> : `${entry.effectChance}%`}
          />
          <Stat label="Learned by" value={entry.learnedByCount} hint="Pokémon" />
        </div>

        {target && (
          <div className="mt-4 border-t border-line-soft pt-3">
            <MicroLabel>Target</MicroLabel>
            <p className="mt-1 text-[13px] leading-relaxed">
              <span className="font-semibold">{target.label}</span>
              {target.description && <span className="text-dim"> — {target.description}</span>}
            </p>
          </div>
        )}
      </Panel>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel className="h-full">
            <SectionTitle eyebrow="Effect">How it works</SectionTitle>
            {detail ? (
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-dim">
                {detail.effect ?? entry.shortEffect ?? 'No effect text is recorded for this move.'}
              </p>
            ) : error ? (
              <ErrorState message={error.message} />
            ) : (
              <InlineLoader label="Loading effect" />
            )}
          </Panel>
        </div>
        <MechanicsPanel entry={entry} statChanges={detail?.statChanges ?? []} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EfficacyPanel typeId={entry.typeId} damageClassId={entry.damageClassId} />
        </div>
        <FlagsPanel flags={entry.flags} />
      </div>

      {error ? (
        <ErrorState message={error.message} />
      ) : !detail ? (
        <InlineLoader label="Loading move record" />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FlavorPanel flavorText={detail.flavorText} className="h-full" />
            </div>
            <ChangelogPanel changelog={detail.changelog} />
            <div className="lg:col-span-2">
              <MachinesPanel machines={detail.machines} className="h-full" />
            </div>
            <ContestPanel move={detail} moveById={byId} />
          </div>

          <Panel>
            <SectionTitle eyebrow={`${entry.learnedByCount} Pokémon`}>Learned by</SectionTitle>
            <LearnedBy rows={detail.learnedBy} />
          </Panel>
        </>
      )}
    </div>
  )
}

function NeighbourLink({ move, direction }: { move: MoveIndexEntry | undefined; direction: 'prev' | 'next' }) {
  if (!move) {
    return (
      <Button size="icon" disabled aria-label={direction === 'prev' ? 'Previous move' : 'Next move'}>
        {direction === 'prev' ? '‹' : '›'}
      </Button>
    )
  }
  return (
    <Link to={`/moves/${move.name}`} title={move.label}>
      <Button size="icon" aria-label={`${direction === 'prev' ? 'Previous' : 'Next'} move: ${move.label}`}>
        {direction === 'prev' ? '‹' : '›'}
      </Button>
    </Link>
  )
}

function LocalizedNames({ names }: { names: Record<string, string> }) {
  const dex = useDex()
  const codes = LOCALE_ORDER.filter((code) => names[code])
  if (codes.length === 0) return null
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {codes.map((code) => (
        <div key={code} className="min-w-0">
          <MicroLabel className="block">
            {dex.meta.languages.find((language) => language.code === code)?.label ?? code}
          </MicroLabel>
          <p className="truncate text-[13px]">{names[code]}</p>
        </div>
      ))}
    </div>
  )
}

function MechanicsPanel({
  entry,
  statChanges,
}: {
  entry: MoveIndexEntry
  statChanges: MoveDetailData['statChanges']
}) {
  const dex = useDex()
  const rows: { label: string; value: React.ReactNode }[] = []

  if (entry.categoryId !== null) {
    rows.push({ label: 'Category', value: dex.nameOf('moveCategories', entry.categoryId) })
  }
  if (entry.ailmentId !== null && entry.ailmentId > 0) {
    rows.push({
      label: 'Ailment',
      value: `${dex.nameOf('moveAilments', entry.ailmentId)}${entry.ailmentChance > 0 ? ` · ${entry.ailmentChance}%` : ''}`,
    })
  }
  if (entry.critRate > 0) rows.push({ label: 'Crit rate', value: `+${entry.critRate} stage` })
  if (entry.drain > 0) rows.push({ label: 'Drain', value: `Heals ${entry.drain}% of damage` })
  if (entry.drain < 0) rows.push({ label: 'Recoil', value: `${Math.abs(entry.drain)}% of damage` })
  if (entry.healing > 0) rows.push({ label: 'Healing', value: `${entry.healing}% of max HP` })
  if (entry.healing < 0) rows.push({ label: 'Self damage', value: `${Math.abs(entry.healing)}% of max HP` })
  if (entry.flinchChance > 0) rows.push({ label: 'Flinch', value: `${entry.flinchChance}%` })
  if (entry.statChance > 0) rows.push({ label: 'Stat chance', value: `${entry.statChance}%` })
  if (entry.minHits !== null && entry.maxHits !== null) {
    rows.push({
      label: 'Hits',
      value: entry.minHits === entry.maxHits ? `${entry.minHits}` : `${entry.minHits} – ${entry.maxHits}`,
    })
  }
  if (entry.minTurns !== null && entry.maxTurns !== null) {
    rows.push({
      label: 'Turns',
      value: entry.minTurns === entry.maxTurns ? `${entry.minTurns}` : `${entry.minTurns} – ${entry.maxTurns}`,
    })
  }

  return (
    <Panel>
      <SectionTitle eyebrow="Mechanics">Numbers behind it</SectionTitle>
      {rows.length === 0 && statChanges.length === 0 ? (
        <p className="text-sm text-dim">This move has no secondary mechanics.</p>
      ) : (
        <div>
          {rows.map((row) => (
            <FactRow key={row.label} label={row.label}>
              {row.value}
            </FactRow>
          ))}
          {statChanges.length > 0 && (
            <div className="mt-3">
              <MicroLabel className="mb-1.5 block">Stat changes</MicroLabel>
              <div className="flex flex-wrap gap-1.5">
                {statChanges.map((change) => (
                  <StatChangeChip key={change.statId} statId={change.statId} change={change.change} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

function StatChangeChip({ statId, change }: { statId: number; change: number }) {
  const index = statId - 1
  const key = STAT_KEYS[index]
  const label = STAT_LABELS[index] ?? `Stat ${statId}`
  return (
    <span
      className="numeric inline-flex items-center gap-1.5 rounded-chip border px-2 py-1 text-[11px] font-semibold"
      style={{
        borderColor: key ? `color-mix(in oklab, var(--stat-${key}) 45%, transparent)` : undefined,
        color: key ? `var(--stat-${key})` : undefined,
      }}
    >
      {label}
      <span>{formatSigned(change)}</span>
    </span>
  )
}

function FlagsPanel({ flags }: { flags: number[] }) {
  const dex = useDex()
  const active = dex.meta.moveFlags.filter((flag) => flags.includes(flag.id))

  return (
    <Panel>
      <SectionTitle eyebrow={`${active.length} of ${dex.meta.moveFlags.length}`}>Flags</SectionTitle>
      {active.length === 0 ? (
        <p className="text-sm text-dim">This move carries no interaction flags.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((flag) => (
            <li key={flag.id} className="flex items-baseline gap-2.5">
              <span className="numeric shrink-0 rounded-chip bg-raised px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-accent">
                {flag.name.replace(/-/g, ' ')}
              </span>
              <span className="min-w-0 text-[12.5px] leading-snug text-dim">{flag.label}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function EfficacyPanel({ typeId, damageClassId }: { typeId: number; damageClassId: number }) {
  const dex = useDex()
  const chart = dex.meta.typeChart

  const groups = useMemo(() => {
    if (!chart[typeId]) return null
    const superEffective: number[] = []
    const resisted: number[] = []
    const immune: number[] = []
    const neutral: number[] = []
    for (const defending of BATTLE_TYPE_IDS) {
      const value = effectiveness(chart, typeId, [defending])
      if (value === 0) immune.push(defending)
      else if (value > 1) superEffective.push(defending)
      else if (value < 1) resisted.push(defending)
      else neutral.push(defending)
    }
    return { superEffective, resisted, immune, neutral }
  }, [chart, typeId])

  return (
    <Panel className="h-full">
      <SectionTitle eyebrow="Coverage">Type effectiveness</SectionTitle>
      {damageClassId === 1 ? (
        <p className="text-sm text-dim">
          Status moves deal no damage, so type matchups only decide whether the move can land at all.
        </p>
      ) : !groups ? (
        <p className="text-sm text-dim">This type has no entry in the modern type chart.</p>
      ) : (
        <div className="space-y-3.5">
          <EfficacyGroup label="Super effective" multiplier={2} typeIds={groups.superEffective} />
          <EfficacyGroup label="Not very effective" multiplier={0.5} typeIds={groups.resisted} />
          <EfficacyGroup label="No effect" multiplier={0} typeIds={groups.immune} />
          <EfficacyGroup label="Neutral" multiplier={1} typeIds={groups.neutral} muted />
          <p className="text-[11px] leading-snug text-faint">
            Multipliers stack on dual-typed targets, so a resisted matchup can still reach 4× or fall to ¼×.
          </p>
        </div>
      )}
    </Panel>
  )
}

function EfficacyGroup({
  label,
  multiplier,
  typeIds,
  muted = false,
}: {
  label: string
  multiplier: number
  typeIds: number[]
  muted?: boolean
}) {
  const dex = useDex()
  if (typeIds.length === 0) return null
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <MicroLabel>{label}</MicroLabel>
        <span className={cx('numeric text-[11px] font-semibold', muted ? 'text-faint' : 'text-accent')}>
          {effectivenessLabel(multiplier)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {typeIds.map((id) => (
          <TypeBadge
            key={id}
            typeId={id}
            label={dex.typeById.get(id)?.label ?? '—'}
            size="xs"
            variant={muted ? 'outline' : 'solid'}
          />
        ))}
      </div>
    </div>
  )
}
