import { Link } from 'react-router-dom'
import { typeSlug } from '@/lib/dex'
import { cx } from '@/lib/cx'

const SIZES = {
  xs: 'h-[18px] px-1.5 text-[9px] tracking-[0.14em]',
  sm: 'h-[22px] px-2 text-[10px] tracking-[0.13em]',
  md: 'h-7 px-2.5 text-[11px] tracking-[0.12em]',
  lg: 'h-9 px-4 text-[13px] tracking-[0.1em]',
} as const

export interface TypeBadgeProps {
  typeId: number
  label: string
  size?: keyof typeof SIZES
  variant?: 'solid' | 'outline' | 'ghost'
  link?: boolean
  className?: string
}

export function TypeBadge({
  typeId,
  label,
  size = 'md',
  variant = 'solid',
  link = true,
  className,
}: TypeBadgeProps) {
  const slug = typeSlug(typeId)
  const style = { '--type': `var(--type-${slug})` } as React.CSSProperties

  const body = (
    <span
      style={style}
      className={cx(
        'inline-flex select-none items-center justify-center rounded-chip font-display font-semibold uppercase leading-none transition',
        SIZES[size],
        variant === 'solid' &&
          'text-[#0b0d12] [background:var(--type)] shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_1px_3px_rgb(0_0_0/0.3)]',
        variant === 'outline' &&
          'border [border-color:color-mix(in_oklab,var(--type)_55%,transparent)] [color:var(--type)] [background:color-mix(in_oklab,var(--type)_12%,transparent)]',
        variant === 'ghost' && '[color:var(--type)] [background:color-mix(in_oklab,var(--type)_14%,transparent)]',
        link && 'hover:brightness-110',
        className,
      )}
    >
      {label}
    </span>
  )

  if (!link) return body
  return (
    <Link to={`/types/${slug}`} className="rounded-chip focus-visible:outline-2">
      {body}
    </Link>
  )
}

export function TypeDot({ typeId, size = 8 }: { typeId: number; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `var(--type-${typeSlug(typeId)})`,
      }}
    />
  )
}
