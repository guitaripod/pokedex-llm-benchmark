import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, TextInput } from '@/components/ui/Controls'
import { TypeDot } from '@/components/ui/TypeBadge'
import { formatDex } from '@/lib/game'
import { cx } from '@/lib/cx'
import { suggest, type SearchEntry } from './quiz'

const MAX_SUGGESTIONS = 6
const LISTBOX_ID = 'whos-that-suggestions'

export interface GuessBoxProps {
  index: SearchEntry[]
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onSkip: () => void
  /** Changing this refocuses the field for the next round. */
  focusKey: number
  notice: string | null
  disabled?: boolean
}

export function GuessBox({
  index,
  value,
  onChange,
  onSubmit,
  onSkip,
  focusKey,
  notice,
  disabled = false,
}: GuessBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(true)

  const suggestions = useMemo(() => suggest(index, value, MAX_SUGGESTIONS), [index, value])
  const visible = open && !disabled && suggestions.length > 0

  useEffect(() => {
    setActive(-1)
    setOpen(true)
  }, [value])

  useEffect(() => {
    if (disabled) return
    inputRef.current?.focus()
  }, [focusKey, disabled])

  const commit = (text: string) => {
    setOpen(false)
    setActive(-1)
    onSubmit(text)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((current) => Math.min(current + 1, suggestions.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, -1))
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      if (visible) setOpen(false)
      else onChange('')
      return
    }
    if (event.key === 'Tab' && visible && active >= 0) {
      event.preventDefault()
      onChange(suggestions[active].label)
      setOpen(false)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      commit(visible && active >= 0 ? suggestions[active].label : value)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <TextInput
            ref={inputRef}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setOpen(false)}
            placeholder="Who's that Pokémon?"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            enterKeyHint="go"
            aria-label="Your guess"
            role="combobox"
            aria-expanded={visible}
            aria-controls={LISTBOX_ID}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `whos-that-option-${active}` : undefined}
          />

          {visible && (
            <ul
              id={LISTBOX_ID}
              role="listbox"
              aria-label="Name suggestions"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-plate border border-line bg-panel shadow-plate"
            >
              {suggestions.map((entry, position) => (
                <li key={entry.id} id={`whos-that-option-${position}`} role="option" aria-selected={position === active}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      commit(entry.label)
                    }}
                    onMouseEnter={() => setActive(position)}
                    className={cx(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                      position === active ? 'bg-raised text-ink' : 'text-dim hover:bg-raised',
                    )}
                  >
                    <span className="numeric w-[46px] shrink-0 text-[11px] text-faint">
                      {formatDex(entry.dex)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {entry.types.map((typeId) => (
                        <TypeDot key={typeId} typeId={typeId} size={7} />
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="solid" size="md" disabled={disabled || value.trim().length === 0} onClick={() => commit(value)}>
          Guess
        </Button>
        <Button variant="ghost" size="md" disabled={disabled} onClick={onSkip}>
          Skip
        </Button>
      </div>

      <p
        className={cx(
          'numeric text-[11px] leading-tight',
          notice ? 'text-[var(--type-fighting)]' : 'text-faint',
        )}
        role={notice ? 'alert' : undefined}
      >
        {notice ?? 'Type a name — ↑ ↓ to pick a suggestion, Enter to lock it in.'}
      </p>
    </div>
  )
}
