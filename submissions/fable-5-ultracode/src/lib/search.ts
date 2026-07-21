export function fuzzyScore(hay: string, needle: string): number {
  const h = hay.toLowerCase()
  const n = needle.toLowerCase()
  if (h === n) return 100
  if (h.startsWith(n)) return 85
  const wordIdx = h.indexOf('-' + n)
  if (wordIdx >= 0 || h.indexOf(' ' + n) >= 0) return 75
  if (h.includes(n)) return 60
  let hi = 0
  for (let ni = 0; ni < n.length; ni++) {
    hi = h.indexOf(n[ni], hi)
    if (hi < 0) return 0
    hi++
  }
  return 30
}

export interface Searchable {
  id: number
  name: string
  dname: string
}

export function rankSearch<T extends Searchable>(items: T[], query: string, limit = 50): T[] {
  const q = query.trim().toLowerCase().replace(/^#/, '')
  if (!q) return items.slice(0, limit)
  if (/^\d+$/.test(q)) {
    const id = Number(q)
    return items
      .filter(i => String(i.id).startsWith(q) || i.id === id)
      .sort((a, b) => (a.id === id ? -1 : b.id === id ? 1 : a.id - b.id))
      .slice(0, limit)
  }
  const scored: { item: T; score: number }[] = []
  for (const item of items) {
    const s = Math.max(fuzzyScore(item.dname, q), fuzzyScore(item.name, q))
    if (s > 25) scored.push({ item, score: s })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.item.id - b.item.id)
    .slice(0, limit)
    .map(x => x.item)
}
