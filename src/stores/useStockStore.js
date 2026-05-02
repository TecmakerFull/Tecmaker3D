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

  // ── Generar ID incremental por tipo ──────────────
  // Busca el último ID del tipo (ej: "fil-023") y devuelve el siguiente ("fil-024")
  _generarId: async (tipo) => {
    const prefijos = {
      filamento: 'fil',
      accesorio: 'acc',
      impresion: 'imp',
      stl:       'stl',
    }
    const prefijo = prefijos[tipo] || 'prod'

    // Buscar todos los IDs que empiecen con el prefijo
    const { data } = await supabase
      .from('productos')
      .select('id')
      .like('id', `${prefijo}-%`)

    let maxNum = 0
    if (data && data.length > 0) {
      data.forEach(({ id }) => {
        const partes = id.split('-')
        const num = parseInt(partes[partes.length - 1], 10)
        if (!isNaN(num) && num > maxNum) maxNum = num
      })
    }

    const siguiente = maxNum + 1
    // Formatea con ceros: fil-001, fil-024, fil-100, etc.
    const padded = siguiente < 10
      ? `00${siguiente}`
      : siguiente < 100
        ? `0${siguiente}`
        : `${siguiente}`

    return `${prefijo}-${padded}`
  },

  // ── Crear nuevo producto ─────────────────────────
  crearProducto: async (datos, imagenFile) => {
    let imagenUrl = datos.imagen || ''

    // 1. Generar ID incremental según el tipo
    const nuevoId = await get()._generarId(datos.tipo)

    // 2. Subir imagen al Storage si se proporcionó un archivo
    if (imagenFile) {
      const ext = imagenFile.name.split('.').pop()
      const path = `${datos.tipo}s/${nuevoId}_${datos.nombre.replace(/\s+/g, '_').toLowerCase()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('productos')
        .upload(path, imagenFile, { contentType: imagenFile.type, upsert: false })

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError)
        return { error: uploadError }
      }

      const { data: urlData } = supabase.storage
        .from('productos')
        .getPublicUrl(uploadData.path)

      imagenUrl = urlData.publicUrl
    }

    // 3. Insertar producto en la tabla con el ID generado
    const { data, error } = await supabase
      .from('productos')
      .insert({
        id:             nuevoId,
        nombre:         datos.nombre,
        marca:          datos.marca,
        tipo:           datos.tipo,
        material:       datos.material || null,
        color:          datos.color || null,
        precio:         Number(datos.precio) || 0,
        descripcion:    datos.descripcion || null,
        imagen:         imagenUrl,
        peso:           datos.peso || null,
        diametro:       datos.diametro || null,
        temp_impresion: datos.temp_impresion || null,
        temp_cama:      datos.temp_cama || null,
        especificaciones: datos.especificaciones || null,
        link_compra:    datos.link_compra || null,
        stock:          Number(datos.stock) || 0,
        activo:         true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando producto:', error)
      return { error }
    }

    // 3. Actualizar catálogo local sin recargar todo
    const nuevo = {
      ...data,
      tempImpresion: data.temp_impresion,
      tempCama:      data.temp_cama,
      categoria:     data.tipo === 'accesorio' ? data.marca : undefined,
    }

    set((state) => {
      const stockMap  = { ...state.stock,  [data.id]: data.stock }
      const precioMap = { ...state.precios, [data.id]: data.precio }
      const catalogoMap = { ...state.catalogo, [data.id]: nuevo }

      const actualizar = (lista, tipo) =>
        data.tipo === tipo ? [...lista, nuevo] : lista

      return {
        stock:               stockMap,
        precios:             precioMap,
        catalogo:            catalogoMap,
        catalogoFilamentos:  actualizar(state.catalogoFilamentos,  'filamento'),
        catalogoAccesorios:  actualizar(state.catalogoAccesorios,  'accesorio'),
        catalogoImpresiones: actualizar(state.catalogoImpresiones, 'impresion'),
        catalogoSTL:         actualizar(state.catalogoSTL,         'stl'),
      }
    })

    return { data: nuevo, error: null }
  },

  // ── Actualizar producto existente ────────────────
  actualizarProducto: async (productoId, datos, imagenFile) => {
    let imagenUrl = datos.imagen || ''

    // 1. Subir nueva imagen si se proporcionó archivo
    if (imagenFile) {
      const ext  = imagenFile.name.split('.').pop()
      const path = `${datos.tipo || 'productos'}s/${productoId}_edit_${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('productos')
        .upload(path, imagenFile, { contentType: imagenFile.type, upsert: true })

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError)
        return { error: uploadError }
      }

      const { data: urlData } = supabase.storage
        .from('productos')
        .getPublicUrl(uploadData.path)

      imagenUrl = urlData.publicUrl
    }

    // 2. UPDATE en Supabase
    const { data, error } = await supabase
      .from('productos')
      .update({
        nombre:           datos.nombre,
        marca:            datos.marca,
        material:         datos.material   || null,
        color:            datos.color      || null,
        precio:           Number(datos.precio) || 0,
        descripcion:      datos.descripcion || null,
        imagen:           imagenUrl,
        peso:             datos.peso       || null,
        diametro:         datos.diametro   || null,
        temp_impresion:   datos.temp_impresion || null,
        temp_cama:        datos.temp_cama  || null,
        especificaciones: datos.especificaciones || null,
        link_compra:      datos.link_compra || null,
      })
      .eq('id', productoId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando producto:', error)
      return { error }
    }

    // 3. Sincronizar estado local
    const actualizado = {
      ...data,
      tempImpresion: data.temp_impresion,
      tempCama:      data.temp_cama,
      categoria:     data.tipo === 'accesorio' ? data.marca : undefined,
    }

    set((state) => {
      const precioMap   = { ...state.precios,  [data.id]: data.precio }
      const catalogoMap = { ...state.catalogo, [data.id]: actualizado }

      const reemplazar = (lista) =>
        lista.map((p) => p.id === productoId ? actualizado : p)

      return {
        precios:             precioMap,
        catalogo:            catalogoMap,
        catalogoFilamentos:  reemplazar(state.catalogoFilamentos),
        catalogoAccesorios:  reemplazar(state.catalogoAccesorios),
        catalogoImpresiones: reemplazar(state.catalogoImpresiones),
        catalogoSTL:         reemplazar(state.catalogoSTL),
      }
    })

    return { data: actualizado, error: null }
  },

  // ── Eliminar producto ────────────────────────────
  eliminarProducto: async (productoId) => {
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', productoId)

    if (error) return { error }

    set((state) => {
      const filtrar = (lista) => lista.filter((p) => p.id !== productoId)
      const { [productoId]: _s, ...stockRest   } = state.stock
      const { [productoId]: _p, ...precioRest  } = state.precios
      const { [productoId]: _c, ...catalogoRest } = state.catalogo
      return {
        stock:               stockRest,
        precios:             precioRest,
        catalogo:            catalogoRest,
        catalogoFilamentos:  filtrar(state.catalogoFilamentos),
        catalogoAccesorios:  filtrar(state.catalogoAccesorios),
        catalogoImpresiones: filtrar(state.catalogoImpresiones),
        catalogoSTL:         filtrar(state.catalogoSTL),
      }
    })

    return { error: null }
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
