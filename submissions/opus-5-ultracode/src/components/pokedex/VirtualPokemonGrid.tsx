import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { PokemonCard } from '@/components/pokemon/PokemonCard'
import type { PokemonIndexEntry } from '@/types/data'

const GAP = 12
const LAYOUT = {
  comfortable: { minCard: 152, rowHeight: 252 },
  compact: { minCard: 118, rowHeight: 190 },
} as const

export interface VirtualPokemonGridProps {
  entries: PokemonIndexEntry[]
  compact: boolean
  /** Changing this scrolls the viewport back to the top of the grid. */
  resetKey: string
}

interface GridMetrics {
  width: number
  offsetTop: number
}

/// Column count follows the container width; the window virtualiser needs its document offset too.
function useGridMetrics(ref: React.RefObject<HTMLElement | null>): GridMetrics {
  const [metrics, setMetrics] = useState<GridMetrics>({ width: 0, offsetTop: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      const next = {
        width: element.clientWidth,
        offsetTop: element.getBoundingClientRect().top + window.scrollY,
      }
      setMetrics((current) =>
        Math.abs(current.width - next.width) < 0.5 && Math.abs(current.offsetTop - next.offsetTop) < 0.5
          ? current
          : next,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])

  return metrics
}

export function VirtualPokemonGrid({ entries, compact, resetKey }: VirtualPokemonGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, offsetTop } = useGridMetrics(containerRef)
  const layout = compact ? LAYOUT.compact : LAYOUT.comfortable

  const columns = useMemo(() => {
    if (width <= 0) return 2
    return Math.max(2, Math.floor((width + GAP) / (layout.minCard + GAP)))
  }, [width, layout.minCard])

  const rowCount = Math.ceil(entries.length / columns)

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => layout.rowHeight + GAP,
    overscan: 4,
    scrollMargin: offsetTop,
    getItemKey: (index) => index,
  })

  useEffect(() => {
    virtualizer.measure()
  }, [virtualizer, columns, compact])

  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (window.scrollY > offsetTop) window.scrollTo({ top: offsetTop, behavior: 'instant' as ScrollBehavior })
  }, [resetKey, offsetTop])

  const rows = virtualizer.getVirtualItems()

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: rowCount > 0 ? virtualizer.getTotalSize() : 0 }}
    >
      {rows.map((row) => {
        const start = row.index * columns
        const slice = entries.slice(start, start + columns)
        return (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)` }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: GAP,
                paddingBottom: GAP,
                minHeight: layout.rowHeight,
              }}
            >
              {slice.map((entry) => (
                <PokemonCard key={entry.id} entry={entry} compact={compact} eager={row.index < 2} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
