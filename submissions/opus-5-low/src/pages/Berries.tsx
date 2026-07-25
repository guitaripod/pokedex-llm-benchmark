import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading, TypeBadge } from '../components/ui'
import { getBerries } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { title } from '../lib/util'

export default function Berries() {
  const { data: berries } = useAsync(getBerries, [])
  const [sort, setSort] = useState<'id' | 'name' | 'power' | 'growth'>('id')
  if (!berries) return <Loading />

  const rows = [...berries].sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name)
      : sort === 'power' ? (b.naturalGiftPower ?? 0) - (a.naturalGiftPower ?? 0)
      : sort === 'growth' ? a.growthTime - b.growthTime
      : a.id - b.id)

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Berries</h1>
          <div className="faint small">{berries.length} berries with growth, flavour and Natural Gift data.</div>
        </div>
        <select className="input" style={{ width: 180 }} value={sort} onChange={(e) => setSort(e.target.value as 'id')}>
          <option value="id">By number</option>
          <option value="name">By name</option>
          <option value="power">By Natural Gift power</option>
          <option value="growth">By growth time</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
        {rows.map((b) => (
          <div key={b.id} className="card card-pad" style={{ display: 'grid', gap: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <Link to={`/items/${b.item}`} style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{title(b.name)} Berry</Link>
              {b.naturalGiftType && <TypeBadge type={b.naturalGiftType} sm />}
            </div>
            <div className="row small faint" style={{ gap: 12 }}>
              <span>Growth {b.growthTime}h</span>
              <span>Yield ≤{b.maxHarvest}</span>
              <span>Gift {b.naturalGiftPower ?? '—'}</span>
            </div>
            <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
              {b.flavors.filter((f) => f.potency > 0).map((f) => (
                <span key={f.flavor} className="badge">{title(f.flavor)} {f.potency}</span>
              ))}
            </div>
            <div className="faint small">Firmness: {title(b.firmness ?? '—')} · size {b.size / 10} cm · smoothness {b.smoothness}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
