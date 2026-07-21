import { useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getIndex, getMeta } from '../../lib/api'
import { useAsync, useDebounced, useDocTitle, useSearchParamText } from '../../lib/hooks'
import type { SpeciesIndex } from '../../lib/types'
import { fuzzyScore } from '../../lib/search'
import { GEN_ROMAN } from '../../lib/format'
import { typeColor, typeInk, TYPE_COLORS } from '../../lib/typeColors'
import PokeCard from '../../components/PokeCard'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import './home.css'

const SORTS = [
  { id: 'id', label: 'Dex number' },
  { id: 'name', label: 'Name' },
  { id: 'bst', label: 'Base stat total' },
  { id: 'hp', label: 'HP' },
  { id: 'atk', label: 'Attack' },
  { id: 'def', label: 'Defense' },
  { id: 'spa', label: 'Sp. Atk' },
  { id: 'spd', label: 'Sp. Def' },
  { id: 'spe', label: 'Speed' },
  { id: 'height', label: 'Height' },
  { id: 'weight', label: 'Weight' }
] as const

const STAT_IDX: Record<string, number> = { hp: 0, atk: 1, def: 2, spa: 3, spd: 4, spe: 5 }
const FLAGS = [
  { id: 'legendary', label: 'Legendary' },
  { id: 'mythical', label: 'Mythical' },
  { id: 'baby', label: 'Baby' },
  { id: 'forms', label: 'Has forms' }
] as const

function sortValue(s: SpeciesIndex, sort: string): number | string {
  if (sort === 'name') return s.dname
  if (sort === 'bst') return s.bst
  if (sort === 'height') return s.height
  if (sort === 'weight') return s.weight
  if (sort in STAT_IDX) return s.stats[STAT_IDX[sort]]
  return s.id
}

export default function HomePage() {
  useDocTitle('National Dex')
  const { data: index, error: indexError } = useAsync(getIndex, [])
  const { data: meta } = useAsync(getMeta, [])
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)

  const [q, setQ] = useSearchParamText('q')
  const debouncedQ = useDebounced(q)
  const selTypes = useMemo(() => (params.get('type') ?? '').split(',').filter(Boolean), [params])
  const selGens = useMemo(
    () => (params.get('gen') ?? '').split(',').filter(Boolean).map(Number),
    [params]
  )
  const selFlags = useMemo(() => (params.get('flag') ?? '').split(',').filter(Boolean), [params])
  const sort = params.get('sort') ?? 'id'
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

  const filtered = useMemo(() => {
    if (!index) return null
    const query = debouncedQ.trim().toLowerCase().replace(/^#/, '')
    let rows = index.filter(s => {
      if (selTypes.length && !selTypes.every(t => s.types.includes(t))) return false
      if (selGens.length && !selGens.includes(s.gen)) return false
      if (selFlags.includes('legendary') && !s.legendary) return false
      if (selFlags.includes('mythical') && !s.mythical) return false
      if (selFlags.includes('baby') && !s.baby) return false
      if (selFlags.includes('forms') && s.forms === 0) return false
      return true
    })
    if (query) {
      if (/^\d+$/.test(query)) {
        const exact = Number(query)
        rows = rows.filter(s => String(s.id).startsWith(query) || s.id === exact)
      } else {
        rows = rows
          .map(s => ({ s, score: Math.max(fuzzyScore(s.dname, query), fuzzyScore(s.name, query)) }))
          .filter(x => x.score > 25)
          .sort((a, b) => b.score - a.score)
          .map(x => x.s)
      }
    }
    if (!query || sort !== 'id') {
      rows = [...rows].sort((a, b) => {
        const va = sortValue(a, sort)
        const vb = sortValue(b, sort)
        const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)
        return cmp * dir || a.id - b.id
      })
    }
    return rows
  }, [index, debouncedQ, selTypes, selGens, selFlags, sort, dir])

  const surprise = () => {
    const pool = filtered?.length ? filtered : index
    if (!pool?.length) return
    navigate(`/pokemon/${pool[Math.floor(Math.random() * pool.length)].id}`)
  }

  if (indexError) {
    return (
      <div className="container page-pad">
        <EmptyState title="Couldn’t load the dex" hint={indexError.message}>
          <button type="button" className="btn" onClick={() => location.reload()} style={{ marginTop: 12 }}>
            Retry
          </button>
        </EmptyState>
      </div>
    )
  }

  if (!index) return <Loader />

  return (
    <div className="container page-pad">
      <div className="dex-console">
        <div className="eyebrow">
          National Dex · {index.length} species · Generations I–{GEN_ROMAN[meta?.gens.length ?? 9]}
        </div>
        <h1>Pokédex</h1>
        <div className="dex-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            ref={searchRef}
            className="dex-search-input"
            placeholder="Search by name or number…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search Pokémon"
          />
          {q && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQ('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="filter-row" role="group" aria-label="Filter by type">
          {Object.keys(TYPE_COLORS).map(t => {
            const on = selTypes.includes(t)
            return (
              <button
                key={t}
                type="button"
                className={`chip type-chip${on ? ' on' : ''}`}
                style={on ? { background: typeColor(t), borderColor: typeColor(t), color: typeInk(t) } : undefined}
                aria-pressed={on}
                onClick={() => toggleCsv('type', selTypes, t)}
              >
                {t}
              </button>
            )
          })}
        </div>

        <div className="filter-row" role="group" aria-label="Filter by generation">
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
          <span className="filter-sep" aria-hidden="true" />
          {FLAGS.map(f => {
            const on = selFlags.includes(f.id)
            return (
              <button
                key={f.id}
                type="button"
                className={`chip${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => toggleCsv('flag', selFlags, f.id)}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="dex-toolbar">
          <span className="mono dim readout" aria-live="polite">
            {filtered?.length ?? 0} found
          </span>
          <div className="toolbar-controls">
            <label className="visually-hidden" htmlFor="sort">Sort by</label>
            <select id="sort" className="select" value={sort} onChange={e => update('sort', e.target.value === 'id' ? '' : e.target.value)}>
              {SORTS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn"
              onClick={() => update('dir', dir === 1 ? 'desc' : '')}
              aria-label={dir === 1 ? 'Sort ascending, switch to descending' : 'Sort descending, switch to ascending'}
            >
              {dir === 1 ? '↑' : '↓'}
            </button>
            <button type="button" className="btn" onClick={surprise}>
              Surprise me
            </button>
          </div>
        </div>
      </div>

      {filtered && filtered.length > 0 ? (
        <div className="dex-grid">
          {filtered.map((s, i) => (
            <PokeCard key={s.id} s={s} eager={i < 12} />
          ))}
        </div>
      ) : (
        <EmptyState title="No Pokémon match" hint="Loosen a filter or clear the search to widen the field.">
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
