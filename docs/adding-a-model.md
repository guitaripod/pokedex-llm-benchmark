# Adding a model

The benchmark is built to grow. Each new model runs the same [brief](../THE_BRIEF.md), ships its own repo + Cloudflare deployment, then gets folded in here.

## 1. Vendor it

```bash
node scripts/add-submission.mjs https://github.com/<you>/<repo> \
  --model "Claude Sonnet 5" --effort high \
  --provider Anthropic --version 5 --date 2026-08-01
```

This clones the repo, copies **source only** into `submissions/<id>/` (stripping `node_modules`, build output, and generated data > 2 MB), auto-detects the live URL and stack, computes metrics, and appends a manifest entry with empty `features`/`scores`/`assessment`.

`--id` is derived from model + effort (e.g. `sonnet-5-high`); pass `--id` to override. Run `node scripts/add-submission.mjs` with no args for all flags.

## 2. Grade it against the checklist

Fill the new entry in [`submissions.json`](../submissions.json), reading the vendored source (not the README):

- **`features`** — one grade per id in [`docs/feature-checklist.json`](feature-checklist.json), each `{ "id", "grade": 0-3, "evidence": "<file + what makes it that grade>" }`. All 30 must be graded (0 absent, 1 shallow/broken, 2 solid, 3 exceptional).
- **`scores`** — `{ codeQuality, architecture, uxDesign, robustness }`, each 0–10 (see [RUBRIC.md](../RUBRIC.md)).
- **`assessment`** — `{ summary, strengths[], weaknesses[], standout }`.

Judge depth, not presence, against the actual handler/component, and calibrate against the existing submissions so grades mean the same thing across the field — the scoring is source-grounded and adversarially calibrated. See any existing entry as a template.

## 3. Regenerate and validate

Everything downstream of the manifest is generated — you never hand-edit tables or scorecards:

```bash
node scripts/compute-metrics.mjs   # refresh objective metrics
node scripts/gen-entries.mjs       # write submissions/<id>/ENTRY.md scorecards
node scripts/gen-readme.mjs        # rebuild the leaderboard + matrix
node scripts/validate.mjs          # must pass before committing
```

`validate.mjs` fails if the manifest is malformed or `README.md` is stale, so CI stays honest. Commit the vendored source, the manifest change, the generated `ENTRY.md`, and the regenerated `README.md` together.
