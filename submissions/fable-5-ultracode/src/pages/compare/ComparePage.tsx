import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { artUrl, getAbilities, getIndex, getTypes, spriteUrl } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import { dexNo, heightStr, weightStr, titleCase, STAT_LABELS } from '../../lib/format'
import { typeColor } from '../../lib/typeColors'
import { defenseProfile, weaknessBuckets, type WeaknessBuckets } from '../../lib/typechart'
import { useTeam } from '../../lib/store'
import type { AbilityIndex, SpeciesIndex } from '../../lib/types'
import Sprite from '../../components/Sprite'
import TypeBadge from '../../components/TypeBadge'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import AddBar from './AddBar'
import './compare.css'

const MAX = 6
const QUICK_IDS = [25, 6, 150, 448, 445, 94]
const BUCKET_ROWS: { key: keyof WeaknessBuckets; label: string }[] = [
  { key: 'x4', label: '×4' },
  { key: 'x2', label: '×2' },
  { key: 'half', label: '×½' },
  { key: 'quarter', label: '×¼' },
  { key: 'immune', label: '×0' }
]

interface DefenseInfo {
  weak: number
  resist: number
  immune: number
  buckets: WeaknessBuckets
}

function StatCells({ selected, get }: { selected: SpeciesIndex[]; get: (s: SpeciesIndex) => number }) {
  const values = selected.map(get)
  const best = Math.max(...values)
  return (
    <>
      {selected.map((s, i) => {
        const v = values[i]
        const isBest = selected.length > 1 && v === best
        return (
          <td key={s.id} className="cmp-cell">
            <div className={`cmp-val${isBest ? ' cmp-best' : ''}`}>
              <span className="num">{v}</span>
              {isBest && (
                <span className="cmp-best-mark" role="img" aria-label="best">
                  ▲
                </span>
              )}
            </div>
            <div className="cmp-track" aria-hidden="true">
              <div
                className="cmp-fill"
                style={{ width: `${best > 0 ? (v / best) * 100 : 0}%`, background: typeColor(s.types[0]) }}
              />
            </div>
          </td>
        )
      })}
    </>
  )
}

