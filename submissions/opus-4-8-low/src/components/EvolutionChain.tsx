import { Link } from 'react-router-dom'
import type { EvoNode, EvoDetail } from '../lib/types'
import { BY_NAME } from '../lib/data'
import { artworkUrl, spriteUrl, titleCase, idFromUrl } from '../lib/api'

function conditionText(d: EvoDetail): string {
  const parts: string[] = []
  const trig = d.trigger?.name
  if (d.min_level) parts.push(`Lv. ${d.min_level}`)
  if (trig === 'trade') parts.push('Trade')
  if (trig === 'use-item' && d.item) parts.push(titleCase(d.item.name))
  if (d.held_item) parts.push(`hold ${titleCase(d.held_item.name)}`)
  if (d.known_move) parts.push(`knows ${titleCase(d.known_move.name)}`)
  if (d.min_happiness) parts.push('high friendship')
  if (d.min_affection) parts.push('high affection')
  if (d.time_of_day) parts.push(`${d.time_of_day}`)
  if (d.location) parts.push(`at ${titleCase(d.location.name)}`)
  if (d.gender === 1) parts.push('♀')
  if (d.gender === 2) parts.push('♂')
  if (d.needs_overworld_rain) parts.push('in rain')
  if (!parts.length && trig) parts.push(titleCase(trig))
  return parts.join(', ')
}

function Node({ node }: { node: EvoNode }) {
  const id = BY_NAME.get(node.species.name)?.id ?? idFromUrl(node.species.url)
  return (
    <Link to={`/pokemon/${id}`} className="group flex flex-col items-center">
      <div className="grid h-24 w-24 place-items-center rounded-2xl glass transition-transform group-hover:-translate-y-1 group-hover:shadow-lg">
        <img
          src={artworkUrl(id)}
          alt={node.species.name}
          className="h-20 w-20 object-contain"
          onError={(e) => ((e.target as HTMLImageElement).src = spriteUrl(id))}
        />
      </div>
      <span className="mt-1 text-xs font-bold">{titleCase(node.species.name)}</span>
      <span className="text-[10px] text-slate-400">#{String(id).padStart(4, '0')}</span>
    </Link>
  )
}

function Branch({ node }: { node: EvoNode }) {
  return (
    <div className="flex items-center gap-3">
      <Node node={node} />
      {node.evolves_to.length > 0 && (
        <div className="flex flex-col gap-3">
          {node.evolves_to.map((child, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center px-1 text-slate-400">
                <span className="max-w-[90px] text-center text-[10px] font-semibold leading-tight">
                  {conditionText(child.evolution_details[0] ?? ({} as EvoDetail))}
                </span>
                <span className="text-xl">→</span>
              </div>
              <Branch node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EvolutionChain({ chain }: { chain: EvoNode }) {
  if (chain.evolves_to.length === 0) {
    return <p className="text-sm text-slate-400">This Pokémon does not evolve.</p>
  }
  return (
    <div className="overflow-x-auto pb-2">
      <Branch node={chain} />
    </div>
  )
}
