import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ====================================================
// useReservasStore — Gestión de reservas de productos
// Cada reserva dura 30 minutos y bloquea el producto
// ====================================================

const useReservasStore = create((set, get) => ({
  reservas:       [],   // reservas activas del usuario actual
  reservasActivas: {}, // mapa { productoId: reserva } para consulta rápida
  cargando:       false,

  // ── Cargar reservas activas del usuario ────────────
  cargarReservas: async () => {
    set({ cargando: true })
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('estado', 'activa')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) { console.error('Error cargando reservas:', error); set({ cargando: false }); return }

    const mapa = {}
    data.forEach((r) => { mapa[r.producto_id] = r })
    set({ reservas: data, reservasActivas: mapa, cargando: false })
  },

  // ── Cargar TODAS las reservas activas (para mostrar
  //    qué productos están reservados por cualquier usuario)
  cargarReservasGlobal: async () => {
    const { data, error } = await supabase
      .from('reservas')
      .select('producto_id, usuario_id, expires_at')
      .eq('estado', 'activa')
      .gt('expires_at', new Date().toISOString())

    if (error) return
    const mapa = {}
    data.forEach((r) => { mapa[r.producto_id] = r })
    set({ reservasGlobal: mapa })
  },

  reservasGlobal: {}, // { productoId: { usuario_id, expires_at } }

  // ── Crear reserva ──────────────────────────────────
  crearReserva: async (productoId) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Sin sesión' }

    // Verificar que no haya reserva activa para ese producto
    const { data: existente } = await supabase
      .from('reservas')
      .select('id')
      .eq('producto_id', productoId)
      .eq('estado', 'activa')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existente) return { error: 'El producto ya está reservado' }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('reservas')
      .insert({
        usuario_id:  session.user.id,
        producto_id: productoId,
        cantidad:    1,
        expires_at:  expiresAt,
        estado:      'activa',
      })
      .select()
      .single()

    if (error) return { error }

    // Actualizar estado local
    set((state) => ({
      reservas: [data, ...state.reservas],
      reservasActivas: { ...state.reservasActivas, [productoId]: data },
      reservasGlobal:  { ...state.reservasGlobal,  [productoId]: data },
    }))

    return { data, error: null }
  },

  // ── Cancelar reserva ───────────────────────────────
  cancelarReserva: async (productoId) => {
    const mapa     = get().reservasActivas
    const reserva  = mapa[productoId]
    if (!reserva) return

    await supabase
      .from('reservas')
      .update({ estado: 'expirada' })
      .eq('id', reserva.id)

    set((state) => {
      const { [productoId]: _, ...resto }  = state.reservasActivas
      const { [productoId]: __, ...restoG } = state.reservasGlobal
      return {
        reservas:        state.reservas.filter((r) => r.producto_id !== productoId),
        reservasActivas: resto,
        reservasGlobal:  restoG,
      }
    })
  },

  // ── Limpiar expiradas del estado local ─────────────
  limpiarExpiradas: () => {
    const ahora = new Date()
    set((state) => {
      const activas = state.reservas.filter(
        (r) => new Date(r.expires_at) > ahora
      )
      const mapa = {}
      activas.forEach((r) => { mapa[r.producto_id] = r })
      return { reservas: activas, reservasActivas: mapa }
    })
  },

  // ── ¿El usuario actual tiene este producto reservado?
  tieneReserva: (productoId) => !!get().reservasActivas[productoId],

  // ── ¿Algún usuario tiene este producto reservado?
  estaReservado: (productoId) => !!get().reservasGlobal[productoId],

  // ── Segundos restantes para una reserva ───────────
  segundosRestantes: (productoId) => {
    const r = get().reservasActivas[productoId]
    if (!r) return 0
    return Math.max(0, Math.floor((new Date(r.expires_at) - new Date()) / 1000))
  },
}))

export default useReservasStore
