# Pokedex Ox Alpha Max

The greatest Pokedex ever built — a production-tier web app covering **every** Pokemon, move, ability, item and berry, powered by [PokeAPI](https://pokeapi.co).

**Live: https://pokedex-ox-alpha-max.pages.dev**

## Features

### Pokedex
- All **1,025 species + 326 alternate forms** with official artwork
- Instant client-side search (name or number), multi-type filters, generation filter, stat sorting
- Shiny mode, favorites, legendary/mythical toggles, forms toggle
- Fast infinite grid — no waiting on network to browse

### Pokemon pages
- Flavor text carousel across game versions
- Cry playback
- Breeding & training data: egg groups, hatch cycles, gender ratio, EV yield, capture rate, growth rate, habitat, base happiness
- Abilities with full effect descriptions and hidden-ability flags
- Animated base stats with total
- 18-type defensive matchup grid
- Evolution chains with exact conditions (levels, items, friendship, locations, time of day…)
- Complete move lists grouped by learn method (level-up / TM / egg / tutor) with per-move detail modals
- Sprite gallery: default, shiny, back, Home, Dream World, animated Showdown sprites
- Held items and form variants

### Databases
- **Moves** — all ~950 moves, searchable/filterable by type & damage class
- **Abilities** — all abilities with effects and holders
- **Types** — the full 18×18 effectiveness matrix plus per-type breakdowns
- **Items** — every item (~2,200) with categories and sprites
- **Berries** — flavors, firmness, growth data, Natural Gift stats

### Tools
- **Team Builder** — assemble six Pokemon and see collective weaknesses, immunities and shared vulnerabilities
- **Compare** — side-by-side stats, types and defenses for any two Pokemon
- Dark/light theme, fully responsive, keyboard-friendly

## Architecture

- **React 18 + TypeScript + Vite** with route-level code splitting
- **Tailwind CSS v4** design system with type-colored theming
- **TanStack Query** for cached runtime PokeAPI fetching (species, evolution, moves, abilities)
- **Framer Motion** animations
- Build-time pipeline (`scripts/`) compacts PokeAPI into static JSON indexes so browsing requires zero API calls; detail data is fetched lazily and cached forever

## Develop

```bash
npm install
npm run generate:data   # rebuild static indexes from PokeAPI (one-time, ~5 min)
npm run dev             # local dev server
npm run build           # typecheck + production build
npm run deploy          # build + deploy to Cloudflare Pages
```

## Data attribution

Data and sprites © Nintendo / Game Freak / Creatures Inc., served via [PokeAPI](https://pokeapi.co) and its sprite CDN. This project is a fan work and is not affiliated with or endorsed by Nintendo.
