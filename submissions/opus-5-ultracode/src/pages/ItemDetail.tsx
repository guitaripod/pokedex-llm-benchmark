import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, PageHeader, Panel, SectionTitle, Stat } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Controls'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Sprite } from '@/components/ui/Sprite'
import { ErrorState, InlineLoader } from '@/components/shell/Loading'
import { ItemArt } from '@/components/items/ItemArt'
import { FlavorBars, FlavorRadar } from '@/components/items/Flavor'
import { formatCost, machineKind, pocketAccent } from '@/components/items/itemsMeta'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { cx } from '@/lib/cx'
import type { ItemDetail as ItemDetailData, MoveIndexEntry } from '@/types/data'
import type { CSSProperties, ReactNode } from 'react'

const HELD_BY_PREVIEW = 24
const EVOLVES_PREVIEW = 24

interface MachineGroup {
  moveId: number
  number: number
  versionGroupIds: number[]
}

interface HeldByGroup {
  pokemonId: number
  rarity: number
  versionIds: number[]
}

/// Collapses the per-version-group machine rows into one entry per taught move, keeping release
/// order so a TM's history reads as a timeline rather than thirty near-identical lines.
function groupMachines(
  machines: ItemDetailData['machine'],
  orderOf: (versionGroupId: number) => number,
): MachineGroup[] {
  const sorted = [...machines].sort((a, b) => orderOf(a.versionGroupId) - orderOf(b.versionGroupId))
  const groups: MachineGroup[] = []
  for (const row of sorted) {
    const last = groups[groups.length - 1]
    if (last && last.moveId === row.moveId && last.number === row.number) {
      last.versionGroupIds.push(row.versionGroupId)
    } else {
      groups.push({ moveId: row.moveId, number: row.number, versionGroupIds: [row.versionGroupId] })
    }
  }
  return groups
}

function groupHeldBy(rows: ItemDetailData['heldBy']): HeldByGroup[] {
  const groups = new Map<number, HeldByGroup>()
  for (const [pokemonId, versionId, rarity] of rows) {
    const existing = groups.get(pokemonId)
    if (existing) {
      existing.rarity = Math.max(existing.rarity, rarity)
      if (!existing.versionIds.includes(versionId)) existing.versionIds.push(versionId)
    } else {
      groups.set(pokemonId, { pokemonId, rarity, versionIds: [versionId] })
    }
  }
  return [...groups.values()].sort((a, b) => b.rarity - a.rarity || a.pokemonId - b.pokemonId)
}

/// Merges consecutive version groups that ship identical flavour text into one dated block.
function groupFlavorText(
  rows: ItemDetailData['flavorText'],
  orderOf: (versionGroupId: number) => number,
): { text: string; versionGroupIds: number[] }[] {
  const sorted = [...rows].sort((a, b) => orderOf(a.versionGroupId) - orderOf(b.versionGroupId))
  const groups: { text: string; versionGroupIds: number[] }[] = []
  for (const row of sorted) {
    const last = groups[groups.length - 1]
    if (last && last.text === row.text) last.versionGroupIds.push(row.versionGroupId)
    else groups.push({ text: row.text, versionGroupIds: [row.versionGroupId] })
  }
  return groups
}

