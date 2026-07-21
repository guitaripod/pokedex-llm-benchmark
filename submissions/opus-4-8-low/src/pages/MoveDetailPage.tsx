import { useParams } from 'react-router-dom'
import { apiGet, englishText, titleCase } from '../lib/api'
import type { Move } from '../lib/types'
import { useAsync } from '../hooks/useAsync'
import { ErrorState, Loader, SectionTitle, TypeBadge } from '../components/ui'
import { TYPE_COLORS } from '../lib/constants'
import { BY_NAME } from '../lib/data'
import { PokemonCard } from '../components/PokemonCard'

const CLASS_ICON: Record<string, string> = { physical: '💥', special: '🌀', status: '✨' }

export function MoveDetailPage() {
  const { name } = useParams()
  const { data, loading, error } = useAsync(() => apiGet<Move>(`move/${name}`), [name])
  if (loading) return <Loader />
  if (error || !data) return <ErrorState message={error?.message ?? 'Not found'} />

  const c = TYPE_COLORS[data.type.name] ?? TYPE_COLORS.unknown
  const effect = englishText(data.effect_entries).replace('$effect_chance%', `${data.effect_chance ?? 0}%`)
  const flavor = englishText(data.flavor_text_entries)
  const mons = data.learned_by_pokemon.map((p) => BY_NAME.get(p.name)).filter((p): p is NonNullable<typeof p> => Boolean(p)).sort((a, b) => a.id - b.id)

  const stats = [
    { label: 'Power', value: data.power ?? '—' },
    { label: 'Accuracy', value: data.accuracy ? `${data.accuracy}%` : '—' },
    { label: 'PP', value: data.pp ?? '—' },
    { label: 'Priority', value: data.priority },
    { label: 'Class', value: `${CLASS_ICON[data.damage_class?.name ?? ''] ?? ''} ${titleCase(data.damage_class?.name ?? '—')}` },
    { label: 'Target', value: titleCase(data.target?.name ?? '—') },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
        <h1 className="text-4xl font-black tracking-tight">{titleCase(data.name)}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TypeBadge type={data.type.name} link={false} />
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{titleCase(data.generation.name)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-xs font-bold uppercase text-slate-500">{s.label}</div>
            <div className="mt-1 text-xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <SectionTitle icon="📖">Effect</SectionTitle>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">{effect || flavor || 'No description available.'}</p>
        {data.meta && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {data.meta.ailment?.name && data.meta.ailment.name !== 'none' && (
              <span className="pill bg-slate-100 dark:bg-white/10">Ailment: {titleCase(data.meta.ailment.name)}</span>
            )}
            {data.meta.crit_rate > 0 && <span className="pill bg-slate-100 dark:bg-white/10">+{data.meta.crit_rate} crit</span>}
            {data.meta.drain !== 0 && <span className="pill bg-slate-100 dark:bg-white/10">Drain {data.meta.drain}%</span>}
            {data.meta.healing !== 0 && <span className="pill bg-slate-100 dark:bg-white/10">Heal {data.meta.healing}%</span>}
            {data.meta.flinch_chance > 0 && <span className="pill bg-slate-100 dark:bg-white/10">{data.meta.flinch_chance}% flinch</span>}
          </div>
        )}
      </div>

      <div>
        <SectionTitle icon="📋">{mons.length} Pokémon can learn this</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {mons.slice(0, 120).map((p) => (
            <PokemonCard key={p.id} p={p} />
          ))}
        </div>
        {mons.length > 120 && <p className="mt-4 text-center text-sm text-slate-400">Showing first 120 of {mons.length}.</p>}
      </div>
    </div>
  )
}
