import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string | null
}

export default function CryButton({ src }: Props) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      setPlaying(false)
    }
  }, [src])

  if (!src) return null

  const play = () => {
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    const audio = new Audio(src)
    audioRef.current = audio
    audio.volume = 0.5
    audio.onended = () => setPlaying(false)
    audio.onerror = () => setPlaying(false)
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  return (
    <button
      type="button"
      className={`btn btn-sm cry-btn${playing ? ' playing' : ''}`}
      aria-pressed={playing}
      onClick={play}
    >
      <span className="eq" aria-hidden="true">
        <i /><i /><i />
      </span>
      {playing ? 'Stop cry' : 'Play cry'}
    </button>
  )
}
