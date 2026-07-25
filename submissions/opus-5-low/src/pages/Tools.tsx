import { useMemo, useState } from 'react'
import Picker from '../components/Picker'
import { Loading, Panel, TypeBadge } from '../components/ui'
import { getMeta, getMoves, getPokemon, getTypes } from '../lib/data'
import { useAsync } from '../lib/hooks'
import type { Pokemon } from '../lib/types'
import { STAT_LABELS, buildChart, statAtLevel, title } from '../lib/util'

export default function Tools() {
  const [tab, setTab] = useState<'damage' | 'catch' | 'exp'>('damage')
  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Trainer tools</h1>
        <div className="faint small">Battle maths, catch odds and experience curves — all computed locally.</div>
      </div>
      <div className="tabs">
        <button className={`tab${tab === 'damage' ? ' on' : ''}`} onClick={() => setTab('damage')}>Damage calculator</button>
        <button className={`tab${tab === 'catch' ? ' on' : ''}`} onClick={() => setTab('catch')}>Catch rate</button>
        <button className={`tab${tab === 'exp' ? ' on' : ''}`} onClick={() => setTab('exp')}>Experience curves</button>
      </div>
      {tab === 'damage' && <DamageCalc />}
      {tab === 'catch' && <CatchCalc />}
      {tab === 'exp' && <ExpCurves />}
    </div>
  )
}

type Side = { p: Pokemon | null; level: number; ev: number; iv: number; nature: number; stage: number }

const defaultSide = (): Side => ({ p: null, level: 50, ev: 0, iv: 31, nature: 1, stage: 0 })
const stageMul = (s: number) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s))

