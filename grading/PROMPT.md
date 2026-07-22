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

## Calibration anchors (rubric v1)

Grade against these FIXED reference points from already-scored submissions so scores stay comparable across sessions and judges. Do not re-score the anchors; match this submission's depth to the closest example.

**Feature depth 0–3:**
- **3 (exceptional)** — team-builder as in Fable-5-ultracode / Grok: 6 slots, multiple persistent named teams, coverage/defensive analysis, Showdown import+export, damage preview. Or stats-viz as in Grok / DeepSeek-V4-Flash: animated per-stat bars **plus** a hand-built SVG radar plus BST total.
- **2 (solid)** — type-matchups as in DeepSeek-V4-Flash: correct per-Pokémon defensive multipliers combined across BOTH types including immunities. Working as a user expects, no major gap.
- **1 (shallow/broken)** — type-matchups as in Grok: primary type only, so dual-type results are wrong. Or abilities as in Grok: ability names only, no effect text. Or generation-filter as in Grok: present but renders ~1 Pokémon in gen view (broken).
- **0 (absent)** — team-builder as in Opus-4.8 / DeepSeek: no implementation at all. Or forms across most entries: no mega/regional/variant handling.

**Craft axes 0–10:**
- **codeQuality** — 9: Fable-5-ultracode / Opus-4.8 (modular, strongly typed, no rot). 3: Laguna-S-2.1 (mis-wired references, dead tokens, broken imports).
- **architecture** — 9: Fable-5-ultracode (entire dataset prebuilt into static shards, zero runtime API). 3: Laguna (intended prebuild is non-functional, so every page live-fetches thousands of resources).
- **uxDesign** — 9: Opus-4.8 / Fable-5-ultracode (polished, animated, accessible, responsive). 4: Laguna (rough, broken views).
- **robustness** — 9: Fable-5-ultracode (works end-to-end, correct logic). 6.5: DeepSeek-V4-Flash (works, minor issues). 4.5: Grok (filters halt infinite-loading; dual-type matchups wrong). 2: Laguna (loads and renders, then throws a JS exception and the detail route fails — runtime verdict: errors).

## Rules

- Judge from the ACTUAL SOURCE, not the README (READMEs oversell). Grep and read the directory to find the real implementation of each feature and judge how deep/correct it is.
- Output ALL 30 features exactly once, using the ids from the checklist, each with a 0–3 grade and an evidence string justifying the grade (say what makes it a 3 vs a 1).
- Do NOT run `npm install` / build / deploy. Read + grep only.
- `assessment` must be concrete and specific to THIS code (name real files and choices).

## Output

Return ONLY a single fenced ```json block that validates against `grading/schema.json`:
one object with `id` = "{{SUBMISSION_ID}}", the 30 `features`, the four `scores`, and the `assessment`. No prose outside the code block.
