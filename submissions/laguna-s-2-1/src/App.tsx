import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Router } from 'preact-router';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { PokemonListPage } from './pages/PokemonListPage';
import { PokemonDetailPage } from './pages/PokemonDetailPage';
import { TypePage } from './pages/TypePage';
import { MoveListPage, MoveDetailPage } from './pages/MoveListPage';
import { ItemListPage, ItemDetailPage } from './pages/ItemListPage';
import { AbilityListPage, AbilityDetailPage } from './pages/AbilityListPage';
import { TypeMatchupPage } from './pages/TypeMatchupPage';
import { ComparePage } from './pages/ComparePage';
import { TeamBuilderPage } from './pages/TeamBuilderPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { LorePage } from './pages/LorePage';
import { LegendsPage } from './pages/LegendsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { initApp } from './lib/init';

export function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initApp().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-pokemon-light dark:bg-pokemon-dark">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div class="min-h-screen flex flex-col bg-pokemon-light dark:bg-pokemon-dark text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />
      <main class="flex-1 container mx-auto px-4 py-6">
        <Router>
          <HomePage path="/" />
          <PokemonListPage path="/pokemon/" />
          <PokemonListPage path="/pokemon/page/:page" />
          <PokemonDetailPage path="/pokemon/:id/" />
          <TypePage path="/types/:type" />
          <MoveListPage path="/moves/" />
          <MoveListPage path="/moves/page/:page" />
          <MoveDetailPage path="/moves/:id/" />
          <ItemListPage path="/items/" />
          <ItemListPage path="/items/page/:page" />
          <ItemDetailPage path="/items/:id/" />
          <AbilityListPage path="/abilities/" />
          <AbilityListPage path="/abilities/page/:page" />
          <AbilityDetailPage path="/abilities/:id/" />
          <TypeMatchupPage path="/tools/type-matchup" />
          <ComparePage path="/tools/compare" />
          <TeamBuilderPage path="/tools/team-builder" />
          <FavoritesPage path="/favorites" />
          <LorePage path="/lore" />
          <LorePage path="/lore/:id" />
          <LegendsPage path="/legends" />
          <NotFoundPage path="/:catchAll*" />
        </Router>
      </main>
      <Footer />
    </div>
  );
}
