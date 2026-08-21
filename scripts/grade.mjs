#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SANDBOX } from "./lib/judge.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/// Prompts point judges at the read-only sandbox copy, never at the working repo.
const SOURCE_DIR = (id) => join(SANDBOX, "submissions", id);
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
  node scripts/grade.mjs --submission <id> [--model <opencode-model>] [--verify <pass1.json>]
                         [--adjudicate <audit.json> --entry <pass2.json>] [--merge <file.json>] [--by "<judge>"]

  (default)          Assemble the grading prompt for <id> -> grading/prompts/<id>.md.
                     Hand it to a grader (a Claude Code session scored the current set), then --merge its JSON.
  --model <m>        Grade autonomously through opencode with model <m>, TWO passes
                     (grade, then adversarial verify), and merge the result.
  --verify <file>    Assemble the adversarial calibration prompt for an external grader from a
                     first-pass JSON -> grading/prompts/<id>-verify.md. Merge the second pass's JSON.
  --adjudicate <f>   Assemble a third-pass prompt from an independent audit's disputed grades
                     (with --entry <pass2.json>) -> grading/prompts/<id>-adjudicate.md. Use when an
                     audit disputes the verified entry; the judge decides each contested grade.
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
  const short =
    r.dexReach != null && r.dexReach < 900
      ? r.dexPager
        ? " — it stops there per page, but a pagination / load-more control is present, so the rest is still reachable by clicking"
        : " — the browse surface STOPS THERE with no pagination or load-more control, verify whether the feed is broken"
      : "";
  const dex =
    r.dexReach == null
      ? ""
      : `, species reachable by scrolling the browse page (${r.dexRoute}) = ${r.dexReach} of 1025${short}`;
  return `loads=${r.loadOk ? "ok" : "FAILED"}, content=${r.contentOk ? "ok" : "blank/error"}, consoleErrors=${r.consoleErrors}, jsExceptions=${r.pageErrors}, detailRoute=${r.detailOk ? "ok" : "failed"}${dex} → ${r.verdict} (checked ${r.checkedAt}${r.measuredOn ? `, ${r.measuredOn}` : ""})`;
}

function assemblePrompt() {
  const checklistText = checklist.categories
    .flatMap((c) => c.features.map((f) => `- ${f.id}: ${f.counts}`))
    .join("\n");
  return readFileSync(join(ROOT, "grading", "PROMPT.md"), "utf8")
    .replace(/^<!--[\s\S]*?-->\n/, "")
    .replaceAll("{{MODEL}}", sub.model)
    .replaceAll("{{EFFORT}}", sub.effort)
    .replaceAll("{{SUBMISSION_DIR}}", SOURCE_DIR(sub.id))
    .replaceAll("{{LIVE_URL}}", sub.liveUrl || "(none)")
    .replaceAll("{{SUBMISSION_ID}}", sub.id)
    .replaceAll("{{RUNTIME}}", runtimeText())
    .replaceAll("{{CHECKLIST}}", checklistText);
}

function verifyPrompt(entry) {
  return `Adversarial calibration pass for submission "${sub.id}" (${sub.model}). Source: ${SOURCE_DIR(sub.id)}

A first pass produced these grades (0 absent, 1 shallow/broken, 2 solid, 3 exceptional):
${entry.features.map((f) => `- ${f.id}: ${f.grade}`).join("\n")}
axes: ${JSON.stringify(entry.scores)}

Re-check EVERY grade against the actual code (grep/read). Downgrade stubs/truncations/broken features graded 2-3; upgrade genuinely deep work graded 0-1; sanity-check the axes (especially robustness vs any crash/correctness issue). Use the same rubric and calibration anchors.

Return ONLY a single fenced \`\`\`json block: the corrected full entry (id "${sub.id}", all 30 features with grade+evidence, the four scores, the assessment). No prose outside the block.`;
}

