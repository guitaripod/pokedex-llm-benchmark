import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "https://pokedex-deepseek-v4-flash-r2.guitaripod.workers.dev";
mkdirSync("/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => errors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
process.on("unhandledRejection", (e) => { dump(); throw e; });
process.on("uncaughtException", (e) => { dump(); throw e; });
function dump() { console.log("=== ERRORS SO FAR ==="); console.log(errors.length ? errors.join("\n") : "none"); }

await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForSelector(".card", { timeout: 20000 });
await page.waitForTimeout(1500);
console.log("cards on first page:", await page.locator(".card").count());
console.log("result count:", await page.textContent("#result-count"));
await page.screenshot({ path: "/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots/01-grid.png" });

// open first pokemon
await page.locator(".card").first().click();
await page.waitForSelector(".detail", { timeout: 15000 });
await page.waitForTimeout(1200);
console.log("detail name:", await page.textContent(".detail-identity h2"));
await page.screenshot({ path: "/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots/02-detail-about.png" });

// switch tabs
for (const tab of ["stats", "evolution", "moves", "matchups"]) {
  await page.locator(`[data-tab="${tab}"]`).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots/03-${tab}.png` });
}

// shiny toggle
await page.locator("[data-shiny]").click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots/04-shiny.png" });

// search filter
await page.keyboard.press("Escape");
await page.locator("#search").fill("chari");
await page.waitForTimeout(1200);
console.log("search 'chari' results:", await page.textContent("#result-count"));
await page.screenshot({ path: "/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots/05-search.png" });
await page.locator("#search").fill("");
await page.waitForTimeout(800);

// type filter fire
await page.locator('[data-type="fire"]').click();
await page.waitForTimeout(800);
console.log("fire results:", await page.textContent("#result-count"));
await page.locator('[data-type="fire"]').click();

// random button
await page.locator("#random-btn").click();
await page.waitForSelector(".detail", { timeout: 15000 });
await page.waitForTimeout(800);
console.log("random opened:", await page.textContent(".detail-identity h2"));
await page.screenshot({ path: "/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots/06-random.png" });
await page.keyboard.press("Escape");

// compare
await page.locator(".card").nth(3).click();
await page.waitForSelector(".detail", { timeout: 15000 });
await page.locator("[data-compare]").click();
await page.waitForSelector(".compare-panel", { timeout: 15000 });
// pick a second pokemon
await page.locator("[data-slot='b']").click();
await page.waitForSelector(".compare-picklist li", { timeout: 10000 });
await page.locator(".compare-picklist li").nth(2).click();
await page.waitForTimeout(1200);
console.log("compare stats rendered:", await page.locator(".compare-stat-row").count());
await page.screenshot({ path: "/tmp/opencode/pokedex-deepseek-v4-flash-r2/shots/07-compare.png" });
await page.keyboard.press("Escape");

console.log("=== ERRORS ===");
console.log(errors.length ? errors.join("\n") : "none");
await browser.close();
