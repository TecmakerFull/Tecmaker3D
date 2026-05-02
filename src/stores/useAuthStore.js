import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ====================================================
// useAuthStore — Autenticación con Supabase + Google OAuth
// ====================================================

const useAuthStore = create((set, get) => ({
  session:   null,
  perfil:    null,
  esAdmin:   false,
  cargando:  true,   // true hasta que Supabase confirme la sesión inicial

  // ── Inicializar (llamar 1 vez en App.jsx) ──────────
  inicializar: async () => {
    console.log('[Auth] inicializar() llamado')
    // PASO 1: getSession() detecta y canjea el código PKCE del URL (post-OAuth redirect)
    const { data: { session: sessionInicial }, error } = await supabase.auth.getSession()
    console.log('[Auth] getSession result:', sessionInicial?.user?.email ?? 'null', '| error:', error?.message ?? 'ninguno')

    set({ session: sessionInicial })
    if (sessionInicial?.user) {
      await get().cargarPerfil(sessionInicial.user.id)
    } else {
      set({ cargando: false })
    }

    // PASO 2: listener para cambios futuros (login/logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] event:', event, session?.user?.email ?? 'sin sesión')
        // Evitar procesar INITIAL_SESSION si ya lo hizo getSession()
        if (event === 'INITIAL_SESSION') return
        set({ session })
        if (session?.user) {
          await get().cargarPerfil(session.user.id)
        } else {
          set({ perfil: null, esAdmin: false, cargando: false })
        }
      }
    )
    return () => subscription.unsubscribe()
  },

  // ── Cargar perfil y rol desde tabla perfiles ───────
  cargarPerfil: async (userId) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()   // null si no existe, no lanza 406

    if (error) {
      console.error('Error cargando perfil:', error.message)
      set({ cargando: false })
      return
    }

    // Si el perfil no existe aún (trigger no corrió), lo creamos
    if (!data) {
      console.log('[Auth] Perfil no existe, creando...')
      const { data: { session } } = await supabase.auth.getSession()
      const meta = session?.user?.user_metadata || {}

      const { data: nuevo } = await supabase
        .from('perfiles')
        .insert({
          id:         userId,
          email:      session?.user?.email,
          nombre:     meta.full_name || '',
          avatar_url: meta.avatar_url || '',
        })
        .select()
        .maybeSingle()

      set({ perfil: nuevo, esAdmin: false, cargando: false })
      return
    }

    set({
      perfil:   data,
      esAdmin:  data?.es_admin === true,
      cargando: false,
    })
  },

  // ── Login con Google ───────────────────────────────
  loginConGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) console.error('Error login Google:', error)
  },

  // ── Logout ─────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, perfil: null, esAdmin: false })
  },

  // ── Actualizar perfil (nombre, teléfono, etc.) ─────
  actualizarPerfil: async (datos) => {
    const { session } = get()
    if (!session) return { error: 'Sin sesión' }

    const { data, error } = await supabase
      .from('perfiles')
      .update(datos)
      .eq('id', session.user.id)
      .select()
      .single()

    if (!error) set({ perfil: data })
    return { data, error }
  },
}))

export default useAuthStore
