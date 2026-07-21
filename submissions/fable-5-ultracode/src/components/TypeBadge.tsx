import { Link } from 'react-router-dom'
import { typeColor, typeInk } from '../lib/typeColors'
import { titleCase } from '../lib/format'

interface Props {
  type: string
  size?: 'sm' | 'md'
  link?: boolean
}

export default function TypeBadge({ type, size = 'md', link = false }: Props) {
  const style = { background: typeColor(type), color: typeInk(type) }
  const cls = `type-badge${size === 'sm' ? ' sm' : ''}`
  if (link) {
    return (
      <Link to={`/types?type=${type}`} className={cls} style={style}>
        {titleCase(type)}
      </Link>
    )
  }
  return (
    <span className={cls} style={style}>
      {titleCase(type)}
    </span>
  )
}
