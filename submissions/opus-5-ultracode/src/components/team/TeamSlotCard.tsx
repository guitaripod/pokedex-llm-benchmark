import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { load, useAsync } from '@/lib/data'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { DAMAGE_CLASS, STAT_KEYS, STAT_SHORT, formatDex, hasDefensiveAbilityEffect } from '@/lib/game'
import { itemSprite } from '@/lib/sprites'
import { cx } from '@/lib/cx'
import { FieldLabel, MiniButton, NumberField } from './Fields'
import { StatEditor } from './StatEditor'
import { MovePicker } from './MovePicker'
import { ItemPicker } from './ItemPicker'
import { useTeamData } from './TeamDataContext'
import { clampLevel, computeFinalStats, natureSummary } from './analysis'
import type { PokemonIndexEntry } from '@/types/data'
import type { TeamSlot } from '@/lib/store'

export function TeamSlotCard({
  index,
  slot,
  entry,
  scaleMax,
  onUpdate,
  onRemove,
  onReplace,
}: {
  index: number
  slot: TeamSlot
  entry: PokemonIndexEntry
  scaleMax: number
  onUpdate: (patch: Partial<TeamSlot>) => void
  onRemove: () => void
  onReplace: () => void
}) {
  const dex = useDex()
  const data = useTeamData()
  const spriteStyle = useApp((state) => state.spriteStyle)

  const [spreadOpen, setSpreadOpen] = useState(false)
  const [movePicker, setMovePicker] = useState<number | null>(null)
  const [itemPicker, setItemPicker] = useState(false)
  const [legalOnly, setLegalOnly] = useState(true)

  const detail = useAsync(movePicker === null ? null : `pokemon-${slot.pokemonId}`, () =>
    load.pokemon(slot.pokemonId),
  )

  const legalIds = useMemo(
    () => (detail.data ? new Set(detail.data.moves.map((tuple) => tuple[0])) : null),
    [detail.data],
  )

  const nature = useMemo(
    () => dex.meta.natures.find((item) => item.id === slot.natureId) ?? null,
    [dex.meta.natures, slot.natureId],
  )
  const finalStats = useMemo(() => computeFinalStats(entry.stats, slot, nature), [entry.stats, slot, nature])

  const abilityOptions = useMemo(() => {
    const options = entry.abilities.map((option) => ({ id: option.id, hidden: option.hidden, foreign: false }))
    if (slot.abilityId !== null && !options.some((option) => option.id === slot.abilityId)) {
      options.push({ id: slot.abilityId, hidden: false, foreign: true })
    }
    return options
  }, [entry.abilities, slot.abilityId])

  const ability = slot.abilityId === null ? null : (data.abilities.byId?.get(slot.abilityId) ?? null)
  const item = slot.itemId === null ? null : (data.items.byId?.get(slot.itemId) ?? null)
  const accent = `var(--type-${typeSlug(entry.types[0] ?? 1)})`

  return (
    <article
      style={{ '--accent': accent } as React.CSSProperties}
      className="plate relative overflow-hidden shadow-plate"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
        style={{
          background: `radial-gradient(ellipse at 12% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)`,
        }}
      />

      <header className="relative flex items-start gap-3 p-3.5 pb-2.5">
        <Link
          to={`/pokemon/${entry.name}`}
          className="shrink-0 rounded-chip"
          aria-label={`Open ${entry.label}`}
        >
          <Sprite
            sources={spriteSources(entry.id, spriteStyle, slot.shiny)}
            alt={entry.label}
            className="h-16 w-16"
            pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            Slot {index + 1} · {formatDex(entry.dex)}
          </p>
          <Link
            to={`/pokemon/${entry.name}`}
            className="block truncate font-display text-[15px] font-semibold leading-tight transition hover:text-accent"
          >
            {slot.nickname?.trim() || entry.label}
          </Link>
          {slot.nickname?.trim() && <p className="truncate text-[11px] text-dim">{entry.label}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {entry.types.map((typeId) => (
              <TypeBadge
                key={typeId}
                typeId={typeId}
                label={dex.typeById.get(typeId)?.label ?? ''}
                size="xs"
                link={false}
              />
            ))}
            <span className="numeric ml-1 text-[10px] text-faint">BST {entry.bst}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <IconButton
              label={slot.shiny ? 'Disable shiny' : 'Enable shiny'}
              active={slot.shiny}
              onClick={() => onUpdate({ shiny: !slot.shiny })}
            >
              <path d="M10 2.5 11.7 7l4.8 1.4-4.8 1.4L10 17.5 8.3 9.8 3.5 8.4 8.3 7Z" />
            </IconButton>
            <IconButton label="Replace Pokémon" onClick={onReplace}>
              <path d="M4 8h9l-2.5-2.5M16 12H7l2.5 2.5" />
            </IconButton>
            <IconButton label={`Remove slot ${index + 1}`} onClick={onRemove} danger>
              <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
            </IconButton>
          </div>
          <MiniButton
            active={spreadOpen}
            onClick={() => setSpreadOpen((current) => !current)}
            title="Toggle IV / EV editor"
          >
            Spread
          </MiniButton>
        </div>
      </header>

      <div className="relative grid grid-cols-1 gap-2.5 px-3.5 pb-3 sm:grid-cols-2">
        <label className="min-w-0">
          <FieldLabel>Nickname</FieldLabel>
          <input
            value={slot.nickname ?? ''}
            maxLength={24}
            placeholder={entry.label}
            onChange={(event) => onUpdate({ nickname: event.target.value || null })}
            className="mt-1 h-8 w-full rounded-chip border border-line bg-surface px-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent"
          />
        </label>

        <div className="min-w-0">
          <FieldLabel>Level</FieldLabel>
          <div className="mt-1 flex h-8 items-center gap-2">
            <NumberField
              label="Level"
              prefix="LV"
              value={slot.level}
              min={1}
              max={100}
              onChange={(value) => onUpdate({ level: clampLevel(value) })}
            />
            <input
              type="range"
              aria-label="Level slider"
              min={1}
              max={100}
              value={clampLevel(slot.level)}
              onChange={(event) => onUpdate({ level: clampLevel(Number(event.target.value)) })}
              className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-raised [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent"
            />
          </div>
        </div>

        <label className="min-w-0">
          <FieldLabel>Nature</FieldLabel>
          <select
            value={slot.natureId ?? ''}
            onChange={(event) => onUpdate({ natureId: event.target.value ? Number(event.target.value) : null })}
            className="mt-1 h-8 w-full appearance-none truncate rounded-chip border border-line bg-surface px-2.5 text-[13px] text-ink focus:border-accent"
          >
            <option value="">No nature (neutral)</option>
            {dex.meta.natures.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} · {natureSummary(option, STAT_SHORT)}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <FieldLabel>Ability</FieldLabel>
          <select
            value={slot.abilityId ?? ''}
            onChange={(event) => onUpdate({ abilityId: event.target.value ? Number(event.target.value) : null })}
            className="mt-1 h-8 w-full appearance-none truncate rounded-chip border border-line bg-surface px-2.5 text-[13px] text-ink focus:border-accent"
          >
            <option value="">
              {data.abilities.loading && !data.abilities.byId ? 'Loading abilities…' : 'No ability'}
            </option>
            {abilityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {data.abilities.byId?.get(option.id)?.label ?? `Ability #${option.id}`}
                {option.hidden ? ' (hidden)' : option.foreign ? ' (other form)' : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="min-w-0 sm:col-span-2">
          <FieldLabel>Held item</FieldLabel>
          <button
            type="button"
            onClick={() => {
              data.items.request()
              setItemPicker(true)
            }}
            className="mt-1 flex h-8 w-full items-center gap-2 rounded-chip border border-line bg-surface px-2 text-left transition hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--ui-line))]"
          >
            {item?.sprite ? (
              <Sprite sources={[itemSprite(item.sprite)]} alt="" className="h-5 w-5 shrink-0" pixelated />
            ) : (
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-raised" />
            )}
            <span className={cx('truncate text-[13px]', item ? 'text-ink' : 'text-faint')}>
              {item ? item.label : slot.itemId ? `Item #${slot.itemId}` : 'No item'}
            </span>
          </button>
        </div>
      </div>

      {ability?.shortEffect && (
        <p className="relative -mt-0.5 px-3.5 pb-3 text-[11px] leading-snug text-dim">
          <span className="text-ink">{ability.label}</span> — {ability.shortEffect}
          {hasDefensiveAbilityEffect(ability.name) && (
            <span className="numeric ml-1.5 rounded-chip bg-accent/15 px-1.5 py-px text-[9px] uppercase tracking-[0.14em] text-accent">
              Applied to matrix
            </span>
          )}
        </p>
      )}

      <div className="relative grid grid-cols-2 gap-1.5 border-t border-line-soft px-3.5 py-3">
        {[0, 1, 2, 3].map((moveIndex) => {
          const moveId = slot.moveIds[moveIndex] ?? null
          const move = moveId === null ? null : (data.moves.byId?.get(moveId) ?? null)
          return (
            <button
              key={moveIndex}
              type="button"
              onClick={() => {
                data.moves.request()
                setMovePicker(moveIndex)
              }}
              className="flex min-w-0 items-center gap-1.5 rounded-chip border border-line bg-surface/60 px-2 py-1.5 text-left transition hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--ui-line))]"
            >
              {move ? (
                <>
                  <span
                    aria-hidden
                    className="h-4 w-1 shrink-0 rounded-full"
                    style={{ background: `var(--type-${typeSlug(move.typeId)})` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium leading-tight">{move.label}</span>
                    <span className="numeric block text-[9px] uppercase tracking-[0.12em] text-faint">
                      {move.damageClassId === DAMAGE_CLASS.status ? 'Status' : `${move.power ?? '—'} BP`} ·{' '}
                      {move.pp ?? '—'} PP
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden className="h-4 w-1 shrink-0 rounded-full bg-raised" />
                  <span className="text-[12px] text-faint">
                    {moveId !== null ? `Move #${moveId}` : `Move ${moveIndex + 1}`}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <div className="relative grid grid-cols-6 gap-1.5 border-t border-line-soft px-3.5 py-2.5">
        {finalStats.map((value, statIndex) => (
          <div key={STAT_KEYS[statIndex]} className="min-w-0 text-center">
            <p className="numeric text-[9px] uppercase tracking-[0.1em] text-faint">{STAT_SHORT[statIndex]}</p>
            <p className="numeric text-[13px] font-semibold leading-tight">{value}</p>
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-raised">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(3, Math.min(100, (value / scaleMax) * 100))}%`,
                  background: `var(--stat-${STAT_KEYS[statIndex]})`,
                }}
              />
            </span>
          </div>
        ))}
      </div>

      {spreadOpen && (
        <div className="relative border-t border-line px-3.5 py-3.5">
          <StatEditor
            base={entry.stats}
            slot={slot}
            finalStats={finalStats}
            nature={nature}
            scaleMax={scaleMax}
            onChange={onUpdate}
          />
        </div>
      )}

      {itemPicker && (
        <ItemPicker
          items={data.items.entries}
          loading={data.items.loading}
          error={data.items.error}
          categoryLabel={(id) => dex.nameOf('itemCategories', id)}
          onSelect={(chosen) => {
            onUpdate({ itemId: chosen.id })
            setItemPicker(false)
          }}
          onClear={() => {
            onUpdate({ itemId: null })
            setItemPicker(false)
          }}
          onClose={() => setItemPicker(false)}
        />
      )}

      {movePicker !== null && (
        <MovePicker
          moves={data.moves.entries}
          loading={data.moves.loading}
          error={data.moves.error ?? detail.error}
          legalIds={legalIds}
          legalOnly={legalOnly}
          onLegalOnlyChange={setLegalOnly}
          pokemonLabel={entry.label}
          typeLabel={(id) => dex.typeById.get(id)?.label ?? ''}
          damageClassLabel={(id) => dex.nameOf('damageClasses', id)}
          onSelect={(chosen) => {
            onUpdate({ moveIds: withMove(slot.moveIds, movePicker, chosen.id) })
            setMovePicker(null)
          }}
          onClear={() => {
            onUpdate({ moveIds: withMove(slot.moveIds, movePicker, null) })
            setMovePicker(null)
          }}
          onClose={() => setMovePicker(null)}
        />
      )}
    </article>
  )
}

function withMove(moveIds: (number | null)[], index: number, value: number | null): (number | null)[] {
  const next = [0, 1, 2, 3].map((position) => moveIds[position] ?? null)
  next[index] = value
  return next
}

function IconButton({
  label,
  onClick,
  children,
  active,
  danger,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cx(
        'flex h-6 w-6 items-center justify-center rounded-chip border transition',
        active
          ? 'border-transparent bg-accent text-[#0b0d12]'
          : danger
            ? 'border-line text-faint hover:border-[color-mix(in_oklab,var(--type-fighting)_50%,transparent)] hover:text-[var(--type-fighting)]'
            : 'border-line text-faint hover:bg-raised hover:text-ink',
      )}
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}
