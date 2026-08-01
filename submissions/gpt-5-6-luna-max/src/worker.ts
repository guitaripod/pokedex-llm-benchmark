/// <reference path="../worker-configuration.d.ts" />

const POKE_API_ORIGIN = "https://pokeapi.co/api/v2";

function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function proxyPokeApi(request: Request, ctx: ExecutionContext): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const incoming = new URL(request.url);
  const apiPath = incoming.pathname.replace(/^\/api\/pokeapi/, "");
  const upstreamUrl = new URL(`${POKE_API_ORIGIN}${apiPath}${incoming.search}`);
  const cacheKey = new Request(upstreamUrl.toString(), { method: "GET" });
  const cache = (caches as CacheStorage & { default: Cache }).default;
  const cached = await cache.match(cacheKey);

  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-Pokedex-Cache", "HIT");
    return new Response(cached.body, { status: cached.status, headers });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      return jsonResponse(
        { error: "PokéAPI request failed", status: upstream.status },
        { status: upstream.status },
      );
    }

    const headers = new Headers(upstream.headers);
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Pokedex-Cache", "MISS");
    const response = new Response(upstream.body, {
      status: upstream.status,
      headers,
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "PokéAPI proxy failed",
        error: error instanceof Error ? error.message : String(error),
        path: incoming.pathname,
      }),
    );
    return jsonResponse({ error: "Unable to reach PokéAPI" }, { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/pokeapi/")) {
      return proxyPokeApi(request, ctx);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
