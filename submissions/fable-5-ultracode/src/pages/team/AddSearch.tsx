import { useId, useMemo, useState } from 'react'
import type { SpeciesIndex } from '../../lib/types'
import { rankSearch } from '../../lib/search'
import { spriteUrl } from '../../lib/api'
import { dexNo } from '../../lib/format'
import { useDebounced } from '../../lib/hooks'
import Sprite from '../../components/Sprite'

interface Props {
  index: SpeciesIndex[]
  exclude: number[]
  onPick: (id: number) => void
  label: string
  placeholder?: string
}

export default function AddSearch({ index, exclude, onPick, label, placeholder = 'Name or number…' }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const debounced = useDebounced(q, 120)
  const listId = useId()

  const results = useMemo(() => {
    const query = debounced.trim()
    if (!query) return []
    const pool = index.filter(s => !exclude.includes(s.id))
    return rankSearch(pool, query, 8)
  }, [index, exclude, debounced])

  const showing = open && results.length > 0
  const noMatch = open && q.trim() !== '' && debounced.trim() !== '' && results.length === 0
  const sel = Math.min(active, Math.max(results.length - 1, 0))

  const pick = (id: number) => {
    onPick(id)
    setQ('')
    setOpen(false)
    setActive(0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!showing) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(Math.min(sel + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(Math.max(sel - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[sel].id)
    }
  }

  return (
    <div className="tb-add">
      <input
        className="input tb-add-input"
        type="text"
        role="combobox"
        aria-expanded={showing}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showing ? `${listId}-${sel}` : undefined}
        aria-label={label}
        placeholder={placeholder}
        value={q}
        onChange={e => {
          setQ(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showing && (
        <ul className="tb-add-list" id={listId} role="listbox" aria-label={label}>
          {results.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === sel}
              className={`tb-add-opt${i === sel ? ' sel' : ''}`}
              onMouseDown={e => {
                e.preventDefault()
                pick(s.id)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <Sprite src={spriteUrl(s.id)} alt="" size={30} pixelated />
              <span className="tb-add-name">{s.dname}</span>
              <span className="mono tb-add-no">{dexNo(s.id)}</span>
            </li>
          ))}
        </ul>
      )}
      {noMatch && <div className="tb-add-list tb-add-none mono dim">No match</div>}
    </div>
  )
}
