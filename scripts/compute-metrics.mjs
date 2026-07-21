#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeSubmission } from "./lib/analyze.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

for (const sub of manifest.submissions) {
  const dir = join(ROOT, "submissions", sub.id);
  if (!existsSync(dir)) {
    console.warn(`! ${sub.id}: no vendored source at ${dir}, skipping`);
    continue;
  }
  const analysis = analyzeSubmission(dir);
  sub.metrics = analysis.metrics;
  sub.stack = analysis.stack;
  const m = analysis.metrics;
  console.log(
    `✓ ${sub.id.padEnd(20)} ${String(m.sourceLoc).padStart(6)} LOC  ` +
      `${String(m.sourceFiles).padStart(3)} files  ` +
      `${String(m.dependencies).padStart(2)}+${m.devDependencies} deps  ` +
      `[${analysis.stack.framework}/${analysis.stack.language}]`,
  );
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nUpdated ${MANIFEST}`);
