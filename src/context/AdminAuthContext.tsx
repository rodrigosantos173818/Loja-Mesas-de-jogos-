import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type ProfileRole = 'admin' | 'customer'
type AuthStatus = 'loading' | 'anonymous' | 'admin' | 'forbidden' | 'unavailable'

type AdminAuthContextValue = {
  user: User | null
  role: ProfileRole | null
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ confirmationRequired: boolean }>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

async function getRole(user: User): Promise<ProfileRole | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  return data?.role === 'admin' ? 'admin' : data?.role === 'customer' ? 'customer' : null
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<ProfileRole | null>(null)
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'unavailable')

  async function applyUser(nextUser: User | null) {
    if (!nextUser) {
      setUser(null)
      setRole(null)
      setStatus('anonymous')
      return
    }
    setUser(nextUser)
    try {
      const nextRole = await getRole(nextUser)
      setRole(nextRole)
      setStatus(nextRole === 'admin' ? 'admin' : 'forbidden')
    } catch {
      setRole(null)
      setStatus('forbidden')
    }
  }

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    void client.auth.getSession().then(({ data }) => {
      if (active) void applyUser(data.session?.user ?? null)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) void applyUser(session?.user ?? null)
      }, 0)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase não configurado.')
    setStatus('loading')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.user) {
      setStatus('anonymous')
      throw new Error('E-mail ou senha inválidos.')
    }
    const nextRole = await getRole(data.user)
    if (nextRole !== 'admin') {
      await supabase.auth.signOut()
      setUser(null)
      setRole(null)
      setStatus('anonymous')
      throw new Error('Esta conta não possui acesso administrativo.')
    }
    setUser(data.user)
    setRole('admin')
    setStatus('admin')
  }

  async function signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase não configurado.')
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.user) throw new Error(error?.message || 'Não foi possível criar a conta.')
    if (data.session) await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setStatus('anonymous')
    return { confirmationRequired: !data.session }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setStatus(supabase ? 'anonymous' : 'unavailable')
  }

  const value = useMemo(
    () => ({ user, role, status, signIn, signUp, signOut }),
    [user, role, status],
  )
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext)
  if (!value) throw new Error('AdminAuthProvider ausente')
  return value
}
