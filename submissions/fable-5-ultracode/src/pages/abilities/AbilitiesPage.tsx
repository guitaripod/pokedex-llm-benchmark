import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAbilities, getMeta } from '../../lib/api'
import { useAsync, useDebounced, useDocTitle, useSearchParamText } from '../../lib/hooks'
import { rankSearch } from '../../lib/search'
import { GEN_ROMAN } from '../../lib/format'
import type { AbilityIndex } from '../../lib/types'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import './abilities.css'

const SORTS = [
  { id: 'name', label: 'Name' },
  { id: 'gen', label: 'Generation' },
  { id: 'id', label: 'Index number' }
] as const

type SortId = (typeof SORTS)[number]['id']

const abilityNo = (id: number) => `#${String(id).padStart(3, '0')}`

function compareBy(sort: SortId, a: AbilityIndex, b: AbilityIndex): number {
  if (sort === 'name') return a.dname.localeCompare(b.dname) || a.id - b.id
  if (sort === 'gen') return a.gen - b.gen || a.dname.localeCompare(b.dname) || a.id - b.id
  return a.id - b.id
}

export default function AbilitiesPage() {
  useDocTitle('Abilities')
  const { data: abilities, error } = useAsync(getAbilities, [])
  const { data: meta } = useAsync(getMeta, [])
  const [params, setParams] = useSearchParams()

  const [q, setQ] = useSearchParamText('q')
  const debouncedQ = useDebounced(q)
  const selGens = useMemo(
    () => (params.get('gen') ?? '').split(',').filter(Boolean).map(Number),
    [params]
  )
  const sortParam = params.get('sort')
  const sort: SortId = sortParam === 'gen' || sortParam === 'id' ? sortParam : 'name'

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

  const toggleGen = (g: number) => {
    const next = selGens.includes(g) ? selGens.filter(v => v !== g) : [...selGens, g]
    update('gen', next.join(','))
  }

  const genSpan = useMemo(() => {
    if (!abilities?.length) return null
    let min = abilities[0].gen
    let max = abilities[0].gen
    for (const a of abilities) {
      if (a.gen < min) min = a.gen
      if (a.gen > max) max = a.gen
    }
    return { min, max }
  }, [abilities])

  const filtered = useMemo(() => {
    if (!abilities) return null
    let rows = selGens.length ? abilities.filter(a => selGens.includes(a.gen)) : abilities
    const query = debouncedQ.trim()
    if (query) {
      rows = rankSearch(rows, query, rows.length)
      if (sortParam) rows = [...rows].sort((a, b) => compareBy(sort, a, b))
    } else {
      rows = [...rows].sort((a, b) => compareBy(sort, a, b))
    }
    return rows
  }, [abilities, debouncedQ, selGens, sortParam, sort])

  if (error) {
    return (
      <div className="container page-pad">
        <EmptyState title="Ability index unavailable" hint="The ability data failed to load. Try refreshing the page." />
      </div>
    )
  }
  if (!abilities || !filtered) return <Loader />

  return (
    <div className="container page-pad">
      <header className="abx-console">
        <div className="eyebrow">
          Ability Index · {abilities.length} catalogued
          {genSpan && ` · Generations ${GEN_ROMAN[genSpan.min]}–${GEN_ROMAN[genSpan.max]}`}
        </div>
        <h1>Abilities</h1>
        <div className="abx-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            className="abx-search-input"
            placeholder="Search abilities by name or number…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search abilities"
          />
          {q && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQ('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="abx-filter-row" role="group" aria-label="Filter by generation">
          {(meta?.gens ?? []).map(g => {
            const on = selGens.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                className={`chip${on ? ' on' : ''}`}
                aria-pressed={on}
                title={`${g.dname}${g.region ? ` · ${g.region}` : ''}`}
                onClick={() => toggleGen(g.id)}
              >
                {GEN_ROMAN[g.id]}
              </button>
            )
          })}
        </div>

        <div className="abx-toolbar">
          <span className="mono dim abx-readout" aria-live="polite">
            {filtered.length} of {abilities.length} abilities
          </span>
          <div className="abx-controls">
            <label className="visually-hidden" htmlFor="ability-sort">Sort by</label>
            <select
              id="ability-sort"
              className="select"
              value={sort}
              onChange={e => update('sort', e.target.value === 'name' ? '' : e.target.value)}
            >
              {SORTS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {filtered.length > 0 ? (
        <div className="abx-grid">
          {filtered.map(a => (
            <Link key={a.id} to={`/abilities/${a.id}`} className="abx-card card">
              <span className="abx-card-top">
                <span className="abx-no mono">{abilityNo(a.id)}</span>
                <span className="abx-gen">Gen {GEN_ROMAN[a.gen]}</span>
              </span>
              <span className="abx-name">{a.dname}</span>
              <span className="abx-effect">{a.effect || 'No effect data on record.'}</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No abilities match" hint="Loosen the generation filter or clear the search to widen the field.">
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
