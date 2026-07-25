import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Panel, PageHeader, SectionTitle } from '@/components/ui/Panel'
import { Button, Segmented, Select, Toggle } from '@/components/ui/Controls'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Sprite } from '@/components/ui/Sprite'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { PokemonPicker } from '@/components/calc/PokemonPicker'
import { MovePicker, DAMAGE_CLASS_SHORT } from '@/components/calc/MovePicker'
import { Field, MicroLabel, NumberField, Readout, StageField } from '@/components/calc/Fields'
import { RollSpread } from '@/components/calc/RollSpread'
import {
  ATTACK_ITEMS,
  SCREEN_OPTIONS,
  WEATHER_OPTIONS,
  applyStage,
  effectiveStage,
  formatMultiplier,
  koChances,
  koVerdict,
  screenMultiplier,
  weatherMultiplier,
  type ScreenKey,
  type WeatherKey,
} from '@/components/calc/damage'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { itemSprite } from '@/lib/sprites'
import {
  DAMAGE_CLASS,
  STAT_IDS,
  applyDefensiveAbility,
  calculateDamage,
  computeHp,
  computeStat,
  defenseProfile,
  effectivenessLabel,
  formatDex,
  hasDefensiveAbilityEffect,
  natureMultiplier,
} from '@/lib/game'
import { cx } from '@/lib/cx'
import type { MoveIndexEntry, PokemonIndexEntry } from '@/types/data'

const DEFAULT_ATTACKER = 'charizard'
const DEFAULT_DEFENDER = 'venusaur'
const MAX_MODELLED_HITS = 8

interface OffenseConfig {
  level: number
  natureId: number
  abilityId: number | null
  itemSlug: string | null
  iv: number
  ev: number
  stage: number
}

interface DefenseConfig {
  level: number
  natureId: number
  abilityId: number | null
  hpIv: number
  hpEv: number
  iv: number
  ev: number
  stage: number
}

const INITIAL_OFFENSE: OffenseConfig = {
  level: 50,
  natureId: 1,
  abilityId: null,
  itemSlug: null,
  iv: 31,
  ev: 252,
  stage: 0,
}

const INITIAL_DEFENSE: DefenseConfig = {
  level: 50,
  natureId: 1,
  abilityId: null,
  hpIv: 31,
  hpEv: 0,
  iv: 31,
  ev: 0,
  stage: 0,
}

/// Picks the highest-power option, favouring same-type attacks, as the default move for a Pokémon.
function bestMove(moves: MoveIndexEntry[], types: number[]): MoveIndexEntry | null {
  let best: MoveIndexEntry | null = null
  let bestScore = -1
  for (const move of moves) {
    const score = (move.power ?? 0) * (types.includes(move.typeId) ? 1.5 : 1)
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }
  return best
}

