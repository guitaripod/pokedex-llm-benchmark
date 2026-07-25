import { useMemo, useState } from 'react'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Button, Chip, SearchInput, Select } from '@/components/ui/Controls'
import { BerryCard } from '@/components/items/BerryCard'
import { flavorColor } from '@/components/items/Flavor'
import { typeSlug, useDex } from '@/lib/dex'
import { STAT_LABELS, STAT_ORDER } from '@/lib/game'
import type { BerryInfo, NatureInfo } from '@/types/data'
import type { CSSProperties } from 'react'

type SortKey = 'name' | 'growth' | 'size' | 'harvest' | 'smoothness' | 'power'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'growth', label: 'Growth time, fastest' },
  { value: 'size', label: 'Size, largest' },
  { value: 'harvest', label: 'Max harvest, highest' },
  { value: 'smoothness', label: 'Smoothness, lowest' },
  { value: 'power', label: 'Natural Gift power, highest' },
]

const SORTERS: Record<SortKey, (a: BerryInfo, b: BerryInfo) => number> = {
  name: (a, b) => a.label.localeCompare(b.label),
  growth: (a, b) => a.growthTime - b.growthTime || a.label.localeCompare(b.label),
  size: (a, b) => b.size - a.size || a.label.localeCompare(b.label),
  harvest: (a, b) => b.maxHarvest - a.maxHarvest || a.label.localeCompare(b.label),
  smoothness: (a, b) => a.smoothness - b.smoothness || a.label.localeCompare(b.label),
  power: (a, b) => b.naturalGiftPower - a.naturalGiftPower || a.label.localeCompare(b.label),
}

/// Natures whose liked and hated flavour are the same have no palate at all, so they are excluded
/// from both sides of the flavour interaction table.
function hasPalate(nature: NatureInfo): boolean {
  return nature.likesFlavorId != null && nature.likesFlavorId !== nature.hatesFlavorId
}

