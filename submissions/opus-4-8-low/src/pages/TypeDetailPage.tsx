import { useParams } from 'react-router-dom'
import { apiGet, titleCase } from '../lib/api'
import type { TypeInfo } from '../lib/types'
import { useAsync } from '../hooks/useAsync'
import { TYPE_COLORS } from '../lib/constants'
import { ErrorState, Loader, SectionTitle, TypeBadge } from '../components/ui'
import { BY_NAME } from '../lib/data'
import { PokemonCard } from '../components/PokemonCard'

export function TypeDetailPage() {
  const { name } = useParams()
  const { data, loading, error } = useAsync(() => apiGet<TypeInfo>(`type/${name}`), [name])

  if (loading) return <Loader />
  if (error || !data) return <ErrorState message={error?.message ?? 'Not found'} />

  const c = TYPE_COLORS[data.name] ?? TYPE_COLORS.unknown
  const rel = data.damage_relations
  const mons = data.pokemon
    .map((p) => BY_NAME.get(p.pokemon.name))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .sort((a, b) => a.id - b.id)

  const Group = ({ label, list }: { label: string; list: { name: string }[] }) => (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase text-slate-500">{label}</div>
      {list.length ? (
        <div className="flex flex-wrap gap-1.5">
          {list.map((t) => (
            <TypeBadge key={t.name} type={t.name} size="sm" />
          ))}
        </div>
      ) : (
        <span className="text-sm text-slate-400">None</span>
      )}
    </div>
  )

  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
        <h1 className="text-4xl font-black uppercase tracking-tight">{titleCase(data.name)}</h1>
        <p className="mt-1 font-semibold text-white/90">{mons.length} Pokémon · {data.moves.length} moves</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <SectionTitle icon="⚔️">Attacking</SectionTitle>
          <div className="space-y-4">
            <Group label="Super effective against (2×)" list={rel.double_damage_to} />
            <Group label="Not very effective against (½×)" list={rel.half_damage_to} />
            <Group label="No effect against (0×)" list={rel.no_damage_to} />
          </div>
        </div>
        <div className="card p-6">
          <SectionTitle icon="🛡️">Defending</SectionTitle>
          <div className="space-y-4">
            <Group label="Weak to (2×)" list={rel.double_damage_from} />
            <Group label="Resists (½×)" list={rel.half_damage_from} />
            <Group label="Immune to (0×)" list={rel.no_damage_from} />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle icon="📋">{titleCase(data.name)}-type Pokémon</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {mons.map((p) => (
            <PokemonCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
