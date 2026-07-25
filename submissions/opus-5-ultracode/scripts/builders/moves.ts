import type { MoveDetail, MoveIndex, MoveIndexEntry } from '../../src/types/data.ts'
import { loadCsv, num, int, cleanText, localizedNames, ENGLISH } from '../lib/csv.ts'
import { emit, GENERATED_AT, titleize } from '../lib/emit.ts'

interface EffectProse {
  shortEffect: string | null
  effect: string | null
}

interface MetaRow {
  categoryId: number | null
  ailmentId: number | null
  minHits: number | null
  maxHits: number | null
  minTurns: number | null
  maxTurns: number | null
  drain: number
  healing: number
  critRate: number
  ailmentChance: number
  flinchChance: number
  statChance: number
}

type LearnRow = [number, number, number, number]

interface Learnset {
  rows: LearnRow[]
  pokemonCount: number
}

interface Combos {
  useBefore: number[]
  useAfter: number[]
}

const EMPTY_META: MetaRow = {
  categoryId: null,
  ailmentId: null,
  minHits: null,
  maxHits: null,
  minTurns: null,
  maxTurns: null,
  drain: 0,
  healing: 0,
  critRate: 0,
  ailmentChance: 0,
  flinchChance: 0,
  statChance: 0,
}

/// PokéAPI stores effect prose with a literal `$effect_chance` placeholder that the move's own
/// `effect_chance` column fills in; without a chance the raw token is left untouched.
function applyEffectChance(text: string, chance: number | null): string {
  if (chance === null) return text
  return text.replace(/\$effect_chance/g, String(chance))
}

function englishEffects(): Map<number, EffectProse> {
  const map = new Map<number, EffectProse>()
  for (const row of loadCsv('move_effect_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    const shortEffect = cleanText(row.short_effect ?? '')
    const effect = cleanText(row.effect ?? '')
    map.set(int(row.move_effect_id), {
      shortEffect: shortEffect || null,
      effect: effect || null,
    })
  }
  return map
}

function englishLabels(): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv('move_names')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    map.set(int(row.move_id), row.name)
  }
  return map
}

function metaByMove(): Map<number, MetaRow> {
  const map = new Map<number, MetaRow>()
  for (const row of loadCsv('move_meta')) {
    map.set(int(row.move_id), {
      categoryId: num(row.meta_category_id),
      ailmentId: num(row.meta_ailment_id),
      minHits: num(row.min_hits),
      maxHits: num(row.max_hits),
      minTurns: num(row.min_turns),
      maxTurns: num(row.max_turns),
      drain: int(row.drain),
      healing: int(row.healing),
      critRate: int(row.crit_rate),
      ailmentChance: int(row.ailment_chance),
      flinchChance: int(row.flinch_chance),
      statChance: int(row.stat_chance),
    })
  }
  return map
}

function flagsByMove(): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (const row of loadCsv('move_flag_map')) {
    const id = int(row.move_id)
    const list = map.get(id)
    if (list) list.push(int(row.move_flag_id))
    else map.set(id, [int(row.move_flag_id)])
  }
  for (const list of map.values()) list.sort((a, b) => a - b)
  return map
}

function statChangesByMove(): Map<number, { statId: number; change: number }[]> {
  const map = new Map<number, { statId: number; change: number }[]>()
  for (const row of loadCsv('move_meta_stat_changes')) {
    const id = int(row.move_id)
    const entry = { statId: int(row.stat_id), change: int(row.change) }
    const list = map.get(id)
    if (list) list.push(entry)
    else map.set(id, [entry])
  }
  for (const list of map.values()) list.sort((a, b) => a.statId - b.statId)
  return map
}

function machinesByMove(): Map<number, { versionGroupId: number; itemId: number; number: number }[]> {
  const map = new Map<number, { versionGroupId: number; itemId: number; number: number }[]>()
  for (const row of loadCsv('machines')) {
    const id = int(row.move_id)
    const entry = {
      versionGroupId: int(row.version_group_id),
      itemId: int(row.item_id),
      number: int(row.machine_number),
    }
    const list = map.get(id)
    if (list) list.push(entry)
    else map.set(id, [entry])
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.versionGroupId - b.versionGroupId || a.number - b.number || a.itemId - b.itemId)
  }
  return map
}

