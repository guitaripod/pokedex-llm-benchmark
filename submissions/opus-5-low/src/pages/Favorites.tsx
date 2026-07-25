import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Empty, Loading, PokemonCard } from '../components/ui'
import { getIndex } from '../lib/data'
import { useAsync } from '../lib/hooks'
import { useStore } from '../store'

export default function Favorites() {
  const { data: index } = useAsync(getIndex, [])
  const { favorites } = useStore()
  const rows = useMemo(
    () => favorites.map((id) => index?.find((e) => e.id === id)).filter(Boolean),
    [favorites, index],
  )
  if (!index) return <Loading />
  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 30 }}>Favorites</h1>
        <div className="faint small">{rows.length} saved · stored in this browser</div>
      </div>
      {rows.length === 0
        ? <Empty>No favorites yet — hit ☆ on any Pokémon page. <Link to="/pokedex" style={{ color: 'var(--accent)' }}>Browse the Pokédex →</Link></Empty>
        : <div className="grid">{rows.map((p) => p && <PokemonCard key={p.id} p={p} fav />)}</div>}
    </div>
  )
}
