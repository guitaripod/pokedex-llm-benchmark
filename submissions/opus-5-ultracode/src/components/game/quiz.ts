import type { FlavorTuple, PokemonIndexEntry } from '@/types/data'

export type QuizMode = 'silhouette' | 'cry' | 'dex'
export type QuizCategory = 'all' | 'starters' | 'legendary'
export type RoundStatus = 'guessing' | 'correct' | 'wrong' | 'skipped'
export type RoundOutcome = Exclude<RoundStatus, 'guessing'>

export const MAX_HINTS = 3
export const HINT_COST = 20
export const BASE_POINTS = 100

export const MODE_LABEL: Record<QuizMode, string> = {
  silhouette: 'Silhouette',
  cry: 'Cry',
  dex: 'Dex entry',
}

export const MODE_HINT: Record<QuizMode, string> = {
  silhouette: 'Name the shape before the light comes back on.',
  cry: 'Audio only — no shape, no text, just the call.',
  dex: 'A pokédex entry with every mention of the name blacked out.',
}

export const OUTCOME_COLOR: Record<RoundOutcome, string> = {
  correct: 'var(--type-grass)',
  wrong: 'var(--type-fighting)',
  skipped: 'var(--type-normal)',
}

export const OUTCOME_LABEL: Record<RoundOutcome, string> = {
  correct: 'Correct',
  wrong: 'Missed',
  skipped: 'Skipped',
}

/** National species ids of every first-partner Pokémon, generations I–IX. */
const STARTER_SPECIES_IDS = new Set([
  1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728,
  810, 813, 816, 906, 909, 912,
])

export interface PoolOptions {
  /** 0 selects every generation. */
  generation: number
  category: QuizCategory
  includeForms: boolean
}

/// Expands the hardcoded first-partner species into their complete evolution families.
function starterChainIds(entries: PokemonIndexEntry[]): Set<number> {
  const chains = new Set<number>()
  for (const entry of entries) {
    if (STARTER_SPECIES_IDS.has(entry.speciesId) && entry.evolutionChainId !== null) {
      chains.add(entry.evolutionChainId)
    }
  }
  return chains
}

export function buildPool(entries: PokemonIndexEntry[], options: PoolOptions): PokemonIndexEntry[] {
  const chains = options.category === 'starters' ? starterChainIds(entries) : null
  return entries.filter((entry) => {
    if (!options.includeForms && !entry.isDefault) return false
    if (options.generation !== 0 && entry.generation !== options.generation) return false
    if (options.category === 'legendary' && !entry.isLegendary && !entry.isMythical) return false
    if (chains && (entry.evolutionChainId === null || !chains.has(entry.evolutionChainId))) return false
    return true
  })
}

/// Draws an unseen target when one is left, otherwise falls back to the whole pool.
export function pickTarget(pool: PokemonIndexEntry[], seen: Set<number>): PokemonIndexEntry | null {
  if (pool.length === 0) return null
  const fresh = pool.filter((entry) => !seen.has(entry.id))
  const source = fresh.length > 0 ? fresh : pool
  return source[Math.floor(Math.random() * source.length)]
}

/* ------------------------------------------------------------------ answers */

/// Folds accents, gender symbols and punctuation away so free-text guesses compare reliably.
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2640]/g, 'f')
    .replace(/[\u2642]/g, 'm')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function buildAnswerIndex(entries: PokemonIndexEntry[]): Map<string, PokemonIndexEntry> {
  const index = new Map<string, PokemonIndexEntry>()
  for (const entry of entries) {
    for (const candidate of [entry.label, entry.name, entry.names.en]) {
      const key = normalizeAnswer(candidate ?? '')
      if (key && !index.has(key)) index.set(key, entry)
    }
  }
  return index
}

/// Every spelling that counts as naming this target, including its base species for alternate forms.
export function acceptedKeys(entry: PokemonIndexEntry, speciesLabel: string | undefined): Set<string> {
  const keys = new Set<string>()
  for (const candidate of [entry.label, entry.name, entry.names.en, speciesLabel]) {
    const key = normalizeAnswer(candidate ?? '')
    if (key) keys.add(key)
  }
  return keys
}

/* --------------------------------------------------------------- suggestions */

export interface SearchEntry {
  entry: PokemonIndexEntry
  key: string
}

export function buildSearchEntries(entries: PokemonIndexEntry[]): SearchEntry[] {
  return entries.map((entry) => ({ entry, key: normalizeAnswer(entry.label) }))
}

/// Counts the characters skipped while matching `query` as a subsequence, or null when it cannot.
function subsequenceGap(key: string, query: string): number | null {
  let cursor = 0
  let gaps = 0
  for (const char of query) {
    const found = key.indexOf(char, cursor)
    if (found === -1) return null
    gaps += found - cursor
    cursor = found + 1
  }
  return gaps
}

