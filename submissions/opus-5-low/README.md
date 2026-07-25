# pokedex-opus-5-low

A complete, fast Pokédex web app built from the entire [PokéAPI](https://pokeapi.co) dataset and deployed on Cloudflare Workers static assets.

**Live:** https://pokedex-opus-5-low.guitaripod.workers.dev

## What's in it

- **1,351 Pokémon** (all species plus every alternate form: megas, gigantamax, regional variants)
- **937 moves**, **373 abilities**, **2,223 items**, **68 berries**, 18 types, 25 natures, every regional Pokédex
- Full per-Pokémon detail: base stats with percentile ranking, type-defence matrix, abilities, breeding and training data, evolution trees with exact trigger conditions, wild-encounter tables, sprite galleries across every game generation, Pokédex entries per version, cries
- **Move browser** — sortable/filterable on power, accuracy, PP, priority, class, type, generation; per-move mechanics (ailments, drain, healing, multi-hit, stat changes, TM availability, learners)
- **Team builder** — six slots with combined weakness/resistance counts, STAB coverage analysis and shared-threat detection
- **Compare** — up to six Pokémon side by side with radar stat shapes and defensive matchups
- **Trainer tools** — damage calculator (levels, IVs/EVs, nature, stat stages, crits, burn), catch-rate odds per ball/status/HP, experience curves
- **Type chart** — full 18×18 matrix plus a dual-type defence calculator
- **Who's that Pokémon?** — silhouette guessing game with streak tracking
- ⌘K command palette across Pokémon, moves, abilities, items and pages; favourites; light/dark themes; deep-linkable filter state

## Architecture

The app ships a **pre-baked static dataset** — no runtime calls to PokéAPI, so every view is a single cached fetch from Cloudflare's edge.

- `scripts/build-data.mjs` crawls PokéAPI (resumable on-disk cache in `.cache/`) and emits `public/data/`: a compact `index.json` for browsing plus one JSON file per Pokémon / move / ability / item for detail views.
- `src/` is a React + TypeScript SPA (Vite), route-code-split, with no UI framework — hand-written CSS design system in `src/styles.css`.
- Deployed as a Worker with `assets` + SPA fallback (`wrangler.jsonc`).

## Develop

```sh
npm install
npm run data     # crawl PokéAPI → public/data (~104 MB, resumable)
npm run dev
npm run deploy   # build + wrangler deploy
```

`public/data/` and `.cache/` are gitignored — regenerate with `npm run data`.

## Licence

GPL-3.0. Pokémon data © Nintendo / Game Freak / The Pokémon Company, served via PokéAPI.
