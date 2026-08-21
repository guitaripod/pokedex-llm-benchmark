import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/// Every judge runs headless with --dangerously-skip-permissions, so the usual
/// permission prompt is not there to stop it writing. Three things follow.
///
/// `--setting-sources ""` drops the operator's user settings *and* memory: an
/// unflagged `claude -p` on this machine inherits ~/.claude/CLAUDE.md and every
/// UserPromptSubmit hook, so the judge grading a submission's code quality would
/// be reading house rules about comment style and licensing while it scored. It
/// is the same contamination the runner avoids on the model side.
///
/// `--no-session-persistence` keeps thirteen judge transcripts per submission out
/// of the operator's session list.
///
/// Disallowing the edit tools is not containment — Bash can still write — so it
/// pairs with the read-only sandbox below and the fingerprint check after.
export const JUDGE_FLAGS = [
  "--dangerously-skip-permissions",
  "--setting-sources",
  "",
  "--no-session-persistence",
  "--disallowed-tools",
  "Edit",
  "Write",
  "NotebookEdit",
  "--output-format",
  "json",
];

/// Judges are pointed here instead of at the working repo. It is a copy, and it
/// is read-only, so an agent that decides to "helpfully" patch the harness or
/// drop a scratch probe script into a vendored submission fails loudly at the
/// write instead of silently corrupting the artifact it is grading.
export const SANDBOX = join(tmpdir(), "pokedex-bench-sandbox");

export function refreshSandbox() {
  if (existsSync(SANDBOX)) execFileSync("chmod", ["-R", "u+w", SANDBOX]);
  mkdirSync(SANDBOX, { recursive: true });
  execFileSync("rsync", [
    "-a",
    "--delete",
    "--exclude",
    ".git/",
    "--exclude",
    "node_modules/",
    `${ROOT}/`,
    `${SANDBOX}/`,
  ]);
  const modules = join(SANDBOX, "node_modules");
  if (!existsSync(modules) && existsSync(join(ROOT, "node_modules")))
    symlinkSync(join(ROOT, "node_modules"), modules);
  execFileSync("chmod", ["-R", "a-w", SANDBOX]);
  return SANDBOX;
}

export function disposeSandbox() {
  if (!existsSync(SANDBOX)) return;
  execFileSync("chmod", ["-R", "u+w", SANDBOX]);
  rmSync(SANDBOX, { recursive: true, force: true });
}

const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/// A hash of everything git can see moving: HEAD, the porcelain status, and the
/// content of every path that status names. Modifying a clean tracked file makes
/// it appear as `M`; modifying an already-dirty one changes its content hash.
export function fingerprint() {
  const status = git("status", "--porcelain", "-uall");
  const h = createHash("sha256").update(git("rev-parse", "HEAD")).update(status);
  for (const line of status.split("\n")) {
    const path = line.slice(3).trim().replace(/^"|"$/g, "");
    if (!path) continue;
    const abs = join(ROOT, path);
    h.update(path).update(existsSync(abs) ? readFileSync(abs) : "");
  }
  return h.digest("hex");
}

/// Fail the stage rather than repair it: a judge that reached the real repo has
/// already invalidated its own independence, and silently reverting would hide
/// that from whoever reads the grade.
export function assertUnchanged(before, label) {
  if (fingerprint() === before) return;
  console.error(
    `\n! ${label} modified the working repo — the sandbox was bypassed.\n` +
      `  Inspect and revert before trusting this grade:\n${git("status", "--short")}`,
  );
  process.exit(1);
}
