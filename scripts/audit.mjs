#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { JUDGE_FLAGS, SANDBOX, refreshSandbox, disposeSandbox, fingerprint, assertUnchanged } from "./lib/judge.mjs";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++)
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[i + 1]?.startsWith("--") || args[i + 1] === undefined ? true : args[++i];

if (!opts.submission || !opts.entry) {
  console.error(
    `Pass 3 of the v2 grading flow: ten independent agents try to refute the verified grades.

Usage:
  node scripts/audit.mjs --submission <id> --entry <pass2.json> [--model <m>] [--out <file>]

  --entry    the adversarially-verified entry being audited (pass 2 output)
  --model    agent model (default: claude-opus-5); each scope runs as its own \`claude -p\`
  --out      merged audit file (default: grading/prompts/<id>-audit.json)
  --only <s> run only scopes whose label contains <s> (e.g. "axis:", "tools") and merge
             them into an existing --out — for retrying scopes that died mid-run

Then hand the disputes back to the judge:
  node scripts/grade.mjs --submission <id> --adjudicate <out> --entry <pass2.json>

Scopes are graded blind to each other — five feature groups, four craft axes, and one
core-logic correctness check. See grading/AUDIT.md and grading/audit-schema.json.`,
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const sub = manifest.submissions.find((s) => s.id === opts.submission);
if (!sub) {
  console.error(`! no submission "${opts.submission}" in the manifest.`);
  process.exit(1);
}
const entry = JSON.parse(readFileSync(opts.entry, "utf8"));
const model = typeof opts.model === "string" ? opts.model : "claude-opus-5";
const out = typeof opts.out === "string" ? opts.out : join(ROOT, "grading", "prompts", `${sub.id}-audit.json`);

const GROUPS = [
  { key: "browse", ids: ["national-dex", "search", "type-filter", "generation-filter", "sort", "advanced-filter", "shareable-urls"] },
  { key: "detail-core", ids: ["artwork", "shiny", "cries", "stats-viz", "abilities", "evolution"] },
  { key: "detail-data", ids: ["learnsets", "type-matchups", "breeding", "forms", "flavor-entries"] },
  { key: "tools", ids: ["type-chart", "compare", "team-builder", "damage-calc", "moves-dex", "minigame", "command-palette"] },
  { key: "polish", ids: ["favorites", "theming", "keyboard-nav", "responsive", "export"] },
];

const AXES = {
  codeQuality: "structure, modularity, typing, readability, absence of rot/dead code/copy-paste. 9 = modular, strongly typed, no rot; 3 = mis-wired references, broken imports.",
  architecture: "soundness of the data strategy, caching, build pipeline. 9 = whole dataset prebuilt into static shards with zero runtime API dependency; 3 = an intended prebuild that does not function, so every page live-fetches.",
  uxDesign: "visual craft, interaction polish, animation/feedback, responsiveness, accessibility signals. 9 = polished, animated, accessible, responsive; 4 = rough or broken views.",
  robustness: "works end to end, CORRECT data and logic, error handling, deploy health. 9 = correct logic, no reachable crash; 6.5 = works with minor issues; 4.5 = a core surface fails; 2 = throws and the detail route fails.",
};

const LOGIC_CHECKS = `Verify the CORRECTNESS of this submission's core Pokédex logic by reading the code — this feeds the robustness axis. For each check say whether it is actually right or subtly wrong, with file:line evidence:
1. types — defensive matchups multiplied across BOTH types including 0x immunities, and the chart itself complete/correct.
2. evolution — real branching (Eevee, Wurmple, Tyrogue) or first-path-only? Are all evolution_details rendered or only the first?
3. damage — if a calculator exists: the real formula with correct flooring, or a toy presented as real?
4. stats — base/level/IV/EV/nature maths correct (HP formula differs; Shedinja; nature applied after the floor)?
5. data-completeness — does the build actually fetch the full dex, or cap/truncate anywhere (limit=, slice, hardcoded ranges)?
6. crash-paths — unguarded indexing, missing null checks on optional PokéAPI fields, routes that render nothing, reachable uncaught exceptions.

Return items with id set to the check name (types, evolution, damage, stats, data-completeness, crash-paths), originalGrade 0, and proposedGrade as a 0-3 correctness rating (3 = fully correct, 0 = badly wrong).`;

function runtimeText() {
  const r = sub.runtime;
  if (!r) return "not measured";
  const dex =
    r.dexReach == null
      ? ""
      : `; measured: scrolling the browse page (${r.dexRoute}) to exhaustion reaches ${r.dexReach} of 1025 species${r.dexReach < 1025 ? (r.dexPager ? ", with a pagination control present" : ", with NO pagination or load-more control") : ""}`;
  return `${r.verdict} — loads=${r.loadOk}, content=${r.contentOk}, consoleErrors=${r.consoleErrors}, jsExceptions=${r.pageErrors}, detailRoute=${r.detailOk}${dex}${r.measuredOn ? ` (${r.measuredOn})` : ""}`;
}

const gradeOf = (id) => entry.features.find((f) => f.id === id);

const template = readFileSync(join(ROOT, "grading", "AUDIT.md"), "utf8").replace(/^<!--[\s\S]*?-->\n/, "");

function prompt(scope) {
  return template
    .replaceAll("{{SUBMISSION_ID}}", sub.id)
    .replaceAll("{{SUBMISSION_DIR}}", join(SANDBOX, "submissions", sub.id))
    .replaceAll("{{LIVE_URL}}", sub.liveUrl || "(none — judge from source and the vendored build)")
    .replaceAll("{{RUNTIME}}", runtimeText())
    .replaceAll("{{SCOPE}}", scope);
}

const featureScope = (g) =>
  `Audit exactly these feature grades, one \`items\` entry each:\n\n${g.ids
    .map((id) => {
      const f = gradeOf(id);
      return `- **${id}** — graded ${f?.grade ?? 0}. Judge's evidence: ${f?.evidence || "(none)"}`;
    })
    .join("\n")}\n\nReturn {"items": [...]} with one entry per id above.`;

const axisScope = (axis) =>
  `Independently score ONE craft axis: **${axis}** — ${AXES[axis]}\n\nThe judge scored it ${entry.scores?.[axis]}. Read enough of the source to justify your own 0-10; do not restate feature coverage, the axes are orthogonal to how many features exist. Say whether the judge's number is defensible.\n\nReturn {"axis": "${axis}", "originalScore": ${entry.scores?.[axis]}, "proposedScore": N, "reason": "..."}.`;

