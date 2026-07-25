import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '90px 0' }}>
      <h1 style={{ fontSize: 64 }}>404</h1>
      <p className="muted">That page fled like a wild Abra.</p>
      <Link className="btn primary" to="/">Back to the Pokédex</Link>
    </div>
  )
}