export default function ItemDetail() {
  const { slug = '' } = useParams()
  const dex = useDex()
  const { meta } = dex
  const shiny = useApp((state) => state.shiny)
  const spriteStyle = useApp((state) => state.spriteStyle)

  const index = useAsync('items-index', load.itemIndex)
  const entry = useMemo(
    () => index.data?.entries.find((candidate) => candidate.name === slug),
    [index.data, slug],
  )
  const detail = useAsync(entry ? `item:${entry.id}` : null, () => load.item(entry!.id))
  const item = detail.data

  const needsMoves = Boolean(item?.machine.length)
  const moveIndex = useAsync(needsMoves ? 'moves-index' : null, load.moveIndex)
  const moveById = useMemo(() => {
    const map = new Map<number, MoveIndexEntry>()
    for (const move of moveIndex.data?.entries ?? []) map.set(move.id, move)
    return map
  }, [moveIndex.data])

  const orderOf = useMemo(() => {
    const order = new Map(meta.versionGroups.map((group) => [group.id, group.order]))
    return (versionGroupId: number) => order.get(versionGroupId) ?? 0
  }, [meta])

  const machineGroups = useMemo(
    () => (item ? groupMachines(item.machine, orderOf) : []),
    [item, orderOf],
  )
  const heldBy = useMemo(() => (item ? groupHeldBy(item.heldBy) : []), [item])
  const flavorGroups = useMemo(
    () => (item ? groupFlavorText(item.flavorText, orderOf) : []),
    [item, orderOf],
  )

  const latestMachineMove = machineGroups.length
    ? moveById.get(machineGroups[machineGroups.length - 1].moveId)
    : undefined

  const accent = useMemo(() => {
    if (item?.berry?.naturalGiftTypeId != null) return `var(--type-${typeSlug(item.berry.naturalGiftTypeId)})`
    if (latestMachineMove) return `var(--type-${typeSlug(latestMachineMove.typeId)})`
    return pocketAccent(entry?.pocketId ?? null)
  }, [item, latestMachineMove, entry])

  if (index.loading || detail.loading) return <InlineLoader label="Loading item" />
  if (index.error) return <ErrorState message={index.error.message} />
  if (detail.error) return <ErrorState message={detail.error.message} />

  if (!entry || !item) {
    return (
      <div>
        <PageHeader eyebrow="Items" title="Unknown item" />
        <EmptyState
          title={`No item is registered as “${slug}”`}
          hint="It may have been renamed. Browse the full item list to find it."
        />
        <div className="mt-4 flex justify-center">
          <Link to="/items" className="rounded-chip border border-line px-4 py-2 text-sm hover:bg-raised">
            Back to items
          </Link>
        </div>
      </div>
    )
  }

  const kind = machineKind(item.name)
  const localized = meta.languages
    .map((language) => ({ label: language.label, value: item.names[language.code] }))
    .filter((row): row is { label: string; value: string } => Boolean(row.value))

  return (
    <div style={{ '--accent': accent } as CSSProperties} className="flex flex-col gap-5">
      <nav className="flex items-center gap-2 text-[11px]">
        <Link to="/items" className="numeric uppercase tracking-[0.16em] text-faint hover:text-accent">
          Items
        </Link>
        <span className="text-faint">/</span>
        <Link
          to={`/items?pocket=${item.pocketId}`}
          className="numeric uppercase tracking-[0.16em] text-faint hover:text-accent"
        >
          {dex.nameOf('itemPockets', item.pocketId)}
        </Link>
      </nav>

      <Panel className="relative overflow-hidden p-0">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-48"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 20% 100%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex shrink-0 items-center justify-center rounded-plate border border-line bg-surface p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
            <ItemArt
              slug={item.sprite ?? item.name}
              label={item.label}
              machineTypeId={latestMachineMove?.typeId ?? null}
              eager
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="numeric mb-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
              {dex.nameOf('itemPockets', item.pocketId)} · {dex.nameOf('itemCategories', item.categoryId)}
            </p>
            <h1 className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl">
              {item.label}
            </h1>
            {item.shortEffect && (
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-dim">{item.shortEffect}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {item.isBerry && (
                <span className="numeric rounded-chip border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-dim">
                  Berry
                </span>
              )}
              {kind && (
                <span className="numeric rounded-chip border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-dim">
                  {kind.toUpperCase()}
                </span>
              )}
              {item.attributes.map((attributeId) => (
                <span
                  key={attributeId}
                  className="numeric rounded-chip border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-dim"
                >
                  {dex.nameOf('itemAttributes', attributeId)}
                </span>
              ))}
              {item.attributes.length === 0 && (
                <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
                  No attributes recorded
                </span>
              )}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-4 border-t border-line-soft pt-4 sm:w-[240px] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <Stat label="Cost" value={formatCost(item.cost)} accent />
            <Stat label="Fling" value={item.flingPower ?? '—'} hint="base power" />
            <Stat
              label="Effect"
              value={item.flingEffectId ? dex.nameOf('itemFlingEffects', item.flingEffectId) : '—'}
              hint="on fling"
            />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          <Panel>
            <SectionTitle eyebrow="Mechanics">Effect</SectionTitle>
            {item.effect ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-dim">{item.effect}</p>
            ) : (
              <p className="text-sm text-faint">
                No effect text is recorded for this item — it is likely a plot or collectible item.
              </p>
            )}
          </Panel>

          {machineGroups.length > 0 && (
            <Panel>
              <SectionTitle
                eyebrow={`${machineGroups.length} move${machineGroups.length === 1 ? '' : 's'} across the series`}
                actions={
                  <Link
                    to="/machines"
                    className="numeric text-[11px] uppercase tracking-[0.14em] text-dim hover:text-accent"
                  >
                    Machine index
                  </Link>
                }
              >
                Teaches
              </SectionTitle>
              {moveIndex.loading && <InlineLoader label="Loading moves" />}
              <ul className="flex flex-col divide-y divide-line-soft">
                {machineGroups.map((group) => {
                  const move = moveById.get(group.moveId)
                  return (
                    <li
                      key={`${group.moveId}-${group.versionGroupIds[0]}`}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <span className="numeric w-12 shrink-0 text-[11px] font-semibold text-faint">
                        {(kind ?? 'tm').toUpperCase()}
                        {String(group.number).padStart(2, '0')}
                      </span>
                      {move ? (
                        <>
                          <Link
                            to={`/moves/${move.name}`}
                            className="min-w-0 flex-1 truncate font-display text-sm font-semibold hover:text-accent"
                          >
                            {move.label}
                          </Link>
                          <TypeBadge
                            typeId={move.typeId}
                            label={dex.typeById.get(move.typeId)?.label ?? ''}
                            size="xs"
                          />
                          <span className="numeric shrink-0 text-[11px] text-dim">
                            {move.power ?? '—'} / {move.accuracy ?? '—'} / {move.pp ?? '—'}
                          </span>
                        </>
                      ) : (
                        <span className="min-w-0 flex-1 text-sm text-faint">Move #{group.moveId}</span>
                      )}
                      <span className="w-full text-[11px] leading-relaxed text-faint sm:w-auto sm:max-w-[45%] sm:text-right">
                        {group.versionGroupIds.map((id) => dex.nameOf('versionGroups', id)).join(' · ')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          )}

          {item.berry && (
            <Panel>
              <SectionTitle
                eyebrow="Berry data"
                actions={
                  <Link
                    to="/berries"
                    className="numeric text-[11px] uppercase tracking-[0.14em] text-dim hover:text-accent"
                  >
                    Berry index
                  </Link>
                }
              >
                Growth &amp; flavour
              </SectionTitle>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat
                  label="Firmness"
                  value={dex.nameOf('berryFirmnesses', item.berry.firmnessId || null)}
                />
                <Stat
                  label="Growth"
                  value={item.berry.growthTime ? `${item.berry.growthTime} h` : '—'}
                  hint={item.berry.growthTime ? `${item.berry.growthTime * 4} h to harvest` : undefined}
                />
                <Stat label="Max harvest" value={item.berry.maxHarvest || '—'} hint="berries per tree" />
                <Stat
                  label="Size"
                  value={item.berry.size ? `${(item.berry.size / 10).toFixed(1)} cm` : '—'}
                  hint={`${item.berry.size} mm`}
                />
                <Stat label="Soil dryness" value={item.berry.soilDryness || '—'} />
                <Stat label="Smoothness" value={item.berry.smoothness || '—'} />
                <Stat
                  label="Natural Gift"
                  value={
                    item.berry.naturalGiftTypeId != null
                      ? dex.nameOf('types', item.berry.naturalGiftTypeId)
                      : '—'
                  }
                  accent
                />
                <Stat label="Gift power" value={item.berry.naturalGiftPower || '—'} />
              </div>

              <div className="mt-5 grid grid-cols-1 items-center gap-5 border-t border-line-soft pt-5 sm:grid-cols-[220px_minmax(0,1fr)]">
                <FlavorRadar
                  flavors={item.berry.flavors}
                  labelOf={(flavorId) => dex.nameOf('berryFlavors', flavorId)}
                  size={200}
                />
                <div>
                  <FlavorBars
                    flavors={item.berry.flavors}
                    labelOf={(flavorId) => dex.nameOf('berryFlavors', flavorId)}
                  />
                  <p className="mt-3 text-[12px] leading-relaxed text-faint">
                    A Pokémon whose nature likes a flavour enjoys this Berry; one whose nature hates it will
                    dislike it. Potency also feeds Poffin and Pokéblock quality.
                  </p>
                </div>
              </div>
            </Panel>
          )}

          {heldBy.length > 0 && (
            <RelationPanel
              eyebrow={`${heldBy.length} Pokémon`}
              title="Found holding this item"
              hint="Rarity is the chance a wild Pokémon carries the item."
              count={heldBy.length}
              preview={HELD_BY_PREVIEW}
            >
              {(limit) =>
                heldBy.slice(0, limit).map((group) => {
                  const pokemon = dex.byId.get(group.pokemonId)
                  if (!pokemon) return null
                  return (
                    <PokemonChip
                      key={group.pokemonId}
                      to={`/pokemon/${pokemon.name}`}
                      label={pokemon.label}
                      sources={spriteSources(group.pokemonId, spriteStyle, shiny)}
                      note={`${group.rarity}%`}
                      title={group.versionIds.map((id) => dex.nameOf('versions', id)).join(', ')}
                    />
                  )
                })
              }
            </RelationPanel>
          )}

          {item.evolvesWith.length > 0 && (
            <RelationPanel
              eyebrow={`${item.evolvesWith.length} species`}
              title="Evolves with this item"
              hint="Used as an evolution trigger, or held during the evolution."
              count={item.evolvesWith.length}
              preview={EVOLVES_PREVIEW}
            >
              {(limit) =>
                item.evolvesWith.slice(0, limit).map((relation) => {
                  const pokemon = dex.defaultBySpecies.get(relation.speciesId)
                  if (!pokemon) return null
                  return (
                    <PokemonChip
                      key={`${relation.speciesId}-${relation.kind}`}
                      to={`/pokemon/${pokemon.name}`}
                      label={pokemon.label}
                      sources={spriteSources(pokemon.id, spriteStyle, shiny)}
                      note={relation.kind === 'held' ? 'held' : 'use'}
                      title={
                        relation.kind === 'held'
                          ? 'Must be held while evolving'
                          : 'Used directly on the Pokémon'
                      }
                    />
                  )
                })
              }
            </RelationPanel>
          )}

          {item.babyTriggerFor.length > 0 && (
            <RelationPanel
              eyebrow={`${item.babyTriggerFor.length} species`}
              title="Baby trigger"
              hint="Breed a member of these families while holding this item to hatch the baby form."
              count={item.babyTriggerFor.length}
              preview={EVOLVES_PREVIEW}
            >
              {(limit) =>
                item.babyTriggerFor.slice(0, limit).map((speciesId) => {
                  const pokemon = dex.defaultBySpecies.get(speciesId)
                  if (!pokemon) return null
                  return (
                    <PokemonChip
                      key={speciesId}
                      to={`/pokemon/${pokemon.name}`}
                      label={pokemon.label}
                      sources={spriteSources(pokemon.id, spriteStyle, shiny)}
                    />
                  )
                })
              }
            </RelationPanel>
          )}

          {flavorGroups.length > 0 && (
            <Panel>
              <SectionTitle eyebrow={`${item.flavorText.length} version groups`}>
                In-game description
              </SectionTitle>
              <ul className="flex flex-col gap-3">
                {flavorGroups.map((group) => (
                  <li
                    key={group.versionGroupIds.join('-')}
                    className="border-l-2 border-[color-mix(in_oklab,var(--accent)_45%,transparent)] pl-3"
                  >
                    <p className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
                      {group.versionGroupIds.map((id) => dex.nameOf('versionGroups', id)).join(' · ')}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-dim">{group.text}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Panel>
            <SectionTitle eyebrow="Registry">Identity</SectionTitle>
            <dl className="flex flex-col gap-2.5 text-sm">
              <MetaRow label="Item ID" value={<span className="numeric">#{item.id}</span>} />
              <MetaRow label="Slug" value={<span className="numeric text-dim">{item.name}</span>} />
              <MetaRow label="Pocket" value={dex.nameOf('itemPockets', item.pocketId)} />
              <MetaRow label="Category" value={dex.nameOf('itemCategories', item.categoryId)} />
              <MetaRow label="Cost" value={<span className="numeric">{formatCost(item.cost)}</span>} />
              <MetaRow
                label="Fling power"
                value={<span className="numeric">{item.flingPower ?? '—'}</span>}
              />
            </dl>
          </Panel>

          {item.gameIndices.length > 0 && (
            <Panel>
              <SectionTitle eyebrow="Internal">Game indices</SectionTitle>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {item.gameIndices.map((row) => (
                  <li
                    key={`${row.generationId}-${row.gameIndex}`}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">
                      Gen {row.generationId}
                    </span>
                    <span className="numeric text-[13px] font-semibold">{row.gameIndex}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {localized.length > 0 && (
            <Panel>
              <SectionTitle eyebrow={`${localized.length} languages`}>Names</SectionTitle>
              <dl className="flex flex-col gap-2">
                {localized.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3">
                    <dt className="numeric min-w-0 truncate text-[10px] uppercase tracking-[0.14em] text-faint">
                      {row.label}
                    </dt>
                    <dd className="shrink-0 text-right text-sm">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="numeric shrink-0 text-[10px] uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd className="min-w-0 truncate text-right">{value}</dd>
    </div>
  )
}

function PokemonChip({
  to,
  label,
  sources,
  note,
  title,
}: {
  to: string
  label: string
  sources: string[]
  note?: string
  title?: string
}) {
  return (
    <Link
      to={to}
      title={title}
      className={cx(
        'flex items-center gap-2 rounded-chip border border-line bg-surface py-1 pl-1 pr-2.5 transition',
        'hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--ui-line))] hover:bg-raised',
      )}
    >
      <Sprite sources={sources} alt={label} className="h-8 w-8" />
      <span className="truncate text-[12px] font-medium">{label}</span>
      {note && <span className="numeric shrink-0 text-[10px] font-semibold text-accent">{note}</span>}
    </Link>
  )
}

function RelationPanel({
  eyebrow,
  title,
  hint,
  count,
  preview,
  children,
}: {
  eyebrow: string
  title: string
  hint?: string
  count: number
  preview: number
  children: (limit: number) => ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const limit = expanded ? count : preview

  return (
    <Panel>
      <SectionTitle
        eyebrow={eyebrow}
        actions={
          count > preview ? (
            <Button size="sm" variant="ghost" onClick={() => setExpanded((current) => !current)}>
              {expanded ? 'Show less' : `Show all ${count}`}
            </Button>
          ) : undefined
        }
      >
        {title}
      </SectionTitle>
      {hint && <p className="-mt-2 mb-3 text-[12px] text-faint">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">{children(limit)}</div>
    </Panel>
  )
}
