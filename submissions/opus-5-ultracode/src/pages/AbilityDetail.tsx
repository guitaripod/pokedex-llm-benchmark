import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import { Chip, Select } from '@/components/ui/Controls'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { TypeDot } from '@/components/ui/TypeBadge'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import { DefensiveShift } from '@/components/abilities/DefensiveShift'
import {
  GenerationTag,
  NonMainSeriesTag,
  TypeShiftBadge,
  generationRoman,
} from '@/components/abilities/AbilityMarks'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { hasDefensiveAbilityEffect } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { AbilityDetail as AbilityRecord, PokemonIndexEntry } from '@/types/data'

const FALLBACK_ACCENT = 'var(--type-psychic)'

interface Holder {
  entry: PokemonIndexEntry
  slot: number
  hidden: boolean
}

/// Collapses alternate forms to one card per species, preferring the default form.
function dedupeBySpecies(holders: Holder[]): Holder[] {
  const bySpecies = new Map<number, Holder>()
  for (const holder of holders) {
    const current = bySpecies.get(holder.entry.speciesId)
    if (!current || (!current.entry.isDefault && holder.entry.isDefault)) {
      bySpecies.set(holder.entry.speciesId, holder)
    }
  }
  return [...bySpecies.values()].sort((a, b) => a.entry.id - b.entry.id)
}

/// The primary type carried by the most holders, used to tint the page to the ability's flavour.
function dominantType(holders: Holder[]): number | null {
  const tally = new Map<number, number>()
  for (const holder of holders) {
    const primary = holder.entry.types[0]
    if (primary) tally.set(primary, (tally.get(primary) ?? 0) + 1)
  }
  let best: number | null = null
  let bestCount = 0
  for (const [typeId, count] of tally) {
    if (count > bestCount) {
      best = typeId
      bestCount = count
    }
  }
  return best
}

/// Ranks the primary types across the roster so the spread bar reads largest-first.
function typeSpread(holders: Holder[]): { typeId: number; count: number }[] {
  const tally = new Map<number, number>()
  for (const holder of holders) {
    const primary = holder.entry.types[0]
    if (primary) tally.set(primary, (tally.get(primary) ?? 0) + 1)
  }
  return [...tally.entries()]
    .map(([typeId, count]) => ({ typeId, count }))
    .sort((a, b) => b.count - a.count)
}

/// Groups version groups that share identical flavour wording into a single row.
function groupFlavor(rows: { versionGroupId: number; text: string }[]) {
  const byText = new Map<string, number[]>()
  for (const row of rows) {
    const bucket = byText.get(row.text)
    if (bucket) bucket.push(row.versionGroupId)
    else byText.set(row.text, [row.versionGroupId])
  }
  return [...byText.entries()].map(([text, versionGroupIds]) => ({
    text,
    versionGroupIds: versionGroupIds.sort((a, b) => a - b),
  }))
}

export default function AbilityDetail() {
  const { slug } = useParams<{ slug: string }>()
  const dex = useDex()
  const index = useAsync('abilities-index', load.abilityIndex)
  const entry = useMemo(
    () => index.data?.entries.find((item) => item.name === slug),
    [index.data, slug],
  )
  const detail = useAsync(entry ? `ability-${entry.id}` : null, () => load.ability(entry!.id))

  const holders = useMemo<Holder[]>(
    () =>
      (detail.data?.pokemon ?? [])
        .map(([pokemonId, slot, hidden]) => {
          const pokemon = dex.byId.get(pokemonId)
          return pokemon ? { entry: pokemon, slot, hidden: hidden === 1 } : null
        })
        .filter((holder): holder is Holder => holder !== null),
    [detail.data, dex],
  )

  const accent = useMemo(() => {
    const accentType = dominantType(dedupeBySpecies(holders))
    return accentType ? `var(--type-${typeSlug(accentType)})` : FALLBACK_ACCENT
  }, [holders])

  if (index.loading) return <InlineLoader label="Loading ability" />
  if (index.error) return <ErrorState message={index.error.message} onRetry={() => window.location.reload()} />

  if (!entry) {
    return (
      <div>
        <PageHeader eyebrow="Ability" title="Unknown ability" />
        <EmptyState
          title={`No ability called “${slug}”`}
          hint="It may have been renamed. Browse the full ability index to find it."
        />
        <div className="mt-4 text-center">
          <Link to="/abilities" className="text-sm text-accent underline-offset-4 hover:underline">
            Back to all abilities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow={`Ability · #${String(entry.id).padStart(3, '0')}`}
        title={entry.label}
        subtitle={entry.shortEffect ?? 'No recorded effect.'}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <GenerationTag generation={entry.generation} />
            {!entry.isMainSeries && <NonMainSeriesTag />}
            {hasDefensiveAbilityEffect(entry.name) && <TypeShiftBadge />}
          </div>
        }
      />

      {detail.loading && <InlineLoader label={`Loading ${entry.label}`} />}
      {detail.error && (
        <ErrorState message={detail.error.message} onRetry={() => window.location.reload()} />
      )}

      {detail.data && <AbilityBody record={detail.data} holders={holders} />}
    </div>
  )
}

