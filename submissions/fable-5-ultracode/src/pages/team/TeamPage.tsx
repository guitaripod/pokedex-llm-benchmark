import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { artUrl, getIndex, getTypes, spriteUrl } from '../../lib/api'
import { useAsync, useDocTitle } from '../../lib/hooks'
import { TEAM_MAX, useTeam } from '../../lib/store'
import type { SpeciesIndex } from '../../lib/types'
import { defenseProfile, offenseProfile } from '../../lib/typechart'
import { dexNo } from '../../lib/format'
import { typeColor } from '../../lib/typeColors'
import TypeBadge from '../../components/TypeBadge'
import Sprite from '../../components/Sprite'
import PokeCard from '../../components/PokeCard'
import StatBars from '../../components/StatBars'
import Section from '../../components/Section'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import AddSearch from './AddSearch'
import './team.css'

const CLASSIC_TEAM = [3, 6, 9, 25, 143, 149]

function cellClass(m: number): string {
  if (m === 0) return 'tb-c-imm'
  if (m >= 4) return 'tb-c-x4'
  if (m > 1) return 'tb-c-x2'
  if (m <= 0.25) return 'tb-c-q'
  if (m < 1) return 'tb-c-h'
  return 'tb-c-n'
}

function cellText(m: number): string {
  if (m === 0) return 'IMM'
  if (m === 0.5) return '×½'
  if (m === 0.25) return '×¼'
  return `×${m}`
}

