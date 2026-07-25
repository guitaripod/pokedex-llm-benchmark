import { Suspense, lazy, useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Palette from './components/Palette'
import { Loading } from './components/ui'
import { useStore } from './store'

const Home = lazy(() => import('./pages/Home'))
const Dex = lazy(() => import('./pages/Dex'))
const PokemonDetail = lazy(() => import('./pages/PokemonDetail'))
const Moves = lazy(() => import('./pages/Moves'))
const MoveDetail = lazy(() => import('./pages/MoveDetail'))
const Abilities = lazy(() => import('./pages/Abilities'))
const AbilityDetail = lazy(() => import('./pages/AbilityDetail'))
const Items = lazy(() => import('./pages/Items'))
const ItemDetail = lazy(() => import('./pages/ItemDetail'))
const TypesPage = lazy(() => import('./pages/Types'))
const TypeDetail = lazy(() => import('./pages/TypeDetail'))
const Compare = lazy(() => import('./pages/Compare'))
const Team = lazy(() => import('./pages/Team'))
const Natures = lazy(() => import('./pages/Natures'))
const Berries = lazy(() => import('./pages/Berries'))
const Dexes = lazy(() => import('./pages/Dexes'))
const Guess = lazy(() => import('./pages/Guess'))
const Tools = lazy(() => import('./pages/Tools'))
const RandomPage = lazy(() => import('./pages/Random'))
const Favorites = lazy(() => import('./pages/Favorites'))
const NotFound = lazy(() => import('./pages/NotFound'))

const LINKS = [
  ['/pokedex', 'Pokédex'],
  ['/moves', 'Moves'],
  ['/abilities', 'Abilities'],
  ['/items', 'Items'],
  ['/types', 'Types'],
  ['/dexes', 'Regions'],
  ['/team', 'Team'],
  ['/compare', 'Compare'],
  ['/tools', 'Tools'],
  ['/guess', 'Play'],
]

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}

export default function App() {
  const { theme, setTheme } = useStore()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? ''
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea/i.test(tag))) {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <ScrollTop />
      <header className="nav">
        <div className="container nav-inner">
          <NavLink to="/" className="brand">
            <span className="brand-dot" />
            <span>POKÉDEX</span>
          </NavLink>
          <nav className="nav-links">
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-right">
            <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
              <span>Search…</span>
              <span className="spacer" />
              <span className="kbd">⌘K</span>
            </button>
            <NavLink to="/favorites" className="icon-btn" title="Favorites">★</NavLink>
            <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☾' : '☀'}
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pokedex" element={<Dex />} />
            <Route path="/pokemon/:id" element={<PokemonDetail />} />
            <Route path="/moves" element={<Moves />} />
            <Route path="/moves/:id" element={<MoveDetail />} />
            <Route path="/abilities" element={<Abilities />} />
            <Route path="/abilities/:id" element={<AbilityDetail />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/types" element={<TypesPage />} />
            <Route path="/types/:id" element={<TypeDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/team" element={<Team />} />
            <Route path="/natures" element={<Natures />} />
            <Route path="/berries" element={<Berries />} />
            <Route path="/dexes" element={<Dexes />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/guess" element={<Guess />} />
            <Route path="/random" element={<RandomPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="footer">
        <div className="container row">
          <span>Data from <a href="https://pokeapi.co" style={{ color: 'var(--text-dim)' }}>PokéAPI</a> · sprites © Nintendo / Game Freak</span>
          <span className="spacer" />
          <span>Press <span className="kbd">⌘K</span> to search anything</span>
        </div>
      </footer>

      <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
