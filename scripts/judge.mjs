#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { JUDGE_FLAGS, SANDBOX, refreshSandbox, fingerprint, assertUnchanged } from "./lib/judge.mjs";

const run = promisify(execFile);
const args = process.argv.slice(2);
const opts = {};
const positional = [];
for (let i = 0; i < args.length; i++)
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);

if (!positional[0]) {
  console.error(
    `Run one grading prompt through a judge, contained.

Usage:
  node scripts/judge.mjs <prompt-file> [--model <m>] [--effort <e>] [--label <text>]

The judge runs in a read-only copy of this repo with the operator's user settings
and memory switched off, and the working repo is fingerprinted before and after —
a judge that writes to it fails the stage instead of quietly corrupting what it
grades. Emits the raw \`claude -p --output-format json\` result on stdout.`,
  );
  process.exit(1);
}

const model = opts.model || "claude-opus-5";
const effort = opts.effort || "high";
const label = opts.label || positional[0];

refreshSandbox();
const before = fingerprint();
const { stdout } = await run(
  "claude",
  ["-p", readFileSync(positional[0], "utf8"), "--model", model, "--effort", effort, ...JUDGE_FLAGS],
  { maxBuffer: 256 * 1024 * 1024, cwd: SANDBOX },
);
assertUnchanged(before, label);
process.stdout.write(stdout);