function flavorByMove(): Map<number, { versionGroupId: number; text: string }[]> {
  const map = new Map<number, { versionGroupId: number; text: string }[]>()
  for (const row of loadCsv('move_flavor_text')) {
    if (int(row.language_id) !== ENGLISH) continue
    const text = cleanText(row.flavor_text ?? '')
    if (!text) continue
    const id = int(row.move_id)
    const entry = { versionGroupId: int(row.version_group_id), text }
    const list = map.get(id)
    if (list) list.push(entry)
    else map.set(id, [entry])
  }
  for (const list of map.values()) list.sort((a, b) => a.versionGroupId - b.versionGroupId)
  return map
}

function changelogByMove(): Map<number, MoveDetail['changelog']> {
  const map = new Map<number, MoveDetail['changelog']>()
  for (const row of loadCsv('move_changelog')) {
    const id = int(row.move_id)
    const entry = {
      versionGroupId: int(row.changed_in_version_group_id),
      typeId: num(row.type_id),
      power: num(row.power),
      pp: num(row.pp),
      accuracy: num(row.accuracy),
      effectChance: num(row.effect_chance),
      effectId: num(row.effect_id),
    }
    const list = map.get(id)
    if (list) list.push(entry)
    else map.set(id, [entry])
  }
  for (const list of map.values()) list.sort((a, b) => a.versionGroupId - b.versionGroupId)
  return map
}

function contestEffects(): Map<number, { appeal: number; jam: number; effect: string | null }> {
  const prose = new Map<number, string>()
  for (const row of loadCsv('contest_effect_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    const text = cleanText(row.effect ?? '') || cleanText(row.flavor_text ?? '')
    if (text) prose.set(int(row.contest_effect_id), text)
  }
  const map = new Map<number, { appeal: number; jam: number; effect: string | null }>()
  for (const row of loadCsv('contest_effects')) {
    const id = int(row.id)
    map.set(id, { appeal: int(row.appeal), jam: int(row.jam), effect: prose.get(id) ?? null })
  }
  return map
}

function superContestEffects(): Map<number, { appeal: number; effect: string | null }> {
  const prose = new Map<number, string>()
  for (const row of loadCsv('super_contest_effect_prose')) {
    if (int(row.local_language_id) !== ENGLISH) continue
    const text = cleanText(row.flavor_text ?? '')
    if (text) prose.set(int(row.super_contest_effect_id), text)
  }
  const map = new Map<number, { appeal: number; effect: string | null }>()
  for (const row of loadCsv('super_contest_effects')) {
    const id = int(row.id)
    map.set(id, { appeal: int(row.appeal), effect: prose.get(id) ?? null })
  }
  return map
}

function addCombo(map: Map<number, { before: Set<number>; after: Set<number> }>, id: number) {
  let entry = map.get(id)
  if (!entry) {
    entry = { before: new Set<number>(), after: new Set<number>() }
    map.set(id, entry)
  }
  return entry
}

/// Merges the normal and super contest combo tables. For a `first_move_id → second_move_id` chain
/// the first move lists the second under `useBefore` (use this move before those) and the second
/// lists the first under `useAfter`, which is how PokéAPI exposes the same two columns.
function combosByMove(): Map<number, Combos> {
  const sets = new Map<number, { before: Set<number>; after: Set<number> }>()
  for (const table of ['contest_combos', 'super_contest_combos']) {
    for (const row of loadCsv(table)) {
      const first = int(row.first_move_id)
      const second = int(row.second_move_id)
      addCombo(sets, first).before.add(second)
      addCombo(sets, second).after.add(first)
    }
  }
  const map = new Map<number, Combos>()
  for (const [id, entry] of sets) {
    map.set(id, {
      useBefore: [...entry.before].sort((a, b) => a - b),
      useAfter: [...entry.after].sort((a, b) => a - b),
    })
  }
  return map
}

function compareLearnRows(a: LearnRow, b: LearnRow): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]
}

