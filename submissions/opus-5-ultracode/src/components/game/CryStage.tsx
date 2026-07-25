import { useEffect, useRef, useState } from 'react'
import { cryUrl } from '@/lib/sprites'
import { cx } from '@/lib/cx'

const BAR_HEIGHTS = [38, 66, 100, 74, 52, 88, 44]

export interface CryStageProps {
  pokemonId: number
  /** Changing this restarts playback for a new round. */
  roundKey: number
  autoPlay: boolean
  className?: string
}

export function CryStage({ pokemonId, roundKey, autoPlay, className }: CryStageProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [status, setStatus] = useState<'idle' | 'playing' | 'error'>('idle')
  const [plays, setPlays] = useState(0)

  useEffect(() => {
    setStatus('idle')
    setPlays(0)
    if (!autoPlay) return
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
  }, [pokemonId, roundKey, autoPlay])

  const replay = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => setStatus('error'))
  }

  return (
    <div
      className={cx('flex flex-col items-center justify-center gap-5 text-center', className)}
      aria-live="polite"
    >
      <audio
        ref={audioRef}
        src={cryUrl(pokemonId)}
        preload="auto"
        onPlay={() => {
          setStatus('playing')
          setPlays((count) => count + 1)
        }}
        onEnded={() => setStatus((current) => (current === 'playing' ? 'idle' : current))}
        onError={() => setStatus('error')}
      />

      <div aria-hidden className="flex h-20 items-center justify-center gap-1.5">
        {BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            className={cx(
              'w-1.5 rounded-full transition-[height,opacity] duration-300',
              status === 'playing' ? 'animate-pulse opacity-100' : 'opacity-30',
            )}
            style={{
              height: status === 'playing' ? `${height}%` : '14%',
              background: 'var(--accent)',
              animationDelay: `${index * 70}ms`,
            }}
          />
        ))}
      </div>

      {status === 'error' ? (
        <p className="max-w-[26ch] text-sm text-dim">
          This cry could not be played. Skip the round or switch modes.
        </p>
      ) : (
        <button
          type="button"
          onClick={replay}
          aria-label={plays === 0 ? 'Play the cry' : 'Replay the cry'}
          className="group flex h-14 w-14 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--accent)_55%,transparent)] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent transition hover:bg-[color-mix(in_oklab,var(--accent)_24%,transparent)]"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-[1px]" fill="currentColor">
            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
          </svg>
        </button>
      )}

      <p className="numeric text-[10px] uppercase tracking-[0.16em] text-faint">
        {status === 'error' ? 'Audio unavailable' : plays === 0 ? 'Tap to play' : `Plays ${plays}`}
      </p>
    </div>
  )
}
