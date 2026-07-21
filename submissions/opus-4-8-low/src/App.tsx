import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PokedexPage } from './pages/PokedexPage'
import { PokemonDetailPage } from './pages/PokemonDetailPage'
import { TypesPage } from './pages/TypesPage'
import { TypeDetailPage } from './pages/TypeDetailPage'
import { ResourceListPage } from './pages/ResourceListPage'
import { AbilityDetailPage } from './pages/AbilityDetailPage'
import { MoveDetailPage } from './pages/MoveDetailPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { ComparePage } from './pages/ComparePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PokedexPage />} />
        <Route path="pokemon/:id" element={<PokemonDetailPage />} />
        <Route path="types" element={<TypesPage />} />
        <Route path="types/:name" element={<TypeDetailPage />} />
        <Route
          path="abilities"
          element={
            <ResourceListPage
              resource="ability"
              title="Abilities"
              subtitle="Every ability in the games, with full effect descriptions and the Pokémon that have them."
              gradient="linear-gradient(135deg, #f59e0b, #f97316)"
              basePath="/abilities"
              icon="✨"
            />
          }
        />
        <Route path="abilities/:name" element={<AbilityDetailPage />} />
        <Route
          path="moves"
          element={
            <ResourceListPage
              resource="move"
              title="Moves"
              subtitle="All moves with type, power, accuracy, PP and effects — plus which Pokémon can learn them."
              gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
              basePath="/moves"
              icon="⚔️"
            />
          }
        />
        <Route path="moves/:name" element={<MoveDetailPage />} />
        <Route
          path="items"
          element={
            <ResourceListPage
              resource="item"
              title="Items"
              subtitle="Berries, held items, evolution stones, TMs and more — with sprites and effects."
              gradient="linear-gradient(135deg, #14b8a6, #10b981)"
              basePath="/items"
              icon="🎒"
            />
          }
        />
        <Route path="items/:name" element={<ItemDetailPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="*" element={<PokedexPage />} />
      </Route>
    </Routes>
  )
}
