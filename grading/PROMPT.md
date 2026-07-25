<!-- Canonical grading prompt. This is the reproducible scorer: any capable agent
(Claude Code, opencode, etc.) grading a submission from this exact text + grading/schema.json
produces comparable results. scripts/grade.mjs fills the {{PLACEHOLDERS}} and runs it. -->

You are grading one submission in an LLM coding benchmark. Every model was given the SAME one-shot prompt: "build the greatest, most complete production-grade Pokédex web app, all ~1025 species, PokéAPI data, deployed on Cloudflare, work fully autonomously." This submission was produced by **{{MODEL}}** (effort: {{EFFORT}}).

Vendored source (source-only; generated data may be stripped): `{{SUBMISSION_DIR}}`
Live deployment (do NOT fetch it; judge from source): {{LIVE_URL}}

TASK: grade the submission against the 30-feature checklist below, judging the QUALITY/DEPTH of each — this benchmark rewards building things WELL, not just having them.

## Feature checklist

{{CHECKLIST}}

## Grade each feature 0–3 by depth (not mere presence)

- **3 — exceptional**: deep, complete, best-in-class implementation of this feature — the kind a Pokédex enthusiast would praise.
- **2 — solid**: properly implemented and actually working as a user expects.
- **1 — shallow/broken**: present but thin, stubbed, truncated, hardcoded, OR broken at runtime (renders nothing / throws). A feature whose code exists but crashes on the live page is at most a 1.
- **0 — absent**: no real implementation.

Be calibrated and DISCRIMINATING across the field — reserve 3 for genuinely excellent work; do not hand out 2s and 3s freely. Depth beats breadth: 12 features done at 3 should outscore 30 done at 1.

## Then score four ORTHOGONAL craft axes, 0–10

These are NOT about how many features exist — do not restate coverage:

- **codeQuality**: structure, modularity, typing, readability; absence of rot, dead code, copy-paste.
- **architecture**: soundness of the data strategy (prebuilt / live / edge-proxy), caching, build pipeline, technical decisions.
- **uxDesign**: visual craft, interaction polish, animation/feedback, responsiveness, accessibility signals.
- **robustness**: does it work end to end — no crashes, CORRECT data & logic (dual-type defensive matchups combined right, real branching evolutions, accurate stats), error handling, deploy health. A crash-on-load app scores very low here regardless of how much was coded.

Objective runtime smoke-test result for this submission (loads / console errors / detail route), if available — weigh it heavily for `robustness`: {{RUNTIME}}

## Calibration anchors (rubric v2)

These are FIXED reference points so scores stay comparable across sessions and judges. They are stated as CRITERIA first — match this submission's implementation to the criteria, not to any other entry's current score.

**Feature depth 0–3:**
- **3 (exceptional)** — the implementation goes past what the feature needs to work, in a way a Pokédex enthusiast would single out. It is not enough to be correct and complete. Shape of a 3: a team builder with 6 slots, *multiple persistent named* teams, coverage/defensive analysis, Showdown import **and** export, and a damage preview; or stat visualization with genuinely animated per-stat bars **plus** a hand-built SVG radar **plus** BST. If you cannot name a specific thing it does that a merely-good implementation would not, it is a 2.
- **2 (solid)** — properly implemented, correct, and working as a user expects, with no major gap. Shape of a 2: per-Pokémon defensive matchups combining BOTH types including 0× immunities; a filter/sort that filters and sorts correctly over the full dex. Breadth achieved by adding one more one-line predicate per dimension is a 2, not a 3.
- **1 (shallow/broken)** — present but thin, truncated, hardcoded, *or* broken at runtime. Shape of a 1: defensive matchups computed off the primary type only, so dual types are wrong; abilities listed by name with no effect text on the surface where a user reads them; a browse feed that renders a fraction of the dex with no pagination; a generation filter that renders ~1 Pokémon.
- **0 (absent)** — no real implementation.

**Craft axes 0–10** (orthogonal to coverage — do not restate how many features exist):
- **codeQuality** — 9: modular, strongly typed, no rot, no dead code, layering respected. 3: mis-wired references, dead tokens, broken imports.
- **architecture** — 9: the whole dataset prebuilt into static shards with a real caching story and zero runtime API dependency. 3: an intended prebuild that does not function, so every page live-fetches thousands of resources.
- **uxDesign** — 9: polished, animated, accessible (real aria/focus/reduced-motion handling), responsive to phone widths. 4: rough, unstyled or broken views.
- **robustness** — 9: works end to end with correct logic and no reachable crash. 6.5: works, minor issues. 4.5: a core surface fails (filters halt loading, dual-type matchups wrong). 2: loads and renders, then throws a JS exception and the detail route fails.

Weigh the objective runtime measurement above heavily for `robustness` and for `national-dex`: a site with zero console errors that still hands the user only a fraction of the 1025 species (and offers no pager) is broken at its primary job.

## Rules

- Judge from the ACTUAL SOURCE, not the README (READMEs oversell). Grep and read the directory to find the real implementation of each feature and judge how deep/correct it is.
- Output ALL 30 features exactly once, using the ids from the checklist, each with a 0–3 grade and an evidence string justifying the grade (say what makes it a 3 vs a 1).
- Do NOT run `npm install` / build / deploy. Read + grep only.
- `assessment` must be concrete and specific to THIS code (name real files and choices).

## Output

Return ONLY a single fenced ```json block that validates against `grading/schema.json`:
one object with `id` = "{{SUBMISSION_ID}}", the 30 `features`, the four `scores`, and the `assessment`. No prose outside the code block.
