import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { NAV_GROUPS, FOOTER_ITEMS, type NavItem } from './nav'
import { CommandPalette } from './CommandPalette'
import { useApp } from '@/lib/store'
import { useMediaQuery } from '@/lib/a11y'
import { cx } from '@/lib/cx'

const SHORTCUT_ROUTES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items)
    .filter((item) => item.shortcut)
    .map((item) => [item.shortcut!.toLowerCase(), item.to]),
)

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setDrawerOpen(false)
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname, location.hash])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('[role="listbox"], [role="combobox"], [role="dialog"]') !== null)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === '/') {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      const route = SHORTCUT_ROUTES[event.key.toLowerCase()]
      if (route) {
        event.preventDefault()
        navigate(route)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-chip focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-[#0b0d12]"
      >
        Skip to content
      </a>

      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="lg:pl-[236px]">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} onOpenDrawer={() => setDrawerOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const hidden = !open && !isDesktop

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        inert={hidden}
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col border-r border-line bg-surface transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Link
          to="/"
          className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4 transition hover:bg-raised"
        >
          <Emblem />
          <span className="min-w-0">
            <span className="block font-display text-[13px] font-bold leading-tight tracking-tight">
              Pokédex
            </span>
            <span className="numeric block text-[9px] uppercase tracking-[0.18em] text-faint">
              Opus 5 · Ultracode
            </span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="numeric mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-faint">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <SidebarLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line px-2.5 py-2.5">
          <ul className="space-y-0.5">
            {FOOTER_ITEMS.map((item) => (
              <li key={item.to}>
                <SidebarLink item={item} />
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cx(
          'group flex h-9 items-center gap-2.5 rounded-chip px-2.5 text-[13px] transition',
          isActive
            ? 'bg-raised font-medium text-ink shadow-[inset_2px_0_0_var(--accent)]'
            : 'text-dim hover:bg-raised hover:text-ink',
        )
      }
    >
      {item.icon}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.shortcut && (
        <kbd className="numeric hidden rounded border border-line px-1 text-[9px] text-faint group-hover:inline lg:inline">
          {item.shortcut}
        </kbd>
      )}
    </NavLink>
  )
}

function TopBar({
  onOpenPalette,
  onOpenDrawer,
}: {
  onOpenPalette: () => void
  onOpenDrawer: () => void
}) {
  const theme = useApp((state) => state.theme)
  const setSetting = useApp((state) => state.setSetting)
  const shiny = useApp((state) => state.shiny)
  const teamCount = useApp((state) => state.team.filter(Boolean).length)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-[color-mix(in_oklab,var(--ui-bg)_86%,transparent)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open navigation"
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-chip text-dim transition hover:bg-raised hover:text-ink lg:hidden"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
          <path d="M3.5 6h13M3.5 10h13M3.5 14h13" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onOpenPalette}
        className="flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-chip border border-line bg-surface px-3 text-left text-sm text-faint transition hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--ui-line))] sm:max-w-md"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <span className="flex-1 truncate">Search Pokémon, moves, items…</span>
        <kbd className="numeric hidden rounded border border-line px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSetting('shiny', !shiny)}
          aria-pressed={shiny}
          title={shiny ? 'Showing shiny sprites' : 'Show shiny sprites'}
          className={cx(
            'flex h-9 w-9 items-center justify-center rounded-chip transition',
            shiny ? 'bg-[var(--type-electric)]/18 text-[var(--type-electric)]' : 'text-dim hover:bg-raised hover:text-ink',
          )}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
            <path d="m10 2.5 1.9 4.6 4.6 1.9-4.6 1.9L10 15.5l-1.9-4.6L3.5 9l4.6-1.9Z" />
            <path d="M15.5 13.5 16 15l1.5.5-1.5.5-.5 1.5-.5-1.5L13.5 15l1.5-.5Z" />
          </svg>
        </button>

        <Link
          to="/team"
          title="Team builder"
          className="relative flex h-9 w-9 items-center justify-center rounded-chip text-dim transition hover:bg-raised hover:text-ink"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
            <circle cx="7" cy="7" r="2.6" />
            <circle cx="14" cy="7.5" r="2.1" />
            <path d="M2.6 16c0-2.6 2-4.4 4.4-4.4s4.4 1.8 4.4 4.4M13 11.7c2.2 0 4 1.6 4 4.3" />
          </svg>
          {teamCount > 0 && (
            <span className="numeric absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-[#0b0d12]">
              {teamCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setSetting('theme', theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle colour theme"
          className="flex h-9 w-9 items-center justify-center rounded-chip text-dim transition hover:bg-raised hover:text-ink"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
            <path className="hidden dark:block" d="M16 11.5A6.5 6.5 0 0 1 8.5 4a6.5 6.5 0 1 0 7.5 7.5Z" />
            <g className="dark:hidden">
              <circle cx="10" cy="10" r="3.5" />
              <path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.3 1.3M6 14l-1.3 1.3M15.3 15.3 14 14M6 6 4.7 4.7" strokeLinecap="round" />
            </g>
          </svg>
        </button>
      </div>
    </header>
  )
}

function Emblem() {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
      <svg viewBox="0 0 32 32" className="h-8 w-8">
        <circle cx="16" cy="16" r="14.5" fill="var(--ui-raised)" stroke="var(--ui-line)" />
        <path d="M1.5 16h29" stroke="var(--ui-line)" strokeWidth="1.4" />
        <path
          d="M1.5 16a14.5 14.5 0 0 1 29 0Z"
          fill="var(--accent)"
          opacity="0.9"
        />
        <circle cx="16" cy="16" r="5" fill="var(--ui-surface)" stroke="var(--ui-line)" strokeWidth="1.4" />
        <circle cx="16" cy="16" r="2" fill="var(--accent)" />
      </svg>
    </span>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-faint">
          Data from the{' '}
          <a
            href="https://pokeapi.co"
            target="_blank"
            rel="noreferrer noopener"
            className="text-dim underline decoration-line underline-offset-2 transition hover:text-accent"
          >
            PokéAPI
          </a>{' '}
          dataset. Pokémon and Pokémon character names are trademarks of Nintendo.
        </p>
        <div className="flex items-center gap-4 text-xs text-faint">
          <Link to="/about" className="transition hover:text-ink">
            About
          </Link>
          <Link to="/settings" className="transition hover:text-ink">
            Settings
          </Link>
          <a href="/api" className="transition hover:text-ink">
            API
          </a>
        </div>
      </div>
    </footer>
  )
}
