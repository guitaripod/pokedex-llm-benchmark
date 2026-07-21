#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAndRender } from "./gen-readme.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "submissions.json"), "utf8"));
const checklist = JSON.parse(
  readFileSync(join(ROOT, "docs", "feature-checklist.json"), "utf8"),
);
const validIds = new Set(
  checklist.categories.flatMap((c) => c.features.map((f) => f.id)),
);
const TOTAL = validIds.size;

const errors = [];
const seen = new Set();
const REQUIRED = ["id", "model", "provider", "effort", "date", "sourceRepo", "liveUrl", "platform"];

for (const s of manifest.submissions) {
  const tag = s.id || "(missing id)";
  if (seen.has(s.id)) errors.push(`${tag}: duplicate id`);
  seen.add(s.id);
  for (const k of REQUIRED) {
    if (!s[k]) errors.push(`${tag}: missing "${k}"`);
  }
  if (!s.metrics) errors.push(`${tag}: missing metrics (run compute-metrics.mjs)`);
  if (s.features && s.features.length) {
    if (s.features.length !== TOTAL)
      errors.push(`${tag}: ${s.features.length} feature verdicts, expected ${TOTAL}`);
    for (const f of s.features) {
      if (!validIds.has(f.id)) errors.push(`${tag}: unknown feature id "${f.id}"`);
      if (!["present", "partial", "absent"].includes(f.status))
        errors.push(`${tag}: bad status "${f.status}" for ${f.id}`);
    }
    const ids = new Set(s.features.map((f) => f.id));
    for (const need of validIds)
      if (!ids.has(need)) errors.push(`${tag}: feature "${need}" not scored`);
  }
}

const current = readFileSync(join(ROOT, "README.md"), "utf8");
if (current !== loadAndRender().text) {
  errors.push("README.md is out of sync — run `node scripts/gen-readme.mjs`");
}

if (errors.length) {
  console.error("✗ validation failed:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ manifest valid — ${manifest.submissions.length} submissions, ${TOTAL}-feature checklist, README in sync.`,
);
