import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading } from '../components/ui'
import { getItems, getMeta } from '../lib/data'
import { useAsync, useDebounced, useInfinite } from '../lib/hooks'
import { title } from '../lib/util'

export default function Items() {
  const { data: items } = useAsync(getItems, [])
  const { data: meta } = useAsync(getMeta, [])
  const [q, setQ] = useState('')
  const query = useDebounced(q)
  const [pocket, setPocket] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<'id' | 'label' | 'cost'>('id')

  const pockets = useMemo(() => [...new Set((meta?.itemCategories ?? []).map((c) => c.pocket))].sort(), [meta])
  const catsForPocket = useMemo(
    () => (meta?.itemCategories ?? []).filter((c) => !pocket || c.pocket === pocket).sort((a, b) => a.label.localeCompare(b.label)),
    [meta, pocket],
  )
  const catPocket = useMemo(() => new Map((meta?.itemCategories ?? []).map((c) => [c.name, c.pocket])), [meta])

  const rows = useMemo(() => {
    const lower = query.trim().toLowerCase()
    return (items ?? [])
      .filter((i) => {
        if (pocket && catPocket.get(i.category) !== pocket) return false
        if (category && i.category !== category) return false
        if (lower && !i.label.toLowerCase().includes(lower) && !(i.shortEffect ?? '').toLowerCase().includes(lower)) return false
        return true
      })
      .sort((a, b) => (sort === 'label' ? a.label.localeCompare(b.label) : sort === 'cost' ? b.cost - a.cost : a.id - b.id))
  }, [items, query, pocket, category, sort, catPocket])

  const { count, sentinel } = useInfinite(rows.length, 72)
  if (!items || !meta) return <Loading label="Loading items" />

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Items</h1>
        <div className="faint small">{rows.length} of {items.length}</div>
      </div>
      <div className="card card-pad toolbar">
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" style={{ width: 170 }} value={pocket} onChange={(e) => { setPocket(e.target.value); setCategory('') }}>
          <option value="">All pockets</option>
          {pockets.map((p) => <option key={p} value={p}>{title(p)}</option>)}
        </select>
        <select className="input" style={{ width: 220 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {catsForPocket.map((c) => <option key={c.name} value={c.name}>{c.label} ({c.count})</option>)}
        </select>
        <select className="input" style={{ width: 150 }} value={sort} onChange={(e) => setSort(e.target.value as 'id')}>
          <option value="id">By number</option>
          <option value="label">By name</option>
          <option value="cost">By price</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {rows.slice(0, count).map((i) => (
          <Link key={i.id} to={`/items/${i.name}`} className="card card-pad" style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 12, alignItems: 'start' }}>
            <div style={{ background: 'var(--panel-2)', borderRadius: 10, display: 'grid', placeItems: 'center', height: 46 }}>
              {i.sprite ? <img src={i.sprite} alt="" width={32} height={32} loading="lazy" style={{ imageRendering: 'pixelated' }} /> : <span className="faint">?</span>}
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <strong style={{ fontSize: 14.5 }}>{i.label}</strong>
              <span className="faint small">{title(i.category)}{i.cost ? ` · ₽${i.cost.toLocaleString()}` : ''}</span>
              <span className="muted small" style={{ lineHeight: 1.5 }}>{(i.shortEffect ?? '').slice(0, 110)}</span>
            </div>
          </Link>
        ))}
      </div>
      <div ref={sentinel} style={{ height: 1 }} />
    </div>
  )
}