/// Groups the 638k-row `pokemon_moves` table by move in a single pass, counting distinct learners
/// off the already-sorted rows so no second lookup structure is needed.
function learnsetsByMove(): Map<number, Learnset> {
  const grouped = new Map<number, LearnRow[]>()
  for (const row of loadCsv('pokemon_moves')) {
    const moveId = int(row.move_id)
    const tuple: LearnRow = [
      int(row.pokemon_id),
      int(row.version_group_id),
      int(row.pokemon_move_method_id),
      int(row.level),
    ]
    const list = grouped.get(moveId)
    if (list) list.push(tuple)
    else grouped.set(moveId, [tuple])
  }
  const map = new Map<number, Learnset>()
  for (const [moveId, rows] of grouped) {
    rows.sort(compareLearnRows)
    let pokemonCount = 0
    let previous = -1
    for (const row of rows) {
      if (row[0] === previous) continue
      previous = row[0]
      pokemonCount++
    }
    map.set(moveId, { rows, pokemonCount })
  }
  return map
}

export function buildMoves(): void {
  const labels = englishLabels()
  const names = localizedNames('move_names', 'move_id')
  const effects = englishEffects()
  const meta = metaByMove()
  const flags = flagsByMove()
  const statChanges = statChangesByMove()
  const machines = machinesByMove()
  const flavor = flavorByMove()
  const changelog = changelogByMove()
  const contest = contestEffects()
  const superContest = superContestEffects()
  const combos = combosByMove()
  const learnsets = learnsetsByMove()

  const entries: MoveIndexEntry[] = []

  const rows = loadCsv('moves')
    .map((row) => ({ id: int(row.id), row }))
    .sort((a, b) => a.id - b.id)

  for (const { id, row } of rows) {
    const effectId = num(row.effect_id)
    const effectChance = num(row.effect_chance)
    const prose = effectId === null ? undefined : effects.get(effectId)
    const shortEffect = prose?.shortEffect ? applyEffectChance(prose.shortEffect, effectChance) : null
    const effect = prose?.effect ? applyEffectChance(prose.effect, effectChance) : null
    const m = meta.get(id) ?? EMPTY_META
    const learnset = learnsets.get(id)
    const contestEffectId = num(row.contest_effect_id)
    const superContestEffectId = num(row.super_contest_effect_id)

    const entry: MoveIndexEntry = {
      id,
      name: row.identifier,
      label: labels.get(id) ?? titleize(row.identifier),
      typeId: int(row.type_id),
      damageClassId: int(row.damage_class_id),
      power: num(row.power),
      pp: num(row.pp),
      accuracy: num(row.accuracy),
      priority: int(row.priority),
      generation: int(row.generation_id),
      targetId: int(row.target_id),
      categoryId: m.categoryId,
      ailmentId: m.ailmentId,
      ailmentChance: m.ailmentChance,
      critRate: m.critRate,
      drain: m.drain,
      healing: m.healing,
      flinchChance: m.flinchChance,
      statChance: m.statChance,
      minHits: m.minHits,
      maxHits: m.maxHits,
      minTurns: m.minTurns,
      maxTurns: m.maxTurns,
      effectChance,
      shortEffect,
      flags: flags.get(id) ?? [],
      contestTypeId: num(row.contest_type_id),
      learnedByCount: learnset?.pokemonCount ?? 0,
      names: names.get(id) ?? {},
    }
    entries.push(entry)

    const detail: MoveDetail = {
      ...entry,
      effect,
      effectId,
      flavorText: flavor.get(id) ?? [],
      statChanges: statChanges.get(id) ?? [],
      machines: machines.get(id) ?? [],
      learnedBy: learnset?.rows ?? [],
      contestEffect: contestEffectId === null ? null : (contest.get(contestEffectId) ?? null),
      superContestEffect:
        superContestEffectId === null ? null : (superContest.get(superContestEffectId) ?? null),
      contestCombos: combos.get(id) ?? { useBefore: [], useAfter: [] },
      changelog: changelog.get(id) ?? [],
    }
    emit(`moves/${id}.json`, detail)
  }

  const index: MoveIndex = { generatedAt: GENERATED_AT, entries }
  emit('moves-index.json', index)
}
