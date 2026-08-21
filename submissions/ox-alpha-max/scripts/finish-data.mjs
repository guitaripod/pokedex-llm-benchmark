#!/usr/bin/env node
/** Completes berries.json, types.json, generations.json (firmness can be null). */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://pokeapi.co/api/v2";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function pool(items, worker) {
  let next = 0;
  await Promise.all(
    Array.from({ length: 12 }, async () => {
      while (next < items.length) {
        const i = next++;
        items[i] = await worker(items[i]);
      }
    })
  );
}

const berryList = (await fetchJson(`${API}/berry?limit=100`)).results;
await pool(berryList, (b) => fetchJson(b.url));
const berries = berryList.map((b) => ({
  n: b.name,
  firmness: b.firmness?.name ?? null,
  growth: b.growth_time,
  harvest: b.max_harvest,
  size: b.size,
  smooth: b.smoothness,
  dry: b.soil_dryness,
  giftType: b.natural_gift_type?.name ?? null,
  giftPower: b.natural_gift_power,
  flavors: b.flavors.filter((f) => f.potency > 0).map((f) => ({ f: f.flavor.name, p: f.potency })),
}));
await writeFile(path.join(OUT, "berries.json"), JSON.stringify(berries));

const TYPE_NAMES = [
  "normal","fire","water","electric","grass","ice","fighting","poison","ground",
  "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy",
];
const types = {};
for (const name of TYPE_NAMES) {
  const td = await fetchJson(`${API}/type/${name}`);
  const dr = td.damage_relations;
  types[name] = {
    double: dr.double_damage_to.map((t) => t.name),
    half: dr.half_damage_to.map((t) => t.name),
    zero: dr.no_damage_to.map((t) => t.name),
  };
}
await writeFile(path.join(OUT, "types.json"), JSON.stringify(types));

const genList = (await fetchJson(`${API}/generation?limit=20`)).results;
await pool(genList, (g) => fetchJson(g.url));
const genNum = (n) => ({ i:1,ii:2,iii:3,iv:4,v:5,vi:6,vii:7,viii:8,ix:9 }[/generation-(\w+)/.exec(n)?.[1]] ?? 0);
const generations = genList
  .map((g) => ({
    n: genNum(g.name),
    region: g.main_region?.name ?? "",
    games: g.version_groups.map((v) => v.name),
  }))
  .sort((a, b) => a.n - b.n);
await writeFile(path.join(OUT, "generations.json"), JSON.stringify(generations));

console.log("✓ berries/types/generations written");
