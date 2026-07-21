import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getIndex, getTypes, spriteUrl } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import {
  defenseProfile, multLabel, offenseProfile, weaknessBuckets, type WeaknessBuckets
} from '../../lib/typechart'
import { titleCase } from '../../lib/format'
import TypeBadge from '../../components/TypeBadge'
import Section from '../../components/Section'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import Sprite from '../../components/Sprite'
import './typechart.css'

const DEF_BUCKETS: {
  key: keyof WeaknessBuckets
  mult: string
  desc: string
  tone: 'bad' | 'good' | 'imm'
}[] = [
  { key: 'x4', mult: '×4', desc: 'Takes ×4 from', tone: 'bad' },
  { key: 'x2', mult: '×2', desc: 'Takes ×2 from', tone: 'bad' },
  { key: 'half', mult: '×½', desc: 'Takes ×½ from', tone: 'good' },
  { key: 'quarter', mult: '×¼', desc: 'Takes ×¼ from', tone: 'good' },
  { key: 'immune', mult: '×0', desc: 'Immune to', tone: 'imm' }
]

const mClass = (m: number) =>
  m === 2 ? 'tc-mx2' : m === 0.5 ? 'tc-mx05' : m === 0 ? 'tc-mx0' : 'tc-mx1'

const cellText = (m: number) => (m === 2 ? '×2' : m === 1 ? '·' : multLabel(m))

interface MatchRowProps {
  mult: string
  tone: 'bad' | 'good' | 'imm'
  desc: string
  list: string[]
  focus: string | null
  onPick: (t: string) => void
}

function MatchRow({ mult, tone, desc, list, focus, onPick }: MatchRowProps) {
  return (
    <div className="tc-mrow">
      <div className="tc-mrow-label">
        <span className={`tc-mult tc-mult-${tone}`}>{mult}</span>
        <span className="tc-mrow-desc">{desc}</span>
      </div>
      <div className="tc-badges">
        {list.length > 0 ? (
          list.map(t => (
            <button
              key={t}
              type="button"
              className="tc-typebtn"
              aria-pressed={focus === t}
              title={`Focus ${titleCase(t)}`}
              onClick={() => onPick(t)}
            >
              <TypeBadge type={t} size="sm" />
            </button>
          ))
        ) : (
          <span className="dim tc-dash">—</span>
        )}
      </div>
    </div>
  )
}

