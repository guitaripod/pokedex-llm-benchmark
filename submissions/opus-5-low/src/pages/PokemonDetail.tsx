import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EffGrid, Empty, Loading, Panel, StatBars, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getMeta, getMoves, getPokemon, getTypes } from '../lib/data'
import { useAsync } from '../lib/hooks'
import type { EvoNode, Pokemon } from '../lib/types'
import {
  STAT_LABELS, buildChart, defenseProfile, feet, genderText, kilos, meters, padId, pounds, statAtLevel, title,
} from '../lib/util'
import { useStore } from '../store'

const TABS = ['Overview', 'Stats', 'Moves', 'Evolution', 'Locations', 'Sprites', 'Entries'] as const
type Tab = (typeof TABS)[number]

export default function PokemonDetail() {
  const { id = '1' } = useParams()
  const { data: index } = useAsync(getIndex, [])
  const numeric = /^\d+$/.test(id)
  const resolvedId = useMemo(() => {
    if (numeric) return Number(id)
    return index?.find((e) => e.name === id)?.id ?? null
  }, [id, index, numeric])

  const { data: p, loading, error } = useAsync(
    () => (resolvedId ? getPokemon(resolvedId) : new Promise<never>(() => {})),
    [resolvedId],
  )
  const { data: types } = useAsync(getTypes, [])
  const { data: meta } = useAsync(getMeta, [])
  const { data: allMoves } = useAsync(getMoves, [])
  const { favorites, toggleFavorite, toggleCompare, compare, setTeam } = useStore()
  const [tab, setTab] = useState<Tab>('Overview')
  const [shiny, setShiny] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  if (error) return <div className="container"><Empty>Pokémon not found.</Empty></div>
  if (loading || !p || !types || !index || !meta) return <Loading label="Loading Pokémon" />

  const chart = buildChart(types)
  const def = defenseProfile(chart, p.types)
  const c1 = typeColor(p.types[0])
  const c2 = typeColor(p.types[1] ?? p.types[0])
  const art = (shiny ? p.sprites.artworkShiny ?? p.sprites.homeShiny : p.sprites.artwork ?? p.sprites.home) ?? p.sprites.front
  const isFav = favorites.includes(p.id)
  const rank = index.filter((e) => e.isDefault).sort((a, b) => b.bst - a.bst).findIndex((e) => e.id === p.id) + 1
  const prev = index.find((e) => e.isDefault && e.id === p.id - 1)
  const next = index.find((e) => e.isDefault && e.id === p.id + 1)

  const playCry = () => {
    const src = p.cries?.latest ?? p.cries?.legacy
    if (!src) return
    if (!audioRef.current) audioRef.current = new Audio(src)
    audioRef.current.src = src
    audioRef.current.volume = 0.5
    void audioRef.current.play()
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div className="row">
        {prev && <Link className="btn sm" to={`/pokemon/${prev.name}`}>← {prev.label}</Link>}
        <span className="spacer" />
        {next && <Link className="btn sm" to={`/pokemon/${next.name}`}>{next.label} →</Link>}
      </div>

      <section
        className="hero"
        style={{
          ['--c1' as string]: `color-mix(in srgb, ${c1} 34%, var(--panel))`,
          ['--c2' as string]: `color-mix(in srgb, ${c2} 14%, var(--panel))`,
        }}
      >
        <div className="hero-grid">
          <div className="hero-art">
            <div className="hero-ring" />
            <img src={art ?? ''} alt={p.label} />
          </div>
          <div style={{ display: 'grid', alignContent: 'center', gap: 14 }}>
            <div>
              <div className="hero-num">{padId(p.speciesId)} · {meta.generations.find((g) => g.id === p.generation)?.label ?? ''}</div>
              <h1 className="hero-name">{p.label}</h1>
              <div className="hero-genus">{p.genus}</div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {p.types.map((t) => <TypeBadge key={t} type={t} />)}
              {p.species.isLegendary && <span className="badge gold">Legendary</span>}
              {p.species.isMythical && <span className="badge violet">Mythical</span>}
              {p.species.isBaby && <span className="badge">Baby</span>}
              {!p.isDefault && <span className="badge">Alternate form</span>}
            </div>

            <div className="stat-grid">
              <div className="kv"><div className="kv-k">Height</div><div className="kv-v">{meters(p.height)}</div><div className="faint small">{feet(p.height)}</div></div>
              <div className="kv"><div className="kv-k">Weight</div><div className="kv-v">{kilos(p.weight)}</div><div className="faint small">{pounds(p.weight)}</div></div>
              <div className="kv"><div className="kv-k">Base stat total</div><div className="kv-v">{p.bst}</div><div className="faint small">#{rank} overall</div></div>
              <div className="kv"><div className="kv-k">Catch rate</div><div className="kv-v">{p.species.captureRate}</div><div className="faint small">{((p.species.captureRate / 255) * 100).toFixed(1)}% base</div></div>
            </div>

            <div className="row" style={{ gap: 8 }}>
              <button className="btn sm" onClick={() => setShiny((s) => !s)}>{shiny ? '✦ Shiny on' : '✧ Shiny off'}</button>
              {(p.cries?.latest || p.cries?.legacy) && <button className="btn sm" onClick={playCry}>♪ Play cry</button>}
              <button className="btn sm" onClick={() => toggleFavorite(p.id)}>{isFav ? '★ Favorited' : '☆ Favorite'}</button>
              <button className="btn sm" onClick={() => toggleCompare(p.id)}>{compare.includes(p.id) ? '✓ In compare' : '+ Compare'}</button>
              <button
                className="btn sm"
                onClick={() => setTeam((t) => {
                  const i = t.indexOf(null)
                  if (i === -1) return t
                  const n = [...t]; n[i] = p.id; return n
                })}
              >+ Add to team</button>
            </div>
          </div>
        </div>
      </section>

      {p.varieties.length > 1 && (
        <div className="row" style={{ gap: 6 }}>
          <span className="filter-label">Forms</span>
          {p.varieties.map((v) => (
            <Link key={v.id} to={`/pokemon/${v.name}`} className={`chip${v.id === p.id ? ' on' : ''}`}>{v.label}</Link>
          ))}
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && <Overview p={p} def={def} />}
      {tab === 'Stats' && <StatsTab p={p} index={index} />}
      {tab === 'Moves' && <MovesTab p={p} allMoves={allMoves ?? []} meta={meta} />}
      {tab === 'Evolution' && <EvolutionTab p={p} />}
      {tab === 'Locations' && <LocationsTab p={p} />}
      {tab === 'Sprites' && <SpritesTab p={p} />}
      {tab === 'Entries' && <EntriesTab p={p} />}
    </div>
  )
}

function Overview({ p, def }: { p: Pokemon; def: Record<string, number> }) {
  const eggCycles = p.species.hatchCounter ?? 0
  return (
    <div className="cols">
      <Panel title="Base stats">
        <StatBars stats={p.stats} />
        <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
          <span className="faint small">Total</span>
          <span className="mono" style={{ fontWeight: 700 }}>{p.bst}</span>
        </div>
      </Panel>

      <Panel title="Type defences">
        <EffGrid profile={def} compact />
        <div style={{ marginTop: 14 }}><EffGrid profile={def} /></div>
      </Panel>

      <Panel title="Abilities">
        <div style={{ display: 'grid', gap: 10 }}>
          {p.abilities.map((a) => (
            <Link key={a.name} to={`/abilities/${a.name}`} className="card card-pad" style={{ boxShadow: 'none', background: 'var(--panel-2)' }}>
              <div className="row">
                <strong>{title(a.name)}</strong>
                {a.hidden && <span className="badge violet">Hidden</span>}
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Breeding">
        <Rows rows={[
          ['Egg groups', p.species.eggGroups.map(title).join(', ') || '—'],
          ['Gender ratio', genderText(p.species.genderRate)],
          ['Egg cycles', eggCycles ? `${eggCycles} (~${(eggCycles + 1) * 255} steps)` : '—'],
          ['Base happiness', String(p.species.baseHappiness ?? '—')],
          ['Growth rate', title(p.species.growthRate ?? '—')],
          ['Gender differences', p.species.hasGenderDifferences ? 'Yes' : 'No'],
        ]} />
      </Panel>

      <Panel title="Training">
        <Rows rows={[
          ['Base experience', String(p.baseExperience ?? '—')],
          ['EV yield', Object.entries(p.evYield).map(([k, v]) => `${v} ${STAT_LABELS[k]}`).join(', ') || '—'],
          ['Catch rate', `${p.species.captureRate} / 255`],
          ['Colour', title(p.species.color ?? '—')],
          ['Shape', title(p.species.shape ?? '—')],
          ['Habitat', title(p.species.habitat ?? '—')],
        ]} />
      </Panel>

      {p.heldItems.length > 0 && (
        <Panel title="Held items">
          <div style={{ display: 'grid', gap: 8 }}>
            {p.heldItems.map((h) => (
              <div key={h.name} className="row" style={{ justifyContent: 'space-between' }}>
                <Link to={`/items/${h.name}`}>{title(h.name)}</Link>
                <span className="faint small mono">{Math.max(...h.versions.map((v) => v.rarity))}%</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {p.pastTypes.length > 0 && (
        <Panel title="Past types">
          {p.pastTypes.map((pt) => (
            <div key={pt.generation} className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="faint small">Up to {title(pt.generation)}</span>
              <div className="row" style={{ gap: 4 }}>{pt.types.map((t) => <TypeBadge key={t} type={t} sm />)}</div>
            </div>
          ))}
        </Panel>
      )}

      <Panel title="Pokédex numbers">
        <div style={{ display: 'grid', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
          {p.pokedexNumbers.map((n) => (
            <div key={n.pokedex} className="row small" style={{ justifyContent: 'space-between' }}>
              <span className="muted">{title(n.pokedex)}</span>
              <span className="mono faint">#{n.entry}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {rows.map(([k, v]) => (
        <div key={k} className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
          <span className="faint small">{k}</span>
          <span className="small" style={{ textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}

function StatsTab({ p, index }: { p: Pokemon; index: { id: number; isDefault: boolean; stats: number[]; bst: number }[] }) {
  const [level, setLevel] = useState(50)
  const [iv, setIv] = useState(31)
  const [ev, setEv] = useState(0)
  const [nature, setNature] = useState<'plus' | 'neutral' | 'minus'>('neutral')
  const mod = nature === 'plus' ? 1.1 : nature === 'minus' ? 0.9 : 1
  const defaults = index.filter((e) => e.isDefault)
  const pct = (key: string, val: number) => {
    const i = Object.keys(STAT_LABELS).indexOf(key)
    const better = defaults.filter((e) => e.stats[i] < val).length
    return Math.round((better / defaults.length) * 100)
  }

  return (
    <div className="cols">
      <Panel title="Base stats">
        <StatBars stats={p.stats} />
      </Panel>
      <Panel title="Stat calculator">
        <div className="row" style={{ gap: 14, marginBottom: 12 }}>
          <label className="small" style={{ flex: 1 }}>Level {level}
            <input type="range" min={1} max={100} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </label>
          <label className="small" style={{ flex: 1 }}>IV {iv}
            <input type="range" min={0} max={31} value={iv} onChange={(e) => setIv(Number(e.target.value))} />
          </label>
          <label className="small" style={{ flex: 1 }}>EV {ev}
            <input type="range" min={0} max={252} step={4} value={ev} onChange={(e) => setEv(Number(e.target.value))} />
          </label>
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 12 }}>
          {(['minus', 'neutral', 'plus'] as const).map((n) => (
            <button key={n} className={`chip${nature === n ? ' on' : ''}`} onClick={() => setNature(n)}>
              {n === 'plus' ? 'Boosting nature' : n === 'minus' ? 'Hindering nature' : 'Neutral nature'}
            </button>
          ))}
        </div>
        <table className="data">
          <thead><tr><th className="plain">Stat</th><th className="plain" style={{ textAlign: 'right' }}>Base</th><th className="plain" style={{ textAlign: 'right' }}>Min</th><th className="plain" style={{ textAlign: 'right' }}>Current</th><th className="plain" style={{ textAlign: 'right' }}>Max</th><th className="plain" style={{ textAlign: 'right' }}>Percentile</th></tr></thead>
          <tbody>
            {Object.entries(p.stats).map(([k, v]) => (
              <tr key={k}>
                <td>{STAT_LABELS[k]}</td>
                <td className="num">{v}</td>
                <td className="num faint">{statAtLevel(v, k, level, 0, 0, k === 'hp' ? 1 : 0.9)}</td>
                <td className="num" style={{ fontWeight: 700 }}>{statAtLevel(v, k, level, iv, ev, k === 'hp' ? 1 : mod)}</td>
                <td className="num faint">{statAtLevel(v, k, level, 31, 252, k === 'hp' ? 1 : 1.1)}</td>
                <td className="num faint">{pct(k, v)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}

function MovesTab({ p, allMoves, meta }: { p: Pokemon; allMoves: { id: number; type: string; damageClass: string; power: number | null; accuracy: number | null; pp: number | null; label: string; name: string }[]; meta: { versionGroups: { name: string; label: string }[] } }) {
  const groups = useMemo(() => [...new Set(p.moves.map((m) => m.versionGroup))], [p])
  const ordered = meta.versionGroups.filter((v) => groups.includes(v.name))
  const [vg, setVg] = useState(ordered[ordered.length - 1]?.name ?? groups[0])
  const [method, setMethod] = useState<string>('level-up')
  const byId = useMemo(() => new Map(allMoves.map((m) => [m.id, m])), [allMoves])
  const methods = useMemo(() => [...new Set(p.moves.filter((m) => m.versionGroup === vg).map((m) => m.method))], [p, vg])
  const rows = p.moves.filter((m) => m.versionGroup === vg && m.method === (methods.includes(method) ? method : methods[0]))

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="toolbar">
        <select className="input" style={{ width: 220 }} value={vg} onChange={(e) => setVg(e.target.value)}>
          {ordered.map((v) => <option key={v.name} value={v.name}>{v.label}</option>)}
        </select>
        <div className="row" style={{ gap: 6 }}>
          {methods.map((m) => (
            <button key={m} className={`chip${(methods.includes(method) ? method : methods[0]) === m ? ' on' : ''}`} onClick={() => setMethod(m)}>{title(m)}</button>
          ))}
        </div>
        <span className="spacer" />
        <span className="faint small">{rows.length} moves</span>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="plain">{method === 'level-up' ? 'Lv.' : '#'}</th>
              <th className="plain">Move</th><th className="plain">Type</th><th className="plain">Class</th>
              <th className="plain" style={{ textAlign: 'right' }}>Power</th>
              <th className="plain" style={{ textAlign: 'right' }}>Acc</th>
              <th className="plain" style={{ textAlign: 'right' }}>PP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const m = byId.get(r.id)
              return (
                <tr key={`${r.id}-${i}`}>
                  <td className="num faint">{r.level || '—'}</td>
                  <td><Link to={`/moves/${r.move}`} style={{ fontWeight: 600 }}>{m?.label ?? title(r.move)}</Link></td>
                  <td>{m && <TypeBadge type={m.type} sm />}</td>
                  <td className="faint small">{title(m?.damageClass ?? '')}</td>
                  <td className="num">{m?.power ?? '—'}</td>
                  <td className="num">{m?.accuracy ? `${m.accuracy}%` : '—'}</td>
                  <td className="num faint">{m?.pp ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function evoCondition(details: EvoNode['details']) {
  if (!details.length) return ''
  const d = details[0]
  const parts: string[] = []
  if (d.minLevel) parts.push(`Lv. ${d.minLevel}`)
  if (d.trigger === 'trade') parts.push('Trade')
  if (d.trigger === 'use-item' && d.item) parts.push(title(d.item))
  if (d.trigger === 'shed') parts.push('Empty slot + Poké Ball')
  if (d.item && d.trigger !== 'use-item') parts.push(title(d.item))
  if (d.heldItem) parts.push(`holding ${title(d.heldItem)}`)
  if (d.minHappiness) parts.push(`Friendship ${d.minHappiness}`)
  if (d.minAffection) parts.push(`Affection ${d.minAffection}`)
  if (d.minBeauty) parts.push(`Beauty ${d.minBeauty}`)
  if (d.knownMove) parts.push(`knowing ${title(d.knownMove)}`)
  if (d.knownMoveType) parts.push(`knowing a ${title(d.knownMoveType)} move`)
  if (d.timeOfDay) parts.push(`${title(d.timeOfDay)}time`)
  if (d.location) parts.push(`at ${title(d.location)}`)
  if (d.gender != null) parts.push(d.gender === 1 ? '♀ only' : '♂ only')
  if (d.needsOverworldRain) parts.push('in rain')
  if (d.partySpecies) parts.push(`with ${title(d.partySpecies)} in party`)
  if (d.partyType) parts.push(`with a ${title(d.partyType)} type in party`)
  if (d.tradeSpecies) parts.push(`for ${title(d.tradeSpecies)}`)
  if (d.turnUpsideDown) parts.push('console upside-down')
  if (d.relativePhysicalStats === 1) parts.push('Atk > Def')
  if (d.relativePhysicalStats === -1) parts.push('Atk < Def')
  if (d.relativePhysicalStats === 0) parts.push('Atk = Def')
  if (!parts.length && d.trigger) parts.push(title(d.trigger))
  return parts.join(', ')
}

function EvoTree({ node, currentId }: { node: EvoNode; currentId: number }) {
  return (
    <div className="evo">
      <Link to={`/pokemon/${node.species}`} className="evo-node" style={{ outline: node.id === currentId ? '1px solid var(--accent)' : 'none' }}>
        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png`} alt={node.species} loading="lazy" />
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{title(node.species)}</span>
        <span className="faint mono" style={{ fontSize: 11 }}>{padId(node.id)}</span>
      </Link>
      {node.evolvesTo.length > 0 && (
        <div className="evo-branch">
          {node.evolvesTo.map((child) => (
            <div className="evo" key={child.id}>
              <div className="evo-arrow">
                <span style={{ fontSize: 18 }}>→</span>
                <span>{evoCondition(child.details)}</span>
              </div>
              <EvoTree node={child} currentId={currentId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EvolutionTab({ p }: { p: Pokemon }) {
  if (!p.evolution) return <Empty>No evolution data.</Empty>
  const single = p.evolution.root.evolvesTo.length === 0
  return (
    <Panel title="Evolution chain">
      {single ? <Empty>{p.speciesLabel} does not evolve.</Empty> : <EvoTree node={p.evolution.root} currentId={p.speciesId} />}
      {p.evolution.babyTriggerItem && <div className="faint small" style={{ marginTop: 12 }}>Baby trigger item: {title(p.evolution.babyTriggerItem)}</div>}
    </Panel>
  )
}

function LocationsTab({ p }: { p: Pokemon }) {
  if (!p.encounters.length) return <Empty>No wild encounter data — likely obtained via evolution, gift, egg or event.</Empty>
  return (
    <div className="table-wrap">
      <table className="data">
        <thead><tr><th className="plain">Location</th><th className="plain">Version</th><th className="plain">Method</th><th className="plain" style={{ textAlign: 'right' }}>Levels</th><th className="plain" style={{ textAlign: 'right' }}>Chance</th><th className="plain">Conditions</th></tr></thead>
        <tbody>
          {p.encounters.flatMap((e) =>
            e.versions.flatMap((v) =>
              v.details.map((d, i) => (
                <tr key={`${e.location}-${v.version}-${i}`}>
                  <td>{title(e.location)}</td>
                  <td className="faint small">{title(v.version)}</td>
                  <td className="small">{title(d.method)}</td>
                  <td className="num">{d.minLevel === d.maxLevel ? d.minLevel : `${d.minLevel}–${d.maxLevel}`}</td>
                  <td className="num">{d.chance}%</td>
                  <td className="faint small">{d.conditions.map(title).join(', ') || '—'}</td>
                </tr>
              )),
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}

function SpritesTab({ p }: { p: Pokemon }) {
  const main: [string, string | null][] = [
    ['Official artwork', p.sprites.artwork],
    ['Shiny artwork', p.sprites.artworkShiny],
    ['HOME', p.sprites.home],
    ['HOME shiny', p.sprites.homeShiny],
    ['Front', p.sprites.front],
    ['Back', p.sprites.back],
    ['Front shiny', p.sprites.shiny],
    ['Back shiny', p.sprites.shinyBack],
    ['Female', p.sprites.female],
    ['Female shiny', p.sprites.shinyFemale],
    ['Showdown', p.sprites.showdown],
    ['Showdown shiny', p.sprites.showdownShiny],
    ['Dream World', p.sprites.dreamWorld],
  ]
  const versions = p.sprites.versions ?? {}
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Gallery">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {main.filter(([, url]) => url).map(([label, url]) => (
            <figure key={label} style={{ margin: 0, textAlign: 'center' }}>
              <div style={{ background: 'var(--panel-2)', borderRadius: 12, padding: 8, display: 'grid', placeItems: 'center', minHeight: 110 }}>
                <img src={url!} alt={label} style={{ maxWidth: '100%', maxHeight: 96, objectFit: 'contain' }} loading="lazy" />
              </div>
              <figcaption className="faint" style={{ fontSize: 11, marginTop: 5 }}>{label}</figcaption>
            </figure>
          ))}
        </div>
      </Panel>
      {Object.entries(versions).map(([gen, games]) => (
        <Panel key={gen} title={title(gen)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
            {Object.entries(games).flatMap(([game, sprites]) =>
              Object.entries(sprites as Record<string, unknown>)
                .filter(([k, v]) => typeof v === 'string' && k.startsWith('front'))
                .map(([k, v]) => (
                  <figure key={`${game}-${k}`} style={{ margin: 0, textAlign: 'center' }}>
                    <div style={{ background: 'var(--panel-2)', borderRadius: 10, padding: 8, display: 'grid', placeItems: 'center', minHeight: 90 }}>
                      <img src={v as string} alt={game} style={{ maxHeight: 72, imageRendering: 'pixelated' }} loading="lazy" />
                    </div>
                    <figcaption className="faint" style={{ fontSize: 10.5, marginTop: 4 }}>{title(game)} · {k.replace('front_', '')}</figcaption>
                  </figure>
                )),
            )}
          </div>
        </Panel>
      ))}
    </div>
  )
}

function EntriesTab({ p }: { p: Pokemon }) {
  if (!p.flavorText.length) return <Empty>No Pokédex entries.</Empty>
  return (
    <div className="cols">
      {p.flavorText.map((f) => (
        <Panel key={f.version} title={title(f.version)}>
          <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14.5 }}>{f.text}</p>
        </Panel>
      ))}
    </div>
  )
}
