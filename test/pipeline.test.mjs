import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { render, loadAndRender } from "../scripts/gen-readme.mjs";
import { analyzeSubmission, detectDataStrategy } from "../scripts/lib/analyze.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "submissions.json"), "utf8"));
const checklist = JSON.parse(readFileSync(join(ROOT, "docs", "feature-checklist.json"), "utf8"));

test("render is deterministic", () => {
  assert.equal(render(manifest, checklist), render(manifest, checklist));
});

test("README.md on disk is in sync with the generator", () => {
  const disk = readFileSync(join(ROOT, "README.md"), "utf8");
  assert.equal(disk, loadAndRender().text, "run: node scripts/gen-readme.mjs");
});

test("leaderboard is ordered by descending Bench", () => {
  const rows = render(manifest, checklist)
    .split("\n")
    .filter((l) => /^\| (🥇|🥈|🥉|\d)/.test(l))
    .map((l) => parseFloat(l.match(/\*\*(\d+\.\d)\*\*/)[1]));
  const sorted = [...rows].sort((a, b) => b - a);
  assert.deepEqual(rows, sorted, "leaderboard rows must be sorted by Bench");
});

test("analyzeSubmission detects the grok stack from vendored source", () => {
  const a = analyzeSubmission(join(ROOT, "submissions", "grok"));
  assert.equal(a.stack.framework, "react");
  assert.equal(a.stack.language, "typescript");
  assert.ok(a.metrics.sourceLoc > 0);
  assert.ok(a.metrics.sourceFiles > 0);
});

test("detectDataStrategy returns a known shape", () => {
  const ds = detectDataStrategy(join(ROOT, "submissions", "grok"));
  assert.ok(/prebuilt-static|edge-proxy|live-api/.test(ds));
});
