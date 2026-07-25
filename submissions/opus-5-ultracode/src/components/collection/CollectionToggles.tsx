import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Controls'
import { useApp } from '@/lib/store'
import { cx } from '@/lib/cx'

export function FavoriteToggle({ pokemonId, label }: { pokemonId: number; label: string }) {
  const favorite = useApp((state) => state.favorites.includes(pokemonId))
  const toggleFavorite = useApp((state) => state.toggleFavorite)

  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? `Remove ${label} from favourites` : `Add ${label} to favourites`}
      title={favorite ? 'Remove from favourites' : 'Add to favourites'}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        toggleFavorite(pokemonId)
      }}
      className={cx(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition',
        favorite
          ? 'border-transparent bg-[var(--type-fighting)]/20 text-[var(--type-fighting)]'
          : 'border-line bg-surface text-faint hover:text-ink',
      )}
    >
      <svg viewBox="0 0 20 20" aria-hidden className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.6">
        <path
          d="M10 16.5 4.2 11a3.6 3.6 0 0 1 5.1-5.1l.7.7.7-.7a3.6 3.6 0 1 1 5.1 5.1Z"
          fill={favorite ? 'currentColor' : 'none'}
        />
      </svg>
    </button>
  )
}

/// Destructive action that arms itself on first click and disarms after a few idle seconds.
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  label: string
  confirmLabel: string
  onConfirm: () => void
  disabled?: boolean
}) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const disarm = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setArmed(false)
  }

  return (
    <Button
      variant={armed ? 'danger' : 'ghost'}
      size="sm"
      disabled={disabled}
      onBlur={disarm}
      onClick={() => {
        if (!armed) {
          setArmed(true)
          timer.current = setTimeout(() => setArmed(false), 4000)
          return
        }
        disarm()
        onConfirm()
      }}
    >
      {armed ? confirmLabel : label}
    </Button>
  )
}
