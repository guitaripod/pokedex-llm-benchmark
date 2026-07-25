import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Panel } from '@/components/ui/Panel'
import { Sprite } from '@/components/ui/Sprite'
import { openCommandPalette } from '@/components/home/commandPalette'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { thumbCandidates } from '@/lib/sprites'
import { formatDex } from '@/lib/game'

/** Hand-tuned 12×8 static pattern standing in for the Missingno. block sprite. */
const GLITCH_ROWS = [
  '001100111011',
  '011011001110',
  '110010111001',
  '101110010110',
  '011001101101',
  '110111001011',
  '001011110110',
  '111001011010',
]

export default function NotFound() {
  const dex = useDex()
  const location = useLocation()
  const shiny = useApp((state) => state.shiny)

  const suggestions = useMemo(() => {
    const pool = dex.entries.filter((entry) => entry.isDefault && entry.speciesId <= 1025)
    const picked = new Map<number, (typeof pool)[number]>()
    while (picked.size < 4 && picked.size < pool.length) {
      const entry = pool[Math.floor(Math.random() * pool.length)]
      picked.set(entry.id, entry)
    }
    return [...picked.values()]
  }, [dex])

  return (
    <div
      className="flex min-h-[70vh] items-center justify-center py-8"
      style={{ '--accent': 'var(--type-ghost)' } as React.CSSProperties}
    >
      <Panel className="relative w-full max-w-3xl overflow-hidden">
        <span
          aria-hidden
          className="scanline pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px animate-[shimmer_4s_linear_infinite]"
          style={{
            background:
              'linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 80%, transparent), transparent)',
            backgroundSize: '200% 100%',
          }}
        />

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-start">
          <div>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${GLITCH_ROWS[0].length}, minmax(0, 1fr))` }}
              aria-hidden
            >
              {GLITCH_ROWS.flatMap((row, rowIndex) =>
                [...row].map((cell, cellIndex) => (
                  <span
                    key={`${rowIndex}-${cellIndex}`}
                    className="aspect-square rounded-[1px]"
                    style={{
                      background:
                        cell === '1'
                          ? 'color-mix(in oklab, var(--accent) 72%, transparent)'
                          : 'color-mix(in oklab, var(--ui-text-faint) 16%, transparent)',
                    }}
                  />
                )),
              )}
            </div>
            <p className="numeric mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-faint">
              Missingno.
            </p>
          </div>

          <div className="min-w-0">
            <p className="numeric text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              Error 404 · entry not found
            </p>

            <h1 className="relative mt-2 font-display text-6xl font-bold leading-none tracking-tight sm:text-7xl">
              <span
                aria-hidden
                className="absolute inset-0 translate-x-[3px] text-[var(--type-fighting)] opacity-40 mix-blend-screen"
              >
                404
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-[3px] text-[var(--type-water)] opacity-40 mix-blend-screen"
              >
                404
              </span>
              <span className="relative">404</span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-dim">
              The Pokédex has no record at this address. Either the entry never existed, or the pointer is
              corrupted — the same way a certain glitch appears when the game reads a species out of range.
            </p>

            <p className="numeric mt-3 truncate rounded-chip border border-line-soft bg-surface/60 px-3 py-2 text-[12px] text-faint">
              {location.pathname}
              {location.search}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCommandPalette}
                className="inline-flex h-9 items-center gap-2 rounded-chip bg-accent px-4 text-sm font-semibold text-[#0b0d12] transition hover:brightness-110"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="m10.5 10.5 3 3" />
                </svg>
                Search the dex
                <kbd className="numeric rounded border border-black/20 px-1 text-[10px]">⌘K</kbd>
              </button>
              <Link
                to="/pokedex"
                className="inline-flex h-9 items-center rounded-chip border border-line px-4 text-sm transition hover:bg-raised"
              >
                Browse all Pokémon
              </Link>
              <Link
                to="/"
                className="inline-flex h-9 items-center rounded-chip px-4 text-sm text-dim transition hover:bg-raised hover:text-ink"
              >
                Overview
              </Link>
            </div>
          </div>
        </div>

        <div className="relative mt-6 border-t border-line-soft pt-4">
          <p className="numeric mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
            Verified specimens
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {suggestions.map((entry) => (
              <Link
                key={entry.id}
                to={`/pokemon/${entry.name}`}
                className="group flex items-center gap-2.5 rounded-chip border border-line-soft px-2.5 py-2 transition hover:border-[color-mix(in_oklab,var(--accent)_55%,var(--ui-line))] hover:bg-raised"
              >
                <Sprite
                  sources={thumbCandidates(entry.id, shiny)}
                  alt=""
                  className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium leading-tight">{entry.label}</span>
                  <span className="numeric block text-[10px] tracking-[0.12em] text-faint">
                    {formatDex(entry.dex)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}
