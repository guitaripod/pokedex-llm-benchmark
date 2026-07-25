import { useMemo, useState } from 'react'
import { getIndex } from '../lib/data'
import { useAsync, useDebounced } from '../lib/hooks'
import type { IndexEntry } from '../lib/types'
import { padId, searchScore } from '../lib/util'
import { TypeBadge } from './ui'

export default function Picker({ onPick, onClose }: { onPick: (e: IndexEntry) => void; onClose: () => void }) {
  const { data: index } = useAsync(getIndex, [])
  const [q, setQ] = useState('')
  const query = useDebounced(q, 120)

  const rows = useMemo(() => {
    const lower = query.trim().toLowerCase()
    const pool = (index ?? []).filter((e) => e.isDefault)
    if (!lower) return pool.slice(0, 60)
    return pool.map((e) => ({ e, s: searchScore(e, lower) })).filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.e.id - b.e.id).slice(0, 60).map((x) => x.e)
  }, [index, query])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input autoFocus placeholder="Choose a Pokémon…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} />
        <div className="palette-list">
          {rows.map((e) => (
            <div key={e.id} className="palette-item" onClick={() => { onPick(e); onClose() }}>
              <img src={e.sprite ?? ''} alt="" />
              <span style={{ fontWeight: 500 }}>{e.label}</span>
              {e.types.map((t) => <TypeBadge key={t} type={t} sm link={false} />)}
              <span className="spacer" />
              <span className="faint mono small">{padId(e.id)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
