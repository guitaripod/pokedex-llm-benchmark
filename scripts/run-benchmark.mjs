#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "submissions.json"), "utf8"));

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++)
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];

if (!opts.model || !opts.name) {
  console.error(
    `Run the benchmark: hand a model the canonical prompt and let it build + deploy a Pokédex
fully autonomously via opencode (it uses gh + wrangler itself).

Usage:
  node scripts/run-benchmark.mjs --model <provider/model> --name <token> [--variant <effort>] [--dir <path>]

  --model    opencode model id, e.g. opencode/deepseek-v4-flash-free, anthropic/claude-opus-4-8
  --name     name token for the repo — the model is told to "call it pokedex-<name>"
             (encode the model + effort, e.g. deepseek-v4-flash, sonnet-5-high)
  --variant  provider reasoning effort passed to opencode (e.g. high, max, minimal)
  --dir      working directory the model builds in (default: ~/Dev/pokedex-<name>)

Example (the free DeepSeek from opencode):
  node scripts/run-benchmark.mjs --model opencode/deepseek-v4-flash-free --name deepseek-v4-flash

The run is fully autonomous (opencode --auto). When it finishes, the model will have
created its own GitHub repo (pokedex-<name>) and deployed it to Cloudflare. Then ingest it:
  node scripts/add-submission.mjs <repo-url> --model "<Name>" [--effort <e>]
and grade it (see docs/running-a-benchmark.md).`,
  );
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

const ocArgs = ["run", prompt, "--model", opts.model, "--auto"];
if (opts.variant) ocArgs.push("--variant", opts.variant);
ocArgs.push("--dir", dir, "--title", `benchmark: ${repoName}`);

console.log(`▶ Running benchmark for ${opts.model}`);
console.log(`  repo name : ${repoName}`);
console.log(`  build dir : ${dir}`);
console.log(`  variant   : ${opts.variant || "(model default)"}`);
console.log(`  prompt    : ${prompt}\n`);

const child = spawn("opencode", ocArgs, { stdio: "inherit", cwd: dir });
child.on("exit", (code) => {
  console.log(`\n─────────────────────────────────────────────`);
  if (code === 0) {
    console.log(`✓ opencode run finished. The model should have created "${repoName}" and deployed it.`);
    console.log(`\nNext — ingest and grade:`);
    console.log(`  node scripts/add-submission.mjs https://github.com/<owner>/${repoName} --model "<Name>" [--effort <e>]`);
    console.log(`  # then grade it — see docs/running-a-benchmark.md`);
  } else {
    console.log(`✗ opencode run exited with code ${code}. Inspect ${dir} and the model's own repo before ingesting.`);
  }
  process.exit(code ?? 1);
});
