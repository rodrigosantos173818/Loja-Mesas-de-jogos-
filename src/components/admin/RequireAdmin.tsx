import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/context/AdminAuthContext'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="admin-auth-page">
        <div className="admin-login">Verificando acesso...</div>
      </main>
    )
  }
  if (status !== 'admin') {
    const reason = status === 'forbidden' ? 'forbidden' : status === 'unavailable' ? 'config' : ''
    return (
      <Navigate
        to={`/admin/login${reason ? `?error=${reason}` : ''}`}
        replace
        state={{ from: location.pathname }}
      />
    )
  }
  return children
}
