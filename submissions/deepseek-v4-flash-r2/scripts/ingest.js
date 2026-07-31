import { mkdirSync, writeFileSync, existsSync, readFileSync, appendFileSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const POKEMON_DIR = join(DATA_DIR, "pokemon");
const MOVES_DIR = join(DATA_DIR, "moves");
const ABILITIES_DIR = join(DATA_DIR, "abilities");
const ITEMS_DIR = join(DATA_DIR, "items");
const TYPES_DIR = join(DATA_DIR, "types");

const API = "https://pokeapi.co/api/v2";
const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const LANG_SUBSET = new Set(["en", "ja", "fr", "de", "es", "it", "zh-Hans", "ko"]);

mkdirSync(POKEMON_DIR, { recursive: true });
mkdirSync(MOVES_DIR, { recursive: true });
mkdirSync(ABILITIES_DIR, { recursive: true });
mkdirSync(ITEMS_DIR, { recursive: true });
mkdirSync(TYPES_DIR, { recursive: true });
mkdirSync(join(DATA_DIR, "bulk"), { recursive: true });

const log = (...a) => console.log(...a);
const LOG_FILE = join(DATA_DIR, "ingest.log");
const line = (s) => `[${new Date().toISOString()}] ${s}\n`;
const append = (s) => appendFileSync(LOG_FILE, line(s));
if (!existsSync(LOG_FILE)) writeFileSync(LOG_FILE, line("ingest start"));

async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "pokedex-ingest/1.0" } });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
}

function idFromUrl(url) {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

function pokeIdFromUrl(url) {
  const m = url.match(/\/pokemon\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

async function pool(items, limit, worker) {
  let i = 0;
  let failures = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        await worker(items[idx], idx);
      } catch (err) {
        failures++;
        append(`worker error item ${idx}: ${err.message}`);
        console.error(`  ✗ item ${idx}: ${err.message}`);
      }
    }
  });
  await Promise.all(runners);
  return failures;
}


const phaseState = {
  list: null,
  usedMoves: new Set(),
  usedAbilities: new Set(),
  usedItems: new Set(),
  usedTypes: new Set(),
};

