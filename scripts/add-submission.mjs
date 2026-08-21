#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { analyzeSubmission, detectDataStrategy, vendorHash } from "./lib/analyze.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");

const args = process.argv.slice(2);
const positional = [];
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (!args[i].startsWith("--")) positional.push(args[i]);
  else if (args[i + 1] === undefined || args[i + 1].startsWith("--")) opts[args[i].slice(2)] = true;
  else opts[args[i].slice(2)] = args[++i];
}

const repoUrl = positional[0];
if (!repoUrl || !opts.model) {
  console.error(
    "Usage: node scripts/add-submission.mjs <github-repo-url> --model <Name> [--effort <level>]\n" +
      "       [--id <slug>] [--provider <p>] [--version <v>] [--live <url>] [--platform <p>] [--date <YYYY-MM-DD>]\n" +
      "       [--verified <text>] [--not-self-provisioned]\n\n" +
      "Provenance defaults to a one-shot, autonomous, self-provisioned run verified by the harness;\n" +
      "override with --verified (e.g. \"owner-confirmed\") and --not-self-provisioned when the model\n" +
      "deployed but did not create its own repo.",
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
  ".cache", ".parcel-cache", ".DS_Store", "*.tsbuildinfo", "*.log",
]
  .map((e) => `--exclude=${e}`)
  .join(" ");
execSync(`rsync -a ${EXCLUDES} ${clone}/ ${dest}/`);

/// Every directory in the tree, deepest-first, with its size in MB.
function dirsBySize(root) {
  return execSync(`du -m -a ${root} | awk -F'\\t' '$1 > 2'`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [mb, path] = l.split("\t");
      return { mb: Number(mb), path };
    })
    .filter((d) => d.path !== root && existsSync(d.path) && statSync(d.path).isDirectory())
    .sort((a, b) => a.path.length - b.path.length);
}

/// Models vendor PokéAPI into their own repos in whatever shape they like —
/// generated JSON shards, the upstream CSV dump, sprite dumps. None of it is
/// what the model *wrote*, so strip any bulk data directory and record how to
/// get it back.
function stripBulkData(root) {
  const notes = [];
  for (const { mb, path } of dirsBySize(root)) {
    if (!existsSync(path)) continue;
    const files = execSync(`find ${path} -type f | wc -l`, { encoding: "utf8" }).trim();
    const dataFiles = execSync(
      `find ${path} -type f \\( -name '*.json' -o -name '*.csv' -o -name '*.png' -o -name '*.ogg' \\) | wc -l`,
      { encoding: "utf8" },
    ).trim();
    if (Number(files) === 0 || Number(dataFiles) / Number(files) < 0.9) continue;
    const rel = path.slice(root.length + 1);
    if (rel === "node_modules" || rel.includes("node_modules")) continue;
    rmSync(path, { recursive: true, force: true });
    notes.push(`${mb} MB of PokéAPI data (${rel}, ${files} files)`);
    console.log(`  stripped bulk data ${rel} (${mb} MB)`);
  }
  return notes.length
    ? `${notes.join(" and ")} stripped from the vendored source — it is data, not model-written code; regenerate with the submission's own build script (the original repo keeps it).`
    : undefined;
}

const dataNote = stripBulkData(dest);

const readLive = () => {
  if (opts.live) return opts.live;
  for (const f of ["README.md", "wrangler.jsonc"]) {
    const p = join(dest, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, "utf8").match(
      /https?:\/\/[^\s)"'*<>\]]*\.(?:pages|workers)\.dev[^\s)"'*<>\]]*/,
    );
    if (m) return m[0].replace(/[.,;:]+$/, "");
    const name = readFileSync(p, "utf8").match(/"name"\s*:\s*"([^"]+)"/);
    if (f.endsWith("jsonc") && name) return reachable(`https://${name[1]}.workers.dev`);
  }
  return "";
};

/// A worker name alone cannot yield the deployment URL — workers.dev subdomains
/// are account-scoped. Only accept a guessed URL if it actually answers.
function reachable(url) {
  try {
    const code = execSync(`curl -s -o /dev/null -w '%{http_code}' -m 15 ${url}`, { encoding: "utf8" }).trim();
    if (Number(code) < 400) return url;
    console.log(`  guessed live URL ${url} answered ${code} — leaving liveUrl empty, pass --live`);
  } catch {
    console.log(`  guessed live URL ${url} is unreachable — leaving liveUrl empty, pass --live`);
  }
  return "";
}

const liveUrl = readLive();
const analysis = analyzeSubmission(dest);
const entry = {
  id,
  model: opts.model,
  provider: opts.provider || "unknown",
  modelVersion: opts.version || "",
  effort,
  date: opts.date || "",
  sourceRepo: repoUrl.replace(/\.git$/, ""),
  liveUrl,
  platform: opts.platform || (liveUrl.includes(".pages.dev") ? "Cloudflare Pages" : "Cloudflare Workers"),
  ...(dataNote ? { dataNote } : {}),
  vendorHash: vendorHash(dest),
  ...analysis,
  dataStrategy: detectDataStrategy(dest),
  provenance: {
    oneShot: true,
    autonomous: true,
    selfProvisioned: !opts["not-self-provisioned"],
    verified: opts.verified || "harness (scripts/run-benchmark.mjs)",
  },
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
