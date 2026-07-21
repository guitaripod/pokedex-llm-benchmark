import { useState } from 'react'

const FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="#8a929e" stroke-width="3" opacity="0.35"/><path d="M6 32h20M38 32h20" stroke="#8a929e" stroke-width="3" opacity="0.35"/><circle cx="32" cy="32" r="8" fill="none" stroke="#8a929e" stroke-width="3" opacity="0.35"/></svg>`
  )

interface Props {
  src: string | null
  alt: string
  size?: number
  className?: string
  eager?: boolean
  pixelated?: boolean
}

export default function Sprite({ src, alt, size, className, eager, pixelated }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const url = failed || !src ? FALLBACK : src
  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      style={{
        imageRendering: pixelated ? 'pixelated' : undefined,
        opacity: loaded || failed ? 1 : 0,
        transition: 'opacity 240ms ease'
      }}
    />
  )
}
