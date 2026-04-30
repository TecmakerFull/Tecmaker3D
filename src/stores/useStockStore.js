import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ====================================================
// useStockStore — Control de Stock con Supabase
// Operaciones directas (sin RPC) para mayor compatibilidad
// ====================================================

const useStockStore = create((set, get) => ({
  stock:    {},
  precios:  {},
  catalogo: {},
  catalogoFilamentos:  [],
  catalogoAccesorios:  [],
  catalogoImpresiones: [],
  catalogoSTL:         [],
  cargandoCatalogo: false,
  movimientos: [],
  cargando: false,
  error:    null,

  // ── Cargar stock desde Supabase ─────────────────
  cargarStock: async () => {
    set({ cargando: true, error: null })
    const { data, error } = await supabase
      .from('productos')
      .select('id, stock, precio')

    if (error) {
      console.error('Error cargando stock:', error)
      set({ error: error.message, cargando: false })
      return
    }

    const stockMap  = {}
    const precioMap = {}
    data.forEach((p) => {
      stockMap[p.id]  = p.stock
      precioMap[p.id] = p.precio
    })
    set({ stock: stockMap, precios: precioMap, cargando: false })
  },

  // ── Única fuente de verdad: carga TODO desde Supabase ──
  // Sin fallback al .js. Si no hay datos, se muestra spinner.
  cargarPreciosPublicos: async () => {
    set({ cargandoCatalogo: true })
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, marca, tipo, material, color, precio, descripcion, imagen, peso, diametro, temp_impresion, temp_cama, especificaciones, link_compra, stock')
      .eq('activo', true)
      .order('id')

    if (error) {
      console.error('❌ Error Supabase:', error.message, '| Detalle:', error.details, '| Hint:', error.hint)
      set({ cargandoCatalogo: false })
      return
    }

    const stockMap   = {}
    const precioMap  = {}
    const catalogoMap = {}

    data.forEach((p) => {
      stockMap[p.id]  = p.stock
      precioMap[p.id] = p.precio
      // Normalizar nombres snake_case → camelCase y agregar alias útiles
      catalogoMap[p.id] = {
        ...p,
        tempImpresion: p.temp_impresion,
        tempCama:      p.temp_cama,
        // Para accesorios: categoria viene del campo 'marca' en Supabase
        categoria: p.tipo === 'accesorio' ? p.marca : undefined,
      }
    })

    const make = (tipo) => data.filter(p => p.tipo === tipo).map(p => ({ ...catalogoMap[p.id] }))

    set({
      stock:               stockMap,
      precios:             precioMap,
      catalogo:            catalogoMap,
      catalogoFilamentos:  make('filamento'),
      catalogoAccesorios:  make('accesorio'),
      catalogoImpresiones: make('impresion'),
      catalogoSTL:         make('stl'),
      cargandoCatalogo:    false,
    })
  },

  // ── Función interna: actualiza BD + UI ─────────
  _aplicarMovimiento: async (productoId, tipo, cantidad, stockNuevo, motivo) => {
    const stockActual = get().stock[productoId] || 0

    // 1. Actualizar stock en productos
    const { error: errorUpdate } = await supabase
      .from('productos')
      .update({ stock: stockNuevo })
      .eq('id', productoId)

    if (errorUpdate) {
      console.error('Error actualizando stock:', errorUpdate)
      return { error: errorUpdate }
    }

    // 2. Registrar movimiento en historial
    const { error: errorInsert } = await supabase
      .from('movimientos_stock')
      .insert({
        producto_id:    productoId,
        tipo,
        cantidad:       Math.abs(cantidad),
        stock_anterior: stockActual,
        stock_nuevo:    stockNuevo,
        motivo,
        usuario:        'admin',
      })

    if (errorInsert) {
      console.error('Error registrando movimiento:', errorInsert)
      // No bloquear la operación si falla solo el log
    }

    // 3. Actualizar UI local
    set((state) => ({
      stock: { ...state.stock, [productoId]: stockNuevo },
    }))

    return { error: null }
  },

  // ── Ingreso (+) ──────────────────────────────────
  ingresarStock: async (productoId, cantidad = 1, motivo = 'Ingreso manual') => {
    const stockActual = get().stock[productoId] || 0
    const stockNuevo = stockActual + Number(cantidad)
    return get()._aplicarMovimiento(productoId, 'ingreso', cantidad, stockNuevo, motivo)
  },

  // ── Egreso (−) ───────────────────────────────────
  egresarStock: async (productoId, cantidad = 1, motivo = 'Egreso manual') => {
    const stockActual = get().stock[productoId] || 0
    const stockNuevo = Math.max(0, stockActual - Number(cantidad))
    return get()._aplicarMovimiento(productoId, 'egreso', cantidad, stockNuevo, motivo)
  },

  // ── Ajuste directo ───────────────────────────────
  ajustarStock: async (productoId, stockNuevo, motivo = 'Ajuste de inventario') => {
    const stockActual = get().stock[productoId] || 0
    const diff = stockNuevo - stockActual
    const tipo = diff >= 0 ? 'ingreso' : 'egreso'
    return get()._aplicarMovimiento(productoId, tipo, Math.abs(diff), Number(stockNuevo), motivo)
  },

  // ── Actualizar precio ────────────────────────────
  actualizarPrecio: async (productoId, nuevoPrecio) => {
    const { error } = await supabase
      .from('productos')
      .update({ precio: Number(nuevoPrecio) })
      .eq('id', productoId)

    if (!error) {
      set((state) => ({
        precios: { ...state.precios, [productoId]: Number(nuevoPrecio) },
      }))
    }
    return { error }
  },

  // ── Getters ──────────────────────────────────────
  getStock:  (productoId) => get().stock[productoId] ?? 0,
  hasStock:  (productoId, cantidad = 1) => (get().stock[productoId] ?? 0) >= cantidad,

  // ── Aliases para compatibilidad con otros componentes ──
  increaseStock: (id, cantidad = 1) => get().ingresarStock(id, cantidad),
  decreaseStock: (id, cantidad = 1) => get().egresarStock(id, cantidad),
  setStock:      (id, cantidad)     => get().ajustarStock(id, cantidad),
}))

export default useStockStore
