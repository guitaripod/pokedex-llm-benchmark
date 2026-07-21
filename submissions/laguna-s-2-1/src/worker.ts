export interface Env {
  POKEAPI_CACHE: KVNamespace;
  USER_DATA: KVNamespace;
  POKEAPI_BASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\//, '');

    if (path.startsWith('proxy/')) {
      return handleProxy(request, env, path, ctx);
    }

    if (path.startsWith('favorites')) {
      return handleFavorites(request, env);
    }

    if (path.startsWith('teams')) {
      return handleTeams(request, env);
    }

    if (path.startsWith('search-history')) {
      return handleSearchHistory(request, env);
    }

    if (path.startsWith('health')) {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};

async function handleProxy(request: Request, env: Env, path: string, ctx: ExecutionContext): Promise<Response> {
  const endpoint = path.replace('proxy/', '');
  const cacheKey = `pokeapi:${endpoint}`;
  const cacheTTL = 86400;

  const cached = await env.POKEAPI_CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}`,
      },
    });
  }

  const apiUrl = `${env.POKEAPI_BASE_URL}/${endpoint}`;
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'pokedex-laguna-s-2-1/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return jsonResponse({ error: `PokeAPI error: ${response.status}` }, response.status);
    }

    const data = await response.text();
    ctx.waitUntil(env.POKEAPI_CACHE.put(cacheKey, data, { expirationTtl: cacheTTL }));

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheTTL}`,
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch from PokeAPI' }, 502);
  }
}

async function handleFavorites(request: Request, env: Env): Promise<Response> {
  const userId = request.headers.get('X-User-ID') || 'anonymous';
  const method = request.method;

  if (method === 'GET') {
    const key = `favorites:${userId}`;
    const data = await env.USER_DATA.get(key);
    const favorites = data ? JSON.parse(data) : [];
    return jsonResponse(favorites);
  }

  if (method === 'POST') {
    const body = await request.json() as { pokemonId: number };
    const key = `favorites:${userId}`;
    const existing = await env.USER_DATA.get(key);
    const favorites = existing ? JSON.parse(existing) : [];
    if (!favorites.includes(body.pokemonId)) {
      favorites.push(body.pokemonId);
      await env.USER_DATA.put(key, JSON.stringify(favorites));
    }
    return jsonResponse({ success: true, favorites });
  }

  if (method === 'DELETE') {
    const body = await request.json() as { pokemonId: number };
    const key = `favorites:${userId}`;
    const existing = await env.USER_DATA.get(key);
    const favorites = existing ? JSON.parse(existing) : [];
    const index = favorites.indexOf(body.pokemonId);
    if (index > -1) {
      favorites.splice(index, 1);
      await env.USER_DATA.put(key, JSON.stringify(favorites));
    }
    return jsonResponse({ success: true, favorites });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function handleTeams(request: Request, env: Env): Promise<Response> {
  const userId = request.headers.get('X-User-ID') || 'anonymous';
  const method = request.method;

  if (method === 'GET') {
    const key = `teams:${userId}`;
    const data = await env.USER_DATA.get(key);
    const teams = data ? JSON.parse(data) : [];
    return jsonResponse(teams);
  }

  if (method === 'POST') {
    const body = await request.json() as { name: string; pokemonIds: number[] };
    const key = `teams:${userId}`;
    const existing = await env.USER_DATA.get(key);
    const teams = existing ? JSON.parse(existing) : [];
    const newTeam = {
      id: Date.now(),
      name: body.name,
      pokemonIds: body.pokemonIds,
      createdAt: new Date().toISOString(),
    };
    teams.push(newTeam);
    await env.USER_DATA.put(key, JSON.stringify(teams));
    return jsonResponse(newTeam);
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function handleSearchHistory(request: Request, env: Env): Promise<Response> {
  const userId = request.headers.get('X-User-ID') || 'anonymous';
  const method = request.method;

  if (method === 'GET') {
    const key = `search:${userId}`;
    const data = await env.USER_DATA.get(key);
    const history = data ? JSON.parse(data) : [];
    return jsonResponse(history);
  }

  if (method === 'POST') {
    const body = await request.json() as { query: string };
    const key = `search:${userId}`;
    const existing = await env.USER_DATA.get(key);
    const history = existing ? JSON.parse(existing) : [];
    if (!history.includes(body.query)) {
      history.unshift(body.query);
      if (history.length > 50) history.pop();
      await env.USER_DATA.put(key, JSON.stringify(history));
    }
    return jsonResponse({ success: true, history });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-ID',
    },
  });
}
