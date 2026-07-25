import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { lazyWithRetry } from './lib/lazyWithRetry'
import { DexProvider } from './lib/dex'
import { AppShell } from './components/shell/AppShell'
import { BootScreen, RouteFallback } from './components/shell/Loading'

const Home = lazyWithRetry(() => import('./pages/Home'))
const Pokedex = lazyWithRetry(() => import('./pages/Pokedex'))
const PokemonDetail = lazyWithRetry(() => import('./pages/PokemonDetail'))
const Moves = lazyWithRetry(() => import('./pages/Moves'))
const MoveDetail = lazyWithRetry(() => import('./pages/MoveDetail'))
const Items = lazyWithRetry(() => import('./pages/Items'))
const ItemDetail = lazyWithRetry(() => import('./pages/ItemDetail'))
const Abilities = lazyWithRetry(() => import('./pages/Abilities'))
const AbilityDetail = lazyWithRetry(() => import('./pages/AbilityDetail'))
const Locations = lazyWithRetry(() => import('./pages/Locations'))
const LocationDetail = lazyWithRetry(() => import('./pages/LocationDetail'))
const Types = lazyWithRetry(() => import('./pages/Types'))
const TypeDetail = lazyWithRetry(() => import('./pages/TypeDetail'))
const Natures = lazyWithRetry(() => import('./pages/Natures'))
const Berries = lazyWithRetry(() => import('./pages/Berries'))
const Machines = lazyWithRetry(() => import('./pages/Machines'))
const Pokedexes = lazyWithRetry(() => import('./pages/Pokedexes'))
const PokedexDetail = lazyWithRetry(() => import('./pages/PokedexDetail'))
const TeamBuilder = lazyWithRetry(() => import('./pages/TeamBuilder'))
const Compare = lazyWithRetry(() => import('./pages/Compare'))
const DamageCalculator = lazyWithRetry(() => import('./pages/DamageCalculator'))
const CatchCalculator = lazyWithRetry(() => import('./pages/CatchCalculator'))
const Coverage = lazyWithRetry(() => import('./pages/Coverage'))
const Leaderboard = lazyWithRetry(() => import('./pages/Leaderboard'))
const WhosThat = lazyWithRetry(() => import('./pages/WhosThat'))
const Favorites = lazyWithRetry(() => import('./pages/Favorites'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))
const About = lazyWithRetry(() => import('./pages/About'))
const NotFound = lazyWithRetry(() => import('./pages/NotFound'))

export function App() {
  return (
    <DexProvider fallback={<BootScreen />}>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pokedex" element={<Pokedex />} />
            <Route path="/pokemon/:slug" element={<PokemonDetail />} />
            <Route path="/moves" element={<Moves />} />
            <Route path="/moves/:slug" element={<MoveDetail />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/:slug" element={<ItemDetail />} />
            <Route path="/abilities" element={<Abilities />} />
            <Route path="/abilities/:slug" element={<AbilityDetail />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:slug" element={<LocationDetail />} />
            <Route path="/types" element={<Types />} />
            <Route path="/types/:slug" element={<TypeDetail />} />
            <Route path="/natures" element={<Natures />} />
            <Route path="/berries" element={<Berries />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/pokedexes" element={<Pokedexes />} />
            <Route path="/pokedexes/:id" element={<PokedexDetail />} />
            <Route path="/team" element={<TeamBuilder />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/calc/damage" element={<DamageCalculator />} />
            <Route path="/calc/catch" element={<CatchCalculator />} />
            <Route path="/coverage" element={<Coverage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/play/whos-that" element={<WhosThat />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppShell>
    </DexProvider>
  )
}
