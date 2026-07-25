import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading } from '../components/ui'
import { getAbilities } from '../lib/data'
import { useAsync, useDebounced, useInfinite } from '../lib/hooks'

export default function Abilities() {
  const { data: abilities } = useAsync(getAbilities, [])
  const [q, setQ] = useState('')
  const query = useDebounced(q)
  const [gen, setGen] = useState(0)
  const [sort, setSort] = useState<'id' | 'label' | 'count'>('id')

  const rows = useMemo(() => {
    const lower = query.trim().toLowerCase()
    return (abilities ?? [])
      .filter((a) => (!gen || a.generation === gen) &&
        (!lower || a.label.toLowerCase().includes(lower) || (a.shortEffect ?? '').toLowerCase().includes(lower)))
      .sort((a, b) => (sort === 'label' ? a.label.localeCompare(b.label) : sort === 'count' ? b.count - a.count : a.id - b.id))
  }, [abilities, query, gen, sort])

  const { count, sentinel } = useInfinite(rows.length, 60)
  if (!abilities) return <Loading label="Loading abilities" />

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Abilities</h1>
        <div className="faint small">{rows.length} of {abilities.length}</div>
      </div>
      <div className="card card-pad toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search abilities or effects…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" style={{ width: 160 }} value={gen} onChange={(e) => setGen(Number(e.target.value))}>
          <option value={0}>All generations</option>
          {[3, 4, 5, 6, 7, 8, 9].map((g) => <option key={g} value={g}>Generation {g}</option>)}
        </select>
        <select className="input" style={{ width: 160 }} value={sort} onChange={(e) => setSort(e.target.value as 'id')}>
          <option value="id">By number</option>
          <option value="label">By name</option>
          <option value="count">By popularity</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {rows.slice(0, count).map((a) => (
          <Link key={a.id} to={`/abilities/${a.name}`} className="card card-pad" style={{ display: 'grid', gap: 6 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: 'var(--font-display)' }}>{a.label}</strong>
              <span className="badge">Gen {a.generation}</span>
            </div>
            <span className="muted small" style={{ lineHeight: 1.55 }}>{a.shortEffect}</span>
            <span className="faint small mono">{a.count} Pokémon</span>
          </Link>
        ))}
      </div>
      <div ref={sentinel} style={{ height: 1 }} />
    </div>
  )
}
