import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Picker from '../components/Picker'
import { Loading, Panel, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getTypes } from '../lib/data'
import { useAsync } from '../lib/hooks'
import type { IndexEntry } from '../lib/types'
import { STAT_LABELS, STAT_SHORT, TYPE_ORDER, buildChart, defenseProfile, effLabel, kilos, meters, padId } from '../lib/util'
import { useStore } from '../store'

const STAT_NAMES = Object.keys(STAT_LABELS)

export default function Compare() {
  const { data: index } = useAsync(getIndex, [])
  const { data: types } = useAsync(getTypes, [])
  const { compare, toggleCompare } = useStore()
  const [picking, setPicking] = useState(false)

  const chosen = useMemo(
    () => compare.map((id) => index?.find((e) => e.id === id)).filter(Boolean) as IndexEntry[],
    [compare, index],
  )

  if (!index || !types) return <Loading />
  const chart = buildChart(types)

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Compare</h1>
          <div className="faint small">Up to six Pokémon, side by side.</div>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setPicking(true)} disabled={chosen.length >= 6}>+ Add Pokémon</button>
          {chosen.length > 0 && <button className="btn" onClick={() => chosen.forEach((c) => toggleCompare(c.id))}>Clear</button>}
        </div>
      </div>

      {chosen.length === 0 && (
        <div className="card card-pad" style={{ textAlign: 'center', padding: 60 }}>
          <div className="faint">Nothing to compare yet — add Pokémon here or from any Pokémon page.</div>
        </div>
      )}

      {chosen.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chosen.length}, minmax(150px, 1fr))`, gap: 12, overflowX: 'auto' }}>
            {chosen.map((p) => (
              <div key={p.id} className="card card-pad" style={{ display: 'grid', gap: 6, justifyItems: 'center', textAlign: 'center' }}>
                <img src={p.artwork ?? p.sprite ?? ''} alt={p.label} style={{ width: '100%', maxWidth: 130, aspectRatio: 1, objectFit: 'contain' }} />
                <Link to={`/pokemon/${p.name}`} style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{p.label}</Link>
                <span className="faint mono small">{padId(p.id)}</span>
                <div className="row" style={{ gap: 4, justifyContent: 'center' }}>{p.types.map((t) => <TypeBadge key={t} type={t} sm />)}</div>
                <button className="btn sm" onClick={() => toggleCompare(p.id)}>Remove</button>
              </div>
            ))}
          </div>

          <Panel title="Stats">
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th className="plain">Stat</th>
                    {chosen.map((p) => <th key={p.id} className="plain" style={{ textAlign: 'right' }}>{p.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {STAT_NAMES.map((s, i) => {
                    const best = Math.max(...chosen.map((p) => p.stats[i]))
                    return (
                      <tr key={s}>
                        <td>{STAT_LABELS[s]}</td>
                        {chosen.map((p) => (
                          <td key={p.id} className="num" style={{ color: p.stats[i] === best ? 'var(--good)' : undefined, fontWeight: p.stats[i] === best ? 700 : 400 }}>
                            {p.stats[i]}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  <tr>
                    <td style={{ fontWeight: 700 }}>Total</td>
                    {chosen.map((p) => {
                      const best = Math.max(...chosen.map((x) => x.bst))
                      return <td key={p.id} className="num" style={{ fontWeight: 700, color: p.bst === best ? 'var(--good)' : undefined }}>{p.bst}</td>
                    })}
                  </tr>
                  <tr><td>Height</td>{chosen.map((p) => <td key={p.id} className="num faint">{meters(p.height)}</td>)}</tr>
                  <tr><td>Weight</td>{chosen.map((p) => <td key={p.id} className="num faint">{kilos(p.weight)}</td>)}</tr>
                  <tr><td>Catch rate</td>{chosen.map((p) => <td key={p.id} className="num faint">{p.captureRate}</td>)}</tr>
                  <tr><td>Base exp.</td>{chosen.map((p) => <td key={p.id} className="num faint">{p.baseExperience ?? '—'}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Stat shape">
            <div className="row" style={{ gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {chosen.map((p) => <Radar key={p.id} entry={p} />)}
            </div>
          </Panel>

          <Panel title="Defensive matchups">
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data">
                <thead>
                  <tr><th className="plain">Type</th>{chosen.map((p) => <th key={p.id} className="plain" style={{ textAlign: 'center' }}>{p.label}</th>)}</tr>
                </thead>
                <tbody>
                  {TYPE_ORDER.map((t) => (
                    <tr key={t}>
                      <td><TypeBadge type={t} sm /></td>
                      {chosen.map((p) => {
                        const m = defenseProfile(chart, p.types)[t]
                        return (
                          <td key={p.id} style={{ textAlign: 'center' }}>
                            <span className={`eff-cell eff-${m === 0.25 ? '25' : m === 0.5 ? '50' : String(m)}`} style={{ display: 'inline-grid', width: 46, height: 26 }}>{effLabel(m)}×</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {picking && <Picker onClose={() => setPicking(false)} onPick={(e) => toggleCompare(e.id)} />}
    </div>
  )
}

function Radar({ entry }: { entry: IndexEntry }) {
  const size = 190
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 26
  const pts = entry.stats.map((v, i) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const d = (Math.min(v, 200) / 200) * r
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]
  })
  const color = typeColor(entry.types[0])
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={Array.from({ length: 6 }, (_, i) => {
              const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
              return `${cx + Math.cos(a) * r * f},${cy + Math.sin(a) * r * f}`
            }).join(' ')}
            fill="none"
            stroke="var(--line-solid)"
            strokeWidth={1}
          />
        ))}
        <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={2} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
          return (
            <text key={i} x={cx + Math.cos(a) * (r + 15)} y={cy + Math.sin(a) * (r + 15)} fontSize={9} fill="var(--text-faint)" textAnchor="middle" dominantBaseline="middle">
              {STAT_SHORT[STAT_NAMES[i]]}
            </text>
          )
        })}
      </svg>
      <figcaption className="small faint">{entry.label}</figcaption>
    </figure>
  )
}
