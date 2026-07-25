import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Panel, SectionTitle } from '@/components/ui/Panel'
import { Button, Segmented, Select, Toggle } from '@/components/ui/Controls'
import { Sprite } from '@/components/ui/Sprite'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { useDex } from '@/lib/dex'
import { emptySlot, useApp } from '@/lib/store'
import type { CardDensity, SpriteStyle, TeamSlot, ThemeMode } from '@/lib/store'
import { cx } from '@/lib/cx'

const THEMES: ThemeMode[] = ['dark', 'light', 'system']
const SPRITE_STYLES: SpriteStyle[] = ['artwork', 'home', 'showdown', 'game']
const DENSITIES: CardDensity[] = ['comfortable', 'compact']

const SPRITE_STYLE_LABELS: Record<SpriteStyle, string> = {
  artwork: 'Artwork',
  home: 'HOME',
  showdown: 'Showdown',
  game: 'Game',
}

const SPRITE_STYLE_HINTS: Record<SpriteStyle, string> = {
  artwork: 'Official illustration renders — the highest fidelity, largest files.',
  home: 'Pokémon HOME models. Best coverage for alternate forms.',
  showdown: 'Animated battle sprites from Pokémon Showdown.',
  game: 'Front sprites straight out of the cartridges. Pixel-perfect and tiny.',
}

const PREVIEW_IDS = [25, 6, 448, 887]

interface CollectionExport {
  app: string
  version: number
  exportedAt: string
  theme: ThemeMode
  spriteStyle: SpriteStyle
  density: CardDensity
  language: string
  shiny: boolean
  animateSprites: boolean
  showDexNumbers: boolean
  preferredVersionGroup: number | null
  favorites: number[]
  caught: number[]
  compare: number[]
  recent: number[]
  team: (TeamSlot | null)[]
}

interface ImportPatch {
  theme?: ThemeMode
  spriteStyle?: SpriteStyle
  density?: CardDensity
  language?: string
  shiny?: boolean
  animateSprites?: boolean
  showDexNumbers?: boolean
  preferredVersionGroup?: number | null
  favorites?: number[]
  caught?: number[]
  compare?: number[]
  recent?: number[]
  team?: (TeamSlot | null)[]
}

/// Streams an in-memory JSON document to the browser as a file download.
function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

function idList(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const ids = value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
  return Array.from(new Set(ids.map((id) => Math.trunc(id))))
}

function sextet(value: unknown, max: number): [number, number, number, number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 6) return undefined
  if (!value.every((item) => typeof item === 'number' && item >= 0 && item <= max)) return undefined
  return [value[0], value[1], value[2], value[3], value[4], value[5]]
}

/// Rebuilds a team slot from untrusted input, keeping only fields with the expected shape.
function normalizeSlot(value: unknown): TeamSlot | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.pokemonId !== 'number' || !Number.isFinite(raw.pokemonId)) return null

  const slot = emptySlot(Math.trunc(raw.pokemonId))
  if (typeof raw.level === 'number') slot.level = Math.min(100, Math.max(1, Math.trunc(raw.level)))
  if (typeof raw.natureId === 'number') slot.natureId = Math.trunc(raw.natureId)
  if (typeof raw.abilityId === 'number') slot.abilityId = Math.trunc(raw.abilityId)
  if (typeof raw.itemId === 'number') slot.itemId = Math.trunc(raw.itemId)
  if (typeof raw.shiny === 'boolean') slot.shiny = raw.shiny
  if (typeof raw.nickname === 'string') slot.nickname = raw.nickname.slice(0, 24)
  if (Array.isArray(raw.moveIds)) {
    slot.moveIds = [0, 1, 2, 3].map((index) => {
      const move = (raw.moveIds as unknown[])[index]
      return typeof move === 'number' ? Math.trunc(move) : null
    })
  }
  const ivs = sextet(raw.ivs, 31)
  if (ivs) slot.ivs = ivs
  const evs = sextet(raw.evs, 252)
  if (evs) slot.evs = evs
  return slot
}

