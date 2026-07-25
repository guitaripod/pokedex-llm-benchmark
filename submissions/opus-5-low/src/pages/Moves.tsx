import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading, TypeBadge, typeColor } from '../components/ui'
import { getMoves } from '../lib/data'
import { useAsync, useDebounced, useInfinite } from '../lib/hooks'
import type { MoveIndex } from '../lib/types'
import { TYPE_ORDER, title } from '../lib/util'

type Key = keyof MoveIndex

export default function Moves() {
  const { data: moves } = useAsync(getMoves, [])
  const [q, setQ] = useState('')
  const query = useDebounced(q)
  const [types, setTypes] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [gen, setGen] = useState(0)
  const [sort, setSort] = useState<Key>('id')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo(() => {
    const lower = query.trim().toLowerCase()
    const out = (moves ?? []).filter((m) => {
      if (types.length && !types.includes(m.type)) return false
      if (classes.length && !classes.includes(m.damageClass)) return false
      if (gen && m.generation !== gen) return false
      if (lower && !m.label.toLowerCase().includes(lower) && !(m.shortEffect ?? '').toLowerCase().includes(lower)) return false
      return true
    })
    return out.sort((a, b) => {
      const av = a[sort]; const bv = b[sort]
      const c = typeof av === 'string' ? av.localeCompare(String(bv)) : (Number(av ?? -1) - Number(bv ?? -1))
      return dir === 'asc' ? c : -c
    })
  }, [moves, query, types, classes, gen, sort, dir])

  const { count, sentinel } = useInfinite(rows.length, 80)
  if (!moves) return <Loading label="Loading moves" />

  const th = (key: Key, label: string, right?: boolean) => (
    <th
      key={key}
      style={{ textAlign: right ? 'right' : 'left' }}
      onClick={() => { if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSort(key); setDir('asc') } }}
    >
      {label}{sort === key ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  )

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Moves</h1>
        <div className="faint small">{rows.length} of {moves.length} moves</div>
      </div>

      <div className="card card-pad filters">
        <div className="toolbar">
          <input className="input" style={{ maxWidth: 300 }} placeholder="Search moves or effects…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" style={{ width: 150 }} value={gen} onChange={(e) => setGen(Number(e.target.value))}>
            <option value={0}>All generations</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => <option key={g} value={g}>Generation {g}</option>)}
          </select>
          <div className="row" style={{ gap: 6 }}>
            {['physical', 'special', 'status'].map((c) => (
              <button key={c} className={`chip${classes.includes(c) ? ' on' : ''}`} onClick={() => setClasses((s) => s.includes(c) ? s.filter((x) => x !== c) : [...s, c])}>{title(c)}</button>
            ))}
          </div>
          <span className="spacer" />
          <button className="btn sm" onClick={() => { setQ(''); setTypes([]); setClasses([]); setGen(0) }}>Reset</button>
        </div>
        <div className="chips">
          {TYPE_ORDER.map((t) => (
            <button key={t} className={`chip${types.includes(t) ? ' type-on' : ''}`} style={{ ['--tc' as string]: typeColor(t) }}
              onClick={() => setTypes((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])}>{t}</button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {th('id', '#')}
              {th('label', 'Move')}
              {th('type', 'Type')}
              {th('damageClass', 'Class')}
              {th('power', 'Power', true)}
              {th('accuracy', 'Acc', true)}
              {th('pp', 'PP', true)}
              {th('priority', 'Pri', true)}
              {th('generation', 'Gen', true)}
              <th className="plain">Effect</th>
              {th('learners', 'Learners', true)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, count).map((m) => (
              <tr key={m.id}>
                <td className="num faint">{m.id}</td>
                <td><Link to={`/moves/${m.name}`} style={{ fontWeight: 600 }}>{m.label}</Link></td>
                <td><TypeBadge type={m.type} sm /></td>
                <td className="small faint">{title(m.damageClass)}</td>
                <td className="num">{m.power ?? '—'}</td>
                <td className="num">{m.accuracy ? `${m.accuracy}%` : '—'}</td>
                <td className="num faint">{m.pp ?? '—'}</td>
                <td className="num faint">{m.priority > 0 ? `+${m.priority}` : m.priority}</td>
                <td className="num faint">{m.generation}</td>
                <td className="small muted" style={{ maxWidth: 420 }}>{m.shortEffect}</td>
                <td className="num faint">{m.learners}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div ref={sentinel} style={{ height: 1 }} />
    </div>
  )
}
