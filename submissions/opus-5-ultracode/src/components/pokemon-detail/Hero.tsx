import { useEffect, useRef, useState } from 'react'
import { Sprite } from '@/components/ui/Sprite'
import { TypeBadge } from '@/components/ui/TypeBadge'
import { Button } from '@/components/ui/Controls'
import { Fact, Micro } from './shared'
import { useDex } from '@/lib/dex'
import { useApp } from '@/lib/store'
import { cryUrl, heroCandidates } from '@/lib/sprites'
import { formatHeight, formatWeight } from '@/lib/game'
import { cx } from '@/lib/cx'
import type { PokemonDetail, PokemonIndexEntry } from '@/types/data'

const NAME_LANGUAGES: { code: string; label: string }[] = [
  { code: 'ja', label: 'Japanese' },
  { code: 'ja-roma', label: 'Rōmaji' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh-hant', label: 'Chinese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
]

export function Hero({ entry, detail }: { entry: PokemonIndexEntry; detail: PokemonDetail | undefined }) {
  const dex = useDex()
  const shiny = useApp((state) => state.shiny)
  const setSetting = useApp((state) => state.setSetting)

  const japanese = entry.names['ja'] ?? entry.names['ja-hrkt'] ?? null
  const romaji = entry.names['ja-roma'] ?? null
  const growthRate = dex.meta.growthRates.find((rate) => rate.id === entry.growthRateId)

  return (
    <section
      className="plate relative overflow-hidden shadow-plate"
      aria-label={`${entry.label} overview`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-72 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 30% 100%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 72%)',
        }}
      />

      <div className="relative grid grid-cols-1 gap-6 p-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8 lg:p-6">
        <div className="flex flex-col gap-3">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-plate border border-line-soft bg-[color-mix(in_oklab,var(--accent)_7%,var(--ui-surface))]">
            <span
              aria-hidden
              className="numeric pointer-events-none absolute -bottom-3 right-1 select-none text-[104px] font-bold leading-none text-ink/[0.05]"
            >
              {String(entry.dex).padStart(3, '0')}
            </span>
            <Sprite
              sources={heroCandidates(entry.id, shiny)}
              alt={`${entry.label}${shiny ? ' (shiny)' : ''}`}
              loading="eager"
              fetchPriority="high"
              className="h-[76%] w-[76%]"
              imgClassName="drop-shadow-[0_18px_30px_rgb(0_0_0/0.45)]"
            />
            <button
              type="button"
              onClick={() => setSetting('shiny', !shiny)}
              aria-pressed={shiny}
              aria-label={shiny ? 'Show regular colouration' : 'Show shiny colouration'}
              title={shiny ? 'Regular' : 'Shiny'}
              className={cx(
                'absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-chip border transition',
                shiny
                  ? 'border-transparent bg-accent text-[#0b0d12]'
                  : 'border-line bg-surface/80 text-dim hover:text-ink',
              )}
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M8 1.2 9.5 5.3 13.6 6.8 9.5 8.3 8 12.4 6.5 8.3 2.4 6.8 6.5 5.3Z" />
                <path d="M12.6 10.4 13.2 12l1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6Z" />
              </svg>
            </button>
          </div>

          <CryPlayer id={entry.id} hasLatest={entry.hasCry} hasLegacy={detail?.cries.legacy ?? false} />
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {entry.types.map((typeId) => (
                <TypeBadge
                  key={typeId}
                  typeId={typeId}
                  label={dex.typeById.get(typeId)?.label ?? '—'}
                  size="lg"
                />
              ))}
              <span className="numeric rounded-chip border border-line px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
                {dex.nameOf('generations', entry.generation)}
              </span>
              {entry.isLegendary && <Flag label="Legendary" color="var(--type-electric)" />}
              {entry.isMythical && <Flag label="Mythical" color="var(--type-fairy)" />}
              {entry.isBaby && <Flag label="Baby" color="var(--type-normal)" />}
              {entry.isMega && <Flag label="Mega" color="var(--type-dragon)" />}
              {entry.isGmax && <Flag label="Gigantamax" color="var(--type-fighting)" />}
              {entry.isBattleOnly && <Flag label="Battle only" color="var(--type-ghost)" />}
              {entry.variantRegion && <Flag label={`${entry.variantRegion} form`} color="var(--type-grass)" />}
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <div className="flex items-baseline gap-3">
                <dt className="numeric shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Genus
                </dt>
                <dd className="min-w-0 truncate text-[13px] text-dim">{entry.genus ?? 'Unknown'}</dd>
              </div>
              {japanese && (
                <div className="flex items-baseline gap-3">
                  <dt className="numeric shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                    日本語
                  </dt>
                  <dd className="min-w-0 truncate text-[13px] text-dim">
                    {japanese}
                    {romaji && <span className="text-faint"> · {romaji}</span>}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <Fact label="Height" value={formatHeight(entry.height).split(' · ')[0]} hint={formatHeight(entry.height).split(' · ')[1]} />
            <Fact label="Weight" value={formatWeight(entry.weight).split(' · ')[0]} hint={formatWeight(entry.weight).split(' · ')[1]} />
            <Fact label="Base exp" value={entry.baseExp || '—'} />
            <Fact label="Capture rate" value={entry.captureRate} hint={`${((entry.captureRate / 255) * 100).toFixed(1)}% of max`} />
            <Fact label="Happiness" value={entry.baseHappiness} />
            <Fact label="Growth" value={growthRate?.label ?? '—'} hint={growthRate ? `${growthRate.levels[99].toLocaleString()} exp to 100` : undefined} />
          </div>

          <div className="min-w-0">
            <Micro className="mb-2">Localised names</Micro>
            <div className="flex flex-wrap gap-1.5">
              {NAME_LANGUAGES.filter((language) => entry.names[language.code]).map((language) => (
                <span
                  key={language.code}
                  className="inline-flex items-baseline gap-1.5 rounded-chip border border-line-soft bg-surface/60 px-2 py-1"
                  title={language.label}
                >
                  <span className="numeric text-[9px] uppercase tracking-[0.14em] text-faint">
                    {language.code}
                  </span>
                  <span className="text-[12px]">{entry.names[language.code]}</span>
                </span>
              ))}
            </div>
          </div>

          {detail?.species.description && (
            <p className="max-w-3xl border-l-2 border-[color-mix(in_oklab,var(--accent)_60%,transparent)] pl-3 text-[13px] leading-relaxed text-dim">
              {detail.species.description}
            </p>
          )}
          {detail?.species.formDescription && (
            <p className="max-w-3xl text-[12px] leading-relaxed text-faint">{detail.species.formDescription}</p>
          )}
        </div>
      </div>
    </section>
  )
}

function Flag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="numeric rounded-chip px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 34%, transparent)`,
      }}
    >
      {label}
    </span>
  )
}

