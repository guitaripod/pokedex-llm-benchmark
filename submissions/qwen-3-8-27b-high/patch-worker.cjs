const fs = require("fs");

// --- worker.ts --- remove the ASSETS fallback, import, and Env.ASSETS
let s = fs.readFileSync("src/worker.ts", "utf8");
const before = s;

// remove fallback block
s = s.replace(
  '// Everything non-API falls through to the static asset worker (SPA).\n' +
  'app.all("*", async (c) => {\n' +
  '  return await c.env.ASSETS.fetch(c.req.raw);\n' +
  '});\n\n',
  ""
);
// also remove newer single-line variant if present
s = s.replace(
  '// Everything non-API falls through to the static asset worker (SPA).\n' +
  'app.all("*", (c) => c.env.ASSETS.fetch(new Request(c.req.url, c.req.raw)));\n\n',
  ""
);
// remove Fetcher import
s = s.replace('import { Hono } from "hono";\nimport type { Fetcher } from "@cloudflare/workers-types";\n', 'import { Hono } from "hono";\n');
// remove ASSETS from Env
s = s.replace("  CACHE: KVNamespace;\n  ASSETS: Fetcher;\n", "  CACHE: KVNamespace;\n");

if (s !== before) {
  fs.writeFileSync("src/worker.ts", s);
  console.log("worker.ts cleaned");
} else {
  console.log("worker.ts: no change");
}

// --- wrangler.jsonc --- run_worker_first -> glob array
let w = fs.readFileSync("wrangler.jsonc", "utf8");
const wbefore = w;
w = w.replace(/"run_worker_first":\s*true/, '"run_worker_first": ["/api/*", "/_worker/*"]');
if (w !== wbefore) {
  fs.writeFileSync("wrangler.jsonc", w);
  console.log("wrangler.jsonc run_worker_first -> glob array");
} else {
  console.log("wrangler.jsonc: no change");
}
