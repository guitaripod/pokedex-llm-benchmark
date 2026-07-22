#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++)
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];

if (!opts.submission) {
  console.error(
    `Grade a submission against the pinned rubric (grading/PROMPT.md + grading/schema.json).

Usage:
  node scripts/grade.mjs --submission <id> [--model <opencode-model>] [--merge <file.json>]

  (default)          Assemble the grading prompt for <id> and write it to grading/prompts/<id>.md.
                     Hand it to any grader (a Claude Code session is what scored the current set),
                     then merge its JSON with --merge.
  --model <m>        Run the grading autonomously through opencode with model <m>
                     (e.g. xai/grok-..., opencode/deepseek-v4-flash-free) and merge the result.
  --merge <file>     Validate a grader's JSON output for <id> and merge it into submissions.json.

After merging: node scripts/gen-entries.mjs && node scripts/gen-readme.mjs && node scripts/validate.mjs`,
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const checklist = JSON.parse(readFileSync(join(ROOT, "docs", "feature-checklist.json"), "utf8"));
const sub = manifest.submissions.find((s) => s.id === opts.submission);
if (!sub) {
  console.error(`! no submission "${opts.submission}" in the manifest.`);
  process.exit(1);
}
const validIds = checklist.categories.flatMap((c) => c.features.map((f) => f.id));

function assemblePrompt() {
  const checklistText = checklist.categories
    .flatMap((c) => c.features.map((f) => `- ${f.id}: ${f.counts}`))
    .join("\n");
  return readFileSync(join(ROOT, "grading", "PROMPT.md"), "utf8")
    .replace(/^<!--[\s\S]*?-->\n/, "")
    .replaceAll("{{MODEL}}", sub.model)
    .replaceAll("{{EFFORT}}", sub.effort)
    .replaceAll("{{SUBMISSION_DIR}}", join(ROOT, "submissions", sub.id))
    .replaceAll("{{LIVE_URL}}", sub.liveUrl || "(none)")
    .replaceAll("{{SUBMISSION_ID}}", sub.id)
    .replaceAll("{{CHECKLIST}}", checklistText);
}

/// Structural validation against grading/schema.json's contract. Returns an
/// array of human-readable problems (empty = valid).
function problems(entry) {
  const errs = [];
  if (entry.id !== sub.id) errs.push(`id "${entry.id}" != "${sub.id}"`);
  const got = new Set((entry.features || []).map((f) => f.id));
  for (const id of validIds) if (!got.has(id)) errs.push(`missing feature "${id}"`);
  for (const f of entry.features || []) {
    if (!validIds.includes(f.id)) errs.push(`unknown feature "${f.id}"`);
    if (![0, 1, 2, 3].includes(f.grade)) errs.push(`feature "${f.id}" grade ${f.grade} not 0-3`);
  }
  for (const k of ["codeQuality", "architecture", "uxDesign", "robustness"]) {
    const v = entry.scores?.[k];
    if (typeof v !== "number" || v < 0 || v > 10) errs.push(`axis "${k}" = ${v} not 0-10`);
  }
  for (const k of ["summary", "strengths", "weaknesses", "standout"])
    if (entry.assessment?.[k] == null) errs.push(`assessment.${k} missing`);
  return errs;
}

function merge(entry) {
  const errs = problems(entry);
  if (errs.length) {
    console.error(`✗ grader output invalid:\n  - ${errs.join("\n  - ")}`);
    process.exit(1);
  }
  sub.features = validIds.map((id) => {
    const f = entry.features.find((x) => x.id === id);
    return { id, grade: f.grade, evidence: f.evidence || "" };
  });
  const s = entry.scores;
  sub.scores = { codeQuality: s.codeQuality, architecture: s.architecture, uxDesign: s.uxDesign, robustness: s.robustness };
  sub.assessment = entry.assessment;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  const depth = sub.features.reduce((a, f) => a + f.grade, 0);
  console.log(`✓ merged "${sub.id}" — feature depth ${depth}/90, axes ${["codeQuality","architecture","uxDesign","robustness"].map((k)=>s[k]).join("/")}`);
  console.log(`\nNext: node scripts/gen-entries.mjs && node scripts/gen-readme.mjs && node scripts/validate.mjs`);
}

function extractJson(text) {
  const blocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  const candidates = blocks.length ? blocks : [text];
  for (const c of candidates.reverse()) {
    try {
      return JSON.parse(c.trim());
    } catch {}
  }
  return null;
}

if (opts.merge) {
  const entry = JSON.parse(readFileSync(opts.merge, "utf8"));
  merge(entry);
} else if (opts.model) {
  const prompt = assemblePrompt();
  console.log(`▶ grading "${sub.id}" via opencode ${opts.model} …`);
  const out = execFileSync("opencode", ["run", prompt, "--model", opts.model], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const entry = extractJson(out);
  if (!entry) {
    console.error("✗ could not extract a JSON object from the grader output. Raw output:\n");
    console.error(out.slice(-2000));
    process.exit(1);
  }
  merge(entry);
} else {
  const dir = join(ROOT, "grading", "prompts");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${sub.id}.md`);
  writeFileSync(p, assemblePrompt());
  console.log(`Wrote grading prompt → ${p}`);
  console.log(`Grade it (a Claude Code session gives the richest, adversarially-verified result), then:`);
  console.log(`  node scripts/grade.mjs --submission ${sub.id} --merge <grader-output.json>`);
}