/// Lower is better: exact, then prefix, then substring, then a loose subsequence match.
function rank(key: string, query: string): number | null {
  if (key === query) return 0
  if (key.startsWith(query)) return 1 + key.length / 1000
  const at = key.indexOf(query)
  if (at >= 0) return 2 + at / 100 + key.length / 10000
  const gaps = subsequenceGap(key, query)
  return gaps === null ? null : 3 + gaps / 100
}

export function suggest(index: SearchEntry[], query: string, limit: number): PokemonIndexEntry[] {
  const needle = normalizeAnswer(query)
  if (!needle) return []
  const scored: { entry: PokemonIndexEntry; score: number }[] = []
  for (const candidate of index) {
    const score = rank(candidate.key, needle)
    if (score !== null) scored.push({ entry: candidate.entry, score })
  }
  scored.sort((a, b) => a.score - b.score || a.entry.dex - b.entry.dex)
  return scored.slice(0, limit).map((item) => item.entry)
}

/* -------------------------------------------------------------------- hints */

/// Keeps the initial and every separator, replacing the remaining characters with bullets.
export function maskLabel(label: string): string {
  let revealedInitial = false
  let masked = ''
  for (const char of label) {
    if (!/[\p{L}\p{N}]/u.test(char)) {
      masked += char
      continue
    }
    if (!revealedInitial) {
      revealedInitial = true
      masked += char
      continue
    }
    masked += '•'
  }
  return masked
}

/* ------------------------------------------------------------------- scoring */

export interface RoundScore {
  points: number
  speedBonus: number
  hintCost: number
}

/// Awards a flat base, charges for hints and adds a speed bonus that decays to zero at 20 seconds.
export function scoreRound(elapsedMs: number, hints: number): RoundScore {
  const hintCost = hints * HINT_COST
  const speedBonus = Math.max(0, Math.round(50 - elapsedMs / 400))
  return { points: Math.max(10, BASE_POINTS - hintCost + speedBonus), speedBonus, hintCost }
}

/* ------------------------------------------------------------- dex redaction */

export interface FlavorSegment {
  text: string
  redacted: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/// Dex text and species labels disagree about apostrophe glyphs, so both spellings are matched.
function quoteVariants(name: string): string[] {
  return [name, name.replace(/[\u2019]/g, "'"), name.replace(/'/g, '\u2019')]
}

/// Splits flavour text so every mention of the answer can be rendered as a blank.
export function redactNames(text: string, names: (string | null | undefined)[]): FlavorSegment[] {
  const trimmed = names.map((name) => (name ?? '').trim()).filter((name) => name.length >= 3)
  const patterns = [...new Set(trimmed.flatMap(quoteVariants))]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)

  if (patterns.length === 0) return [{ text, redacted: false }]

  const body = patterns.join('|')
  const splitter = new RegExp(`(\\b(?:${body})\\b)`, 'gi')
  const isName = new RegExp(`^(?:${body})$`, 'i')

  return text
    .split(splitter)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, redacted: isName.test(part) }))
}

/// Chooses one stable dex entry per round from the de-duplicated flavour text.
export function pickFlavor(flavorText: FlavorTuple[], seed: number): FlavorTuple | null {
  const seen = new Set<string>()
  const unique: FlavorTuple[] = []
  for (const tuple of flavorText) {
    const key = tuple[1].trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    unique.push(tuple)
  }
  if (unique.length === 0) return null
  return unique[Math.min(unique.length - 1, Math.floor(seed * unique.length))]
}

/* ------------------------------------------------------------------- records */

const RECORD_KEY = 'pokedex-ultracode:whos-that'

export interface QuizRecord {
  bestStreak: number
  bestScore: number
  rounds: number
  correct: number
}

export const EMPTY_RECORD: QuizRecord = { bestStreak: 0, bestScore: 0, rounds: 0, correct: 0 }

function toCount(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

/// Reads the persisted personal best, tolerating absent or corrupted storage.
export function loadRecord(): QuizRecord {
  try {
    const raw = window.localStorage.getItem(RECORD_KEY)
    if (!raw) return EMPTY_RECORD
    const parsed = JSON.parse(raw) as Partial<QuizRecord>
    return {
      bestStreak: toCount(parsed.bestStreak),
      bestScore: toCount(parsed.bestScore),
      rounds: toCount(parsed.rounds),
      correct: toCount(parsed.correct),
    }
  } catch {
    return EMPTY_RECORD
  }
}

/// Writes the personal best, tolerating storage being unavailable (private mode, quota).
export function saveRecord(record: QuizRecord): void {
  try {
    window.localStorage.setItem(RECORD_KEY, JSON.stringify(record))
  } catch {
    return
  }
}

/* ----------------------------------------------------------------- formatting */

export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export interface HistoryItem {
  round: number
  entry: PokemonIndexEntry
  status: RoundOutcome
  elapsed: number
  points: number
  mode: QuizMode
}
