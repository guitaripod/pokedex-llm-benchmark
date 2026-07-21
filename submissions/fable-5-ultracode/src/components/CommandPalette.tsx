import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAbilities, getIndex, getMoves, spriteUrl } from '../lib/api'
import type { AbilityIndex, MoveIndex, SpeciesIndex } from '../lib/types'
import { rankSearch } from '../lib/search'
import { dexNo, titleCase } from '../lib/format'
import Sprite from './Sprite'

const PAGES = [
  { label: 'Dex', to: '/' },
  { label: 'Type chart', to: '/types' },
  { label: 'Moves', to: '/moves' },
  { label: 'Abilities', to: '/abilities' },
  { label: 'Items', to: '/items' },
  { label: 'Team builder', to: '/team' },
  { label: 'Compare', to: '/compare' },
  { label: 'Quiz — Who’s that Pokémon?', to: '/quiz' },
  { label: 'Favorites', to: '/favorites' },
  { label: 'About', to: '/about' }
]

interface Entry {
  key: string
  group: string
  label: string
  sub: string
  to: string
  sprite?: string
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const [species, setSpecies] = useState<SpeciesIndex[] | null>(null)
  const [moves, setMoves] = useState<MoveIndex[] | null>(null)
  const [abilities, setAbilities] = useState<AbilityIndex[] | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)
  const navigate = useNavigate()

  const openPalette = useCallback(() => {
    prevFocus.current = document.activeElement as HTMLElement | null
    setOpen(true)
    setQuery('')
    setSel(0)
    getIndex().then(setSpecies).catch(() => setSpecies([]))
    getMoves().then(setMoves).catch(() => setMoves([]))
    getAbilities().then(setAbilities).catch(() => setAbilities([]))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !inField)) {
        e.preventDefault()
        openPalette()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-cmdk', openPalette)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-cmdk', openPalette)
    }
  }, [openPalette])

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim()
    const out: Entry[] = []
    if (species) {
      for (const s of rankSearch(species, q, q ? 8 : 6)) {
        out.push({
          key: `p${s.id}`,
          group: 'Pokémon',
          label: s.dname,
          sub: dexNo(s.id),
          to: `/pokemon/${s.id}`,
          sprite: spriteUrl(s.id)
        })
      }
    }
    const pages = q
      ? PAGES.filter(p => p.label.toLowerCase().includes(q.toLowerCase()))
      : PAGES.slice(0, 5)
    for (const p of pages) out.push({ key: p.to, group: 'Pages', label: p.label, sub: '', to: p.to })
    if (q && moves) {
      for (const m of rankSearch(moves, q, 5)) {
        out.push({
          key: `m${m.id}`,
          group: 'Moves',
          label: m.dname,
          sub: titleCase(m.type),
          to: `/moves/${m.id}`
        })
      }
    }
    if (q && abilities) {
      for (const a of rankSearch(abilities, q, 5)) {
        out.push({ key: `a${a.id}`, group: 'Abilities', label: a.dname, sub: 'Ability', to: `/abilities/${a.id}` })
      }
    }
    return out
  }, [query, species, moves, abilities])

  useEffect(() => setSel(0), [query])

  useEffect(() => {
    listRef.current?.querySelector('.cmdk-item.sel')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  if (!open) return null

  const close = () => {
    setOpen(false)
    prevFocus.current?.focus()
  }

  const go = (to: string) => {
    close()
    navigate(to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
    if (e.key === 'Tab') e.preventDefault()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel(s => Math.min(s + 1, entries.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel(s => Math.max(s - 1, 0))
    }
    if (e.key === 'Enter' && entries[sel]) go(entries[sel].to)
  }

  let lastGroup = ''

  return (
    <div className="cmdk-overlay" onClick={close}>
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Search everything"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          className="cmdk-input"
          placeholder="Search Pokémon, moves, abilities, pages…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-list"
          aria-activedescendant={entries[sel]?.key}
        />
        <div className="cmdk-list" id="cmdk-list" role="listbox" ref={listRef}>
          {entries.map((en, i) => {
            const header = en.group !== lastGroup ? en.group : null
            lastGroup = en.group
            return (
              <div key={en.key}>
                {header && <div className="cmdk-group-label">{header}</div>}
                <button
                  type="button"
                  id={en.key}
                  role="option"
                  tabIndex={-1}
                  aria-selected={i === sel}
                  className={`cmdk-item${i === sel ? ' sel' : ''}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(en.to)}
                >
                  {en.sprite && <Sprite src={en.sprite} alt="" size={32} pixelated />}
                  <span>{en.label}</span>
                  {en.sub && <span className="ci-sub">{en.sub}</span>}
                </button>
              </div>
            )
          })}
          {entries.length === 0 && <div className="cmdk-group-label">No results</div>}
        </div>
      </div>
    </div>
  )
}

export function openCommandPalette() {
  window.dispatchEvent(new Event('open-cmdk'))
}
