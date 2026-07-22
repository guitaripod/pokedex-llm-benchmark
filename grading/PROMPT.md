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

## Rules

- Judge from the ACTUAL SOURCE, not the README (READMEs oversell). Grep and read the directory to find the real implementation of each feature and judge how deep/correct it is.
- Output ALL 30 features exactly once, using the ids from the checklist, each with a 0–3 grade and an evidence string justifying the grade (say what makes it a 3 vs a 1).
- Do NOT run `npm install` / build / deploy. Read + grep only.
- `assessment` must be concrete and specific to THIS code (name real files and choices).

## Output

Return ONLY a single fenced ```json block that validates against `grading/schema.json`:
one object with `id` = "{{SUBMISSION_ID}}", the 30 `features`, the four `scores`, and the `assessment`. No prose outside the code block.
