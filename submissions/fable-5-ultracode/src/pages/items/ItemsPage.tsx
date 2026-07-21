import { Fragment, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getItems } from '../../lib/api'
import { useAsync, useDebounced, useDocTitle, useSearchParamText } from '../../lib/hooks'
import type { Item } from '../../lib/types'
import { rankSearch } from '../../lib/search'
import { titleCase } from '../../lib/format'
import Sprite from '../../components/Sprite'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import './items.css'

const GROUPS = [
  { id: 'balls', label: 'Poké Balls', match: (i: Item) => i.cat.includes('balls') },
  {
    id: 'medicine',
    label: 'Medicine',
    match: (i: Item) => /medicine|healing|status-cures|revival|pp-recovery/.test(i.cat)
  },
  { id: 'berries', label: 'Berries', match: (i: Item) => i.name.endsWith('-berry') },
  { id: 'machines', label: 'TMs & HMs', match: (i: Item) => i.cat === 'all-machines' },
  { id: 'held', label: 'Held items', match: (i: Item) => i.cat.includes('held') },
  { id: 'evolution', label: 'Evolution', match: (i: Item) => i.cat.includes('evolution') }
] as const

const SORTS = [
  { id: 'name', label: 'Name' },
  { id: 'cost', label: 'Cost' },
  { id: 'new', label: 'Newest' }
] as const

const GROUP_PREFIX = 'g:'

const costStr = (cost: number) => (cost > 0 ? `₽${cost.toLocaleString('en-US')}` : '—')

export default function ItemsPage() {
  useDocTitle('Items')
  const { data: items, error } = useAsync(getItems, [])
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<number | null>(null)

  const [q, setQ] = useSearchParamText('q')
  const debouncedQ = useDebounced(q)
  const catParam = params.get('cat') ?? ''
  const selGroup = catParam.startsWith(GROUP_PREFIX) ? catParam.slice(GROUP_PREFIX.length) : ''
  const selCat = selGroup ? '' : catParam
  const sort = params.get('sort') ?? 'name'

  const update = (key: string, value: string) => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true }
    )
  }

  const categories = useMemo(() => {
    if (!items) return []
    const seen = new Map<string, string>()
    for (const i of items) if (!seen.has(i.cat)) seen.set(i.cat, i.catD)
    return [...seen.entries()]
      .map(([cat, catD]) => ({ cat, catD }))
      .sort((a, b) => a.catD.localeCompare(b.catD))
  }, [items])

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!items) return counts
    for (const g of GROUPS) counts[g.id] = items.filter(g.match).length
    return counts
  }, [items])

  const filtered = useMemo(() => {
    if (!items) return null
    const group = GROUPS.find(g => g.id === selGroup)
    let rows = items
    if (group) rows = rows.filter(group.match)
    else if (selCat) rows = rows.filter(i => i.cat === selCat)
    const query = debouncedQ.trim()
    if (query) rows = rankSearch(rows, query, rows.length)
    if (sort === 'cost') {
      rows = [...rows].sort((a, b) => b.cost - a.cost || a.dname.localeCompare(b.dname))
    } else if (sort === 'new') {
      rows = [...rows].sort((a, b) => b.id - a.id)
    } else if (!query) {
      rows = [...rows].sort((a, b) => a.dname.localeCompare(b.dname) || a.id - b.id)
    }
    return rows
  }, [items, debouncedQ, selGroup, selCat, sort])

  if (error) {
    return (
      <div className="container page-pad">
        <EmptyState title="Item data failed to load" hint={error.message} />
      </div>
    )
  }
  if (!items || !filtered) return <Loader label="Loading items…" />

  return (
    <div className="container page-pad">
      <div className="items-console">
        <div className="eyebrow">
          Item Storage · {items.length} items · {categories.length} categories
        </div>
        <h1>Items</h1>

        <div className="items-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            className="items-search-input"
            placeholder="Search items by name…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search items"
          />
          {q && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQ('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="items-filter-row" role="group" aria-label="Quick category filters">
          {GROUPS.map(g => {
            const on = selGroup === g.id
            return (
              <button
                key={g.id}
                type="button"
                className={`chip${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => update('cat', on ? '' : GROUP_PREFIX + g.id)}
              >
                {g.label}
                <span className="items-group-count">{groupCounts[g.id] ?? 0}</span>
              </button>
            )
          })}
        </div>

        <div className="items-toolbar">
          <span className="mono dim items-readout" aria-live="polite">
            {filtered.length} of {items.length} items
          </span>
          <div className="items-toolbar-controls">
            <label className="visually-hidden" htmlFor="items-cat">Filter by category</label>
            <select id="items-cat" className="select" value={selCat} onChange={e => update('cat', e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.cat} value={c.cat}>
                  {c.catD}
                </option>
              ))}
            </select>
            <label className="visually-hidden" htmlFor="items-sort">Sort by</label>
            <select id="items-sort" className="select" value={sort} onChange={e => update('sort', e.target.value === 'name' ? '' : e.target.value)}>
              {SORTS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="items-grid">
          {filtered.map((it, idx) => {
            const open = openId === it.id
            return (
              <Fragment key={it.id}>
                <button
                  type="button"
                  className="items-card"
                  aria-expanded={open}
                  aria-controls={open ? `items-panel-${it.id}` : undefined}
                  onClick={() => setOpenId(open ? null : it.id)}
                >
                  <span className="items-sprite-box">
                    <Sprite src={it.sprite} alt="" size={30} pixelated eager={idx < 24} />
                  </span>
                  <span className="items-card-top">
                    <span className="items-card-name">{it.dname}</span>
                    <span className="items-card-cost">
                      {costStr(it.cost)}
                      <svg className="items-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </span>
                  <span className="items-card-cat">{it.catD}</span>
                  <span className="items-card-effect">{it.effect || it.flavor || 'No description available.'}</span>
                </button>
                {open && (
                  <div className="items-panel" id={`items-panel-${it.id}`} role="region" aria-label={`${it.dname} details`}>
                    <div>
                      <div className="items-panel-block">
                        <div className="eyebrow">Effect</div>
                        <p className="items-panel-effect">{it.effect || 'No effect data recorded.'}</p>
                      </div>
                      {it.flavor && (
                        <div className="items-panel-block">
                          <div className="eyebrow">Flavor text</div>
                          <p className="items-panel-flavor">{it.flavor}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <dl className="items-panel-facts">
                        <div className="items-fact">
                          <dt>Category</dt>
                          <dd>{it.catD}</dd>
                        </div>
                        <div className="items-fact">
                          <dt>Cost</dt>
                          <dd>{costStr(it.cost)}</dd>
                        </div>
                        <div className="items-fact">
                          <dt>Fling power</dt>
                          <dd>{it.fling != null ? it.fling : '—'}</dd>
                        </div>
                      </dl>
                      {it.attrs.length > 0 && (
                        <div className="items-panel-block">
                          <div className="eyebrow">Attributes</div>
                          <div className="items-attrs">
                            {it.attrs.map(a => (
                              <span key={a} className="items-attr">
                                {titleCase(a)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      ) : (
        <EmptyState title="No items match" hint="Loosen the category filter or clear the search to widen the field.">
          <button
            type="button"
            className="btn"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
            style={{ marginTop: 8 }}
          >
            Clear all filters
          </button>
        </EmptyState>
      )}
    </div>
  )
}