function DamageCalc() {
  const { data: moves } = useAsync(getMoves, [])
  const { data: types } = useAsync(getTypes, [])
  const [atk, setAtk] = useState<Side>(defaultSide())
  const [def, setDef] = useState<Side>(defaultSide())
  const [picking, setPicking] = useState<'atk' | 'def' | null>(null)
  const [moveId, setMoveId] = useState<number | null>(null)
  const [crit, setCrit] = useState(false)
  const [burn, setBurn] = useState(false)

  const learnable = useMemo(() => {
    if (!atk.p || !moves) return []
    const ids = [...new Set(atk.p.moves.map((m) => m.id))]
    return moves.filter((m) => ids.includes(m.id) && m.power).sort((a, b) => a.label.localeCompare(b.label))
  }, [atk.p, moves])

  const move = learnable.find((m) => m.id === moveId) ?? learnable[0] ?? null

  const result = useMemo(() => {
    if (!atk.p || !def.p || !move || !types) return null
    const chart = buildChart(types)
    const physical = move.damageClass === 'physical'
    const aKey = physical ? 'attack' : 'special-attack'
    const dKey = physical ? 'defense' : 'special-defense'
    const A = statAtLevel(atk.p.stats[aKey], aKey, atk.level, atk.iv, atk.ev, atk.nature) * stageMul(crit ? Math.max(0, atk.stage) : atk.stage)
    const D = statAtLevel(def.p.stats[dKey], dKey, def.level, def.iv, def.ev, def.nature) * stageMul(crit ? Math.min(0, def.stage) : def.stage)
    const hp = statAtLevel(def.p.stats.hp, 'hp', def.level, def.iv, def.ev, 1)
    const base = Math.floor(Math.floor((Math.floor((2 * atk.level) / 5 + 2) * (move.power ?? 0) * A) / D) / 50) + 2
    const stab = atk.p.types.includes(move.type) ? 1.5 : 1
    const eff = def.p.types.reduce((acc, t) => acc * (chart[move.type]?.[t] ?? 1), 1)
    const mods = stab * eff * (crit ? 1.5 : 1) * (burn && physical ? 0.5 : 1)
    const min = Math.floor(base * mods * 0.85)
    const max = Math.floor(base * mods)
    return { min, max, hp, eff, stab, pctMin: (min / hp) * 100, pctMax: (max / hp) * 100, koHits: max > 0 ? Math.ceil(hp / max) : Infinity }
  }, [atk, def, move, types, crit, burn])

  const sideEditor = (label: string, side: Side, set: (s: Side) => void, which: 'atk' | 'def') => (
    <Panel title={label}>
      <div className="row" style={{ gap: 12, marginBottom: 12 }}>
        {side.p
          ? <img src={side.p.sprites.artwork ?? side.p.sprites.front ?? ''} alt="" width={72} height={72} style={{ objectFit: 'contain' }} />
          : <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--panel-2)' }} />}
        <div style={{ display: 'grid', gap: 6 }}>
          <button className="btn sm" onClick={() => setPicking(which)}>{side.p ? side.p.label : 'Choose Pokémon'}</button>
          {side.p && <div className="row" style={{ gap: 4 }}>{side.p.types.map((t) => <TypeBadge key={t} type={t} sm />)}</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label className="small">Level {side.level}
          <input type="range" min={1} max={100} value={side.level} onChange={(e) => set({ ...side, level: Number(e.target.value) })} />
        </label>
        <label className="small">IVs {side.iv}
          <input type="range" min={0} max={31} value={side.iv} onChange={(e) => set({ ...side, iv: Number(e.target.value) })} />
        </label>
        <label className="small">EVs {side.ev}
          <input type="range" min={0} max={252} step={4} value={side.ev} onChange={(e) => set({ ...side, ev: Number(e.target.value) })} />
        </label>
        <div className="row" style={{ gap: 6 }}>
          {[0.9, 1, 1.1].map((n) => (
            <button key={n} className={`chip${side.nature === n ? ' on' : ''}`} onClick={() => set({ ...side, nature: n })}>
              {n === 1 ? 'Neutral' : n > 1 ? '+Nature' : '−Nature'}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="faint small">Stage</span>
          {[-2, -1, 0, 1, 2].map((s) => (
            <button key={s} className={`chip${side.stage === s ? ' on' : ''}`} onClick={() => set({ ...side, stage: s })}>{s > 0 ? `+${s}` : s}</button>
          ))}
        </div>
      </div>
    </Panel>
  )

  return (
    <>
      <div className="cols">
        {sideEditor('Attacker', atk, setAtk, 'atk')}
        {sideEditor('Defender', def, setDef, 'def')}
        <Panel title="Move">
          <select className="input" value={move?.id ?? ''} onChange={(e) => setMoveId(Number(e.target.value))} disabled={!learnable.length}>
            {learnable.map((m) => <option key={m.id} value={m.id}>{m.label} — {m.power} BP {title(m.damageClass)}</option>)}
            {!learnable.length && <option>Choose an attacker first</option>}
          </select>
          {move && (
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <TypeBadge type={move.type} sm />
              <span className="badge">{title(move.damageClass)}</span>
              <span className="badge">{move.power} power</span>
              <span className="badge">{move.accuracy ?? '—'}% acc</span>
            </div>
          )}
          <div className="row" style={{ gap: 6, marginTop: 12 }}>
            <button className={`chip${crit ? ' on' : ''}`} onClick={() => setCrit((c) => !c)}>Critical hit</button>
            <button className={`chip${burn ? ' on' : ''}`} onClick={() => setBurn((b) => !b)}>Attacker burned</button>
          </div>
        </Panel>

        <Panel title="Result">
          {result ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="kv" style={{ background: 'var(--panel-2)' }}>
                <div className="kv-k">Damage</div>
                <div className="kv-v" style={{ fontSize: 24 }}>{result.min} – {result.max}</div>
                <div className="faint small">{result.pctMin.toFixed(1)}% – {result.pctMax.toFixed(1)}% of {result.hp} HP</div>
              </div>
              <div className="stat-bar" style={{ height: 12 }}>
                <span className="stat-fill" style={{ width: `${Math.min(100, result.pctMax)}%`, background: 'linear-gradient(90deg,var(--danger),#ff9f43)' }} />
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="faint small">Type effectiveness</span><span className="small">{result.eff}×</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="faint small">STAB</span><span className="small">{result.stab === 1.5 ? 'Yes (1.5×)' : 'No'}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="faint small">Guaranteed KO in</span>
                <span className="small">{Number.isFinite(result.koHits) ? `${result.koHits} hit${result.koHits > 1 ? 's' : ''}` : 'never'}</span>
              </div>
            </div>
          ) : <span className="faint small">Pick an attacker, a defender and a damaging move.</span>}
        </Panel>
      </div>

      {picking && (
        <Picker
          onClose={() => setPicking(null)}
          onPick={(e) => {
            void getPokemon(e.id).then((p) => (picking === 'atk' ? setAtk((s) => ({ ...s, p })) : setDef((s) => ({ ...s, p }))))
          }}
        />
      )}
    </>
  )
}

const BALLS: [string, number][] = [
  ['Poké Ball', 1], ['Great Ball', 1.5], ['Ultra Ball', 2], ['Master Ball', 255],
  ['Net Ball (water/bug)', 3.5], ['Nest Ball (low level)', 3.9], ['Dusk Ball (night)', 3.5],
  ['Quick Ball (turn 1)', 5], ['Timer Ball (10+ turns)', 4], ['Repeat Ball', 3.5],
]
const STATUS: [string, number][] = [['None', 1], ['Poison / Burn / Paralysis', 1.5], ['Sleep / Freeze', 2.5]]

function CatchCalc() {
  const [picking, setPicking] = useState(false)
  const [p, setP] = useState<Pokemon | null>(null)
  const [hp, setHp] = useState(100)
  const [ball, setBall] = useState(1)
  const [status, setStatus] = useState(1)
  const [level, setLevel] = useState(50)

  const rate = p ? p.species.captureRate : 45
  const maxHp = p ? statAtLevel(p.stats.hp, 'hp', level, 31, 0, 1) : 100
  const currentHp = Math.max(1, Math.round((maxHp * hp) / 100))
  const a = ((3 * maxHp - 2 * currentHp) / (3 * maxHp)) * rate * ball * status
  const shakeProb = a >= 255 ? 1 : (65536 / (255 / a) ** 0.1875) / 65536
  const catchProb = a >= 255 ? 1 : Math.min(1, shakeProb ** 4)

  return (
    <>
      <div className="cols">
        <Panel title="Target">
          <div className="row" style={{ gap: 12, marginBottom: 12 }}>
            {p && <img src={p.sprites.artwork ?? ''} width={80} height={80} alt="" style={{ objectFit: 'contain' }} />}
            <button className="btn sm" onClick={() => setPicking(true)}>{p ? p.label : 'Choose Pokémon'}</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <label className="small">Level {level}<input type="range" min={1} max={100} value={level} onChange={(e) => setLevel(Number(e.target.value))} /></label>
            <label className="small">Remaining HP {hp}%<input type="range" min={1} max={100} value={hp} onChange={(e) => setHp(Number(e.target.value))} /></label>
            <div>
              <div className="filter-label">Ball</div>
              <select className="input" value={ball} onChange={(e) => setBall(Number(e.target.value))}>
                {BALLS.map(([l, v]) => <option key={l} value={v}>{l} ×{v}</option>)}
              </select>
            </div>
            <div>
              <div className="filter-label">Status</div>
              <select className="input" value={status} onChange={(e) => setStatus(Number(e.target.value))}>
                {STATUS.map(([l, v]) => <option key={l} value={v}>{l} ×{v}</option>)}
              </select>
            </div>
          </div>
        </Panel>
        <Panel title="Odds">
          <div className="kv" style={{ background: 'var(--panel-2)' }}>
            <div className="kv-k">Catch chance per ball</div>
            <div className="kv-v" style={{ fontSize: 30 }}>{(catchProb * 100).toFixed(1)}%</div>
          </div>
          <div className="stat-bar" style={{ height: 12, margin: '12px 0' }}>
            <span className="stat-fill" style={{ width: `${catchProb * 100}%`, background: 'linear-gradient(90deg,var(--good),#8ef7c8)' }} />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Row k="Species catch rate" v={String(rate)} />
            <Row k="HP at level" v={`${currentHp} / ${maxHp}`} />
            <Row k="Expected balls" v={catchProb > 0 ? (1 / catchProb).toFixed(1) : '∞'} />
            <Row k="Chance within 5 balls" v={`${((1 - (1 - catchProb) ** 5) * 100).toFixed(1)}%`} />
            <Row k="Chance within 20 balls" v={`${((1 - (1 - catchProb) ** 20) * 100).toFixed(1)}%`} />
          </div>
        </Panel>
      </div>
      {picking && <Picker onClose={() => setPicking(false)} onPick={(e) => { void getPokemon(e.id).then(setP) }} />}
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className="faint small">{k}</span><span className="small">{v}</span>
    </div>
  )
}

function ExpCurves() {
  const { data: meta } = useAsync(getMeta, [])
  if (!meta) return <Loading />
  const rates = meta.growthRates
  const max = Math.max(...rates.flatMap((r) => r.levels.map(([, e]) => e)))
  const W = 640
  const H = 280

  return (
    <div className="cols">
      <Panel title="Experience to level 100">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
          {rates.map((r, i) => {
            const color = ['#ffcb05', '#3b6ef2', '#35d39a', '#f4506a', '#ab6ac8', '#74d0d8'][i % 6]
            const pts = r.levels.map(([lv, exp]) => `${(lv / 100) * W},${H - (exp / max) * (H - 10)}`).join(' ')
            return <polyline key={r.id} points={pts} fill="none" stroke={color} strokeWidth={2} />
          })}
        </svg>
        <div className="chips" style={{ marginTop: 10 }}>
          {rates.map((r, i) => (
            <span key={r.id} className="badge" style={{ color: ['#ffcb05', '#3b6ef2', '#35d39a', '#f4506a', '#ab6ac8', '#74d0d8'][i % 6] }}>{title(r.name)}</span>
          ))}
        </div>
      </Panel>
      <Panel title="Total experience by growth rate">
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="data">
            <thead><tr><th className="plain">Growth rate</th><th className="plain" style={{ textAlign: 'right' }}>Lv 50</th><th className="plain" style={{ textAlign: 'right' }}>Lv 100</th><th className="plain">Formula</th></tr></thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td>{title(r.name)}</td>
                  <td className="num">{(r.levels.find(([lv]) => lv === 50)?.[1] ?? 0).toLocaleString()}</td>
                  <td className="num">{(r.levels.find(([lv]) => lv === 100)?.[1] ?? 0).toLocaleString()}</td>
                  <td className="faint small mono" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.formula.replace(/\\\\/g, '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Stat reference">
        <div style={{ display: 'grid', gap: 8 }}>
          {Object.entries(STAT_LABELS).map(([k, l]) => (
            <Row key={k} k={l} v={k === 'hp' ? 'floor((2·base + IV + EV/4) · lvl / 100) + lvl + 10' : 'floor((floor((2·base + IV + EV/4) · lvl / 100) + 5) · nature)'} />
          ))}
        </div>
      </Panel>
    </div>
  )
}
