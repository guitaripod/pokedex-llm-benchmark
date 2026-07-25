import fs from 'node:fs'
import path from 'node:path'

const CACHE = path.resolve('.cache')
const API = 'https://pokeapi.co/api/v2'

fs.mkdirSync(CACHE, { recursive: true })

const key = (url) => url.replace(API + '/', '').replace(/[/?=&]/g, '_') + '.json'

export async function get(url) {
  const full = url.startsWith('http') ? url : `${API}/${url}`
  const file = path.join(CACHE, key(full))
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { /* refetch */ }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(full)
      if (res.status === 404) { fs.writeFileSync(file, 'null'); return null }
      if (!res.ok) throw new Error(`${res.status} ${full}`)
      const json = await res.json()
      fs.writeFileSync(file, JSON.stringify(json))
      return json
    } catch (e) {
      if (attempt === 5) { console.warn(`\n  ! skipping ${full}: ${e.message}`); return null }
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
}

export async function getAll(resource) {
  const list = await get(`${resource}?limit=100000`)
  return list.results
}

export async function mapPool(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  let done = 0
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
      if (++done % 250 === 0) process.stdout.write(`\r  ${done}/${items.length}`)
    }
  })
  await Promise.all(workers)
  process.stdout.write(`\r  ${done}/${items.length}\n`)
  return out
}

export const en = (arr, field = 'name') =>
  arr?.find((x) => x.language?.name === 'en')?.[field] ?? null

export const enText = (arr, field) => {
  const e = arr?.filter((x) => x.language?.name === 'en') ?? []
  const last = e[e.length - 1]
  return last ? (last[field] ?? '').replace(/[\n\f]/g, ' ').replace(/\s+/g, ' ').trim() : null
}

export const idOf = (url) => Number(url.replace(/\/$/, '').split('/').pop())

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data))
}
