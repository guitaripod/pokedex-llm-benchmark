interface Env {
  ASSETS: Fetcher
}

const POKEAPI = 'https://pokeapi.co/api/v2'
const ALLOW_PREFIXES = [
  'pokemon',
  'pokemon-species',
  'evolution-chain',
  'ability',
  'move',
  'item',
  'type',
  'generation',
  'pokedex',
  'egg-group',
  'growth-rate',
  'nature',
  'stat',
  'region',
]

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/v2/')) {
      return handleApi(url, request, ctx)
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleApi(url: URL, request: Request, ctx: ExecutionContext): Promise<Response> {
  const path = url.pathname.replace('/api/v2/', '')
  const resource = path.split('/')[0].split('?')[0]

  if (!ALLOW_PREFIXES.includes(resource)) {
    return json({ error: 'resource not allowed' }, 403)
  }

  const cache = caches.default
  const cacheKey = new Request(url.toString(), { method: 'GET' })
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const target = `${POKEAPI}/${path}${url.search}`
  let upstream: Response
  try {
    upstream = await fetch(target, { headers: { accept: 'application/json' }, cf: { cacheTtl: 86400, cacheEverything: true } })
  } catch (e) {
    return json({ error: 'upstream fetch failed', detail: String(e) }, 502)
  }

  if (!upstream.ok) {
    return json({ error: 'upstream error', status: upstream.status }, upstream.status)
  }

  const body = await upstream.text()
  const res = new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=86400, s-maxage=604800',
      'access-control-allow-origin': '*',
    },
  })
  ctx.waitUntil(cache.put(cacheKey, res.clone()))
  return res
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
