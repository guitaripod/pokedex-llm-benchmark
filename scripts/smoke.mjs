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
/// Scroll a browse page to exhaustion and count the distinct species it will
/// actually hand a user. Separates a working feed (paged, infinite or
/// virtualized — all reach ~1025) from one that silently stops early.
async function reachableSpecies(page) {
  const ids = () =>
    page
      .evaluate(() => {
        const found = new Set();
        const add = (s) => {
          for (const m of String(s).matchAll(/(?:^|[^\d])(\d{1,4})(?:\.(?:png|webp|jpg|jpeg|svg|gif)|\b)/g)) {
            const n = Number(m[1]);
            if (n >= 1 && n <= 1025) found.add(n);
          }
        };
        for (const img of document.images) if (/sprite|artwork|pokemon|home|dream/i.test(img.src)) add(img.src);
        for (const el of document.querySelectorAll("*")) {
          const bg = getComputedStyle(el).backgroundImage;
          if (bg && bg !== "none" && /sprite|artwork|pokemon/i.test(bg)) add(bg);
        }
        for (const a of document.querySelectorAll("a[href]")) {
          const h = a.getAttribute("href") || "";
          if (/pokemon|species|dex/i.test(h)) add(h);
        }
        for (const m of (document.body?.innerText || "").matchAll(/#\s?(\d{1,4})\b/g)) {
          const n = Number(m[1]);
          if (n >= 1 && n <= 1025) found.add(n);
        }
        return [...found];
      })
      .catch(() => []);

  const seen = new Set(await ids());
  let stagnant = 0;
  for (let i = 0; i < 400 && stagnant < 40; i++) {
    const before = seen.size;
    await page
      .evaluate(() => {
        window.scrollBy(0, 600);
        for (const el of document.querySelectorAll("*"))
          if (el.scrollHeight > el.clientHeight + 50 && getComputedStyle(el).overflowY !== "visible")
            el.scrollTop += 600;
      })
      .catch(() => {});
    await page.waitForTimeout(90);
    for (const s of await ids()) seen.add(s);
    stagnant = seen.size > before ? 0 : stagnant + 1;
  }
  return seen.size;
}

/// The browse surface is not always "/" — follow the nav links that look like a
/// dex/browse route (hash routes included) and keep whichever page exposes the
/// most species.
async function measureDexReach(page, base) {
  const navHref = await page
    .$$eval("a[href]", (as) =>
      as
        .filter((a) => /dex|browse|all\b|pok[eé]mon/i.test(a.textContent || ""))
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && !/^(https?:|mailto:|tel:)/.test(h) && !/\/(pokemon|species)\/[^/]+$/i.test(h)),
    )
    .catch(() => []);
  const routes = ["", ...new Set(navHref)].slice(0, 5);

  let best = { reach: 0, route: "/", pager: false };
  for (const r of routes) {
    const url = new URL(r || "/", base).href;
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    if (!resp) continue;
    await page.waitForTimeout(1500);
    const reach = await reachableSpecies(page);
    if (reach > best.reach)
      best = { reach, route: new URL(url).pathname + new URL(url).hash, pager: await hasPager(page) };
    if (best.reach >= 1025) break;
  }
  return best;
}

/// A browse page that stops short is only a defect if there is no way onward —
/// pagination or a load-more button means the rest of the dex is still reachable.
function hasPager(page) {
  return page
    .evaluate(() =>
      [...document.querySelectorAll('button, a, [role="button"]')].some((el) => {
        const t = (el.textContent || "").trim().toLowerCase();
        return (
          /^(next|load more|show more|more|»|→|›)\b/.test(t) ||
          /\bnext page\b|\bload more\b/.test(t) ||
          /next|more/i.test(el.getAttribute("aria-label") || "")
        );
      }),
    )
    .catch(() => false);
}

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

    const dex = await measureDexReach(page, sub.liveUrl);
    rec.dexReach = dex.reach || null;
    rec.dexRoute = dex.reach ? dex.route : null;
    if (dex.reach && dex.reach < 1025) rec.dexPager = dex.pager;
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
  console.log(
    `${rec.verdict.toUpperCase()} (load=${rec.loadOk} content=${rec.contentOk} console=${rec.consoleErrors} jsErr=${rec.pageErrors} detail=${rec.detailOk} dexReach=${rec.dexReach ?? "?"}@${rec.dexRoute ?? "?"})`,
  );
}
await browser.close();

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nUpdated runtime for ${targets.length} submission(s). Re-grade robustness or regenerate to surface it.`);
