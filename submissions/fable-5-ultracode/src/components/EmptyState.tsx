interface Props {
  title: string
  hint?: string
  children?: React.ReactNode
}

export default function EmptyState({ title, hint, children }: Props) {
  return (
    <div className="empty">
      <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true" opacity="0.4">
        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M6 32h20M38 32h20" stroke="currentColor" strokeWidth="3" />
        <circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
      <div className="e-title">{title}</div>
      {hint && <div>{hint}</div>}
      {children}
    </div>
  )
}
