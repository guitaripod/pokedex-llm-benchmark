import { writeFile } from 'node:fs/promises'

const API = 'https://pokeapi.co/api/v2'
const OUT = new URL('../public/data/moves.json', import.meta.url)
const CONCURRENCY = 25

async function getJSON(url, attempt = 1) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status} ${url}`)
    return await res.json()
  } catch (e) {
    if (attempt >= 5) throw e
    await new Promise(r => setTimeout(r, attempt * 1500))
    return getJSON(url, attempt + 1)
  }
}

const list = await getJSON(`${API}/move?limit=2000`)
console.log(`Moves: ${list.results.length}`)
const results = {}
let i = 0, done = 0
const items = list.results
async function worker() {
  while (i < items.length) {
    const m = await getJSON(items[i++].url)
    const en = m.effect_entries.find(e => e.language.name === 'en')
    results[m.name] = {
      type: m.type?.name || 'normal',
      class: m.damage_class?.name || 'status',
      power: m.power,
      acc: m.accuracy,
      pp: m.pp,
      effect: en ? en.short_effect.replace('$effect_chance', String(m.effect_chance ?? '')) : '',
    }
    if (++done % 100 === 0) console.log(`  ${done}/${items.length}`)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
await writeFile(OUT, JSON.stringify(results))
console.log(`Wrote ${Object.keys(results).length} moves`)
