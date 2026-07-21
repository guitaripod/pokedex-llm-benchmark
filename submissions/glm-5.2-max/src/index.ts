/// PokeAPI proxy with edge caching and composite endpoints.

interface Env {
  ASSETS: Fetcher;
}

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const CACHE_TTL = 86400;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function cachedFetch(
  ctx: ExecutionContext,
  url: string,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const resp = await fetch(url, {
    headers: { "User-Agent": "pokedex-glm52-max/1.0" },
  });
  if (!resp.ok) {
    return new Response(
      JSON.stringify({ error: `PokeAPI returned ${resp.status}` }),
      {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      },
    );
  }
  const data = await resp.text();
  const cachedResp = new Response(data, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
      ...CORS_HEADERS,
    },
  });
  ctx.waitUntil(cache.put(cacheKey, cachedResp.clone()));
  return cachedResp;
}

async function compositePokemon(
  ctx: ExecutionContext,
  idOrName: string,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(`https://composite.local/pokemon/${idOrName}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const [pokemonResp, speciesResp] = await Promise.all([
    cachedFetch(ctx, `${POKEAPI_BASE}/pokemon/${idOrName}`),
    cachedFetch(ctx, `${POKEAPI_BASE}/pokemon-species/${idOrName}`),
  ]);

  if (!pokemonResp.ok) return pokemonResp;

  const pokemon = await pokemonResp.json();
  let species: Record<string, unknown> | null = null;
  if (speciesResp.ok) {
    species = await speciesResp.json();
  }

  const composite = { pokemon, species };
  const resp = new Response(JSON.stringify(composite), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
      ...CORS_HEADERS,
    },
  });
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

export default {
  async fetch(
    request: Request,
    _env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({ status: "ok", time: Date.now() }),
        {
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    const parts = url.pathname
      .replace(/^\/api\/?/, "")
      .split("/")
      .filter(Boolean);

    if (parts.length === 0) {
      return new Response(
        JSON.stringify({
          name: "pokedex-glm52-max API",
          endpoints: [
            "/api/pokemon - list all (paginated)",
            "/api/pokemon/:id - composite pokemon + species data",
            "/api/type/:id - type data",
            "/api/ability - list abilities",
            "/api/move - list moves",
            "/api/item - list items",
            "/api/berry - list berries",
            "/api/nature - list natures",
            "/api/generation - list generations",
            "/api/* - proxy to pokeapi.co/api/v2/*",
          ],
        }),
        {
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    if (parts[0] === "pokemon" && parts.length === 2) {
      return compositePokemon(ctx, parts[1]);
    }

    const queryString = url.search || "";
    const path = parts.join("/") + queryString;
    return cachedFetch(ctx, `${POKEAPI_BASE}/${path}`);
  },
};
