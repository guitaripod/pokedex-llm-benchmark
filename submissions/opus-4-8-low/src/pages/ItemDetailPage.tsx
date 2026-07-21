import { useParams } from 'react-router-dom'
import { apiGet, englishText, itemSpriteUrl, titleCase } from '../lib/api'
import type { Item } from '../lib/types'
import { useAsync } from '../hooks/useAsync'
import { ErrorState, Loader, SectionTitle } from '../components/ui'

export function ItemDetailPage() {
  const { name } = useParams()
  const { data, loading, error } = useAsync(() => apiGet<Item>(`item/${name}`), [name])
  if (loading) return <Loader />
  if (error || !data) return <ErrorState message={error?.message ?? 'Not found'} />

  const effect = englishText(data.effect_entries)
  const flavor = data.flavor_text_entries.find((f) => f.language.name === 'en')?.text.replace(/[\n\f\r]+/g, ' ') ?? ''

  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative flex items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 p-8 text-white shadow-xl">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
          <img src={data.sprites.default ?? itemSpriteUrl(data.name)} alt={data.name} className="h-16 w-16 object-contain [image-rendering:pixelated]" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight">{titleCase(data.name)}</h1>
          <p className="mt-1 font-semibold text-white/90">{titleCase(data.category.name)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Cost</div>
          <div className="mt-1 text-xl font-black">{data.cost ? `₽${data.cost}` : '—'}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Fling Power</div>
          <div className="mt-1 text-xl font-black">{data.fling_power ?? '—'}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Category</div>
          <div className="mt-1 text-sm font-black">{titleCase(data.category.name)}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Attributes</div>
          <div className="mt-1 text-xs font-semibold">{data.attributes.map((a) => titleCase(a.name)).join(', ') || '—'}</div>
        </div>
      </div>

      <div className="card p-6">
        <SectionTitle icon="📖">Effect</SectionTitle>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">{effect || flavor || 'No description available.'}</p>
        {flavor && flavor !== effect && <p className="mt-3 text-sm italic text-slate-500">"{flavor}"</p>}
      </div>
    </div>
  )
}