export default function ComparePage() {
  const [params, setParams] = useSearchParams()
  const { data, error } = useAsync(() => Promise.all([getIndex(), getTypes(), getAbilities()]), [])
  const { team } = useTeam()
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | undefined>(undefined)

  const index = data?.[0] ?? null
  const typesData = data?.[1] ?? null

  const byId = useMemo(() => new Map((index ?? []).map(s => [s.id, s])), [index])

  const ids = useMemo(() => {
    const seen = new Set<number>()
    const out: number[] = []
    for (const part of (params.get('ids') ?? '').split(',')) {
      const n = Number(part)
      if (Number.isInteger(n) && n > 0 && !seen.has(n) && (!index || byId.has(n))) {
        seen.add(n)
        out.push(n)
      }
      if (out.length === MAX) break
    }
    return out
  }, [params, index, byId])

  const abilityByName = useMemo(() => {
    const m = new Map<string, AbilityIndex>()
    for (const a of data?.[2] ?? []) m.set(a.name, a)
    return m
  }, [data])

  const selected = useMemo(
    () => ids.map(id => byId.get(id)).filter((s): s is SpeciesIndex => s !== undefined),
    [ids, byId]
  )
  const validIds = useMemo(() => selected.map(s => s.id), [selected])
  const full = selected.length >= MAX

  const defense = useMemo(() => {
    const m = new Map<number, DefenseInfo>()
    if (!typesData) return m
    for (const s of selected) {
      const b = weaknessBuckets(defenseProfile(s.types, typesData))
      m.set(s.id, {
        weak: b.x4.length + b.x2.length,
        resist: b.half.length + b.quarter.length,
        immune: b.immune.length,
        buckets: b
      })
    }
    return m
  }, [typesData, selected])

  useDocTitle(selected.length ? `Compare · ${selected.map(s => s.dname).join(' vs ')}` : 'Compare Pokémon')

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const setIds = (next: number[]) => {
    setParams(
      prev => {
        const p = new URLSearchParams(prev)
        if (next.length) p.set('ids', next.join(','))
        else p.delete('ids')
        return p
      },
      { replace: true }
    )
  }

  const addId = (id: number) => {
    if (full || validIds.includes(id) || !byId.has(id)) return
    setIds([...validIds, id])
  }

  const removeId = (id: number) => setIds(validIds.filter(x => x !== id))

  const teamAddable = useMemo(
    () => team.filter(id => byId.has(id) && !validIds.includes(id)),
    [team, byId, validIds]
  )

  const addTeam = () => {
    const merged = [...validIds]
    for (const id of teamAddable) {
      if (merged.length >= MAX) break
      merged.push(id)
    }
    if (merged.length > validIds.length) setIds(merged)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  if (error) return <EmptyState title="Data link failure" hint={error.message} />
  if (!index) return <Loader />

  const quickPicks = QUICK_IDS.flatMap(id => {
    const s = byId.get(id)
    return s ? [s] : []
  })

  return (
    <div className="container page-pad">
      <header className="cmp-head">
        <div className="eyebrow">Field analysis · up to {MAX} units</div>
        <h1>Compare</h1>
      </header>

      <div className="cmp-toolbar">
        <AddBar index={index} selectedIds={validIds} full={full} onAdd={addId} />
        <button
          type="button"
          className="btn"
          onClick={addTeam}
          disabled={teamAddable.length === 0 || full}
        >
          Add my team
        </button>
        <button type="button" className="btn cmp-copy" onClick={copyLink}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <span role="status" className="visually-hidden">
          {copied ? 'Comparison link copied to clipboard' : ''}
        </span>
        <span className="cmp-slots mono dim" aria-live="polite">
          {selected.length}/{MAX} slots
        </span>
      </div>

      {selected.length === 0 ? (
        <EmptyState
          title="Nothing on the bench yet"
          hint="Line up to six Pokémon side by side — stats aligned, the best value in each row flagged, defenses tallied. The lineup lives in the URL, so copy the link to share it."
        >
          <div className="cmp-quick" role="group" aria-label="Quick add well-known Pokémon">
            {quickPicks.map(s => (
              <button key={s.id} type="button" className="chip cmp-quick-chip" onClick={() => addId(s.id)}>
                <img src={spriteUrl(s.id)} alt="" width={26} height={26} loading="lazy" decoding="async" />
                {s.dname}
                <span className="mono cq-no">{dexNo(s.id)}</span>
              </button>
            ))}
          </div>
        </EmptyState>
      ) : (
        <div className="card cmp-board">
          <div className="cmp-scroll" role="region" aria-label="Comparison table" tabIndex={0}>
            <table className="data-table cmp-table">
              <caption className="visually-hidden">
                Side-by-side comparison of {selected.map(s => s.dname).join(', ')}
              </caption>
              <thead>
                <tr>
                  <th className="cmp-sticky" scope="col">
                    <span className="visually-hidden">Metric</span>
                  </th>
                  {selected.map(s => (
                    <th
                      key={s.id}
                      scope="col"
                      className="cmp-colhead"
                      style={{ '--cmp-accent': typeColor(s.types[0]) } as React.CSSProperties}
                    >
                      <div className="cmp-col">
                        <button
                          type="button"
                          className="cmp-remove"
                          onClick={() => removeId(s.id)}
                          aria-label={`Remove ${s.dname} from comparison`}
                        >
                          ✕
                        </button>
                        <Sprite src={artUrl(s.id)} alt={`${s.dname} official artwork`} size={104} className="cmp-art" eager />
                        <span className="cmp-no mono">{dexNo(s.id)}</span>
                        <Link to={`/pokemon/${s.id}`} className="cmp-name">
                          {s.dname}
                        </Link>
                        <div className="cmp-types">
                          {s.types.map(t => (
                            <TypeBadge key={t} type={t} size="sm" />
                          ))}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STAT_LABELS.map((label, i) => (
                  <tr key={label}>
                    <th scope="row" className="cmp-sticky">
                      {label}
                    </th>
                    <StatCells selected={selected} get={s => s.stats[i]} />
                  </tr>
                ))}
                <tr className="cmp-row-break cmp-row-bst">
                  <th scope="row" className="cmp-sticky">
                    BST
                  </th>
                  <StatCells selected={selected} get={s => s.bst} />
                </tr>
                <tr className="cmp-row-break">
                  <th scope="row" className="cmp-sticky">
                    Height
                  </th>
                  {selected.map(s => (
                    <td key={s.id} className="cmp-cell cmp-text">
                      {heightStr(s.height)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="cmp-sticky">
                    Weight
                  </th>
                  {selected.map(s => (
                    <td key={s.id} className="cmp-cell cmp-text">
                      {weightStr(s.weight)}
                    </td>
                  ))}
                </tr>
                <tr className="cmp-row-break">
                  <th scope="row" className="cmp-sticky">
                    Abilities
                  </th>
                  {selected.map(s => (
                    <td key={s.id} className="cmp-cell">
                      <ul className="cmp-abilities">
                        {s.abilities.map(a => {
                          const ab = abilityByName.get(a.n)
                          return (
                            <li key={a.n}>
                              {ab ? <Link to={`/abilities/${ab.id}`}>{ab.dname}</Link> : titleCase(a.n)}
                              {a.h && <span className="cmp-hidden-tag">hidden</span>}
                            </li>
                          )
                        })}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr className="cmp-row-break">
                  <th scope="row" className="cmp-sticky">
                    Defenses
                  </th>
                  {selected.map(s => {
                    const info = defense.get(s.id)
                    if (!info) return <td key={s.id} className="cmp-cell" />
                    return (
                      <td key={s.id} className="cmp-cell">
                        <div className="cmp-def mono">
                          <span>
                            <b>{info.weak}</b> weak
                          </span>
                          <span>
                            <b>{info.resist}</b> resist
                          </span>
                          <span>
                            <b>{info.immune}</b> immune
                          </span>
                        </div>
                        <details className="cmp-def-detail">
                          <summary>Breakdown</summary>
                          {BUCKET_ROWS.filter(b => info.buckets[b.key].length > 0).map(b => (
                            <div className="cmp-bucket" key={b.key}>
                              <span className="cmp-bucket-label mono">{b.label}</span>
                              <div className="cmp-bucket-types">
                                {info.buckets[b.key].map(t => (
                                  <TypeBadge key={t} type={t} size="sm" />
                                ))}
                              </div>
                            </div>
                          ))}
                        </details>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
