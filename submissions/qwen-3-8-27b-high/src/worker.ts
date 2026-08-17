type Env = {
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  POKEAPI_BASE: string;
  CACHE_TTL: string;
};

type WaitCtx = { waitUntil: (p: Promise<unknown>) => void };
type Context = {
  req: Request;
  env: Env;
  executionCtx: WaitCtx | undefined | null;
};

const TTL = 86400;
const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
};

type Cached<T> = { data: T; cachedAt: number };

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

async function cacheGet<T>(
  ctx: Context,
  path: string,
  search = "",
): Promise<{ data: T; hit: boolean }> {
  const { env, executionCtx } = ctx;
  const key = `pk:${path}${search ? `?${search}` : ""}`;
  const cached = (await env.CACHE.get(key, { type: "json" })) as Cached<T> | null;
  if (cached) return { data: cached.data, hit: true };

  const target = `${env.POKEAPI_BASE}/${path}${search ? `?${search}` : ""}`;
  const upstream = await fetch(target, { headers: { accept: "application/json" } });
  if (!upstream.ok) throw new Error(`upstream ${upstream.status} for ${path}`);
  const data = (await upstream.json()) as T;
  const serialized = JSON.stringify(data);
  if (serialized.length < 6_000_000) {
    executionCtx?.waitUntil(
      env.CACHE.put(
        key,
        JSON.stringify({ data, cachedAt: Date.now() } satisfies Cached<T>),
        { expirationTtl: Number(env.CACHE_TTL) || TTL },
      ),
    );
  }
  return { data, hit: false };
}

function json(body: unknown, hit: boolean): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-cache": hit ? "HIT" : "MISS",
      ...CORS,
    },
  });
}

async function handle(req: Request, env: Env, executionCtx: WaitCtx | null): Promise<Response> {
   const ctx: Context = { req, env, executionCtx };
   const { pathname, search } = new URL(req.url);

  if (pathname === "/api/health") {
    return json({ ok: true, ts: Date.now() }, false);
  }

  if (pathname === "/api/pokemon") {
    return cacheGet<any>(ctx, "pokemon", "limit=1010").then(({ data }) => {
      const items = (data.results as any[]).map((r) => ({
        id: Number(r.url.split("/").slice(-2)[0]),
        name: r.name,
      }));
      return json(items, false);
    });
  }

  if (pathname === "/api/type-chart") {
    const results = Promise.all(
      TYPES.map(async (t) => {
        try {
          const { data } = await cacheGet<any>(ctx, `type/${t}`);
          return { type: t, ...data.damage_relations };
        } catch {
          return null;
        }
      }),
    );
    return results.then((rows) => json(rows.filter(Boolean), false));
  }

  // Catch-all proxy for /api/v2/... -> pokeapi, edge-cached in KV.
   if (pathname.startsWith("/api/v2/")) {
    const rest = pathname.slice("/api/v2/".length) + (search || "");
    return cacheGet<any>(ctx, rest).then(
      ({ data, hit }) => json(data, hit),
      (e) => json({ error: e?.message || "proxy error" }, false),
    );
  }

  // Everything non-API is served by the static asset worker (SPA + assets).
  return ctx.env.ASSETS.fetch(ctx.req);
}

export default { fetch: handle };
