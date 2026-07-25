import { Loading, Panel } from '../components/ui'
import { getMeta } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { STAT_LABELS, title } from '../lib/util'

export default function Natures() {
  const { data: meta } = useAsync(getMeta, [])
  if (!meta) return <Loading />

  const stats = ['attack', 'defense', 'special-attack', 'special-defense', 'speed']
  const grid = new Map<string, string>()
  for (const n of meta.natures) grid.set(`${n.increased ?? 'none'}|${n.decreased ?? 'none'}`, n.label)

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Natures</h1>
        <div className="faint small">Each nature raises one stat by 10% and lowers another by 10%.</div>
      </div>

      <Panel title="Nature matrix">
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="data">
            <thead>
              <tr>
                <th className="plain">+ / −</th>
                {stats.map((s) => <th key={s} className="plain">↓ {STAT_LABELS[s]}</th>)}
              </tr>
            </thead>
            <tbody>
              {stats.map((up) => (
                <tr key={up}>
                  <td style={{ fontWeight: 600 }}>↑ {STAT_LABELS[up]}</td>
                  {stats.map((down) => {
                    const name = up === down ? meta.natures.find((n) => !n.increased)?.label : grid.get(`${up}|${down}`)
                    return (
                      <td key={down} className={up === down ? 'faint' : ''}>
                        {up === down ? <span className="faint small">neutral</span> : (name ?? '—')}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {meta.natures.map((n) => (
          <div key={n.id} className="card card-pad" style={{ display: 'grid', gap: 6 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{n.label}</strong>
            {n.increased ? (
              <>
                <span className="small" style={{ color: 'var(--good)' }}>+10% {STAT_LABELS[n.increased]}</span>
                <span className="small" style={{ color: 'var(--danger)' }}>−10% {STAT_LABELS[n.decreased ?? '']}</span>
              </>
            ) : <span className="faint small">No stat change</span>}
            {n.likes && <span className="faint small">Likes {title(n.likes)} · dislikes {title(n.hates ?? '')}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
