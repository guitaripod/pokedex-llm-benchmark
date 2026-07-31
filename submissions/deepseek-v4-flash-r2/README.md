# Pokédex Ultra

The greatest Pokédex ever built. All **1025 Pokémon** — every species from Bulbasaur to Pecharunt — with the complete PokeAPI dataset served at the edge.

**Live:** https://pokedex-deepseek-v4-flash-r2.guitaripod.workers.dev

## What it has

- **Full National Dex** — all 1025 Pokémon, 18 types, 9 generations
- **Search & filter** — by name, number, type (single/double), generation, rarity, caught status; sort by dex №, name, BST, height, weight
- **Rich detail view** with 5 tabs:
  - **About** — genus, flavor text (8 languages), localized names, height/weight, base experience, gender ratio bar, egg groups, habitat, growth rate, capture rate, hatch steps, body shape, Pokédex color, abilities (click for full effect text)
  - **Stats** — animated bars + SVG radar chart + base stat total
  - **Evolution** — full evolution family trees with item triggers and evolution-item sprites
  - **Moves** — every learnable move grouped by method (Level / Egg / TM-TR / Tutor) with type, category, power, accuracy, PP, and effect text
  - **Matchups** — live type-effectiveness tables for both damage taken and damage dealt
- **Shiny toggle**, **cry playback**, sprite modes (Official art / Home / Dream / Pixel)
- **Compare** any two Pokémon stat-vs-stat
- **Random Pokémon** button
- **Personal collection** — mark caught / shiny, tracked with a progress bar (persisted in localStorage)
- Keyboard shortcuts: `/` search, `←` `→` prev/next, `Esc` close

## Architecture

```
PokeAPI (raw, ~60 MB across 3,900+ endpoints)
        │  scripts/ingest.js (one-time)
        ▼
transformed compact payloads (~9 MB)
        │  wrangler kv bulk put
        ▼
Cloudflare KV  ──►  Cloudflare Worker  ──►  static SPA (vanilla JS, zero deps)
  (2169 keys)        /api/* endpoints          served from public/
                     + SPA fallback
```

- **Ingest** (`scripts/ingest.js`) pulls every Pokémon + species, evolution chain, move, ability, item, and type, transforms them into compact payloads, and writes them to KV. Resumable, retry-safe, ~10 seconds.
- **Worker** (`src/index.ts`) serves `/api/pokemon`, `/api/pokemon/:id`, `/api/moves`, `/api/abilities`, `/api/items`, `/api/types`, `/api/random`, `/api/meta` from KV with immutable-ish cache headers, plus static assets and client-side-route fallback.
- **Frontend** (`public/`) is a dependency-free vanilla JS SPA. No build step, no framework, instant loads.

## Development

```bash
npm install
npm run ingest   # regenerate data/ from PokeAPI (optional — prod KV already seeded)
npm run dev      # wrangler dev --remote
npm run deploy   # wrangler deploy
```

> Note: `wrangler dev` needs `--remote` to read the seeded production KV namespace.

## Data

All data © PokeAPI and Nintendo / GAME FREAK. Sprites and artwork © Nintendo / Creatures Inc. / GAME FREAK.

## License

GPL-3.0. See [LICENSE](LICENSE).