/// Narrows an untrusted export document into the store slices we are willing to write back.
function parseCollection(text: string): ImportPatch {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object exported from this app.')
  }

  const raw = parsed as Record<string, unknown>
  const patch: ImportPatch = {}

  const theme = oneOf(raw.theme, THEMES)
  if (theme) patch.theme = theme
  const spriteStyle = oneOf(raw.spriteStyle, SPRITE_STYLES)
  if (spriteStyle) patch.spriteStyle = spriteStyle
  const density = oneOf(raw.density, DENSITIES)
  if (density) patch.density = density
  if (typeof raw.language === 'string') patch.language = raw.language
  if (typeof raw.shiny === 'boolean') patch.shiny = raw.shiny
  if (typeof raw.animateSprites === 'boolean') patch.animateSprites = raw.animateSprites
  if (typeof raw.showDexNumbers === 'boolean') patch.showDexNumbers = raw.showDexNumbers
  if (typeof raw.preferredVersionGroup === 'number') {
    patch.preferredVersionGroup = Math.trunc(raw.preferredVersionGroup)
  } else if (raw.preferredVersionGroup === null) {
    patch.preferredVersionGroup = null
  }

  const favorites = idList(raw.favorites)
  if (favorites) patch.favorites = favorites
  const caught = idList(raw.caught)
  if (caught) patch.caught = caught
  const compare = idList(raw.compare)
  if (compare) patch.compare = compare.slice(0, 6)
  const recent = idList(raw.recent)
  if (recent) patch.recent = recent.slice(0, 24)

  if (Array.isArray(raw.team)) {
    const team = raw.team.slice(0, 6).map(normalizeSlot)
    while (team.length < 6) team.push(null)
    patch.team = team
  }

  if (Object.keys(patch).length === 0) {
    throw new Error('Nothing recognisable in that file — no settings or collection keys found.')
  }
  return patch
}

function describePatch(patch: ImportPatch): string {
  const parts: string[] = []
  if (patch.favorites) parts.push(`${patch.favorites.length} favourites`)
  if (patch.caught) parts.push(`${patch.caught.length} caught`)
  if (patch.team) parts.push(`${patch.team.filter(Boolean).length} team members`)
  if (patch.compare) parts.push(`${patch.compare.length} compared`)
  if (patch.recent) parts.push(`${patch.recent.length} recent`)
  return parts.length > 0 ? `Imported ${parts.join(', ')}.` : 'Imported preferences.'
}

