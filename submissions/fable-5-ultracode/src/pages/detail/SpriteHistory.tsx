import { useMemo, useState } from 'react'
import type { SpriteEra } from '../../lib/types'
import { GEN_ROMAN } from '../../lib/format'
import Sprite from '../../components/Sprite'

interface Props {
  history: SpriteEra[]
  name: string
}

export default function SpriteHistory({ history, name }: Props) {
  const [shiny, setShiny] = useState(false)
  const gens = useMemo(() => {
    const m = new Map<number, SpriteEra[]>()
    for (const era of history) {
      const list = m.get(era.gen) ?? []
      list.push(era)
      m.set(era.gen, list)
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [history])
  const hasShiny = history.some(h => h.shiny)

  return (
    <div className="pd-lcd-wrap">
      {hasShiny && (
        <div className="pd-lcd-tools">
          <button
            type="button"
            className="btn btn-sm pd-shiny-btn"
            aria-pressed={shiny}
            onClick={() => setShiny(s => !s)}
          >
            <span aria-hidden="true">✦</span> Shiny
          </button>
        </div>
      )}
      {gens.map(([gen, eras]) => (
        <div className="pd-lcd-gen" key={gen}>
          <div className="pd-lcd-genlabel mono">Gen {GEN_ROMAN[gen] ?? gen}</div>
          <div className="pd-lcd-grid">
            {eras.map((era, i) => {
              const src = shiny && era.shiny ? era.shiny : era.front
              return (
                <figure className="pd-lcd" key={`${era.game}-${i}`}>
                  <div className="pd-lcd-screen">
                    <Sprite
                      key={src}
                      src={src}
                      alt={`${name} sprite from ${era.game}${shiny && era.shiny ? ' (shiny)' : ''}`}
                      size={96}
                      pixelated
                    />
                  </div>
                  <figcaption className="pd-lcd-label mono">{era.game}</figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
