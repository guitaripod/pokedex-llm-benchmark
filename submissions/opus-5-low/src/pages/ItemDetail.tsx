import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Empty, Loading, Panel } from '../components/ui'
import { getIndex, getItem, getItems } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { title } from '../lib/util'

export default function ItemDetail() {
  const { id = '' } = useParams()
  const { data: list } = useAsync(getItems, [])
  const resolved = useMemo(() => (/^\d+$/.test(id) ? Number(id) : list?.find((i) => i.name === id)?.id ?? null), [id, list])
  const { data: item, loading, error } = useAsync(() => (resolved ? getItem(resolved) : new Promise<never>(() => {})), [resolved])
  const { data: index } = useAsync(getIndex, [])

  if (error) return <div className="container"><Empty>Item not found.</Empty></div>
  if (loading || !item || !index) return <Loading />
  const byId = new Map(index.map((e) => [e.id, e]))

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div className="row" style={{ gap: 16 }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, width: 90, height: 90, display: 'grid', placeItems: 'center' }}>
          {item.sprite ? <img src={item.sprite} alt="" width={56} height={56} style={{ imageRendering: 'pixelated' }} /> : <span className="faint">?</span>}
        </div>
        <div>
          <div className="faint mono small">Item #{item.id} · {title(item.category)}</div>
          <h1 style={{ fontSize: 34, marginTop: 4 }}>{item.label}</h1>
          <div className="row" style={{ gap: 6, marginTop: 6 }}>
            {item.cost > 0 && <span className="badge gold">₽{item.cost.toLocaleString()}</span>}
            {item.attributes.map((a) => <span key={a} className="badge">{title(a)}</span>)}
          </div>
        </div>
      </div>

      <div className="cols">
        <Panel title="Effect">
          <p style={{ marginTop: 0, lineHeight: 1.65 }}>{item.effect ?? item.shortEffect ?? 'No effect data.'}</p>
          {item.flavor && <p className="muted small" style={{ fontStyle: 'italic' }}>“{item.flavor}”</p>}
        </Panel>
        <Panel title="Details">
          <div style={{ display: 'grid', gap: 8 }}>
            {([
              ['Category', title(item.category)],
              ['Cost', item.cost ? `₽${item.cost.toLocaleString()}` : 'Not sold'],
              ['Sell price', item.cost ? `₽${Math.floor(item.cost / 2).toLocaleString()}` : '—'],
              ['Fling power', item.flingPower ? String(item.flingPower) : '—'],
              ['Fling effect', item.flingEffect ? title(item.flingEffect) : '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                <span className="faint small">{k}</span><span className="small">{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {item.heldBy.length > 0 && (
        <Panel title={`Held in the wild by (${item.heldBy.length})`}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {item.heldBy.map((h) => {
              const e = byId.get(h.id)
              if (!e) return null
              return (
                <Link key={h.id} to={`/pokemon/${e.name}`} className="row" style={{ gap: 8, padding: 6 }}>
                  <img src={e.sprite ?? ''} width={40} height={40} alt="" loading="lazy" style={{ imageRendering: 'pixelated' }} />
                  <span className="small">{e.label}</span>
                </Link>
              )
            })}
          </div>
        </Panel>
      )}
    </div>
  )
}
