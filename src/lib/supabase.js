import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: true,   // captura código OAuth del URL al volver de Google
    persistSession: true,       // guarda sesión en localStorage
    autoRefreshToken: true,
  },
})