export default function DamageCalculator() {
  const dex = useDex()
  const [params, setParams] = useSearchParams()

  const attacker = dex.bySlug.get(params.get('atk') ?? '') ?? dex.bySlug.get(DEFAULT_ATTACKER) ?? dex.entries[0]
  const defender = dex.bySlug.get(params.get('def') ?? '') ?? dex.bySlug.get(DEFAULT_DEFENDER) ?? dex.entries[0]
  const moveSlug = params.get('move')

  const [offense, setOffense] = useState<OffenseConfig>(INITIAL_OFFENSE)
  const [defense, setDefense] = useState<DefenseConfig>(INITIAL_DEFENSE)
  const [allMoves, setAllMoves] = useState(false)
  const [critical, setCritical] = useState(false)
  const [burned, setBurned] = useState(false)
  const [weather, setWeather] = useState<WeatherKey>('none')
  const [screen, setScreen] = useState<ScreenKey>('none')
  const [spread, setSpread] = useState(false)
  const [other, setOther] = useState(1)
  const [powerOverride, setPowerOverride] = useState<number | null>(null)

  const moveIndex = useAsync('moves-index', () => load.moveIndex())
  const abilityIndex = useAsync('abilities-index', () => load.abilityIndex())
  const attackerDetail = useAsync(`pokemon/${attacker.id}`, () => load.pokemon(attacker.id))

  const abilityById = useMemo(() => {
    const map = new Map<number, { name: string; label: string }>()
    for (const entry of abilityIndex.data?.entries ?? []) map.set(entry.id, entry)
    return map
  }, [abilityIndex.data])

  const learnsetIds = useMemo(() => {
    if (!attackerDetail.data) return null
    const ids = new Set<number>()
    for (const tuple of attackerDetail.data.moves) ids.add(tuple[0])
    return ids
  }, [attackerDetail.data])

  const availableMoves = useMemo(() => {
    const damaging = (moveIndex.data?.entries ?? []).filter(
      (entry) => entry.damageClassId !== DAMAGE_CLASS.status,
    )
    if (allMoves || !learnsetIds) return damaging
    return damaging.filter((entry) => learnsetIds.has(entry.id))
  }, [moveIndex.data, allMoves, learnsetIds])

  const move = useMemo(
    () => availableMoves.find((entry) => entry.name === moveSlug) ?? null,
    [availableMoves, moveSlug],
  )

  useEffect(() => {
    setOffense((current) => ({ ...current, abilityId: attacker.abilities[0]?.id ?? null }))
  }, [attacker])

  useEffect(() => {
    setDefense((current) => ({ ...current, abilityId: defender.abilities[0]?.id ?? null }))
  }, [defender])

  const poolSettled = learnsetIds !== null || allMoves || attackerDetail.error !== undefined

  useEffect(() => {
    if (move || !poolSettled || availableMoves.length === 0) return
    const fallback = bestMove(availableMoves, attacker.types)
    if (!fallback) return
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('move', fallback.name)
        return next
      },
      { replace: true },
    )
  }, [move, poolSettled, availableMoves, attacker.types, setParams])

  useEffect(() => setPowerOverride(null), [move?.id])

  const attackerAbility = offense.abilityId === null ? null : abilityById.get(offense.abilityId)
  const defenderAbility = defense.abilityId === null ? null : abilityById.get(defense.abilityId)
  const item = ATTACK_ITEMS.find((option) => option.slug === offense.itemSlug) ?? ATTACK_ITEMS[0]

  const setParam = (key: string, value: string, drop?: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    if (drop) next.delete(drop)
    setParams(next, { replace: true })
  }

  const analysis = useMemo(() => {
    if (!move) return null

    const physical = move.damageClassId === DAMAGE_CLASS.physical
    const offenseIndex = physical ? 1 : 3
    const defenseIndex = physical ? 2 : 4
    const offenseStatId = physical ? STAT_IDS.attack : STAT_IDS.specialAttack
    const defenseStatId = physical ? STAT_IDS.defense : STAT_IDS.specialDefense

    const offenseNature = dex.meta.natures.find((nature) => nature.id === offense.natureId) ?? null
    const defenseNature = dex.meta.natures.find((nature) => nature.id === defense.natureId) ?? null

    const rawAttack = computeStat({
      base: attacker.stats[offenseIndex],
      iv: offense.iv,
      ev: offense.ev,
      level: offense.level,
      natureMultiplier: natureMultiplier(
        offenseStatId,
        offenseNature?.increasedStatId ?? null,
        offenseNature?.decreasedStatId ?? null,
      ),
    })
    const rawDefense = computeStat({
      base: defender.stats[defenseIndex],
      iv: defense.iv,
      ev: defense.ev,
      level: defense.level,
      natureMultiplier: natureMultiplier(
        defenseStatId,
        defenseNature?.increasedStatId ?? null,
        defenseNature?.decreasedStatId ?? null,
      ),
    })

    const attack = applyStage(rawAttack, effectiveStage(offense.stage, 'offense', critical))
    const defence = Math.max(1, applyStage(rawDefense, effectiveStage(defense.stage, 'defense', critical)))
    const hp = computeHp({
      base: defender.stats[0],
      iv: defense.hpIv,
      ev: defense.hpEv,
      level: defense.level,
    })

    const profile = applyDefensiveAbility(
      defenseProfile(dex.meta.typeChart, defender.types),
      defenderAbility?.name ?? null,
    )
    const typeEffectiveness = profile.byType[move.typeId] ?? 1
    const stab = attacker.types.includes(move.typeId)
      ? attackerAbility?.name === 'adaptability'
        ? 2
        : 1.5
      : 1

    const itemMultiplier = item.multiplier({ damageClassId: move.damageClassId, typeEffectiveness })
    const weatherFactor = weatherMultiplier(weather, move.typeId)
    const screenFactor = screenMultiplier(screen, move.damageClassId, critical)
    const burnApplies = burned && physical
    const power = powerOverride ?? move.power ?? 0

    const damage = calculateDamage({
      level: offense.level,
      power,
      attack,
      defense: defence,
      stab,
      typeEffectiveness,
      critical,
      burned: burnApplies,
      weather: weatherFactor,
      screen: screenFactor,
      other: other * itemMultiplier,
      targets: spread ? 0.75 : 1,
    })

    const outcomes = koChances(damage.rolls, hp, MAX_MODELLED_HITS)

    return {
      physical,
      power,
      attack,
      rawAttack,
      defence,
      rawDefense,
      hp,
      typeEffectiveness,
      stab,
      itemMultiplier,
      weatherFactor,
      screenFactor,
      burnApplies,
      damage,
      outcomes,
      verdict: koVerdict(outcomes, MAX_MODELLED_HITS),
      minPercent: (damage.min / hp) * 100,
      maxPercent: (damage.max / hp) * 100,
      minHitsToKo: damage.max > 0 ? Math.ceil(hp / damage.max) : Infinity,
      maxHitsToKo: damage.min > 0 ? Math.ceil(hp / damage.min) : Infinity,
      offenseStatIndex: offenseIndex,
      defenseStatIndex: defenseIndex,
    }
  }, [
    move,
    attacker,
    defender,
    offense,
    defense,
    critical,
    burned,
    weather,
    screen,
    spread,
    other,
    item,
    attackerAbility,
    defenderAbility,
    powerOverride,
    dex.meta.natures,
    dex.meta.typeChart,
  ])

  const swap = () => {
    const next = new URLSearchParams(params)
    next.set('atk', defender.name)
    next.set('def', attacker.name)
    next.delete('move')
    setParams(next, { replace: true })
    setOffense((current) => ({ ...current, level: defense.level }))
    setDefense((current) => ({ ...current, level: offense.level }))
  }

  const reset = () => {
    setOffense({ ...INITIAL_OFFENSE, abilityId: attacker.abilities[0]?.id ?? null })
    setDefense({ ...INITIAL_DEFENSE, abilityId: defender.abilities[0]?.id ?? null })
    setCritical(false)
    setBurned(false)
    setWeather('none')
    setScreen('none')
    setSpread(false)
    setOther(1)
    setPowerOverride(null)
  }

  const accent = `var(--type-${typeSlug(move?.typeId ?? attacker.types[0] ?? 1)})`

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow="Battle maths"
        title="Damage Calculator"
        subtitle="The Generation V–IX damage formula, rolled sixteen ways. Every modifier is applied in the order the cartridge applies it."
        actions={
          <>
            <Button onClick={swap} variant="soft">
              Swap sides
            </Button>
            <Button onClick={reset} variant="ghost">
              Reset
            </Button>
          </>
        }
      />

      {moveIndex.error && <ErrorState message={moveIndex.error.message} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel>
          <SectionTitle eyebrow="Attacker">{attacker.label}</SectionTitle>
          <div className="space-y-3">
            <PokemonPicker
              label="Attacking Pokémon"
              value={attacker}
              onSelect={(entry) => setParam('atk', entry.name, 'move')}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <MicroLabel>
                Move pool ·{' '}
                <span className="text-dim">
                  {allMoves
                    ? `${availableMoves.length} damaging moves`
                    : attackerDetail.error
                      ? 'learnset unavailable'
                      : learnsetIds
                        ? `${availableMoves.length} learnable`
                        : 'loading'}
                </span>
              </MicroLabel>
              <Segmented
                size="sm"
                value={allMoves ? 'all' : 'learnset'}
                onChange={(value) => setAllMoves(value === 'all')}
                options={[
                  { value: 'learnset', label: 'Learnset' },
                  { value: 'all', label: 'All moves' },
                ]}
              />
            </div>

            <MovePicker
              label="Move"
              moves={availableMoves}
              value={move}
              onSelect={(entry) => setParam('move', entry.name)}
              disabled={moveIndex.loading}
              emptyHint={moveIndex.loading ? 'Loading moves…' : 'No damaging moves'}
            />

            {move && (
              <div className="flex flex-wrap items-center gap-2 rounded-chip border border-line-soft bg-surface px-2.5 py-2">
                <TypeBadge typeId={move.typeId} label={dex.typeById.get(move.typeId)?.label ?? ''} size="xs" />
                <span className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
                  {DAMAGE_CLASS_SHORT[move.damageClassId]}
                </span>
                <span className="numeric text-[11px] text-dim">Acc {move.accuracy ?? '—'}</span>
                <span className="numeric text-[11px] text-dim">PP {move.pp ?? '—'}</span>
                {move.priority !== 0 && (
                  <span className="numeric text-[11px] text-accent">
                    Priority {move.priority > 0 ? `+${move.priority}` : move.priority}
                  </span>
                )}
                <Link
                  to={`/moves/${move.name}`}
                  className="numeric ml-auto text-[11px] text-dim underline-offset-2 hover:text-ink hover:underline"
                >
                  Move page →
                </Link>
              </div>
            )}

            {move?.minHits && move.maxHits ? (
              <p className="rounded-chip border border-line-soft bg-surface px-2.5 py-2 text-[11px] leading-snug text-dim">
                Multi-strike move: hits {move.minHits}–{move.maxHits} times. Every figure below is{' '}
                <strong className="text-ink">per hit</strong> — read the KO table in hits, not turns.
              </p>
            ) : null}

            {move && move.power === null && (
              <p className="rounded-chip border border-[color-mix(in_oklab,var(--type-electric)_35%,transparent)] bg-[color-mix(in_oklab,var(--type-electric)_10%,transparent)] px-2.5 py-2 text-[11px] leading-snug text-dim">
                {move.label} has variable or fixed power the formula cannot infer. Set a base power below to
                model it.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <NumberField
                label="Level"
                min={1}
                max={100}
                value={offense.level}
                onChange={(value) => setOffense((current) => ({ ...current, level: value }))}
              />
              <NumberField
                label="Base power"
                min={0}
                max={300}
                value={analysis?.power ?? move?.power ?? 0}
                onChange={setPowerOverride}
                hint={powerOverride !== null ? 'Overridden' : undefined}
              />
              <NatureSelect
                value={offense.natureId}
                onChange={(value) => setOffense((current) => ({ ...current, natureId: value }))}
              />
              <AbilitySelect
                label="Ability"
                entry={attacker}
                value={offense.abilityId}
                loading={abilityIndex.loading}
                abilityById={abilityById}
                onChange={(value) => setOffense((current) => ({ ...current, abilityId: value }))}
                hint={attackerAbility?.name === 'adaptability' ? 'STAB becomes ×2' : undefined}
                className="col-span-2 sm:col-span-1"
              />
              <ItemSelect
                value={offense.itemSlug}
                onChange={(value) => setOffense((current) => ({ ...current, itemSlug: value }))}
                className="col-span-2 sm:col-span-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-4">
              <Readout
                label={analysis?.physical === false ? 'Base Sp. Atk' : 'Base Attack'}
                value={attacker.stats[analysis?.offenseStatIndex ?? 1]}
              />
              <NumberField
                label="IV"
                min={0}
                max={31}
                value={offense.iv}
                onChange={(value) => setOffense((current) => ({ ...current, iv: value }))}
              />
              <NumberField
                label="EV"
                min={0}
                max={252}
                step={4}
                value={offense.ev}
                onChange={(value) => setOffense((current) => ({ ...current, ev: value }))}
              />
              <Readout label="Final stat" value={analysis?.attack ?? '—'} tone="accent" />
            </div>

            <StageField
              label={analysis?.physical === false ? 'Sp. Atk stage' : 'Attack stage'}
              value={offense.stage}
              onChange={(value) => setOffense((current) => ({ ...current, stage: value }))}
            />
          </div>
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Defender">{defender.label}</SectionTitle>
          <div className="space-y-3">
            <PokemonPicker
              label="Defending Pokémon"
              value={defender}
              onSelect={(entry) => setParam('def', entry.name)}
            />

            <div className="flex flex-wrap items-center gap-2 rounded-chip border border-line-soft bg-surface px-2.5 py-2">
              {defender.types.map((typeId) => (
                <TypeBadge key={typeId} typeId={typeId} label={dex.typeById.get(typeId)?.label ?? ''} size="xs" />
              ))}
              <span className="numeric text-[11px] text-faint">{formatDex(defender.dex)}</span>
              <Link
                to={`/pokemon/${defender.name}`}
                className="numeric ml-auto text-[11px] text-dim underline-offset-2 hover:text-ink hover:underline"
              >
                Dex entry →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <NumberField
                label="Level"
                min={1}
                max={100}
                value={defense.level}
                onChange={(value) => setDefense((current) => ({ ...current, level: value }))}
              />
              <NatureSelect
                value={defense.natureId}
                onChange={(value) => setDefense((current) => ({ ...current, natureId: value }))}
              />
              <AbilitySelect
                label="Ability"
                entry={defender}
                value={defense.abilityId}
                loading={abilityIndex.loading}
                abilityById={abilityById}
                onChange={(value) => setDefense((current) => ({ ...current, abilityId: value }))}
                hint={
                  defenderAbility && hasDefensiveAbilityEffect(defenderAbility.name)
                    ? 'Rewrites type effectiveness'
                    : undefined
                }
                className="col-span-2 sm:col-span-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-4">
              <Readout label="Base HP" value={defender.stats[0]} />
              <NumberField
                label="HP IV"
                min={0}
                max={31}
                value={defense.hpIv}
                onChange={(value) => setDefense((current) => ({ ...current, hpIv: value }))}
              />
              <NumberField
                label="HP EV"
                min={0}
                max={252}
                step={4}
                value={defense.hpEv}
                onChange={(value) => setDefense((current) => ({ ...current, hpEv: value }))}
              />
              <Readout label="Max HP" value={analysis?.hp ?? '—'} tone="accent" />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-4">
              <Readout
                label={analysis?.physical === false ? 'Base Sp. Def' : 'Base Defense'}
                value={defender.stats[analysis?.defenseStatIndex ?? 2]}
              />
              <NumberField
                label="IV"
                min={0}
                max={31}
                value={defense.iv}
                onChange={(value) => setDefense((current) => ({ ...current, iv: value }))}
              />
              <NumberField
                label="EV"
                min={0}
                max={252}
                step={4}
                value={defense.ev}
                onChange={(value) => setDefense((current) => ({ ...current, ev: value }))}
              />
              <Readout label="Final stat" value={analysis?.defence ?? '—'} tone="accent" />
            </div>

            <StageField
              label={analysis?.physical === false ? 'Sp. Def stage' : 'Defense stage'}
              value={defense.stage}
              onChange={(value) => setDefense((current) => ({ ...current, stage: value }))}
            />
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <SectionTitle eyebrow="Field">Battle modifiers</SectionTitle>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <Toggle checked={critical} onChange={setCritical} label="Critical hit" hint="×1.5, ignores screens" />
            <Toggle
              checked={burned}
              onChange={setBurned}
              label="Attacker burned"
              hint={
                analysis?.physical === false ? 'Special moves are unaffected' : 'Halves physical damage'
              }
            />
          </div>
          <div className="space-y-2">
            <div>
              <MicroLabel className="mb-1">Weather</MicroLabel>
              <Segmented value={weather} onChange={setWeather} options={WEATHER_OPTIONS} size="sm" />
            </div>
            <div>
              <MicroLabel className="mb-1">Screens</MicroLabel>
              <Segmented value={screen} onChange={setScreen} options={SCREEN_OPTIONS} size="sm" />
            </div>
          </div>
          <div>
            <MicroLabel className="mb-1">Targets</MicroLabel>
            <Segmented
              value={spread ? 'double' : 'single'}
              onChange={(value) => setSpread(value === 'double')}
              options={[
                { value: 'single', label: 'Single' },
                { value: 'double', label: 'Spread ×0.75' },
              ]}
              size="sm"
            />
          </div>
          <NumberField
            label="Other multiplier"
            min={0}
            max={8}
            step={0.05}
            value={other}
            onChange={setOther}
            hint="Anything unmodelled: Helping Hand, terrain, offensive abilities."
          />
        </div>
      </Panel>

      {!move ? (
        moveIndex.loading || attackerDetail.loading ? (
          <InlineLoader label="Loading move data" />
        ) : (
          <Panel className="mt-4">
            <p className="text-sm text-dim">Pick a damaging move to run the calculation.</p>
          </Panel>
        )
      ) : (
        analysis && (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel>
              <SectionTitle eyebrow="Result">
                {attacker.label} · {move.label} → {defender.label}
              </SectionTitle>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-plate border border-line bg-surface p-3">
                  <MicroLabel>Damage</MicroLabel>
                  <p className="numeric mt-1 text-2xl font-bold leading-none text-accent">
                    {analysis.damage.min}–{analysis.damage.max}
                  </p>
                  <p className="numeric mt-1 text-[11px] text-dim">of {analysis.hp} HP</p>
                </div>
                <div className="rounded-plate border border-line bg-surface p-3">
                  <MicroLabel>Percentage</MicroLabel>
                  <p className="numeric mt-1 text-2xl font-bold leading-none">
                    {analysis.minPercent.toFixed(1)}–{analysis.maxPercent.toFixed(1)}%
                  </p>
                  <p className="numeric mt-1 text-[11px] text-dim">
                    {Number.isFinite(analysis.minHitsToKo)
                      ? `${analysis.minHitsToKo}–${Number.isFinite(analysis.maxHitsToKo) ? analysis.maxHitsToKo : '∞'} hits to KO`
                      : 'Never KOs'}
                  </p>
                </div>
                <div className="rounded-plate border border-line bg-surface p-3">
                  <MicroLabel>Outcome</MicroLabel>
                  <p className="numeric mt-1 text-[15px] font-bold leading-tight">{analysis.verdict.headline}</p>
                  {analysis.verdict.detail && (
                    <p className="numeric mt-1 text-[11px] text-dim">{analysis.verdict.detail}</p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <RollSpread rolls={analysis.damage.rolls} hp={analysis.hp} />
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-line-soft pt-4">
                <MatchupSprite entry={attacker} />
                <p className="numeric min-w-0 flex-1 text-[11px] leading-relaxed text-dim">
                  <span
                    className={cx(
                      'font-semibold',
                      analysis.typeEffectiveness > 1 && 'text-[var(--type-grass)]',
                      analysis.typeEffectiveness < 1 && 'text-[var(--type-fighting)]',
                    )}
                  >
                    {effectivenessLabel(analysis.typeEffectiveness)}
                  </span>{' '}
                  effective · STAB {analysis.stab === 1 ? 'none' : formatMultiplier(analysis.stab)}
                  {defenderAbility && hasDefensiveAbilityEffect(defenderAbility.name)
                    ? ` · ${defenderAbility.label} applied`
                    : ''}
                </p>
                <MatchupSprite entry={defender} />
              </div>
            </Panel>

            <div className="grid min-w-0 grid-cols-1 gap-4">
              <Panel>
                <SectionTitle eyebrow="Chain">Multiplier breakdown</SectionTitle>
                <dl className="space-y-1.5">
                  <BreakdownRow label="Base power" value={String(analysis.power)} />
                  <BreakdownRow
                    label={analysis.physical ? 'Attack' : 'Sp. Atk'}
                    value={`${analysis.rawAttack} → ${analysis.attack}`}
                  />
                  <BreakdownRow
                    label={analysis.physical ? 'Defense' : 'Sp. Def'}
                    value={`${analysis.rawDefense} → ${analysis.defence}`}
                  />
                  <BreakdownRow
                    label="Type effectiveness"
                    value={effectivenessLabel(analysis.typeEffectiveness)}
                    tone={
                      analysis.typeEffectiveness > 1 ? 'good' : analysis.typeEffectiveness < 1 ? 'bad' : undefined
                    }
                  />
                  <BreakdownRow label="STAB" value={formatMultiplier(analysis.stab)} />
                  <BreakdownRow label="Weather" value={formatMultiplier(analysis.weatherFactor)} />
                  <BreakdownRow label="Screen" value={formatMultiplier(analysis.screenFactor)} />
                  <BreakdownRow label="Critical" value={critical ? '×1.5' : '×1'} />
                  <BreakdownRow label="Burn" value={analysis.burnApplies ? '÷2' : '×1'} />
                  <BreakdownRow label="Spread" value={spread ? '×0.75' : '×1'} />
                  <BreakdownRow
                    label={item.slug ? item.label : 'Held item'}
                    value={formatMultiplier(analysis.itemMultiplier)}
                  />
                  <BreakdownRow label="Other" value={formatMultiplier(other)} />
                </dl>
              </Panel>

              <Panel>
                <SectionTitle eyebrow="Probability">KO chance by hit</SectionTitle>
                {analysis.outcomes.length === 0 ? (
                  <p className="text-sm text-dim">This move cannot knock the target out.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {analysis.outcomes.map((outcome) => (
                      <li key={outcome.hits} className="grid grid-cols-[34px_1fr_58px] items-center gap-2">
                        <span className="numeric text-[11px] text-faint">{outcome.hits}×</span>
                        <span className="relative h-2 overflow-hidden rounded-full bg-raised">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-accent"
                            style={{ width: `${outcome.chance * 100}%` }}
                          />
                        </span>
                        <span className="numeric text-right text-[11px] text-dim">
                          {(outcome.chance * 100).toFixed(outcome.chance > 0 && outcome.chance < 0.01 ? 3 : 1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[11px] leading-relaxed text-faint">
                  Each hit rolls one of sixteen equally likely damage values. These odds convolve the whole
                  distribution instead of assuming an average roll.
                </p>
              </Panel>
            </div>
          </div>
        )
      )}
    </div>
  )
}

function MatchupSprite({ entry }: { entry: PokemonIndexEntry }) {
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)
  return (
    <Sprite
      sources={spriteSources(entry.id, spriteStyle, shiny)}
      alt={entry.label}
      className="h-12 w-12 shrink-0"
      pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
    />
  )
}

function BreakdownRow({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line-soft pb-1.5 last:border-0">
      <dt className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd
        className={cx(
          'numeric text-[12px] font-semibold',
          tone === 'good' && 'text-[var(--type-grass)]',
          tone === 'bad' && 'text-[var(--type-fighting)]',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function NatureSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const dex = useDex()
  const id = useId()
  return (
    <Field label="Nature" htmlFor={id}>
      <Select id={id} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full">
        {dex.meta.natures.map((nature) => (
          <option key={nature.id} value={nature.id}>
            {nature.label}
            {nature.increasedStatId === nature.decreasedStatId
              ? ' · neutral'
              : ` · +${dex.nameOf('stats', nature.increasedStatId)} −${dex.nameOf('stats', nature.decreasedStatId)}`}
          </option>
        ))}
      </Select>
    </Field>
  )
}

function AbilitySelect({
  label,
  entry,
  value,
  onChange,
  abilityById,
  loading,
  hint,
  className,
}: {
  label: string
  entry: PokemonIndexEntry
  value: number | null
  onChange: (value: number | null) => void
  abilityById: Map<number, { name: string; label: string }>
  loading: boolean
  hint?: string
  className?: string
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} hint={hint} className={className}>
      <Select
        id={id}
        value={value ?? ''}
        disabled={loading}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
        className="w-full"
      >
        <option value="">{loading ? 'Loading…' : 'None'}</option>
        {entry.abilities.map((ability) => (
          <option key={`${ability.id}-${ability.slot}`} value={ability.id}>
            {abilityById.get(ability.id)?.label ?? `Ability ${ability.id}`}
            {ability.hidden ? ' (hidden)' : ''}
          </option>
        ))}
      </Select>
    </Field>
  )
}

function ItemSelect({
  value,
  onChange,
  className,
}: {
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}) {
  const id = useId()
  const option = ATTACK_ITEMS.find((item) => item.slug === value) ?? ATTACK_ITEMS[0]
  return (
    <Field label="Held item" htmlFor={id} hint={option.note} className={className}>
      <div className="flex items-center gap-2">
        {option.slug && <Sprite sources={[itemSprite(option.slug)]} alt="" className="h-7 w-7 shrink-0" pixelated />}
        <Select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
          className="min-w-0 flex-1"
        >
          {ATTACK_ITEMS.map((item) => (
            <option key={item.label} value={item.slug ?? ''}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
    </Field>
  )
}