export default function TypeChartPage() {
  const { data: types, error } = useAsync(getTypes, [])
  const { data: index } = useAsync(getIndex, [])
  const [params, setParams] = useSearchParams()
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)
  const [gridPos, setGridPos] = useState({ r: 0, c: 0 })
  const tbodyRef = useRef<HTMLTableSectionElement>(null)

  const order = useMemo(() => types?.order ?? [], [types])
  const typeParam = params.get('type')
  const focus = typeParam && order.includes(typeParam) ? typeParam : null

  const defTypes = useMemo(() => {
    const picked: string[] = []
    for (const t of (params.get('def') ?? '').split(',')) {
      if (order.includes(t) && !picked.includes(t) && picked.length < 2) picked.push(t)
    }
    return picked
  }, [params, order])

  useDocTitle(focus ? `${titleCase(focus)} Type Matchups` : 'Type Chart')

  const dn = (t: string) => types?.dnames[t] ?? titleCase(t)

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

  const toggleFocus = (t: string) => update('type', focus === t ? '' : t)

  const setDef = (t1: string, t2: string) =>
    update('def', t1 ? (t2 && t2 !== t1 ? `${t1},${t2}` : t1) : '')

  const focusData = useMemo(() => {
    if (!types || !focus) return null
    const off = offenseProfile(focus, types)
    const def = defenseProfile([focus], types)
    const pick = (p: Record<string, number>, m: number) => types.order.filter(t => p[t] === m)
    return {
      strong: pick(off, 2),
      resisted: pick(off, 0.5),
      noEffect: pick(off, 0),
      weakTo: pick(def, 2),
      resists: pick(def, 0.5),
      immuneTo: pick(def, 0)
    }
  }, [types, focus])

  const calc = useMemo(() => {
    if (!types || defTypes.length === 0) return null
    const profile = defenseProfile(defTypes, types)
    return {
      buckets: weaknessBuckets(profile),
      neutral: types.order.filter(t => profile[t] === 1).length
    }
  }, [types, defTypes])

  const matches = useMemo(() => {
    if (!index || defTypes.length === 0) return null
    if (defTypes.length === 2) {
      return index.filter(s => s.types.length === 2 && defTypes.every(t => s.types.includes(t)))
    }
    return index.filter(s => s.types.includes(defTypes[0]))
  }, [index, defTypes])

  const cellFromEvent = (e: React.SyntheticEvent): HTMLTableCellElement | null => {
    const el = e.target as HTMLElement
    return el.closest('td[data-r]')
  }

  const onGridOver = (e: React.SyntheticEvent) => {
    const td = cellFromEvent(e)
    if (!td) return
    setHover({ r: Number(td.dataset.r), c: Number(td.dataset.c) })
  }

  const onGridFocus = (e: React.FocusEvent) => {
    const td = cellFromEvent(e)
    if (!td) return
    const pos = { r: Number(td.dataset.r), c: Number(td.dataset.c) }
    setHover(pos)
    setGridPos(pos)
  }

  const onGridKey = (e: React.KeyboardEvent) => {
    const td = cellFromEvent(e)
    if (!td) return
    const r = Number(td.dataset.r)
    const c = Number(td.dataset.c)
    const last = order.length - 1
    let nr = r
    let nc = c
    if (e.key === 'ArrowUp') nr = Math.max(0, r - 1)
    else if (e.key === 'ArrowDown') nr = Math.min(last, r + 1)
    else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1)
    else if (e.key === 'ArrowRight') nc = Math.min(last, c + 1)
    else if (e.key === 'Home') nc = 0
    else if (e.key === 'End') nc = last
    else return
    e.preventDefault()
    setGridPos({ r: nr, c: nc })
    tbodyRef.current
      ?.querySelector<HTMLTableCellElement>(`td[data-r="${nr}"][data-c="${nc}"]`)
      ?.focus()
  }

  if (error) {
    return (
      <div className="container page-pad">
        <EmptyState title="Type data unavailable" hint={error.message} />
      </div>
    )
  }
  if (!types) return <Loader />

  const t1 = defTypes[0] ?? ''
  const t2 = defTypes[1] ?? ''

  return (
    <div className="container page-pad tc-page">
      <div className="eyebrow">
        Combat matrix · {order.length} types · {order.length * order.length} matchups
      </div>
      <h1>Type Chart</h1>
      <p className="dim tc-sub">
        Damage multipliers for every attacking and defending type. Click any badge to focus a
        type, or feed a typing into the defense calculator below.
      </p>

      <div className="tc-legend" aria-label="Multiplier legend">
        <span className="tc-lg">
          <span className="tc-key tc-mx2">×2</span> super effective
        </span>
        <span className="tc-lg">
          <span className="tc-key tc-mx05">½</span> not very effective
        </span>
        <span className="tc-lg">
          <span className="tc-key tc-mx0">0</span> no effect
        </span>
        <span className="tc-lg">
          <span className="tc-key tc-mx1">·</span> neutral ×1
        </span>
      </div>

      {focus && focusData && (
        <div className="card tc-focus" role="region" aria-label={`${dn(focus)} matchup profile`}>
          <div className="tc-focus-head">
            <TypeBadge type={focus} />
            <h2 className="tc-focus-title">{dn(focus)} matchups</h2>
            <div className="tc-focus-actions">
              <button type="button" className="btn btn-sm" onClick={() => setDef(focus, '')}>
                Run in defense calc
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => update('type', '')}
                aria-label="Close focus panel"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="tc-focus-grid">
            <div>
              <div className="eyebrow tc-side-label">Offense — attacking with {dn(focus)}</div>
              <MatchRow mult="×2" tone="good" desc="Deals ×2 to" list={focusData.strong} focus={focus} onPick={toggleFocus} />
              <MatchRow mult="×½" tone="bad" desc="Resisted by" list={focusData.resisted} focus={focus} onPick={toggleFocus} />
              <MatchRow mult="×0" tone="imm" desc="No effect on" list={focusData.noEffect} focus={focus} onPick={toggleFocus} />
            </div>
            <div>
              <div className="eyebrow tc-side-label">Defense — taking hits as {dn(focus)}</div>
              <MatchRow mult="×2" tone="bad" desc="Takes ×2 from" list={focusData.weakTo} focus={focus} onPick={toggleFocus} />
              <MatchRow mult="×½" tone="good" desc="Takes ×½ from" list={focusData.resists} focus={focus} onPick={toggleFocus} />
              <MatchRow mult="×0" tone="imm" desc="Immune to" list={focusData.immuneTo} focus={focus} onPick={toggleFocus} />
            </div>
          </div>
        </div>
      )}

      <Section
        eyebrow="Damage matrix"
        title="Attack → Defense"
        aside={<span className="mono dim tc-aside">rows attack · cols defend</span>}
      >
        <div className="tc-scroll" role="region" aria-label="Type effectiveness matrix">
          <table className="tc-table">
            <caption className="visually-hidden">
              Type effectiveness matrix. Rows are attacking types, columns are defending types.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="tc-corner">
                  <span className="tc-corner-lab">def →</span>
                  <span className="tc-corner-lab">atk ↓</span>
                </th>
                {order.map((t, c) => (
                  <th
                    key={t}
                    scope="col"
                    className={`tc-colhead${hover?.c === c ? ' tc-on' : ''}`}
                  >
                    <button
                      type="button"
                      className="tc-typebtn"
                      aria-pressed={focus === t}
                      aria-label={`Focus ${dn(t)} type`}
                      onClick={() => toggleFocus(t)}
                    >
                      <TypeBadge type={t} size="sm" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              ref={tbodyRef}
              onMouseOver={onGridOver}
              onMouseLeave={() => setHover(null)}
              onFocus={onGridFocus}
              onBlur={() => setHover(null)}
              onKeyDown={onGridKey}
            >
              {order.map((atk, r) => (
                <tr key={atk}>
                  <th
                    scope="row"
                    className={`tc-rowhead${hover?.r === r ? ' tc-on' : ''}`}
                  >
                    <button
                      type="button"
                      className="tc-typebtn"
                      aria-pressed={focus === atk}
                      aria-label={`Focus ${dn(atk)} type`}
                      onClick={() => toggleFocus(atk)}
                    >
                      <TypeBadge type={atk} size="sm" />
                    </button>
                  </th>
                  {order.map((def, c) => {
                    const m = types.matrix[r][c]
                    const on = hover !== null && (hover.r === r || hover.c === c)
                    return (
                      <td
                        key={def}
                        data-r={r}
                        data-c={c}
                        tabIndex={gridPos.r === r && gridPos.c === c ? 0 : -1}
                        className={`tc-cell ${mClass(m)}${on ? ' tc-on' : ''}`}
                        title={`${dn(atk)} → ${dn(def)}: ×${multLabel(m)}`}
                        aria-label={`${dn(atk)} attacking ${dn(def)}: times ${multLabel(m)}`}
                      >
                        {cellText(m)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        eyebrow="Defense calculator"
        title="Dual-type damage profile"
        aside={
          defTypes.length > 0 ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => update('def', '')}>
              Reset
            </button>
          ) : undefined
        }
      >
        <div className="card tc-calc">
          <div className="tc-calc-controls">
            <div className="tc-field">
              <label className="eyebrow" htmlFor="tc-def1">
                Type 1
              </label>
              <select
                id="tc-def1"
                className="select"
                value={t1}
                onChange={e => setDef(e.target.value, t2)}
              >
                <option value="">Select type…</option>
                {order.map(t => (
                  <option key={t} value={t}>
                    {dn(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="tc-field">
              <label className="eyebrow" htmlFor="tc-def2">
                Type 2
              </label>
              <select
                id="tc-def2"
                className="select"
                value={t2}
                onChange={e => setDef(t1, e.target.value)}
                disabled={!t1}
              >
                <option value="">—</option>
                {order
                  .filter(t => t !== t1)
                  .map(t => (
                    <option key={t} value={t}>
                      {dn(t)}
                    </option>
                  ))}
              </select>
            </div>
            {defTypes.length > 0 && (
              <div className="tc-def-badges">
                {defTypes.map(t => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            )}
          </div>

          {calc ? (
            <div className="tc-buckets">
              {DEF_BUCKETS.filter(b => calc.buckets[b.key].length > 0).map(b => (
                <MatchRow
                  key={b.key}
                  mult={b.mult}
                  tone={b.tone}
                  desc={b.desc}
                  list={calc.buckets[b.key]}
                  focus={focus}
                  onPick={toggleFocus}
                />
              ))}
              <div className="mono dim tc-neutral">
                ×1 neutral from {calc.neutral} of {order.length} types
              </div>
            </div>
          ) : (
            <p className="dim tc-hint">
              Pick a defending type to chart its incoming damage profile.
            </p>
          )}

          {matches && (
            <div className="tc-matches">
              <div className="mono dim tc-match-count" aria-live="polite">
                {defTypes.length === 2
                  ? `${matches.length} Pokémon with exactly this typing`
                  : `${matches.length} Pokémon carrying ${dn(t1)}`}
              </div>
              {matches.length > 0 ? (
                <>
                  <div className="tc-mons">
                    {matches.slice(0, 12).map(s => (
                      <Link key={s.id} to={`/pokemon/${s.id}`} className="tc-mon" title={s.dname}>
                        <Sprite src={spriteUrl(s.id)} alt={s.dname} size={56} pixelated />
                      </Link>
                    ))}
                  </div>
                  {matches.length > 12 && (
                    <Link className="mono tc-more" to={`/?type=${defTypes.join(',')}`}>
                      View all {matches.length} in the dex →
                    </Link>
                  )}
                </>
              ) : (
                <p className="dim tc-hint">No Pokémon has this exact typing yet.</p>
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
