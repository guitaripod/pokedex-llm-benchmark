# Rubric

How submissions are scored. The goal is to reward **building things well**, not just building many things — an apples-to-apples read on what each model actually shipped, grounded in the source, not the README.

## The benchmark score

Each submission gets a single **Bench score, 0–100**:

```
Bench = 60% × feature-depth  +  40% × craft-axes
```

Two layers feed it, and they measure *different* things (no double-counting):

### 1. Feature depth — graded 0–3, not counted

The [30-feature checklist](docs/feature-checklist.json) defines the Pokédex feature space. Every feature is graded by **how well it's built**:

- **3 — exceptional**: deep, complete, best-in-class implementation.
- **2 — solid**: properly implemented and actually working as a user expects.
- **1 — shallow / broken**: present but thin, stubbed, truncated, hardcoded, *or* broken at runtime (throws / renders nothing). Code existing is not enough.
- **0 — absent**: no real implementation.

The **feature-depth score** is the sum of grades (0–90), normalized into the composite. Because a stub earns a 1 and an exceptional build earns a 3, **a few excellent features outscore a pile of stubs** — twelve features at 3 (36) beat thirty at 1 (30). This is the direct answer to "counting features rewards breadth over quality."

Each grade carries an **evidence** pointer (the file, and what makes it a 3 vs a 1). Grading is done in two passes — a grading pass, then an **adversarial calibration pass** that re-checks each grade against the code, downgrading oversold stubs and upgrading undersold depth. See [methodology](docs/methodology.md).

### 2. Craft axes — four orthogonal 0–10 scores

Deliberately *not* about how many features exist — they capture how the thing is made:

| Axis | Question |
|------|----------|
| **Code quality** | Structure, modularity, typing, readability; absence of rot, dead code, copy-paste. |
| **Architecture** | Soundness of the data strategy (prebuilt / live / edge-proxy), caching, build pipeline, technical decisions. |
| **UX & design** | Visual craft, interaction polish, animation/feedback, responsiveness, accessibility. |
| **Robustness** | Does it work end to end — no crashes, *correct* data & logic (dual-type matchups combined right, real branching evolutions, accurate stats), error handling, deploy health. |

Their average is the other 40% of the Bench score. **Robustness** is what separates "built a lot but crashes on load" from "smaller but works" — a broken app scores low here *and* collects grade-1s on its broken features, so it can't rank on volume alone.

## Why this shape

An earlier version scored `present | partial | absent` and a separate `completeness` axis — which both measured the same thing (how much exists) and ignored quality. This model fixes both: depth is graded, and the axes are orthogonal to coverage. Nothing in the five numbers restates another.

## Staying comparable as models are added

Grades are LLM-judged, so the risk is **drift** — the scale shifting between sessions or judges. The design keeps scores comparable without ever re-running the whole board:

- **Fixed calibration anchors.** [`grading/PROMPT.md`](grading/PROMPT.md) pins concrete reference points from already-scored submissions ("a `3` on team-builder = Fable-ultracode's; robustness `2` = Laguna, which loads then errors on the detail route"). Every judge grades against the same yardstick — calibration is static data in the repo, not a live relative computation.
- **Append-only.** Adding a model grades *only* the new submission against those anchors. Existing scores are immutable, so the leaderboard is reproducible and each addition is O(1) — never an O(N²) re-grade cascade.
- **Runtime signal.** The objective [smoke test](docs/methodology.md) result is fed to the judge to ground the `robustness` axis in what actually happens on the live site, not just a code read.
- **Versioned + provenance-stamped.** [`grading/config.json`](grading/config.json) carries a `rubricVersion`; every submission records `grading.gradedBy / gradedOn / rubricVersion`. Drift is *detectable*, and re-grading the whole set is a deliberate version bump — not an accident. Scores across different rubric versions aren't directly comparable.

## Objective metrics (context, not score)

Reported for every submission, computed by [`scripts/compute-metrics.mjs`](scripts/compute-metrics.mjs): source **LOC** and **file count** (hand-written source only), **dependency count**, detected **stack**, and **data strategy**. LOC is context, not merit — a tight vanilla entry and a sprawling React one are both legitimate answers to the brief.

## What is *not* in the score (and why)

- **Live performance / Lighthouse** — not yet measured uniformly; depends on deploy config as much as the model.
- **Exact bundle size** — requires building every heterogeneous app; left out rather than reported unevenly.

## Fairness notes

- Same verbatim prompt, data source, and platform for all — see [THE_BRIEF.md](THE_BRIEF.md).
- Grades and axes are read from source; the passes are told not to trust README claims.
- Robustness is inferred from the code (crash paths, correctness of logic); click through to the live demos to confirm — the assessment prose flags what works and what doesn't.
- Weights (60/40) live at the top of [`scripts/gen-readme.mjs`](scripts/gen-readme.mjs) and are trivially adjustable.
