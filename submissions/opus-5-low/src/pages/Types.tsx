import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading, Panel, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getTypes } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { TYPE_ORDER, buildChart, defenseProfile, effLabel } from '../lib/util'

export default function Types() {
  const { data: types } = useAsync(getTypes, [])
  const { data: index } = useAsync(getIndex, [])
  const [dual, setDual] = useState<string[]>([])

  const chart = useMemo(() => (types ? buildChart(types) : null), [types])
  if (!types || !chart || !index) return <Loading />

  const dualProfile = dual.length ? defenseProfile(chart, dual) : null

  return (
    <div className="container" style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Type chart</h1>
        <div className="faint small">Rows attack, columns defend. Hover a cell for the matchup.</div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 14 }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--panel)' }}>
                <span className="faint small">ATK ╲ DEF</span>
              </th>
              {TYPE_ORDER.map((t) => (
                <th key={t} style={{ width: 40 }}>
                  <Link to={`/types/${t}`}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.08em', color: typeColor(t), fontWeight: 700, height: 74 }}>{t}</div>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPE_ORDER.map((atk) => (
              <tr key={atk}>
                <td style={{ position: 'sticky', left: 0, background: 'var(--panel)', paddingRight: 8 }}>
                  <TypeBadge type={atk} sm />
                </td>
                {TYPE_ORDER.map((d) => {
                  const m = chart[atk]?.[d] ?? 1
                  return (
                    <td key={d} title={`${atk} → ${d}: ${m}×`}>
                      <div className={`eff-cell eff-${m === 0.5 ? '50' : String(m)}`} style={{ height: 30, fontSize: 11 }}>
                        {m === 1 ? '' : effLabel(m)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel title="Dual-type defence calculator">
        <div className="chips" style={{ marginBottom: 14 }}>
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              className={`chip${dual.includes(t) ? ' type-on' : ''}`}
              style={{ ['--tc' as string]: typeColor(t) }}
              onClick={() => setDual((d) => d.includes(t) ? d.filter((x) => x !== t) : d.length >= 2 ? [d[1], t] : [...d, t])}
            >{t}</button>
          ))}
        </div>
        {dualProfile ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
            {Object.entries(dualProfile).map(([t, m]) => (
              <div key={t} style={{ display: 'grid', gap: 4 }}>
                <TypeBadge type={t} sm />
                <div className={`eff-cell eff-${m === 0.25 ? '25' : m === 0.5 ? '50' : String(m)}`}>{effLabel(m)}×</div>
              </div>
            ))}
          </div>
        ) : <div className="faint small">Pick one or two types.</div>}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {types.filter((t) => TYPE_ORDER.includes(t.name)).map((t) => (
          <Link key={t.id} to={`/types/${t.name}`} className="card card-pad" style={{ display: 'grid', gap: 8 }}>
            <TypeBadge type={t.name} link={false} />
            <span className="faint small">{index.filter((e) => e.isDefault && e.types.includes(t.name)).length} Pokémon · {t.moveCount} moves</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
