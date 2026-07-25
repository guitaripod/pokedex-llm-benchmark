import { Sprite } from '@/components/ui/Sprite'
import { spriteSources } from '@/components/pokemon/PokemonCard'
import { cx } from '@/lib/cx'
import type { PokemonIndexEntry } from '@/types/data'

export interface ArtStageProps {
  entry: PokemonIndexEntry
  revealed: boolean
  /** Renders the artwork as a flat black cut-out until the answer is revealed. */
  silhouette: boolean
}

export function ArtStage({ entry, revealed, silhouette }: ArtStageProps) {
  const concealed = !revealed && !silhouette

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {revealed && (
        <span
          aria-hidden
          className="pointer-events-none absolute h-[78%] w-[78%] animate-[fadeIn_700ms_var(--ease-out-expo)_both] rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklab, var(--accent) 34%, transparent), transparent 68%)',
          }}
        />
      )}
      <div
        key={entry.id}
        className={cx(
          'relative h-full w-full transition-[opacity,transform,filter] duration-700 ease-[var(--ease-out-expo)]',
          concealed ? 'scale-90 opacity-0' : 'scale-100 opacity-100',
          silhouette && !revealed ? 'brightness-0' : 'brightness-100',
        )}
      >
        <Sprite
          sources={spriteSources(entry.id, 'artwork', false)}
          alt={revealed ? entry.label : 'Silhouette of the mystery Pokémon'}
          loading="eager"
          fetchPriority="high"
          className="h-full w-full"
          imgClassName={revealed ? 'drop-shadow-[0_18px_36px_rgb(0_0_0/0.45)]' : undefined}
        />
      </div>
    </div>
  )
}

export function MysteryMark({ label = 'Unknown' }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
      <span
        aria-hidden
        className="numeric select-none text-[92px] font-bold leading-none text-ink/[0.07]"
      >
        ?
      </span>
      <span className="numeric text-[10px] uppercase tracking-[0.24em] text-faint">{label}</span>
    </div>
  )
}
