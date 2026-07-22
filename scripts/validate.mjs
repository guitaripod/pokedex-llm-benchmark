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
const config = JSON.parse(readFileSync(join(ROOT, "grading", "config.json"), "utf8"));
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
      errors.push(`${tag}: ${s.features.length} feature grades, expected ${TOTAL}`);
    for (const f of s.features) {
      if (!validIds.has(f.id)) errors.push(`${tag}: unknown feature id "${f.id}"`);
      if (!Number.isInteger(f.grade) || f.grade < 0 || f.grade > 3)
        errors.push(`${tag}: bad grade "${f.grade}" for ${f.id} (want integer 0-3)`);
    }
    const ids = new Set(s.features.map((f) => f.id));
    for (const need of validIds)
      if (!ids.has(need)) errors.push(`${tag}: feature "${need}" not graded`);

    const AXES = ["codeQuality", "architecture", "uxDesign", "robustness"];
    if (!s.scores) errors.push(`${tag}: graded features but no axis scores`);
    else
      for (const k of AXES) {
        const v = s.scores[k];
        if (typeof v !== "number" || v < 0 || v > 10)
          errors.push(`${tag}: axis "${k}" = ${v} (want number 0-10)`);
      }
    const g = s.grading;
    if (!g || !g.gradedBy || !g.gradedOn || typeof g.rubricVersion !== "number")
      errors.push(`${tag}: graded but missing grading provenance (gradedBy/gradedOn/rubricVersion)`);
    else if (g.rubricVersion !== config.rubricVersion)
      errors.push(`${tag}: graded under rubric v${g.rubricVersion} but current is v${config.rubricVersion} (grading/config.json) — re-grade or bump`);
  }
  const pv = s.provenance;
  if (!pv || typeof pv.oneShot !== "boolean" || typeof pv.autonomous !== "boolean" || !pv.verified)
    errors.push(`${tag}: incomplete provenance (need oneShot / autonomous / verified)`);
}

if (typeof config.rubricVersion !== "number")
  errors.push("grading/config.json: missing numeric rubricVersion");

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
