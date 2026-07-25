# pokedex-opus-5-ultracode

A complete, production-grade Pokédex web app built on the full PokéAPI dataset and deployed to
Cloudflare Workers.

Every Pokémon, form, move, ability, item, berry, machine, location, encounter, evolution condition
and type interaction across all nine generations — plus a team builder, damage calculator, catch
calculator, type-coverage analyser, comparison radar and a guessing game.

## Architecture

The dataset is **entirely static and read-only**, so there is no database in the request path.

```
data-src/csv/            180 PokéAPI CSV tables (the upstream source of truth)
        │
        │  npm run data   —  scripts/build-data.ts
        ▼
public/data/             6,031 pre-computed JSON files (~41 MB)
        │                  ├── meta.json               reference tables + type chart
        │                  ├── pokemon-index.json      every Pokémon, all filterable fields
        │                  ├── pokemon/{id}.json       full detail incl. learnset + encounters
        │                  ├── moves|items|abilities|locations/{id}.json
        │                  ├── pokedex/{id}.json       regional dex listings
        │                  └── search-index.json       command-palette corpus
        ▼
Cloudflare Workers Static Assets  +  worker/index.ts
```

`worker/index.ts` adds what static hosting alone cannot:

- **`/img/*`** — edge-cached proxy for the PokéAPI sprite repository (immutable, one-year TTL)
- **`/cry/*`** — the same for Pokémon cry audio
- **`/api/*`** — a public read-only JSON API over the same data, with CORS
- **per-record link previews** — `HTMLRewriter` injects real Open Graph titles, descriptions and
  artwork into the SPA shell for `/pokemon/*`, `/moves/*`, `/items/*`, `/abilities/*`, `/locations/*`

Because every response is either a static asset or a cached subrequest, the app has no cold-start
database cost, no query limits, and works offline after first visit via a runtime-caching service
worker.

### Why static instead of D1

The dataset never changes between deploys, and the heaviest queries (a 638k-row learnset table, a
117k-row encounter table) are all resolvable at build time. Pre-computing them turns every page view
into a cache hit rather than a SQL round trip, and keeps the whole app inside the free tier.

## Data pipeline

`scripts/build-data.ts` runs eight builders in dependency order and finishes in about two seconds:

| Builder | Output |
| --- | --- |
| `meta` | type chart (present + historical), generations, versions, regions, pokédexes, stats, natures, growth-rate exp curves, egg groups, berries, machines, characteristics, all reference tables |
| `abilities` | index + detail with full effect text, changelog and every holder |
| `moves` | index + detail with meta stats, stat changes, machines, contest data, changelog, learned-by |
| `items` | index + detail with effects, held-by, evolution roles, berry data |
| `locations` | index + detail with per-area encounters merged by version and method |
| `pokedexes` | regional dex listings with local entry numbers |
| `pokemon` | index + detail with stats, past stats/types/abilities, learnsets, encounters, forms, varieties, flavour text and the embedded evolution chain |
| `search` | unified command-palette corpus |

Large collections are encoded as positional tuples rather than keyed objects — a learnset averages
~470 rows per Pokémon, so field names would otherwise dominate the payload. The tuple layouts are
documented in [`src/types/data.ts`](src/types/data.ts), which is the single authoritative wire
contract shared by the builders and the app.

Evolution conditions are resolved into prose at build time: the 31 columns of `pokemon_evolution`
become strings like *"Use Thunder Stone in Alola"* or *"Level up knowing Ancient Power during the
night"*.

## Development

```bash
npm install
npm run data       # regenerate public/data from data-src/csv
npm run dev        # vite dev server
npm run typecheck
npm run build      # typecheck + vite build
npm run preview    # wrangler dev against the built output
npm run deploy     # wrangler deploy
```

## Public API

```
GET /api                      service description
GET /api/meta                 all reference tables
GET /api/pokemon?q=&limit=    index, searchable and paged
GET /api/pokemon/pikachu      full detail (id or name)
GET /api/moves/thunderbolt
GET /api/items/master-ball
GET /api/abilities/static
GET /api/locations/viridian-forest
GET /api/search?q=pika
```

## Credits and licence

Data comes from the [PokéAPI](https://pokeapi.co) dataset, which in turn derives from
[veekun/pokedex](https://github.com/veekun/pokedex). Sprites and cries are served from the
[PokeAPI/sprites](https://github.com/PokeAPI/sprites) and [PokeAPI/cries](https://github.com/PokeAPI/cries)
repositories.

Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc. and GAME FREAK Inc.
This project is an unofficial fan reference and is not affiliated with them.

Licensed under the [GNU General Public License v3.0](LICENSE).
