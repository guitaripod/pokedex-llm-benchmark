const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  let path = context.params.path;
  if (Array.isArray(path)) path = path.join('/');
  path = String(path || '').replace(/\/+$/, '');

  if (!path) {
    return new Response(JSON.stringify({ error: 'No path specified' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const apiUrl = `${POKEAPI_BASE}/${path}${url.search}`;

  try {
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'pokedex-cf/1.0' },
    });

    const body = await response.text();
    const headers = new Headers(response.headers);

    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');

    return new Response(body, {
      status: response.status,
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch from PokeAPI', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
