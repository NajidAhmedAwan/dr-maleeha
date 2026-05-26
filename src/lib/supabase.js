import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error(
    '[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. ' +
    'Auth and database features will not work.'
  )
}

export const supabaseConfigured = !!(url && key)

export const supabase = (url && key)
  ? createClient(url, key)
  : {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOtp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: new Error('Supabase not configured') }),
        insert: () => ({ data: null, error: new Error('Supabase not configured') }),
        eq: function() { return this },
        order: function() { return this },
        limit: function() { return this },
      }),
    }
