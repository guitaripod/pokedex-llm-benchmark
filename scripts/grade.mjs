#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");
const CONFIG = JSON.parse(readFileSync(join(ROOT, "grading", "config.json"), "utf8"));

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++)
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];

if (!opts.submission) {
  console.error(
    `Grade a submission against the pinned rubric (grading/PROMPT.md + grading/schema.json, rubric v${CONFIG.rubricVersion}).

Usage:
  node scripts/grade.mjs --submission <id> [--model <opencode-model>] [--merge <file.json>] [--by "<judge>"]

  (default)          Assemble the grading prompt for <id> -> grading/prompts/<id>.md.
                     Hand it to a grader (a Claude Code session scored the current set), then --merge its JSON.
  --model <m>        Grade autonomously through opencode with model <m>, TWO passes
                     (grade, then adversarial verify), and merge the result.
  --merge <file>     Validate a grader's JSON for <id> and merge it into submissions.json.
  --by "<judge>"     Record who graded (default: Claude Code / the opencode model).

Merging stamps grading.gradedBy / gradedOn / rubricVersion. Existing scores are never touched — grading is append-only.
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

function runtimeText() {
  const r = sub.runtime;
  if (!r) return "not run — judge robustness from the source.";
  return `loads=${r.loadOk ? "ok" : "FAILED"}, content=${r.contentOk ? "ok" : "blank/error"}, consoleErrors=${r.consoleErrors}, jsExceptions=${r.pageErrors}, detailRoute=${r.detailOk ? "ok" : "failed"} → ${r.verdict} (checked ${r.checkedAt})`;
}

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
    .replaceAll("{{RUNTIME}}", runtimeText())
    .replaceAll("{{CHECKLIST}}", checklistText);
}

function verifyPrompt(entry) {
  return `Adversarial calibration pass for submission "${sub.id}" (${sub.model}). Source: ${join(ROOT, "submissions", sub.id)}

A first pass produced these grades (0 absent, 1 shallow/broken, 2 solid, 3 exceptional):
${entry.features.map((f) => `- ${f.id}: ${f.grade}`).join("\n")}
axes: ${JSON.stringify(entry.scores)}

Re-check EVERY grade against the actual code (grep/read). Downgrade stubs/truncations/broken features graded 2-3; upgrade genuinely deep work graded 0-1; sanity-check the axes (especially robustness vs any crash/correctness issue). Use the same rubric and calibration anchors.

Return ONLY a single fenced \`\`\`json block: the corrected full entry (id "${sub.id}", all 30 features with grade+evidence, the four scores, the assessment). No prose outside the block.`;
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function merge(entry, gradedBy) {
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
  sub.grading = {
    gradedBy: opts.by || gradedBy,
    gradedOn: opts.on || today(),
    rubricVersion: CONFIG.rubricVersion,
  };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  const depth = sub.features.reduce((a, f) => a + f.grade, 0);
  console.log(`✓ merged "${sub.id}" — feature depth ${depth}/90, axes ${["codeQuality","architecture","uxDesign","robustness"].map((k)=>s[k]).join("/")} (rubric v${CONFIG.rubricVersion}, by ${sub.grading.gradedBy})`);
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

function runViaOpencode(prompt, label) {
  console.log(`▶ ${label} via opencode ${opts.model} …`);
  const out = execFileSync("opencode", ["run", prompt, "--model", opts.model], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const entry = extractJson(out);
  if (!entry) {
    console.error(`✗ could not extract JSON from the ${label} output. Tail:\n${out.slice(-2000)}`);
    process.exit(1);
  }
  return entry;
}

if (opts.merge) {
  merge(JSON.parse(readFileSync(opts.merge, "utf8")), "Claude Code (session)");
} else if (opts.model) {
  const first = runViaOpencode(assemblePrompt(), "grade pass");
  const errs1 = problems(first);
  if (errs1.length) {
    console.error(`✗ grade pass invalid:\n  - ${errs1.join("\n  - ")}`);
    process.exit(1);
  }
  const verified = runViaOpencode(verifyPrompt(first), "verify pass");
  merge(verified, `${opts.model} (opencode, 2-pass)`);
} else {
  const dir = join(ROOT, "grading", "prompts");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${sub.id}.md`);
  writeFileSync(p, assemblePrompt());
  console.log(`Wrote grading prompt → ${p}`);
  console.log(`Grade it (a Claude Code session gives the richest, adversarially-verified result), then:`);
  console.log(`  node scripts/grade.mjs --submission ${sub.id} --merge <grader-output.json>`);
}
