import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const CSV_DIR = join(process.cwd(), 'data-src', 'csv')

export const ENGLISH = 9

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      out.push(field)
      field = ''
    } else field += ch
  }
  out.push(field)
  return out
}

/// Splits raw CSV text into physical rows, honouring newlines that appear inside quoted fields.
function splitRecords(text: string): string[] {
  const records: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      quoted = !quoted
      if (quoted === false && text[i + 1] === '"') {
        quoted = true
        current += '""'
        i++
        continue
      }
      current += ch
    } else if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      records.push(current)
      current = ''
    } else current += ch
  }
  if (current.length) records.push(current)
  return records
}

export type Row = Record<string, string>

const cache = new Map<string, Row[]>()

export function loadCsv(name: string): Row[] {
  const hit = cache.get(name)
  if (hit) return hit
  const path = join(CSV_DIR, `${name}.csv`)
  if (!existsSync(path)) throw new Error(`missing CSV: ${name}`)
  const text = readFileSync(path, 'utf8')
  const records = splitRecords(text).filter((r) => r.length > 0)
  const header = splitCsvLine(records[0])
  const rows: Row[] = new Array(records.length - 1)
  for (let i = 1; i < records.length; i++) {
    const values = splitCsvLine(records[i])
    const row: Row = {}
    for (let c = 0; c < header.length; c++) row[header[c]] = values[c] ?? ''
    rows[i - 1] = row
  }
  cache.set(name, rows)
  return rows
}

export function num(value: string | undefined): number | null {
  if (value === undefined || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

export function int(value: string | undefined): number {
  const n = num(value)
  return n === null ? 0 : n
}

export function bool(value: string | undefined): boolean {
  return value === '1'
}

/// Collapses whitespace and normalises the soft-hyphen/newline artefacts present in game flavour text.
export function cleanText(value: string): string {
  return value
    .replace(/­\n/g, '')
    .replace(/­/g, '')
    .replace(/-\n/g, '-')
    .replace(//g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function indexBy<T>(rows: T[], key: (row: T) => string | number): Map<string | number, T> {
  const map = new Map<string | number, T>()
  for (const row of rows) map.set(key(row), row)
  return map
}

export function groupBy<T>(rows: T[], key: (row: T) => string | number): Map<string | number, T[]> {
  const map = new Map<string | number, T[]>()
  for (const row of rows) {
    const k = key(row)
    const list = map.get(k)
    if (list) list.push(row)
    else map.set(k, [row])
  }
  return map
}

/// Builds `id -> localised name` lookups from PokéAPI's `*_names` tables, defaulting to English.
export function nameMap(table: string, idField: string, language = ENGLISH): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of loadCsv(table)) {
    if (int(row.local_language_id) !== language) continue
    map.set(int(row[idField]), row.name)
  }
  return map
}

export function localizedNames(table: string, idField: string): Map<number, Record<string, string>> {
  const langs = new Map<number, string>()
  for (const row of loadCsv('languages')) langs.set(int(row.id), row.identifier)
  const map = new Map<number, Record<string, string>>()
  for (const row of loadCsv(table)) {
    const id = int(row[idField])
    const lang = langs.get(int(row.local_language_id))
    if (!lang || !row.name) continue
    let entry = map.get(id)
    if (!entry) {
      entry = {}
      map.set(id, entry)
    }
    entry[lang] = row.name
  }
  return map
}
