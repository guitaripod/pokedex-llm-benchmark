import { Link } from 'react-router-dom'
import { getAbilities } from '../../lib/api'
import { useAsync } from '../../lib/hooks'
import { titleCase } from '../../lib/format'

interface Props {
  abilities: { n: string; h: boolean }[]
}

export default function AbilitiesPanel({ abilities }: Props) {
  const { data: all } = useAsync(getAbilities, [])
  return (
    <div className="pd-abilities">
      {abilities.map(a => {
        const info = all?.find(x => x.name === a.n)
        const name = info?.dname ?? titleCase(a.n)
        return (
          <div className="pd-ability card" key={a.n}>
            <div className="pd-ability-head">
              {info ? (
                <Link to={`/abilities/${info.id}`} className="pd-ability-name">
                  {name}
                </Link>
              ) : (
                <span className="pd-ability-name">{name}</span>
              )}
              {a.h && <span className="chip pd-hidden-chip">Hidden</span>}
            </div>
            {info?.effect ? (
              <p className="pd-ability-effect dim">{info.effect}</p>
            ) : (
              <div className="skeleton" style={{ height: 38 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
