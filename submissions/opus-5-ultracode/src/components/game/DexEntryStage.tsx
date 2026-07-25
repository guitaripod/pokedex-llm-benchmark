import { useMemo } from 'react'
import { load, useAsync } from '@/lib/data'
import { useDex } from '@/lib/dex'
import { InlineLoader, ErrorState } from '@/components/shell/Loading'
import { EmptyState } from '@/components/ui/Panel'
import { pickFlavor, redactNames, type FlavorSegment } from './quiz'
import { cx } from '@/lib/cx'
import type { PokemonDetail, PokemonIndexEntry } from '@/types/data'

export interface DexEntryStageProps {
  entry: PokemonIndexEntry
  revealed: boolean
  /** Stable 0–1 draw that fixes which flavour text this round uses. */
  seed: number
}

interface DexEntryView {
  versionId: number
  segments: FlavorSegment[]
}

/// Resolves the round's flavour text and blanks out every mention of the species name.
function buildView(detail: PokemonDetail, seed: number): DexEntryView | null {
  const flavor = pickFlavor(detail.flavorText, seed)
  if (!flavor) return null
  const names = [detail.species.label, detail.label, detail.species.names.en, detail.formLabel]
  return { versionId: flavor[0], segments: redactNames(flavor[1], names) }
}

export function DexEntryStage({ entry, revealed, seed }: DexEntryStageProps) {
  const dex = useDex()
  const state = useAsync(`whos-that:dex:${entry.id}`, () => load.pokemon(entry.id))
  const detail = state.data
  const view = useMemo(() => (detail ? buildView(detail, seed) : null), [detail, seed])

  if (state.loading) return <InlineLoader label="Reading dex" />
  if (state.error) return <ErrorState message={state.error.message} />
  if (!view) {
    return <EmptyState title="No dex entry" hint="This Pokémon has no recorded pokédex text — skip the round." />
  }

  return (
    <figure className="flex h-full min-h-[200px] flex-col justify-center gap-4">
      <blockquote className="font-display text-[15px] leading-relaxed text-ink sm:text-base">
        <span aria-hidden className="mr-1 text-2xl leading-none text-faint">
          “
        </span>
        {view.segments.map((segment, index) =>
          segment.redacted ? (
            <span
              key={index}
              className={cx(
                'inline-block rounded-[4px] px-1 align-baseline font-semibold transition-colors duration-500',
                revealed
                  ? 'bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-accent'
                  : 'bg-[color-mix(in_oklab,var(--ui-text-faint)_30%,transparent)] text-dim',
              )}
            >
              {revealed ? segment.text : '?'.repeat(segment.text.length)}
            </span>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
        <span aria-hidden className="ml-0.5 text-2xl leading-none text-faint">
          ”
        </span>
      </blockquote>
      <figcaption className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
        Pokédex · {dex.nameOf('versions', view.versionId)}
      </figcaption>
    </figure>
  )
}
