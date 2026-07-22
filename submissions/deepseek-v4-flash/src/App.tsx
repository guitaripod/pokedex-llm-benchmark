import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { PokedexPage } from './pages/PokedexPage';
import { PokemonDetailPage } from './pages/PokemonDetailPage';
import { ComparePage } from './pages/ComparePage';
import { TypeCalculatorPage } from './pages/TypeCalculatorPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pokedex" element={<PokedexPage />} />
            <Route path="/pokemon/:id" element={<PokemonDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/type-calc" element={<TypeCalculatorPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
