const BASE = '/api/v2'

const memCache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

export async function apiGet<T>(path: string): Promise<T> {
  const key = path.replace(/^\//, '')
  if (memCache.has(key)) return memCache.get(key) as T
  if (inflight.has(key)) return inflight.get(key) as Promise<T>

  const p = (async () => {
    const res = await fetch(`${BASE}/${key}`)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${key}`)
    const data = (await res.json()) as T
    memCache.set(key, data)
    inflight.delete(key)
    return data
  })()
  inflight.set(key, p)
  return p as Promise<T>
}

/** Fetch by full url (PokeAPI returns absolute urls in resource refs). */
export async function apiGetUrl<T>(url: string): Promise<T> {
  const idx = url.indexOf('/api/v2/')
  const path = idx >= 0 ? url.slice(idx + '/api/v2/'.length) : url
  return apiGet<T>(path)
}

export function idFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/?$/)
  return m ? Number(m[1]) : 0
}

export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}
export function artworkShinyUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
}
export function homeUrl(id: number, shiny = false): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${shiny ? 'shiny/' : ''}${id}.png`
}
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}
export function itemSpriteUrl(name: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`
}
export function cryUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
}

export function localizedName(names: { language: { name: string }; name: string }[] | undefined, fallback = ''): string {
  if (!names) return fallback
  return names.find((n) => n.language.name === 'en')?.name ?? fallback
}

export function englishText(
  entries: { language: { name: string }; flavor_text?: string; effect?: string; short_effect?: string }[] | undefined,
): string {
  if (!entries) return ''
  const e = entries.find((x) => x.language.name === 'en')
  return (e?.flavor_text || e?.short_effect || e?.effect || '').replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function padId(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}
