#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { analyzeSubmission, detectDataStrategy } from "./lib/analyze.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");

const args = process.argv.slice(2);
const positional = [];
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);
}

const repoUrl = positional[0];
if (!repoUrl || !opts.model) {
  console.error(
    "Usage: node scripts/add-submission.mjs <github-repo-url> --model <Name> [--effort <level>]\n" +
      "       [--id <slug>] [--provider <p>] [--version <v>] [--live <url>] [--platform <p>] [--date <YYYY-MM-DD>]",
  );
  process.exit(1);
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const effort = opts.effort || "default";
const id =
  opts.id ||
  slug(`${opts.model}${effort !== "default" ? `-${effort}` : ""}`);
const dest = join(ROOT, "submissions", id);

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
if (manifest.submissions.some((s) => s.id === id)) {
  console.error(`! submission id "${id}" already exists. Pass a distinct --id.`);
  process.exit(1);
}

console.log(`→ cloning ${repoUrl}`);
const tmp = mkdtempSync(join(tmpdir(), "pkdx-"));
const clone = join(tmp, "repo");
execSync(`git clone --depth 1 -q ${repoUrl} ${clone}`, { stdio: "inherit" });

console.log(`→ vendoring source-only into submissions/${id}`);
rmSync(dest, { recursive: true, force: true });
const EXCLUDES = [
  ".git", "node_modules", "dist", "build", ".wrangler",
  ".cache", ".parcel-cache", ".DS_Store",
]
  .map((e) => `--exclude=${e}`)
  .join(" ");
execSync(`rsync -a ${EXCLUDES} ${clone}/ ${dest}/`);

let dataNote;
const dataDir = join(dest, "public", "data");
if (existsSync(dataDir)) {
  const mb = Number(execSync(`du -sm ${dataDir}`).toString().split("\t")[0]);
  if (mb > 2) {
    const files = execSync(`find ${dataDir} -type f | wc -l`).toString().trim();
    rmSync(dataDir, { recursive: true, force: true });
    dataNote = `${mb} MB of generated PokéAPI JSON (public/data, ${files} files) stripped from the vendored source; regenerate with the submission's build script.`;
    console.log(`  stripped generated public/data (${mb} MB)`);
  }
}

const readLive = () => {
  if (opts.live) return opts.live;
  for (const f of ["README.md", "wrangler.jsonc"]) {
    const p = join(dest, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, "utf8").match(
      /https?:\/\/[^\s)"']*\.(?:pages|workers)\.dev[^\s)"']*/,
    );
    if (m) return m[0];
    const name = readFileSync(p, "utf8").match(/"name"\s*:\s*"([^"]+)"/);
    if (f.endsWith("jsonc") && name) return `https://${name[1]}.workers.dev`;
  }
  return "";
};

const analysis = analyzeSubmission(dest);
const entry = {
  id,
  model: opts.model,
  provider: opts.provider || "unknown",
  modelVersion: opts.version || "",
  effort,
  date: opts.date || "",
  sourceRepo: repoUrl.replace(/\.git$/, ""),
  liveUrl: readLive(),
  platform: opts.platform || "Cloudflare Workers",
  ...(dataNote ? { dataNote } : {}),
  ...analysis,
  dataStrategy: detectDataStrategy(dest),
  features: [],
  scores: null,
  assessment: null,
};
manifest.submissions.push(entry);
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
rmSync(tmp, { recursive: true, force: true });

console.log(`\n✓ Added "${id}" (${analysis.metrics.sourceLoc} LOC, ${analysis.stack.framework}/${analysis.stack.language}).`);
console.log("\nNext:");
console.log(`  1. Score it against docs/feature-checklist.json → fill "features", "scores", "assessment" for "${id}" in submissions.json`);
console.log(`  2. node scripts/gen-entries.mjs && node scripts/gen-readme.mjs && node scripts/validate.mjs`);
console.log("\nSee docs/running-a-benchmark.md for the full flow.");
