import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminAuth } from '@/context/AdminAuthContext'

export function AdminLoginPage() {
  const { status, signIn, signUp } = useAdminAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const from = (location.state as { from?: string } | null)?.from || '/admin'

  if (status === 'admin') return <Navigate to={from} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        const result = await signUp(email, password)
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setMessage(
          result.confirmationRequired
            ? 'Conta criada. Confirme seu e-mail. O acesso ao painel exige o perfil admin.'
            : 'Conta criada. O acesso ao painel exige o perfil admin.',
        )
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível continuar.')
    } finally {
      setSubmitting(false)
    }
  }

  const queryError = searchParams.get('error')
  const initialError =
    status === 'unavailable' || queryError === 'config'
      ? 'A conexão com o Supabase não está configurada neste ambiente.'
      : queryError === 'forbidden'
      ? 'Sua conta está autenticada, mas não possui o perfil admin.'
      : ''

  return (
    <main className="admin-auth-page">
      <div className="admin-login">
        <Link to="/" className="admin-auth-back">
          ← Voltar à loja
        </Link>
        <p className="eyebrow green">ACESSO RESTRITO</p>
        <h1>
          PAINEL ADMIN<em>.</em>
        </h1>
        <p>
          {mode === 'login'
            ? 'Entre com sua conta administrativa para gerenciar a ARENA 08.'
            : 'Crie uma conta com e-mail e senha. Novas contas não recebem acesso administrativo automaticamente.'}
        </p>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            E-mail
            <Input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Senha
            <Input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {mode === 'signup' && (
            <label>
              Confirmar senha
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
          )}
          {(error || initialError) && (
            <p className="field-error" role="alert">
              {error || initialError}
            </p>
          )}
          {message && (
            <p className="admin-auth-message" role="status">
              {message}
            </p>
          )}
          <Button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}{' '}
            <ArrowRight size={17} />
          </Button>
          <button
            className="admin-auth-mode"
            type="button"
            onClick={() => {
              setMode((current) => (current === 'login' ? 'signup' : 'login'))
              setError('')
              setMessage('')
            }}
          >
            {mode === 'login' ? 'Criar uma conta' : 'Já tenho uma conta'}
          </button>
        </form>
      </div>
    </main>
  )
}
