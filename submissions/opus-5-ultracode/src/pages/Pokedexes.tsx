import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { SearchInput, Segmented } from '@/components/ui/Controls'
import { ProgressBar, SpriteStrip } from '@/components/pokedexes/DexBits'
import {
  accentForType,
  dominantTypeId,
  formatPercent,
  percent,
  useDexMembers,
  type DexMember,
} from '@/components/pokedexes/dexData'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { cx } from '@/lib/cx'
import type { PokedexInfo } from '@/types/data'

type Scope = 'all' | 'main' | 'side'

interface DexGroup {
  key: string
  title: string
  eyebrow: string
  dexes: PokedexInfo[]
}

const NATIONAL_ID = 1
const SPECIES_TOTAL = 1025

export default function Pokedexes() {
  const dex = useDex()
  const members = useDexMembers()
  const caught = useApp((state) => state.caught)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('all')

  const caughtSet = useMemo(() => new Set(caught), [caught])

  const national = dex.meta.pokedexes.find((entry) => entry.id === NATIONAL_ID)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const regionLabel = (regionId: number | null) =>
      regionId === null ? '' : (dex.meta.regions.find((region) => region.id === regionId)?.label ?? '')
    return dex.meta.pokedexes.filter((entry) => {
      if (scope === 'main' && !entry.isMainSeries) return false
      if (scope === 'side' && entry.isMainSeries) return false
      if (!needle) return true
      return (
        entry.label.toLowerCase().includes(needle) ||
        entry.name.includes(needle) ||
        regionLabel(entry.regionId).toLowerCase().includes(needle) ||
        (entry.description ?? '').toLowerCase().includes(needle)
      )
    })
  }, [dex.meta.pokedexes, dex.meta.regions, query, scope])

  const groups = useMemo<DexGroup[]>(() => {
    const result: DexGroup[] = []
    for (const region of [...dex.meta.regions].sort((a, b) => a.id - b.id)) {
      const dexes = matches.filter((entry) => entry.isMainSeries && entry.regionId === region.id)
      if (dexes.length === 0) continue
      const generation = dex.meta.generations.find((item) => item.id === region.generationId)
      result.push({
        key: `region-${region.id}`,
        title: region.label,
        eyebrow: generation ? generation.label : 'Region',
        dexes,
      })
    }
    const side = matches.filter((entry) => !entry.isMainSeries)
    if (side.length > 0) {
      result.push({ key: 'side', title: 'Side series', eyebrow: 'Outside the main line', dexes: side })
    }
    return result
  }, [matches, dex.meta.regions, dex.meta.generations])

  const showNational = matches.some((entry) => entry.id === NATIONAL_ID)

  const totalEntries = dex.meta.pokedexes.reduce((sum, entry) => sum + entry.entryCount, 0)
  const regionsCovered = new Set(
    dex.meta.pokedexes.map((entry) => entry.regionId).filter((id): id is number => id !== null),
  ).size

  const caughtSpecies = useMemo(() => {
    const species = new Set<number>()
    for (const id of caught) {
      const entry = dex.byId.get(id)
      if (entry) species.add(entry.speciesId)
    }
    return species.size
  }, [caught, dex])

  const accent = useMemo(
    () => accentForType(dominantTypeId(dex.entries.map((entry) => entry.types))),
    [dex],
  )

  return (
    <div style={{ '--accent': accent } as React.CSSProperties}>
      <PageHeader
        eyebrow="Regional index"
        title="Pokédexes"
        subtitle="Every regional and side-series dex the games ship with, each on its own local numbering. Open one to work through its entries and track completion."
        actions={
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: 'All' },
              { value: 'main', label: 'Main series' },
              { value: 'side', label: 'Side series' },
            ]}
          />
        }
      >
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Pokédexes" value={dex.meta.pokedexes.length} />
          <Stat label="Regions" value={regionsCovered} />
          <Stat label="Total entries" value={totalEntries.toLocaleString()} />
          <Stat label="Species caught" value={`${caughtSpecies} / ${SPECIES_TOTAL}`} accent />
        </div>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <SearchInput value={query} onChange={setQuery} placeholder="Filter by name, region or game…" />
      </div>

      {showNational && national && (
        <NationalCard info={national} members={members.get(NATIONAL_ID) ?? []} caughtSet={caughtSet} />
      )}

      {groups.length === 0 && !showNational ? (
        <EmptyState
          title="No pokédex matches that filter"
          hint="Try a region such as “Alola”, or a game like “Sword”."
        />
      ) : (
        groups.map((group) => (
          <section key={group.key} className="mt-8">
            <SectionTitle eyebrow={group.eyebrow}>{group.title}</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.dexes.map((info) => (
                <DexCard
                  key={info.id}
                  info={info}
                  members={members.get(info.id) ?? []}
                  caughtSet={caughtSet}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function NationalCard({
  info,
  members,
  caughtSet,
}: {
  info: PokedexInfo
  members: DexMember[]
  caughtSet: Set<number>
}) {
  const caught = members.filter((member) => caughtSet.has(member.entry.id)).length
  const ratio = percent(caught, info.entryCount)

  return (
    <Panel className="relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            Complete index
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold leading-tight">National Pokédex</h2>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-dim">
            All {info.entryCount.toLocaleString()} species in national order — the superset every regional
            dex draws from.
          </p>
          <Link
            to={`/pokedexes/${info.id}`}
            className="mt-4 inline-flex h-9 items-center rounded-chip bg-accent px-4 font-display text-sm font-semibold text-[#0b0d12] transition hover:brightness-110"
          >
            Open national dex
          </Link>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              Completion
            </span>
            <span className="numeric text-2xl font-bold leading-none text-accent">
              {formatPercent(ratio)}
            </span>
          </div>
          <ProgressBar value={ratio} height="h-2" className="mt-2" />
          <p className="numeric mt-2 text-[11px] text-dim">
            {caught.toLocaleString()} of {info.entryCount.toLocaleString()} caught
          </p>
        </div>
      </div>
    </Panel>
  )
}

function DexCard({
  info,
  members,
  caughtSet,
}: {
  info: PokedexInfo
  members: DexMember[]
  caughtSet: Set<number>
}) {
  const dex = useDex()
  const accent = useMemo(
    () => accentForType(dominantTypeId(members.map((member) => member.entry.types))),
    [members],
  )
  const preview = members.slice(0, 6)
  const caught = members.filter((member) => caughtSet.has(member.entry.id)).length
  const ratio = percent(caught, info.entryCount)
  const region = info.regionId === null ? null : dex.meta.regions.find((item) => item.id === info.regionId)
  const games = info.versionGroupIds.map((id) => dex.nameOf('versionGroups', id))

  return (
    <Link
      to={`/pokedexes/${info.id}`}
      style={{ '--accent': accent } as React.CSSProperties}
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-plate border border-line bg-[var(--ui-plate)] p-4 transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-expo)]',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:shadow-[0_14px_44px_-20px_color-mix(in_oklab,var(--accent)_80%,transparent)]',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-16 h-24 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)',
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            {region ? region.label : info.isMainSeries ? 'All regions' : 'Side series'}
          </p>
          <h3 className="mt-0.5 truncate font-display text-base font-semibold leading-tight">
            {info.label}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="numeric text-xl font-bold leading-none text-accent">{info.entryCount}</p>
          <p className="numeric text-[9px] uppercase tracking-[0.16em] text-faint">entries</p>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 min-h-[2.5em] text-[13px] leading-relaxed text-dim">
        {info.description ?? `${region ? `${region.label} ` : ''}regional Pokédex.`}
      </p>

      {games.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          {games.slice(0, 4).map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="rounded-chip border border-line-soft px-1.5 py-0.5 font-display text-[10px] font-medium text-dim"
            >
              {label}
            </span>
          ))}
          {games.length > 4 && (
            <span className="numeric px-1 text-[10px] text-faint">+{games.length - 4}</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3">
          <SpriteStrip
            ids={preview.map((member) => member.entry.id)}
            labels={preview.map((member) => member.entry.label)}
          />
          <span className="numeric shrink-0 text-[11px] font-semibold text-dim">
            {caught}/{info.entryCount}
          </span>
        </div>
        <ProgressBar value={ratio} className="mt-2.5" />
      </div>
    </Link>
  )
}
