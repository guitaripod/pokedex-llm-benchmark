import { useEffect, useState } from 'react'
import { cx } from '@/lib/cx'

export interface SpriteProps {
  /** Ordered candidate URLs; the first that loads wins. */
  sources: string[]
  alt: string
  className?: string
  imgClassName?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  pixelated?: boolean
  onLoaded?: () => void
}

/// Walks a fallback chain because alternate forms are missing from several sprite sets.
export function Sprite({
  sources,
  alt,
  className,
  imgClassName,
  loading = 'lazy',
  fetchPriority = 'auto',
  pixelated = false,
  onLoaded,
}: SpriteProps) {
  const key = sources.join('|')
  const [index, setIndex] = useState(0)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    setIndex(0)
    setSettled(false)
  }, [key])

  const exhausted = index >= sources.length

  return (
    <span className={cx('relative block', className)}>
      {!settled && !exhausted && (
        <span className="absolute inset-0 animate-pulse rounded-full bg-[color-mix(in_oklab,var(--ui-text-faint)_12%,transparent)]" />
      )}
      {exhausted ? (
        <span
          role="img"
          aria-label={alt}
          className="flex h-full w-full items-center justify-center text-faint"
        >
          <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h6m6 0h6" />
            <circle cx="12" cy="12" r="2.75" />
          </svg>
        </span>
      ) : (
        <img
          key={sources[index]}
          src={sources[index]}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          draggable={false}
          onLoad={() => {
            setSettled(true)
            onLoaded?.()
          }}
          onError={() => setIndex((current) => current + 1)}
          className={cx(
            'h-full w-full object-contain transition-opacity duration-300',
            settled ? 'opacity-100' : 'opacity-0',
            pixelated && '[image-rendering:pixelated]',
            imgClassName,
          )}
        />
      )}
    </span>
  )
}
