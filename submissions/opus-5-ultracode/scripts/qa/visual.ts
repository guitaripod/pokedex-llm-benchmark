/**
 * Renders every route in headless Chromium and reports layout, console and network defects.
 *
 * Run against `wrangler dev` (not `vite preview`) so the Worker's sprite and cry proxies are live:
 *   npm run build && npx wrangler dev --port 8788 &
 *   npm run qa
 */
import { chromium, type Browser, type Page } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.QA_BASE ?? 'http://localhost:8788'
const OUT = process.env.QA_OUT ?? '.qa'

interface RouteCase {
  name: string
  path: string
  /** Virtualized pages report a huge document height; capture the viewport instead. */
  viewportOnly?: boolean
}

const ROUTES: RouteCase[] = [
  { name: 'home', path: '/' },
  { name: 'pokedex', path: '/pokedex', viewportOnly: true },
  { name: 'pokemon-charizard', path: '/pokemon/charizard' },
  { name: 'pokemon-eevee', path: '/pokemon/eevee' },
  { name: 'pokemon-mega', path: '/pokemon/charizard-mega-x' },
  { name: 'pokemon-shedinja', path: '/pokemon/shedinja' },
  { name: 'pokemon-eternatus', path: '/pokemon/eternatus-eternamax' },
  { name: 'moves', path: '/moves', viewportOnly: true },
  { name: 'move-detail', path: '/moves/thunderbolt' },
  { name: 'move-status', path: '/moves/splash' },
  { name: 'items', path: '/items', viewportOnly: true },
  { name: 'item-detail', path: '/items/leftovers' },
  { name: 'item-berry', path: '/items/oran-berry' },
  { name: 'abilities', path: '/abilities', viewportOnly: true },
  { name: 'ability-detail', path: '/abilities/levitate' },
  { name: 'locations', path: '/locations', viewportOnly: true },
  { name: 'location-detail', path: '/locations/viridian-forest' },
  { name: 'types', path: '/types' },
  { name: 'type-detail', path: '/types/dragon' },
  { name: 'natures', path: '/natures' },
  { name: 'berries', path: '/berries' },
  { name: 'machines', path: '/machines', viewportOnly: true },
  { name: 'pokedexes', path: '/pokedexes' },
  { name: 'pokedex-detail', path: '/pokedexes/2', viewportOnly: true },
  { name: 'team', path: '/team' },
  { name: 'compare', path: '/compare?ids=6,9,3' },
  { name: 'calc-damage', path: '/calc/damage' },
  { name: 'calc-catch', path: '/calc/catch' },
  { name: 'coverage', path: '/coverage' },
  { name: 'leaderboard', path: '/leaderboard' },
  { name: 'whos-that', path: '/play/whos-that' },
  { name: 'favorites', path: '/favorites' },
  { name: 'settings', path: '/settings' },
  { name: 'about', path: '/about' },
  { name: 'notfound', path: '/definitely-not-a-page' },
]

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]

interface Result {
  viewport: string
  name: string
  path: string
  status: number
  textLength: number
  overflow: number
  errors: string[]
  missing: string[]
}

/// Ignores media 404s: a handful of alternate forms genuinely have no upstream sprite.
function isReportable(url: string): boolean {
  return !url.includes('/img/') && !url.includes('/cry/')
}

async function capture(page: Page, route: RouteCase, viewport: (typeof VIEWPORTS)[number]): Promise<Result> {
  const errors: string[] = []
  const missing: string[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (/Failed to load resource/.test(text)) return
    errors.push(text.slice(0, 200))
  })
  page.on('pageerror', (error) => errors.push(`uncaught: ${error.message.slice(0, 200)}`))
  page.on('response', (response) => {
    if (response.status() >= 400 && isReportable(response.url())) {
      missing.push(`${response.status()} ${new URL(response.url()).pathname}`)
    }
  })

  let status = 0
  try {
    const response = await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 45000 })
    status = response?.status() ?? 0
  } catch (error) {
    errors.push(`navigation: ${(error as Error).message.slice(0, 160)}`)
  }

  await page.waitForTimeout(900)

  const textLength = await page.evaluate(() => document.body.innerText.trim().length).catch(() => 0)
  const overflow = await page
    .evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    .catch(() => 0)

  await page
    .screenshot({
      path: `${OUT}/${viewport.name}-${route.name}.png`,
      fullPage: !route.viewportOnly && viewport.name === 'desktop',
    })
    .catch(() => undefined)

  return {
    viewport: viewport.name,
    name: route.name,
    path: route.path,
    status,
    textLength,
    overflow,
    errors: errors.slice(0, 5),
    missing: [...new Set(missing)].slice(0, 5),
  }
}

async function run(browser: Browser): Promise<Result[]> {
  const results: Result[] = []
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
    })
    for (const route of ROUTES) {
      const page = await context.newPage()
      results.push(await capture(page, route, viewport))
      await page.close()
    }
    await context.close()
  }
  return results
}

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const results = await run(browser)
await browser.close()

writeFileSync(`${OUT}/report.json`, JSON.stringify(results, null, 2))

const problems = results.filter(
  (r) => r.errors.length > 0 || r.missing.length > 0 || r.textLength < 200 || r.overflow > 2,
)

console.log(`captured ${results.length} renders — ${problems.length} with problems`)
for (const problem of problems) {
  console.log(
    `\n[${problem.viewport}] ${problem.name} (${problem.path}) status=${problem.status} text=${problem.textLength} overflow=${problem.overflow}`,
  )
  for (const error of problem.errors) console.log(`   ! ${error}`)
  for (const item of problem.missing) console.log(`   x ${item}`)
}

if (problems.length > 0) process.exitCode = 1
