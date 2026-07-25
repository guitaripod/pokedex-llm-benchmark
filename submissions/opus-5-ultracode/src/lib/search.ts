import type { SearchTuple } from '@/types/data'

export interface Scored {
  entry: SearchTuple
  score: number
}

const KIND_WEIGHT: Record<string, number> = {
  page: 320,
  pokemon: 300,
  move: 220,
  ability: 200,
  item: 180,
  type: 260,
  nature: 190,
  location: 140,
}

/**
 * Ranks a candidate against a lowercase query.
 * Exact and prefix matches dominate; a subsequence match keeps typo-ish queries useful but low.
 */
export function scoreCandidate(haystack: string, query: string): number {
  if (!query) return 0
  if (haystack === query) return 1000
  const index = haystack.indexOf(query)
  if (index === 0) return 800 - Math.min(200, haystack.length)
  if (index > 0) {
    const wordStart = index === 0 || /[\s-]/.test(haystack[index - 1])
    return (wordStart ? 620 : 420) - Math.min(180, index * 4) - Math.min(80, haystack.length)
  }
  return subsequenceScore(haystack, query)
}

function subsequenceScore(haystack: string, query: string): number {
  let hay = 0
  let matched = 0
  let gaps = 0
  let lastMatch = -1
  for (let q = 0; q < query.length; q++) {
    const character = query[q]
    let found = -1
    while (hay < haystack.length) {
      if (haystack[hay] === character) {
        found = hay
        hay++
        break
      }
      hay++
    }
    if (found === -1) return 0
    if (lastMatch >= 0) gaps += found - lastMatch - 1
    lastMatch = found
    matched++
  }
  if (matched < query.length) return 0
  return Math.max(40, 260 - gaps * 6 - haystack.length)
}

export function rankSearch(entries: SearchTuple[], rawQuery: string, limit = 40): SearchTuple[] {
  const query = rawQuery.toLowerCase().trim()
  if (!query) return []

  const numeric = /^#?\d+$/.test(query) ? Number(query.replace('#', '')) : null
  const scored: Scored[] = []

  for (const entry of entries) {
    const [kind, id, slug, label] = entry
    let score = 0

    if (numeric !== null && kind === 'pokemon' && id === numeric) {
      score = 1200
    } else {
      const slugScore = scoreCandidate(slug, query)
      const labelScore = scoreCandidate(label.toLowerCase(), query)
      score = Math.max(slugScore, labelScore)
    }

    if (score <= 0) continue
    scored.push({ entry, score: score + (KIND_WEIGHT[kind] ?? 100) / 10 })
  }

  scored.sort((a, b) => b.score - a.score || a.entry[1] - b.entry[1])
  return scored.slice(0, limit).map((item) => item.entry)
}

export const KIND_LABELS: Record<string, string> = {
  pokemon: 'Pokémon',
  move: 'Move',
  item: 'Item',
  ability: 'Ability',
  location: 'Location',
  type: 'Type',
  nature: 'Nature',
  page: 'Go to',
}

export function routeFor(kind: string, slug: string): string {
  switch (kind) {
    case 'pokemon':
      return `/pokemon/${slug}`
    case 'move':
      return `/moves/${slug}`
    case 'item':
      return `/items/${slug}`
    case 'ability':
      return `/abilities/${slug}`
    case 'location':
      return `/locations/${slug}`
    case 'type':
      return `/types/${slug}`
    case 'nature':
      return `/natures#${slug}`
    default:
      return slug.startsWith('/') ? slug : `/${slug}`
  }
}