export default function Berries() {
  const dex = useDex()
  const { meta } = dex
  const berries = meta.berries

  const [query, setQuery] = useState('')
  const [firmness, setFirmness] = useState<number | null>(null)
  const [giftType, setGiftType] = useState<number | null>(null)
  const [sort, setSort] = useState<SortKey>('name')

  const firmnesses = useMemo(() => {
    const present = new Set(berries.map((berry) => berry.firmnessId))
    return meta.berryFirmnesses.filter((entry) => present.has(entry.id))
  }, [berries, meta])

  const giftTypes = useMemo(() => {
    const present = new Set(
      berries.map((berry) => berry.naturalGiftTypeId).filter((id): id is number => id != null),
    )
    return meta.types.filter((type) => present.has(type.id))
  }, [berries, meta])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const rows = berries.filter((berry) => {
      if (firmness != null && berry.firmnessId !== firmness) return false
      if (giftType != null && berry.naturalGiftTypeId !== giftType) return false
      if (!normalized) return true
      return berry.label.toLowerCase().includes(normalized) || berry.name.includes(normalized)
    })
    return [...rows].sort(SORTERS[sort])
  }, [berries, query, firmness, giftType, sort])

  const flavorRows = useMemo(() => {
    const palates = meta.natures.filter(hasPalate)
    return meta.berryFlavors.map((flavor) => {
      const liked = palates.filter((nature) => nature.likesFlavorId === flavor.id)
      const hated = palates.filter((nature) => nature.hatesFlavorId === flavor.id)
      const boostedStatId = liked[0]?.increasedStatId ?? null
      const loweredStatId = hated[0]?.decreasedStatId ?? null
      return { flavor, liked, hated, boostedStatId, loweredStatId }
    })
  }, [meta])

  const extremes = useMemo(() => {
    const growth = berries.map((berry) => berry.growthTime).filter((value) => value > 0)
    return {
      fastestGrowth: growth.length ? Math.min(...growth) : 0,
      largest: berries.reduce((top, berry) => Math.max(top, berry.size), 0),
      strongestGift: berries.reduce((top, berry) => Math.max(top, berry.naturalGiftPower), 0),
    }
  }, [berries])

  const dirty = query !== '' || firmness !== null || giftType !== null || sort !== 'name'
  const accent = giftType != null ? `var(--type-${typeSlug(giftType)})` : 'var(--type-grass)'

  return (
    <div style={{ '--accent': accent } as CSSProperties}>
      <PageHeader
        eyebrow={`${berries.length} berries`}
        title="Berries"
        subtitle="Cultivation data, Natural Gift typing and the five-flavour profile that decides which natures enjoy each Berry."
      />

      <div className="flex flex-col gap-5">
        <Panel className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <Stat label="Showing" value={`${filtered.length} / ${berries.length}`} accent />
          <Stat label="Fastest growth" value={`${extremes.fastestGrowth} h`} hint="per growth stage" />
          <Stat label="Largest" value={`${(extremes.largest / 10).toFixed(1)} cm`} />
          <Stat
            label="Strongest gift"
            value={`${extremes.strongestGift} pow`}
            hint="Natural Gift base power"
          />
        </Panel>

        <Panel>
          <SectionTitle eyebrow="Why flavour matters">Flavour &amp; nature</SectionTitle>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-dim">
            Every nature raises one stat and lowers another, and that same bias decides its palate: a nature
            likes the flavour tied to the stat it raises and hates the flavour tied to the stat it lowers.
            Feeding a Pokémon a Berry it dislikes wastes most of the effect, so match the flavour column below
            to the nature you are running. The five neutral natures —{' '}
            {meta.natures
              .filter((nature) => !hasPalate(nature))
              .map((nature) => nature.label)
              .join(', ')}{' '}
            — have no preference at all.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {flavorRows.map((row) => (
              <div
                key={row.flavor.id}
                className="rounded-plate border border-line bg-surface p-3"
                style={{ borderTopColor: flavorColor(row.flavor.id), borderTopWidth: 2 }}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: flavorColor(row.flavor.id) }}
                  />
                  <h3 className="font-display text-sm font-semibold">{row.flavor.label}</h3>
                </div>
                <p className="numeric mt-1 text-[10px] uppercase tracking-[0.14em] text-faint">
                  {row.boostedStatId != null ? `Raises ${statLabel(row.boostedStatId)}` : 'No stat link'}
                </p>
                <dl className="mt-3 flex flex-col gap-2 text-[12px] leading-snug">
                  <div>
                    <dt className="numeric text-[9px] uppercase tracking-[0.16em] text-faint">Liked by</dt>
                    <dd className="text-dim">{row.liked.map((nature) => nature.label).join(', ') || '—'}</dd>
                  </div>
                  <div>
                    <dt className="numeric text-[9px] uppercase tracking-[0.16em] text-faint">Hated by</dt>
                    <dd className="text-dim">{row.hated.map((nature) => nature.label).join(', ') || '—'}</dd>
                  </div>
                  {row.loweredStatId != null && (
                    <div>
                      <dt className="numeric text-[9px] uppercase tracking-[0.16em] text-faint">
                        Hated natures lower
                      </dt>
                      <dd className="text-dim">{statLabel(row.loweredStatId)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <SearchInput value={query} onChange={setQuery} placeholder="Search berries" />
            <Select
              aria-label="Sort berries"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="numeric mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Firmness
              </p>
              <div className="flex flex-wrap gap-1.5">
                {firmnesses.map((entry) => (
                  <Chip
                    key={entry.id}
                    active={firmness === entry.id}
                    onClick={() => setFirmness((current) => (current === entry.id ? null : entry.id))}
                  >
                    {entry.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="numeric mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Natural Gift type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {giftTypes.map((type) => (
                  <Chip
                    key={type.id}
                    active={giftType === type.id}
                    color={`var(--type-${typeSlug(type.id)})`}
                    onClick={() => setGiftType((current) => (current === type.id ? null : type.id))}
                  >
                    {type.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {dirty && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
              <p className="numeric text-[11px] text-faint">
                {filtered.length} of {berries.length} berries
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery('')
                  setFirmness(null)
                  setGiftType(null)
                  setSort('name')
                }}
              >
                Reset filters
              </Button>
            </div>
          )}
        </Panel>

        {filtered.length === 0 ? (
          <EmptyState
            title="No berries match these filters"
            hint="Clear the firmness or Natural Gift type filter to see the full orchard."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((berry) => (
              <BerryCard key={berry.id} berry={berry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function statLabel(statId: number): string {
  const index = STAT_ORDER.indexOf(statId)
  return index === -1 ? '—' : STAT_LABELS[index]
}
