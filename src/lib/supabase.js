import { createClient } from '@supabase/supabase-js'

// Strip any accidentally-appended /rest/v1 — the SDK adds this path itself
const rawUrl = import.meta.env.VITE_SUPABASE_URL
const url = rawUrl?.replace(/\/rest\/v1\/?$/, '')
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = !!(url && key)

export const supabase = supabaseConfigured
  ? createClient(url, key)
  : null
