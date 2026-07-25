import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Empty, Loading, Panel, TypeBadge, typeColor } from '../components/ui'
import { getIndex, getMove, getMoves, getTypes } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { STAT_LABELS, TYPE_ORDER, buildChart, effLabel, title } from '../lib/util'

export default function MoveDetail() {
  const { id = '' } = useParams()
  const { data: moves } = useAsync(getMoves, [])
  const resolved = useMemo(() => (/^\d+$/.test(id) ? Number(id) : moves?.find((m) => m.name === id)?.id ?? null), [id, moves])
  const { data: m, loading, error } = useAsync(() => (resolved ? getMove(resolved) : new Promise<never>(() => {})), [resolved])
  const { data: index } = useAsync(getIndex, [])
  const { data: types } = useAsync(getTypes, [])

  if (error) return <div className="container"><Empty>Move not found.</Empty></div>
  if (loading || !m || !index || !types) return <Loading />

  const chart = buildChart(types)
  const byId = new Map(index.map((e) => [e.id, e]))
  const learners = m.learnedBy.map((l) => byId.get(l.id)).filter(Boolean)
  const color = typeColor(m.type)

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <section className="hero" style={{ ['--c1' as string]: `color-mix(in srgb, ${color} 30%, var(--panel))`, ['--c2' as string]: 'var(--panel)' }}>
        <div style={{ padding: 26, display: 'grid', gap: 14 }}>
          <div className="hero-num">Move #{m.id} · Generation {m.generation}</div>
          <h1 className="hero-name" style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>{m.label}</h1>
          <div className="row" style={{ gap: 8 }}>
            <TypeBadge type={m.type} />
            <span className="badge">{title(m.damageClass)}</span>
            {m.contestType && <span className="badge">{title(m.contestType)} contest</span>}
          </div>
          <div className="stat-grid">
            <div className="kv"><div className="kv-k">Power</div><div className="kv-v">{m.power ?? '—'}</div></div>
            <div className="kv"><div className="kv-k">Accuracy</div><div className="kv-v">{m.accuracy ? `${m.accuracy}%` : '—'}</div></div>
            <div className="kv"><div className="kv-k">PP</div><div className="kv-v">{m.pp ?? '—'}</div><div className="faint small">max {m.pp ? Math.floor(m.pp * 1.6) : '—'}</div></div>
            <div className="kv"><div className="kv-k">Priority</div><div className="kv-v">{m.priority > 0 ? `+${m.priority}` : m.priority}</div></div>
            <div className="kv"><div className="kv-k">Target</div><div className="kv-v" style={{ fontSize: 13.5 }}>{title(m.target ?? '—')}</div></div>
          </div>
        </div>
      </section>

      <div className="cols">
        <Panel title="Effect">
          <p style={{ marginTop: 0, lineHeight: 1.65 }}>{m.effect ?? m.shortEffect ?? 'No effect description.'}</p>
          {m.flavor && <p className="muted small" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>“{m.flavor}”</p>}
        </Panel>

        <Panel title="Mechanics">
          <div style={{ display: 'grid', gap: 8 }}>
            {([
              ['Category', title(m.category ?? '—')],
              ['Ailment', m.ailment && m.ailment !== 'none' ? `${title(m.ailment)} (${m.ailmentChance || 100}%)` : '—'],
              ['Effect chance', m.effectChance ? `${m.effectChance}%` : '—'],
              ['Crit rate bonus', m.critRate ? `+${m.critRate}` : '—'],
              ['Drain', m.drain ? `${m.drain}%` : '—'],
              ['Healing', m.healing ? `${m.healing}%` : '—'],
              ['Flinch chance', m.flinchChance ? `${m.flinchChance}%` : '—'],
              ['Hits', m.minHits ? (m.minHits === m.maxHits ? String(m.minHits) : `${m.minHits}–${m.maxHits}`) : '1'],
              ['Turns', m.minTurns ? (m.minTurns === m.maxTurns ? String(m.minTurns) : `${m.minTurns}–${m.maxTurns}`) : '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                <span className="faint small">{k}</span><span className="small">{v}</span>
              </div>
            ))}
          </div>
          {m.statChanges.length > 0 && (
            <>
              <div className="panel-title" style={{ marginTop: 16 }}>Stat changes {m.statChance ? `(${m.statChance}%)` : ''}</div>
              <div className="row" style={{ gap: 6 }}>
                {m.statChanges.map((s) => (
                  <span key={s.stat} className={`badge${s.change > 0 ? ' gold' : ''}`}>
                    {STAT_LABELS[s.stat] ?? title(s.stat)} {s.change > 0 ? `+${s.change}` : s.change}
                  </span>
                ))}
              </div>
            </>
          )}
        </Panel>

        {m.damageClass !== 'status' && (
          <Panel title="Effectiveness">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
              {TYPE_ORDER.map((t) => {
                const mult = chart[m.type]?.[t] ?? 1
                return (
                  <div key={t} style={{ display: 'grid', gap: 4 }}>
                    <TypeBadge type={t} sm />
                    <div className={`eff-cell eff-${mult === 0.5 ? '50' : String(mult)}`}>{effLabel(mult)}×</div>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}

        {m.machines.length > 0 && (
          <Panel title="Available as TM/HM">
            <div className="chips">{m.machines.map((x) => <span key={x.versionGroup} className="badge">{title(x.versionGroup)}</span>)}</div>
          </Panel>
        )}
      </div>

      <Panel title={`Learned by ${learners.length} Pokémon`}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {learners.map((e) => e && (
            <Link key={e.id} to={`/pokemon/${e.name}`} className="row" style={{ gap: 8, padding: 6, borderRadius: 10 }}>
              <img src={e.sprite ?? ''} width={40} height={40} alt="" loading="lazy" style={{ imageRendering: 'pixelated' }} />
              <span className="small">{e.label}</span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  )
}
