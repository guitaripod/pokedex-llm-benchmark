#!/usr/bin/env node
/** Fixes generation values for alternate forms by resolving their real species. */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://pokeapi.co/api/v2";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

const dex = JSON.parse(await readFile(path.join(OUT, "dex.json"), "utf8"));
const forms = dex.list.filter((d) => d.f);
console.log(`fixing ${forms.length} forms…`);

let next = 0;
let done = 0;
await Promise.all(
  Array.from({ length: 24 }, async () => {
    while (next < forms.length) {
      const f = forms[next++];
      try {
        const pk = await (await fetch(`${API}/pokemon/${f.i}`)).json();
        const spId = Number(pk.species.url.split("/").filter(Boolean).pop());
        const base = dex.list.find((d) => d.i === spId && !d.f);
        f.g = base ? base.g : f.g;
      } catch {}
      process.stdout.write(`\r${++done}/${forms.length}   `);
    }
  })
);

await writeFile(path.join(OUT, "dex.json"), JSON.stringify(dex));
console.log("\n✓ form generations fixed");
