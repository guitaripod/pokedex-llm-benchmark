import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAbilities, getAbility, getIndex, spriteUrl } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import { dexNo, GEN_ROMAN } from '../../lib/format'
import { typeColor } from '../../lib/typeColors'
import type { AbilityHolder, SpeciesIndex } from '../../lib/types'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import Section from '../../components/Section'
import Sprite from '../../components/Sprite'
import './abilities.css'

const abilityNo = (id: number) => `#${String(id).padStart(3, '0')}`

function HolderCard({ holder, species }: { holder: AbilityHolder; species?: SpeciesIndex }) {
  const accent = species ? { '--holder-accent': typeColor(species.types[0]) } : undefined
  return (
    <Link
      to={`/pokemon/${holder.sid}`}
      className="abd-holder card"
      style={accent as React.CSSProperties | undefined}
    >
      <Sprite src={spriteUrl(holder.pid)} alt={holder.pdname} size={56} pixelated />
      <span className="abd-holder-info">
        <span className="abd-holder-name">{holder.pdname}</span>
        <span className="abd-holder-no mono">{dexNo(holder.sid)}</span>
      </span>
      {holder.hidden && <span className="abd-hidden-chip">Hidden</span>}
    </Link>
  )
}

export default function AbilityDetailPage() {
  const { id } = useParams()
  const numId = Number(id)
  const validId = Number.isInteger(numId) && numId > 0
  const { data, error, loading } = useAsync(
    () => (validId ? getAbility(numId) : Promise.reject(new Error(`Unknown ability ${id}`))),
    [id]
  )
  const { data: abilities } = useAsync(getAbilities, [])
  const { data: index } = useAsync(getIndex, [])
  useDocTitle(data ? data.dname : null)

  const bySid = useMemo(
    () => new Map((index ?? []).map(s => [s.id, s])),
    [index]
  )

  const adjacent = useMemo(() => {
    if (!abilities || !data) return { prev: null, next: null }
    const pos = abilities.findIndex(a => a.id === data.id)
    return {
      prev: pos > 0 ? abilities[pos - 1] : null,
      next: pos >= 0 && pos < abilities.length - 1 ? abilities[pos + 1] : null
    }
  }, [abilities, data])

  if (loading) return <Loader />
  if (error || !data) {
    return (
      <div className="container page-pad">
        <EmptyState
          title="Ability not found"
          hint={`No ability answers to “${id}” in the index.`}
        >
          <Link to="/abilities" className="btn" style={{ marginTop: 8 }}>
            Back to the Ability Index
          </Link>
        </EmptyState>
      </div>
    )
  }

  const paragraphs = data.effectFull.split('\n\n').map(p => p.trim()).filter(Boolean)
  const flavor =
    data.flavor && data.flavor.trim() !== data.effectFull.trim() ? data.flavor.trim() : null
  const normal = data.holders.filter(h => !h.hidden)
  const hidden = data.holders.filter(h => h.hidden)
  const countText =
    `${data.holders.length} Pokémon` +
    (hidden.length ? `, ${hidden.length} as hidden ability` : '')

  return (
    <div className="container page-pad">
      <header className="abd-head">
        <Link to="/abilities" className="abd-back mono">← Ability Index</Link>
        <div className="eyebrow">
          Ability {abilityNo(data.id)} · Gen {GEN_ROMAN[data.gen]}
        </div>
        <h1>{data.dname}</h1>
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? 'abd-lead' : 'abd-para'}>
              {p}
            </p>
          ))
        ) : (
          <p className="abd-lead dim">No effect data on record.</p>
        )}
        {flavor && <p className="abd-flavor">“{flavor}”</p>}
      </header>

      <Section
        eyebrow="Field data"
        title="Holders"
        aside={<span className="mono dim">{countText}</span>}
      >
        {data.holders.length === 0 ? (
          <EmptyState title="No known holders" hint="No Pokémon in the index carries this ability." />
        ) : (
          <>
            {normal.length > 0 && (
              <>
                <h3 className="abd-subhead">
                  Standard ability
                  <span className="mono dim abd-subcount">{normal.length}</span>
                </h3>
                <div className="abd-holder-grid">
                  {normal.map(h => (
                    <HolderCard key={h.pid} holder={h} species={bySid.get(h.sid)} />
                  ))}
                </div>
              </>
            )}
            {hidden.length > 0 && (
              <>
                <h3 className="abd-subhead">
                  Hidden ability
                  <span className="mono dim abd-subcount">{hidden.length}</span>
                </h3>
                <div className="abd-holder-grid">
                  {hidden.map(h => (
                    <HolderCard key={h.pid} holder={h} species={bySid.get(h.sid)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Section>

      {(adjacent.prev || adjacent.next) && (
        <nav className="abd-pager" aria-label="Adjacent abilities">
          {adjacent.prev ? (
            <Link to={`/abilities/${adjacent.prev.id}`} className="btn">
              <span aria-hidden="true">←</span>
              <span className="mono dim">{abilityNo(adjacent.prev.id)}</span>
              <span className="abd-pager-name">{adjacent.prev.dname}</span>
            </Link>
          ) : (
            <span />
          )}
          {adjacent.next ? (
            <Link to={`/abilities/${adjacent.next.id}`} className="btn">
              <span className="abd-pager-name">{adjacent.next.dname}</span>
              <span className="mono dim">{abilityNo(adjacent.next.id)}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}
