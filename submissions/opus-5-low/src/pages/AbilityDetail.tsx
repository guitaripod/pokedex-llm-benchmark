import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Empty, Loading, Panel, TypeBadge } from '../components/ui'
import { getAbilities, getAbility, getIndex } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { title } from '../lib/util'

export default function AbilityDetail() {
  const { id = '' } = useParams()
  const { data: list } = useAsync(getAbilities, [])
  const resolved = useMemo(() => (/^\d+$/.test(id) ? Number(id) : list?.find((a) => a.name === id)?.id ?? null), [id, list])
  const { data: a, loading, error } = useAsync(() => (resolved ? getAbility(resolved) : new Promise<never>(() => {})), [resolved])
  const { data: index } = useAsync(getIndex, [])

  if (error) return <div className="container"><Empty>Ability not found.</Empty></div>
  if (loading || !a || !index) return <Loading />

  const byId = new Map(index.map((e) => [e.id, e]))
  const normal = a.pokemon.filter((p) => !p.hidden)
  const hidden = a.pokemon.filter((p) => p.hidden)

  const list_ = (rows: typeof a.pokemon) => (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
      {rows.map((p) => {
        const e = byId.get(p.id)
        if (!e) return null
        return (
          <Link key={p.id} to={`/pokemon/${e.name}`} className="row" style={{ gap: 8, padding: 6, borderRadius: 10 }}>
            <img src={e.sprite ?? ''} width={40} height={40} alt="" loading="lazy" style={{ imageRendering: 'pixelated' }} />
            <span style={{ display: 'grid' }}>
              <span className="small">{e.label}</span>
              <span className="row" style={{ gap: 3 }}>{e.types.map((t) => <TypeBadge key={t} type={t} sm link={false} />)}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div>
        <div className="faint mono small">Ability #{a.id} · Generation {a.generation}</div>
        <h1 style={{ fontSize: 38, marginTop: 4 }}>{a.label}</h1>
      </div>
      <div className="cols">
        <Panel title="Effect">
          <p style={{ marginTop: 0, lineHeight: 1.65 }}>{a.effect ?? a.shortEffect}</p>
          {a.flavor && <p className="muted small" style={{ fontStyle: 'italic' }}>“{a.flavor}”</p>}
        </Panel>
        {a.changes.length > 0 && (
          <Panel title="Past effects">
            {a.changes.map((c) => (
              <div key={c.versionGroup} style={{ marginBottom: 10 }}>
                <div className="badge">{title(c.versionGroup)}</div>
                <p className="small muted" style={{ lineHeight: 1.6 }}>{c.effect}</p>
              </div>
            ))}
          </Panel>
        )}
      </div>
      <Panel title={`Pokémon with this ability (${normal.length})`}>{list_(normal)}</Panel>
      {hidden.length > 0 && <Panel title={`As a hidden ability (${hidden.length})`}>{list_(hidden)}</Panel>}
    </div>
  )
}
