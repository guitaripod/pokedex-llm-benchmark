import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getIndex } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import { favoritesStore, useFavorites } from '../../lib/store'
import type { SpeciesIndex } from '../../lib/types'
import PokeCard from '../../components/PokeCard'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import './favorites.css'

const SORTS = [
  { id: 'added', label: 'Added order' },
  { id: 'id', label: 'Dex number' },
  { id: 'name', label: 'Name' },
  { id: 'bst', label: 'Base stat total' }
] as const

type SortId = (typeof SORTS)[number]['id']

function sortRows(rows: SpeciesIndex[], sort: SortId): SpeciesIndex[] {
  if (sort === 'added') return rows
  const sorted = [...rows]
  if (sort === 'name') sorted.sort((a, b) => a.dname.localeCompare(b.dname) || a.id - b.id)
  else if (sort === 'bst') sorted.sort((a, b) => b.bst - a.bst || a.id - b.id)
  else sorted.sort((a, b) => a.id - b.id)
  return sorted
}

export default function FavoritesPage() {
  useDocTitle('Favorites')
  const { data: index, error } = useAsync(getIndex, [])
  const { favs } = useFavorites()
  const [sort, setSort] = useState<SortId>('added')
  const [armed, setArmed] = useState(false)
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (disarmTimer.current) clearTimeout(disarmTimer.current)
    }
  }, [])

  const rows = useMemo(() => {
    if (!index) return null
    const byId = new Map(index.map(s => [s.id, s]))
    const joined = favs.flatMap(id => {
      const s = byId.get(id)
      return s ? [s] : []
    })
    return sortRows(joined, sort)
  }, [index, favs, sort])

  const onClear = () => {
    if (!armed) {
      setArmed(true)
      disarmTimer.current = setTimeout(() => setArmed(false), 3000)
      return
    }
    if (disarmTimer.current) clearTimeout(disarmTimer.current)
    setArmed(false)
    favoritesStore.set([])
  }

  if (error)
    return (
      <EmptyState
        title="Field log unavailable"
        hint="The species index failed to load. Try reloading the page."
      />
    )
  if (!index || !rows) return <Loader />

  const compareIds = rows.slice(0, 6).map(s => s.id)

  return (
    <div className="container page-pad">
      <div className="fav-head">
        <div className="eyebrow">Field log · saved specimens</div>
        <h1>Favorites</h1>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="fav-toolbar">
            <span className="mono dim fav-readout" aria-live="polite">
              {rows.length} saved
            </span>
            <div className="fav-controls">
              <label className="visually-hidden" htmlFor="fav-sort">
                Sort favorites by
              </label>
              <select
                id="fav-sort"
                className="select"
                value={sort}
                onChange={e => setSort(e.target.value as SortId)}
              >
                {SORTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Link
                className="btn"
                to={`/compare?ids=${compareIds.join(',')}`}
                title={rows.length > 6 ? 'Compares the first 6 in the current order' : undefined}
              >
                Add all to compare
              </Link>
              <button
                type="button"
                className={`btn${armed ? ' fav-danger' : ''}`}
                onClick={onClear}
                aria-label={armed ? 'Confirm clearing all favorites' : 'Clear all favorites'}
              >
                {armed ? 'Really clear?' : 'Clear all'}
              </button>
            </div>
          </div>

          <div className="fav-grid">
            {rows.map((s, i) => (
              <PokeCard key={s.id} s={s} eager={i < 12} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No favorites logged"
          hint="Tap the ☆ on any card or species page to save it here for quick recall."
        >
          <Link className="btn" to="/" style={{ marginTop: 8 }}>
            Browse the dex
          </Link>
        </EmptyState>
      )}
    </div>
  )
}
