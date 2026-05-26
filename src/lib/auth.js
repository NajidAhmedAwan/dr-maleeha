import { supabase } from './supabase'

export async function sendMagicLink(email) {
  if (!supabase) return { error: new Error('Supabase not configured') }
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/dashboard' },
  })
}

export async function signOut() {
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}
