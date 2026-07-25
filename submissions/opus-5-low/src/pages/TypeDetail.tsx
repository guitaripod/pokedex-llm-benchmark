import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Empty, Loading, Panel, PokemonCard, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getMoves, getTypes } from '../lib/data'
import { useAsync, useInfinite } from '../lib/hooks'
import { title } from '../lib/util'

export default function TypeDetail() {
  const { id = '' } = useParams()
  const { data: types } = useAsync(getTypes, [])
  const { data: index } = useAsync(getIndex, [])
  const { data: moves } = useAsync(getMoves, [])
  const [tab, setTab] = useState<'pokemon' | 'moves'>('pokemon')

  const t = useMemo(() => types?.find((x) => x.name === id || String(x.id) === id), [types, id])
  const pokemon = useMemo(() => (index ?? []).filter((e) => e.isDefault && e.types.includes(id)), [index, id])
  const typeMoves = useMemo(() => (moves ?? []).filter((m) => m.type === id).sort((a, b) => (b.power ?? 0) - (a.power ?? 0)), [moves, id])
  const { count, sentinel } = useInfinite(pokemon.length, 60)

  if (!types || !index || !moves) return <Loading />
  if (!t) return <div className="container"><Empty>Unknown type.</Empty></div>

  const rel: [string, string[]][] = [
    ['Super effective against', t.damage.double_to],
    ['Not very effective against', t.damage.half_to],
    ['No effect against', t.damage.no_to],
    ['Weak to', t.damage.double_from],
    ['Resists', t.damage.half_from],
    ['Immune to', t.damage.no_from],
  ]

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <section className="hero" style={{ ['--c1' as string]: `color-mix(in srgb, ${typeColor(t.name)} 32%, var(--panel))`, ['--c2' as string]: 'var(--panel)' }}>
        <div style={{ padding: 26, display: 'grid', gap: 10 }}>
          <h1 className="hero-name" style={{ textTransform: 'capitalize' }}>{t.label} type</h1>
          <div className="faint small">Introduced in generation {t.generation} · {pokemon.length} Pokémon · {typeMoves.length} moves</div>
        </div>
      </section>

      <div className="cols">
        {rel.map(([label, list]) => (
          <Panel key={label} title={label}>
            {list.length ? <div className="chips">{list.map((x) => <TypeBadge key={x} type={x} sm />)}</div> : <span className="faint small">Nothing</span>}
          </Panel>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'pokemon' ? ' on' : ''}`} onClick={() => setTab('pokemon')}>Pokémon ({pokemon.length})</button>
        <button className={`tab${tab === 'moves' ? ' on' : ''}`} onClick={() => setTab('moves')}>Moves ({typeMoves.length})</button>
      </div>

      {tab === 'pokemon' ? (
        <>
          <div className="grid">{pokemon.slice(0, count).map((p) => <PokemonCard key={p.id} p={p} />)}</div>
          <div ref={sentinel} style={{ height: 1 }} />
        </>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th className="plain">Move</th><th className="plain">Class</th><th className="plain" style={{ textAlign: 'right' }}>Power</th><th className="plain" style={{ textAlign: 'right' }}>Acc</th><th className="plain" style={{ textAlign: 'right' }}>PP</th><th className="plain">Effect</th></tr></thead>
            <tbody>
              {typeMoves.map((m) => (
                <tr key={m.id}>
                  <td><Link to={`/moves/${m.name}`} style={{ fontWeight: 600 }}>{m.label}</Link></td>
                  <td className="small faint">{title(m.damageClass)}</td>
                  <td className="num">{m.power ?? '—'}</td>
                  <td className="num">{m.accuracy ? `${m.accuracy}%` : '—'}</td>
                  <td className="num faint">{m.pp ?? '—'}</td>
                  <td className="small muted">{m.shortEffect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
