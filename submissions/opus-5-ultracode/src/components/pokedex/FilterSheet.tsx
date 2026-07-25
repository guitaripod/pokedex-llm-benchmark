import { useEffect, useRef, type ReactNode } from 'react'
import { useDialogFocus } from '@/lib/a11y'
import { cx } from '@/lib/cx'

export interface FilterSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/// Mobile presentation of the filter rail: a left slide-over that locks the page behind it.
export function FilterSheet({ open, onClose, children }: FilterSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(dialogRef, open)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <div className={cx('lg:hidden', !open && 'pointer-events-none')} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close filters"
        onClick={onClose}
        className={cx(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={open}
        aria-label="Pokédex filters"
        inert={!open}
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-[min(22rem,88vw)] flex-col bg-bg transition-transform duration-300 ease-[var(--ease-out-expo)]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3">
          <p className="numeric text-[11px] font-semibold uppercase tracking-[0.2em] text-dim">Filters</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            tabIndex={open ? 0 : -1}
            className="flex h-8 w-8 items-center justify-center rounded-chip text-faint transition hover:bg-raised hover:text-ink"
          >
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m3.5 3.5 7 7M10.5 3.5l-7 7" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 p-2">{children}</div>
      </div>
    </div>
  )
}
