import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const OUT_DIR = join(process.cwd(), 'public', 'data')

let filesWritten = 0
let bytesWritten = 0

export function resetOutput(subdir?: string) {
  const target = subdir ? join(OUT_DIR, subdir) : OUT_DIR
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
}

export function emit(relativePath: string, data: unknown) {
  const path = join(OUT_DIR, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  const json = JSON.stringify(data)
  writeFileSync(path, json)
  filesWritten++
  bytesWritten += Buffer.byteLength(json)
}

export function emitStats() {
  return { filesWritten, bytesWritten }
}

export const GENERATED_AT = new Date().toISOString()

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export function romanGeneration(id: number): string {
  return ROMAN[id] ?? String(id)
}

const SMALL_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'in', 'to', 'for'])

/// Renders a PokéAPI slug as a display label, keeping roman numerals and hyphenated forms readable.
export function titleize(slug: string): string {
  return slug
    .split('-')
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word)) return word
      if (/^[ivx]+$/.test(word) && word.length <= 4) return word.toUpperCase()
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}
