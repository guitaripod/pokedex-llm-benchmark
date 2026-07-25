import { Link } from 'react-router-dom'
import { Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Sprite } from '@/components/ui/Sprite'
import { typeSlug, useDex } from '@/lib/dex'
import { BATTLE_TYPE_IDS, effectivenessLabel } from '@/lib/game'
import { cx } from '@/lib/cx'
import { pokemonThumbSources } from './PokemonPicker'
import { SHARED_WEAKNESS_THRESHOLD } from './analysis'
import type { TeamAnalysis, TeamMember } from './analysis'

export function DefensiveMatrix({ analysis }: { analysis: TeamAnalysis }) {
  const dex = useDex()

  return (
    <Panel padded={false}>
      <div className="p-5 pb-3">
        <SectionTitle
          eyebrow="Defence"
          className="mb-0"
          actions={
            <span className="numeric hidden text-[10px] uppercase tracking-[0.16em] text-faint sm:block">
              Damage taken per attacking type
            </span>
          }
        >
          Coverage matrix
        </SectionTitle>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-center">
          <thead>
            <tr className="border-y border-line bg-surface">
              <th
                scope="col"
                className="sticky left-0 z-20 min-w-[148px] bg-[var(--ui-surface)] px-3 py-2 text-left"
              >
                <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Member
                </span>
              </th>
              {BATTLE_TYPE_IDS.map((typeId) => {
                const column = analysis.columns.find((item) => item.typeId === typeId)
                return (
                  <th key={typeId} scope="col" className="px-0 py-1.5">
                    <Link
                      to={`/types/${typeSlug(typeId)}`}
                      title={dex.typeById.get(typeId)?.label}
                      className={cx(
                        'mx-auto flex w-[38px] flex-col items-center gap-1 rounded-chip py-1 transition hover:bg-raised',
                        column?.shared && 'bg-[color-mix(in_oklab,var(--type-fighting)_16%,transparent)]',
                      )}
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-5 rounded-full"
                        style={{ background: `var(--type-${typeSlug(typeId)})` }}
                      />
                      <span className="numeric text-[9px] font-semibold uppercase tracking-[0.08em] text-dim">
                        {abbreviate(typeId)}
                      </span>
                    </Link>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {analysis.members.map((member) => (
              <tr key={member.index} className="border-b border-line-soft">
                <th scope="row" className="sticky left-0 z-10 bg-[var(--ui-surface)] px-3 py-1.5 text-left">
                  <MemberLabel member={member} />
                </th>
                {BATTLE_TYPE_IDS.map((typeId) => {
                  const value = member.defense.byType[typeId] ?? 1
                  return (
                    <td key={typeId} className="px-0.5 py-1">
                      <span
                        className={cx(
                          'numeric mx-auto flex h-6 w-[38px] items-center justify-center rounded-[4px] text-[10px] font-semibold',
                          value === 1 && 'text-faint',
                        )}
                        style={toneStyle(value)}
                        title={`${dex.typeById.get(typeId)?.label ?? ''} → ${effectivenessLabel(value)}`}
                      >
                        {value === 1 ? '·' : effectivenessLabel(value)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}

            <SummaryRow
              label="Weak"
              tone="var(--type-fighting)"
              values={analysis.columns.map((column) => column.weak)}
              flag={(value) => value >= SHARED_WEAKNESS_THRESHOLD}
            />
            <SummaryRow
              label="Resist"
              tone="var(--type-grass)"
              values={analysis.columns.map((column) => column.resist)}
              flag={() => false}
            />
            <SummaryRow
              label="Immune"
              tone="var(--type-ghost)"
              values={analysis.columns.map((column) => column.immune)}
              flag={() => false}
            />
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3">
        {LEGEND.map(([value, caption]) => (
          <span key={value} className="flex items-center gap-1.5">
            <span
              className="numeric flex h-5 w-8 items-center justify-center rounded-[4px] text-[9px] font-semibold"
              style={toneStyle(value)}
            >
              {value === 1 ? '·' : effectivenessLabel(value)}
            </span>
            <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">{caption}</span>
          </span>
        ))}
      </div>
    </Panel>
  )
}

export function ThreatSignals({ analysis }: { analysis: TeamAnalysis }) {
  const dex = useDex()
  const typeLabel = (id: number) => dex.typeById.get(id)?.label ?? ''

  return (
    <Panel>
      <SectionTitle eyebrow="Signals">Structural risks</SectionTitle>
      <div className="space-y-4">
        <SignalBlock
          title={`Shared weaknesses (${SHARED_WEAKNESS_THRESHOLD}+ members)`}
          hint="A single attacker of this type threatens half the team or more."
          empty="No type hits three or more members super-effectively."
          tone="var(--type-fighting)"
        >
          {analysis.sharedWeaknesses.map((typeId) => (
            <span key={typeId} className="flex items-center gap-1">
              <TypeBadge typeId={typeId} label={typeLabel(typeId)} size="xs" />
              <span className="numeric text-[10px] font-semibold text-[var(--type-fighting)]">
                ×{analysis.columns.find((column) => column.typeId === typeId)?.weak ?? 0}
              </span>
            </span>
          ))}
        </SignalBlock>

        <SignalBlock
          title="Unresisted attack types"
          hint="Nothing on the team takes reduced damage from these."
          empty="Every attacking type is resisted by someone."
          tone="var(--type-ground)"
        >
          {analysis.unresistedTypes.map((typeId) => (
            <TypeBadge key={typeId} typeId={typeId} label={typeLabel(typeId)} size="xs" />
          ))}
        </SignalBlock>

        <SignalBlock
          title="Offensive blind spots"
          hint="No selected move hits these types super-effectively."
          empty={
            analysis.attackingTypes.length === 0
              ? 'Add attacking moves to compute offensive coverage.'
              : 'The team hits every type super-effectively.'
          }
          tone="var(--type-electric)"
        >
          {analysis.attackingTypes.length > 0 &&
            analysis.offensiveGaps.map((typeId) => (
              <TypeBadge key={typeId} typeId={typeId} label={typeLabel(typeId)} size="xs" />
            ))}
        </SignalBlock>

        <div className="border-t border-line-soft pt-4">
          <p className="numeric text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            Defensive load
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-faint">
            Weak / resist / immune counts across the 18 attacking types.
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {analysis.members.map((member) => (
              <li key={member.index} className="flex items-center gap-2">
                <span className="w-[104px] shrink-0 truncate text-[12px]">
                  {member.slot.nickname?.trim() || member.entry.label}
                </span>
                <span className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-raised">
                  <span
                    style={{
                      width: `${(member.defense.weaknesses.length / BATTLE_TYPE_IDS.length) * 100}%`,
                      background: 'var(--type-fighting)',
                    }}
                  />
                  <span
                    style={{
                      width: `${(member.defense.resistances.length / BATTLE_TYPE_IDS.length) * 100}%`,
                      background: 'var(--type-grass)',
                    }}
                  />
                  <span
                    style={{
                      width: `${(member.defense.immunities.length / BATTLE_TYPE_IDS.length) * 100}%`,
                      background: 'var(--type-ghost)',
                    }}
                  />
                </span>
                <span className="numeric w-[62px] shrink-0 text-right text-[11px]">
                  <span className="text-[var(--type-fighting)]">{member.defense.weaknesses.length}</span>
                  <span className="text-faint"> / </span>
                  <span className="text-[var(--type-grass)]">{member.defense.resistances.length}</span>
                  <span className="text-faint"> / </span>
                  <span className="text-[var(--type-ghost)]">{member.defense.immunities.length}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  )
}

export function OffensiveCoverage({ analysis }: { analysis: TeamAnalysis }) {
  const dex = useDex()

  return (
    <Panel>
      <SectionTitle
        eyebrow="Offence"
        actions={
          <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
            {analysis.superEffectiveTypes.length}/18 super-effective
          </span>
        }
      >
        Type coverage
      </SectionTitle>

      {analysis.attackingTypes.length === 0 ? (
        <p className="rounded-plate border border-dashed border-line px-4 py-10 text-center text-sm text-dim">
          Assign attacking moves to your team to map offensive coverage.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="numeric mr-1 text-[10px] uppercase tracking-[0.16em] text-faint">
              Attacking types
            </span>
            {analysis.attackingTypes.map((typeId) => (
              <TypeBadge
                key={typeId}
                typeId={typeId}
                label={dex.typeById.get(typeId)?.label ?? ''}
                size="xs"
              />
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 2xl:grid-cols-4">
            {analysis.offense.map((column) => (
              <li
                key={column.typeId}
                className={cx(
                  'flex items-center justify-between gap-2 rounded-chip border px-2 py-1.5',
                  column.best > 1
                    ? 'border-[color-mix(in_oklab,var(--type-grass)_40%,transparent)] bg-[color-mix(in_oklab,var(--type-grass)_10%,transparent)]'
                    : column.best === 0
                      ? 'border-line bg-raised/40'
                      : 'border-[color-mix(in_oklab,var(--type-fighting)_30%,transparent)]',
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-3.5 w-1 shrink-0 rounded-full"
                    style={{ background: `var(--type-${typeSlug(column.typeId)})` }}
                  />
                  <span className="numeric truncate text-[10px] uppercase tracking-[0.1em] text-dim">
                    {dex.typeById.get(column.typeId)?.label}
                  </span>
                </span>
                <span
                  className={cx(
                    'numeric shrink-0 text-[11px] font-semibold',
                    column.best > 1 ? 'text-[var(--type-grass)]' : 'text-faint',
                  )}
                >
                  {effectivenessLabel(column.best)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-line-soft pt-3">
            {analysis.members.map((member) => (
              <div key={member.index} className="flex items-center gap-2">
                <span className="w-[120px] shrink-0 truncate text-[11px] text-dim">
                  {member.slot.nickname?.trim() || member.entry.label}
                </span>
                <span className="flex min-w-0 flex-wrap items-center gap-1">
                  {member.moveTypeIds.length === 0 ? (
                    <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
                      No attacking moves
                    </span>
                  ) : (
                    member.moveTypeIds.map((typeId) => (
                      <TypeBadge
                        key={typeId}
                        typeId={typeId}
                        label={dex.typeById.get(typeId)?.label ?? ''}
                        size="xs"
                        variant="outline"
                        link={false}
                      />
                    ))
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}

export function TeamOverview({ analysis }: { analysis: TeamAnalysis }) {
  const dex = useDex()
  const fastest = analysis.speedTiers[0]?.speed ?? 1

  return (
    <Panel>
      <SectionTitle eyebrow="Roster">Team profile</SectionTitle>

      <div className="grid grid-cols-2 gap-4 border-b border-line-soft pb-4 sm:grid-cols-4">
        <Stat label="Members" value={`${analysis.members.length}/6`} />
        <Stat label="Total BST" value={analysis.totalBst} accent />
        <Stat label="Average BST" value={analysis.averageBst} />
        <Stat
          label="Move split"
          value={`${analysis.damageClassSplit.physical} / ${analysis.damageClassSplit.special} / ${analysis.damageClassSplit.status}`}
          hint="Physical / Special / Status"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 pt-4 md:grid-cols-2">
        <div>
          <p className="numeric mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            Speed tiers
          </p>
          <ul className="space-y-1.5">
            {analysis.speedTiers.map((tier) => (
              <li key={tier.index} className="flex items-center gap-2">
                <span className="w-[104px] shrink-0 truncate text-[12px]">{tier.label}</span>
                <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-raised">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${Math.max(4, (tier.speed / fastest) * 100)}%`,
                      background: 'var(--stat-speed)',
                    }}
                  />
                </span>
                <span className="numeric w-9 shrink-0 text-right text-[12px] font-semibold">{tier.speed}</span>
                <span className="numeric w-14 shrink-0 text-right text-[10px] text-faint">
                  {tier.base} @ L{tier.level}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="numeric mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            Type distribution
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {analysis.typeDistribution.map((row) => (
              <li key={row.typeId} className="flex items-center gap-1">
                <TypeBadge
                  typeId={row.typeId}
                  label={dex.typeById.get(row.typeId)?.label ?? ''}
                  size="xs"
                  variant="ghost"
                  link={false}
                />
                <span className="numeric text-[10px] font-semibold text-dim">×{row.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-dim">
            {analysis.typeDistribution.length} distinct types across {analysis.members.length} members
            {analysis.typeDistribution.some((row) => row.count > 2)
              ? ' — a repeated type concentrates shared weaknesses.'
              : '.'}
          </p>
        </div>
      </div>
    </Panel>
  )
}

function MemberLabel({ member }: { member: TeamMember }) {
  return (
    <Link to={`/pokemon/${member.entry.name}`} className="flex items-center gap-2">
      <Sprite
        sources={pokemonThumbSources(member.entry.id)}
        alt=""
        className="h-6 w-6 shrink-0"
        pixelated
      />
      <span className="min-w-0">
        <span className="block max-w-[104px] truncate text-[12px] font-medium leading-tight">
          {member.slot.nickname?.trim() || member.entry.label}
        </span>
        {member.abilityAltersDefense && member.ability && (
          <span className="numeric block truncate text-[9px] uppercase tracking-[0.1em] text-accent">
            {member.ability.label}
          </span>
        )}
      </span>
    </Link>
  )
}

function SummaryRow({
  label,
  tone,
  values,
  flag,
}: {
  label: string
  tone: string
  values: number[]
  flag: (value: number) => boolean
}) {
  return (
    <tr className="border-t border-line bg-surface/60">
      <th scope="row" className="sticky left-0 z-10 bg-[var(--ui-surface)] px-3 py-1.5 text-left">
        <span className="numeric text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: tone }}>
          {label}
        </span>
      </th>
      {values.map((value, index) => (
        <td key={index} className="px-0.5 py-1">
          <span
            className={cx(
              'numeric mx-auto flex h-5 w-[38px] items-center justify-center rounded-[4px] text-[10px] font-semibold',
              value === 0 ? 'text-faint' : 'text-ink',
            )}
            style={
              flag(value)
                ? { background: 'color-mix(in oklab, var(--type-fighting) 45%, transparent)' }
                : value > 0
                  ? { background: `color-mix(in oklab, ${tone} 16%, transparent)` }
                  : undefined
            }
          >
            {value === 0 ? '·' : value}
          </span>
        </td>
      ))}
    </tr>
  )
}

function SignalBlock({
  title,
  hint,
  empty,
  tone,
  children,
}: {
  title: string
  hint: string
  empty: string
  tone: string
  children: React.ReactNode
}) {
  const list = Array.isArray(children) ? children.flat().filter(Boolean) : children
  const isEmpty = !list || (Array.isArray(list) && list.length === 0)

  return (
    <div>
      <p className="numeric text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: tone }}>
        {title}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-faint">{hint}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {isEmpty ? <span className="text-[12px] text-dim">{empty}</span> : list}
      </div>
    </div>
  )
}

const LEGEND: [number, string][] = [
  [4, 'Double weak'],
  [2, 'Weak'],
  [1, 'Neutral'],
  [0.5, 'Resist'],
  [0.25, 'Double resist'],
  [0, 'Immune'],
]

function abbreviate(typeId: number): string {
  return typeSlug(typeId).slice(0, 3).toUpperCase()
}

/// Colour ramp for an incoming-damage multiplier: red for weak, green for resisted, violet for immune.
function toneStyle(value: number): React.CSSProperties {
  if (value === 0) return { background: 'color-mix(in oklab, var(--type-ghost) 42%, transparent)' }
  if (value >= 4) return { background: 'color-mix(in oklab, var(--type-fighting) 62%, transparent)' }
  if (value > 1) return { background: 'color-mix(in oklab, var(--type-fighting) 30%, transparent)' }
  if (value <= 0.25) return { background: 'color-mix(in oklab, var(--type-grass) 52%, transparent)' }
  if (value < 1) return { background: 'color-mix(in oklab, var(--type-grass) 26%, transparent)' }
  return {}
}