/// Third pass, used when an independent audit disputes a verified entry: the
/// judge adjudicates each contested grade against the fixed anchors rather than
/// either side winning by default.
function adjudicatePrompt(entry, audit) {
  const contested = (audit.contested ?? [])
    .map((c) => `### ${c.id}: judge ${c.originalGrade} vs auditor ${c.proposedGrade}\n${c.reason}`)
    .join("\n\n");
  const axes = (audit.axes ?? [])
    .filter((a) => a.proposedScore !== entry.scores?.[a.axis])
    .map((a) => `### ${a.axis}: judge ${entry.scores?.[a.axis]} vs auditor ${a.proposedScore}\n${a.reason}`)
    .join("\n\n");
  const logic = (audit.logic ?? [])
    .map((l) => `- ${l.id} (${l.proposedGrade}/3 correct): ${l.reason}`)
    .join("\n");
  return `Adjudication pass for submission "${sub.id}" (${sub.model}). Source: ${SOURCE_DIR(sub.id)}

You previously graded this submission. An INDEPENDENT adversarial audit then re-read the source and disputed some grades — it was instructed to attack inflated grades, so it is biased toward downgrading. Your job is to adjudicate, not to defer to either side.

Objective runtime smoke test of the live deployment: ${runtimeText()}

Your current entry:
${entry.features.map((f) => `- ${f.id}: ${f.grade}`).join("\n")}
axes: ${JSON.stringify(entry.scores)}

## Disputed feature grades

${contested || "(none)"}

## Disputed axis scores

${axes || "(none)"}

## Independent correctness checks of the core logic (feeds robustness)

${logic || "(none)"}

For EVERY disputed item: verify the auditor's specific claims against the actual code (grep/read the files it cites — some claims may be wrong or overstated), then set the final grade against the SAME fixed calibration anchors you graded with. Reserve 3 for genuinely best-in-class depth; a competent, complete implementation with no major gap is a 2. Reject a disputed downgrade where the auditor is factually wrong or is holding the feature to a standard above the anchor; accept it where the code confirms it. Undisputed grades stay unless the audit's evidence changes your read of them.

Return ONLY a single fenced \`\`\`json block validating against grading/schema.json: the final full entry — id "${sub.id}", all 30 features with grade+evidence, the four scores, and \`assessment\` as an OBJECT with keys summary (a paragraph), strengths (array), weaknesses (array), standout (string). Evidence for any grade you changed must say why. No prose outside the block.`;
}

/// Structural validation against grading/schema.json's contract. Returns an
/// array of human-readable problems (empty = valid).
function problems(entry, { requireAssessment = true } = {}) {
  const errs = [];
  if (entry.id !== sub.id) errs.push(`id "${entry.id}" != "${sub.id}"`);
  const got = new Set((entry.features || []).map((f) => f.id));
  for (const id of validIds) if (!got.has(id)) errs.push(`missing feature "${id}"`);
  const counts = new Map();
  for (const f of entry.features || []) counts.set(f.id, (counts.get(f.id) ?? 0) + 1);
  for (const [id, n] of counts) if (n > 1) errs.push(`feature "${id}" graded ${n} times`);
  for (const f of entry.features || []) {
    if (!validIds.includes(f.id)) errs.push(`unknown feature "${f.id}"`);
    if (![0, 1, 2, 3].includes(f.grade)) errs.push(`feature "${f.id}" grade ${f.grade} not 0-3`);
  }
  for (const k of ["codeQuality", "architecture", "uxDesign", "robustness"]) {
    const v = entry.scores?.[k];
    if (typeof v !== "number" || v < 0 || v > 10) errs.push(`axis "${k}" = ${v} not 0-10`);
  }
  if (requireAssessment)
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

/// Write an assembled prompt into grading/prompts/ and tell the caller what to do with it.
function writePrompt(name, text, next) {
  const dir = join(ROOT, "grading", "prompts");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, name);
  writeFileSync(p, text);
  console.log(`Wrote grading prompt → ${p}`);
  console.log(next);
}

if (opts.merge) {
  merge(JSON.parse(readFileSync(opts.merge, "utf8")), "Claude Code (session)");
} else if (opts.verify) {
  const first = JSON.parse(readFileSync(opts.verify, "utf8"));
  const errs = problems(first);
  if (errs.length) {
    console.error(`✗ first-pass JSON invalid:\n  - ${errs.join("\n  - ")}`);
    process.exit(1);
  }
  writePrompt(
    `${sub.id}-verify.md`,
    verifyPrompt(first),
    `Hand it to the same grader, then merge the corrected entry:\n  node scripts/grade.mjs --submission ${sub.id} --merge <verified.json>`,
  );
} else if (opts.adjudicate) {
  if (!opts.entry) {
    console.error("! --adjudicate <audit.json> also needs --entry <verified-pass.json> (the entry being disputed).");
    process.exit(1);
  }
  const entry = JSON.parse(readFileSync(opts.entry, "utf8"));
  const errs = problems(entry, { requireAssessment: false });
  if (errs.length) {
    console.error(`✗ entry JSON invalid:\n  - ${errs.join("\n  - ")}`);
    process.exit(1);
  }
  writePrompt(
    `${sub.id}-adjudicate.md`,
    adjudicatePrompt(entry, JSON.parse(readFileSync(opts.adjudicate, "utf8"))),
    `Hand it to the same judge, then merge the adjudicated entry:\n  node scripts/grade.mjs --submission ${sub.id} --merge <final.json>`,
  );
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
  writePrompt(
    `${sub.id}.md`,
    assemblePrompt(),
    `Grade it (a Claude Code session gives the richest, adversarially-verified result), then run the\nadversarial calibration pass on its JSON:\n  node scripts/grade.mjs --submission ${sub.id} --verify <pass1.json>`,
  );
}