export default function TeamPage() {
  useDocTitle('Team Builder')
  const { data: index, error: indexError } = useAsync(getIndex, [])
  const { data: td, error: typesError } = useAsync(getTypes, [])
  const { team, add, remove, setTeam, clear } = useTeam()
  const [params, setParams] = useSearchParams()
  const [confirmLoad, setConfirmLoad] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')

  const byId = useMemo(() => {
    const m = new Map<number, SpeciesIndex>()
    for (const s of index ?? []) m.set(s.id, s)
    return m
  }, [index])

  const idsParam = params.get('ids')

  const sharedIds = useMemo(() => {
    if (idsParam == null || !index) return null
    const seen = new Set<number>()
    const out: number[] = []
    for (const part of idsParam.split(',')) {
      const n = Number(part.trim())
      if (Number.isInteger(n) && byId.has(n) && !seen.has(n)) {
        seen.add(n)
        out.push(n)
        if (out.length === TEAM_MAX) break
      }
    }
    return out
  }, [idsParam, index, byId])

  const shared =
    sharedIds != null && sharedIds.length > 0 && sharedIds.join(',') !== team.join(',')
  const ids = shared && sharedIds ? sharedIds : team

  const dropIdsParam = () =>
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete('ids')
        return next
      },
      { replace: true }
    )

  useEffect(() => {
    if (idsParam != null && index && !shared) {
      setParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.delete('ids')
          return next
        },
        { replace: true }
      )
    }
  }, [idsParam, index, shared, setParams])

  useEffect(() => {
    if (!confirmLoad) return
    const t = setTimeout(() => setConfirmLoad(false), 4000)
    return () => clearTimeout(t)
  }, [confirmLoad])

  useEffect(() => {
    if (!confirmClear) return
    const t = setTimeout(() => setConfirmClear(false), 4000)
    return () => clearTimeout(t)
  }, [confirmClear])

  useEffect(() => {
    if (copied === 'idle') return
    const t = setTimeout(() => setCopied('idle'), 1800)
    return () => clearTimeout(t)
  }, [copied])

  const members = useMemo(
    () => ids.map(id => byId.get(id)).filter((s): s is SpeciesIndex => s != null),
    [ids, byId]
  )

  const analysis = useMemo(() => {
    if (!td || members.length === 0) return null
    const profiles = members.map(m => defenseProfile(m.types, td))
    const rows = td.order.map(t => {
      const cells = profiles.map(p => p[t])
      return {
        t,
        cells,
        weak: cells.filter(v => v > 1).length,
        resist: cells.filter(v => v < 1).length
      }
    })
    const soft = rows.filter(r => r.weak >= 3).map(r => r.t)
    const weakCount: Record<string, number> = {}
    for (const r of rows) weakCount[r.t] = r.weak
    const coveredSet = new Set<string>()
    for (const stab of new Set(members.flatMap(m => m.types))) {
      const prof = offenseProfile(stab, td)
      for (const d of td.order) if (prof[d] > 1) coveredSet.add(d)
    }
    const covered = td.order.filter(t => coveredSet.has(t))
    const gaps = td.order.filter(t => !coveredSet.has(t))
    const avgStats = [0, 1, 2, 3, 4, 5].map(i =>
      Math.round(members.reduce((sum, m) => sum + m.stats[i], 0) / members.length)
    )
    const avgBst = Math.round(members.reduce((sum, m) => sum + m.bst, 0) / members.length)
    const legendaries = members.filter(m => m.legendary || m.mythical).length
    return { rows, soft, weakCount, covered, gaps, avgStats, avgBst, legendaries }
  }, [td, members])

  const suggestions = useMemo(() => {
    if (!td || !index || !analysis || analysis.gaps.length === 0) return []
    const gapSet = new Set(analysis.gaps)
    const inTeam = new Set(ids)
    const seByType = new Map<string, string[]>()
    for (const t of td.order) {
      const prof = offenseProfile(t, td)
      seByType.set(t, td.order.filter(d => prof[d] > 1))
    }
    const scored: { s: SpeciesIndex; gain: number }[] = []
    for (const s of index) {
      if (inTeam.has(s.id)) continue
      const hit = new Set<string>()
      for (const t of s.types) {
        for (const d of seByType.get(t) ?? []) if (gapSet.has(d)) hit.add(d)
      }
      if (hit.size === 0) continue
      const prof = defenseProfile(s.types, td)
      const stacksQuadWeak = td.order.some(
        t => prof[t] >= 4 && (analysis.weakCount[t] ?? 0) > 0
      )
      if (stacksQuadWeak) continue
      scored.push({ s, gain: hit.size })
    }
    return scored
      .sort((a, b) => b.gain - a.gain || b.s.bst - a.s.bst || a.s.id - b.s.id)
      .slice(0, 6)
      .map(x => x.s)
  }, [td, index, analysis, ids])

  if (!index || !td) {
    if (indexError || typesError) {
      return (
        <div className="container page-pad">
          <EmptyState title="Console offline" hint="Team data failed to load. Try refreshing the page." />
        </div>
      )
    }
    return <Loader />
  }

  const copyShareLink = async () => {
    const url = `${window.location.origin}/team?ids=${team.join(',')}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
  }

  const loadShared = () => {
    if (!confirmLoad) {
      setConfirmLoad(true)
      return
    }
    setTeam(sharedIds ?? [])
    setConfirmLoad(false)
    dropIdsParam()
  }

  const clearTeam = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clear()
    setConfirmClear(false)
  }

  const copyLabel =
    copied === 'ok' ? 'Copied ✓' : copied === 'fail' ? 'Copy failed' : 'Copy share link'

  return (
    <div className="container page-pad">
      <header className="tb-head">
        <div>
          <div className="eyebrow">
            {shared ? 'Shared squad' : 'Squad console'} · {members.length}/{TEAM_MAX} registered
          </div>
          <h1>Team Builder</h1>
        </div>
        {!shared && team.length > 0 && (
          <div className="tb-head-actions">
            <button type="button" className="btn" onClick={copyShareLink} aria-live="polite">
              {copyLabel}
            </button>
            <button
              type="button"
              className={`btn${confirmClear ? ' btn-primary' : ' btn-ghost'}`}
              onClick={clearTeam}
              aria-live="polite"
            >
              {confirmClear ? 'Confirm clear' : 'Clear team'}
            </button>
          </div>
        )}
      </header>

      {shared && (
        <div className="card tb-shared" role="region" aria-label="Shared team preview">
          <div className="tb-shared-copy">
            <div className="eyebrow">Incoming transmission</div>
            <strong>Viewing a shared team — read-only</strong>
            <p>
              Loading it replaces your saved team
              {team.length > 0 ? ` (currently ${team.length} member${team.length === 1 ? '' : 's'})` : ''}.
            </p>
          </div>
          <div className="tb-shared-actions">
            <button
              type="button"
              className={`btn${confirmLoad ? ' btn-primary' : ''}`}
              onClick={loadShared}
              aria-live="polite"
            >
              {confirmLoad ? 'Confirm overwrite' : 'Load this team'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={dropIdsParam}>
              Keep my team
            </button>
          </div>
        </div>
      )}

      {!shared && team.length === 0 ? (
        <EmptyState
          title="No squad registered"
          hint="Pick up to six Pokémon, then read the console: defensive multipliers across all 18 types, STAB coverage, and recruits to patch the gaps. Saved on this device, shareable by link."
        >
          <div className="tb-hero-add">
            <AddSearch
              index={index}
              exclude={[]}
              onPick={add}
              label="Add your first Pokémon"
              placeholder="Add your first Pokémon…"
            />
            <button type="button" className="btn" onClick={() => setTeam(CLASSIC_TEAM)}>
              Load a classic team
            </button>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="tb-slots">
            {Array.from({ length: TEAM_MAX }, (_, i) => {
              const id = ids[i]
              const s = id != null ? byId.get(id) : undefined
              if (s) {
                return (
                  <div
                    key={s.id}
                    className="tb-slot filled"
                    style={{ '--slot-accent': typeColor(s.types[0]) } as React.CSSProperties}
                  >
                    <span className="tb-slot-no mono" aria-hidden="true">
                      S{i + 1}
                    </span>
                    {!shared && (
                      <button
                        type="button"
                        className="tb-slot-remove"
                        aria-label={`Remove ${s.dname} from team`}
                        title="Remove from team"
                        onClick={() => remove(s.id)}
                      >
                        ✕
                      </button>
                    )}
                    <Sprite src={artUrl(s.id)} alt={s.dname} size={96} eager />
                    <span className="mono tb-slot-dex">{dexNo(s.id)}</span>
                    <Link to={`/pokemon/${s.id}`} className="tb-slot-name">
                      {s.dname}
                    </Link>
                    <span className="tb-slot-types">
                      {s.types.map(t => (
                        <TypeBadge key={t} type={t} size="sm" />
                      ))}
                    </span>
                  </div>
                )
              }
              return (
                <div key={`empty-${i}`} className="tb-slot empty">
                  <span className="tb-slot-no mono" aria-hidden="true">
                    S{i + 1}
                  </span>
                  {shared ? (
                    <span className="tb-slot-open mono dim">EMPTY</span>
                  ) : (
                    <>
                      <span className="eyebrow">Open slot</span>
                      <AddSearch
                        index={index}
                        exclude={team}
                        onPick={add}
                        label={`Add a Pokémon to slot ${i + 1}`}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {analysis && (
            <>
              <Section eyebrow="Defense" title="Type defense matrix">
                {analysis.soft.length > 0 ? (
                  <div className="tb-alert" role="status">
                    <span className="tb-alert-label mono">Team is soft against:</span>
                    {analysis.soft.map(t => (
                      <TypeBadge key={t} type={t} link />
                    ))}
                  </div>
                ) : (
                  <p className="dim tb-note">
                    No shared soft spots — no attacking type hits three or more members
                    super-effectively.
                  </p>
                )}
                <div className="tb-matrix-wrap">
                  <table className="data-table tb-matrix">
                    <caption className="visually-hidden">
                      Defensive damage multiplier per team member for each attacking type
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">ATK ↓</th>
                        {members.map(m => (
                          <th scope="col" key={m.id} className="tb-m-col">
                            <Link to={`/pokemon/${m.id}`} className="tb-m-link" title={m.dname}>
                              <Sprite src={spriteUrl(m.id)} alt={m.dname} size={40} pixelated />
                            </Link>
                          </th>
                        ))}
                        <th scope="col" className="tb-count-head" title="Members hit super-effectively">
                          Weak
                        </th>
                        <th scope="col" className="tb-count-head" title="Members resisting or immune">
                          Res
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.rows.map(r => (
                        <tr key={r.t} className={r.weak >= 3 ? 'tb-soft-row' : undefined}>
                          <th scope="row">
                            <TypeBadge type={r.t} size="sm" link />
                          </th>
                          {r.cells.map((c, i) => (
                            <td key={members[i].id} className={`tb-cell mono ${cellClass(c)}`}>
                              {c === 1 ? <span className="visually-hidden">×1</span> : cellText(c)}
                            </td>
                          ))}
                          <td
                            className={`tb-cell mono tb-count tb-count-weak${r.weak === 0 ? ' tb-zero' : ''}`}
                          >
                            {r.weak}
                          </td>
                          <td className={`tb-cell mono tb-count${r.resist === 0 ? ' tb-zero' : ''}`}>
                            {r.resist}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section eyebrow="Offense" title="STAB coverage">
                <div className="card tb-cov">
                  <div>
                    <div className="eyebrow">Your STABs hit super-effectively</div>
                    {analysis.covered.length > 0 ? (
                      <div className="tb-badges">
                        {analysis.covered.map(t => (
                          <TypeBadge key={t} type={t} link />
                        ))}
                      </div>
                    ) : (
                      <p className="dim tb-note">
                        Nothing — this squad has no super-effective STAB at all.
                      </p>
                    )}
                  </div>
                  {analysis.gaps.length > 0 ? (
                    <div className="tb-gaps-panel">
                      <div className="eyebrow">Coverage gaps — no super-effective STAB against</div>
                      <div className="tb-badges">
                        {analysis.gaps.map(t => (
                          <TypeBadge key={t} type={t} link />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="dim tb-note">
                      Full coverage — every type can be hit super-effectively by at least one STAB.
                    </p>
                  )}
                </div>
              </Section>

              <Section eyebrow="Instruments" title="Team readout">
                <div className="tb-readout">
                  <div className="tb-tiles">
                    <div className="tb-tile">
                      <div className="tt-val">{analysis.avgBst}</div>
                      <div className="tt-label eyebrow">Avg BST</div>
                    </div>
                    <div className="tb-tile">
                      <div className="tt-val">
                        {members.length}
                        <span className="tt-dim">/{TEAM_MAX}</span>
                      </div>
                      <div className="tt-label eyebrow">Members</div>
                    </div>
                    <div className="tb-tile">
                      <div className="tt-val">{analysis.legendaries}</div>
                      <div className="tt-label eyebrow">Legendary / Mythical</div>
                    </div>
                    <div className={`tb-tile${analysis.soft.length > 0 ? ' warn' : ''}`}>
                      <div className="tt-val">{analysis.soft.length}</div>
                      <div className="tt-label eyebrow">Shared weaknesses</div>
                    </div>
                    {analysis.soft.length > 0 && (
                      <div className="tb-tile warn tb-tile-wide" role="status">
                        <div className="tt-label eyebrow">Warning · 3+ members weak to</div>
                        <div className="tb-badges">
                          {analysis.soft.map(t => (
                            <TypeBadge key={t} type={t} size="sm" link />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card tb-avg">
                    <div className="eyebrow">Average base stats</div>
                    <StatBars stats={analysis.avgStats} max={160} />
                  </div>
                </div>
              </Section>

              {!shared && suggestions.length > 0 && (
                <Section
                  eyebrow="Recruitment"
                  title="Patch the gaps"
                  aside={
                    <span className="mono dim tb-aside">
                      {analysis.gaps.length} uncovered type{analysis.gaps.length === 1 ? '' : 's'}
                    </span>
                  }
                >
                  <p className="dim tb-note">
                    Recruits whose STABs cover the most missing types without stacking a shared ×4
                    weakness.
                  </p>
                  <div className="tb-sug-grid">
                    {suggestions.map(s => (
                      <PokeCard key={s.id} s={s} />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
