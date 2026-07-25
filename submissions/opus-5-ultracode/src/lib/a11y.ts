import { useEffect, useState, type RefObject } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Confines Tab cycling to a dialog, moves focus into it on open and returns focus to whatever
 * opened it on close, while preventing the page behind from scrolling.
 */
export function useDialogFocus(container: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return
    const node = container.current
    if (!node) return

    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
    const first = focusables()[0]
    if (first && !node.contains(document.activeElement)) first.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const start = items[0]
      const end = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === start || !node!.contains(active))) {
        event.preventDefault()
        end.focus()
      } else if (!event.shiftKey && active === end) {
        event.preventDefault()
        start.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [container, open])
}
