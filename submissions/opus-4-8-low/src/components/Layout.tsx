import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { PokeballIcon } from './ui'

const NAV = [
  { to: '/', label: 'Pokédex', end: true },
  { to: '/types', label: 'Types' },
  { to: '/abilities', label: 'Abilities' },
  { to: '/moves', label: 'Moves' },
  { to: '/items', label: 'Items' },
  { to: '/compare', label: 'Compare' },
]

export function Layout() {
  const { dark, toggle } = useTheme()
  const loc = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 grain opacity-70" />
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0e1a]/80">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-black tracking-tight">
            <PokeballIcon className="h-7 w-7 text-red-500" />
            <span className="hidden text-lg sm:inline">
              Poké<span className="text-red-500">dex</span>
            </span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass transition-transform hover:scale-105"
          >
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-7xl px-4 py-10 text-center text-xs text-slate-400">
        <p>
          Data from{' '}
          <a href="https://pokeapi.co" className="underline hover:text-slate-600 dark:hover:text-slate-200">
            PokéAPI
          </a>
          . Built on Cloudflare Workers. Pokémon © Nintendo / Game Freak.
        </p>
      </footer>
    </div>
  )
}
