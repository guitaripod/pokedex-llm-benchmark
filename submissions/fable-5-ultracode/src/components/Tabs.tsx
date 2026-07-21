import { useRef } from 'react'

interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  label: string
}

export default function Tabs({ tabs, active, onChange, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex(t => t.id === active)
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = tabs.length - 1
    if (next >= 0) {
      e.preventDefault()
      onChange(tabs[next].id)
      const btns = ref.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')
      btns?.[next]?.focus()
    }
  }
  return (
    <div className="tabs" role="tablist" aria-label={label} ref={ref} onKeyDown={onKeyDown}>
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          tabIndex={t.id === active ? 0 : -1}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
