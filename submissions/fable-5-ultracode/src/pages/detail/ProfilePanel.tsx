import { getItems } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import type { Meta, PokemonDetail, Variety } from '../../lib/types'
import { catchPercent, heightStr, titleCase, weightStr } from '../../lib/format'
import Sprite from '../../components/Sprite'

interface Props {
  detail: PokemonDetail
  variety: Variety
  meta: Meta
}

function HeldItems({ names }: { names: string[] }) {
  const { data: items } = useAsync(getItems, [])
  if (!items) return <span className="dim">Loading…</span>
  return (
    <span className="pd-held">
      {names.map(n => {
        const item = items.find(i => i.name === n)
        return (
          <span className="pd-held-item" key={n}>
            {item?.sprite && <Sprite src={item.sprite} alt="" size={24} />}
            {item?.dname ?? titleCase(n)}
          </span>
        )
      })}
    </span>
  )
}

const EM = '—'

export default function ProfilePanel({ detail, variety, meta }: Props) {
  const rows: [string, React.ReactNode][] = [
    ['Height', heightStr(variety.height)],
    ['Weight', weightStr(variety.weight)],
    ['Shape', detail.shape ? (meta.shapes[detail.shape] ?? titleCase(detail.shape)) : EM],
    ['Color', detail.color ? (meta.colors[detail.color] ?? titleCase(detail.color)) : EM],
    ['Habitat', detail.habitat ? titleCase(meta.habitats[detail.habitat] ?? detail.habitat) : EM],
    ['Catch rate', `${detail.captureRate} (${catchPercent(detail.captureRate)} at full HP)`],
    ['Base happiness', detail.baseHappiness ?? EM],
    ['Base experience', variety.baseExp ?? EM],
    [
      'Growth rate',
      detail.growthRate ? (meta.growthRates[detail.growthRate] ?? titleCase(detail.growthRate)) : EM
    ]
  ]
  return (
    <dl className="pd-dl card">
      {rows.map(([label, value]) => (
        <div className="pd-dl-item" key={label}>
          <dt className="eyebrow">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
      {variety.heldItems.length > 0 && (
        <div className="pd-dl-item pd-dl-wide">
          <dt className="eyebrow">Held items in the wild</dt>
          <dd>
            <HeldItems names={variety.heldItems} />
          </dd>
        </div>
      )}
    </dl>
  )
}
