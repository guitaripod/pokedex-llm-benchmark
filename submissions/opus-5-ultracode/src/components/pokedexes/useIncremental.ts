import { useCallback, useEffect, useRef, useState } from 'react'

export interface Incremental {
  count: number
  remaining: number
  sentinelRef: React.RefObject<HTMLDivElement | null>
  showMore: () => void
}

/// Grows the rendered window as a sentinel approaches the viewport, so a 1025-entry dex never
/// mounts thousands of sprites at once. `resetKey` collapses the window when filters change.
export function useIncremental(total: number, resetKey: string, step = 120): Incremental {
  const [count, setCount] = useState(step)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setCount(step)
  }, [resetKey, step])

  const showMore = useCallback(() => setCount((current) => current + step), [step])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || count >= total) return
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showMore()
      },
      { rootMargin: '700px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [count, total, showMore])

  return { count: Math.min(count, total), remaining: Math.max(0, total - count), sentinelRef, showMore }
}