async function phasePokemon() {
  const list = await fetchJson(`${API}/pokemon?limit=2000&offset=0`);
  const entries = list.results
    .map((r) => ({ id: pokeIdFromUrl(r.url), name: r.name, url: r.url }))
    .filter((e) => e.id !== null && e.id >= 1 && e.id <= 1025)
    .sort((a, b) => a.id - b.id);

  log(`▸ ${entries.length} pokemon to ingest`);
  append(`phase pokemon: ${entries.length} targets`);

  const toProcess = entries.filter((e) => !existsSync(join(POKEMON_DIR, `${e.id}.json`)));
  log(`▸ skipping ${entries.length - toProcess.length} already done`);

  const failures = await pool(toProcess, 32, async (entry) => {
    const [pokemon, species] = await Promise.all([
      fetchJson(`${API}/pokemon/${entry.id}`),
      fetchJson(`${API}/pokemon-species/${entry.id}`),
    ]);
    if (!pokemon || !species) {
      throw new Error(`missing data for ${entry.id} ${entry.name}`);
    }

    const types = pokemon.types.map((t) => t.type.name);
    types.forEach((t) => phaseState.usedTypes.add(t));

    for (const m of pokemon.moves) phaseState.usedMoves.add(m.move.name);
    for (const a of pokemon.abilities) phaseState.usedAbilities.add(a.ability.name);

    const stats = pokemon.stats
      .filter((s) => s.stat.name !== "special-defense" || true)
      .map((s) => ({ name: s.stat.name, base: s.base_stat }));

    const moveMap = new Map();
    for (const m of pokemon.moves) {
      const name = m.move.name;
      let entry = moveMap.get(name);
      if (!entry) {
        entry = { name, minLevel: null, methods: new Set() };
        moveMap.set(name, entry);
      }
      for (const vgd of m.version_group_details) {
        entry.methods.add(vgd.move_learn_method.name);
        const lvl = vgd.level_learned_at ?? 0;
        if (vgd.move_learn_method.name === "level-up" && (entry.minLevel === null || lvl < entry.minLevel)) {
          entry.minLevel = lvl;
        }
      }
    }
    const moves = [...moveMap.values()].map((e) => ({
      name: e.name,
      minLevel: e.minLevel,
      methods: [...e.methods],
    }));
    const names = {};
    for (const n of species.names) if (LANG_SUBSET.has(n.language.name)) names[n.language.name] = n.name;

    const genera = {};
    let genus = null;
    for (const g of species.genera) {
      if (LANG_SUBSET.has(g.language.name)) genera[g.language.name] = g.genus;
      if (g.language.name === "en") genus = g.genus;
    }

    const flavorText = {};
    for (const f of species.flavor_text_entries) {
      const lang = f.language.name;
      if (LANG_SUBSET.has(lang) && !flavorText[lang]) flavorText[lang] = f.flavor_text.replace(/[\n\f\r]/g, " ");
    }

    const generation = idFromUrl(species.generation.url);

    const evoChainId = idFromUrl(species.evolution_chain?.url);

    const detail = {
      id: pokemon.id,
      name: pokemon.name,
      names,
      genus,
      genera,
      flavorText,
      types,
      height: pokemon.height,
      weight: pokemon.weight,
      baseExperience: pokemon.base_experience ?? 0,
      stats,
      moves,
      abilities: pokemon.abilities
        .map((a) => ({ name: a.ability.name, isHidden: a.is_hidden, slot: a.slot }))
        .sort((a, b) => a.slot - b.slot),
      sprites: {
        artwork: `${SPRITES}/other/official-artwork/${pokemon.id}.png`,
        artworkShiny: `${SPRITES}/other/official-artwork/shiny/${pokemon.id}.png`,
        home: `${SPRITES}/other/home/${pokemon.id}.png`,
        homeShiny: `${SPRITES}/other/home/shiny/${pokemon.id}.png`,
        dream: `${SPRITES}/other/dream-world/${pokemon.id}.svg`,
        default: `${SPRITES}/${pokemon.id}.png`,
        shiny: `${SPRITES}/shiny/${pokemon.id}.png`,
      },
      cry: pokemon.cries?.latest ?? `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`,
      species: {
        captureRate: species.capture_rate,
        baseHappiness: species.base_happiness,
        genderRate: species.gender_rate,
        hatchCounter: species.hatch_counter,
        growthRate: species.growth_rate?.name ?? null,
        habitat: species.habitat?.name ?? null,
        eggGroups: species.egg_groups.map((g) => g.name),
        isLegendary: species.is_legendary,
        isMythical: species.is_mythical,
        isBaby: species.is_baby,
        generation,
        color: species.color?.name ?? null,
        shape: species.shape?.name ?? null,
      },
      evolution: null,
      typeInfo: {},
      _evoChainId: evoChainId,
    };

    writeFileSync(join(POKEMON_DIR, `${entry.id}.json`), JSON.stringify(detail));
  });

  append(`phase pokemon failures: ${failures}`);
  log(`✓ pokemon phase complete, failures: ${failures}`);
}

