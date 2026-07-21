# Pokédex — Fable Terminal

A complete, production-grade Pokédex web app. Every Pokémon, every form, every stat — built on [PokéAPI](https://pokeapi.co) data, served as a static SPA on Cloudflare Workers.

**Live:** https://pokedex-fable-5-low.guitaripod.workers.dev

## Features

- All 1025 species + 326 alternate forms (megas, regionals, gmax, etc.)
- Full-text/number search, type filters (multi-select AND), generation, rarity, and 9 sort modes with infinite-scroll grid
- Detail pages: official artwork, animated sprite, shiny toggle, cry playback, base stats, EV yield, abilities with effects, defensive type matchups, breeding data, gender ratio, evolution chains with conditions, forms, and the full move pool (level-up / TM / egg / tutor) with power/accuracy/effects
- Type matrix: full 18×18 effectiveness chart plus per-type combat profiles
- Head-to-head stat comparison
- Favorites saved to localStorage
- Keyboard nav: `/` search, `R` random, `←`/`→` browse

## Architecture

Data is prebuilt from PokéAPI into static JSON (`scripts/build-data.mjs`, `scripts/build-moves.mjs`) so the app boots from a single origin with zero API dependency; only per-Pokémon learnsets are fetched live. Vanilla JS, no framework, no build step.

```
node scripts/build-data.mjs && node scripts/build-moves.mjs
wrangler dev
wrangler deploy
```

### The full session

<img width="1918" height="2160" alt="fable5loweffortpokedexsessionfull" src="https://github.com/user-attachments/assets/82a1a696-54a2-43e7-994c-6a0d92b24648" />
