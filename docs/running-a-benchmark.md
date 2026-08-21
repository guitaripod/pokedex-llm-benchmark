# Running a benchmark

The benchmark is a loop: **run → ingest → grade → regenerate.** A new model runs the same one-shot [brief](../THE_BRIEF.md), builds and deploys its own Pokédex fully autonomously, then gets scored and folded into the leaderboard.

> **TL;DR — the easy way.** Open a Claude Code session in this repo and say: *"benchmark `<model-id>`"* (list opencode ids with `opencode models`, e.g. `opencode/deepseek-v4-flash-free`; Anthropic models run on Claude Code, e.g. `claude-opus-5`). **The agent will ask you which variant/effort to run** (model default, `high`, `max`, `ultracode`, … — or two efforts to compare, like the Fable 5 low-vs-ultracode pair) before it launches, since effort materially changes the result. It then runs every step below — the autonomous build, ingest, three-pass grade, regenerate, and commit. The manual four steps follow for when you're not in a session.

## 1. Run — the model builds it

Hand a model the canonical prompt and let it work autonomously (it uses `gh` and `wrangler` itself to create a repo and deploy to Cloudflare — provisioning is part of the test):

```bash
node scripts/run-benchmark.mjs --model <model> --name <token> [--runner opencode|claude] [--variant <effort>]
```

- `--model` — the model id. Prefixed ids run on [opencode](https://opencode.ai) (`opencode models` to list), e.g. `opencode/deepseek-v4-flash-free`, `xai/grok-...`; bare Anthropic ids run on Claude Code, e.g. `claude-opus-5`, `claude-fable-5`.
- `--name` — the repo name token; the model is told to *"call it `pokedex-<name>`"*. Encode model + effort, e.g. `deepseek-v4-flash`, `opus-5-ultracode`.
- `--runner` — which agent harness drives the run. Inferred from the model id (a `/` means opencode), so you rarely pass it.
- `--variant` — reasoning effort passed through to the runner: opencode takes `high` / `max` / `minimal`, Claude Code takes `low` / `medium` / `high` / `xhigh` / `max` / `ultracode`. Check the model's own `reasoning_options` on [models.dev](https://models.dev/api.json) — opencode accepts an unknown variant silently.
- `--resume` — opencode only: how many times to resume after the provider severs the stream (default 12). See [Provider drop-outs](methodology.md#provider-drop-outs).

The opencode runner is sandboxed from the host's agent config — a mirrored `XDG_CONFIG_HOME` with opencode's own slot blanked, plus `OPENCODE_DISABLE_CLAUDE_CODE=1` — so the model gets the brief and not the operator's `AGENTS.md`, skills, plugins or MCP servers, while `gh` and `wrangler` keep their credentials. Do not defeat this; see [Run isolation](methodology.md#run-isolation).

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
scripts/regrade.sh <id>            # all three passes end to end, then merge the result:
node scripts/grade.mjs --submission <id> --merge /tmp/rg-<id>-final.json --by "<judge>"
```

`regrade.sh` drives the pinned prompts through [`scripts/judge.mjs`](../scripts/judge.mjs), which runs each judge in a read-only copy of the repo with the operator's settings and memory switched off, and fails the stage if the working repo moved ([judge containment](methodology.md#judge-containment)). Run a single stage with `regrade.sh <id> 12|audit|3`. What it runs, if you want the steps by hand:

```bash
node scripts/grade.mjs --submission <id>                              # 1. grade      → grading/prompts/<id>.md
node scripts/grade.mjs --submission <id> --verify pass1.json          # 2. calibrate  → <id>-verify.md
node scripts/audit.mjs --submission <id> --entry pass2.json           # 3. audit      → <id>-audit.json
node scripts/grade.mjs --submission <id> --adjudicate audit.json \
                       --entry pass2.json                             # 4. adjudicate → <id>-adjudicate.md
node scripts/grade.mjs --submission <id> --merge final.json           # merge the result
```

Hand each prompt to the judge in turn and feed its JSON to the next step. **Pass 2 alone is not enough** — on both Opus 5 entries it returned pass 1 nearly unchanged, once leaving 22 of 30 features at grade `3`. The audit ([`grading/AUDIT.md`](../grading/AUDIT.md)) is what fixes that: `audit.mjs` runs ten agents that are blind to each other — five feature groups, four craft axes, one core-logic correctness check — each told to *refute* its slice against the source and the live site, and the judge then rules on every dispute. If some scopes die mid-run (session limits, API hiccups), retry just those with `audit.mjs … --only axis:` and they merge into the existing audit file.

**Autonomous via opencode (two-pass).** Fully hands-off — grades, then adversarially verifies, with a judge model:

```bash
node scripts/grade.mjs --submission <id> --model <judge-model>
```

`grade.mjs` rejects any output that isn't all 30 features graded 0–3 with the four 0–10 axes (see [RUBRIC.md](../RUBRIC.md) for what the grades mean), and on merge it stamps `grading.gradedBy / gradedOn / rubricVersion`. Grade against the vendored source, not the README.

## 4. Regenerate and validate

```bash
node scripts/smoke.mjs --submission <id>   # runtime signal from the live deployment
node scripts/verify-live.mjs               # does each live URL still serve its vendored source?
node scripts/compute-metrics.mjs   # refresh objective metrics
node scripts/gen-entries.mjs       # per-submission ENTRY.md scorecards
node scripts/gen-readme.mjs        # rebuild leaderboard + depth matrix
node scripts/validate.mjs          # must pass before committing (also re-checks every vendorHash)
```

Run `verify-live.mjs` before trusting any runtime-derived judgment: a deployment that has drifted to a different codebase (as `grok`'s had) makes every runtime signal for that entry meaningless. When it flags one, either fix `liveUrl` or measure a local build with `smoke.mjs --submission <id> --url http://localhost:PORT`, which stamps `runtime.measuredOn`.

For a whole-board re-grade after a `rubricVersion` bump, [`scripts/regrade.sh`](../scripts/regrade.sh) drives one submission through passes 1–2 (`regrade.sh <id>`) and, once you have an audit, the adjudication (`regrade.sh <id> 3`).

`validate.mjs` fails if the manifest is malformed or `README.md` is stale, so CI stays honest. Commit the vendored source, the manifest change, the generated `ENTRY.md`, and the regenerated `README.md` together.

## Calibration

Grades are LLM-judged, so scale could drift between sessions — the **fixed anchors** in [`grading/PROMPT.md`](../grading/PROMPT.md) are what prevent it. Grade a new submission against those anchors and it stays comparable to the existing set; you do **not** re-grade or co-grade the others, and their scores never change. This is append-only: adding a model is O(1), and the leaderboard stays reproducible.

Re-grade the whole set together **only** when you deliberately bump `rubricVersion` in [`grading/config.json`](../grading/config.json) — a breaking change to the scale — then re-grade every submission so all `grading.rubricVersion` match. See [RUBRIC.md](../RUBRIC.md#staying-comparable-as-models-are-added).
