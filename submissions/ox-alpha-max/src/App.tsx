import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout, ScrollToTop } from "./components/Layout";
import { DexPage } from "./pages/DexPage";
import { NotFound } from "./pages/NotFound";

const PokemonDetail = lazy(() => import("./pages/PokemonDetail").then((m) => ({ default: m.PokemonDetail })));
const MovesPage = lazy(() => import("./pages/MovesPage").then((m) => ({ default: m.MovesPage })));
const AbilitiesPage = lazy(() => import("./pages/AbilitiesPage").then((m) => ({ default: m.AbilitiesPage })));
const TypesPage = lazy(() => import("./pages/TypesPage").then((m) => ({ default: m.TypesPage })));
const ItemsPage = lazy(() => import("./pages/ItemsPage").then((m) => ({ default: m.ItemsPage })));
const BerriesPage = lazy(() => import("./pages/BerriesPage").then((m) => ({ default: m.BerriesPage })));
const TeamPage = lazy(() => import("./pages/TeamPage").then((m) => ({ default: m.TeamPage })));
const ComparePage = lazy(() => import("./pages/ComparePage").then((m) => ({ default: m.ComparePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DexPage />} />
            <Route path="/pokemon/:idOrName" element={<Suspense fallback={<DetailFallback />}><PokemonDetail /></Suspense>} />
            <Route path="/moves" element={<Suspense fallback={<DetailFallback />}><MovesPage /></Suspense>} />
            <Route path="/abilities" element={<Suspense fallback={<DetailFallback />}><AbilitiesPage /></Suspense>} />
            <Route path="/types" element={<Suspense fallback={<DetailFallback />}><TypesPage /></Suspense>} />
            <Route path="/items" element={<Suspense fallback={<DetailFallback />}><ItemsPage /></Suspense>} />
            <Route path="/berries" element={<Suspense fallback={<DetailFallback />}><BerriesPage /></Suspense>} />
            <Route path="/team" element={<Suspense fallback={<DetailFallback />}><TeamPage /></Suspense>} />
            <Route path="/compare" element={<Suspense fallback={<DetailFallback />}><ComparePage /></Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function DetailFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-72 rounded-3xl" />
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
