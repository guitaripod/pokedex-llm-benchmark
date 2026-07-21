import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { Pokemon } from '../types/pokemon'

interface VirtualPokemonGridProps {
  items: Pokemon[]
  renderItem: (pokemon: Pokemon, index: number) => React.ReactNode
  minCardWidth?: number
  rowHeight?: number
  overscan?: number
  gap?: number
}

export function VirtualPokemonGrid({
  items,
  renderItem,
  minCardWidth = 160,
  rowHeight = 170,
  overscan = 3,
  gap = 12,
}: VirtualPokemonGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const [numCols, setNumCols] = useState(6)

  // Recalculate columns on resize
  const updateLayout = useCallback(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    const cols = Math.max(2, Math.floor((width + gap) / (minCardWidth + gap)))
    setNumCols(cols)
  }, [minCardWidth, gap])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight)
      updateLayout()
    })
    ro.observe(el)

    // initial
    setContainerHeight(el.clientHeight)
    updateLayout()

    return () => ro.disconnect()
  }, [updateLayout])

  // Scroll handler
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const cols = numCols || 1
    const totalRows = Math.ceil(items.length / cols)
    const totalH = totalRows * rowHeight + (totalRows - 1) * gap

    const firstVisibleRow = Math.floor(scrollTop / (rowHeight + gap))
    const visibleRows = Math.ceil(containerHeight / (rowHeight + gap)) + 1

    let startRow = Math.max(0, firstVisibleRow - overscan)
    let endRow = Math.min(totalRows, firstVisibleRow + visibleRows + overscan)

    const start = startRow * cols
    const end = Math.min(items.length, endRow * cols)

    const offset = startRow * (rowHeight + gap)

    return {
      startIndex: start,
      endIndex: end,
      totalHeight: totalH,
      offsetY: offset,
    }
  }, [items.length, scrollTop, containerHeight, numCols, rowHeight, gap, overscan])

  const visibleItems = items.slice(startIndex, endIndex)

  return (
    <div
      ref={containerRef}
      className="overflow-auto h-[calc(100vh-180px)] sm:h-[calc(100vh-140px)]"
      onScroll={onScroll}
      style={{ contain: 'strict' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${numCols}, 1fr)`,
            gap: gap,
          }}
        >
          {visibleItems.map((pokemon, i) => {
            const realIndex = startIndex + i
            return (
              <div key={pokemon.id} style={{ minHeight: rowHeight }}>
                {renderItem(pokemon, realIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
