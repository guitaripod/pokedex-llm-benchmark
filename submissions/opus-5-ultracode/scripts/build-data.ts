import { resetOutput, emitStats } from './lib/emit.ts'
import { buildMeta } from './builders/meta.ts'
import { buildPokemon } from './builders/pokemon.ts'
import { buildMoves } from './builders/moves.ts'
import { buildItems } from './builders/items.ts'
import { buildAbilities } from './builders/abilities.ts'
import { buildLocations } from './builders/locations.ts'
import { buildPokedexes } from './builders/pokedexes.ts'
import { buildSearchIndex } from './builders/search.ts'

const steps: [string, () => void][] = [
  ['meta', buildMeta],
  ['abilities', buildAbilities],
  ['moves', buildMoves],
  ['items', buildItems],
  ['locations', buildLocations],
  ['pokedexes', buildPokedexes],
  ['pokemon', buildPokemon],
  ['search', buildSearchIndex],
]

function main() {
  const started = Date.now()
  resetOutput()
  for (const [name, run] of steps) {
    const t0 = Date.now()
    run()
    console.log(`  ${name.padEnd(12)} ${String(Date.now() - t0).padStart(6)}ms`)
  }
  const { filesWritten, bytesWritten } = emitStats()
  console.log(
    `\ndone in ${((Date.now() - started) / 1000).toFixed(1)}s — ${filesWritten} files, ${(bytesWritten / 1e6).toFixed(1)} MB`,
  )
}

main()
