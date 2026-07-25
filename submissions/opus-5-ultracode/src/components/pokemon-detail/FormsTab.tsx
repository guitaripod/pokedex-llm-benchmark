import { Link } from 'react-router-dom'
import { Panel, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { StatSparkline } from '@/components/pokemon/StatBars'
import { Micro } from './shared'
import { useDex, typeSlug } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { thumbCandidates, gameSprite } from '@/lib/sprites'
import { cx } from '@/lib/cx'
import type { PokemonDetail, PokemonVariety } from '@/types/data'

export function FormsTab({ detail }: { detail: PokemonDetail }) {
  const hasVarieties = detail.varieties.length > 1
  const hasForms = detail.forms.length > 1 || detail.forms.some((form) => form.conditions.length > 0)

  if (!hasVarieties && !hasForms) {
    return (
      <EmptyState title="Single form" hint="This Pokémon has no alternate varieties or cosmetic forms." />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {hasVarieties && <VarietiesPanel detail={detail} />}
      {hasForms && <FormsPanel detail={detail} />}
    </div>
  )
}

function VarietiesPanel({ detail }: { detail: PokemonDetail }) {
  return (
    <Panel>
      <SectionTitle eyebrow={`${detail.varieties.length} varieties`}>Battle varieties</SectionTitle>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {detail.varieties.map((variety) => (
          <li key={variety.id} className="min-w-0">
            <VarietyCard variety={variety} current={variety.id === detail.id} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function VarietyCard({ variety, current }: { variety: PokemonVariety; current: boolean }) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const entry = dex.byId.get(variety.id)
  const accent = `var(--type-${typeSlug(variety.types[0] ?? 1)})`
  const bst = variety.stats.reduce((sum, value) => sum + value, 0)

  return (
    <Link
      to={`/pokemon/${entry?.name ?? variety.name}`}
      style={{ '--accent': accent } as React.CSSProperties}
      className={cx(
        'group flex h-full items-center gap-3 rounded-plate border p-3 transition',
        current
          ? 'border-[color-mix(in_oklab,var(--accent)_60%,transparent)] bg-[color-mix(in_oklab,var(--accent)_9%,transparent)]'
          : 'border-line bg-surface/60 hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--ui-line))] hover:bg-raised',
      )}
    >
      <Sprite
        sources={thumbCandidates(variety.id, shiny)}
        alt={variety.label}
        className="h-16 w-16 shrink-0 transition-transform duration-300 group-hover:scale-105"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-semibold">{variety.label}</span>
        <span className="mt-1 flex flex-wrap gap-1">
          {variety.types.map((typeId) => (
            <TypeBadge
              key={typeId}
              typeId={typeId}
              label={dex.typeById.get(typeId)?.label ?? '—'}
              size="xs"
              link={false}
            />
          ))}
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-2">
          <StatSparkline stats={variety.stats} />
          <span className="numeric text-[10px] font-semibold text-faint">
            BST <span className="text-dim">{bst}</span>
          </span>
        </span>
        <span className="mt-1 flex flex-wrap gap-1">
          {variety.isMega && <Tag label="Mega" color="var(--type-dragon)" />}
          {variety.isGmax && <Tag label="Gmax" color="var(--type-fighting)" />}
          {variety.isBattleOnly && <Tag label="Battle only" color="var(--type-ghost)" />}
          {entry?.variantRegion && <Tag label={entry.variantRegion} color="var(--type-grass)" />}
          {variety.isDefault && <Tag label="Default" color="var(--type-normal)" />}
        </span>
      </span>
    </Link>
  )
}

function FormsPanel({ detail }: { detail: PokemonDetail }) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)

  return (
    <Panel>
      <SectionTitle eyebrow={`${detail.forms.length} forms`}>Cosmetic &amp; special forms</SectionTitle>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {detail.forms.map((form) => (
          <li
            key={form.id}
            className="flex h-full min-w-0 items-start gap-3 rounded-plate border border-line bg-surface/60 p-3"
          >
            <Sprite
              sources={[
                ...thumbCandidates(form.spriteId, shiny),
                gameSprite(form.spriteId, { shiny }),
              ]}
              alt={form.label}
              className="h-14 w-14 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[13px] font-semibold">{form.label}</p>
              {form.formName && <Micro className="mt-1">{form.formName}</Micro>}
              {form.types && form.types.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {form.types.map((typeId) => (
                    <TypeBadge
                      key={typeId}
                      typeId={typeId}
                      label={dex.typeById.get(typeId)?.label ?? '—'}
                      size="xs"
                      link={false}
                    />
                  ))}
                </div>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {form.isMega && <Tag label="Mega" color="var(--type-dragon)" />}
                {form.isBattleOnly && <Tag label="Battle only" color="var(--type-ghost)" />}
                {form.isDefault && <Tag label="Default" color="var(--type-normal)" />}
              </div>
              {form.introducedInVersionGroupId !== null && (
                <p className="mt-1.5 text-[11px] text-faint">
                  Since {dex.nameOf('versionGroups', form.introducedInVersionGroupId)}
                </p>
              )}
              {form.conditions.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {form.conditions.map((condition, index) => (
                    <li key={`${condition.versionGroupId}-${index}`} className="text-[11px] leading-snug text-dim">
                      {condition.description ?? 'Unknown condition'}
                      <span className="text-faint">
                        {' '}
                        · {dex.nameOf('versionGroups', condition.versionGroupId)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="numeric rounded-chip px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
      style={{ color, background: `color-mix(in oklab, ${color} 16%, transparent)` }}
    >
      {label}
    </span>
  )
}
