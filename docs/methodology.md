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

1. **Assessment** — for each submission, an agent greps and reads the vendored source and marks all 30 checklist features `present | partial | absent`, with a file-level evidence pointer per verdict, plus the four rubric scores and a written assessment.
2. **Adversarial verification** — a second agent re-checks every `present`/`partial` claim against the code (downgrading hallucinated features) and spot-checks `absent` ones (upgrading overlooked implementations). It typically flips a handful of statuses per submission.

The corrected verdicts, scores, and prose are what land in `submissions.json`; each `ENTRY.md` is generated from them.

## Honest caveats

- **One-shot, not best-of-N.** Each submission is a single autonomous run against the [verbatim prompt](../THE_BRIEF.md) — no iteration or human course-correction. A model could do better on a second try; this measures the first, unassisted attempt.
- **The prompt is held constant**, word-for-word, except the trailing name token (`pokedex-<model>-<effort>`). This is a controlled prompt-identical trial, not a loose build-off.
- **The model self-provisions.** It uses `gh` and `wrangler` to create its own repo and deploy — so repo hygiene and a successful deploy are themselves part of what's being tested.
- **Effort labels are self-reported** from the run setup (the model's own reasoning-effort setting), not independently measured compute.
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
