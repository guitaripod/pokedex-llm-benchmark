# Pokédex

The greatest Pokédex ever built — a fast, beautiful, production-grade web app covering all **1025 Pokémon** across 9 generations, powered by [PokéAPI](https://pokeapi.co) and deployed on **Cloudflare Workers**.

🔗 **Live:** https://pokedex-opus-4-8-low.guitaripod.workers.dev

## Features

- **National Pokédex** — every Pokémon with official artwork, instant client-side search (name/number), multi-type & generation filters, and sorting by any base stat, height or weight. Infinite scroll over the full dex.
- **Rich detail pages** — official artwork with shiny toggle, playable cries, base stats with bars **and** a radar chart, EV yield, abilities with full effect text, computed type-defense matchups, evolution chains (with conditions & branches), learnable moves by method/game, held items, breeding data (gender ratio, egg groups, hatch cycles), training data, forms/varieties, and every Pokédex flavor-text entry.
- **Type chart** — full 18×18 interactive effectiveness matrix, plus per-type pages listing offensive/defensive relations and every Pokémon of that type.
- **Abilities, Moves & Items browsers** — searchable lists with detailed pages (effects, stats, and the Pokémon involved).
- **Compare tool** — stack up to 4 Pokémon side-by-side across every stat.
- Dark/light mode, type-themed gradients, responsive design, smooth animations.

## Architecture

- **Frontend:** React + TypeScript + Vite + Tailwind CSS, React Router SPA.
- **Data:** A pre-generated index of all 1025 Pokémon (`scripts/build-index.mjs`) enables instant search/filter/sort without hitting the network. Detailed data is fetched on demand.
- **Backend:** A Cloudflare Worker serves the static assets and proxies PokéAPI through `/api/v2/*` with edge caching (Cache API + `s-maxage`), an allow-list of resources, and CORS — keeping the app fast and resilient.

## Development

```bash
npm install
node scripts/build-index.mjs   # regenerate the Pokémon index (optional; committed)
npm run dev                    # local dev server
npm run build                  # typecheck + production build
npx wrangler deploy            # deploy to Cloudflare
```

Data from PokéAPI. Pokémon © Nintendo / Game Freak / The Pokémon Company.
