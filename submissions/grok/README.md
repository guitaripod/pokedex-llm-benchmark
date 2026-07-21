# Pokédex — Production Ready

> **Note:** This was built to quickly test Grok build in Q3 2026.

A beautiful, fully-featured, production-quality Pokédex web application.

Built with React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Lucide icons, and Sonner toasts.

## Features

- **Instant beautiful experience** — Dark cinematic UI, high-quality official artwork, smooth micro-interactions and modal animations
- **Powerful exploration** — Instant search (name or number), multi-select type filters, 9 generations + full National Dex
- **Advanced sorting** — ID, name, or highest HP / BST
- **Advanced filters** — Legendaries + Mythicals, minimum BST, ability search (URL synced)
- **Favorites system** — Persistent via localStorage with dedicated view and count
- **Rich detail modal** — Large artwork, flavor text, animated stat bars + SVG radar chart, height/weight, abilities, evolution chains, level-up moves, cries, type matchups, +TEAM button, keyboard navigation (← → Esc)
- **Team Lab** (⌘K) — Powerful multi-team builder with persistent saved teams, live coverage from real matchups, smart suggestions, favorites/quick-add from grid, Showdown export, random fill. Teams persist in localStorage.
- **Progressive loading** — Fast initial load of 180 Pokémon + seamless "Load more"
- **Fully client-side filtering** — Snappy even with hundreds loaded. Shareable URLs for filters
- **Production hardened** — TypeScript strict, proper error states + retry, loading skeletons, optimized build
- **Keyboard friendly** — Search focus, modal navigation, ⌘K for Team Lab, accessible interactions
- **Responsive** — Perfect on mobile, tablet, desktop

## Run locally

```bash
cd /home/marcus/pokedex
npm install
npm run dev
```

Open http://localhost:5173

## Production build

```bash
npm run build
npm run preview
```

The `dist/` folder contains a fully optimized static site ready for any hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc).

## Tech

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (via Vite plugin)
- Framer Motion (modal + polish)
- Sonner (beautiful toasts)
- Lucide React icons
- PokéAPI (https://pokeapi.co) — all data fetched live on the client

## Architecture notes

- Strong typing for all Pokémon data
- In-memory cache + localStorage for favorites
- Client-side filtering/sorting for instant UX
- Progressive batch loading (no unnecessary upfront requests)
- Clean component extraction (Card, StatBar)

No external backend required. Everything is self-contained and deployable as static assets.

Enjoy exploring the world of Pokémon.

## GitHub

https://github.com/guitaripod/pokedex (master)

## Live Site

**https://pokedex-a7l.pages.dev**

Hosted on Cloudflare Pages.

## CI / CD

GitHub Actions (`.github/workflows/ci.yml`):

- On PR / push to master: **Release Check** — `npm ci`, `npm run lint`, `npm run build`
- On push to master: after checks pass, deploys to Cloudflare Pages using Wrangler.

### Required GitHub Secrets

Set these in the repo (Settings > Secrets and variables > Actions):

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Pages:Edit` permission for the account.
  1. Go to https://dash.cloudflare.com/profile/api-tokens
  2. Create Token → Custom token
  3. Permissions: Account | Pages | Edit
  4. Account Resources: Include All accounts (or your specific)
  5. TTL or no expiry
  6. Create → Copy the token
  7. `gh secret set CLOUDFLARE_API_TOKEN --repo guitaripod/pokedex`

- `CLOUDFLARE_ACCOUNT_ID` (optional but recommended): set it in GitHub Secrets (copy the value from your Cloudflare dashboard)

After setting the token, new pushes to master will auto-deploy.

## Deploy manually

```bash
npm run build
wrangler pages deploy dist --project-name=pokedex --branch=master
```

