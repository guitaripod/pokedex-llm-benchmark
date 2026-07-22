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

The calibrated grades, scores, and prose are what land in `submissions.json`; each `ENTRY.md` is generated from them.

## Runtime verification

The `robustness` axis can't rest on a code read alone — so [`scripts/smoke.mjs`](../scripts/smoke.mjs) loads each submission's **live deployment** in headless Chromium (Playwright) and records an objective `runtime` signal: whether the page renders real content, counts of console errors and uncaught JS exceptions, and whether a detail route navigates without new errors → a `clean | errors | broken` verdict. It's run once per submission and the result is stored in the manifest (like every other measured value); the grader is shown it so `robustness` reflects what actually happens on the site. This is what objectively separates "built but errors at runtime" (e.g. Laguna — it loads, then throws on the detail route) from "smaller but works."

## Honest caveats

- **One-shot, not best-of-N.** Each submission is a single autonomous run against the [verbatim prompt](../THE_BRIEF.md) — no iteration or human course-correction. A model could do better on a second try; this measures the first, unassisted attempt.
- **The prompt is held constant**, word-for-word, except the trailing name token (`pokedex-<model>-<effort>`). This is a controlled prompt-identical trial, not a loose build-off.
- **The model self-provisions.** It uses `gh` and `wrangler` to create its own repo and deploy — so repo hygiene and a successful deploy are themselves part of what's being tested.
- **Effort labels are self-reported and not cross-comparable.** They come from the run setup (the model's own reasoning-effort setting), not measured compute — and an Anthropic "ultracode" is not the same knob as an opencode `--variant high`. Compare same-provider/same-tool efforts (e.g. the two Fable 5 entries) for the cleanest read.
- **Provenance is recorded per submission** (`provenance`: one-shot, autonomous, self-provisioned, verified). All current entries are owner-confirmed legit one-shot runs; `deepseek-v4-flash` additionally carries the full harness trail (it deployed but did not self-create its repo, so its source was published for the record).
- **Assessment scores are subjective.** The feature matrix is the reproducible layer; the 0–10 scores are a calibrated reviewer's read.
- **No live performance numbers yet.** Perf/bundle depend on deploy config; a uniform pass is future work (the manifest has room for it).
- **Dates** are the repo's build/push date, a proxy for when the run happened — not a controlled release timeline.

## Reproducing

```bash
node scripts/compute-metrics.mjs   # metrics from vendored source
node scripts/gen-entries.mjs       # per-submission ENTRY.md scorecards
node scripts/gen-readme.mjs        # README from submissions.json
node scripts/validate.mjs          # manifest sanity + README-in-sync
```
