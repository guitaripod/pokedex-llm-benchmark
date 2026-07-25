import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Controls'
import { cx } from '@/lib/cx'

export function TeamShareDialog({
  shareUrl,
  json,
  onImport,
  onCopied,
  onClose,
}: {
  shareUrl: string
  json: string
  onImport: (text: string) => boolean
  onCopied: (message: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(json)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  const copy = async (text: string, message: string) => {
    const copied = await copyText(text)
    onCopied(copied ? message : 'Copy failed — select the text manually.')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/70 px-3 pb-8 pt-[6vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share or import team"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
        className="plate w-full max-w-2xl overflow-hidden shadow-plate"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-display text-sm font-semibold">Share · import · export</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 items-center justify-center rounded-chip border border-line text-faint transition hover:bg-raised hover:text-ink"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m3 3 6 6M9 3l-6 6" />
            </svg>
          </button>
        </header>

        <div className="space-y-5 p-4">
          <section>
            <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              Shareable link
            </p>
            <p className="mt-1 text-[11px] text-dim">
              The whole roster — levels, natures, abilities, items, moves, IVs and EVs — is encoded in the URL.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Team share link"
                className="numeric h-9 min-w-0 flex-1 rounded-chip border border-line bg-surface px-3 text-[11px] text-dim"
              />
              <Button variant="solid" onClick={() => void copy(shareUrl, 'Share link copied')}>
                Copy link
              </Button>
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  JSON
                </p>
                <p className="mt-1 text-[11px] text-dim">Paste a team here and import it, or copy yours out.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void copy(draft, 'Team JSON copied')}>
                  Copy
                </Button>
                <Button size="sm" onClick={() => setDraft(json)}>
                  Reset
                </Button>
              </div>
            </div>
            <textarea
              value={draft}
              spellCheck={false}
              onChange={(event) => {
                setDraft(event.target.value)
                setProblem(null)
              }}
              aria-label="Team JSON"
              className={cx(
                'numeric mt-2 h-56 w-full resize-y rounded-plate border bg-surface p-3 text-[11px] leading-relaxed text-dim outline-none focus:border-accent',
                problem ? 'border-[var(--type-fighting)]' : 'border-line',
              )}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[var(--type-fighting)]">{problem}</p>
              <Button
                variant="solid"
                onClick={() => {
                  if (onImport(draft)) {
                    onClose()
                    return
                  }
                  setProblem('Could not read that JSON — expected a team export with a slots array.')
                }}
              >
                Import JSON
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/// Clipboard access is blocked in some contexts, so failure is reported rather than thrown.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
