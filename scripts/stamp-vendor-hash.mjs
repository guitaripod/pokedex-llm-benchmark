#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { vendorHash } from "./lib/analyze.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");

let changed = 0;
for (const s of manifest.submissions) {
  if (only.length && !only.includes(s.id)) continue;
  const dir = join(ROOT, "submissions", s.id);
  if (!existsSync(dir)) {
    console.error(`  ! ${s.id}: no vendored source`);
    continue;
  }
  const h = vendorHash(dir);
  if (s.vendorHash === h) continue;
  if (s.vendorHash && !force) {
    console.error(`  ! ${s.id}: hash differs from the recorded one — pass --force only if the change is intended`);
    continue;
  }
  s.vendorHash = h;
  changed += 1;
  console.log(`  ✓ ${s.id.padEnd(22)} ${h.slice(7, 19)}`);
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nStamped ${changed} submission(s).`);
