import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAbilities, getIndex, getItems, getMoves } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { padId, searchScore, title } from '../lib/util'
import { TypeBadge } from './ui'

type Row = { kind: string; label: string; sub?: string; to: string; id?: number; types?: string[]; art?: string | null }

const PAGES: Row[] = [
  { kind: 'page', label: 'Pokédex', to: '/pokedex' },
  { kind: 'page', label: 'Moves', to: '/moves' },
  { kind: 'page', label: 'Abilities', to: '/abilities' },
  { kind: 'page', label: 'Items', to: '/items' },
  { kind: 'page', label: 'Type Chart', to: '/types' },
  { kind: 'page', label: 'Team Builder', to: '/team' },
  { kind: 'page', label: 'Compare', to: '/compare' },
  { kind: 'page', label: 'Trainer Tools — damage, catch rate, EXP', to: '/tools' },
  { kind: 'page', label: 'Natures', to: '/natures' },
  { kind: 'page', label: 'Berries', to: '/berries' },
  { kind: 'page', label: 'Regional Dexes', to: '/dexes' },
  { kind: 'page', label: 'Who’s That Pokémon?', to: '/guess' },
  { kind: 'page', label: 'Random Pokémon', to: '/random' },
]

export default function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: index } = useAsync(getIndex, [])
  const { data: moves } = useAsync(getMoves, [])
  const { data: abilities } = useAsync(getAbilities, [])
  const { data: items } = useAsync(getItems, [])

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 20) } }, [open])

  const rows = useMemo<Row[]>(() => {
    const query = q.trim().toLowerCase()
    if (!query) return PAGES
    const out: Row[] = []
    for (const p of PAGES) if (p.label.toLowerCase().includes(query)) out.push(p)
    const pk = (index ?? [])
      .map((e) => ({ e, s: searchScore(e, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.e.id - b.e.id)
      .slice(0, 8)
      .map(({ e }) => ({ kind: 'Pokémon', label: e.label, sub: padId(e.id), to: `/pokemon/${e.name}`, types: e.types, art: e.sprite }))
    out.push(...pk)
    const mv = (moves ?? []).filter((m) => m.label.toLowerCase().includes(query)).slice(0, 5)
      .map((m) => ({ kind: 'Move', label: m.label, sub: title(m.type), to: `/moves/${m.name}` }))
    const ab = (abilities ?? []).filter((a) => a.label.toLowerCase().includes(query)).slice(0, 5)
      .map((a) => ({ kind: 'Ability', label: a.label, to: `/abilities/${a.name}` }))
    const it = (items ?? []).filter((i) => i.label.toLowerCase().includes(query)).slice(0, 5)
      .map((i) => ({ kind: 'Item', label: i.label, to: `/items/${i.name}`, art: i.sprite }))
    return [...out, ...mv, ...ab, ...it].slice(0, 30)
  }, [q, index, moves, abilities, items])

  useEffect(() => { setSel(0) }, [q])

  if (!open) return null

  const go = (r?: Row) => { if (r) { nav(r.to); onClose() } }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={q}
          placeholder="Search Pokémon, moves, abilities, items…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(rows.length - 1, s + 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
            if (e.key === 'Enter') go(rows[sel])
            if (e.key === 'Escape') onClose()
          }}
        />
        <div className="palette-list">
          {rows.length === 0 && <div className="faint" style={{ padding: 20, textAlign: 'center' }}>No results</div>}
          {rows.map((r, i) => (
            <div
              key={r.to + r.label}
              className={`palette-item${i === sel ? ' on' : ''}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(r)}
            >
              {r.art ? <img src={r.art} alt="" /> : <span className="badge" style={{ width: 34, justifyContent: 'center' }}>{r.kind[0].toUpperCase()}</span>}
              <span style={{ fontWeight: 500 }}>{r.label}</span>
              {r.types?.map((t) => <TypeBadge key={t} type={t} sm link={false} />)}
              <span className="spacer" />
              <span className="faint small mono">{r.sub ?? r.kind}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