export default function Settings() {
  const dex = useDex()

  const theme = useApp((state) => state.theme)
  const spriteStyle = useApp((state) => state.spriteStyle)
  const density = useApp((state) => state.density)
  const language = useApp((state) => state.language)
  const shiny = useApp((state) => state.shiny)
  const animateSprites = useApp((state) => state.animateSprites)
  const showDexNumbers = useApp((state) => state.showDexNumbers)
  const preferredVersionGroup = useApp((state) => state.preferredVersionGroup)
  const setSetting = useApp((state) => state.setSetting)

  const favorites = useApp((state) => state.favorites)
  const caught = useApp((state) => state.caught)
  const compare = useApp((state) => state.compare)
  const recent = useApp((state) => state.recent)
  const team = useApp((state) => state.team)
  const clearCaught = useApp((state) => state.clearCaught)
  const clearTeam = useApp((state) => state.clearTeam)
  const clearCompare = useApp((state) => state.clearCompare)

  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const versionGroupsByGeneration = useMemo(() => {
    const sorted = [...dex.meta.versionGroups].sort((a, b) => a.order - b.order)
    return dex.meta.generations.map((generation) => ({
      generation,
      groups: sorted.filter((group) => group.generation === generation.id),
    }))
  }, [dex])

  const languages = useMemo(() => {
    const available = new Set<string>()
    for (const entry of dex.entries.slice(0, 200)) {
      for (const code of Object.keys(entry.names)) available.add(code)
    }
    return dex.meta.languages.filter((item) => available.has(item.code))
  }, [dex])

  const sampleNames = useMemo(
    () =>
      PREVIEW_IDS.slice(0, 3)
        .map((id) => dex.byId.get(id))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .map((entry) => entry.names[language] ?? entry.label),
    [dex, language],
  )

  const teamCount = team.filter(Boolean).length

  const applyPatch = (patch: ImportPatch) => {
    useApp.setState(patch)
  }

  const exportCollection = () => {
    const payload: CollectionExport = {
      app: 'pokedex-opus-5-ultracode',
      version: 1,
      exportedAt: new Date().toISOString(),
      theme,
      spriteStyle,
      density,
      language,
      shiny,
      animateSprites,
      showDexNumbers,
      preferredVersionGroup,
      favorites,
      caught,
      compare,
      recent,
      team,
    }
    downloadJson(`pokedex-collection-${new Date().toISOString().slice(0, 10)}.json`, payload)
  }

  const runImport = (text: string) => {
    try {
      const patch = parseCollection(text)
      applyPatch(patch)
      setImportStatus({ ok: true, message: describePatch(patch) })
      setImportText('')
    } catch (error) {
      setImportStatus({ ok: false, message: (error as Error).message })
    }
  }

  const importFromFile = (file: File | undefined) => {
    if (!file) return
    void file
      .text()
      .then((text) => runImport(text))
      .catch(() => setImportStatus({ ok: false, message: 'That file could not be read.' }))
  }

  const resetPreferences = () => {
    applyPatch({
      theme: 'dark',
      spriteStyle: 'artwork',
      density: 'comfortable',
      language: 'en',
      shiny: false,
      animateSprites: true,
      showDexNumbers: true,
      preferredVersionGroup: null,
    })
  }

  return (
    <div style={{ '--accent': 'var(--type-electric)' } as React.CSSProperties}>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        subtitle="Everything here is stored locally in this browser. Nothing is sent anywhere, and clearing site data resets it all."
        actions={
          <ConfirmButton label="Reset preferences" confirmLabel="Reset — sure?" onConfirm={resetPreferences} />
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Panel className="min-w-0">
          <SectionTitle eyebrow="Interface">Appearance</SectionTitle>

          <Field label="Theme" hint="System follows your OS preference.">
            <Segmented
              value={theme}
              onChange={(value) => setSetting('theme', value)}
              options={THEMES.map((value) => ({
                value,
                label: value === 'dark' ? 'Dark' : value === 'light' ? 'Light' : 'System',
              }))}
            />
          </Field>

          <Field label="Card density" hint="Compact fits more Pokémon per screen in grids.">
            <Segmented
              value={density}
              onChange={(value) => setSetting('density', value)}
              options={DENSITIES.map((value) => ({
                value,
                label: value === 'comfortable' ? 'Comfortable' : 'Compact',
              }))}
            />
          </Field>

          <div className="mt-1 divide-y divide-line-soft border-t border-line-soft pt-1">
            <Toggle
              checked={showDexNumbers}
              onChange={(value) => setSetting('showDexNumbers', value)}
              label="Show dex numbers"
              hint="National dex ids on cards and list rows."
            />
            <Toggle
              checked={animateSprites}
              onChange={(value) => setSetting('animateSprites', value)}
              label="Animate sprites"
              hint="Play animated Showdown sprites where the set has them."
            />
          </div>
        </Panel>

        <Panel className="min-w-0">
          <SectionTitle eyebrow="Artwork">Sprites</SectionTitle>

          <Field label="Sprite style" hint={SPRITE_STYLE_HINTS[spriteStyle]}>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <Segmented
                value={spriteStyle}
                onChange={(value) => setSetting('spriteStyle', value)}
                options={SPRITE_STYLES.map((value) => ({ value, label: SPRITE_STYLE_LABELS[value] }))}
              />
            </div>
          </Field>

          <div className="mt-3 flex items-center justify-around gap-2 rounded-plate border border-line-soft bg-surface/40 p-3">
            {PREVIEW_IDS.map((id) => (
              <Sprite
                key={id}
                sources={spriteSources(id, spriteStyle, shiny)}
                alt={dex.byId.get(id)?.label ?? `Pokémon ${id}`}
                className="h-16 w-16"
                pixelated={spriteStyle === 'game' || spriteStyle === 'showdown'}
              />
            ))}
          </div>

          <div className="mt-2 border-t border-line-soft pt-1">
            <Toggle
              checked={shiny}
              onChange={(value) => setSetting('shiny', value)}
              label="Shiny by default"
              hint="Render shiny variants everywhere sprites appear."
            />
          </div>
        </Panel>

        <Panel className="min-w-0">
          <SectionTitle eyebrow="Context">Games &amp; language</SectionTitle>

          <Field
            label="Preferred version group"
            hint="Learnsets, encounters and flavour text default to this game where a page offers a choice."
          >
            <Select
              value={preferredVersionGroup ?? ''}
              onChange={(event) =>
                setSetting('preferredVersionGroup', event.target.value ? Number(event.target.value) : null)
              }
              className="w-full max-w-sm"
              aria-label="Preferred version group"
            >
              <option value="">No preference — newest available</option>
              {versionGroupsByGeneration.map(({ generation, groups }) => (
                <optgroup key={generation.id} label={generation.label}>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>

          <Field label="Name language" hint="Applies to localized species names where the dataset has them.">
            <Select
              value={language}
              onChange={(event) => setSetting('language', event.target.value)}
              className="w-full max-w-sm"
              aria-label="Name language"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="mt-2 rounded-chip border border-line-soft bg-surface/40 px-3 py-2">
            <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Preview</p>
            <p className="mt-1 truncate text-sm">{sampleNames.join(' · ')}</p>
          </div>
        </Panel>

        <Panel className="min-w-0">
          <SectionTitle
            eyebrow="Local storage"
            actions={
              <Link
                to="/favorites"
                className="numeric rounded-chip border border-line px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim transition hover:bg-raised hover:text-ink"
              >
                Open collection
              </Link>
            }
          >
            Your data
          </SectionTitle>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Figure label="Favourites" value={favorites.length} />
            <Figure label="Caught" value={caught.length} />
            <Figure label="Team" value={`${teamCount}/6`} />
            <Figure label="Comparing" value={compare.length} />
            <Figure label="Recent" value={recent.length} />
            <Figure
              label="Coverage"
              value={`${((caught.length / Math.max(1, dex.meta.counts.species)) * 100).toFixed(1)}%`}
            />
          </dl>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
            <Button variant="solid" size="sm" onClick={exportCollection}>
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Import file…
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                importFromFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>

          <label className="mt-3 block">
            <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              …or paste an export
            </span>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={4}
              spellCheck={false}
              placeholder='{ "favorites": [25, 6], "caught": [1] }'
              className="numeric mt-1.5 w-full resize-y rounded-chip border border-line bg-surface px-3 py-2 text-[12px] text-ink placeholder:text-faint focus:border-accent"
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!importText.trim()} onClick={() => runImport(importText)}>
              Import pasted JSON
            </Button>
            {importStatus && (
              <span
                role="status"
                className={cx(
                  'text-[12px]',
                  importStatus.ok ? 'text-[var(--type-grass)]' : 'text-[var(--type-fighting)]',
                )}
              >
                {importStatus.message}
              </span>
            )}
          </div>

          <div className="mt-5 border-t border-line-soft pt-4">
            <p className="numeric mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              Destructive
            </p>
            <div className="flex flex-wrap gap-2">
              <ConfirmButton
                label={`Clear favourites (${favorites.length})`}
                confirmLabel="Delete favourites?"
                disabled={favorites.length === 0}
                onConfirm={() => useApp.setState({ favorites: [] })}
              />
              <ConfirmButton
                label={`Clear caught (${caught.length})`}
                confirmLabel="Delete caught marks?"
                disabled={caught.length === 0}
                onConfirm={clearCaught}
              />
              <ConfirmButton
                label={`Clear team (${teamCount})`}
                confirmLabel="Delete the team?"
                disabled={teamCount === 0}
                onConfirm={clearTeam}
              />
              <ConfirmButton
                label={`Clear compare (${compare.length})`}
                confirmLabel="Clear comparison?"
                disabled={compare.length === 0}
                onConfirm={clearCompare}
              />
              <ConfirmButton
                label={`Clear history (${recent.length})`}
                confirmLabel="Clear history?"
                disabled={recent.length === 0}
                onConfirm={() => useApp.setState({ recent: [] })}
              />
              <ConfirmButton
                label="Erase everything"
                confirmLabel="Erase all local data?"
                onConfirm={() => {
                  useApp.setState({
                    favorites: [],
                    caught: [],
                    compare: [],
                    recent: [],
                    team: [null, null, null, null, null, null],
                  })
                  resetPreferences()
                  setImportStatus({ ok: true, message: 'Local data erased.' })
                }}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              Clearing is immediate and cannot be undone. Export first if you want a backup.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="numeric mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{label}</p>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-dim">{hint}</p>}
    </div>
  )
}

function Figure({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0">
      <dt className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="numeric mt-0.5 truncate text-lg font-bold leading-none">{value}</dd>
    </div>
  )
}

function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  label: string
  confirmLabel: string
  onConfirm: () => void
  disabled?: boolean
}) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(timer.current ?? undefined), [])

  const handle = () => {
    if (!armed) {
      setArmed(true)
      window.clearTimeout(timer.current ?? undefined)
      timer.current = window.setTimeout(() => setArmed(false), 4000)
      return
    }
    window.clearTimeout(timer.current ?? undefined)
    setArmed(false)
    onConfirm()
  }

  return (
    <Button variant={armed ? 'danger' : 'outline'} size="sm" disabled={disabled} onClick={handle}>
      {armed ? confirmLabel : label}
    </Button>
  )
}
