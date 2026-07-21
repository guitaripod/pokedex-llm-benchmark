import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Pokemon } from '../lib/types'
import { titleCase } from '../lib/api'

const METHODS = [
  { key: 'level-up', label: 'Level Up' },
  { key: 'machine', label: 'TM/HM' },
  { key: 'egg', label: 'Egg' },
  { key: 'tutor', label: 'Tutor' },
]

export function MovesTable({ pokemon }: { pokemon: Pokemon }) {
  const [method, setMethod] = useState('level-up')

  const versionGroups = useMemo(() => {
    const set = new Set<string>()
    pokemon.moves.forEach((m) => m.version_group_details.forEach((d) => set.add(d.version_group.name)))
    return Array.from(set)
  }, [pokemon])

  const latestVg = versionGroups[versionGroups.length - 1]
  const [vg, setVg] = useState(latestVg)

  const rows = useMemo(() => {
    const out: { name: string; level: number }[] = []
    for (const m of pokemon.moves) {
      const det = m.version_group_details.find((d) => d.move_learn_method.name === method && d.version_group.name === vg)
      if (det) out.push({ name: m.move.name, level: det.level_learned_at })
    }
    return out.sort((a, b) => (method === 'level-up' ? a.level - b.level || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)))
  }, [pokemon, method, vg])

  const available = METHODS.filter((mt) =>
    pokemon.moves.some((m) => m.version_group_details.some((d) => d.move_learn_method.name === mt.key)),
  )

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {available.map((mt) => (
            <button
              key={mt.key}
              onClick={() => setMethod(mt.key)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                method === mt.key ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'glass text-slate-500'
              }`}
            >
              {mt.label}
            </button>
          ))}
        </div>
        <select
          value={vg}
          onChange={(e) => setVg(e.target.value)}
          className="rounded-full border border-slate-200 bg-white/80 py-1.5 pl-3 pr-7 text-xs font-semibold dark:border-white/10 dark:bg-white/5"
        >
          {[...versionGroups].reverse().map((v) => (
            <option key={v} value={v}>
              {titleCase(v)}
            </option>
          ))}
        </select>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No {METHODS.find((m) => m.key === method)?.label} moves in this game.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200/60 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur dark:bg-white/10">
              <tr className="text-left text-xs uppercase text-slate-500">
                {method === 'level-up' && <th className="px-3 py-2 font-bold">Lv.</th>}
                <th className="px-3 py-2 font-bold">Move</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.name + i} className="border-t border-slate-200/50 hover:bg-slate-100/60 dark:border-white/5 dark:hover:bg-white/5">
                  {method === 'level-up' && <td className="px-3 py-2 font-bold tabular-nums text-slate-500">{r.level || '—'}</td>}
                  <td className="px-3 py-2">
                    <Link to={`/moves/${r.name}`} className="font-semibold hover:text-red-500">
                      {titleCase(r.name)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
