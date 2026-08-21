import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { render, loadAndRender } from "../scripts/gen-readme.mjs";
import { analyzeSubmission, detectDataStrategy, vendorHash } from "../scripts/lib/analyze.mjs";
import { JUDGE_FLAGS, SANDBOX } from "../scripts/lib/judge.mjs";

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

test("vendorHash is stable, order-independent, and content-sensitive", () => {
  const dir = join(ROOT, "submissions", "ox-alpha-max");
  const before = vendorHash(dir);
  assert.equal(before, vendorHash(dir));
  assert.match(before, /^sha256:[0-9a-f]{64}$/);

  const probe = join(dir, "vendor-hash-probe.tmp");
  writeFileSync(probe, "a stray file a grading agent left behind");
  try {
    assert.notEqual(vendorHash(dir), before, "a stray file must change the hash");
  } finally {
    rmSync(probe);
  }
  assert.equal(vendorHash(dir), before, "removing it must restore the hash");
});

test("every submission's vendored source matches its recorded hash", () => {
  for (const s of manifest.submissions) {
    assert.ok(s.vendorHash, `${s.id}: missing vendorHash`);
    assert.equal(
      vendorHash(join(ROOT, "submissions", s.id)),
      s.vendorHash,
      `${s.id}: vendored source changed since ingest`,
    );
  }
});

test("the generated ENTRY.md is excluded from the vendor hash", () => {
  const dir = join(ROOT, "submissions", "ox-alpha-max");
  const entry = join(dir, "ENTRY.md");
  const original = readFileSync(entry, "utf8");
  const before = vendorHash(dir);
  writeFileSync(entry, original + "\nregenerated\n");
  try {
    assert.equal(vendorHash(dir), before);
  } finally {
    writeFileSync(entry, original);
  }
});

test("judge flags keep the operator's settings and memory out of grading", () => {
  assert.equal(
    JUDGE_FLAGS[JUDGE_FLAGS.indexOf("--setting-sources") + 1],
    "",
    "an empty --setting-sources is what drops the operator's CLAUDE.md and hooks",
  );
  for (const tool of ["Edit", "Write", "NotebookEdit"]) assert.ok(JUDGE_FLAGS.includes(tool));
  assert.ok(JUDGE_FLAGS.includes("--no-session-persistence"));
});

test("judges are pointed at the sandbox, never at the working repo", () => {
  assert.notEqual(SANDBOX, ROOT);
  assert.ok(!SANDBOX.startsWith(ROOT), "the sandbox must live outside the repo");
});
