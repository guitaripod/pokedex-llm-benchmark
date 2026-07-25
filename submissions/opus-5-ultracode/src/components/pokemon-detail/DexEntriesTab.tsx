import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionTitle, EmptyState } from '@/components/ui/Panel'
import { KeyRow, Micro } from './shared'
import { useDex } from '@/lib/dex'
import type { PokemonDetail } from '@/types/data'

export function DexEntriesTab({ detail }: { detail: PokemonDetail }) {
  const dex = useDex()

  const entries = useMemo(() => {
    const grouped = new Map<string, number[]>()
    for (const [versionId, text] of detail.flavorText) {
      const list = grouped.get(text)
      if (list) list.push(versionId)
      else grouped.set(text, [versionId])
    }
    return [...grouped.entries()].map(([text, versionIds]) => ({ text, versionIds }))
  }, [detail.flavorText])

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel className="min-w-0">
        <SectionTitle eyebrow={`${detail.flavorText.length} entries`}>Pokédex text</SectionTitle>
        {entries.length === 0 ? (
          <EmptyState title="No dex entries" hint="No flavour text has been recorded for this form." />
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.text}
                className="rounded-chip border border-line-soft bg-surface/60 p-3.5"
              >
                <div className="mb-2 flex flex-wrap gap-1">
                  {entry.versionIds.map((versionId) => (
                    <span
                      key={versionId}
                      className="numeric rounded-chip border border-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-faint"
                    >
                      {dex.nameOf('versions', versionId)}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] leading-relaxed text-dim">{entry.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 self-start">
        <Panel>
          <SectionTitle eyebrow="Regional numbers">Pokédex listings</SectionTitle>
          {detail.dexNumbers.length === 0 ? (
            <p className="text-[13px] text-dim">Not listed in any regional pokédex.</p>
          ) : (
            <ul>
              {detail.dexNumbers.map(([pokedexId, number]) => (
                <li key={pokedexId}>
                  <Link
                    to={`/pokedexes/${pokedexId}`}
                    className="flex items-baseline justify-between gap-4 border-b border-line-soft py-1.5 transition last:border-0 hover:text-accent"
                  >
                    <span className="numeric truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                      {dex.nameOf('pokedexes', pokedexId)}
                    </span>
                    <span className="numeric shrink-0 text-[13px] font-semibold tabular-nums">
                      #{String(number).padStart(3, '0')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {detail.palPark.length > 0 && (
          <Panel>
            <SectionTitle eyebrow="Generation IV transfer">Pal Park</SectionTitle>
            {detail.palPark.map((park) => (
              <div key={park.areaId}>
                <KeyRow label="Area" value={dex.nameOf('palParkAreas', park.areaId)} />
                <KeyRow label="Base score" value={park.baseScore} />
                <KeyRow label="Catch rate" value={park.rate} />
              </div>
            ))}
          </Panel>
        )}

        {detail.pokeathlon.length > 0 && (
          <Panel>
            <SectionTitle eyebrow="HeartGold · SoulSilver">Pokéathlon</SectionTitle>
            <ul className="space-y-1.5">
              {detail.pokeathlon.map((stat) => (
                <li key={stat.statId} className="flex items-center justify-between gap-3">
                  <Micro className="shrink-0">{POKEATHLON_LABELS[stat.statId] ?? `Stat ${stat.statId}`}</Micro>
                  <span className="numeric text-[12px] tabular-nums text-dim">
                    <span className="font-semibold text-ink">{stat.base}</span> ({stat.min}–{stat.max})
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {detail.gameIndices.length > 0 && (
          <Panel>
            <SectionTitle eyebrow={`${detail.gameIndices.length} versions`}>Internal game index</SectionTitle>
            <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 xl:grid-cols-2">
              {detail.gameIndices.map((index) => (
                <div
                  key={index.versionId}
                  className="flex items-baseline justify-between gap-2 border-b border-line-soft py-1 last:border-0"
                >
                  <span className="truncate text-[11px] text-faint">
                    {dex.nameOf('versions', index.versionId)}
                  </span>
                  <span className="numeric shrink-0 text-[11px] tabular-nums text-dim">{index.gameIndex}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}

const POKEATHLON_LABELS: Record<number, string> = {
  1: 'Speed',
  2: 'Power',
  3: 'Skill',
  4: 'Stamina',
  5: 'Jump',
}
