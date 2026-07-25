import { emptySlot } from '@/lib/store'
import type { TeamSlot } from '@/lib/store'
import { EV_STAT_CAP, IV_CAP, clamp, clampLevel } from './analysis'

export const TEAM_SIZE = 6
export const TEAM_PARAM = 't'

type EncodedSlot = [
  number,
  number,
  number,
  number,
  number,
  number[],
  number[],
  number[],
  number,
  string,
]

export interface TeamLabels {
  pokemon: (id: number) => string | undefined
  nature: (id: number) => string | undefined
  ability: (id: number) => string | undefined
  item: (id: number) => string | undefined
  move: (id: number) => string | undefined
  pokemonIdBySlug: (slug: string) => number | undefined
}

export function emptyTeam(): (TeamSlot | null)[] {
  return new Array(TEAM_SIZE).fill(null) as (TeamSlot | null)[]
}

/// Packs the roster into a URL-safe base64 payload of positional tuples, nulls collapsing to `0`.
export function encodeTeam(team: (TeamSlot | null)[]): string {
  const payload = normalizeTeam(team).map((slot): EncodedSlot | 0 => {
    if (!slot) return 0
    return [
      slot.pokemonId,
      clampLevel(slot.level),
      slot.natureId ?? 0,
      slot.abilityId ?? 0,
      slot.itemId ?? 0,
      slot.moveIds.map((id) => id ?? 0),
      slot.ivs.map((value) => clamp(value, 0, IV_CAP)),
      slot.evs.map((value) => clamp(value, 0, EV_STAT_CAP)),
      slot.shiny ? 1 : 0,
      slot.nickname ?? '',
    ]
  })
  return toBase64Url(JSON.stringify(payload))
}

export function decodeTeam(code: string): (TeamSlot | null)[] | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(code))
    if (!Array.isArray(parsed)) return null
    const team = emptyTeam()
    parsed.slice(0, TEAM_SIZE).forEach((raw, index) => {
      team[index] = readEncodedSlot(raw)
    })
    return team
  } catch {
    return null
  }
}

function readEncodedSlot(raw: unknown): TeamSlot | null {
  if (!Array.isArray(raw)) return null
  const pokemonId = numberAt(raw, 0)
  if (!pokemonId) return null
  const slot = emptySlot(pokemonId)
  slot.level = clampLevel(numberAt(raw, 1) || 50)
  slot.natureId = optionalId(numberAt(raw, 2))
  slot.abilityId = optionalId(numberAt(raw, 3))
  slot.itemId = optionalId(numberAt(raw, 4))
  slot.moveIds = readMoveIds(raw[5])
  slot.ivs = readStatArray(raw[6], IV_CAP, IV_CAP)
  slot.evs = readStatArray(raw[7], 0, EV_STAT_CAP)
  slot.shiny = numberAt(raw, 8) === 1
  slot.nickname = typeof raw[9] === 'string' && raw[9].length > 0 ? raw[9].slice(0, 24) : null
  return slot
}

export interface TeamJsonSlot {
  pokemon: string
  pokemonId: number
  nickname: string | null
  level: number
  nature: string | null
  natureId: number | null
  ability: string | null
  abilityId: number | null
  item: string | null
  itemId: number | null
  moves: (string | null)[]
  moveIds: (number | null)[]
  ivs: number[]
  evs: number[]
  shiny: boolean
}

export function teamToJson(team: (TeamSlot | null)[], labels: TeamLabels): string {
  const slots = normalizeTeam(team)
    .filter((slot): slot is TeamSlot => slot !== null)
    .map((slot): TeamJsonSlot => ({
      pokemon: labels.pokemon(slot.pokemonId) ?? `#${slot.pokemonId}`,
      pokemonId: slot.pokemonId,
      nickname: slot.nickname,
      level: clampLevel(slot.level),
      nature: slot.natureId === null ? null : (labels.nature(slot.natureId) ?? null),
      natureId: slot.natureId,
      ability: slot.abilityId === null ? null : (labels.ability(slot.abilityId) ?? null),
      abilityId: slot.abilityId,
      item: slot.itemId === null ? null : (labels.item(slot.itemId) ?? null),
      itemId: slot.itemId,
      moves: slot.moveIds.map((id) => (id === null ? null : (labels.move(id) ?? null))),
      moveIds: slot.moveIds,
      ivs: slot.ivs,
      evs: slot.evs,
      shiny: slot.shiny,
    }))
  return JSON.stringify({ format: 'pokedex-ultracode-team', version: 1, slots }, null, 2)
}

export function teamFromJson(text: string, labels: TeamLabels): (TeamSlot | null)[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  const rawSlots = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.slots)
      ? parsed.slots
      : null
  if (!rawSlots) return null

  const team = emptyTeam()
  let cursor = 0
  for (const raw of rawSlots) {
    if (cursor >= TEAM_SIZE) break
    const slot = readJsonSlot(raw, labels)
    if (!slot) continue
    team[cursor] = slot
    cursor += 1
  }
  return team.some((slot) => slot !== null) ? team : null
}

function readJsonSlot(raw: unknown, labels: TeamLabels): TeamSlot | null {
  if (!isRecord(raw)) return null
  const byId = typeof raw.pokemonId === 'number' ? raw.pokemonId : 0
  const bySlug = typeof raw.pokemon === 'string' ? (labels.pokemonIdBySlug(raw.pokemon) ?? 0) : 0
  const pokemonId = byId || bySlug
  if (!pokemonId) return null

  const slot = emptySlot(pokemonId)
  if (typeof raw.level === 'number') slot.level = clampLevel(raw.level)
  slot.natureId = optionalId(typeof raw.natureId === 'number' ? raw.natureId : 0)
  slot.abilityId = optionalId(typeof raw.abilityId === 'number' ? raw.abilityId : 0)
  slot.itemId = optionalId(typeof raw.itemId === 'number' ? raw.itemId : 0)
  slot.moveIds = readMoveIds(raw.moveIds)
  slot.ivs = readStatArray(raw.ivs, IV_CAP, IV_CAP)
  slot.evs = readStatArray(raw.evs, 0, EV_STAT_CAP)
  slot.shiny = raw.shiny === true
  slot.nickname = typeof raw.nickname === 'string' && raw.nickname.length > 0 ? raw.nickname.slice(0, 24) : null
  return slot
}

/// Pads or trims a persisted roster to exactly six positional slots.
export function normalizeTeam(team: (TeamSlot | null)[]): (TeamSlot | null)[] {
  const result = emptyTeam()
  for (let index = 0; index < TEAM_SIZE; index += 1) {
    result[index] = team[index] ?? null
  }
  return result
}

function readMoveIds(raw: unknown): (number | null)[] {
  const source = Array.isArray(raw) ? raw : []
  return [0, 1, 2, 3].map((index) => {
    const value = source[index]
    return typeof value === 'number' && value > 0 ? Math.round(value) : null
  })
}

function readStatArray(raw: unknown, fallback: number, max: number): [number, number, number, number, number, number] {
  const source = Array.isArray(raw) ? raw : []
  const values = [0, 1, 2, 3, 4, 5].map((index) => {
    const value = source[index]
    return typeof value === 'number' ? clamp(value, 0, max) : fallback
  })
  return values as [number, number, number, number, number, number]
}

function numberAt(raw: unknown[], index: number): number {
  const value = raw[index]
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0
}

function optionalId(value: number): number | null {
  return value > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const normalized = code.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new TextDecoder().decode(bytes)
}
