import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel, SectionTitle } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Controls'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { StatBars } from '@/components/pokemon/StatBars'
import { typeSlug, useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { cryUrl, heroCandidates } from '@/lib/sprites'
import { formatDex, formatHeight, formatWeight } from '@/lib/game'
import type { PokemonIndexEntry } from '@/types/data'

const LAST_SPECIES_ID = 1025

/// Picks a different member of the pool so every shuffle visibly changes the spotlight.
function pickOther(pool: PokemonIndexEntry[], current?: PokemonIndexEntry): PokemonIndexEntry {
  if (pool.length <= 1) return pool[0]
  let next = pool[Math.floor(Math.random() * pool.length)]
  while (current && next.id === current.id) next = pool[Math.floor(Math.random() * pool.length)]
  return next
}

export function Spotlight() {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const toggleCompare = useApp((state) => state.toggleCompare)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const pool = useMemo(
    () => dex.entries.filter((entry) => entry.isDefault && entry.speciesId <= LAST_SPECIES_ID),
    [dex],
  )
  const [entry, setEntry] = useState<PokemonIndexEntry>(() => pickOther(pool))

  const accent = `var(--type-${typeSlug(entry.types[0] ?? 1)})`
  const generation = dex.meta.generations.find((item) => item.id === entry.generation)
  const region = dex.meta.regions.find((item) => item.id === generation?.mainRegionId)

  const playCry = () => {
    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    audio.src = cryUrl(entry.id)
    audio.volume = 0.4
    void audio.play().catch(() => undefined)
  }

  const shuffle = () => setEntry((current) => pickOther(pool, current))

  return (
    <div className="min-w-0" style={{ '--accent': accent } as React.CSSProperties}>
      <Panel className="relative overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-56 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 30% 100%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 70%)',
          }}
        />

        <SectionTitle
          eyebrow="Spotlight"
          actions={
            <Button size="sm" variant="soft" onClick={shuffle}>
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="M2 4.5h3.5L10 11.5h4M2 11.5h3.5L10 4.5h4" strokeLinecap="round" />
                <path d="m12 2.8 2 1.7-2 1.7M12 9.8l2 1.7-2 1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Shuffle
            </Button>
          }
        >
          Random entry
        </SectionTitle>

        <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={shuffle}
              aria-label={`Shuffle the spotlight — currently ${entry.label}`}
              className="group relative flex h-[168px] w-full items-center justify-center rounded-plate border border-line-soft bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] transition hover:border-[color-mix(in_oklab,var(--accent)_55%,var(--ui-line))]"
            >
              <span
                aria-hidden
                className="numeric pointer-events-none absolute inset-x-0 top-1.5 select-none text-center text-[52px] font-bold leading-none text-ink/[0.05]"
              >
                {String(entry.dex).padStart(3, '0')}
              </span>
              <Sprite
                sources={heroCandidates(entry.id, shiny)}
                alt={entry.label}
                loading="eager"
                fetchPriority="high"
                className="h-[150px] w-[150px] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                imgClassName="drop-shadow-[0_10px_24px_rgb(0_0_0/0.4)]"
              />
            </button>

            <div className="flex w-full items-center gap-1.5">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => toggleCompare(entry.id)}>
                Compare
              </Button>
              {entry.hasCry && (
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={playCry}
                  aria-label={`Play the ${entry.label} cry`}
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <path d="M3 6h2.5L9 3v10L5.5 10H3Z" strokeLinejoin="round" />
                    <path d="M11.5 5.8a3 3 0 0 1 0 4.4" strokeLinecap="round" />
                  </svg>
                </Button>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              {formatDex(entry.dex)} · {generation?.label ?? '—'}
              {region && ` · ${region.label}`}
            </p>
            <h3 className="mt-1 truncate font-display text-2xl font-bold leading-tight">
              <Link to={`/pokemon/${entry.name}`} className="transition hover:text-accent">
                {entry.label}
              </Link>
            </h3>
            {entry.genus && <p className="mt-0.5 truncate text-sm text-dim">{entry.genus}</p>}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {entry.types.map((typeId) => (
                <TypeBadge
                  key={typeId}
                  typeId={typeId}
                  label={dex.typeById.get(typeId)?.label ?? ''}
                  size="sm"
                />
              ))}
              {entry.isLegendary && <Marker label="Legendary" />}
              {entry.isMythical && <Marker label="Mythical" />}
              {entry.isBaby && <Marker label="Baby" />}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-y border-line-soft py-2.5 sm:grid-cols-3">
              <Fact label="Height" value={formatHeight(entry.height)} />
              <Fact label="Weight" value={formatWeight(entry.weight)} />
              <Fact label="Base total" value={String(entry.bst)} />
            </dl>

            <StatBars stats={entry.stats} className="mt-3" />

            <Link
              to={`/pokemon/${entry.name}`}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-chip bg-accent px-4 text-sm font-semibold text-[#0b0d12] transition hover:brightness-110"
            >
              Open entry
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="numeric truncate text-[13px] font-semibold">{value}</dd>
    </div>
  )
}

function Marker({ label }: { label: string }) {
  return (
    <span className="numeric inline-flex h-[22px] items-center rounded-chip border border-line px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
      {label}
    </span>
  )
}
