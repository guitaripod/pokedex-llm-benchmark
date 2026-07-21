import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { cycleTheme, useSettings } from '../lib/store'
import { openCommandPalette } from './CommandPalette'

const LINKS = [
  { to: '/', label: 'Dex', end: true },
  { to: '/types', label: 'Types' },
  { to: '/moves', label: 'Moves' },
  { to: '/abilities', label: 'Abilities' },
  { to: '/items', label: 'Items' },
  { to: '/team', label: 'Team' },
  { to: '/compare', label: 'Compare' },
  { to: '/quiz', label: 'Quiz' }
]

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === 'light') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7" />
      </svg>
    )
  }
  if (theme === 'dark') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Nav() {
  const { theme } = useSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <>
      <header className="site-nav">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" fill="#f6f2e8" />
              <path d="M32 3a29 29 0 0 1 29 29H3A29 29 0 0 1 32 3Z" fill="#e3350d" />
              <rect x="3" y="29.5" width="58" height="5" rx="2.5" fill="#151a21" />
              <circle cx="32" cy="32" r="10" fill="#151a21" />
              <circle cx="32" cy="32" r="6.5" fill="#f6f2e8" />
              <circle cx="32" cy="32" r="29" fill="none" stroke="#151a21" strokeWidth="3.5" />
            </svg>
            <span>
              Pokédex
              <span className="brand-sub">FABLE-5 · ULTRACODE</span>
            </span>
          </Link>
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <button type="button" className="kbd-hint" onClick={openCommandPalette} aria-label="Search (press slash)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.8-3.8" />
              </svg>
              <span>Search</span>
              <kbd>/</kbd>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={cycleTheme}
              title={`Theme: ${theme}`}
              aria-label={`Switch theme (current: ${theme})`}
            >
              <ThemeIcon theme={theme} />
            </button>
            <button
              type="button"
              className="icon-btn nav-burger"
              onClick={() => setMenuOpen(o => !o)}
              aria-expanded={menuOpen}
              aria-label="Menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <nav className="mobile-menu" aria-label="Mobile">
          {[...LINKS, { to: '/favorites', label: 'Favorites', end: false }, { to: '/about', label: 'About', end: false }].map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}
