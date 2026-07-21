import { useParams } from 'react-router-dom'
import { apiGet, englishText, titleCase } from '../lib/api'
import type { Ability } from '../lib/types'
import { useAsync } from '../hooks/useAsync'
import { ErrorState, Loader, SectionTitle } from '../components/ui'
import { BY_NAME } from '../lib/data'
import { PokemonCard } from '../components/PokemonCard'

export function AbilityDetailPage() {
  const { name } = useParams()
  const { data, loading, error } = useAsync(() => apiGet<Ability>(`ability/${name}`), [name])
  if (loading) return <Loader />
  if (error || !data) return <ErrorState message={error?.message ?? 'Not found'} />

  const effect = englishText(data.effect_entries)
  const flavor = englishText(data.flavor_text_entries)
  const mons = data.pokemon
    .map((p) => ({ mon: BY_NAME.get(p.pokemon.name), hidden: p.is_hidden }))
    .filter((x) => x.mon)
    .sort((a, b) => (a.mon!.id - b.mon!.id))

  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-8 text-white shadow-xl">
        <h1 className="text-4xl font-black tracking-tight">{titleCase(data.name)}</h1>
        <p className="mt-1 font-semibold text-white/90">Ability · Introduced in {titleCase(data.generation.name)}</p>
      </div>

      <div className="card p-6">
        <SectionTitle icon="✨">Effect</SectionTitle>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">{effect || flavor || 'No description available.'}</p>
        {flavor && flavor !== effect && <p className="mt-3 text-sm italic text-slate-500">"{flavor}"</p>}
      </div>

      <div>
        <SectionTitle icon="📋">{mons.length} Pokémon with this ability</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {mons.map(({ mon }) => (
            <PokemonCard key={mon!.id} p={mon!} />
          ))}
        </div>
      </div>
    </div>
  )
}
