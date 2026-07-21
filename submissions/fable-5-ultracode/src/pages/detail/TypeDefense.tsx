import type { TypesData } from '../../lib/types'
import { defenseProfile, weaknessBuckets } from '../../lib/typechart'
import TypeBadge from '../../components/TypeBadge'

interface Props {
  types: string[]
  td: TypesData
}

export default function TypeDefense({ types, td }: Props) {
  const buckets = weaknessBuckets(defenseProfile(types, td))
  const rows: [string, string[]][] = [
    ['Weak ×4', buckets.x4],
    ['Weak ×2', buckets.x2],
    ['Resists ×½', buckets.half],
    ['Resists ×¼', buckets.quarter],
    ['Immune ×0', buckets.immune]
  ]
  const visible = rows.filter(([, list]) => list.length > 0)
  if (visible.length === 0) {
    return <p className="dim">Takes neutral damage from every attacking type.</p>
  }
  return (
    <div className="pd-defense card">
      {visible.map(([label, list]) => (
        <div className="pd-def-row" key={label}>
          <span className="pd-def-label mono">{label}</span>
          <span className="pd-def-badges">
            {list.map(t => (
              <TypeBadge key={t} type={t} link />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
