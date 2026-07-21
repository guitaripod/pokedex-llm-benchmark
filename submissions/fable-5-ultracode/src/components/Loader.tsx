export function Pokeball({ size = 42 }: { size?: number }) {
  return (
    <svg className="pokeball-spin" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M4 32a28 28 0 0 1 56 0" fill="none" stroke="var(--dex-red)" strokeWidth="4" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.4" />
    </svg>
  )
}

export default function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <Pokeball />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}
