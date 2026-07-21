import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getIndex, getMeta, getMove, getMoves, spriteUrl } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import type { MoveDetail, SpeciesIndex } from '../../lib/types'
import { GEN_ROMAN, dexNo, titleCase } from '../../lib/format'
import { typeColor } from '../../lib/typeColors'
import TypeBadge from '../../components/TypeBadge'
import Sprite from '../../components/Sprite'
import Section from '../../components/Section'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { ClassTag, EM_DASH } from './movesShared'
import './moves.css'

const statLabel = (stat: string) => (stat === 'hp' ? 'HP' : titleCase(stat))

function buildFacts(move: MoveDetail): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = []
  const m = move.meta
  if (m) {
    if (m.ailment && m.ailment !== 'none') {
      facts.push({
        label: 'Ailment',
        value: titleCase(m.ailment) + (m.ailmentChance ? ` · ${m.ailmentChance}% chance` : '')
      })
    }
    if (m.critRate) {
      facts.push({
        label: 'Crit bonus',
        value: `+${m.critRate} stage${m.critRate > 1 ? 's' : ''}`
      })
    }
    if (m.drain) {
      facts.push(
        m.drain > 0
          ? { label: 'Drain', value: `Heals ${m.drain}% of damage dealt` }
          : { label: 'Recoil', value: `${Math.abs(m.drain)}% of damage dealt` }
      )
    }
    if (m.healing) facts.push({ label: 'Healing', value: `${m.healing}% of max HP` })
    if (m.flinchChance) facts.push({ label: 'Flinch', value: `${m.flinchChance}% chance` })
    if (m.minHits) {
      facts.push({
        label: 'Hits',
        value: m.maxHits && m.maxHits !== m.minHits ? `${m.minHits}–${m.maxHits}` : `${m.minHits}`
      })
    }
  }
  if (move.target) facts.push({ label: 'Target', value: move.target })
  return facts
}

