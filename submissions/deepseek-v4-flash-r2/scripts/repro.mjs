import { chromium } from "playwright";
const BASE = "http://localhost:8787";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => errors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector(".card");
await page.locator("#random-btn").click();
await page.waitForTimeout(4000);
console.log("detail exists:", await page.locator(".detail").count());
console.log("hash:", await page.evaluate(() => location.hash));
console.log("toast:", await page.textContent("#toast"));
console.log("errors:", errors.length ? errors.join("\n") : "none");
await browser.close();
