import { useId, useMemo, useRef, useState } from 'react'
import { spriteUrl } from '../../lib/api'
import { dexNo } from '../../lib/format'
import { useDebounced } from '../../lib/hooks'
import { rankSearch } from '../../lib/search'
import type { SpeciesIndex } from '../../lib/types'

interface Props {
  index: SpeciesIndex[]
  selectedIds: number[]
  full: boolean
  onAdd: (id: number) => void
}

const LIMIT = 8

export default function AddBar({ index, selectedIds, full, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const debounced = useDebounced(query)

  const pool = useMemo(() => index.filter(s => !selectedIds.includes(s.id)), [index, selectedIds])

  const suggestions = useMemo(() => {
    const q = debounced.trim()
    return q ? rankSearch(pool, q, LIMIT) : []
  }, [pool, debounced])

  const showList = open && !full && query.trim().length > 0 && suggestions.length > 0
  const activeIdx = Math.max(0, Math.min(active, suggestions.length - 1))

  const add = (id: number) => {
    onAdd(id)
    setQuery('')
    setOpen(false)
    setActive(0)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault()
      if (showList) setActive((activeIdx + 1) % suggestions.length)
      else setOpen(true)
    } else if (e.key === 'ArrowUp' && showList) {
      e.preventDefault()
      setActive((activeIdx - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (full || !query.trim()) return
      const pick = showList ? suggestions[activeIdx] : rankSearch(pool, query, 1)[0]
      if (pick) add(pick.id)
    } else if (e.key === 'Escape') {
      if (open) setOpen(false)
      else setQuery('')
    }
  }

  return (
    <div className="cmp-add">
      <div className="cmp-add-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.8-3.8" />
        </svg>
        <input
          ref={inputRef}
          className="cmp-add-input"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? `${listId}-${suggestions[activeIdx].id}` : undefined}
          aria-autocomplete="list"
          aria-label="Search Pokémon to add to the comparison"
          placeholder={full ? 'Bench full — remove one to add another' : 'Add Pokémon by name or number…'}
          value={query}
          readOnly={full}
          aria-disabled={full}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Pokémon suggestions"
          className="cmp-suggest"
          onMouseDown={e => e.preventDefault()}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${s.id}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActive(i)}
              onClick={() => add(s.id)}
            >
              <img src={spriteUrl(s.id)} alt="" width={30} height={30} loading="lazy" decoding="async" />
              <span className="cs-name">{s.dname}</span>
              <span className="cs-no">{dexNo(s.id)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