const ALL_SCOPES = [
  ...GROUPS.map((g) => ({ label: `refute:${g.key}`, text: featureScope(g) })),
  ...Object.keys(AXES).map((a) => ({ label: `axis:${a}`, text: axisScope(a) })),
  { label: "logic", text: LOGIC_CHECKS },
];
const SCOPES = typeof opts.only === "string" ? ALL_SCOPES.filter((s) => s.label.includes(opts.only)) : ALL_SCOPES;
if (!SCOPES.length) {
  console.error(`! --only "${opts.only}" matched no scope. Available: ${ALL_SCOPES.map((s) => s.label).join(", ")}`);
  process.exit(1);
}

function extractJson(text) {
  const blocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  for (const c of (blocks.length ? blocks : [text]).reverse()) {
    try {
      return JSON.parse(c.trim());
    } catch {}
  }
  return null;
}

/// One auditor, in its own agent, seeing only its own scope.
async function audit(scope) {
  const { stdout } = await run(
    "claude",
    ["-p", prompt(scope.text), "--model", model, "--effort", "high", ...JUDGE_FLAGS],
    { maxBuffer: 256 * 1024 * 1024, cwd: SANDBOX },
  );
  const res = JSON.parse(stdout);
  if (res.subtype !== "success") throw new Error(`${scope.label}: ${res.subtype}`);
  const parsed = extractJson(res.result);
  if (!parsed) throw new Error(`${scope.label}: no JSON in output`);
  console.log(`  ✓ ${scope.label.padEnd(22)} $${(res.total_cost_usd ?? 0).toFixed(2)}`);
  return { scope, parsed };
}

console.log(`▶ auditing ${sub.id} with ${model} — ${SCOPES.length} independent scopes`);
refreshSandbox();
const before = fingerprint();
const settled = await Promise.allSettled(SCOPES.map(audit));
assertUnchanged(before, `the ${sub.id} audit`);
disposeSandbox();
for (const s of settled) if (s.status === "rejected") console.error(`  ✗ ${s.reason.message}`);

const done = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
const featureItems = done
  .filter((d) => d.scope.label.startsWith("refute:"))
  .flatMap((d) => d.parsed.items ?? []);

const prior = existsSync(out) && SCOPES.length !== ALL_SCOPES.length ? JSON.parse(readFileSync(out, "utf8")) : null;
const keep = (list, ids) => (prior ? list.filter((x) => !ids.has(x.id ?? x.axis ?? x.split("=")[0])) : []);
const freshIds = new Set([
  ...featureItems.map((i) => i.id),
  ...done.filter((d) => d.parsed.axis).map((d) => d.parsed.axis),
]);

const merged = {
  contested: [...keep(prior?.contested ?? [], freshIds), ...featureItems.filter((i) => i.verdict !== "upheld")],
  upheld: [
    ...(prior ? (prior.upheld ?? []).filter((u) => !freshIds.has(u.split("=")[0])) : []),
    ...featureItems.filter((i) => i.verdict === "upheld").map((i) => `${i.id}=${i.originalGrade}`),
  ],
  axes: [...keep(prior?.axes ?? [], freshIds), ...done.filter((d) => d.parsed.axis).map((d) => d.parsed)],
  logic: done.find((d) => d.scope.label === "logic")?.parsed.items ?? prior?.logic ?? [],
};

const audited = new Set([...merged.contested.map((i) => i.id), ...merged.upheld.map((u) => u.split("=")[0])]);
const missing = GROUPS.flatMap((g) => g.ids).filter((id) => !audited.has(id));
if (missing.length) console.error(`! ${missing.length} feature(s) unaudited: ${missing.join(", ")} — retry with --only`);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(merged, null, 1) + "\n");
console.log(
  `\n✓ ${merged.contested.length} contested, ${merged.upheld.length} upheld, ${merged.axes.length} axes re-scored → ${out}\n` +
    `\nNext — the judge rules on each dispute:\n  node scripts/grade.mjs --submission ${sub.id} --adjudicate ${out} --entry ${opts.entry}`,
);
const partial = SCOPES.length !== ALL_SCOPES.length;
if (settled.some((s) => s.status === "rejected") || (missing.length && !partial)) process.exit(1);
