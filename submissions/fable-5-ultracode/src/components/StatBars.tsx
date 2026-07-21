import { useEffect, useRef, useState } from 'react'
import { STAT_LABELS } from '../lib/format'

interface Props {
  stats: number[]
  max?: number
}

export default function StatBars({ stats, max = 255 }: Props) {
  const [armed, setArmed] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setArmed(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const bst = stats.reduce((a, b) => a + b, 0)
  return (
    <div className="stat-bars" ref={ref}>
      {stats.map((v, i) => (
        <div className="stat-row" key={STAT_LABELS[i]}>
          <span className="sr-label">{STAT_LABELS[i]}</span>
          <span className="sr-val">{v}</span>
          <div
            className="sr-track"
            role="meter"
            aria-valuenow={v}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={STAT_LABELS[i]}
          >
            <div className="sr-fill" style={{ width: armed ? `${(v / max) * 100}%` : '0%' }} />
          </div>
        </div>
      ))}
      <div className="stat-total">
        <span className="sr-label">Total</span>
        <span className="sr-val mono">{bst}</span>
      </div>
    </div>
  )
}
