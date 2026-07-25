/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher
}

const SPRITE_ORIGIN = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites'
const CRY_ORIGIN = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon'

const IMMUTABLE = 'public, max-age=31536000, immutable'
const API_CACHE = 'public, max-age=3600, stale-while-revalidate=86400'

const SAFE_MEDIA_PATH = /^[a-z0-9][a-z0-9._/-]*\.(png|gif|svg|ogg)$/i

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, HEAD, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ error: 'method_not_allowed' }, 405)
    }

    if (pathname === '/health') {
      return json({ ok: true, service: 'pokedex-opus-5-ultracode', time: new Date().toISOString() })
    }

    if (pathname.startsWith('/img/')) {
      return proxyMedia(pathname.slice('/img/'.length), SPRITE_ORIGIN, ctx)
    }

    if (pathname.startsWith('/cry/')) {
      return proxyMedia(pathname.slice('/cry/'.length), CRY_ORIGIN, ctx)
    }

    if (pathname.startsWith('/og/')) {
      return ogImage(pathname.slice('/og/'.length), env)
    }

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return handleApi(url, env)
    }

    const document = await env.ASSETS.fetch(new Request(new URL('/', url), request))
    return decorateDocument(document, url, env)
  },
} satisfies ExportedHandler<Env>

/* ------------------------------------------------------------------- media */

/// Streams sprite/cry assets from the PokéAPI repositories through the edge cache.
async function proxyMedia(path: string, origin: string, ctx: ExecutionContext): Promise<Response> {
  const decoded = safeDecode(path)
  if (!decoded || decoded.includes('..') || !SAFE_MEDIA_PATH.test(decoded)) {
    return new Response('Bad media path', { status: 400, headers: CORS })
  }

  const target = `${origin}/${decoded}`
  const cacheKey = new Request(target, { method: 'GET' })
  const cache = (caches as unknown as { default: Cache }).default

  const cached = await cache.match(cacheKey)
  if (cached) return withMediaHeaders(cached)

  const upstream = await fetch(target, {
    cf: { cacheEverything: true, cacheTtl: 2592000 },
  })

  if (!upstream.ok) {
    return new Response(null, {
      status: upstream.status === 404 ? 404 : 502,
      headers: { ...CORS, 'cache-control': 'public, max-age=600' },
    })
  }

  const response = withMediaHeaders(upstream)
  ctx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

function withMediaHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('cache-control', IMMUTABLE)
  headers.set('access-control-allow-origin', '*')
  headers.delete('set-cookie')
  return new Response(response.body, { status: response.status, headers })
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

/* --------------------------------------------------------------------- api */

interface IndexEntryLike {
  id: number
  name: string
  label: string
  [key: string]: unknown
}

const indexCache = new Map<string, IndexEntryLike[]>()

async function readIndex(env: Env, file: string, field: string): Promise<IndexEntryLike[]> {
  const cached = indexCache.get(file)
  if (cached) return cached
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/data/${file}`))
  if (!response.ok) return []
  const payload = (await response.json()) as Record<string, IndexEntryLike[]>
  const entries = payload[field] ?? []
  indexCache.set(file, entries)
  return entries
}

const COLLECTIONS: Record<
  string,
  { index: string; field: string; detail: (id: number) => string }
> = {
  pokemon: { index: 'pokemon-index.json', field: 'entries', detail: (id) => `pokemon/${id}.json` },
  moves: { index: 'moves-index.json', field: 'entries', detail: (id) => `moves/${id}.json` },
  items: { index: 'items-index.json', field: 'entries', detail: (id) => `items/${id}.json` },
  abilities: { index: 'abilities-index.json', field: 'entries', detail: (id) => `abilities/${id}.json` },
  locations: { index: 'locations-index.json', field: 'entries', detail: (id) => `locations/${id}.json` },
}

async function handleApi(url: URL, env: Env): Promise<Response> {
  const segments = url.pathname.split('/').filter(Boolean).slice(1)

  if (segments.length === 0) {
    return json({
      service: 'pokedex-opus-5-ultracode',
      documentation: `${url.origin}/api`,
      endpoints: {
        meta: '/api/meta',
        collections: Object.keys(COLLECTIONS).map((key) => `/api/${key}`),
        detail: '/api/pokemon/{id|name}',
        search: '/api/search?q=pika&limit=20',
      },
      notes: 'All data derives from the PokéAPI dataset. Responses are edge-cached for one hour.',
    })
  }

  if (segments[0] === 'meta') return passThrough(env, 'meta.json')
  if (segments[0] === 'search') return search(url, env)

  const collection = COLLECTIONS[segments[0]]
  if (!collection) return json({ error: 'unknown_collection', collection: segments[0] }, 404)

  const entries = await readIndex(env, collection.index, collection.field)

  if (segments.length === 1) {
    const limit = clamp(Number(url.searchParams.get('limit') ?? 60), 1, 2000)
    const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0))
    const query = url.searchParams.get('q')?.toLowerCase().trim()
    const filtered = query
      ? entries.filter((e) => e.name.includes(query) || e.label.toLowerCase().includes(query))
      : entries
    return json({
      count: filtered.length,
      offset,
      limit,
      results: filtered.slice(offset, offset + limit),
    })
  }

  const key = decodeURIComponent(segments[1]).toLowerCase()
  const entry = /^\d+$/.test(key)
    ? entries.find((e) => e.id === Number(key))
    : entries.find((e) => e.name === key)
  if (!entry) return json({ error: 'not_found', collection: segments[0], key }, 404)

  return passThrough(env, collection.detail(entry.id))
}

type SearchEntry = [string, number, string, string, number | null]

let searchEntries: SearchEntry[] | null = null

/// Parsing the corpus costs seconds on a cold isolate, so it is kept for the isolate's lifetime.
async function readSearchIndex(env: Env): Promise<SearchEntry[] | null> {
  if (searchEntries) return searchEntries
  const response = await env.ASSETS.fetch(new Request('https://assets.local/data/search-index.json'))
  if (!response.ok) return null
  const payload = (await response.json()) as { entries: SearchEntry[] }
  searchEntries = payload.entries
  return searchEntries
}

async function search(url: URL, env: Env): Promise<Response> {
  const query = (url.searchParams.get('q') ?? '').toLowerCase().trim()
  const limit = clamp(Number(url.searchParams.get('limit') ?? 20), 1, 100)
  if (!query) return json({ query, results: [] })

  const entries = await readSearchIndex(env)
  if (!entries) return json({ error: 'index_unavailable' }, 503)

  const results = entries
    .filter(([, , slug, label]) => slug.includes(query) || label.toLowerCase().includes(query))
    .slice(0, limit)
    .map(([kind, id, slug, label, extra]) => ({ kind, id, name: slug, label, extra }))

  return json({ query, count: results.length, results })
}

async function passThrough(env: Env, file: string): Promise<Response> {
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/data/${file}`))
  if (!response.ok) return json({ error: 'not_found', file }, 404)
  return new Response(response.body, {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': API_CACHE, ...CORS },
  })
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? API_CACHE : 'no-store',
      ...CORS,
    },
  })
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

