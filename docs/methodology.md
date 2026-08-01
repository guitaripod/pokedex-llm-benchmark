# Methodology

How the data in this repo was gathered, and the caveats that keep it honest.

## Provenance

Each submission was built as a standalone project in its own GitHub repo and deployed to Cloudflare (Pages or Workers). This benchmark repo **vendors the source** of each into [`submissions/<id>/`](../submissions/) and links back to the canonical repo and the live deployment. The originals are untouched — they remain the source of record for full git history.

### What is vendored

Source only. Excluded when copying:

- `node_modules/`, `dist/`, `build/`, `.wrangler/`, `.cache/` — dependencies and build output.
- Generated PokéAPI data over 2 MB (e.g. `fable-5-ultracode` shipped 23 MB / 2,263 JSON files). It is regenerable from each submission's own build script and is noted in the manifest's `dataNote`. Small committed data is kept so those submissions remain runnable as-is.

This keeps the whole repo a few MB while preserving exactly what each model *wrote*.

## Metrics

[`scripts/compute-metrics.mjs`](../scripts/compute-metrics.mjs) walks each vendored tree ([`scripts/lib/analyze.mjs`](../scripts/lib/analyze.mjs)) and derives LOC, file count, dependency counts, detected stack, and data strategy. It counts only source extensions (`.ts/.tsx/.js/.jsx/.mjs/.css/.html/...`), skipping lockfiles, `node_modules`, build output, and `public/data`. It is deterministic — re-running reproduces the numbers.

## Feature scoring

Two passes, both reading source (not the README, which oversells):

1. **Grading** — for each submission, an agent greps and reads the vendored source and grades all 30 checklist features `0–3` by depth (absent → shallow/broken → solid → exceptional), with a file-level evidence pointer per grade, plus the four craft axes and a written assessment.
2. **Adversarial calibration** — a second agent re-checks every grade against the code: downgrading stubs/truncations/broken features that were called solid, upgrading genuinely deep work that was undersold, and sanity-checking the axis scores (especially robustness against any crash/correctness issues). It typically adjusts a handful of grades per submission.

3. **Independent audit + adjudication** (added for the two Opus 5 entries) — the calibration pass can rubber-stamp: on both Opus 5 submissions it returned the first pass essentially unchanged, and on one it left 22 features graded `3`. So a third stage runs a fan-out of ten independent agents (five feature groups, four craft axes, one core-logic correctness check) whose brief is to *refute* each grade against the source and the live deployment; every dispute then goes back to the judge, which verifies the auditor's specific claims and sets the final grade. The judge rejects disputes where the auditor is wrong, so this is adjudication, not a second opinion winning by default. Assemble the prompts with `scripts/grade.mjs --verify` and `--adjudicate`.

The calibrated grades, scores, and prose are what land in `submissions.json`; each `ENTRY.md` is generated from them.

**Every submission on the board has been through all three passes, by one judge, under rubric v2.** The audit stage was introduced with the Opus 5 entries; grading only those two with it would have made the leaderboard a comparison of grading rigor rather than of Pokédexes, so `rubricVersion` was bumped and all nine were re-graded together. It moved every entry down — the leader went 81 → 66 on feature depth, the field average fell ~11 points — because the v1 calibration pass had been approving `3`s for implementations that are merely correct and complete. Ordering changed too, so v1 and v2 scores are not comparable; that is what the version bump means.

## Runtime verification

The `robustness` axis can't rest on a code read alone — so [`scripts/smoke.mjs`](../scripts/smoke.mjs) loads each submission's **live deployment** in headless Chromium (Playwright) and records an objective `runtime` signal: whether the page renders real content, counts of console errors and uncaught JS exceptions, and whether a detail route navigates without new errors → a `clean | errors | broken` verdict. It's run once per submission and the result is stored in the manifest (like every other measured value); the grader is shown it so `robustness` reflects what actually happens on the site. This is what objectively separates "built but errors at runtime" (e.g. Laguna — it loads, then throws on the detail route) from "smaller but works."

It also measures **`dexReach`**: it finds the browse route, scrolls it to exhaustion, and counts the distinct species a user can actually reach. A Pokédex can throw zero errors and still hand you a fraction of the dex — `opus-5-low` looks clean by every other signal but stops at 60 of 1025 because its infinite-scroll observer attaches before the sentinel mounts, while `opus-5-ultracode` reaches all 1025 through a virtualized grid. Console-error counting cannot see that difference; this can, and it feeds both the `national-dex` grade and `robustness`.

## Honest caveats

- **One-shot, not best-of-N.** Each submission is a single autonomous run against the [verbatim prompt](../THE_BRIEF.md) — no iteration or human course-correction. A model could do better on a second try; this measures the first, unassisted attempt.
- **The prompt is held constant**, word-for-word, except the trailing name token (`pokedex-<model>-<effort>`). This is a controlled prompt-identical trial, not a loose build-off.
- **The model self-provisions.** It uses `gh` and `wrangler` to create its own repo and deploy — so repo hygiene and a successful deploy are themselves part of what's being tested.
- **Effort labels are self-reported and not cross-comparable.** They come from the run setup (the model's own reasoning-effort setting), not measured compute — and an Anthropic "ultracode" is not the same knob as an opencode `--variant high`. Compare same-provider/same-tool efforts (e.g. the two Fable 5 entries) for the cleanest read.
- **Provenance is recorded per submission** (`provenance`: one-shot, autonomous, self-provisioned, verified). All current entries are owner-confirmed legit one-shot runs; `deepseek-v4-flash` and `gpt-5-6-luna-max` additionally carry the full harness trail (both deployed but did not self-create a repo, so their source was published for the record — verbatim, as the run left it).
- **Assessment scores are subjective.** The feature matrix is the reproducible layer; the 0–10 scores are a calibrated reviewer's read.
- **The judge and two entries share a model family.** All nine v2 grades come from one judge, Opus 5 — which also built two of the submissions. That is a real self-preference risk, and it is the reason the audit stage exists; in practice the audit cut those two harder than most of the field (89 → 74 and 65 → 54 on feature depth). Cross-check: `opus-5-low` was also graded end-to-end by Opus 4.8, which landed on feature depth 64 against Opus 5's 65 on the same pass, so the two judges agree closely before the audit.
- **A recorded deployment can drift away from its submission.** `grok`'s Pages project stopped serving its submission at some point (none of the commits deployed there exist in its repo), which silently invalidated its runtime signal. [`scripts/verify-live.mjs`](../scripts/verify-live.mjs) now fingerprints every live URL against the vendored source and fails if they diverge; `grok`'s runtime is measured against a local production build of its own source instead, stamped `runtime.measuredOn`.
- **No live performance numbers yet.** Perf/bundle depend on deploy config; a uniform pass is future work (the manifest has room for it).
- **Dates** are the repo's build/push date, a proxy for when the run happened — not a controlled release timeline.

## Reproducing

```bash
node scripts/compute-metrics.mjs   # metrics from vendored source
node scripts/gen-entries.mjs       # per-submission ENTRY.md scorecards
node scripts/gen-readme.mjs        # README from submissions.json
node scripts/validate.mjs          # manifest sanity + README-in-sync
```
