#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
  readFileSync,
  mkdirSync,
  existsSync,
  createWriteStream,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { DatabaseSync } from "node:sqlite";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "submissions.json"), "utf8"));

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++)
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];

if (!opts.model || !opts.name) {
  console.error(
    `Run the benchmark: hand a model the canonical prompt and let it build + deploy a Pokédex
fully autonomously (it uses gh + wrangler itself).

Usage:
  node scripts/run-benchmark.mjs --model <model> --name <token> [--runner opencode|claude]
                                 [--variant <effort>] [--resume <n>] [--dir <path>] [--log <path>]

  --model    model id. opencode ids carry a provider prefix (opencode/deepseek-v4-flash-free,
             xai/grok-4.5); bare Anthropic ids (claude-opus-5, claude-fable-5) run on Claude Code.
  --name     name token for the repo — the model is told to "call it pokedex-<name>"
             (encode the model + effort, e.g. deepseek-v4-flash, opus-5-ultracode)
  --runner   which agent harness drives the run (default: inferred — "/" in the model id
             means opencode, otherwise claude)
  --variant  reasoning effort passed through to the runner
             (opencode: high, max, minimal — claude: low, medium, high, xhigh, max, ultracode)
  --resume   opencode only: how many times to resume the session after the provider
             severs the stream mid-run (default: 12, 0 to disable)
  --dir      working directory the model builds in (default: ~/Dev/pokedex-<name>)
  --log      transcript path (claude runner only; default: <dir>/../pokedex-<name>-run.jsonl)

Examples:
  node scripts/run-benchmark.mjs --model opencode/deepseek-v4-flash-free --name deepseek-v4-flash
  node scripts/run-benchmark.mjs --model claude-opus-5 --name opus-5-ultracode --variant ultracode

The run is fully autonomous (opencode --auto / claude --dangerously-skip-permissions). When it
finishes, the model will have created its own GitHub repo (pokedex-<name>) and deployed it to
Cloudflare. Then ingest it:
  node scripts/add-submission.mjs <repo-url> --model "<Name>" [--effort <e>]
and grade it (see docs/running-a-benchmark.md).`,
  );
  process.exit(1);
}

const runner = opts.runner || (opts.model.includes("/") ? "opencode" : "claude");
if (!["opencode", "claude"].includes(runner)) {
  console.error(`! unknown --runner "${runner}" (expected: opencode | claude)`);
  process.exit(1);
}

const repoName = `pokedex-${opts.name}`;
const prompt = manifest.prompt.replace("pokedex-<model>-<effort>", repoName);
const dir = opts.dir || join(homedir(), "Dev", repoName);

