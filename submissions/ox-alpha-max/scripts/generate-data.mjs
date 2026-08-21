#!/usr/bin/env node
/**
 * generate-data.mjs — one-time build script.
 * Downloads core data from PokeAPI and writes compact static JSON indexes
 * into src/data/ so the app can filter/search instantly without network calls.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://pokeapi.co/api/v2";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
const CONCURRENCY = 24;
const RETRIES = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await sleep(400 * 2 ** attempt);
    }
  }
  throw lastErr;
}

async function pool(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, run));
  return results;
}

const genNum = (name) => {
  const m = /generation-(\w+)/.exec(name || "");
  if (!m) return 0;
  const map = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };
  return map[m[1]] ?? 0;
};

const shortEffect = (entry, chance) => {
  if (!entry) return "";
  let txt =
    entry.short_effect ||
    entry.effect ||
    entry.flavor_text ||
    "";
  if (chance != null) txt = txt.replaceAll("$effect_chance", String(chance));
  return txt.replace(/\s+/g, " ").trim();
};

function pickEnglish(entries, key = "flavor_text") {
  if (!entries?.length) return "";
  const en = entries.filter((e) => e.language.name === "en");
  const best = en[en.length - 1] || entries[0];
  return (best[key] || "").replace(/[\n\f\r]/g, " ").replace(/\s+/g, " ").trim();
}

console.log("→ Fetching pokemon list (all forms)…");
const allPokemonList = (await fetchJson(`${API}/pokemon?limit=20000`)).results;
const baseList = allPokemonList.filter((p) => {
  const id = Number(p.url.split("/").filter(Boolean).pop());
  return id <= 1025;
});
const formList = allPokemonList.filter((p) => !baseList.includes(p));
console.log(`   ${baseList.length} species + ${formList.length} alternate forms`);

console.log("→ Fetching pokemon details…");
let done = 0;
const pokemonDetails = await pool(allPokemonList, (p) =>
  fetchJson(p.url).then((d) => {
    process.stdout.write(`\r   pokemon ${Math.min(++done, allPokemonList.length)}/${allPokemonList.length}`);
    return d;
  })
);

console.log("\n→ Fetching species details…");
const speciesList = (await fetchJson(`${API}/pokemon-species?limit=11000`)).results;
let sdone = 0;
const speciesDetails = await pool(speciesList, (s) =>
  fetchJson(s.url).then((d) => {
    process.stdout.write(`\r   species ${++sdone}/${speciesList.length}`);
    return d;
  })
);

console.log("\n→ Building dex.json…");
const speciesById = new Map();
for (const sp of speciesDetails) {
  if (sp) speciesById.set(sp.id, sp);
}
const statOrder = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

const dexEntry = (pk) => {
  const id = pk.id;
  const stats = [0, 0, 0, 0, 0, 0];
  for (const st of pk.stats) {
    const idx = statOrder.indexOf(st.stat.name);
    if (idx >= 0) stats[idx] = st.base_stat;
  }
  const sp = id <= 1025 ? speciesById.get(id) : null;
  return {
    i: id,
    n: pk.name,
    t: pk.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    s: stats,
    g: sp ? genNum(sp.generation?.name) : Math.min(9, Math.max(1, Math.ceil((id - 10000) / 100))),
    l: !!sp?.is_legendary,
    m: !!sp?.is_mythical,
    h: pk.height,
    w: pk.weight,
    f: id > 1025,
  };
};
const dex = pokemonDetails.filter(Boolean).map(dexEntry).sort((a, b) => a.i - b.i);
await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "dex.json"), JSON.stringify({ v: 1, list: dex }));

console.log("→ Fetching moves…");
const moveList = (await fetchJson(`${API}/move?limit=1000`)).results;
let mdone = 0;
const moves = (
  await pool(moveList, (m) =>
    fetchJson(m.url).then((d) => {
      process.stdout.write(`\r   moves ${++mdone}/${moveList.length}`);
      return d;
    })
  )
)
  .filter(Boolean)
  .map((mv) => ({
    n: mv.name,
    t: mv.type.name,
    c: mv.damage_class.name,
    p: mv.power,
    a: mv.accuracy,
    pp: mv.pp,
    pri: mv.priority,
    g: genNum(mv.generation?.name),
    e: shortEffect(mv.effect_entries[0], mv.effect_chance) || pickEnglish(mv.flavor_text_entries),
  }))
  .sort((a, b) => a.n.localeCompare(b.n));
await writeFile(path.join(OUT, "moves.json"), JSON.stringify(moves));

console.log("\n→ Fetching abilities…");
const abilityList = (await fetchJson(`${API}/ability?limit=400`)).results;
let adone = 0;
const abilities = (
  await pool(abilityList, (a) =>
    fetchJson(a.url).then((d) => {
      process.stdout.write(`\r   abilities ${++adone}/${abilityList.length}`);
      return d;
    })
  )
)
  .filter(Boolean)
  .map((ab) => ({
    n: ab.name,
    g: genNum(ab.generation?.name),
    e: shortEffect(ab.effect_entries[0]) || pickEnglish(ab.flavor_text_entries),
  }))
  .sort((a, b) => a.n.localeCompare(b.n));
await writeFile(path.join(OUT, "abilities.json"), JSON.stringify(abilities));

console.log("\n→ Fetching items…");
const itemList = (await fetchJson(`${API}/item?limit=2500`)).results;
let idone = 0;
const items = (
  await pool(itemList, (it) =>
    fetchJson(it.url).then((d) => {
      process.stdout.write(`\r   items ${++idone}/${itemList.length}`);
      return d;
    })
  )
)
  .filter(Boolean)
  .map((it) => ({
    n: it.name,
    c: it.category?.name ?? "",
    cost: it.cost,
    e: shortEffect(it.effect_entries[0]) || pickEnglish(it.flavor_text_entries),
  }))
  .sort((a, b) => a.n.localeCompare(b.n));
await writeFile(path.join(OUT, "items.json"), JSON.stringify(items));

console.log("\n→ Fetching berries…");
const berryList = (await fetchJson(`${API}/berry?limit=100`)).results;
const berries = (
  await pool(berryList, (b) => fetchJson(b.url))
)
  .filter(Boolean)
  .map((b) => ({
    n: b.name,
    firmness: b.firmness.name,
    growth: b.growth_time,
    harvest: b.max_harvest,
    size: b.size,
    smooth: b.smoothness,
    dry: b.soil_dryness,
    giftType: b.natural_gift_type.name,
    giftPower: b.natural_gift_power,
    flavors: b.flavors.filter((f) => f.potency > 0).map((f) => ({ f: f.flavor.name, p: f.potency })),
  }));
await writeFile(path.join(OUT, "berries.json"), JSON.stringify(berries));

console.log("\n→ Fetching types & generations…");
const TYPE_NAMES = [
  "normal","fire","water","electric","grass","ice","fighting","poison","ground",
  "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy",
];
const typeDetails = await pool(TYPE_NAMES, (t) => fetchJson(`${API}/type/${t}`));
const types = {};
typeDetails.forEach((td, idx) => {
  if (!td) return;
  const dr = td.damage_relations;
  types[TYPE_NAMES[idx]] = {
    double: dr.double_damage_to.map((t) => t.name),
    half: dr.half_damage_to.map((t) => t.name),
    zero: dr.no_damage_to.map((t) => t.name),
  };
});
await writeFile(path.join(OUT, "types.json"), JSON.stringify(types));

const genList = (await fetchJson(`${API}/generation?limit=20`)).results;
const genDetails = await pool(genList, (g) => fetchJson(g.url));
const generations = genDetails
  .filter(Boolean)
  .map((g) => ({
    n: genNum(g.name),
    region: g.main_region.name,
    games: g.version_groups.map((v) => v.name),
  }))
  .sort((a, b) => a.n - b.n);
await writeFile(path.join(OUT, "generations.json"), JSON.stringify(generations));

console.log("\n✓ All data written to src/data/");
