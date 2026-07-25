import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { Button, Spinner } from '@/components/ui/Controls'
import { load } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { emptySlot, useApp } from '@/lib/store'
import { cx } from '@/lib/cx'
import { PokemonPicker } from '@/components/team/PokemonPicker'
import { TeamSlotCard } from '@/components/team/TeamSlotCard'
import { TeamShareDialog, copyText } from '@/components/team/TeamShareDialog'
import {
  DefensiveMatrix,
  OffensiveCoverage,
  TeamOverview,
  ThreatSignals,
} from '@/components/team/TeamAnalysis'
import { TeamDataProvider, useIndexBundle } from '@/components/team/TeamDataContext'
import { buildTeamAnalysis } from '@/components/team/analysis'
import { buildRandomTeam } from '@/components/team/randomTeam'
import {
  TEAM_PARAM,
  TEAM_SIZE,
  decodeTeam,
  encodeTeam,
  normalizeTeam,
  teamFromJson,
  teamToJson,
  type TeamLabels,
} from '@/components/team/share'
import type { PokemonIndexEntry } from '@/types/data'
import type { TeamSlot } from '@/lib/store'

export default function TeamBuilder() {
  const dex = useDex()
  const storedTeam = useApp((state) => state.team)
  const setTeamSlot = useApp((state) => state.setTeamSlot)
  const updateTeamSlot = useApp((state) => state.updateTeamSlot)
  const clearTeam = useApp((state) => state.clearTeam)

  const [pickerTarget, setPickerTarget] = useState<number | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const slots = useMemo(() => normalizeTeam(storedTeam), [storedTeam])
  const filled = useMemo(() => slots.filter((slot): slot is TeamSlot => slot !== null), [slots])

  const abilities = useIndexBundle('abilities-index', load.abilityIndex, filled.length > 0)
  const items = useIndexBundle(
    'items-index',
    load.itemIndex,
    filled.some((slot) => slot.itemId !== null),
  )
  const moves = useIndexBundle(
    'moves-index',
    load.moveIndex,
    filled.some((slot) => slot.moveIds.some((id) => id !== null)),
  )

  const teamData = useMemo(() => ({ abilities, items, moves }), [abilities, items, moves])

  const analysis = useMemo(
    () =>
      buildTeamAnalysis({
        team: slots,
        chart: dex.meta.typeChart,
        entryOf: (id) => dex.byId.get(id),
        natureOf: (id) => (id === null ? null : (dex.meta.natures.find((n) => n.id === id) ?? null)),
        abilityOf: (id) => {
          if (id === null) return null
          const ability = abilities.byId?.get(id)
          return ability ? { slug: ability.name, label: ability.label } : null
        },
        moveOf: (id) => (id === null ? null : (moves.byId?.get(id) ?? null)),
      }),
    [slots, dex, abilities.byId, moves.byId],
  )

  const scaleMax = useMemo(() => {
    let highest = 140
    for (const member of analysis.members) {
      for (const value of member.finalStats) highest = Math.max(highest, value)
    }
    return highest
  }, [analysis.members])

  const labels: TeamLabels = useMemo(
    () => ({
      pokemon: (id) => dex.byId.get(id)?.name,
      nature: (id) => dex.meta.natures.find((nature) => nature.id === id)?.name,
      ability: (id) => abilities.byId?.get(id)?.name,
      item: (id) => items.byId?.get(id)?.name,
      move: (id) => moves.byId?.get(id)?.name,
      pokemonIdBySlug: (slug) => dex.bySlug.get(slug)?.id,
    }),
    [dex, abilities.byId, items.byId, moves.byId],
  )

  const applyTeam = useCallback(
    (next: (TeamSlot | null)[]) => {
      for (let index = 0; index < TEAM_SIZE; index += 1) setTeamSlot(index, next[index] ?? null)
    },
    [setTeamSlot],
  )

  useImportedTeamLink(applyTeam, setNotice)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const shareCode = useMemo(() => encodeTeam(slots), [slots])
  const shareUrl = `${typeof window === 'undefined' ? '' : window.location.origin}/team?${TEAM_PARAM}=${shareCode}`
  const json = useMemo(() => teamToJson(slots, labels), [slots, labels])

  const assignSlot = (index: number, entry: PokemonIndexEntry) => {
    const previous = slots[index]
    const slot = emptySlot(entry.id)
    slot.level = previous?.level ?? 50
    slot.abilityId = (entry.abilities.find((ability) => !ability.hidden) ?? entry.abilities[0])?.id ?? null
    setTeamSlot(index, slot)
    setPickerTarget(null)
  }

  const rollRandomTeam = async () => {
    setRolling(true)
    abilities.request()
    moves.request()
    try {
      const next = await buildRandomTeam(dex.entries, dex.meta.natures)
      applyTeam(next)
      setNotice('Rolled a random six with coverage-first movesets')
    } catch {
      setNotice('Could not build a random team — data failed to load')
    } finally {
      setRolling(false)
    }
  }

  const accent = `var(--type-${typeSlug(analysis.members[0]?.entry.types[0] ?? 1)})`

  return (
    <TeamDataProvider value={teamData}>
      <div style={{ '--accent': accent } as React.CSSProperties}>
        <PageHeader
          eyebrow="Battle tools"
          title="Team builder"
          subtitle="Six slots, full spreads, and the defensive maths that decides games. Everything persists locally and travels in a link."
          actions={
            <>
              <Button size="sm" onClick={() => void rollRandomTeam()} disabled={rolling}>
                {rolling ? <Spinner className="h-3.5 w-3.5" /> : null}
                Random
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  void copyText(shareUrl).then((copied) =>
                    setNotice(copied ? 'Share link copied' : 'Copy failed — open share to select it'),
                  )
                }}
                disabled={filled.length === 0}
              >
                Copy link
              </Button>
              <Button size="sm" variant="soft" onClick={() => setShareOpen(true)}>
                Share
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  clearTeam()
                  setNotice('Team cleared')
                }}
                disabled={filled.length === 0}
              >
                Clear
              </Button>
            </>
          }
        >
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <HeaderMetric label="Slots" value={`${filled.length}/6`} />
            <HeaderMetric label="Total BST" value={analysis.totalBst} />
            <HeaderMetric
              label="Shared weaknesses"
              value={analysis.sharedWeaknesses.length}
              alert={analysis.sharedWeaknesses.length > 0}
            />
            <HeaderMetric
              label="Unresisted types"
              value={analysis.unresistedTypes.length}
              alert={filled.length >= 4 && analysis.unresistedTypes.length > 4}
            />
            <HeaderMetric label="Moves set" value={analysis.moveCount} />
            {notice && (
              <span className="numeric rounded-chip bg-accent/15 px-2.5 py-1 text-[11px] text-accent">
                {notice}
              </span>
            )}
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {slots.map((slot, index) => {
            const entry = slot ? dex.byId.get(slot.pokemonId) : undefined
            if (!slot || !entry) {
              return (
                <EmptySlot
                  key={index}
                  index={index}
                  unknown={Boolean(slot && !entry)}
                  onPick={() => setPickerTarget(index)}
                  onClear={() => setTeamSlot(index, null)}
                />
              )
            }
            return (
              <TeamSlotCard
                key={`${index}-${slot.pokemonId}`}
                index={index}
                slot={slot}
                entry={entry}
                scaleMax={scaleMax}
                onUpdate={(patch) => updateTeamSlot(index, patch)}
                onRemove={() => setTeamSlot(index, null)}
                onReplace={() => setPickerTarget(index)}
              />
            )
          })}
        </div>

        <div className="mt-8 space-y-4">
          {analysis.members.length === 0 ? (
            <Panel padded={false}>
              <EmptyState
                title="No analysis yet"
                hint="Add at least one Pokémon to compute the defensive matrix, offensive coverage and speed tiers."
              />
            </Panel>
          ) : (
            <>
              <DefensiveMatrix analysis={analysis} />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ThreatSignals analysis={analysis} />
                <OffensiveCoverage analysis={analysis} />
              </div>
              <TeamOverview analysis={analysis} />
            </>
          )}
        </div>

        {pickerTarget !== null && (
          <PokemonPicker
            title={`Slot ${pickerTarget + 1} — choose a Pokémon`}
            onSelect={(entry) => assignSlot(pickerTarget, entry)}
            onClose={() => setPickerTarget(null)}
          />
        )}

        {shareOpen && (
          <TeamShareDialog
            shareUrl={shareUrl}
            json={json}
            onCopied={setNotice}
            onClose={() => setShareOpen(false)}
            onImport={(text) => {
              const next = teamFromJson(text, labels)
              if (!next) return false
              applyTeam(next)
              setNotice('Team imported from JSON')
              return true
            }}
          />
        )}
      </div>
    </TeamDataProvider>
  )
}