function Learners({ learners }: { learners: SpeciesIndex[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? learners : learners.slice(0, 24)
  return (
    <>
      <div className="mvd-learners">
        {visible.map(s => (
          <Link key={s.id} to={`/pokemon/${s.id}`} className="mvd-learner">
            <Sprite src={spriteUrl(s.id)} alt={s.dname} size={56} pixelated />
            <span className="mvd-ln-no">{dexNo(s.id)}</span>
            <span className="mvd-ln-name">{s.dname}</span>
          </Link>
        ))}
      </div>
      {learners.length > 24 && (
        <div className="mvd-expand">
          <button type="button" className="btn" aria-expanded={showAll} onClick={() => setShowAll(v => !v)}>
            {showAll ? 'Show fewer' : `Show all ${learners.length}`}
          </button>
        </div>
      )}
    </>
  )
}

export default function MoveDetailPage() {
  const { id = '' } = useParams()
  const numId = Number(id)
  const validId = Number.isInteger(numId) && numId > 0
  const { data: move, error: moveError, loading: moveLoading } = useAsync<MoveDetail | null>(
    () => (validId ? getMove(numId) : Promise.resolve(null)),
    [numId, validId]
  )
  const { data: shared, error: sharedError, loading: sharedLoading } = useAsync(async () => {
    const [moves, index, meta] = await Promise.all([getMoves(), getIndex(), getMeta()])
    return { moves, index, meta }
  }, [])
  useDocTitle(move?.dname ?? 'Moves')

  if (moveLoading || sharedLoading) return <Loader />
  if (!validId || moveError || !move) {
    return (
      <div className="container page-pad">
        <EmptyState title="Move not found" hint={`No move matches “${id}”. It may have been misfiled in the archive.`}>
          <Link to="/moves" className="btn" style={{ marginTop: 8 }}>
            Back to all moves
          </Link>
        </EmptyState>
      </div>
    )
  }
  if (sharedError || !shared) {
    return (
      <div className="container page-pad">
        <EmptyState title="Couldn’t load move data" hint={sharedError?.message ?? 'The move index failed to load.'}>
          <button type="button" className="btn" onClick={() => location.reload()} style={{ marginTop: 8 }}>
            Retry
          </button>
        </EmptyState>
      </div>
    )
  }

  const { moves, index, meta } = shared
  const pos = moves.findIndex(m => m.id === move.id)
  const prev = pos > 0 ? moves[pos - 1] : null
  const next = pos >= 0 && pos < moves.length - 1 ? moves[pos + 1] : null
  const genName = meta.gens.find(g => g.id === move.gen)?.dname ?? `Generation ${GEN_ROMAN[move.gen]}`
  const vgName = new Map(meta.vgs.map(v => [v.name, v.dname]))
  const speciesById = new Map(index.map(s => [s.id, s]))
  const learners = move.learners
    .map(sid => speciesById.get(sid))
    .filter((s): s is SpeciesIndex => s !== undefined)
  const effectFull = move.effectFull || move.effect
  const lede = move.effect && move.effect !== effectFull ? move.effect : null
  const facts = buildFacts(move)
  const tiles = [
    { label: 'Power', value: move.power !== null ? String(move.power) : EM_DASH },
    { label: 'Accuracy', value: move.acc !== null ? `${move.acc}%` : EM_DASH },
    { label: 'PP', value: move.pp !== null ? String(move.pp) : EM_DASH },
    { label: 'Priority', value: move.priority > 0 ? `+${move.priority}` : String(move.priority) }
  ]

  return (
    <div
      className="container page-pad mvd-page"
      style={{ '--accent': typeColor(move.type) } as React.CSSProperties}
    >
      <nav className="mvd-nav" aria-label="Adjacent moves">
        {prev ? (
          <Link to={`/moves/${prev.id}`} className="btn btn-sm mvd-nav-link" rel="prev">
            ← <span className="num mvd-nav-no">#{prev.id}</span> {prev.dname}
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        <Link to="/moves" className="btn btn-sm btn-ghost">
          All moves
        </Link>
        {next ? (
          <Link to={`/moves/${next.id}`} className="btn btn-sm mvd-nav-link" rel="next">
            {next.dname} <span className="num mvd-nav-no">#{next.id}</span> →
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </nav>

      <header className="card mvd-hero">
        <div className="eyebrow">
          Move No. {move.id} · {genName}
        </div>
        <h1>{move.dname}</h1>
        <div className="mvd-hero-badges">
          <TypeBadge type={move.type} link />
          <span className="chip">
            <ClassTag dclass={move.dclass} />
          </span>
          <span className="chip">Gen {GEN_ROMAN[move.gen]}</span>
        </div>
        <dl className="mvd-tiles">
          {tiles.map(t => (
            <div key={t.label} className="mvd-tile">
              <dt className="eyebrow">{t.label}</dt>
              <dd className="mvd-tile-value">{t.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Section eyebrow="Mechanics" title="Effect">
        <div className="card mvd-effect-card">
          {lede && <p className="mvd-effect-lede">{lede}</p>}
          <p className="mvd-effect-full">{effectFull}</p>
          {facts.length > 0 && (
            <dl className="mvd-facts">
              {facts.map(f => (
                <div key={f.label} className="mvd-fact">
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {move.statChanges.length > 0 && (
            <div className="mvd-stat-chips" role="list" aria-label="Stat changes">
              {move.statChanges.map(sc => (
                <span key={sc.stat} className="chip" role="listitem">
                  <span className="num">{sc.change > 0 ? `+${sc.change}` : sc.change}</span>
                  {statLabel(sc.stat)}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {move.flavor.length > 0 && (
        <Section eyebrow="Field notes" title="Game descriptions">
          <div className="card mvd-flavor">
            {move.flavor.map(f => (
              <div key={f.v.join(',')} className="mvd-flavor-row">
                <div className="mono mvd-flavor-vg">{f.v.map(v => vgName.get(v) ?? titleCase(v)).join(' · ')}</div>
                <p>{f.t}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section
        eyebrow="Compatibility"
        title="Learned by"
        aside={<span className="mono dim">{learners.length} species</span>}
      >
        {learners.length > 0 ? (
          <Learners key={move.id} learners={learners} />
        ) : (
          <EmptyState title="No known learners" hint="No species in the National Dex learns this move." />
        )}
      </Section>
    </div>
  )
}
