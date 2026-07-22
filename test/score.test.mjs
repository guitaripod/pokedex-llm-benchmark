import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bench, featureDepth, solidCount, maxDepth, totalFeatures, axesAvg, isScored, gradeOf,
} from "../scripts/lib/score.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const checklist = JSON.parse(readFileSync(join(ROOT, "docs", "feature-checklist.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(ROOT, "submissions.json"), "utf8"));

const synth = (grade, axis) => ({
  features: checklist.categories.flatMap((c) => c.features.map((f) => ({ id: f.id, grade }))),
  scores: { codeQuality: axis, architecture: axis, uxDesign: axis, robustness: axis },
});

test("checklist shape: 30 features, max depth 90", () => {
  assert.equal(totalFeatures(checklist), 30);
  assert.equal(maxDepth(checklist), 90);
});

test("feature depth sums grades", () => {
  assert.equal(featureDepth(synth(2, 5), checklist), 60);
  assert.equal(featureDepth(synth(0, 0), checklist), 0);
  assert.equal(featureDepth(synth(3, 10), checklist), 90);
});

test("solid count = features graded >= 2", () => {
  assert.equal(solidCount(synth(2, 5), checklist), 30);
  assert.equal(solidCount(synth(1, 5), checklist), 0);
});

test("bench = 60% depth + 40% axes", () => {
  assert.equal(bench(synth(3, 10), checklist), 100); // 0.6*100 + 0.4*100
  assert.equal(bench(synth(0, 0), checklist), 0);
  assert.ok(Math.abs(bench(synth(2, 5), checklist) - 60) < 1e-9); // 0.6*66.67 + 0.4*50
});

test("unscored submissions return null", () => {
  assert.equal(isScored({ features: [] }), false);
  assert.equal(bench({ features: [] }, checklist), null);
  assert.equal(axesAvg({}), null);
});

test("gradeOf defaults missing feature to 0", () => {
  assert.equal(gradeOf({ features: [] }, "national-dex"), 0);
  assert.equal(gradeOf({ features: [{ id: "search", grade: 3 }] }, "search"), 3);
});

test("real manifest: Fable-5-ultracode benches 90.0", () => {
  const sub = manifest.submissions.find((s) => s.id === "fable-5-ultracode");
  assert.ok(Math.abs(bench(sub, checklist) - 90.0) < 0.05);
});

test("real manifest: every scored submission's bench is 0-100 and grades are 0-3", () => {
  for (const s of manifest.submissions) {
    if (!isScored(s)) continue;
    const b = bench(s, checklist);
    assert.ok(b >= 0 && b <= 100, `${s.id} bench ${b} out of range`);
    for (const f of s.features) assert.ok([0, 1, 2, 3].includes(f.grade), `${s.id}/${f.id} grade ${f.grade}`);
  }
});
