import { TYPE_COLORS } from '../types/pokemon'

interface TypeBadgeProps {
  type: string
  interactive?: boolean
  onClick?: () => void
}

export function TypeBadge({ type, interactive, onClick }: TypeBadgeProps) {
  const color = TYPE_COLORS[type] || { bg: '#64748b', text: '#fff' }
  return (
    <span
      onClick={interactive && onClick ? onClick : undefined}
      className={`type-badge ${interactive ? 'cursor-pointer hover:brightness-105 active:scale-[0.96]' : ''}`}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {type}
    </span>
  )
}
