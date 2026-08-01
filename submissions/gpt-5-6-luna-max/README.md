# LunaDex

LunaDex is a living Pokédex built with React, Vite, and PokéAPI, deployed as a Cloudflare Worker with Static Assets.

## Included

- Live index of Pokémon and alternate forms from PokéAPI
- Search, generation filters, type filters, sorting, and progressive loading
- Detail dossiers with species notes, stats, abilities, moves, cries, evolution chains, and forms
- Type atlas with matchup relationships, move pools, and population samples
- Local favorites archive and six-slot squad builder with type footprint analytics
- Responsive dark/light interface with keyboard search shortcut and deep-linked dossiers
- Edge-cached same-origin PokéAPI proxy with Workers observability enabled

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run deploy
```

PokéAPI data is provided under its terms at [pokeapi.co](https://pokeapi.co/). Pokémon artwork and sprites are provided by the [Pokémon API sprite repository](https://github.com/PokeAPI/sprites).