if (existsSync(dir) && existsSync(join(dir, ".git"))) {
  console.error(`! ${dir} already exists and looks like a repo. Pick a fresh --dir or --name.`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const opencodeArgs = (resume) => {
  const a = ["run", resume ? "Continue." : prompt, "--model", opts.model, "--auto"];
  if (opts.variant) a.push("--variant", opts.variant);
  if (resume) a.push("--continue");
  a.push("--dir", dir, "--title", `benchmark: ${repoName}`);
  return a;
};

const claudeArgs = () => {
  const a = ["-p", prompt, "--model", opts.model];
  if (opts.variant) a.push("--effort", opts.variant);
  a.push("--dangerously-skip-permissions", "--verbose", "--output-format", "stream-json");
  return a;
};

/// opencode feeds the model the machine owner's house rules from three places at
/// once: ~/.claude/CLAUDE.md and ~/.claude/skills (implicit Claude Code support),
/// and $XDG_CONFIG_HOME/opencode/{AGENTS.md,plugin,opencode.json} — which on this
/// machine symlinks AGENTS.md straight at that same CLAUDE.md. Any of them hands
/// the run instructions no other entry got. Point the config dir at an empty
/// throwaway so the model sees the brief and nothing else; auth and the model
/// catalogue live under XDG_DATA_HOME and are unaffected.
/// The catch: XDG_CONFIG_HOME is also where gh and wrangler keep their
/// credentials, and the brief promises the model both. So mirror the real config
/// dir entry by entry and blank out only opencode's own slot.
const configDir = join(tmpdir(), `pokedex-bench-config-${repoName}`);
const opencodeEnv = () => {
  const real = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  rmSync(configDir, { recursive: true, force: true });
  mkdirSync(join(configDir, "opencode"), { recursive: true });
  for (const entry of readdirSync(real))
    if (entry !== "opencode") symlinkSync(join(real, entry), join(configDir, entry));
  const wranglerMac = join(homedir(), "Library", "Preferences", ".wrangler");
  if (existsSync(wranglerMac) && !existsSync(join(configDir, ".wrangler")))
    symlinkSync(wranglerMac, join(configDir, ".wrangler"));
  return { ...process.env, XDG_CONFIG_HOME: configDir, OPENCODE_DISABLE_CLAUDE_CODE: "1" };
};

const resumeLimit = opts.resume === undefined ? 12 : Number(opts.resume);

/// Free and preview endpoints drop the stream mid-run: opencode records an
/// assistant turn with no tokens and finish "unknown", then exits 0 as if the
/// model were done. Read the last turn of this build dir's session straight out
/// of opencode's store so the harness can tell a finished run from a severed one.
function lastTurn() {
  const data = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  try {
    const db = new DatabaseSync(join(data, "opencode", "opencode.db"), { readOnly: true });
    const rows = db
      .prepare("select data from message order by rowid desc limit 400")
      .all()
      .map((r) => JSON.parse(r.data))
      .filter((m) => m.role === "assistant" && m.path?.cwd === dir);
    db.close();
    if (!rows.length) return "none";
    return rows[0].finish === "unknown" && !rows[0].tokens?.total ? "dropped" : "ended";
  } catch {
    return "unknown";
  }
}

const logPath = opts.log || join(dir, "..", `${repoName}-run.jsonl`);

/// Mirror the claude runner's stream-json transcript to disk and print one
/// condensed line per event, so a background run stays tailable.
function pipeTranscript(child) {
  const raw = createWriteStream(logPath, { flags: "a" });
  createInterface({ input: child.stdout }).on("line", (line) => {
    raw.write(line + "\n");
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      return;
    }
    for (const block of ev.message?.content ?? []) {
      if (block.type === "text" && block.text.trim())
        console.log(`· ${block.text.trim().replace(/\s+/g, " ").slice(0, 220)}`);
      if (block.type === "tool_use") {
        const i = block.input ?? {};
        const detail = i.command ?? i.file_path ?? i.pattern ?? i.url ?? i.prompt ?? "";
        console.log(`▸ ${block.name}: ${String(detail).replace(/\s+/g, " ").slice(0, 180)}`);
      }
    }
    if (ev.type === "result")
      console.log(`= result: ${ev.subtype} · ${ev.num_turns} turns · $${(ev.total_cost_usd ?? 0).toFixed(2)}`);
  });
  child.stderr.pipe(process.stderr);
}

console.log(`▶ Running benchmark for ${opts.model} (runner: ${runner})`);
console.log(`  repo name : ${repoName}`);
console.log(`  build dir : ${dir}`);
console.log(`  variant   : ${opts.variant || "(model default)"}`);
if (runner === "opencode") {
  console.log(`  isolation : empty XDG_CONFIG_HOME=${configDir} + OPENCODE_DISABLE_CLAUDE_CODE=1`);
  console.log(`  resumes   : ${resumeLimit} (on a severed stream)`);
}
if (runner === "claude") console.log(`  transcript: ${logPath}`);
console.log(`  prompt    : ${prompt}\n`);

const run = (args, env) =>
  new Promise((resolve) => {
    const child =
      runner === "opencode"
        ? spawn("opencode", args, { stdio: "inherit", cwd: dir, env })
        : spawn("claude", args, { stdio: ["ignore", "pipe", "pipe"], cwd: dir });
    if (runner === "claude") pipeTranscript(child);
    child.on("exit", (code) => resolve(code ?? 1));
  });

let code =
  runner === "opencode"
    ? await run(opencodeArgs(false), opencodeEnv())
    : await run(claudeArgs(), process.env);

if (runner === "opencode")
  for (let attempt = 1; attempt <= resumeLimit && code === 0 && lastTurn() === "dropped"; attempt++) {
    console.log(`\n⟳ stream dropped mid-run (attempt ${attempt}/${resumeLimit}) — resuming the same session`);
    code = await run(opencodeArgs(true), opencodeEnv());
  }

console.log(`\n─────────────────────────────────────────────`);
if (code === 0 && runner === "opencode" && lastTurn() === "dropped")
  console.log(`✗ still dropping after ${resumeLimit} resumes. The run is incomplete — do not ingest it.`);
else if (code === 0) {
  console.log(`✓ ${runner} run finished. The model should have created "${repoName}" and deployed it.`);
  console.log(`\nNext — ingest and grade:`);
  console.log(`  node scripts/add-submission.mjs https://github.com/<owner>/${repoName} --model "<Name>" [--effort <e>]`);
  console.log(`  # then grade it — see docs/running-a-benchmark.md`);
} else {
  console.log(`✗ ${runner} run exited with code ${code}. Inspect ${dir} and the model's own repo before ingesting.`);
}
process.exit(code);
