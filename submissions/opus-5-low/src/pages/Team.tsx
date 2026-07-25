import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Picker from '../components/Picker'
import { Loading, Panel, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getTypes } from '../lib/data'
import { useAsync } from '../lib/hooks'
import type { IndexEntry } from '../lib/types'
import { STAT_LABELS, TYPE_ORDER, buildChart, defenseProfile, effLabel, offenseProfile, padId } from '../lib/util'
import { useStore } from '../store'

export default function Team() {
  const { data: index } = useAsync(getIndex, [])
  const { data: types } = useAsync(getTypes, [])
  const { team, setTeam } = useStore()
  const [slot, setSlot] = useState<number | null>(null)

  const members = useMemo(
    () => team.map((id) => (id ? index?.find((e) => e.id === id) ?? null : null)),
    [team, index],
  )

  if (!index || !types) return <Loading />
  const chart = buildChart(types)
  const filled = members.filter(Boolean) as IndexEntry[]

  const defence = TYPE_ORDER.map((t) => {
    let weak = 0
    let resist = 0
    let immune = 0
    for (const m of filled) {
      const mult = defenseProfile(chart, m.types)[t]
      if (mult > 1) weak++
      else if (mult === 0) immune++
      else if (mult < 1) resist++
    }
    return { type: t, weak, resist, immune }
  })

  const coverage = filled.length ? offenseProfile(chart, [...new Set(filled.flatMap((m) => m.types))]) : null
  const avg = filled.length
    ? Object.keys(STAT_LABELS).map((_, i) => Math.round(filled.reduce((a, m) => a + m.stats[i], 0) / filled.length))
    : null

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Team builder</h1>
          <div className="faint small">Six slots. Weakness, resistance and coverage analysis updates live.</div>
        </div>
        {filled.length > 0 && <button className="btn" onClick={() => setTeam([null, null, null, null, null, null])}>Clear team</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {members.map((m, i) => (
          <div key={i} className={`team-slot${m ? ' filled' : ''}`} onClick={() => setSlot(i)}>
            {m ? (
              <div style={{ display: 'grid', justifyItems: 'center', gap: 4, width: '100%' }}>
                <img src={m.artwork ?? m.sprite ?? ''} alt={m.label} style={{ width: '100%', maxWidth: 110, aspectRatio: 1, objectFit: 'contain' }} />
                <Link to={`/pokemon/${m.name}`} style={{ fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>{m.label}</Link>
                <span className="faint mono small">{padId(m.id)} · BST {m.bst}</span>
                <div className="row" style={{ gap: 4 }}>{m.types.map((t) => <TypeBadge key={t} type={t} sm link={false} />)}</div>
                <button className="btn sm" onClick={(e) => { e.stopPropagation(); setTeam((t) => { const n = [...t]; n[i] = null; return n }) }}>Remove</button>
              </div>
            ) : (
              <span>＋ Slot {i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {filled.length > 0 && (
        <div className="cols">
          <Panel title="Defensive coverage">
            <div style={{ display: 'grid', gap: 6 }}>
              {defence.map((d) => (
                <div key={d.type} className="row" style={{ gap: 10 }}>
                  <span style={{ width: 80 }}><TypeBadge type={d.type} sm /></span>
                  <div className="row" style={{ gap: 3, flex: 1 }}>
                    {Array.from({ length: d.weak }, (_, i) => <span key={`w${i}`} style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)' }} />)}
                    {Array.from({ length: d.resist }, (_, i) => <span key={`r${i}`} style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--good)' }} />)}
                    {Array.from({ length: d.immune }, (_, i) => <span key={`i${i}`} style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-2)' }} />)}
                  </div>
                  <span className="mono small" style={{ color: d.weak > d.resist + d.immune ? 'var(--danger)' : 'var(--text-faint)' }}>
                    {d.weak}w / {d.resist + d.immune}r
                  </span>
                </div>
              ))}
            </div>
            <div className="faint small" style={{ marginTop: 12 }}>
              Red = a team member is weak, green = resists, blue = immune.
            </div>
          </Panel>

          <Panel title="Offensive coverage (STAB types)">
            {coverage && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
                {Object.entries(coverage).map(([t, m]) => (
                  <div key={t} style={{ display: 'grid', gap: 4 }}>
                    <TypeBadge type={t} sm />
                    <div className={`eff-cell eff-${m === 0.5 ? '50' : String(m)}`}>{effLabel(m)}×</div>
                  </div>
                ))}
              </div>
            )}
            <div className="faint small" style={{ marginTop: 12 }}>
              Best multiplier any team member's STAB type achieves. 1× or less means you rely on coverage moves.
            </div>
          </Panel>

          <Panel title="Team averages">
            {avg && (
              <div style={{ display: 'grid', gap: 7 }}>
                {Object.keys(STAT_LABELS).map((k, i) => (
                  <div key={k} className="stat-row">
                    <span className="stat-label">{STAT_LABELS[k]}</span>
                    <span className="stat-val">{avg[i]}</span>
                    <span className="stat-bar"><span className="stat-fill" style={{ width: `${(avg[i] / 200) * 100}%`, background: 'linear-gradient(90deg,var(--accent),#ff8a3d)' }} /></span>
                  </div>
                ))}
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="faint small">Average BST</span>
                  <span className="mono">{Math.round(filled.reduce((a, m) => a + m.bst, 0) / filled.length)}</span>
                </div>
              </div>
            )}
            <div className="panel-title" style={{ marginTop: 18 }}>Type spread</div>
            <div className="chips">
              {[...new Set(filled.flatMap((m) => m.types))].map((t) => (
                <span key={t} className="chip type-on" style={{ ['--tc' as string]: typeColor(t) }}>{t}</span>
              ))}
            </div>
          </Panel>

          <Panel title="Biggest threats">
            <div style={{ display: 'grid', gap: 8 }}>
              {defence
                .filter((d) => d.weak >= 2)
                .sort((a, b) => b.weak - a.weak)
                .map((d) => (
                  <div key={d.type} className="row" style={{ justifyContent: 'space-between' }}>
                    <TypeBadge type={d.type} sm />
                    <span className="small" style={{ color: 'var(--danger)' }}>{d.weak} members weak</span>
                  </div>
                ))}
              {defence.filter((d) => d.weak >= 2).length === 0 && <span className="faint small">No shared weaknesses — solid team.</span>}
            </div>
            <div className="panel-title" style={{ marginTop: 18 }}>Uncovered types</div>
            <div className="chips">
              {coverage && Object.entries(coverage).filter(([, m]) => m <= 1).map(([t]) => <TypeBadge key={t} type={t} sm />)}
              {coverage && Object.entries(coverage).every(([, m]) => m > 1) && <span className="faint small">Everything is hit for super effective damage.</span>}
            </div>
          </Panel>
        </div>
      )}

      {slot !== null && (
        <Picker
          onClose={() => setSlot(null)}
          onPick={(e) => setTeam((t) => { const n = [...t]; n[slot] = e.id; return n })}
        />
      )}
    </div>
  )
}