/// Consumes a `?t=` payload once, applies it to the store and strips it from the address bar.
function useImportedTeamLink(
  applyTeam: (team: (TeamSlot | null)[]) => void,
  setNotice: (message: string) => void,
) {
  const [params, setParams] = useSearchParams()
  const consumed = useRef<string | null>(null)

  useEffect(() => {
    const code = params.get(TEAM_PARAM)
    if (!code || consumed.current === code) return
    consumed.current = code

    const decoded = decodeTeam(code)
    if (decoded) {
      applyTeam(decoded)
      setNotice('Team imported from link')
    } else {
      setNotice('That team link could not be read')
    }

    const next = new URLSearchParams(params)
    next.delete(TEAM_PARAM)
    setParams(next, { replace: true })
  }, [params, setParams, applyTeam, setNotice])
}

function HeaderMetric({
  label,
  value,
  alert,
}: {
  label: string
  value: number | string
  alert?: boolean
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
        {label}
      </span>
      <span
        className={cx(
          'numeric text-[15px] font-semibold',
          alert ? 'text-[var(--type-fighting)]' : 'text-ink',
        )}
      >
        {value}
      </span>
    </span>
  )
}

function EmptySlot({
  index,
  unknown,
  onPick,
  onClear,
}: {
  index: number
  unknown: boolean
  onPick: () => void
  onClear: () => void
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-plate border border-dashed border-line p-6 text-center transition hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--ui-line))]">
      <p className="numeric text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
        Slot {index + 1}
      </p>
      <button
        type="button"
        onClick={onPick}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-faint transition hover:border-accent hover:text-accent"
        aria-label={`Add a Pokémon to slot ${index + 1}`}
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 4.5v11M4.5 10h11" />
        </svg>
      </button>
      <p className="text-[12px] text-dim">
        {unknown ? 'This slot references an unknown Pokémon.' : 'Empty — add a Pokémon.'}
      </p>
      {unknown && (
        <button
          type="button"
          onClick={onClear}
          className="numeric rounded-chip border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-dim transition hover:bg-raised hover:text-ink"
        >
          Clear slot
        </button>
      )}
    </div>
  )
}
