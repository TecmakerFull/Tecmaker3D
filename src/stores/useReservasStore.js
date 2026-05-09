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
    // Obtener sesión para filtrar por usuario actual
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { set({ cargando: false }); return }

    const { data, error } = await supabase
      .from('reservas')
      .select('*, productos(nombre, imagen, marca)')
      .eq('usuario_id', session.user.id)   // ← solo las del usuario actual
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
  //    Agrupa por producto y suma cantidades
  cargarReservasGlobal: async () => {
    const { data, error } = await supabase
      .from('reservas')
      .select('producto_id, usuario_id, expires_at, cantidad')
      .eq('estado', 'activa')
      .gt('expires_at', new Date().toISOString())

    if (error) return
    // Suma las cantidades de todas las reservas activas por producto
    const mapa = {}
    data.forEach((r) => {
      if (mapa[r.producto_id]) {
        mapa[r.producto_id].cantidad += r.cantidad
      } else {
        mapa[r.producto_id] = { ...r }
      }
    })
    set({ reservasGlobal: mapa })
  },

  reservasGlobal: {}, // { productoId: { usuario_id, expires_at } }

  // ── Crear reserva ──────────────────────────────────
  // cantidad: número de unidades a reservar (default 1)
  crearReserva: async (productoId, cantidad = 1) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Sin sesión' }

    // Verificar que no haya reserva activa del mismo usuario para ese producto.
    // Si ya existe, la actualizamos con la nueva cantidad en vez de crear duplicados.
    const { data: existente } = await supabase
      .from('reservas')
      .select('id')
      .eq('producto_id', productoId)
      .eq('usuario_id', session.user.id)
      .eq('estado', 'activa')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existente) {
      // Actualizar cantidad y renovar el tiempo de expiración
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      const { data: updated, error: errUpd } = await supabase
        .from('reservas')
        .update({ cantidad, expires_at: expiresAt })
        .eq('id', existente.id)
        .select()
        .single()

      if (errUpd) return { error: errUpd }

      set((state) => ({
        reservas:        state.reservas.map((r) => r.id === updated.id ? updated : r),
        reservasActivas: { ...state.reservasActivas, [productoId]: updated },
        reservasGlobal:  {
          ...state.reservasGlobal,
          [productoId]: { ...state.reservasGlobal[productoId], cantidad: updated.cantidad },
        },
      }))

      return { data: updated, error: null }
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('reservas')
      .insert({
        usuario_id:  session.user.id,
        producto_id: productoId,
        cantidad,
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
      reservasGlobal:  {
        ...state.reservasGlobal,
        [productoId]: { ...data, cantidad },
      },
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
