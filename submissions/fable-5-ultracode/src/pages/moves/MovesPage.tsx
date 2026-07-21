import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getMeta, getMoves } from '../../lib/api'
import { useAsync, useDebounced, useDocTitle, useSearchParamText } from '../../lib/hooks'
import type { MoveIndex } from '../../lib/types'
import { rankSearch } from '../../lib/search'
import { GEN_ROMAN, titleCase } from '../../lib/format'
import { DMG_CLASS_COLORS, TYPE_COLORS, typeColor, typeInk } from '../../lib/typeColors'
import TypeBadge from '../../components/TypeBadge'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { ClassTag, EM_DASH } from './movesShared'
import './moves.css'

const COLUMNS = [
  { key: 'name', label: 'Move', numeric: false },
  { key: 'type', label: 'Type', numeric: false },
  { key: 'class', label: 'Cat.', numeric: false },
  { key: 'power', label: 'Power', numeric: true },
  { key: 'acc', label: 'Acc.', numeric: true },
  { key: 'pp', label: 'PP', numeric: true },
  { key: 'gen', label: 'Gen', numeric: false }
] as const

type SortKey = (typeof COLUMNS)[number]['key']

const DAMAGE_CLASSES = ['physical', 'special', 'status']

function cmpNullable(a: number | null, b: number | null, dir: number): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return (a - b) * dir
}

function compareMoves(a: MoveIndex, b: MoveIndex, sort: SortKey, dir: number): number {
  switch (sort) {
    case 'name':
      return a.dname.localeCompare(b.dname) * dir
    case 'type':
      return a.type.localeCompare(b.type) * dir || a.dname.localeCompare(b.dname)
    case 'class':
      return a.dclass.localeCompare(b.dclass) * dir || a.dname.localeCompare(b.dname)
    case 'power':
      return cmpNullable(a.power, b.power, dir)
    case 'acc':
      return cmpNullable(a.acc, b.acc, dir)
    case 'pp':
      return cmpNullable(a.pp, b.pp, dir)
    case 'gen':
      return (a.gen - b.gen) * dir
  }
}