/// Plays the proxied cry files, keeping one <audio> per variant so playback state stays honest.
function CryPlayer({ id, hasLatest, hasLegacy }: { id: number; hasLatest: boolean; hasLegacy: boolean }) {
  const latestRef = useRef<HTMLAudioElement>(null)
  const legacyRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState<'latest' | 'legacy' | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setPlaying(null)
    setFailed(false)
  }, [id])

  if (!hasLatest && !hasLegacy) {
    return (
      <p className="numeric rounded-chip border border-dashed border-line px-3 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-faint">
        No cry recorded
      </p>
    )
  }

  const play = (variant: 'latest' | 'legacy') => {
    const element = variant === 'latest' ? latestRef.current : legacyRef.current
    const other = variant === 'latest' ? legacyRef.current : latestRef.current
    if (other) {
      other.pause()
      other.currentTime = 0
    }
    if (!element) return
    element.currentTime = 0
    void element.play().then(
      () => setPlaying(variant),
      () => setFailed(true),
    )
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={latestRef}
        src={cryUrl(id)}
        preload="none"
        onEnded={() => setPlaying(null)}
        onError={() => setFailed(true)}
      />
      {hasLegacy && (
        <audio
          ref={legacyRef}
          src={cryUrl(id, true)}
          preload="none"
          onEnded={() => setPlaying(null)}
          onError={() => setFailed(true)}
        />
      )}

      <Button
        variant={playing === 'latest' ? 'solid' : 'outline'}
        size="sm"
        onClick={() => play('latest')}
        disabled={!hasLatest || failed}
        className="flex-1"
        aria-label={`Play ${playing === 'latest' ? 'again' : ''} cry`}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M4 2.5 12.5 8 4 13.5Z" />
        </svg>
        Cry
      </Button>
      {hasLegacy && (
        <Button
          variant={playing === 'legacy' ? 'solid' : 'outline'}
          size="sm"
          onClick={() => play('legacy')}
          disabled={failed}
          className="flex-1"
          aria-label="Play legacy cry"
        >
          Legacy
        </Button>
      )}
      {failed && <span className="numeric text-[10px] uppercase tracking-[0.14em] text-faint">Audio n/a</span>}
    </div>
  )
}