function AbilityBody({ record, holders }: { record: AbilityRecord; holders: Holder[] }) {
  const dex = useDex()
  const [tab, setTab] = useState('regular')
  const [allForms, setAllForms] = useState(false)
  const [holderId, setHolderId] = useState<number | null>(null)

  const regular = useMemo(() => holders.filter((holder) => !holder.hidden), [holders])
  const hidden = useMemo(() => holders.filter((holder) => holder.hidden), [holders])
  const species = useMemo(() => dedupeBySpecies(holders), [holders])
  const uniqueRegular = useMemo(() => dedupeBySpecies(regular), [regular])
  const uniqueHidden = useMemo(() => dedupeBySpecies(hidden), [hidden])
  const shownRegular = allForms ? regular : uniqueRegular
  const shownHidden = allForms ? hidden : uniqueHidden
  const spread = useMemo(() => typeSpread(species), [species])
  const flavor = useMemo(() => groupFlavor(record.flavorText), [record.flavorText])

  const demoCandidates = useMemo(
    () => [...species].sort((a, b) => b.entry.bst - a.entry.bst || a.entry.id - b.entry.id),
    [species],
  )
  const demoHolder =
    demoCandidates.find((holder) => holder.entry.id === holderId) ?? demoCandidates[0] ?? null
  const showsDefenseDemo = hasDefensiveAbilityEffect(record.name) && demoHolder !== null

  const localized = useMemo(
    () =>
      dex.meta.languages
        .filter((language) => language.code !== 'en' && record.names[language.code])
        .map((language) => ({ label: language.label, value: record.names[language.code] })),
    [dex.meta.languages, record.names],
  )

  const spreadTotal = spread.reduce((total, item) => total + item.count, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle eyebrow="Mechanics">Effect</SectionTitle>
          <p className="text-[15px] leading-relaxed text-ink">
            {record.effect ?? record.shortEffect ?? 'No effect text is recorded for this ability.'}
          </p>
          {record.effect && record.shortEffect && (
            <p className="mt-4 border-t border-line-soft pt-3 text-[13px] leading-relaxed text-dim">
              <span className="numeric mr-2 text-[10px] uppercase tracking-[0.16em] text-faint">In short</span>
              {record.shortEffect}
            </p>
          )}
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Profile">Roster</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Pokémon" value={species.length} hint="unique species" accent />
            <Stat label="Form rows" value={holders.length} hint="including variants" />
            <Stat label="Regular" value={uniqueRegular.length} hint="slot 1 or 2" />
            <Stat label="Hidden" value={uniqueHidden.length} hint="slot 3" />
            <Stat label="Introduced" value={`Gen ${generationRoman(record.generation)}`} />
            <Stat label="Main series" value={record.isMainSeries ? 'Yes' : 'No'} />
          </div>

          {spreadTotal > 0 && (
            <div className="mt-4 border-t border-line-soft pt-3">
              <p className="numeric mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Primary type spread
              </p>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-raised">
                {spread.map((item) => (
                  <span
                    key={item.typeId}
                    title={`${dex.typeById.get(item.typeId)?.label ?? ''} · ${item.count}`}
                    style={{
                      width: `${(item.count / spreadTotal) * 100}%`,
                      background: `var(--type-${typeSlug(item.typeId)})`,
                    }}
                  />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {spread.slice(0, 6).map((item) => (
                  <li key={item.typeId} className="flex items-center gap-1.5">
                    <TypeDot typeId={item.typeId} />
                    <span className="text-[11px] text-dim">{dex.typeById.get(item.typeId)?.label}</span>
                    <span className="numeric text-[11px] text-faint">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      {showsDefenseDemo && demoHolder && (
        <Panel>
          <SectionTitle
            eyebrow="Demonstration"
            actions={
              <Select
                aria-label="Demonstration holder"
                value={demoHolder.entry.id}
                onChange={(event) => setHolderId(Number(event.target.value))}
                className="w-[190px]"
              >
                {demoCandidates.map((holder) => (
                  <option key={holder.entry.id} value={holder.entry.id}>
                    {holder.entry.label}
                  </option>
                ))}
              </Select>
            }
          >
            Defensive chart with {record.label}
          </SectionTitle>
          <p className="mb-4 text-[13px] leading-relaxed text-dim">
            Incoming effectiveness for{' '}
            <Link to={`/pokemon/${demoHolder.entry.name}`} className="text-accent hover:underline">
              {demoHolder.entry.label}
            </Link>{' '}
            once {record.label} is applied. Struck-through values are what the raw type chart would give.
          </p>
          <DefensiveShift types={demoHolder.entry.types} abilitySlug={record.name} />
        </Panel>
      )}

      <Panel>
        <SectionTitle
          eyebrow={`${species.length} Pokémon`}
          actions={
            <Chip active={allForms} onClick={() => setAllForms((value) => !value)}>
              {allForms ? 'All forms' : 'One per species'}
            </Chip>
          }
        >
          Who has it
        </SectionTitle>

        <Tabs idPrefix="ability-tabs"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'regular', label: 'Regular ability', count: shownRegular.length },
            { id: 'hidden', label: 'Hidden ability', count: shownHidden.length },
          ]}
          className="mb-4"
        />

        <TabPanel idPrefix="ability-tabs" id="regular" active={tab === 'regular'}>
          <HolderGrid holders={shownRegular} emptyHint="No Pokémon carries this as a regular ability." />
        </TabPanel>
        <TabPanel idPrefix="ability-tabs" id="hidden" active={tab === 'hidden'}>
          <HolderGrid holders={shownHidden} emptyHint="No Pokémon carries this as a hidden ability." />
        </TabPanel>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle eyebrow={`${record.flavorText.length} entries`}>Game text</SectionTitle>
          {flavor.length === 0 ? (
            <p className="text-sm text-dim">No in-game description is recorded.</p>
          ) : (
            <ul className="space-y-3">
              {flavor.map((group) => (
                <li key={group.text} className="border-l-2 border-line pl-3">
                  <p className="text-[13px] leading-relaxed text-ink">{group.text}</p>
                  <p className="numeric mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-[0.12em] text-faint">
                    {group.versionGroupIds.map((id) => (
                      <span key={id}>{dex.nameOf('versionGroups', id)}</span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionTitle eyebrow={`${localized.length} languages`}>Names</SectionTitle>
          {localized.length === 0 ? (
            <p className="text-sm text-dim">No localized names are recorded.</p>
          ) : (
            <dl className="space-y-1.5">
              {localized.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-3">
                  <dt className="numeric shrink-0 text-[10px] uppercase tracking-[0.14em] text-faint">
                    {item.label}
                  </dt>
                  <dd className="min-w-0 truncate text-right text-[13px]">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Panel>
      </div>

      {record.changelog.length > 0 && (
        <Panel>
          <SectionTitle eyebrow={`${record.changelog.length} revisions`}>Changelog</SectionTitle>
          <p className="mb-3 text-[12px] text-faint">
            How the ability behaved before each listed version group rewrote it.
          </p>
          <ol className="space-y-3">
            {record.changelog.map((change) => (
              <li key={change.versionGroupId} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <span className="numeric shrink-0 text-[10px] uppercase tracking-[0.14em] text-accent sm:w-48">
                  Before {dex.nameOf('versionGroups', change.versionGroupId)}
                </span>
                <span className="text-[13px] leading-relaxed text-dim">
                  {change.effect ?? 'Effect text not recorded.'}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  )
}

function HolderGrid({ holders, emptyHint }: { holders: Holder[]; emptyHint: string }) {
  if (holders.length === 0) return <EmptyState title="Nobody" hint={emptyHint} />
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {holders.map((holder) => (
        <li key={`${holder.entry.id}-${holder.slot}`}>
          <PokemonCard
            entry={holder.entry}
            badge={holder.hidden ? <SlotPill label="HA" /> : <SlotPill label={`S${holder.slot}`} />}
          />
        </li>
      ))}
    </ul>
  )
}

function SlotPill({ label }: { label: string }) {
  return (
    <span
      className={cx(
        'numeric rounded-chip border border-line bg-[var(--ui-surface)] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em]',
        label === 'HA' ? 'text-accent' : 'text-faint',
      )}
    >
      {label}
    </span>
  )
}