export default function MovesPage() {
  useDocTitle('Moves')
  const { data: moves, error } = useAsync(getMoves, [])
  const { data: meta } = useAsync(getMeta, [])
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useSearchParamText('q')
  const debouncedQ = useDebounced(q)
  const selTypes = useMemo(() => (params.get('type') ?? '').split(',').filter(Boolean), [params])
  const selClasses = useMemo(() => (params.get('class') ?? '').split(',').filter(Boolean), [params])
  const selGens = useMemo(
    () => (params.get('gen') ?? '').split(',').filter(Boolean).map(Number),
    [params]
  )
  const sortParam = params.get('sort')
  const sort = COLUMNS.some(c => c.key === sortParam) ? (sortParam as SortKey) : null
  const dir = params.get('dir') === 'desc' ? -1 : 1

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

  const toggleCsv = (key: string, current: string[], value: string) => {
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    update(key, next.join(','))
  }

  const onSort = (key: SortKey) => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (sort !== key) {
          next.set('sort', key)
          next.delete('dir')
        } else if (dir === 1) {
          next.set('dir', 'desc')
        } else {
          next.delete('sort')
          next.delete('dir')
        }
        return next
      },
      { replace: true }
    )
  }

  const filtered = useMemo(() => {
    if (!moves) return null
    let rows = moves.filter(
      m =>
        (!selTypes.length || selTypes.includes(m.type)) &&
        (!selClasses.length || selClasses.includes(m.dclass)) &&
        (!selGens.length || selGens.includes(m.gen))
    )
    const query = debouncedQ.trim()
    if (query) rows = rankSearch(rows, query, rows.length)
    if (sort) rows = [...rows].sort((a, b) => compareMoves(a, b, sort, dir) || a.id - b.id)
    return rows
  }, [moves, debouncedQ, selTypes, selClasses, selGens, sort, dir])

  if (error) {
    return (
      <div className="container page-pad">
        <EmptyState title="Could not load moves" hint="The move data failed to load. Try reloading the page." />
      </div>
    )
  }
  if (!moves || !filtered) return <Loader />

  return (
    <div className="container page-pad">
      <div className="mv-console">
        <div className="eyebrow">
          Move Dex · {moves.length} moves · Generations I–{GEN_ROMAN[meta?.gens.length ?? 9]}
        </div>
        <h1>Moves</h1>
        <div className="mv-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            className="mv-search-input"
            placeholder="Search moves by name or number…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search moves"
          />
          {q && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQ('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="mv-filter-row" role="group" aria-label="Filter by damage class">
          {DAMAGE_CLASSES.map(c => {
            const on = selClasses.includes(c)
            return (
              <button
                key={c}
                type="button"
                className={`chip${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => toggleCsv('class', selClasses, c)}
              >
                <span className="mv-dot" style={{ background: DMG_CLASS_COLORS[c] }} aria-hidden="true" />
                {titleCase(c)}
              </button>
            )
          })}
        </div>

        <div className="mv-filter-row" role="group" aria-label="Filter by type">
          {Object.keys(TYPE_COLORS).map(t => {
            const on = selTypes.includes(t)
            return (
              <button
                key={t}
                type="button"
                className={`chip mv-type-chip${on ? ' on' : ''}`}
                style={on ? { background: typeColor(t), borderColor: typeColor(t), color: typeInk(t) } : undefined}
                aria-pressed={on}
                onClick={() => toggleCsv('type', selTypes, t)}
              >
                {t}
              </button>
            )
          })}
        </div>

        <div className="mv-filter-row" role="group" aria-label="Filter by generation">
          {(meta?.gens ?? []).map(g => {
            const on = selGens.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                className={`chip${on ? ' on' : ''}`}
                aria-pressed={on}
                title={`${g.dname}${g.region ? ` · ${g.region}` : ''}`}
                onClick={() => toggleCsv('gen', selGens.map(String), String(g.id))}
              >
                {GEN_ROMAN[g.id]}
              </button>
            )
          })}
        </div>

        <div className="mv-toolbar">
          <span className="mono dim mv-readout" aria-live="polite">
            {filtered.length} / {moves.length} moves
          </span>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mv-table-wrap">
          <table className="data-table mv-table" aria-label="Moves">
            <thead>
              <tr>
                {COLUMNS.map(c => (
                  <th
                    key={c.key}
                    scope="col"
                    className={c.numeric ? 'mv-th-num' : undefined}
                    aria-sort={sort === c.key ? (dir === 1 ? 'ascending' : 'descending') : undefined}
                  >
                    <button
                      type="button"
                      className="mv-th-btn"
                      onClick={() => onSort(c.key)}
                      aria-label={`Sort by ${c.label === 'Cat.' ? 'category' : c.label.toLowerCase()}`}
                    >
                      {c.label}
                      <span className="mv-sort-ind" aria-hidden="true">
                        {sort === c.key ? (dir === 1 ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                ))}
                <th scope="col">Effect</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <Link to={`/moves/${m.id}`} className="mv-name">
                      {m.dname}
                    </Link>
                  </td>
                  <td>
                    <TypeBadge type={m.type} size="sm" />
                  </td>
                  <td>
                    <ClassTag dclass={m.dclass} />
                  </td>
                  <td className="num mv-td-num">{m.power ?? EM_DASH}</td>
                  <td className="num mv-td-num">{m.acc ?? EM_DASH}</td>
                  <td className="num mv-td-num">{m.pp ?? EM_DASH}</td>
                  <td className="num">{GEN_ROMAN[m.gen]}</td>
                  <td className="mv-effect">
                    <span className="mv-effect-text" title={m.effect}>
                      {m.effect}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No moves match" hint="Loosen a filter or clear the search to widen the field.">
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
