# Running a benchmark

The benchmark is a loop: **run → ingest → grade → regenerate.** A new model runs the same one-shot [brief](../THE_BRIEF.md), builds and deploys its own Pokédex fully autonomously, then gets scored and folded into the leaderboard.

## 1. Run — the model builds it

Hand a model the canonical prompt and let it work autonomously via [opencode](https://opencode.ai) (it uses `gh` and `wrangler` itself to create a repo and deploy to Cloudflare — provisioning is part of the test):

```bash
node scripts/run-benchmark.mjs --model <provider/model> --name <token> [--variant <effort>]
```

- `--model` — an opencode model id (`opencode models` to list), e.g. `opencode/deepseek-v4-flash-free`, `xai/grok-...`.
- `--name` — the repo name token; the model is told to *"call it `pokedex-<name>`"*. Encode model + effort, e.g. `deepseek-v4-flash`, `sonnet-5-high`.
- `--variant` — provider reasoning effort passed through to opencode (`high`, `max`, `minimal`).

The prompt is read verbatim from `submissions.json` (only the name token is substituted). The run is fully autonomous (`opencode --auto`). Example — the free DeepSeek:

```bash
node scripts/run-benchmark.mjs --model opencode/deepseek-v4-flash-free --name deepseek-v4-flash
```

When it finishes, the model will have created `pokedex-<name>` on GitHub and deployed it. Sanity-check the deployment before ingesting — a run that failed to deploy is itself a (low) result, but note it.

> This is how the current submissions were produced (each on a stable, tool-enabled agent). The name token is the *only* per-run change to the prompt — see [methodology](methodology.md).

## 2. Ingest — vendor the source

```bash
node scripts/add-submission.mjs https://github.com/<owner>/pokedex-<name> \
  --model "<Name>" --effort <level> --provider <p> --date <YYYY-MM-DD>
```

Clones the repo, copies **source only** into `submissions/<id>/` (stripping `node_modules`, build output, and generated data > 2 MB), auto-detects the live URL and stack, computes metrics, and appends a manifest entry with empty grades. Run it with no args for all flags.

## 3. Grade — score depth + craft

Scoring is pinned in [`grading/PROMPT.md`](../grading/PROMPT.md) + [`grading/schema.json`](../grading/schema.json) so it's reproducible, not re-invented. `scripts/grade.mjs` handles prompt assembly, validation, and merge; the judgment can come from either grader:

**Claude Code session (recommended — how the current set was scored).** Richest and adversarially verified:

```bash
node scripts/grade.mjs --submission <id>          # writes grading/prompts/<id>.md
```

Hand that prompt to an agent (in this project, ask Claude to grade `<id>` against it — ideally with an independent verification pass), then merge its JSON:

```bash
node scripts/grade.mjs --submission <id> --merge <grader-output.json>
```

**Autonomous via opencode (single pass).** Fully hands-off, uses a judge model:

```bash
node scripts/grade.mjs --submission <id> --model <judge-model>
```

`grade.mjs` rejects any output that isn't all 30 features graded 0–3 with the four 0–10 axes (see [RUBRIC.md](../RUBRIC.md) for what the grades mean). Grade against the vendored source, not the README; a Claude Code session can run the two-pass grade-then-adversarially-verify flow that produced the committed scores.

## 4. Regenerate and validate

```bash
node scripts/compute-metrics.mjs   # refresh objective metrics
node scripts/gen-entries.mjs       # per-submission ENTRY.md scorecards
node scripts/gen-readme.mjs        # rebuild leaderboard + depth matrix
node scripts/validate.mjs          # must pass before committing
```

`validate.mjs` fails if the manifest is malformed or `README.md` is stale, so CI stays honest. Commit the vendored source, the manifest change, the generated `ENTRY.md`, and the regenerated `README.md` together.

## Calibration

Grades are LLM-judged, so scale can drift between sessions. To keep a new submission comparable to the existing seven, grade it in the same pass/session as at least one already-graded submission, or re-grade the whole set together when adding several at once. The feature checklist never moves — only the grades — which keeps columns stable.
