import type {
  Ability,
  Card,
  Item,
  Meta,
  Move,
  PokemonDetail,
} from "./types";

export interface Env {
  DEX_KV: KVNamespace;
  ASSETS: Fetcher;
}

const CARD_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
};


function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CARD_HEADERS,
  });
}

async function readJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key, "json");
  return (raw as T | null) ?? null;
}

function getPokemonIdFromPath(path: string): number | null {
  const m = path.match(/^\/api\/pokemon\/(\d{1,5})\/?$/);
  if (!m) return null;
  const id = Number(m[1]);
  return id >= 1 && id <= 10000 ? id : null;
}

async function batchLookup(
  kv: KVNamespace,
  namesParam: string | null,
  prefix: string
): Promise<Response> {
  if (!namesParam) return json({ error: "missing names" }, 400);
  const names = namesParam.split(",").map((n) => n.trim()).filter(Boolean).slice(0, 64);
  if (names.length === 0) return json({ error: "missing names" }, 400);
  const out: Record<string, unknown> = {};
  const keys = names.map((n) => `${prefix}:${n}`);
  const found = await kv.get(keys);
  for (let i = 0; i < names.length; i++) {
    const v = found.get(keys[i]);
    if (v !== null && v !== undefined) out[names[i]] = JSON.parse(v);
  }
  return json(out);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {

      if (pathname.startsWith("/api/")) {
        if (pathname === "/api/meta" || pathname === "/api/meta/") {
          const meta = await readJson<Meta>(env.DEX_KV, "meta");
          if (!meta) return json({ error: "metadata not found" }, 404);
          return json(meta);
        }

        if (pathname === "/api/types" || pathname === "/api/types/") {
          const meta = await readJson<Meta>(env.DEX_KV, "meta");
          if (!meta) return json({ error: "metadata not found" }, 404);
          const out: Record<string, unknown> = {};
          const found = await env.DEX_KV.get(meta.types.map((t) => `t:${t}`));
          for (const t of meta.types) {
            const v = found.get(`t:${t}`);
            if (v !== null && v !== undefined) out[t] = JSON.parse(v);
          }
          return json(out);
        }

        if (pathname === "/api/pokemon" || pathname === "/api/pokemon/") {
          const cards = await readJson<Card[]>(env.DEX_KV, "cards");
          if (!cards) return json({ error: "data not ingested yet" }, 404);
          return json(cards);
        }

        if (pathname === "/api/random" || pathname === "/api/random/") {
          const cards = await readJson<Card[]>(env.DEX_KV, "cards");
          if (!cards) return json({ error: "data not ingested yet" }, 404);
          const card = cards[Math.floor(Math.random() * cards.length)];
          const detail = await readJson<PokemonDetail>(env.DEX_KV, `p:${card.id}`);
          return json({ card, detail });
        }

        const id = getPokemonIdFromPath(pathname);
        if (id !== null) {
          const detail = await readJson<PokemonDetail>(env.DEX_KV, `p:${id}`);
          if (!detail) return json({ error: "pokemon not found" }, 404);
          return json(detail);
        }

        if (pathname === "/api/moves" || pathname === "/api/moves/") {
          return batchLookup(env.DEX_KV, url.searchParams.get("names"), "m");
        }
        if (pathname === "/api/abilities" || pathname === "/api/abilities/") {
          return batchLookup(env.DEX_KV, url.searchParams.get("names"), "a");
        }
        if (pathname === "/api/items" || pathname === "/api/items/") {
          return batchLookup(env.DEX_KV, url.searchParams.get("names"), "i");
        }

        const typeMatch = pathname.match(/^\/api\/type\/([a-z-]+)\/?$/);
        if (typeMatch) {
          const t = await readJson<Record<string, unknown>>(env.DEX_KV, `t:${typeMatch[1]}`);
          if (!t) return json({ error: "type not found" }, 404);
          return json(t);
        }

        const moveMatch = pathname.match(/^\/api\/moves\/([a-z0-9-]+)\/?$/);
        if (moveMatch) {
          const m = await readJson<Move>(env.DEX_KV, `m:${moveMatch[1]}`);
          if (!m) return json({ error: "move not found" }, 404);
          return json(m);
        }

        const abilityMatch = pathname.match(/^\/api\/abilities\/([a-z0-9-]+)\/?$/);
        if (abilityMatch) {
          const a = await readJson<Ability>(env.DEX_KV, `a:${abilityMatch[1]}`);
          if (!a) return json({ error: "ability not found" }, 404);
          return json(a);
        }

        const itemMatch = pathname.match(/^\/api\/items\/([a-z0-9-]+)\/?$/);
        if (itemMatch) {
          const it = await readJson<Item>(env.DEX_KV, `i:${itemMatch[1]}`);
          if (!it) return json({ error: "item not found" }, 404);
          return json(it);
        }

        return json({ error: "not found" }, 404);
      }


      const asset = await env.ASSETS.fetch(request);
      if (asset.status === 404 && (request.method === "GET" || request.method === "HEAD")) {
        const index = await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
        if (index.ok) {
          return new Response(index.body, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
          });
        }
        return index;
      }
      return asset;
    } catch (err) {
      console.error("worker error", err);
      return json({ error: "internal error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
