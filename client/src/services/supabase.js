import { createClient } from '@supabase/supabase-js'

// Single Supabase client used for Auth, Realtime subscriptions, and Storage.
// Free tier, no billing account required for any of this.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMH0.dummy'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Register a new account. The backend also creates a matching row in
 * public.users (see POST /api/auth/register) so username-based login
 * and profile lookups work.
 */
export async function registerWithEmail({ email, password }) {
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })
  if (error) throw error
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('This email address is already registered. Please click Log In to sign in.')
  }
  return data
}

/**
 * Log in with an email OR a username. If `identifier` has no "@", the
 * backend resolves it to an email first (see POST /api/auth/login),
 * then we sign in directly against Supabase Auth with that email.
 */
export async function loginWithIdentifier({ identifier, password, resolveUsername }) {
  const email = identifier.includes('@') ? identifier : await resolveUsername(identifier)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}