async function phaseEvolutions() {
  const files = readdirSync(POKEMON_DIR).filter((f) => f.endsWith(".json"));
  const chainIds = new Set();
  const chainToPokemon = new Map();

  for (const f of files) {
    const detail = JSON.parse(readFileSync(join(POKEMON_DIR, f), "utf8"));
    if (detail._evoChainId) {
      chainIds.add(detail._evoChainId);
      if (!chainToPokemon.has(detail._evoChainId)) chainToPokemon.set(detail._evoChainId, detail.id);
    }
  }
  log(`▸ ${chainIds.size} unique evolution chains`);

  const chains = new Map();
  const failures = await pool([...chainIds], 16, async (chainId) => {
    const chain = await fetchJson(`${API}/evolution-chain/${chainId}`);
    if (!chain) throw new Error(`no chain ${chainId}`);
    chains.set(chainId, chain.chain);
  });
  log(`✓ evolution chains fetched, failures: ${failures}`);

  function parseTrigger(ev) {
    const t = ev.trigger?.name ?? "unknown";
    const item = ev.item?.name ?? null;
    const heldItem = ev.held_item?.name ?? null;
    const minLevel = ev.min_level ?? null;
    const location = ev.location?.name ?? null;
    const minHappiness = ev.min_happiness ?? null;
    const minAffection = ev.min_affection ?? null;
    const timeOfDay = ev.time_of_day || null;
    const gender = ev.gender ? (ev.gender === 1 ? "female" : "male") : null;
    const knownMove = ev.known_move?.name ?? null;
    const knownMoveType = ev.known_move_type?.name ?? null;
    const tradeSpecies = ev.trade_species?.name ?? null;
    const randomLevel = ev.random_level ?? false;
    const needsOverworldRain = ev.needs_overworld_rain ?? false;
    const turnUpsideDown = ev.turn_upside_down ?? false;

    let label = "";
    switch (t) {
      case "level-up":
        if (minLevel) label = `Level ${minLevel}`;
        else if (minHappiness != null) label = "Level up with high friendship";
        else if (minAffection != null) label = "Level up with high affection";
        else if (knownMove) label = `Level up knowing ${knownMove.replace(/-/g, " ")}`;
        else if (knownMoveType) label = `Level up with a ${knownMoveType.replace(/-/g, " ")} move`;
        else label = "Level up";
        if (timeOfDay) label += ` (${timeOfDay})`;
        if (needsOverworldRain) label += " in rain";
        if (turnUpsideDown) label += " while holding the game upside down";
        break;
      case "use-item":
        label = item ? `Use ${item.replace(/-/g, " ")}` : "Use item";
        break;
      case "trade":
        if (heldItem) label = `Trade holding ${heldItem.replace(/-/g, " ")}`;
        else if (tradeSpecies) label = `Trade for ${tradeSpecies.replace(/-/g, " ")}`;
        else label = "Trade";
        break;
      case "shed":
        label = "Shed (party space + Poké Ball)";
        break;
      case "spin":
        label = "Spin 360° while holding item";
        break;
      case "three-critical-hits":
        label = "Land 3 critical hits in one battle";
        break;
      case "tower-of-darkness":
        label = "Train at the Tower of Darkness";
        break;
      case "tower-of-water":
        label = "Train at the Tower of Water";
        break;
      case "agile-style":
        label = "Use a specific Agile Style move 20 times";
        break;
      case "strong-style":
        label = "Use a specific Strong Style move 20 times";
        break;
      case "recoil-damage":
        label = "Take a specific amount of recoil damage";
        break;
      default:
        label = `Trigger: ${t.replace(/-/g, " ")}`;
    }

    if (item && heldItem) label = `Use ${item.replace(/-/g, " ")} (holding ${heldItem.replace(/-/g, " ")})`;
    if (location) label += ` at ${location.replace(/-/g, " ")}`;
    if (item) phaseState.usedItems.add(item);
    if (heldItem) phaseState.usedItems.add(heldItem);

    return {
      kind: t,
      label,
      minLevel,
      item,
      heldItem,
      location,
      minHappiness,
      minAffection,
      timeOfDay,
      gender,
      knownMove,
      knownMoveType,
      tradeSpecies,
      randomLevel,
    };
  }

  function parseNode(node) {
    const id = idFromUrl(node.species.url);
    const name = node.species.name;
    return {
      id,
      name,
      sprite: id ? `${SPRITES}/other/official-artwork/${id}.png` : null,
      triggers: (node.evolution_details ?? []).map(parseTrigger),
      evolvesTo: (node.evolves_to ?? []).map(parseNode),
    };
  }

  const chainResults = new Map();
  for (const [chainId, root] of chains) {
    chainResults.set(chainId, parseNode(root));
  }

  let updated = 0;
  for (const f of files) {
    const detail = JSON.parse(readFileSync(join(POKEMON_DIR, f), "utf8"));
    if (detail._evoChainId && chainResults.has(detail._evoChainId)) {
      detail.evolution = chainResults.get(detail._evoChainId);
      delete detail._evoChainId;
      writeFileSync(join(POKEMON_DIR, f), JSON.stringify(detail));
      updated++;
    }
  }
  log(`✓ evolution data attached to ${updated} pokemon`);
}

