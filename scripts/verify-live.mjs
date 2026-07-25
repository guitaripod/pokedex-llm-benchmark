#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "submissions.json"), "utf8"));

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith("--"));

/// The mount point a SPA renders into survives bundling, so it is the cheapest
/// fingerprint that ties a deployment to the source that produced it.
const rootIds = (html) => [...html.matchAll(/<(?:div|main)[^>]*\bid=["']([\w-]+)["']/g)].map((m) => m[1]);

const fingerprint = (html) => ({
  title: (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "").trim(),
  roots: rootIds(html),
  bundled: /\/assets\/[\w.-]+\.js|\.\w{8}\.js/.test(html),
  scripts: [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1].split("?")[0]),
});

/// A live URL that serves a different app than the vendored source silently
/// invalidates every runtime-derived signal for that submission.
async function check(sub) {
  const local = ["index.html", "public/index.html", "src/index.html", "dist/index.html"]
    .map((p) => join(ROOT, "submissions", sub.id, p))
    .find(existsSync);
  if (!sub.liveUrl) return { verdict: "no-url" };
  if (!local) return { verdict: "no-local-index" };

  const res = await fetch(sub.liveUrl, { redirect: "follow" }).catch(() => null);
  if (!res || !res.ok) return { verdict: "unreachable", detail: res ? `HTTP ${res.status}` : "fetch failed" };

  const live = fingerprint(await res.text());
  const src = fingerprint(readFileSync(local, "utf8"));
  const bundler = sub.stack?.bundler ?? "none";

  if (src.roots.length && live.roots.length && !src.roots.some((r) => live.roots.includes(r)))
    return { verdict: "MISMATCH", detail: `mount point #${src.roots.join("/#")} in source, #${live.roots.join("/#")} live` };
  if (bundler !== "none" && !live.bundled)
    return { verdict: "MISMATCH", detail: `source builds with ${bundler} but the live page loads no bundled asset (${live.scripts.join(", ") || "no scripts"})` };
  if (src.title && live.title && src.title !== live.title)
    return { verdict: "suspect", detail: `title "${src.title}" vs live "${live.title}"` };
  return { verdict: "ok" };
}

const targets = only ? manifest.submissions.filter((s) => s.id === only) : manifest.submissions;
let bad = 0;
for (const sub of targets) {
  const r = await check(sub);
  if (r.verdict === "MISMATCH") bad += 1;
  console.log(`${r.verdict === "ok" ? "✓" : r.verdict === "MISMATCH" ? "✗" : "·"} ${sub.id.padEnd(20)} ${r.verdict}${r.detail ? ` — ${r.detail}` : ""}`);
}
console.log(
  bad
    ? `\n✗ ${bad} submission(s) whose live URL does not serve the vendored source. Every runtime signal for them is meaningless — fix liveUrl, or record the mismatch and measure a local build instead.`
    : `\n✓ every live URL serves the vendored source.`,
);
process.exit(bad ? 1 : 0);
