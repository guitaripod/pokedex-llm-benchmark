import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { ItemChip, Micro, useItemLookup } from './shared'
import { useDex, typeSlug } from '@/lib/dex'
import { thumbCandidates } from '@/lib/sprites'
import { useApp } from '@/lib/store'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { EvolutionDetail, EvolutionNode, ItemIndexEntry, PokemonDetail } from '@/types/data'

export function EvolutionTab({ detail }: { detail: PokemonDetail }) {
  const chain = detail.evolutionChain
  const itemIds = useMemo(
    () =>
      chain
        ? [...new Set(chain.roots.flatMap((root) => collectItemIds(root, chain.babyTriggerItemId)))]
        : [],
    [chain],
  )
  const items = useItemLookup(itemIds.length > 0)

  if (!chain) {
    return (
      <EmptyState
        title="No evolution data"
        hint="This Pokémon is not part of a recorded evolution chain."
      />
    )
  }

  const singleStage = chain.roots.length === 1 && chain.roots[0].children.length === 0

  return (
    <Panel>
      <SectionTitle
        eyebrow={`Chain #${chain.id}`}
        actions={
          <span className="numeric text-[11px] text-faint">{chain.speciesIds.length} species</span>
        }
      >
        Evolution line
      </SectionTitle>

      {chain.babyTriggerItemId !== null && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-chip border border-line-soft bg-surface/60 p-2.5">
          <Micro>Baby trigger</Micro>
          <ItemChip itemId={chain.babyTriggerItemId} item={items.byId?.get(chain.babyTriggerItemId)} />
          <span className="text-[12px] text-dim">must be held while breeding.</span>
        </div>
      )}

      <div className="space-y-4 overflow-x-auto pb-1">
        {chain.roots.map((root) => (
          <EvolutionBranch
            key={root.speciesId}
            node={root}
            speciesId={detail.speciesId}
            items={items.byId}
          />
        ))}
      </div>

      {singleStage && (
        <p className="mt-4 text-[12px] text-faint">This species neither evolves from nor into anything.</p>
      )}
    </Panel>
  )
}

/// Gathers every item referenced by the chain so the item index is fetched only when it is useful.
function collectItemIds(node: EvolutionNode, babyTriggerItemId: number | null): number[] {
  const ids = new Set<number>()
  if (babyTriggerItemId !== null) ids.add(babyTriggerItemId)
  const walk = (current: EvolutionNode) => {
    for (const detail of current.details) {
      if (detail.triggerItemId !== null) ids.add(detail.triggerItemId)
      if (detail.heldItemId !== null) ids.add(detail.heldItemId)
    }
    current.children.forEach(walk)
  }
  walk(node)
  return [...ids]
}

function EvolutionBranch({
  node,
  speciesId,
  items,
}: {
  node: EvolutionNode
  speciesId: number
  items: Map<number, ItemIndexEntry> | null
}) {
  const wide = node.children.length > 2

  return (
    <div className={cx('flex flex-col gap-4 lg:flex-row', wide ? 'lg:items-start' : 'lg:items-center')}>
      <NodeCard node={node} current={node.speciesId === speciesId} />
      {node.children.length > 0 && (
        <div
          className={cx(
            'flex flex-col gap-4 border-l border-line-soft pl-4 lg:border-l-0 lg:pl-0',
            node.children.length > 1 && 'lg:border-l lg:border-line-soft lg:pl-4',
          )}
        >
          {node.children.map((child) => (
            <div key={child.speciesId} className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Transition details={child.details} items={items} />
              <EvolutionBranch node={child} speciesId={speciesId} items={items} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NodeCard({ node, current }: { node: EvolutionNode; current: boolean }) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const entry = dex.byId.get(node.pokemonId)
  const accent = `var(--type-${typeSlug(node.types[0] ?? 1)})`

  return (
    <Link
      to={`/pokemon/${entry?.name ?? node.name}`}
      style={{ '--accent': accent } as React.CSSProperties}
      className={cx(
        'group flex w-full shrink-0 items-center gap-3 rounded-plate border p-3 transition lg:w-[220px] lg:flex-col lg:text-center',
        current
          ? 'border-[color-mix(in_oklab,var(--accent)_60%,transparent)] bg-[color-mix(in_oklab,var(--accent)_9%,transparent)]'
          : 'border-line bg-surface/60 hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--ui-line))] hover:bg-raised',
      )}
    >
      <Sprite
        sources={thumbCandidates(node.pokemonId, shiny)}
        alt={node.label}
        className="h-16 w-16 shrink-0 transition-transform duration-300 group-hover:scale-105 lg:h-24 lg:w-24"
      />
      <span className="min-w-0 lg:w-full">
        <span className="numeric block text-[10px] font-semibold tracking-[0.14em] text-faint">
          {formatDex(node.speciesId)}
          {node.isBaby && <span className="ml-1.5 text-accent">BABY</span>}
        </span>
        <span className="block truncate font-display text-sm font-semibold">{node.label}</span>
        <span className="mt-1.5 flex flex-wrap gap-1 lg:justify-center">
          {node.types.map((typeId) => (
            <TypeBadge
              key={typeId}
              typeId={typeId}
              label={dex.typeById.get(typeId)?.label ?? '—'}
              size="xs"
              link={false}
            />
          ))}
        </span>
      </span>
    </Link>
  )
}

function Transition({
  details,
  items,
}: {
  details: EvolutionDetail[]
  items: Map<number, ItemIndexEntry> | null
}) {
  const dex = useDex()

  return (
    <div className="flex shrink-0 flex-row items-center gap-2 lg:w-[190px] lg:flex-col">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-4 w-4 shrink-0 rotate-90 text-faint lg:rotate-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 12h15m0 0-5-5m5 5-5 5" />
      </svg>
      <div className="flex min-w-0 flex-col gap-1.5">
        {details.map((detail, index) => (
          <div key={`${detail.triggerId}-${index}`} className="min-w-0">
            <span className="block rounded-chip border border-line-soft bg-surface/60 px-2 py-1 text-[11px] leading-snug text-dim">
              {detail.text || dex.nameOf('evolutionTriggers', detail.triggerId)}
            </span>
            {detail.triggerItemId !== null && (
              <span className="mt-1 block">
                <ItemChip itemId={detail.triggerItemId} item={items?.get(detail.triggerItemId)} />
              </span>
            )}
            {detail.heldItemId !== null && (
              <span className="mt-1 block">
                <ItemChip
                  itemId={detail.heldItemId}
                  item={items?.get(detail.heldItemId)}
                  hint="held"
                />
              </span>
            )}
          </div>
        ))}
        {details.length === 0 && (
          <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">Unknown trigger</span>
        )}
      </div>
    </div>
  )
}
