# Rubric

How submissions are scored. The goal is an **apples-to-apples** comparison of what each model actually built — grounded in the source, not the README.

## Two layers

### 1. Feature coverage — the objective spine

The [30-feature checklist](docs/feature-checklist.json) defines the Pokédex feature space, distilled from the union of what the submissions attempt. Each submission is scored against **every** feature:

- **● present** — fully implemented and wired into the UI.
- **◐ partial** — started, stubbed, or half-done (e.g. a "compare" view fixed to two slots, or a type page that lists relations but isn't the interactive 18×18 grid).
- **○ absent** — no real implementation.

**Runtime-broken code is scored at most `partial`.** A feature whose source exists but throws or renders nothing on the deployed site is `partial` (built, not working) — never `present`. This is why a submission that coded many features but crashes on load can out-cover a smaller one that fully works: coverage measures *what was built*. Click through to the live demo to separate "built and works" from "built but broken"; the assessment prose calls out which is which.

Coverage is deliberately checklist-driven so it stays reproducible as models are added: the columns never move, only the marks. Ranking uses `present + 0.5 × partial`.

Each verdict carries an **evidence** pointer (the file where the feature lives), and every verdict is produced in two passes — an assessment pass, then an **adversarial verification pass** that re-checks each claim against the code to catch README-driven false positives and overlooked implementations. See [methodology](docs/methodology.md).

### 2. Assessment scores — the judgment layer

Four holistic scores, `0–10`, read off the source:

| Score | Question |
|-------|----------|
| **Completeness** | How much real Pokédex breadth and depth is actually implemented? |
| **Code quality** | Structure, readability, typing, absence of rot and dead code. |
| **Architecture** | Soundness of the data strategy, edge/caching, and build pipeline. |
| **UX polish** | Visual and interaction quality inferable from the markup, styles, and component logic. |

These are inherently subjective — treat them as a calibrated reviewer's read, not ground truth. The feature matrix is the harder currency.

## What is *not* scored (and why)

- **Live performance / Lighthouse.** Not yet measured uniformly; it depends on deploy config as much as the model. A slot exists in the manifest for when it's run across all submissions on equal footing.
- **Exact bundle size.** Requires building every heterogeneous app (and refetching PokéAPI data). The metrics script supports it; it's left out of v1 rather than reported unevenly.
- **Prompt-following nuance.** The brief intentionally under-specifies, so "did it follow instructions" collapses into completeness and the free-variable choices.

## Objective metrics (context, not score)

Reported for every submission, computed by [`scripts/compute-metrics.mjs`](scripts/compute-metrics.mjs) from the vendored source:

- **Source LOC** and **file count** — hand-written source only; generated PokéAPI data, `node_modules`, lockfiles, and build output are excluded.
- **Dependency count** (runtime + dev).
- **Detected stack** — framework, language, bundler, styling.
- **Data strategy** — prebuilt-static, edge-proxy, live-api, or a mix.

LOC is context, not merit: a tight vanilla-JS entry and a sprawling React one are both legitimate answers to the brief.

## Fairness notes

- Same brief, same data source, same platform for all — see [THE_BRIEF.md](THE_BRIEF.md).
- Effort is recorded per submission; compare same-effort entries for the cleanest model-vs-model read, and same-model/different-effort entries to isolate effort.
- The scoring pass reads source only and is told not to trust README claims.
