import { Link } from 'react-router-dom'
import { useDocTitle } from '../../lib/hooks'

export default function NotFoundPage() {
  useDocTitle('Not found')
  return (
    <div className="container page-pad" style={{ textAlign: 'center', paddingTop: 90 }}>
      <div className="mono" style={{ fontSize: '3.4rem', letterSpacing: '0.08em', opacity: 0.5, userSelect: 'none' }} aria-hidden="true">
        ▓▒░ 404 ░▒▓
      </div>
      <h1 style={{ marginTop: 12 }}>Wild MISSINGNO. appeared!</h1>
      <p className="dim" style={{ marginTop: 10 }}>
        This page doesn’t exist in any known region.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 22 }}>
        Back to the Dex
      </Link>
    </div>
  )
}
