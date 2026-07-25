import { useId, useRef, type ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface TabDefinition {
  id: string
  label: ReactNode
  count?: number
  disabled?: boolean
}

export function tabIds(group: string, id: string) {
  return { tab: `${group}-tab-${id}`, panel: `${group}-panel-${id}` }
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
  idPrefix,
}: {
  tabs: TabDefinition[]
  active: string
  onChange: (id: string) => void
  className?: string
  /** Shared with TabPanel so the panel can be associated with its tab. */
  idPrefix?: string
}) {
  const generated = useId()
  const group = idPrefix ?? generated
  const listRef = useRef<HTMLDivElement>(null)

  /// Roving arrow-key navigation, as the tablist pattern requires.
  function onKeyDown(event: React.KeyboardEvent) {
    const enabled = tabs.filter((tab) => !tab.disabled)
    const index = enabled.findIndex((tab) => tab.id === active)
    if (index === -1) return

    let next: number | null = null
    if (event.key === 'ArrowRight') next = (index + 1) % enabled.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + enabled.length) % enabled.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = enabled.length - 1
    if (next === null) return

    event.preventDefault()
    const target = enabled[next]
    onChange(target.id)
    listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(tabIds(group, target.id).tab)}`)?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cx(
        'flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active
        const ids = tabIds(group, tab.id)
        return (
          <button
            key={tab.id}
            id={ids.tab}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cx(
              'relative shrink-0 whitespace-nowrap px-3.5 py-2.5 font-display text-[13px] font-medium transition disabled:opacity-35',
              selected ? 'text-ink' : 'text-dim hover:text-ink',
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cx(
                    'numeric rounded-full px-1.5 py-px text-[10px] font-semibold',
                    selected ? 'bg-accent/20 text-accent' : 'bg-raised text-faint',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {selected && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" aria-hidden />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({
  children,
  active,
  id,
  idPrefix,
}: {
  children: ReactNode
  active: boolean
  /** The tab id this panel belongs to; enables the aria association when given. */
  id?: string
  idPrefix?: string
}) {
  if (!active) return null
  const ids = id && idPrefix ? tabIds(idPrefix, id) : null
  return (
    <div
      role="tabpanel"
      id={ids?.panel}
      aria-labelledby={ids?.tab}
      tabIndex={0}
      className="animate-[fadeIn_240ms_var(--ease-out-expo)] focus-visible:outline-none"
    >
      {children}
    </div>
  )
}
