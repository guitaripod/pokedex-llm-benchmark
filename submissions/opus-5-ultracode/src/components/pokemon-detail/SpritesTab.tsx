import { Panel, SectionTitle } from '@/components/ui/Panel'
import { Sprite } from '@/components/ui/Sprite'
import { Toggle } from '@/components/ui/Controls'
import { Micro } from './shared'
import { useApp } from '@/lib/store'
import {
  VERSION_SPRITE_SETS,
  artwork,
  dreamWorld,
  gameSprite,
  homeArt,
  showdownSprite,
  versionSprite,
  type VersionSpriteSet,
} from '@/lib/sprites'
import { cx } from '@/lib/cx'
import type { PokemonDetail } from '@/types/data'

const ROMAN_TO_NUMBER: Record<string, number> = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
}

const VARIANT_LABELS: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  shiny: 'Shiny',
  female: 'Female',
  transparent: 'Transparent',
  gray: 'Gray',
  animated: 'Animated',
}

export function SpritesTab({ detail }: { detail: PokemonDetail }) {
  const shiny = useApp((state) => state.shiny)
  const setSetting = useApp((state) => state.setSetting)
  const id = detail.id

  const sets = VERSION_SPRITE_SETS.filter(
    (set) => (ROMAN_TO_NUMBER[set.generation] ?? 9) >= detail.generation,
  )

  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel>
        <SectionTitle
          eyebrow="Renders"
          actions={
            <div className="w-[150px]">
              <Toggle checked={shiny} onChange={(value) => setSetting('shiny', value)} label="Shiny" />
            </div>
          }
        >
          Modern artwork
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Tile label="Official artwork" sources={[artwork(id, shiny)]} large />
          <Tile label="HOME" sources={[homeArt(id, { shiny })]} large />
          <Tile label="HOME female" sources={[homeArt(id, { shiny, female: true })]} large />
          <Tile label="Dream World" sources={[dreamWorld(id)]} large />
          <Tile label="Showdown" sources={[showdownSprite(id, { shiny })]} pixelated />
          <Tile label="Showdown back" sources={[showdownSprite(id, { shiny, back: true })]} pixelated />
          <Tile label="Game front" sources={[gameSprite(id, { shiny })]} pixelated />
          <Tile label="Game back" sources={[gameSprite(id, { shiny, back: true })]} pixelated />
          <Tile label="Game female" sources={[gameSprite(id, { shiny, female: true })]} pixelated />
        </div>
      </Panel>

      <Panel>
        <SectionTitle eyebrow={`${sets.length} sets`}>Sprites by game</SectionTitle>
        {sets.length === 0 ? (
          <p className="text-[13px] text-dim">
            This Pokémon debuted after the last cartridge sprite set was produced.
          </p>
        ) : (
          <ul className="space-y-4">
            {sets.map((set) => (
              <li key={`${set.generation}-${set.key}`} className="border-b border-line-soft pb-4 last:border-0 last:pb-0">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[13px] font-semibold">{set.label}</h3>
                  <Micro>{set.generation.replace('generation-', 'gen ')}</Micro>
                </div>
                <SetTiles set={set} id={id} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function SetTiles({ set, id }: { set: VersionSpriteSet; id: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      <Tile label="Front" sources={[versionSprite(set, id, 'front')]} pixelated />
      {set.variants.map((variant) => (
        <Tile
          key={variant}
          label={VARIANT_LABELS[variant] ?? variant}
          sources={[versionSprite(set, id, variant)]}
          pixelated
        />
      ))}
    </div>
  )
}

function Tile({
  label,
  sources,
  pixelated = false,
  large = false,
}: {
  label: string
  sources: string[]
  pixelated?: boolean
  large?: boolean
}) {
  return (
    <figure className="flex flex-col items-center gap-1.5 rounded-chip border border-line-soft bg-surface/60 p-2">
      <Sprite
        sources={sources}
        alt={label}
        pixelated={pixelated}
        className={cx('w-full', large ? 'h-24' : 'h-16')}
      />
      <figcaption className="numeric w-full truncate text-center text-[9px] uppercase tracking-[0.12em] text-faint">
        {label}
      </figcaption>
    </figure>
  )
}
