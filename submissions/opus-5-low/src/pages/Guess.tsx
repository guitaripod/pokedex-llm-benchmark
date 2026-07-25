import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading, TypeBadge } from '../components/ui'
import { getIndex } from '../lib/data'
import { useAsync, useLocalStorage } from '../lib/hooks'
import type { IndexEntry } from '../lib/types'
import { padId, title } from '../lib/util'

export default function Guess() {
  const { data: index } = useAsync(getIndex, [])
  const [gens, setGens] = useState<number[]>([])
  const [target, setTarget] = useState<IndexEntry | null>(null)
  const [options, setOptions] = useState<IndexEntry[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useLocalStorage('pdx.guess.score', { correct: 0, total: 0, streak: 0, best: 0 })

  const pool = useMemo(
    () => (index ?? []).filter((e) => e.isDefault && (!gens.length || gens.includes(e.generation))),
    [index, gens],
  )

  const nextRound = useCallback(() => {
    if (pool.length < 4) return
    const t = pool[Math.floor(Math.random() * pool.length)]
    const opts = new Set<IndexEntry>([t])
    while (opts.size < 4) opts.add(pool[Math.floor(Math.random() * pool.length)])
    setTarget(t)
    setOptions([...opts].sort(() => Math.random() - 0.5))
    setPicked(null)
  }, [pool])

  useEffect(() => { nextRound() }, [nextRound])

  if (!index) return <Loading />

  const answer = (e: IndexEntry) => {
    if (picked !== null || !target) return
    setPicked(e.id)
    const right = e.id === target.id
    setScore((s) => ({
      correct: s.correct + (right ? 1 : 0),
      total: s.total + 1,
      streak: right ? s.streak + 1 : 0,
      best: Math.max(s.best, right ? s.streak + 1 : 0),
    }))
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 20, maxWidth: 900 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Who’s that Pokémon?</h1>
          <div className="faint small">Guess from the silhouette. Every generation, every default form.</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge gold">Streak {score.streak}</span>
          <span className="badge">Best {score.best}</span>
          <span className="badge">{score.correct}/{score.total}{score.total ? ` · ${Math.round((score.correct / score.total) * 100)}%` : ''}</span>
        </div>
      </div>

      <div className="chips">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
          <button key={g} className={`chip${gens.includes(g) ? ' on' : ''}`} onClick={() => setGens((s) => s.includes(g) ? s.filter((x) => x !== g) : [...s, g])}>Gen {g}</button>
        ))}
        {gens.length > 0 && <button className="chip" onClick={() => setGens([])}>All</button>}
      </div>

      {target && (
        <div className="card card-pad" style={{ display: 'grid', gap: 20, justifyItems: 'center', padding: 30 }}>
          <img
            src={target.artwork ?? target.sprite ?? ''}
            alt="Who's that Pokémon?"
            style={{
              width: 260, height: 260, objectFit: 'contain',
              filter: picked === null ? 'brightness(0) drop-shadow(0 10px 20px #0008)' : 'none',
              transition: 'filter .4s',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, width: '100%' }}>
            {options.map((o) => {
              const state = picked === null ? '' : o.id === target.id ? 'correct' : o.id === picked ? 'wrong' : ''
              return (
                <button
                  key={o.id}
                  className="btn"
                  onClick={() => answer(o)}
                  style={{
                    justifyContent: 'center', height: 46,
                    background: state === 'correct' ? 'var(--good)' : state === 'wrong' ? 'var(--danger)' : undefined,
                    color: state ? '#08090c' : undefined,
                    fontWeight: state ? 700 : 500,
                  }}
                >{o.label}</button>
              )
            })}
          </div>
          {picked !== null && (
            <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="faint mono">{padId(target.id)}</span>
                <Link to={`/pokemon/${target.name}`} style={{ fontWeight: 700 }}>{target.label}</Link>
                {target.types.map((t) => <TypeBadge key={t} type={t} sm />)}
              </div>
              <span className="faint small">{title(target.genus ?? '')} · BST {target.bst}</span>
              <button className="btn primary" onClick={nextRound}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
