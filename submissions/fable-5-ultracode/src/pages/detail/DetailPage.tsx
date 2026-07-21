import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getIndex, getMeta, getPokemon, getTypes, resolveSpeciesKey } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import type { EncounterRow, PokemonDetail } from '../../lib/types'
import { GEN_ROMAN, dexNo, titleCase } from '../../lib/format'
import { typeColor, typeInk } from '../../lib/typeColors'
import { useTeam } from '../../lib/store'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import Section from '../../components/Section'
import Sprite from '../../components/Sprite'
import TypeBadge from '../../components/TypeBadge'
import StatBars from '../../components/StatBars'
import CryButton from '../../components/CryButton'
import FavButton from '../../components/FavButton'
import DexEntries from './DexEntries'
import ProfilePanel from './ProfilePanel'
import AbilitiesPanel from './AbilitiesPanel'
import BreedingPanel from './BreedingPanel'
import TypeDefense from './TypeDefense'
import EvoTree from './EvoTree'
import MovesPanel from './MovesPanel'
import SpriteHistory from './SpriteHistory'
import './detail.css'

const SECTIONS = [
  { id: 'entries', label: 'Dex entries' },
  { id: 'profile', label: 'Profile' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'breeding', label: 'Breeding' },
  { id: 'stats', label: 'Stats' },
  { id: 'defense', label: 'Defenses' },
  { id: 'evolution', label: 'Evolution' },
  { id: 'moves', label: 'Moves' },
  { id: 'sprites', label: 'Sprites' },
  { id: 'locations', label: 'Locations' }
]

