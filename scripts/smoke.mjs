#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "submissions.json");

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++)
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[i + 1]?.startsWith("--") || args[i + 1] === undefined ? true : args[++i];

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const targets = opts.all
  ? manifest.submissions
  : manifest.submissions.filter((s) => s.id === opts.submission);

if (!targets.length) {
  console.error("Usage: node scripts/smoke.mjs (--submission <id> | --all)\n  Loads live deployments headless and records an objective `runtime` signal per submission.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

/// Load one live deployment, capturing uncaught JS exceptions, console errors,
/// whether real content rendered, and whether an in-app detail route navigates
/// cleanly. Returns the objective `runtime` record stored in the manifest.
async function smoke(browser, sub) {
  const page = await browser.newPage();
  let consoleErrors = 0;
  let pageErrors = 0;
  page.on("console", (m) => m.type() === "error" && (consoleErrors += 1));
  page.on("pageerror", () => (pageErrors += 1));

  const rec = { loadOk: false, contentOk: false, consoleErrors: 0, pageErrors: 0, detailOk: false, verdict: "broken", checkedAt: today };
  try {
    const resp = await page.goto(sub.liveUrl, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    rec.loadOk = !!resp && resp.status() < 400;
    await page.waitForTimeout(2500);
    const text = (await page.evaluate(() => document.body?.innerText || "").catch(() => "")).trim();
    const imgs = await page.evaluate(() => document.images.length).catch(() => 0);
    rec.contentOk = text.length > 200 || imgs > 5;

    const href = await page
      .$$eval("a[href]", (as) =>
        as
          .map((a) => a.getAttribute("href"))
          .find((h) => h && !/^(https?:|#|mailto:|tel:)/.test(h) && /\d|pokemon|dex|detail|species/i.test(h)),
      )
      .catch(() => null);
    if (href) {
      const before = pageErrors;
      await page.goto(new URL(href, sub.liveUrl).href, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const dtext = (await page.evaluate(() => document.body?.innerText || "").catch(() => "")).trim();
      rec.detailOk = pageErrors === before && dtext.length > 100;
    } else {
      rec.detailOk = rec.contentOk;
    }
  } catch (e) {
    rec.error = String(e).slice(0, 200);
  } finally {
    await page.close();
  }

  rec.consoleErrors = consoleErrors;
  rec.pageErrors = pageErrors;
  rec.verdict = !rec.loadOk || !rec.contentOk ? "broken" : rec.pageErrors > 0 || !rec.detailOk ? "errors" : "clean";
  return rec;
}

const browser = await chromium.launch({ headless: true });
for (const sub of targets) {
  process.stdout.write(`▶ ${sub.id.padEnd(20)} ${sub.liveUrl} … `);
  const rec = await smoke(browser, sub);
  sub.runtime = rec;
  console.log(`${rec.verdict.toUpperCase()} (load=${rec.loadOk} content=${rec.contentOk} console=${rec.consoleErrors} jsErr=${rec.pageErrors} detail=${rec.detailOk})`);
}
await browser.close();

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nUpdated runtime for ${targets.length} submission(s). Re-grade robustness or regenerate to surface it.`);
