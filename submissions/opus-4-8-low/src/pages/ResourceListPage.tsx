import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, titleCase } from '../lib/api'
import type { ListResponse, NamedRef } from '../lib/types'
import { useAsync } from '../hooks/useAsync'
import { ErrorState, Loader, PokeballIcon } from '../components/ui'

const PAGE = 60

export function ResourceListPage({
  resource,
  title,
  subtitle,
  gradient,
  basePath,
  icon,
}: {
  resource: string
  title: string
  subtitle: string
  gradient: string
  basePath: string
  icon: string
}) {
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  const { data, loading, error } = useAsync(() => apiGet<ListResponse>(`${resource}?limit=100000`), [resource])

  const filtered = useMemo(() => {
    const items = (data?.results ?? []).filter((r) => !r.name.includes('-mega') || true)
    const s = q.trim().toLowerCase()
    return s ? items.filter((r) => r.name.includes(s)) : items
  }, [data, q])

  useEffect(() => setLimit(PAGE), [q])
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setLimit((l) => l + PAGE), { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [filtered.length])

  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl" style={{ background: gradient }}>
        <PokeballIcon className="absolute -bottom-8 -right-8 h-44 w-44 text-white/10" />
        <h1 className="text-3xl font-black tracking-tight">
          {icon} {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-white/90">{subtitle}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/80">{filtered.length} entries</p>
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          className="w-full rounded-full border border-slate-200 bg-white/80 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.slice(0, limit).map((r: NamedRef) => (
              <Link
                key={r.name}
                to={`${basePath}/${r.name}`}
                className="rounded-xl glass px-4 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:text-red-500 hover:shadow-md"
              >
                {titleCase(r.name)}
              </Link>
            ))}
          </div>
          {limit < filtered.length && (
            <div ref={sentinel} className="flex justify-center py-8">
              <PokeballIcon className="h-7 w-7 text-red-500" spinning />
            </div>
          )}
        </>
      )}
    </div>
  )
}