function Encounters({ rows }: { rows: EncounterRow[] }) {
  const [version, setVersion] = useState(rows[0]?.v ?? '')
  const active = rows.find(r => r.v === version) ?? rows[0]
  if (rows.length === 0) {
    return <p className="dim">Not found in the wild — evolve, trade or event only.</p>
  }
  return (
    <div className="pd-enc card">
      <div className="pd-enc-versions" role="group" aria-label="Game version">
        {rows.map(r => (
          <button
            key={r.v}
            type="button"
            className={`chip${r.v === active?.v ? ' on' : ''}`}
            aria-pressed={r.v === active?.v}
            onClick={() => setVersion(r.v)}
          >
            {r.v}
          </button>
        ))}
      </div>
      <div className="pd-enc-areas">
        {active?.areas.map(a => (
          <span className="pd-enc-area mono" key={a}>
            {a}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DetailPage() {
  const { key = '' } = useParams()
  const navigate = useNavigate()
  const { data: index, error: indexError } = useAsync(getIndex, [])
  const { data: meta, error: metaError } = useAsync(getMeta, [])
  const { data: typesData, error: typesError } = useAsync(getTypes, [])

  const resolved = useMemo(
    () => (index ? resolveSpeciesKey(key, index) : undefined),
    [index, key]
  )

  const { data: detail, error } = useAsync<PokemonDetail | null>(
    () => (resolved ? getPokemon(resolved.id) : Promise.resolve(null)),
    [resolved?.id]
  )

  const [varIdx, setVarIdx] = useState(0)
  const [shiny, setShiny] = useState(false)
  const [prevDetailId, setPrevDetailId] = useState<number | null>(null)

  if (detail && detail.id !== prevDetailId) {
    setPrevDetailId(detail.id)
    setVarIdx(0)
    setShiny(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, button, a, [role="tab"], [contenteditable="true"]')) return
      if (e.key === 'ArrowLeft' && detail?.prev) navigate(`/pokemon/${detail.prev.id}`)
      if (e.key === 'ArrowRight' && detail?.next) navigate(`/pokemon/${detail.next.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail, navigate])

  const { team, inTeam, add, remove } = useTeam()

  useDocTitle(detail ? `${dexNo(detail.id)} ${detail.dname}` : null)

  if (index && !resolved) {
    return (
      <div className="container page-pad">
        <EmptyState title="No such Pokémon" hint={`Nothing in the dex matches “${key}”.`}>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
            Back to the Dex
          </Link>
        </EmptyState>
      </div>
    )
  }

  const loadError = error ?? indexError ?? metaError ?? typesError
  if (loadError) {
    return (
      <div className="container page-pad">
        <EmptyState title="Couldn’t load this Pokémon" hint={loadError.message}>
          <button type="button" className="btn" onClick={() => location.reload()} style={{ marginTop: 12 }}>
            Retry
          </button>
        </EmptyState>
      </div>
    )
  }

  if (!detail || !meta || !typesData || detail.id !== resolved?.id) return <Loader />

  const variety = detail.varieties[Math.min(varIdx, detail.varieties.length - 1)]
  const accent = typeColor(variety.types[0])
  const art = shiny && variety.artShiny ? variety.artShiny : variety.art
  const lead = detail.flavor[0]?.t
  const bstRank = index
    ? Math.round((index.filter(s => s.bst < variety.stats.reduce((a, b) => a + b, 0)).length / index.length) * 100)
    : null

  return (
    <div
      className="pd-page"
      style={{ '--accent': accent, '--accent-ink': typeInk(variety.types[0]) } as React.CSSProperties}
    >
      <div className="pd-hero-wash" aria-hidden="true" />
      <div className="container page-pad">
        <nav className="pd-adjnav" aria-label="Adjacent Pokémon">
          {detail.prev ? (
            <Link to={`/pokemon/${detail.prev.id}`} className="pd-adj">
              ← <span className="mono">{dexNo(detail.prev.id)}</span> {detail.prev.dname}
            </Link>
          ) : (
            <span />
          )}
          {detail.next && (
            <Link to={`/pokemon/${detail.next.id}`} className="pd-adj">
              {detail.next.dname} <span className="mono">{dexNo(detail.next.id)}</span> →
            </Link>
          )}
        </nav>

        <header className="pd-hero">
          <div className="pd-art-col">
            <span className="pd-ghostno" aria-hidden="true">
              {String(detail.id).padStart(4, '0')}
            </span>
            <div className="pd-art">
              <Sprite key={`${variety.pid}-${shiny}`} src={art} alt={variety.dname} size={420} eager />
            </div>
            <div className="pd-art-tools">
              {variety.artShiny && (
                <button
                  type="button"
                  className="btn btn-sm"
                  aria-pressed={shiny}
                  onClick={() => setShiny(s => !s)}
                >
                  <span aria-hidden="true">✦</span> Shiny
                </button>
              )}
              <CryButton src={variety.cry} />
            </div>
          </div>

          <div className="pd-head-col">
            <div className="pd-head-top">
              <span className="eyebrow">
                {dexNo(detail.id)} · {detail.genus} · Gen {GEN_ROMAN[detail.gen]}
                {detail.legendary && ' · Legendary'}
                {detail.mythical && ' · Mythical'}
                {detail.baby && ' · Baby'}
              </span>
              {detail.jname && (
                <span className="pd-jname" lang="ja" aria-hidden="true">
                  {detail.jname}
                </span>
              )}
            </div>
            <h1 className="pd-title">
              {detail.dname}
              <FavButton id={detail.id} name={detail.dname} />
            </h1>
            <div className="pd-badges">
              {variety.types.map(t => (
                <TypeBadge key={t} type={t} link />
              ))}
            </div>
            {variety.pastTypes.length > 0 && (
              <p className="pd-pasttypes dim">
                Formerly {variety.pastTypes[0].types.map(titleCase).join(' / ')} (through Gen{' '}
                {GEN_ROMAN[variety.pastTypes[0].until]})
              </p>
            )}
            {lead && <p className="pd-lead">{lead}</p>}
            <div className="pd-actions">
              {inTeam(detail.id) ? (
                <button type="button" className="btn" onClick={() => remove(detail.id)}>
                  ✓ In team — remove
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={team.length >= 6}
                  onClick={() => add(detail.id)}
                >
                  {team.length >= 6 ? 'Team is full' : '+ Add to team'}
                </button>
              )}
              <Link to={`/compare?ids=${detail.id}`} className="btn">
                Compare
              </Link>
            </div>

            {detail.varieties.length > 1 && (
              <div className="pd-forms" role="group" aria-label="Forms">
                {detail.varieties.map((v, i) => (
                  <button
                    key={v.pid}
                    type="button"
                    className={`chip${i === varIdx ? ' on' : ''}`}
                    aria-pressed={i === varIdx}
                    onClick={() => setVarIdx(i)}
                  >
                    {v.dname}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <nav className="pd-secnav mono" aria-label="Page sections">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>

        <Section id="entries" eyebrow="Field notes" title="Dex entries">
          <DexEntries flavor={detail.flavor} />
        </Section>

        <Section id="profile" eyebrow="Physique & training" title="Profile">
          <ProfilePanel detail={detail} variety={variety} meta={meta} />
        </Section>

        <Section id="abilities" eyebrow="Passive powers" title="Abilities">
          <AbilitiesPanel abilities={variety.abilities} />
        </Section>

        <Section id="breeding" eyebrow="Daycare data" title="Breeding">
          <BreedingPanel detail={detail} meta={meta} />
        </Section>

        <Section
          id="stats"
          eyebrow="Combat readout"
          title="Base stats"
          aside={
            bstRank != null ? (
              <span className="mono dim pd-readout">stronger than {bstRank}% of species</span>
            ) : undefined
          }
        >
          <div className="pd-stats card">
            <StatBars stats={variety.stats} />
          </div>
        </Section>

        <Section id="defense" eyebrow="Type matchups" title="Defenses">
          <TypeDefense types={variety.types} td={typesData} />
        </Section>

        <Section id="evolution" eyebrow="Line" title="Evolution">
          {detail.evo && (detail.evo.to.length > 0 || detail.evo.sid !== detail.id) ? (
            <EvoTree root={detail.evo} currentId={detail.id} />
          ) : (
            <p className="dim">Does not evolve.</p>
          )}
        </Section>

        <Section id="moves" eyebrow="Learnset" title="Moves">
          <MovesPanel key={variety.pid} variety={variety} meta={meta} />
        </Section>

        <Section id="sprites" eyebrow="Nine generations of pixels" title="Sprite history">
          {detail.spriteHistory.length > 0 ? (
            <SpriteHistory history={detail.spriteHistory} name={detail.dname} />
          ) : (
            <p className="dim">No historical sprites on record.</p>
          )}
        </Section>

        <Section id="locations" eyebrow="Field sightings" title="Where to find">
          <Encounters rows={detail.encounters} />
        </Section>
      </div>
    </div>
  )
}
