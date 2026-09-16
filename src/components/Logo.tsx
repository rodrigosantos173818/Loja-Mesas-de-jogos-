import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand-logo" aria-label="ARENA 08 — início">
      <span className="brand-mark">
        <span>A</span>
      </span>
      <span className="brand-word">
        ARENA<span>08</span>
        {!compact && <small>PLAY BIG. LIVE MORE.</small>}
      </span>
    </Link>
  )
}
