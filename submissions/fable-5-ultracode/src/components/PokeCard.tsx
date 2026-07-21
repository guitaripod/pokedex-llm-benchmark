import { Link } from 'react-router-dom'
import type { SpeciesIndex } from '../lib/types'
import { artUrl } from '../lib/api'
import { dexNo } from '../lib/format'
import { typeColor } from '../lib/typeColors'
import Sprite from './Sprite'
import TypeBadge from './TypeBadge'
import FavButton from './FavButton'

interface Props {
  s: SpeciesIndex
  eager?: boolean
}

export default function PokeCard({ s, eager }: Props) {
  return (
    <div
      className="poke-card-wrap"
      style={{ '--card-accent': typeColor(s.types[0]) } as React.CSSProperties}
    >
      <Link to={`/pokemon/${s.id}`} className="poke-card">
        {(s.legendary || s.mythical) && (
          <span className="pc-mark" title={s.mythical ? 'Mythical' : 'Legendary'} aria-hidden="true">
            {s.mythical ? '✦' : '★'}
          </span>
        )}
        <Sprite src={artUrl(s.id)} alt="" size={96} eager={eager} />
        <span className="pc-no">{dexNo(s.id)}</span>
        <span className="pc-name">{s.dname}</span>
        <span className="pc-types">
          {s.types.map(t => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </span>
      </Link>
      <FavButton id={s.id} name={s.dname} />
    </div>
  )
}
