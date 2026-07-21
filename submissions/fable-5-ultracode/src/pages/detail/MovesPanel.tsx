import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMoves } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import type { Meta, MoveIndex, Variety } from '../../lib/types'
import { GEN_ROMAN, titleCase } from '../../lib/format'
import { DMG_CLASS_COLORS } from '../../lib/typeColors'
import TypeBadge from '../../components/TypeBadge'
import Tabs from '../../components/Tabs'
import Loader from '../../components/Loader'

const TAB_ORDER = ['level-up', 'machine', 'egg', 'tutor', 'other'] as const
type TabId = (typeof TAB_ORDER)[number]

const TAB_LABELS: Record<TabId, string> = {
  'level-up': 'Level-up',
  machine: 'TM / Machine',
  egg: 'Egg',
  tutor: 'Tutor',
  other: 'Other'
}

interface Row {
  name: string
  level: number
}

interface Props {
  variety: Variety
  meta: Meta
}

export default function MovesPanel({ variety, meta }: Props) {
  const { data: moves } = useAsync(getMoves, [])

  const byName = useMemo(() => {
    const m = new Map<string, MoveIndex>()
    for (const mv of moves ?? []) m.set(mv.name, mv)
    return m
  }, [moves])

  const vgIndices = useMemo(() => {
    const set = new Set<number>()
    for (const [, entries] of variety.moves) for (const e of entries) set.add(e[0])
    return [...set].sort((a, b) => a - b)
  }, [variety])

  const [vgIdx, setVgIdx] = useState(() => vgIndices[vgIndices.length - 1] ?? 0)
  const [tab, setTab] = useState<TabId>('level-up')

  const buckets = useMemo(() => {
    const b: Record<TabId, Row[]> = { 'level-up': [], machine: [], egg: [], tutor: [], other: [] }
    for (const [name, entries] of variety.moves) {
      const seen = new Set<string>()
      for (const [vi, mi, level] of entries) {
        if (vi !== vgIdx) continue
        const mname = meta.methods[mi]?.name
        const t: TabId =
          mname === 'level-up' || mname === 'machine' || mname === 'egg' || mname === 'tutor'
            ? mname
            : 'other'
        const dedupe = `${t}:${level}`
        if (seen.has(dedupe)) continue
        seen.add(dedupe)
        b[t].push({ name, level })
      }
    }
    const label = (r: Row) => byName.get(r.name)?.dname ?? r.name
    b['level-up'].sort((x, y) => x.level - y.level || label(x).localeCompare(label(y)))
    for (const t of ['machine', 'egg', 'tutor', 'other'] as const) {
      b[t].sort((x, y) => label(x).localeCompare(label(y)))
    }
    return b
  }, [variety, meta, vgIdx, byName])

  const available = TAB_ORDER.filter(t => buckets[t].length > 0)
  const activeTab = available.includes(tab) ? tab : available[0]

  if (!moves) {
    return (
      <div className="pd-moves card">
        <Loader label="Loading move data…" />
      </div>
    )
  }

  const rows = activeTab ? buckets[activeTab] : []

  return (
    <div className="pd-moves card">
      <div className="pd-moves-bar">
        <div className="pd-moves-vg">
          <label className="visually-hidden" htmlFor="pd-vg">
            Game version group
          </label>
          <select
            id="pd-vg"
            className="select"
            value={vgIdx}
            onChange={e => setVgIdx(Number(e.target.value))}
          >
            {vgIndices.map(i => {
              const vg = meta.vgs[i]
              return (
                <option key={i} value={i}>
                  {vg ? `${vg.dname} · Gen ${GEN_ROMAN[vg.gen] ?? vg.gen}` : `Version group ${i}`}
                </option>
              )
            })}
          </select>
        </div>
        <span className="mono dim pd-readout" aria-live="polite">
          {rows.length} {rows.length === 1 ? 'move' : 'moves'}
        </span>
      </div>

      {available.length > 0 && activeTab ? (
        <>
          <Tabs
            tabs={available.map(t => ({ id: t, label: TAB_LABELS[t] }))}
            active={activeTab}
            onChange={id => setTab(id as TabId)}
            label="Learn method"
          />
          <div className="pd-moves-tablewrap">
            <table className="data-table">
              <thead>
                <tr>
                  {activeTab === 'level-up' && <th scope="col">Lv</th>}
                  <th scope="col">Move</th>
                  <th scope="col">Type</th>
                  <th scope="col">Cat.</th>
                  <th scope="col">Power</th>
                  <th scope="col">Acc.</th>
                  <th scope="col">PP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const mi = byName.get(r.name)
                  return (
                    <tr key={`${r.name}:${r.level}`}>
                      {activeTab === 'level-up' && (
                        <td className="num">{r.level === 0 ? 'Evo.' : r.level}</td>
                      )}
                      <td>
                        {mi ? (
                          <Link to={`/moves/${mi.id}`}>{mi.dname}</Link>
                        ) : (
                          titleCase(r.name)
                        )}
                      </td>
                      <td>{mi ? <TypeBadge type={mi.type} size="sm" /> : '—'}</td>
                      <td>
                        {mi ? (
                          <span className="pd-cat">
                            <i
                              style={{ background: DMG_CLASS_COLORS[mi.dclass] }}
                              aria-hidden="true"
                            />
                            {titleCase(mi.dclass)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="num">{mi?.power ?? '—'}</td>
                      <td className="num">{mi?.acc != null ? `${mi.acc}%` : '—'}</td>
                      <td className="num">{mi?.pp ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="dim">No move data for this version group.</p>
      )}
    </div>
  )
}