async function phaseSecondary() {
  log(`▸ ${phaseState.usedTypes.size} types, ${phaseState.usedMoves.size} moves, ${phaseState.usedAbilities.size} abilities, ${phaseState.usedItems.size} items to fetch`);

  const moveList = await fetchJson(`${API}/move?limit=2000&offset=0`);
  const allMoveNames = new Set(moveList.results.map((r) => r.name));
  const wantedMoves = [...phaseState.usedMoves].filter((n) => allMoveNames.has(n));
  log(`▸ ${wantedMoves.length} canonical moves`);

  const [typeFails, moveFails, abilityFails, itemFails] = await Promise.all([
    pool([...phaseState.usedTypes], 8, async (t) => {
      const raw = await fetchJson(`${API}/type/${t}`);
      if (!raw) throw new Error(`no type ${t}`);
      const rel = (k) => raw.damage_relations[k].map((x) => x.name);
      writeFileSync(join(TYPES_DIR, `${t}.json`), JSON.stringify({
        name: t,
        noDamageTo: rel("no_damage_to"),
        halfDamageTo: rel("half_damage_to"),
        doubleDamageTo: rel("double_damage_to"),
        noDamageFrom: rel("no_damage_from"),
        halfDamageFrom: rel("half_damage_from"),
        doubleDamageFrom: rel("double_damage_from"),
      }));
    }),
    pool(wantedMoves, 24, async (name) => {
      const raw = await fetchJson(`${API}/move/${name}`);
      if (!raw) throw new Error(`no move ${name}`);
      let shortEffect = null;
      let effect = null;
      const eff = raw.effect_entries.find((e) => e.language.name === "en");
      if (eff) { effect = eff.effect; shortEffect = eff.short_effect; }
      writeFileSync(join(MOVES_DIR, `${name}.json`), JSON.stringify({
        name: raw.name,
        type: raw.type?.name ?? null,
        power: raw.power,
        accuracy: raw.accuracy,
        pp: raw.pp,
        damageClass: raw.damage_class?.name ?? "status",
        priority: raw.priority ?? 0,
        effect,
        shortEffect,
      }));
    }),
    pool([...phaseState.usedAbilities], 20, async (name) => {
      const raw = await fetchJson(`${API}/ability/${name}`);
      if (!raw) throw new Error(`no ability ${name}`);
      const eff = raw.effect_entries.find((e) => e.language.name === "en");
      const flavor = raw.flavor_text_entries.find((e) => e.language.name === "en");
      writeFileSync(join(ABILITIES_DIR, `${name}.json`), JSON.stringify({
        name: raw.name,
        effect: eff?.effect ?? null,
        shortEffect: eff?.short_effect ?? null,
        flavorText: flavor?.flavor_text?.replace(/[\n\f\r]/g, " ") ?? null,
      }));
    }),
    pool([...phaseState.usedItems], 12, async (name) => {
      const raw = await fetchJson(`${API}/item/${name}`);
      if (!raw) throw new Error(`no item ${name}`);
      writeFileSync(join(ITEMS_DIR, `${name}.json`), JSON.stringify({
        name: raw.name,
        sprite: raw.sprites?.default ?? null,
        category: raw.category?.name ?? null,
      }));
    }),
  ]);

  append(`secondary failures — types:${typeFails} moves:${moveFails} abilities:${abilityFails} items:${itemFails}`);
  log(`✓ secondary data fetched (types:${typeFails} moves:${moveFails} abilities:${abilityFails} items:${itemFails} failures)`);
}

