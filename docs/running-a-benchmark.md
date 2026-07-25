# Running a benchmark

The benchmark is a loop: **run → ingest → grade → regenerate.** A new model runs the same one-shot [brief](../THE_BRIEF.md), builds and deploys its own Pokédex fully autonomously, then gets scored and folded into the leaderboard.

> **TL;DR — the easy way.** Open a Claude Code session in this repo and say: *"benchmark `<model-id>`"* (list opencode ids with `opencode models`, e.g. `opencode/deepseek-v4-flash-free`; Anthropic models run on Claude Code, e.g. `claude-opus-5`). **The agent will ask you which variant/effort to run** (model default, `high`, `max`, `ultracode`, … — or two efforts to compare, like the Fable 5 low-vs-ultracode pair) before it launches, since effort materially changes the result. It then runs every step below — the autonomous build, ingest, two-pass grade, regenerate, and commit. The manual four steps follow for when you're not in a session.

## 1. Run — the model builds it

Hand a model the canonical prompt and let it work autonomously (it uses `gh` and `wrangler` itself to create a repo and deploy to Cloudflare — provisioning is part of the test):

```bash
node scripts/run-benchmark.mjs --model <model> --name <token> [--runner opencode|claude] [--variant <effort>]
```

- `--model` — the model id. Prefixed ids run on [opencode](https://opencode.ai) (`opencode models` to list), e.g. `opencode/deepseek-v4-flash-free`, `xai/grok-...`; bare Anthropic ids run on Claude Code, e.g. `claude-opus-5`, `claude-fable-5`.
- `--name` — the repo name token; the model is told to *"call it `pokedex-<name>`"*. Encode model + effort, e.g. `deepseek-v4-flash`, `opus-5-ultracode`.
- `--runner` — which agent harness drives the run. Inferred from the model id (a `/` means opencode), so you rarely pass it.
- `--variant` — reasoning effort passed through to the runner: opencode takes `high` / `max` / `minimal`, Claude Code takes `low` / `medium` / `high` / `xhigh` / `max` / `ultracode`.

The prompt is read verbatim from `submissions.json` (only the name token is substituted). The run is fully autonomous — `opencode --auto`, or `claude -p --dangerously-skip-permissions` for the Claude Code runner, which also writes a full stream-json transcript next to the build dir so a background run stays tailable. Examples:

```bash
node scripts/run-benchmark.mjs --model opencode/deepseek-v4-flash-free --name deepseek-v4-flash
node scripts/run-benchmark.mjs --model claude-opus-5 --name opus-5-ultracode --variant ultracode
```

When it finishes, the model will have created `pokedex-<name>` on GitHub and deployed it. Sanity-check the deployment before ingesting — a run that failed to deploy is itself a (low) result, but note it.

> This is how the current submissions were produced (each on a stable, tool-enabled agent — the Anthropic entries through the Claude Code runner, the rest through opencode). The name token is the *only* per-run change to the prompt — see [methodology](methodology.md).

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
node scripts/grade.mjs --submission <id>                              # 1. grade      → grading/prompts/<id>.md
node scripts/grade.mjs --submission <id> --verify pass1.json          # 2. calibrate  → <id>-verify.md
node scripts/grade.mjs --submission <id> --adjudicate audit.json \
                       --entry pass2.json                             # 3. adjudicate → <id>-adjudicate.md
node scripts/grade.mjs --submission <id> --merge final.json           # merge the result
```

Hand each prompt to the judge in turn and feed its JSON to the next step. Pass 2 alone is not enough — on both Opus 5 entries it returned pass 1 nearly unchanged. Pass 3 takes an **audit** file (`{contested, axes, logic}`: independent agents that read the source and try to refute each grade) and makes the judge rule on every dispute.

**Autonomous via opencode (two-pass).** Fully hands-off — grades, then adversarially verifies, with a judge model:

```bash
node scripts/grade.mjs --submission <id> --model <judge-model>
```

`grade.mjs` rejects any output that isn't all 30 features graded 0–3 with the four 0–10 axes (see [RUBRIC.md](../RUBRIC.md) for what the grades mean), and on merge it stamps `grading.gradedBy / gradedOn / rubricVersion`. Grade against the vendored source, not the README.

## 4. Regenerate and validate

```bash
node scripts/compute-metrics.mjs   # refresh objective metrics
node scripts/gen-entries.mjs       # per-submission ENTRY.md scorecards
node scripts/gen-readme.mjs        # rebuild leaderboard + depth matrix
node scripts/validate.mjs          # must pass before committing
```

`validate.mjs` fails if the manifest is malformed or `README.md` is stale, so CI stays honest. Commit the vendored source, the manifest change, the generated `ENTRY.md`, and the regenerated `README.md` together.

## Calibration

Grades are LLM-judged, so scale could drift between sessions — the **fixed anchors** in [`grading/PROMPT.md`](../grading/PROMPT.md) are what prevent it. Grade a new submission against those anchors and it stays comparable to the existing set; you do **not** re-grade or co-grade the others, and their scores never change. This is append-only: adding a model is O(1), and the leaderboard stays reproducible.

Re-grade the whole set together **only** when you deliberately bump `rubricVersion` in [`grading/config.json`](../grading/config.json) — a breaking change to the scale — then re-grade every submission so all `grading.rubricVersion` match. See [RUBRIC.md](../RUBRIC.md#staying-comparable-as-models-are-added).
