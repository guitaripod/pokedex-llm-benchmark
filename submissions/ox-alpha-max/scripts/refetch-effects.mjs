#!/usr/bin/env node
/** Regenerates moves/abilities/items with strict English-only effect text. */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://pokeapi.co/api/v2";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
const CONCURRENCY = 24;

async function fetchJson(url) {
  for (let a = 0; a <= 3; a++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch {
      await new Promise((r) => setTimeout(r, 300 * 2 ** a));
    }
  }
  return null;
}

async function pool(items, worker) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await worker(items[i]);
      }
    })
  );
  return out;
}

const genNum = (name) => {
  const m = /generation-(\w+)/.exec(name || "");
  return m ? ({ i:1,ii:2,iii:3,iv:4,v:5,vi:6,vii:7,viii:8,ix:9 })[m[1]] ?? 0 : 0;
};

function enEffect(entry, chance) {
  if (!entry || entry.language?.name !== "en") return "";
  let txt = entry.short_effect || entry.effect || "";
  if (chance != null) txt = txt.replaceAll("$effect_chance", String(chance));
  return txt.replace(/\s+/g, " ").trim();
}

function enFlavor(entries) {
  const en = (entries ?? []).filter((e) => e.language.name === "en");
  const best = en[en.length - 1];
  return best ? (best.flavor_text || best.text || "").replace(/[\n\f\r]/g, " ").replace(/\s+/g, " ").trim() : "";
}

// moves
let list = (await fetchJson(`${API}/move?limit=1000`)).results;
let done = 0;
const moves = (await pool(list, (m) => fetchJson(m.url).then((d) => {
  process.stdout.write(`\rmoves ${++done}/${list.length}   `);
  return d;
})))
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
    e: enEffect(mv.effect_entries[0], mv.effect_chance) || enFlavor(mv.flavor_text_entries),
  }))
  .sort((a, b) => a.n.localeCompare(b.n));
await writeFile(path.join(OUT, "moves.json"), JSON.stringify(moves));

// abilities
list = (await fetchJson(`${API}/ability?limit=400`)).results;
done = 0;
const abilities = (await pool(list, (a) => fetchJson(a.url).then((d) => {
  process.stdout.write(`\rabilities ${++done}/${list.length}   `);
  return d;
})))
  .filter(Boolean)
  .map((ab) => ({
    n: ab.name,
    g: genNum(ab.generation?.name),
    e: enEffect(ab.effect_entries[0]) || enFlavor(ab.flavor_text_entries),
  }))
  .sort((a, b) => a.n.localeCompare(b.n));
await writeFile(path.join(OUT, "abilities.json"), JSON.stringify(abilities));

// items
list = (await fetchJson(`${API}/item?limit=2500`)).results;
done = 0;
const items = (await pool(list, (it) => fetchJson(it.url).then((d) => {
  process.stdout.write(`\ritems ${++done}/${list.length}   `);
  return d;
})))
  .filter(Boolean)
  .map((it) => ({
    n: it.name,
    c: it.category?.name ?? "",
    cost: it.cost,
    e: enEffect(it.effect_entries[0]) || enFlavor(it.flavor_text_entries),
  }))
  .sort((a, b) => a.n.localeCompare(b.n));
await writeFile(path.join(OUT, "items.json"), JSON.stringify(items));

console.log("\n✓ effects regenerated (English only)");