/* ---------------------------------------------------------------- previews */

interface PageMeta {
  title: string
  description: string
  image: string | null
}

/// Rewrites the SPA shell's head so crawlers and chat unfurls see per-record metadata.
async function decorateDocument(document: Response, url: URL, env: Env): Promise<Response> {
  if (!document.ok) return document
  const meta = await resolvePageMeta(url, env)
  if (!meta) return document

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(meta.title)
      },
    })
    .on('meta', {
      element(element) {
        const property = element.getAttribute('property') ?? element.getAttribute('name')
        if (property === 'og:title' || property === 'twitter:title') {
          element.setAttribute('content', meta.title)
        } else if (
          property === 'description' ||
          property === 'og:description' ||
          property === 'twitter:description'
        ) {
          element.setAttribute('content', meta.description)
        } else if (meta.image && (property === 'og:image' || property === 'twitter:image')) {
          element.setAttribute('content', meta.image)
        }
      },
    })
    .on('head', {
      element(element) {
        element.append(`<meta property="og:url" content="${escapeHtml(url.href)}" />`, { html: true })
        if (meta.image) {
          element.append(
            `<meta property="og:image" content="${escapeHtml(meta.image)}" /><meta name="twitter:image" content="${escapeHtml(meta.image)}" /><meta name="twitter:card" content="summary_large_image" />`,
            { html: true },
          )
        }
      },
    })

  const response = rewriter.transform(document)
  const headers = new Headers(response.headers)
  headers.set('cache-control', 'public, max-age=0, must-revalidate')
  return new Response(response.body, { status: response.status, headers })
}

async function resolvePageMeta(url: URL, env: Env): Promise<PageMeta | null> {
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length < 2) return null

  const collection = COLLECTIONS[segments[0]]
  if (!collection) return null

  const entries = await readIndex(env, collection.index, collection.field)
  const key = decodeURIComponent(segments[1]).toLowerCase()
  const entry = /^\d+$/.test(key)
    ? entries.find((e) => e.id === Number(key))
    : entries.find((e) => e.name === key)
  if (!entry) return null

  if (segments[0] === 'pokemon') {
    const dex = typeof entry.dex === 'number' ? entry.dex : entry.id
    return {
      title: `${entry.label} — #${String(dex).padStart(4, '0')} | Pokédex`,
      description: `Base stats, abilities, evolutions, complete learnset, wild encounters and every sprite for ${entry.label}.`,
      image: `${url.origin}/img/pokemon/other/official-artwork/${entry.id}.png`,
    }
  }

  const singular = segments[0].replace(/s$/, '')
  return {
    title: `${entry.label} — ${singular} | Pokédex`,
    description: `Full ${singular} data for ${entry.label}, including effects, availability and every Pokémon involved.`,
    image: null,
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function ogImage(path: string, env: Env): Promise<Response> {
  const match = /^pokemon\/(\d+)$/.exec(path)
  if (!match) return new Response('Not found', { status: 404 })
  const response = await env.ASSETS.fetch(
    new Request(`https://assets.local/data/pokemon/${match[1]}.json`),
  )
  if (!response.ok) return new Response('Not found', { status: 404 })
  return Response.redirect(
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${match[1]}.png`,
    302,
  )
}
