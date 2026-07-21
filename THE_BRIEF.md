# The Brief

Every submission is a **single, fully-autonomous one-shot run** against the exact same prompt. The prompt is held word-for-word constant across models — the only substitution is the trailing name token, which encodes the model and effort.

## The prompt (verbatim)

> Build a pokedex. Use all the data available on pokeapi to build out the UI. Make a web app. Host it on cloudflare. You have gh and wrangler available. Make it fleshed out and beautiful and production tier. Work autonomously until complete. Build as much functionality as you can with the data and then some. Make the greatest pokedex ever built. call it **pokedex-<model>-<effort>**. Work fully autonomously.

The literal name given — e.g. `call it pokedex-fable-5-low` — is the sole per-run difference. Everything else is identical.

## What this means

- **One shot.** A single autonomous run. No iteration, no follow-up prompts, no human course-correction. What the model ships is what gets scored.
- **Real tools.** The model has `gh` and `wrangler` and is expected to actually create the repo and deploy to Cloudflare itself — provisioning and deployment are part of the task, not done for it.
- **Open-ended by design.** No feature list is dictated. "Use all the data available on pokeapi" and "build as much functionality as you can... and then some" make *deciding what a great Pokédex contains* part of the test.

## Fixed constraints (all from the prompt)

- **Data source:** [PokéAPI](https://pokeapi.co) — "use all the data available."
- **Shape:** a web app.
- **Hosting:** Cloudflare, deployed by the model via `wrangler` (Pages or Workers static assets).
- **Bar:** "fleshed out and beautiful and production tier" — "the greatest pokedex ever built."
- **Autonomy:** "work fully autonomously until complete."

## Free variables (the model decides)

Framework or none (React, Vue, Svelte, vanilla) · language and build tooling · styling · which features to build and how deep · data architecture (prebuilt static / edge-proxy / live) · visual and interaction design.

## Definition of done

The model decides it is done and has deployed a working, publicly reachable URL. Beyond the baseline (browse the full dex, search, drill into a species), breadth and depth across the [feature checklist](docs/feature-checklist.json) are where models separate.

## What varies between runs

The **model** and its **reasoning effort** (`low`, `max`, `ultracode`, or a default). Two Fable 5 submissions at different efforts isolate how much effort alone changes a one-shot output. See [RUBRIC.md](RUBRIC.md) for scoring and [docs/methodology.md](docs/methodology.md) for caveats.
