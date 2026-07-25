export function BootScreen() {
  return (
    <div className="dex-grid-bg flex min-h-dvh flex-col items-center justify-center gap-6">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 animate-[spin_2.4s_linear_infinite] rounded-full border-2 border-line border-t-accent" />
        <span className="absolute inset-[22%] rounded-full border-2 border-line" />
        <span className="absolute inset-[42%] rounded-full bg-accent" />
      </div>
      <div className="text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-dim">Pokédex</p>
        <p className="numeric mt-1.5 text-[11px] uppercase tracking-[0.2em] text-faint">
          Initialising national index
        </p>
      </div>
    </div>
  )
}

export function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-faint">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
        <span className="numeric text-[11px] uppercase tracking-[0.2em]">Loading</span>
      </div>
    </div>
  )
}

export function InlineLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-faint">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span className="numeric text-[11px] uppercase tracking-[0.2em]">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-plate border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-base font-semibold">Something went wrong</p>
      <p className="max-w-md text-sm text-dim">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-chip border border-line px-4 py-2 text-sm transition hover:bg-raised"
        >
          Try again
        </button>
      )}
    </div>
  )
}
