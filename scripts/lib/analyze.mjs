import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const SOURCE_EXT = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".vue", ".svelte", ".astro",
  ".css", ".scss", ".sass", ".less",
  ".html",
]);

const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", ".wrangler",
  ".cache", ".parcel-cache", "coverage", ".next", ".vite",
]);

const SKIP_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
]);

/// Walk a submission directory, yielding source files while skipping
/// build output, dependencies, lockfiles, and generated data blobs.
function* walkSource(dir, root = dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") && name !== ".oxlintrc.json") continue;
    const full = join(dir, name);
    const rel = full.slice(root.length + 1);
    if (SKIP_DIRS.has(name)) continue;
    if (rel === "public/data" || rel.startsWith("public/data/")) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walkSource(full, root);
    } else if (SOURCE_EXT.has(extname(name)) && !SKIP_FILES.has(name)) {
      yield full;
    }
  }
}

function countLines(dir) {
  let loc = 0;
  let files = 0;
  let bytes = 0;
  for (const file of walkSource(dir)) {
    const text = readFileSync(file, "utf8");
    loc += text.split("\n").length;
    bytes += Buffer.byteLength(text);
    files += 1;
  }
  return { loc, files, bytes };
}

function readPkg(dir) {
  const p = join(dir, "package.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function detectStack(dir, pkg) {
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const has = (n) => Object.prototype.hasOwnProperty.call(deps, n);

  let framework = "vanilla";
  if (has("react") || has("react-dom")) framework = "react";
  else if (has("preact")) framework = "preact";
  else if (has("vue")) framework = "vue";
  else if (has("svelte")) framework = "svelte";
  else if (has("solid-js")) framework = "solid";
  else if (has("lit")) framework = "lit";

  const language = detectLanguage(dir);

  let bundler = "none";
  if (has("vite")) bundler = "vite";
  else if (has("parcel")) bundler = "parcel";
  else if (has("webpack")) bundler = "webpack";
  else if (has("esbuild")) bundler = "esbuild";

  let styling = "hand-rolled css";
  if (has("tailwindcss")) styling = "tailwind";
  else if (has("styled-components")) styling = "styled-components";
  else if (has("@emotion/react")) styling = "emotion";

  return { framework, language, bundler, styling };
}

/// Vote the app's language by counting hand-written `.ts(x)` vs `.js(x)` source,
/// excluding edge glue (`functions/`) and build tooling (`scripts/`) so a lone
/// TypeScript Worker/Pages-Function does not flip a vanilla-JS app to "typescript".
function detectLanguage(dir) {
  let ts = 0;
  let js = 0;
  for (const f of walkSource(dir)) {
    const rel = f.slice(dir.length + 1);
    if (rel.startsWith("functions/") || rel.startsWith("scripts/")) continue;
    if (/\.tsx?$/.test(f)) ts += 1;
    else if (/\.[cm]?jsx?$/.test(f)) js += 1;
  }
  if (ts === 0 && js === 0) return existsSync(join(dir, "tsconfig.json")) ? "typescript" : "javascript";
  return ts >= js ? "typescript" : "javascript";
}

/// Heuristic seed only — the authoritative `dataStrategy` is a review field in
/// the manifest (a build script can be non-functional, and build-time PokéAPI
/// calls are not a runtime proxy). Used by add-submission.mjs to pre-fill a guess.
function detectDataStrategy(dir) {
  const scriptsDir = join(dir, "scripts");
  const buildsData =
    existsSync(scriptsDir) &&
    readdirSync(scriptsDir).some((f) => /build.*(data|index|move|dex)/i.test(f));
  const hasStaticData = existsSync(join(dir, "public", "data"));
  const runtimeProxy =
    existsSync(join(dir, "functions")) ||
    grepAny(dir, /run_worker_first|\/api\/v2/i);
  const prebuilt = buildsData || hasStaticData;
  const runtime = runtimeProxy ? "edge-proxy" : "live-api";
  return prebuilt ? `prebuilt-static + ${runtime}` : runtime;
}

export { detectDataStrategy };

function grepAny(dir, re) {
  let n = 0;
  for (const f of walkSource(dir)) {
    if (n++ > 400) break;
    try {
      if (re.test(readFileSync(f, "utf8"))) return true;
    } catch {}
  }
  const wrangler = join(dir, "wrangler.jsonc");
  if (existsSync(wrangler) && re.test(readFileSync(wrangler, "utf8"))) return true;
  return false;
}

/// Compute the objective, deterministic metrics for a single submission
/// directory. Judgment-based fields (`dataStrategy`, feature coverage,
/// assessment) live in the manifest and are filled by review, not here —
/// so a re-run of compute-metrics never clobbers them.
export function analyzeSubmission(dir) {
  const pkg = readPkg(dir);
  const { loc, files, bytes } = countLines(dir);
  const stack = detectStack(dir, pkg);
  return {
    metrics: {
      sourceLoc: loc,
      sourceFiles: files,
      sourceBytes: bytes,
      dependencies: Object.keys(pkg?.dependencies || {}).length,
      devDependencies: Object.keys(pkg?.devDependencies || {}).length,
    },
    stack,
  };
}
