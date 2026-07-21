import { writeFile, mkdir } from 'node:fs/promises'

const API = 'https://pokeapi.co/api/v2'
const MAX = 1025

const GENERATIONS = [
  [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
  [650, 721], [722, 809], [810, 905], [906, 1025],
]
const genForId = (id) => GENERATIONS.findIndex(([a, b]) => id >= a && id <= b) + 1

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return await r.json()
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 400 * (i + 1)))
  }
  throw new Error(`failed ${url}`)
}

async function pool(items, size, worker) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await worker(items[idx], idx)
        if (idx % 100 === 0) process.stdout.write(`\r  ${idx}/${items.length}`)
      }
    }),
  )
  process.stdout.write('\n')
  return out
}

console.log('Fetching pokemon list...')
const list = await getJson(`${API}/pokemon?limit=${MAX}`)

console.log('Fetching per-pokemon details...')
const entries = await pool(list.results, 24, async (ref) => {
  const p = await getJson(ref.url)
  if (p.id > MAX) return null
  const stats = p.stats.map((s) => s.base_stat)
  const total = stats.reduce((a, b) => a + b, 0)
  return {
    id: p.id,
    name: p.name,
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    gen: genForId(p.id),
    total,
    hp: p.stats.find((s) => s.stat.name === 'hp')?.base_stat ?? 0,
    atk: p.stats.find((s) => s.stat.name === 'attack')?.base_stat ?? 0,
    def: p.stats.find((s) => s.stat.name === 'defense')?.base_stat ?? 0,
    spa: p.stats.find((s) => s.stat.name === 'special-attack')?.base_stat ?? 0,
    spd: p.stats.find((s) => s.stat.name === 'special-defense')?.base_stat ?? 0,
    spe: p.stats.find((s) => s.stat.name === 'speed')?.base_stat ?? 0,
    height: p.height,
    weight: p.weight,
  }
})

const clean = entries.filter(Boolean).sort((a, b) => a.id - b.id)
console.log(`Got ${clean.length} pokemon.`)

await mkdir('src/data', { recursive: true })
await writeFile('src/data/pokemon-index.json', JSON.stringify(clean))
console.log('Wrote src/data/pokemon-index.json')
