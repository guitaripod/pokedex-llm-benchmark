import { useEffect, useMemo, useRef, useState } from 'react'
import { POKEDEX, searchIndex, type IndexEntry } from '../lib/data'
import { GENERATIONS, TYPE_COLORS } from '../lib/constants'
import { TYPE_ORDER } from '../lib/typechart'
import { PokemonCard } from '../components/PokemonCard'
import { PokeballIcon } from '../components/ui'

type SortKey = 'id' | 'name' | 'total' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'height' | 'weight'
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Number' },
  { key: 'name', label: 'Name' },
  { key: 'total', label: 'Total' },
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Attack' },
  { key: 'def', label: 'Defense' },
  { key: 'spa', label: 'Sp. Atk' },
  { key: 'spd', label: 'Sp. Def' },
  { key: 'spe', label: 'Speed' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
]

const PAGE = 48

export function PokedexPage() {
  const [q, setQ] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [gens, setGens] = useState<number[]>([])
  const [sort, setSort] = useState<SortKey>('id')
  const [asc, setAsc] = useState(true)
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    let list = searchIndex(q)
    if (types.length) list = list.filter((p) => types.every((t) => p.types.includes(t)))
    if (gens.length) list = list.filter((p) => gens.includes(p.gen))
    const dir = asc ? 1 : -1
    list = [...list].sort((a, b) => {
      if (sort === 'name') return dir * a.name.localeCompare(b.name)
      return dir * ((a[sort] as number) - (b[sort] as number))
    })
    return list
  }, [q, types, gens, sort, asc])

  useEffect(() => setLimit(PAGE), [q, types, gens, sort, asc])

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) setLimit((l) => Math.min(l + PAGE, filtered.length))
      },
      { rootMargin: '600px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [filtered.length])

  const shown = filtered.slice(0, limit)
  const toggleType = (t: string) => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  const toggleGen = (g: number) => setGens((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]))
  const reset = () => {
    setQ('')
    setTypes([])
    setGens([])
    setSort('id')
    setAsc(true)
  }

  return (
    <div>
      <Hero total={POKEDEX.length} shown={filtered.length} />

      <div className="sticky top-[57px] z-30 -mx-4 mb-6 border-b border-slate-200/60 bg-slate-50/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0e1a]/90">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or number…"
                className="w-full rounded-full border border-slate-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/30 dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full border border-slate-200 bg-white/80 py-2.5 pl-3 pr-8 text-sm font-semibold outline-none dark:border-white/10 dark:bg-white/5"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAsc((a) => !a)}
                className="grid h-10 w-10 place-items-center rounded-full glass font-bold"
                title={asc ? 'Ascending' : 'Descending'}
              >
                {asc ? '↑' : '↓'}
              </button>
              <button onClick={reset} className="rounded-full glass px-3 py-2.5 text-sm font-semibold text-slate-500">
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TYPE_ORDER.map((t) => {
              const active = types.includes(t)
              const c = TYPE_COLORS[t]
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-all"
                  style={
                    active
                      ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})`, color: c.text, boxShadow: `0 2px 10px ${c.solid}66` }
                      : { background: `${c.solid}22`, color: c.solid }
                  }
                >
                  {t}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {GENERATIONS.map((g) => {
              const active = gens.includes(g.id)
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGen(g.id)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold transition-all"
                  style={
                    active
                      ? { background: g.color, color: '#fff', boxShadow: `0 2px 10px ${g.color}66` }
                      : { background: `${g.color}22`, color: g.color }
                  }
                >
                  Gen {g.id} · {g.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="py-24 text-center text-slate-400">
          <div className="mb-3 text-5xl">🫥</div>
          <p className="font-bold">No Pokémon match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((p: IndexEntry) => (
            <PokemonCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {limit < filtered.length && (
        <div ref={sentinel} className="flex justify-center py-10">
          <PokeballIcon className="h-8 w-8 text-red-500" spinning />
        </div>
      )}
    </div>
  )
}

function Hero({ total, shown }: { total: number; shown: number }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-orange-400 p-8 text-white shadow-xl">
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-yellow-300/20 blur-2xl" />
      <PokeballIcon className="absolute -bottom-10 -left-10 h-52 w-52 text-white/10" />
      <div className="relative">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">The National Pokédex</h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-white/90">
          Explore all {total} Pokémon across 9 generations. Search, filter by type & region, sort by any stat, and dive into full
          detail — stats, evolutions, moves, abilities, type matchups and cries.
        </p>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/80">
          Showing {shown} of {total}
        </p>
      </div>
    </div>
  )
}
