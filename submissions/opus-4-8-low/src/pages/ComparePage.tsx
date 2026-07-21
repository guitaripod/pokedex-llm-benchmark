import { useState } from 'react'
import { Link } from 'react-router-dom'
import { POKEDEX, searchIndex, type IndexEntry } from '../lib/data'
import { artworkUrl, padId, spriteUrl, titleCase } from '../lib/api'
import { STAT_COLORS } from '../lib/constants'
import { TypeBadge } from '../components/ui'

const STAT_KEYS: { key: keyof IndexEntry; label: string; stat: string }[] = [
  { key: 'hp', label: 'HP', stat: 'hp' },
  { key: 'atk', label: 'Attack', stat: 'attack' },
  { key: 'def', label: 'Defense', stat: 'defense' },
  { key: 'spa', label: 'Sp. Atk', stat: 'special-attack' },
  { key: 'spd', label: 'Sp. Def', stat: 'special-defense' },
  { key: 'spe', label: 'Speed', stat: 'speed' },
]

export function ComparePage() {
  const [picks, setPicks] = useState<IndexEntry[]>([POKEDEX[5], POKEDEX[8]])

  const add = (p: IndexEntry) => setPicks((cur) => (cur.find((x) => x.id === p.id) || cur.length >= 4 ? cur : [...cur, p]))
  const remove = (id: number) => setPicks((cur) => cur.filter((p) => p.id !== id))

  const best = (key: keyof IndexEntry) => Math.max(...picks.map((p) => p[key] as number))

  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-black tracking-tight">⚖️ Compare Pokémon</h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-white/90">Stack up to 4 Pokémon side by side across every base stat. The highest value in each row is highlighted.</p>
      </div>

      <Picker onPick={add} disabled={picks.length >= 4} />

      {picks.length === 0 ? (
        <p className="py-12 text-center text-slate-400">Add Pokémon to compare.</p>
      ) : (
        <div className="card overflow-x-auto p-4 sm:p-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: `120px repeat(${picks.length}, minmax(120px, 1fr))` }}>
            <div />
            {picks.map((p) => (
              <div key={p.id} className="text-center">
                <button onClick={() => remove(p.id)} className="float-right text-xs text-slate-400 hover:text-red-500">✕</button>
                <Link to={`/pokemon/${p.id}`}>
                  <img src={artworkUrl(p.id)} alt={p.name} className="mx-auto h-20 w-20 object-contain" onError={(e) => ((e.target as HTMLImageElement).src = spriteUrl(p.id))} />
                  <div className="text-sm font-black">{titleCase(p.name)}</div>
                  <div className="text-[10px] text-slate-400">{padId(p.id)}</div>
                </Link>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {p.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" link={false} />
                  ))}
                </div>
              </div>
            ))}

            {STAT_KEYS.map((s) => (
              <Row key={s.key} label={s.label} statKey={s.key} picks={picks} best={best(s.key)} color={STAT_COLORS[s.stat]} />
            ))}

            <div className="self-center text-xs font-black uppercase text-slate-500">Total</div>
            {picks.map((p) => {
              const isBest = p.total === Math.max(...picks.map((x) => x.total))
              return (
                <div key={p.id} className={`self-center text-center text-lg font-black ${isBest ? 'text-emerald-500' : ''}`}>
                  {p.total}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, statKey, picks, best, color }: { label: string; statKey: keyof IndexEntry; picks: IndexEntry[]; best: number; color: string }) {
  return (
    <>
      <div className="self-center text-xs font-bold uppercase text-slate-500">{label}</div>
      {picks.map((p) => {
        const v = p[statKey] as number
        const isBest = v === best
        return (
          <div key={p.id} className="self-center">
            <div className={`text-center text-sm font-black tabular-nums ${isBest ? 'text-emerald-500' : ''}`}>{v}</div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / 255) * 100)}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </>
  )
}

function Picker({ onPick, disabled }: { onPick: (p: IndexEntry) => void; disabled: boolean }) {
  const [q, setQ] = useState('')
  const results = q ? searchIndex(q).slice(0, 8) : []
  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? 'Max 4 Pokémon' : 'Add a Pokémon to compare…'}
        className="w-full rounded-full border border-slate-200 bg-white/80 py-3 px-5 text-sm font-medium outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30 disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
      />
      {results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl glass shadow-xl">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onPick(p)
                setQ('')
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <img src={spriteUrl(p.id)} alt="" className="h-8 w-8 object-contain" />
              <span className="font-semibold">{titleCase(p.name)}</span>
              <span className="ml-auto text-xs text-slate-400">{padId(p.id)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
