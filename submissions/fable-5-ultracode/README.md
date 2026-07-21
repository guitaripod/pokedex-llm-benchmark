# Pokédex — Fable-5 Ultracode

A complete Pokédex built as a field instrument: every Pokémon, form, move, ability and item from [PokéAPI](https://pokeapi.co), precompiled into static JSON and served as a single-page app on Cloudflare Workers. No runtime API calls, no backend — the whole dataset ships with the site.

## Features

- **National Dex** — all 1025 species with instant search, type/generation/flag filters, sorting by any stat, shareable filter URLs
- **Detail pages** — type-derived color atmosphere, all forms (Mega, Gigantamax, regional), dex entries across every version, base stats, type defenses, evolution trees with conditions, full learnsets per version group, breeding data, encounter locations, cries, and a Game-Boy-LCD sprite gallery spanning nine generations
- **Team builder** — six slots with a full defensive matrix, STAB coverage analysis, gap suggestions, shareable team links
- **Compare** — up to six Pokémon side by side with best-stat highlighting
- **Type chart** — interactive 18×18 matrix plus a dual-type defense calculator
- **Moves / Abilities / Items dexes** — searchable, filterable, fully cross-linked
- **Who's that Pokémon?** — silhouette quiz with streaks, generations filter, and cries
- **Command palette** — `/` or `Ctrl-K` jumps to any Pokémon, move, ability or page
- Favorites, dark/light themes, keyboard navigation, responsive down to phones

## Stack

- React 19 + TypeScript (strict) + Vite
- Hand-rolled design system (no CSS framework): Bricolage Grotesque, Figtree, IBM Plex Mono
- Data pipeline: `scripts/build-data.mjs` pulls ~7,700 PokéAPI resources (disk-cached) and compiles ~17 MB of static JSON into `public/data/`
- Hosting: Cloudflare Workers static assets (`wrangler.jsonc`, SPA fallback)

## Develop

```sh
npm install
npm run data      # rebuild public/data from PokéAPI (cached in .cache/)
npm run dev
```

## Deploy

```sh
npm run deploy    # tsc + vite build + wrangler deploy
```

## Credits

Data and sprites from [PokéAPI](https://pokeapi.co). Pokémon and character names are trademarks of Nintendo, Creatures Inc. and Game Freak; this is a fan-made reference, not affiliated with or endorsed by them.
