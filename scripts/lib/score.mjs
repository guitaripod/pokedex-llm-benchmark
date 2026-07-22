/// Pure scoring math — the single source of truth for feature depth, craft
/// axes, and the composite Bench score. Imported by gen-readme, gen-entries,
/// and the tests so the numbers can never diverge between them.

// Composite weighting: how much Bench leans on graded feature depth vs. the
// four craft/robustness axes. Change here and every table follows.
export const COVERAGE_WEIGHT = 0.6;
export const AXES_WEIGHT = 0.4;
export const AXIS_KEYS = ["codeQuality", "architecture", "uxDesign", "robustness"];

export const totalFeatures = (checklist) =>
  checklist.categories.reduce((n, c) => n + c.features.length, 0);
export const maxDepth = (checklist) => totalFeatures(checklist) * 3;

export const gradeOf = (sub, fid) => {
  const f = (sub.features || []).find((x) => x.id === fid);
  return f && typeof f.grade === "number" ? f.grade : 0;
};

export const isScored = (sub) => !!(sub.features && sub.features.length && sub.scores);

export function featureDepth(sub, checklist) {
  let sum = 0;
  for (const c of checklist.categories) for (const f of c.features) sum += gradeOf(sub, f.id);
  return sum;
}

export function solidCount(sub, checklist) {
  let n = 0;
  for (const c of checklist.categories) for (const f of c.features) if (gradeOf(sub, f.id) >= 2) n += 1;
  return n;
}

export const axesAvg = (sub) =>
  isScored(sub) ? AXIS_KEYS.reduce((a, k) => a + sub.scores[k], 0) / AXIS_KEYS.length : null;

export function bench(sub, checklist) {
  if (!isScored(sub)) return null;
  const cov = (featureDepth(sub, checklist) / maxDepth(checklist)) * 100;
  const ax = axesAvg(sub) * 10;
  return COVERAGE_WEIGHT * cov + AXES_WEIGHT * ax;
}
