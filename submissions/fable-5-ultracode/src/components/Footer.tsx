import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container f-inner">
        <div>
          Data from{' '}
          <a href="https://pokeapi.co" target="_blank" rel="noreferrer">
            PokéAPI
          </a>
          . Pokémon and character names are trademarks of Nintendo, Creatures Inc. and Game Freak.
          This is a fan-made reference, not affiliated with or endorsed by them.
        </div>
        <div className="mono" style={{ display: 'flex', gap: 18 }}>
          <Link to="/favorites">Favorites</Link>
          <Link to="/about">About</Link>
        </div>
      </div>
    </footer>
  )
}
