import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import Loader from './components/Loader'

const HomePage = lazy(() => import('./pages/home/HomePage'))
const DetailPage = lazy(() => import('./pages/detail/DetailPage'))
const ComparePage = lazy(() => import('./pages/compare/ComparePage'))
const TeamPage = lazy(() => import('./pages/team/TeamPage'))
const TypeChartPage = lazy(() => import('./pages/typechart/TypeChartPage'))
const MovesPage = lazy(() => import('./pages/moves/MovesPage'))
const MoveDetailPage = lazy(() => import('./pages/moves/MoveDetailPage'))
const AbilitiesPage = lazy(() => import('./pages/abilities/AbilitiesPage'))
const AbilityDetailPage = lazy(() => import('./pages/abilities/AbilityDetailPage'))
const ItemsPage = lazy(() => import('./pages/items/ItemsPage'))
const QuizPage = lazy(() => import('./pages/quiz/QuizPage'))
const FavoritesPage = lazy(() => import('./pages/favorites/FavoritesPage'))
const AboutPage = lazy(() => import('./pages/about/AboutPage'))
const NotFoundPage = lazy(() => import('./pages/notfound/NotFoundPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()
  useEffect(() => {
    if (navType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navType])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      <Nav />
      <CommandPalette />
      <main id="main" tabIndex={-1}>
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pokemon/:key" element={<DetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/types" element={<TypeChartPage />} />
              <Route path="/moves" element={<MovesPage />} />
              <Route path="/moves/:id" element={<MoveDetailPage />} />
              <Route path="/abilities" element={<AbilitiesPage />} />
              <Route path="/abilities/:id" element={<AbilityDetailPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  )
}
