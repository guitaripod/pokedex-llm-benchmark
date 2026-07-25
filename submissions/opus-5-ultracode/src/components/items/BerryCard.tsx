import { memo } from 'react'
import { Link } from 'react-router-dom'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { typeSlug, useDex } from '@/lib/dex'
import { cx } from '@/lib/cx'
import { ItemArt } from './ItemArt'
import { FlavorBars } from './Flavor'
import type { BerryInfo } from '@/types/data'
import type { CSSProperties } from 'react'

function MicroStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0" title={hint}>
      <p className="numeric text-[9px] uppercase tracking-[0.16em] text-faint">{label}</p>
      <p className="numeric mt-0.5 truncate text-[12px] font-semibold text-ink">{value}</p>
    </div>
  )
}

export const BerryCard = memo(function BerryCard({ berry }: { berry: BerryInfo }) {
  const dex = useDex()
  const accent =
    berry.naturalGiftTypeId != null ? `var(--type-${typeSlug(berry.naturalGiftTypeId)})` : 'var(--type-normal)'

  return (
    <article
      style={{ '--accent': accent } as CSSProperties}
      className={cx(
        'group relative flex flex-col gap-3 overflow-hidden rounded-plate border border-line bg-[var(--ui-plate)] p-4 transition-[border-color,box-shadow] duration-300',
        'hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--ui-line))] hover:shadow-[0_12px_36px_-18px_color-mix(in_oklab,var(--accent)_80%,transparent)]',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)',
        }}
      />

      <header className="relative flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-chip border border-line bg-surface">
          <ItemArt slug={berry.name} label={berry.label} className="h-8 w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-semibold leading-tight">
            <Link to={`/items/${berry.name}`} className="hover:text-accent">
              {berry.label}
            </Link>
          </h3>
          <p className="numeric mt-0.5 text-[10px] uppercase tracking-[0.16em] text-faint">
            #{String(berry.id).padStart(2, '0')} · {dex.nameOf('berryFirmnesses', berry.firmnessId || null)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {berry.naturalGiftTypeId != null ? (
            <TypeBadge
              typeId={berry.naturalGiftTypeId}
              label={dex.typeById.get(berry.naturalGiftTypeId)?.label ?? ''}
              size="xs"
            />
          ) : (
            <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">No gift</span>
          )}
          <span className="numeric text-[11px] font-semibold text-dim">
            {berry.naturalGiftPower || '—'}
            <span className="ml-1 text-[9px] uppercase tracking-[0.14em] text-faint">pow</span>
          </span>
        </div>
      </header>

      <div className="relative grid grid-cols-3 gap-x-3 gap-y-2 border-y border-line-soft py-2.5">
        <MicroStat
          label="Growth"
          value={berry.growthTime ? `${berry.growthTime}h` : '—'}
          hint={berry.growthTime ? `${berry.growthTime * 4}h from planting to harvest` : undefined}
        />
        <MicroStat label="Harvest" value={berry.maxHarvest ? `${berry.maxHarvest}×` : '—'} />
        <MicroStat
          label="Size"
          value={berry.size ? `${(berry.size / 10).toFixed(1)} cm` : '—'}
          hint={`${berry.size} mm`}
        />
        <MicroStat label="Dryness" value={berry.soilDryness ? String(berry.soilDryness) : '—'} />
        <MicroStat label="Smooth" value={berry.smoothness ? String(berry.smoothness) : '—'} />
        <MicroStat label="Firmness" value={dex.nameOf('berryFirmnesses', berry.firmnessId || null)} />
      </div>

      <FlavorBars
        flavors={berry.flavors}
        labelOf={(flavorId) => dex.nameOf('berryFlavors', flavorId)}
        compact
        className="relative"
      />
    </article>
  )
})
