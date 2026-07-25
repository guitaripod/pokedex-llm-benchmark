import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loading, TypeBadge } from '../components/ui'
import { getIndex, getMeta } from '../lib/data'
import { useAsync, useInfinite } from '../lib/hooks'
import { padId, title } from '../lib/util'

export default function Dexes() {
  const { data: meta } = useAsync(getMeta, [])
  const { data: index } = useAsync(getIndex, [])
  const [dex, setDex] = useState('kanto')

  const current = useMemo(() => meta?.pokedexes.find((d) => d.name === dex), [meta, dex])
  const bySpecies = useMemo(() => new Map((index ?? []).filter((e) => e.isDefault).map((e) => [e.speciesId, e])), [index])
  const entries = useMemo(
    () => (current?.entries ?? []).map(([n, sid]) => ({ n, e: bySpecies.get(sid) })).filter((x) => x.e),
    [current, bySpecies],
  )
  const { count, sentinel } = useInfinite(entries.length, 80)

  if (!meta || !index) return <Loading />

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Regional Pokédexes</h1>
        <div className="faint small">{meta.pokedexes.length} dexes across every region and game.</div>
      </div>

      <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
        <div className="chips">
          {meta.pokedexes.map((d) => (
            <button key={d.id} className={`chip${dex === d.name ? ' on' : ''}`} onClick={() => setDex(d.name)}>
              {d.label} <span className="faint">({d.entries.length})</span>
            </button>
          ))}
        </div>
        {current?.description && <p className="muted small" style={{ margin: 0, lineHeight: 1.6 }}>{current.description}</p>}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead><tr><th className="plain">Dex #</th><th className="plain" /><th className="plain">Name</th><th className="plain">Types</th><th className="plain" style={{ textAlign: 'right' }}>National</th><th className="plain" style={{ textAlign: 'right' }}>BST</th></tr></thead>
          <tbody>
            {entries.slice(0, count).map(({ n, e }) => e && (
              <tr key={`${n}-${e.id}`}>
                <td className="num" style={{ fontWeight: 700 }}>{n}</td>
                <td style={{ width: 44 }}><img src={e.sprite ?? ''} width={40} height={40} alt="" loading="lazy" style={{ imageRendering: 'pixelated' }} /></td>
                <td><Link to={`/pokemon/${e.name}`} style={{ fontWeight: 600 }}>{e.label}</Link> <span className="faint small">{e.genus}</span></td>
                <td><div className="row" style={{ gap: 4 }}>{e.types.map((t) => <TypeBadge key={t} type={t} sm />)}</div></td>
                <td className="num faint">{padId(e.speciesId)}</td>
                <td className="num">{e.bst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div ref={sentinel} style={{ height: 1 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {meta.regions.map((r) => (
          <div key={r.id} className="card card-pad" style={{ display: 'grid', gap: 4 }}>
            <strong style={{ fontFamily: 'var(--font-display)' }}>{r.label}</strong>
            <span className="faint small">Generation {r.generation ?? '—'} · {r.locations} locations</span>
            <div className="chips" style={{ marginTop: 4 }}>
              {r.pokedexes.map((d) => <button key={d} className="chip" onClick={() => setDex(d)}>{title(d)}</button>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