function buildIndex() {
  log("▸ building cards index + typeInfo merge");
  const files = readdirSync(POKEMON_DIR).filter((f) => f.endsWith(".json"));
  const cards = [];
  let generatedAt = null;

  for (const f of files) {
    const detail = JSON.parse(readFileSync(join(POKEMON_DIR, f), "utf8"));
    const statTotal = detail.stats.reduce((s, x) => s + x.base, 0);
    cards.push({
      id: detail.id,
      name: detail.name,
      types: detail.types,
      sprite: detail.sprites.default,
      artwork: detail.sprites.artwork,
      baseStatTotal: statTotal,
      height: detail.height,
      weight: detail.weight,
      generation: detail.species.generation,
      legendary: detail.species.isLegendary,
      mythical: detail.species.isMythical,
    });

    const typeInfo = {};
    for (const t of detail.types) {
      const tf = join(TYPES_DIR, `${t}.json`);
      if (existsSync(tf)) typeInfo[t] = JSON.parse(readFileSync(tf, "utf8"));
    }
    detail.typeInfo = typeInfo;
    writeFileSync(join(POKEMON_DIR, f), JSON.stringify(detail));

    if (!generatedAt) generatedAt = new Date().toISOString();
  }

  cards.sort((a, b) => a.id - b.id);
  const types = [...new Set(cards.flatMap((c) => c.types))].sort();
  const generations = [...new Set(cards.map((c) => c.generation))].sort((a, b) => a - b);
  const meta = {
    total: cards.length,
    generations,
    types,
    generatedAt,
    source: "PokeAPI",
  };

  writeFileSync(join(DATA_DIR, "cards.json"), JSON.stringify(cards));
  writeFileSync(join(DATA_DIR, "meta.json"), JSON.stringify(meta));
  log(`✓ index built: ${cards.length} cards, ${types.length} types, ${generations.length} generations`);
}

function writeBulk() {
  log("▸ writing bulk NDJSON for KV upload");
  const files = readdirSync(POKEMON_DIR).filter((f) => f.endsWith(".json"));
  const entries = [];

  for (const f of files) {
    const d = JSON.parse(readFileSync(join(POKEMON_DIR, f), "utf8"));
    entries.push([`p:${d.id}`, JSON.stringify(d)]);
  }
  for (const f of readdirSync(MOVES_DIR).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(MOVES_DIR, f), "utf8"));
    entries.push([`m:${d.name}`, JSON.stringify(d)]);
  }
  for (const f of readdirSync(ABILITIES_DIR).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(ABILITIES_DIR, f), "utf8"));
    entries.push([`a:${d.name}`, JSON.stringify(d)]);
  }
  for (const f of readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(ITEMS_DIR, f), "utf8"));
    entries.push([`i:${d.name}`, JSON.stringify(d)]);
  }
  for (const f of readdirSync(TYPES_DIR).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(TYPES_DIR, f), "utf8"));
    entries.push([`t:${d.name}`, JSON.stringify(d)]);
  }
  entries.push(["cards", JSON.stringify(JSON.parse(readFileSync(join(DATA_DIR, "cards.json"), "utf8")))]);
  entries.push(["meta", JSON.stringify(JSON.parse(readFileSync(join(DATA_DIR, "meta.json"), "utf8")))]);

  const BULK_DIR = join(DATA_DIR, "bulk");
  for (const f of readdirSync(BULK_DIR)) rmSync(join(BULK_DIR, f), { force: true });

  const CHUNK = 9000;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const payload = chunk.map(([k, v]) => ({ key: k, value: v }));
    writeFileSync(join(BULK_DIR, `${String(i / CHUNK).padStart(2, "0")}.json`), JSON.stringify(payload));
  }
  log(`✓ bulk written: ${entries.length} keys in ${Math.ceil(entries.length / CHUNK)} files (~${(entries.reduce((s, [, v]) => s + v.length, 0) / 1024 / 1024).toFixed(1)} MB)`);
}

async function main() {
  const start = Date.now();
  log("════════ POKEAPI INGEST ════════");
  try {
    await phasePokemon();
    await phaseEvolutions();
    await phaseSecondary();
    buildIndex();
    writeBulk();
  } catch (err) {
    console.error("FATAL:", err);
    process.exit(1);
  }
  append(`ingest complete in ${((Date.now() - start) / 1000 / 60).toFixed(1)}m`);
  log(`✓ done in ${((Date.now() - start) / 1000 / 60).toFixed(1)}m`);
}

main();
