import { useId, useMemo, useState, type ReactNode } from 'react'
import { Button, Chip, RangeSlider, SearchInput, Segmented, Select, Toggle } from '@/components/ui/Controls'
import { SearchableSelect, type SearchableOption } from './SearchableSelect'
import { typeSlug, useDex } from '@/lib/dex'
import { BATTLE_TYPE_IDS } from '@/lib/game'
import { cx } from '@/lib/cx'
import {
  RANGE_SPECS,
  TRAITS,
  generationShortLabel,
  isFullRange,
  type Bounds,
  type Filters,
  type Range,
  type TypeMode,
} from './filterModel'

export interface FilterRailProps {
  filters: Filters
  bounds: Bounds
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
  activeCount: number
  resultCount: number
  abilityOptions: SearchableOption[]
  abilitiesLoading: boolean
  abilitiesError?: string
}

export function FilterRail({
  filters,
  bounds,
  onChange,
  onReset,
  activeCount,
  resultCount,
  abilityOptions,
  abilitiesLoading,
  abilitiesError,
}: FilterRailProps) {
  const dex = useDex()
  const uid = useId()

  const pokedexes = useMemo(
    () => [...dex.meta.pokedexes].sort((a, b) => a.id - b.id),
    [dex.meta.pokedexes],
  )

  const toggleType = (id: number) => {
    onChange({
      types: filters.types.includes(id)
        ? filters.types.filter((value) => value !== id)
        : [...filters.types, id],
    })
  }

  const toggleGeneration = (id: number) => {
    onChange({
      generations: filters.generations.includes(id)
        ? filters.generations.filter((value) => value !== id)
        : [...filters.generations, id],
    })
  }

  const setRange = (key: keyof Bounds, value: Range) => {
    onChange({ ranges: { ...filters.ranges, [key]: value } })
  }

  const statRanges = RANGE_SPECS.filter((spec) => spec.group === 'stat')
  const physiqueRanges = RANGE_SPECS.filter((spec) => spec.group === 'physique')
  const activeStatRanges = statRanges.filter(
    (spec) => !isFullRange(filters.ranges[spec.key], bounds[spec.key]),
  ).length
  const activePhysiqueRanges = physiqueRanges.filter(
    (spec) => !isFullRange(filters.ranges[spec.key], bounds[spec.key]),
  ).length
  const activeAttributes = (['eggGroup', 'ability', 'growthRate', 'habitat', 'shape', 'color', 'stage'] as const).filter(
    (key) => filters[key] !== null,
  ).length

  return (
    <div className="plate flex h-full min-h-0 flex-col overflow-hidden shadow-plate">
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Filters</p>
          <p className="numeric text-[13px] font-semibold leading-tight">
            {resultCount.toLocaleString()}{' '}
            <span className="text-[11px] font-normal text-dim">matching</span>
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onReset} disabled={activeCount === 0}>
          Reset{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5">
        <RailSection title="Search" defaultOpen>
          <SearchInput
            value={filters.q}
            onChange={(value) => onChange({ q: value })}
            placeholder="Name, any language, or #dex"
          />
        </RailSection>

        <RailSection title="Types" count={filters.types.length} defaultOpen>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-dim">Match</span>
            <Segmented<TypeMode>
              size="sm"
              value={filters.typeMode}
              onChange={(value) => onChange({ typeMode: value })}
              options={[
                { value: 'any', label: 'Any', title: 'Has at least one selected type' },
                { value: 'all', label: 'All', title: 'Has every selected type' },
                { value: 'exact', label: 'Exact', title: 'Type set equals the selection' },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BATTLE_TYPE_IDS.map((id) => (
              <Chip
                key={id}
                active={filters.types.includes(id)}
                color={`var(--type-${typeSlug(id)})`}
                onClick={() => toggleType(id)}
              >
                {dex.typeById.get(id)?.label ?? typeSlug(id)}
              </Chip>
            ))}
          </div>
        </RailSection>

        <RailSection title="Generation" count={filters.generations.length} defaultOpen>
          <div className="flex flex-wrap gap-1.5">
            {dex.meta.generations.map((generation) => (
              <Chip
                key={generation.id}
                active={filters.generations.includes(generation.id)}
                onClick={() => toggleGeneration(generation.id)}
                title={generation.label}
              >
                {generationShortLabel(generation.label)}
              </Chip>
            ))}
          </div>
          <div className="mt-3">
            <FieldLabel htmlFor={`${uid}-pokedex`}>Regional pokédex</FieldLabel>
            <Select
              id={`${uid}-pokedex`}
              value={filters.pokedex ?? ''}
              onChange={(event) =>
                onChange({ pokedex: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">Any pokédex</option>
              {pokedexes.map((pokedex) => (
                <option key={pokedex.id} value={pokedex.id}>
                  {pokedex.label} · {pokedex.entryCount}
                </option>
              ))}
            </Select>
          </div>
        </RailSection>

        <RailSection title="Traits" count={filters.traits.length + (filters.forms ? 1 : 0)} defaultOpen>
          <div className="flex flex-wrap gap-1.5">
            {TRAITS.map((trait) => (
              <Chip
                key={trait.key}
                active={filters.traits.includes(trait.key)}
                onClick={() =>
                  onChange({
                    traits: filters.traits.includes(trait.key)
                      ? filters.traits.filter((value) => value !== trait.key)
                      : [...filters.traits, trait.key],
                  })
                }
              >
                {trait.label}
              </Chip>
            ))}
          </div>
          <div className="mt-1.5 border-t border-line-soft pt-1.5">
            <Toggle
              checked={filters.forms}
              onChange={(value) => onChange({ forms: value })}
              label="Alternate forms"
              hint="Megas, Gigantamax, regional variants, battle-only forms"
            />
          </div>
        </RailSection>

        <RailSection title="Attributes" count={activeAttributes}>
          <div className="space-y-3">
            <div>
              <FieldLabel htmlFor={`${uid}-egg`}>Egg group</FieldLabel>
              <Select
                id={`${uid}-egg`}
                value={filters.eggGroup ?? ''}
                onChange={(event) =>
                  onChange({ eggGroup: event.target.value ? Number(event.target.value) : null })
                }
              >
                <option value="">Any egg group</option>
                {dex.meta.eggGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label} · {group.speciesCount}
                  </option>
                ))}
              </Select>
            </div>

            <SearchableSelect
              label="Ability"
              value={filters.ability}
              options={abilityOptions}
              loading={abilitiesLoading}
              error={abilitiesError}
              onChange={(value) => onChange({ ability: value })}
              placeholder="Any ability"
            />


            <div>
              <FieldLabel htmlFor={`${uid}-growth`}>Growth rate</FieldLabel>
              <Select
                id={`${uid}-growth`}
                value={filters.growthRate ?? ''}
                onChange={(event) =>
                  onChange({ growthRate: event.target.value ? Number(event.target.value) : null })
                }
              >
                <option value="">Any growth rate</option>
                {dex.meta.growthRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel htmlFor={`${uid}-habitat`}>Habitat</FieldLabel>
              <Select
                id={`${uid}-habitat`}
                value={filters.habitat ?? ''}
                onChange={(event) =>
                  onChange({ habitat: event.target.value ? Number(event.target.value) : null })
                }
              >
                <option value="">Any habitat</option>
                {dex.meta.habitats.map((habitat) => (
                  <option key={habitat.id} value={habitat.id}>
                    {habitat.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel htmlFor={`${uid}-shape`}>Shape</FieldLabel>
                <Select
                  id={`${uid}-shape`}
                  value={filters.shape ?? ''}
                  onChange={(event) =>
                    onChange({ shape: event.target.value ? Number(event.target.value) : null })
                  }
                >
                  <option value="">Any</option>
                  {dex.meta.shapes.map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {shape.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel htmlFor={`${uid}-color`}>Colour</FieldLabel>
                <Select
                  id={`${uid}-color`}
                  value={filters.color ?? ''}
                  onChange={(event) =>
                    onChange({ color: event.target.value ? Number(event.target.value) : null })
                  }
                >
                  <option value="">Any</option>
                  {dex.meta.colors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <FieldLabel>Evolution stage</FieldLabel>
              <Segmented<number>
                size="sm"
                className="w-full"
                value={filters.stage ?? 0}
                onChange={(value) => onChange({ stage: value === 0 ? null : value })}
                options={[
                  { value: 0, label: 'Any' },
                  { value: 1, label: 'First', title: 'Unevolved or single-stage' },
                  { value: 2, label: 'Second' },
                  { value: 3, label: 'Third' },
                ]}
              />
            </div>
          </div>
        </RailSection>

        <RailSection title="Base stats" count={activeStatRanges}>
          <div className="space-y-3.5">
            {statRanges.map((spec) => (
              <div key={spec.key} style={spec.color ? ({ '--accent': spec.color } as React.CSSProperties) : undefined}>
                <RangeSlider
                  label={spec.label}
                  min={bounds[spec.key][0]}
                  max={bounds[spec.key][1]}
                  step={spec.step}
                  value={filters.ranges[spec.key]}
                  onChange={(value) => setRange(spec.key, value)}
                  format={spec.format}
                />
              </div>
            ))}
          </div>
        </RailSection>

        <RailSection title="Physique" count={activePhysiqueRanges}>
          <div className="space-y-3.5">
            {physiqueRanges.map((spec) => (
              <RangeSlider
                key={spec.key}
                label={spec.label}
                min={bounds[spec.key][0]}
                max={bounds[spec.key][1]}
                step={spec.step}
                value={filters.ranges[spec.key]}
                onChange={(value) => setRange(spec.key, value)}
                format={spec.format}
              />
            ))}
          </div>
        </RailSection>
      </div>
    </div>
  )
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="numeric mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-faint"
    >
      {children}
    </label>
  )
}

function RailSection({
  title,
  count = 0,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-line-soft last:border-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 py-3 text-left"
        >
          <span className="numeric flex-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            {title}
          </span>
          {count > 0 && (
            <span className="numeric flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-[#0b0d12]">
              {count}
            </span>
          )}
          <svg
            aria-hidden
            viewBox="0 0 12 12"
            className={cx('h-3 w-3 shrink-0 text-faint transition-transform', open && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M3 4.5 6 7.5 9 4.5" />
          </svg>
        </button>
      </h3>
      {open && <div className="pb-4">{children}</div>}
    </section>
  )
}
