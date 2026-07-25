import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loading, PokemonCard, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getMeta } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { TYPE_ORDER, title } from '../lib/util'

const FEATURES: [string, string, string][] = [
  ['/pokedex', 'Pokédex', 'Every Pokémon and form, filterable by type, generation, egg group, shape, colour, habitat, ability and stats.'],
  ['/moves', 'Moves', 'All moves with power, accuracy, PP, priority, effects, stat changes and full learner lists.'],
  ['/abilities', 'Abilities', 'Every ability with full effect text, generation, and which Pokémon get it.'],
  ['/items', 'Items', 'Every item and berry with sprites, costs, effects and fling data.'],
  ['/types', 'Type chart', 'The complete 18×18 matchup matrix, plus per-type breakdowns.'],
  ['/team', 'Team builder', 'Build a six-slot team and see combined weaknesses, resistances and coverage gaps.'],
  ['/compare', 'Compare', 'Put up to six Pokémon side-by-side across every stat.'],
  ['/tools', 'Trainer tools', 'Damage calculator, catch-rate odds and experience curves.'],
  ['/guess', 'Who’s that Pokémon?', 'Silhouette guessing game across every generation.'],
]

export default function Home() {
  const { data: index } = useAsync(getIndex, [])
  const { data: meta } = useAsync(getMeta, [])

  const spotlight = useMemo(() => {
    if (!index) return []
    const pool = index.filter((e) => e.isDefault)
    const seed = Math.floor(Date.now() / 3_600_000)
    const out = []
    for (let i = 0; i < 12; i++) out.push(pool[(seed * 7919 + i * 104729) % pool.length])
    return out
  }, [index])

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of index ?? []) if (e.isDefault) for (const t of e.types) m.set(t, (m.get(t) ?? 0) + 1)
    return m
  }, [index])

  if (!index || !meta) return <Loading />

  const strongest = [...index].filter((e) => e.isDefault).sort((a, b) => b.bst - a.bst).slice(0, 6)

  return (
    <div className="container" style={{ display: 'grid', gap: 34 }}>
      <section style={{ padding: '40px 0 10px', display: 'grid', gap: 18, justifyItems: 'start' }}>
        <span className="badge gold">{meta.counts.pokemon.toLocaleString()} Pokémon · {meta.counts.moves} moves · {meta.counts.abilities} abilities · {meta.counts.items.toLocaleString()} items</span>
        <h1 style={{ fontSize: 'clamp(36px, 7vw, 68px)', lineHeight: 1.02, maxWidth: 900 }}>
          The complete Pokédex,<br />
          <span style={{ background: 'linear-gradient(90deg, var(--accent), #ff8a3d 40%, var(--accent-2))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            every generation.
          </span>
        </h1>
        <p className="muted" style={{ maxWidth: 640, fontSize: 16.5, lineHeight: 1.6, margin: 0 }}>
          A fast, offline-capable encyclopaedia built from the full PokéAPI dataset — stats, moves, abilities,
          items, evolutions, encounters, sprites across every game, plus team analysis tools.
        </p>
        <div className="row">
          <Link className="btn primary" to="/pokedex">Open the Pokédex</Link>
          <Link className="btn" to="/random">Surprise me</Link>
          <Link className="btn" to="/team">Build a team</Link>
        </div>
      </section>

      <section>
        <div className="panel-title">Spotlight — refreshes hourly</div>
        <div className="grid">
          {spotlight.map((p, i) => p && <PokemonCard key={`${p.id}-${i}`} p={p} />)}
        </div>
      </section>

      <section>
        <div className="panel-title">Explore</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {FEATURES.map(([to, name, desc]) => (
            <Link key={to} to={to} className="card card-pad" style={{ display: 'grid', gap: 6 }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{name}</strong>
              <span className="muted small" style={{ lineHeight: 1.55 }}>{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="cols">
        <div className="card card-pad">
          <div className="panel-title">Types by population</div>
          <div style={{ display: 'grid', gap: 7 }}>
            {TYPE_ORDER.map((t) => {
              const n = typeCounts.get(t) ?? 0
              const max = Math.max(...typeCounts.values())
              return (
                <Link key={t} to={`/types/${t}`} className="row" style={{ gap: 10 }}>
                  <span style={{ width: 78 }}><TypeBadge type={t} sm link={false} /></span>
                  <span className="stat-bar" style={{ flex: 1 }}>
                    <span className="stat-fill" style={{ width: `${(n / max) * 100}%`, background: typeColor(t) }} />
                  </span>
                  <span className="mono small faint" style={{ width: 34, textAlign: 'right' }}>{n}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="card card-pad">
          <div className="panel-title">Generations</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {meta.generations.map((g) => (
              <Link key={g.id} to={`/pokedex?gen=${g.id}`} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{g.label} <span className="faint small">· {title(g.region ?? '')}</span></span>
                <span className="mono faint small">{g.speciesCount} species</span>
              </Link>
            ))}
          </div>
          <div className="panel-title" style={{ marginTop: 20 }}>Highest base stat totals</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {strongest.map((p) => (
              <Link key={p.id} to={`/pokemon/${p.name}`} className="row" style={{ justifyContent: 'space-between' }}>
                <span className="row" style={{ gap: 8 }}>
                  <img src={p.sprite ?? ''} width={28} height={28} alt="" style={{ imageRendering: 'pixelated' }} />
                  {p.label}
                </span>
                <span className="mono small">{p.bst}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
