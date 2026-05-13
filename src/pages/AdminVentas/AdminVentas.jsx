import { useEffect, useState, useMemo } from 'react'
import { CircularProgress } from '@mui/material'
import useAuthStore    from '../../stores/useAuthStore'
import useStockStore   from '../../stores/useStockStore'
import { supabase }   from '../../lib/supabase'
import PointOfSaleOutlinedIcon  from '@mui/icons-material/PointOfSaleOutlined'
import AddCircleOutlineIcon     from '@mui/icons-material/AddCircleOutline'
import CloseOutlinedIcon        from '@mui/icons-material/CloseOutlined'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import StorefrontOutlinedIcon   from '@mui/icons-material/StorefrontOutlined'
import PersonOutlinedIcon       from '@mui/icons-material/PersonOutlined'
import DeleteOutlineIcon        from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import styles from './AdminVentas.module.css'

const fmt = (n) =>
  n == null ? '—'
  : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) : '—'

// Fecha local en formato datetime-local (para el input)
const fechaLocalDefault = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const TIPOS = [
  { value: 'filamento', label: 'Filamento'    },
  { value: 'accesorio', label: 'Accesorio'    },
  { value: 'impresion', label: 'Impresión 3D' },
  { value: 'stl',       label: 'Modelo STL'   },
]

const FORM_VACIO = {
  tipo_producto: 'filamento',
  producto_id:   '',
  producto:      '',
  marca:         '',
  precio:        '',
  cantidad:      1,
  tipo_comprador:'libre',   // 'registrado' | 'libre'
  usuario_id:    '',
  comprador:     '',
  nota:          '',
  fecha:         fechaLocalDefault(),
}

const AdminVentas = () => {
  const { session, esAdmin } = useAuthStore()

  // Catálogos
  const catalogoFilamentos  = useStockStore(s => s.catalogoFilamentos)
  const catalogoAccesorios  = useStockStore(s => s.catalogoAccesorios)
  const catalogoImpresiones = useStockStore(s => s.catalogoImpresiones)
  const catalogoSTL         = useStockStore(s => s.catalogoSTL)

  const [ventas,    setVentas]    = useState([])
  const [usuarios,  setUsuarios]  = useState([])   // perfiles registrados
  const [cargando,  setCargando]  = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [okMsg,     setOkMsg]     = useState(false)
  const [editando,  setEditando]  = useState(null)   // venta manual siendo editada
  const [editForm,  setEditForm]  = useState({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  useEffect(() => {
    if (!session || !esAdmin) {
      setCargando(false)
      return
    }
    cargar()
    cargarUsuarios()
  }, [session, esAdmin])

  // ── Usuarios registrados ────────────────────────────────────
  const cargarUsuarios = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre, email')
      .order('nombre')
    setUsuarios(data || [])
  }

  // ── Catálogo activo según tipo ──────────────────────────────
  const catalogoActivo = useMemo(() => {
    switch (form.tipo_producto) {
      case 'filamento': return catalogoFilamentos
      case 'accesorio': return catalogoAccesorios
      case 'impresion': return catalogoImpresiones
      case 'stl':       return catalogoSTL
      default:          return []
    }
  }, [form.tipo_producto, catalogoFilamentos, catalogoAccesorios, catalogoImpresiones, catalogoSTL])

  // Al seleccionar un producto del catálogo → pre-carga campos
  const handleSelectProducto = (id) => {
    if (!id) { setF('producto_id', ''); setF('producto', ''); setF('marca', ''); setF('precio', ''); return }
    const prod = catalogoActivo.find(p => p.id === id)
    if (!prod) return
    setForm(f => ({
      ...f,
      producto_id: id,
      producto:    prod.nombre,
      marca:       prod.marca || prod.categoria || '',
      precio:      String(prod.precio || ''),
    }))
  }

  // Al cambiar tipo → resetear producto seleccionado
  const handleTipo = (tipo) => {
    setForm(f => ({ ...f, tipo_producto: tipo, producto_id: '', producto: '', marca: '', precio: '' }))
  }

  // Al seleccionar usuario registrado
  const handleSelectUsuario = (uid) => {
    if (!uid) { setF('usuario_id', ''); setF('comprador', ''); return }
    const u = usuarios.find(u => u.id === uid)
    setForm(f => ({ ...f, usuario_id: uid, comprador: u ? (u.nombre || u.email) : '' }))
  }

  // ── Cargar ventas ───────────────────────────────────────────
  const cargar = async () => {
    setCargando(true)
    try {
      // Compras online — solo activas
      const { data: comprasData } = await supabase
        .from('compras')
        .select('id, created_at, cantidad, total, usuario_id, producto_id, is_activo, productos(nombre, marca, imagen)')
        .order('created_at', { ascending: false })

      // Ventas manuales — solo activas
      let manualesData = []
      try {
        const { data } = await supabase
          .from('ventas_manuales')
          .select('*')
          .order('fecha', { ascending: false })
        manualesData = data || []
      } catch (_) {}

      // Perfiles de compradores online
      const uids = [...new Set((comprasData || []).map(c => c.usuario_id).filter(Boolean))]
      let perfsMap = {}
      if (uids.length) {
        const { data: perfsData } = await supabase
          .from('perfiles')
          .select('id, nombre, email')
          .in('id', uids)
        perfsData?.forEach(p => { perfsMap[p.id] = p })
      }

      const online = (comprasData || []).map(c => ({
        id:        c.id,
        fecha:     c.created_at,
        producto:  c.productos?.nombre || '—',
        marca:     c.productos?.marca  || '—',
        imagen:    c.productos?.imagen || null,
        comprador: perfsMap[c.usuario_id]?.nombre || '—',
        email:     perfsMap[c.usuario_id]?.email  || '—',
        cantidad:  c.cantidad,
        total:     c.total,
        nota:      null,
        tipo:      'online',
        is_activo: c.is_activo !== false,   // null / true → activo
      }))

      const manuales = manualesData.map(m => ({
        id:        m.id,
        fecha:     m.fecha || m.created_at,
        producto:  m.producto,
        marca:     m.marca || '—',
        imagen:    null,
        comprador: m.comprador || '—',
        email:     '—',
        cantidad:  m.cantidad,
        total:     Number(m.precio) * Number(m.cantidad),
        nota:      m.nota || null,
        tipo:      'manual',
        is_activo: m.is_activo !== false,
      }))

      const todas = [...online, ...manuales].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      )
      setVentas(todas)
    } catch (err) {
      console.error('Error cargando ventas:', err.message)
    } finally {
      setCargando(false)
    }
  }

  // ── Soft-delete ─────────────────────────────────────────────
  // ── Abrir modal de edición ───────────────────────
  const handleAbrirEditar = (venta) => {
    // Convertir fecha ISO a formato datetime-local
    const fechaLocal = venta.fecha
      ? (() => { const d = new Date(venta.fecha); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) })()
      : fechaLocalDefault()
    setEditForm({
      producto:  venta.producto,
      marca:     venta.marca === '—' ? '' : venta.marca,
      precio:    String(venta.total / (venta.cantidad || 1)),
      cantidad:  String(venta.cantidad),
      comprador: venta.comprador === '—' ? '' : venta.comprador,
      nota:      venta.nota || '',
      fecha:     fechaLocal,
    })
    setEditando(venta)
  }

  // ── Guardar edición ───────────────────────────
  const handleActualizar = async () => {
    if (!editForm.producto?.trim() || !editForm.precio) return
    setGuardandoEdit(true)
    try {
      const { error } = await supabase.from('ventas_manuales').update({
        producto:  editForm.producto.trim(),
        marca:     editForm.marca.trim()    || null,
        precio:    Number(editForm.precio),
        cantidad:  Number(editForm.cantidad) || 1,
        comprador: editForm.comprador.trim() || null,
        nota:      editForm.nota.trim()     || null,
        fecha:     editForm.fecha ? new Date(editForm.fecha).toISOString() : new Date().toISOString(),
      }).eq('id', editando.id)

      if (!error) {
        setEditando(null)
        setOkMsg(true)
        setTimeout(() => setOkMsg(false), 3000)
        cargar()
      } else {
        alert('Error al actualizar: ' + error.message)
      }
    } catch (e) {
      alert('Error inesperado: ' + e.message)
    } finally {
      setGuardandoEdit(false)
    }
  }

  const setEF = (k, v) => setEditForm(p => ({ ...p, [k]: v }))

  const handleEliminar = async (venta) => {
    if (!window.confirm(`¿Desactivar la venta de "${venta.producto}"? Quedará en la base de datos pero no contará en los totales.`)) return
    if (venta.tipo === 'online') {
      await supabase.from('compras').update({ is_activo: false }).eq('id', venta.id)
    } else {
      await supabase.from('ventas_manuales').update({ is_activo: false }).eq('id', venta.id)
    }
    setVentas(prev => prev.map(v =>
      v.id === venta.id && v.tipo === venta.tipo ? { ...v, is_activo: false } : v
    ))
  }

  // ── Guardar venta manual ────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.producto.trim() || !form.precio || !form.cantidad) return
    setGuardando(true)
    try {
      const { error } = await supabase.from('ventas_manuales').insert({
        tipo_producto: form.tipo_producto,
        producto_id:   form.producto_id   || null,
        producto:      form.producto.trim(),
        marca:         form.marca.trim()  || null,
        precio:        Number(form.precio),
        cantidad:      Number(form.cantidad) || 1,
        usuario_id:    form.usuario_id    || null,
        comprador:     form.comprador.trim() || null,
        nota:          form.nota.trim()   || null,
        fecha:         form.fecha ? new Date(form.fecha).toISOString() : new Date().toISOString(),
        admin_id:      session.user.id,
        is_activo:     true,
      })
      if (!error) {
        setForm({ ...FORM_VACIO, fecha: fechaLocalDefault() })
        setShowForm(false)
        setOkMsg(true)
        setTimeout(() => setOkMsg(false), 3000)
        cargar()
      } else {
        alert('Error al guardar: ' + error.message)
      }
    } catch (e) {
      alert('Error inesperado: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const totalFila = Number(form.precio || 0) * Number(form.cantidad || 1)

  if (!session || !esAdmin) return null

  // Solo mostrar activas por defecto
  const activas    = ventas.filter(v => v.is_activo)
  const inactivas  = ventas.filter(v => !v.is_activo)
  const filtradas  = activas.filter(v => {
    const q = busqueda.toLowerCase()
    return (
      v.producto.toLowerCase().includes(q)  ||
      v.comprador.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    )
  })
  const totalFiltrado = filtradas.reduce((acc, v) => acc + (v.total || 0), 0)
  const totalGeneral  = activas.reduce((acc, v) => acc + (v.total || 0), 0)

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={styles.titulo}>
          <PointOfSaleOutlinedIcon sx={{ fontSize: '1.4rem', verticalAlign: 'middle', mr: 0.5 }} />
          Ventas concretadas
        </h1>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total ventas</span>
            <span className={styles.statVal}>{activas.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Facturado</span>
            <span className={styles.statValBig}>{fmt(totalGeneral)}</span>
          </div>
          {inactivas.length > 0 && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Desactivadas</span>
              <span className={styles.statVal} style={{ color: '#64748b' }}>{inactivas.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          placeholder="Buscar por producto, cliente o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <span className={styles.filteredTotal}>
            {filtradas.length} resultados · {fmt(totalFiltrado)}
          </span>
        )}
        {okMsg && (
          <span className={styles.okMsg}>
            <CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} />
            Venta registrada
          </span>
        )}
        <button className={styles.btnNueva} onClick={() => setShowForm(s => !s)}>
          <AddCircleOutlineIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} />
          Nueva venta manual
        </button>
        <button className={styles.refreshBtn} onClick={cargar}>↺ Actualizar</button>
      </div>

      {/* ── Formulario venta manual ── */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <span className={styles.formTitle}>
              <StorefrontOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} />
              Registrar venta manual
            </span>
            <button className={styles.formClose} onClick={() => setShowForm(false)}>
              <CloseOutlinedIcon sx={{ fontSize: '1rem' }} />
            </button>
          </div>

          {/* ── Sección 1: Producto ── */}
          <div className={styles.formSection}>
            <div className={styles.formSectionLabel}>📦 Producto</div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Tipo</label>
              <div className={styles.tipoRow}>
                {TIPOS.map(t => (
                  <button key={t.value} type="button"
                    className={`${styles.tipoBtn} ${form.tipo_producto === t.value ? styles.tipoBtnActive : ''}`}
                    onClick={() => handleTipo(t.value)}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>
                Del catálogo <span className={styles.labelHint}>(opcional — pre-carga datos)</span>
              </label>
              <select className={styles.darkSelect} value={form.producto_id}
                onChange={e => handleSelectProducto(e.target.value)}>
                <option value="">— Elegir del catálogo —</option>
                {catalogoActivo.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}{p.marca ? ` — ${p.marca}` : ''}{p.color ? ` (${p.color})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow2col}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del producto *</label>
                <input className={styles.input} placeholder="Nombre del producto"
                  value={form.producto} onChange={e => setF('producto', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Marca / Categoría</label>
                <input className={styles.input} placeholder="Marca o tipo"
                  value={form.marca} onChange={e => setF('marca', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Sección 2: Precio y fecha ── */}
          <div className={styles.formSection}>
            <div className={styles.formSectionLabel}>💰 Precio y fecha</div>
            <div className={styles.formRow3col}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Precio unitario (ARS) *</label>
                <input className={styles.input} type="number" min="0" placeholder="0"
                  value={form.precio} onChange={e => setF('precio', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cantidad *</label>
                <input className={styles.input} type="number" min="1" placeholder="1"
                  value={form.cantidad} onChange={e => setF('cantidad', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Fecha y hora</label>
                <input className={styles.input} type="datetime-local"
                  value={form.fecha} onChange={e => setF('fecha', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Sección 3: Comprador ── */}
          <div className={styles.formSection}>
            <div className={styles.formSectionLabel}>
              <PersonOutlinedIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle', mr: 0.3 }} />
              Comprador
            </div>
            <div className={styles.tipoRow} style={{ marginBottom: '0.75rem' }}>
              <button type="button"
                className={`${styles.tipoBtn} ${form.tipo_comprador === 'registrado' ? styles.tipoBtnActive : ''}`}
                onClick={() => { setF('tipo_comprador', 'registrado'); setF('comprador', ''); setF('usuario_id', '') }}
              >Usuario registrado</button>
              <button type="button"
                className={`${styles.tipoBtn} ${form.tipo_comprador === 'libre' ? styles.tipoBtnActive : ''}`}
                onClick={() => { setF('tipo_comprador', 'libre'); setF('usuario_id', '') }}
              >Sin cuenta</button>
            </div>

            <div className={styles.formRow2col}>
              <div className={styles.formGroup}>
                {form.tipo_comprador === 'registrado' ? (
                  <select className={styles.darkSelect} value={form.usuario_id}
                    onChange={e => handleSelectUsuario(e.target.value)}>
                    <option value="">— Seleccionar usuario registrado —</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre || '(sin nombre)'} — {u.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className={styles.input} placeholder="Nombre del cliente (sin cuenta)"
                    value={form.comprador} onChange={e => setF('comprador', e.target.value)} />
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nota adicional</label>
                <input className={styles.input} placeholder="Canal de venta, observaciones..."
                  value={form.nota} onChange={e => setF('nota', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.formFooter}>
            <span className={styles.formTotal}>
              Total: <strong>{fmt(totalFila)}</strong>
            </span>
            <button className={styles.btnGuardar} onClick={handleGuardar}
              disabled={guardando || !form.producto.trim() || !form.precio}>
              {guardando
                ? <CircularProgress size={14} sx={{ color: '#000' }} />
                : <><CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Registrar venta</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      {cargando ? (
        <div className={styles.loading}><CircularProgress size={28} sx={{ color: '#f59e0b' }} /></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Comprador</th>
                <th>Email / Nota</th>
                <th className={styles.right}>Cant.</th>
                <th className={styles.right}>Total</th>
                <th>Canal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(v => (
                <tr key={`${v.tipo}-${v.id}`} className={!v.is_activo ? styles.rowInactiva : ''}>
                  <td className={styles.fecha}>{fmtFecha(v.fecha)}</td>
                  <td>
                    <div className={styles.prodCell}>
                      {v.imagen && (
                        <img src={v.imagen} alt="" className={styles.prodImg}
                          onError={e => { e.target.style.display='none' }} />
                      )}
                      <span className={styles.prodNombre}>{v.producto}</span>
                    </div>
                  </td>
                  <td className={styles.muted}>{v.marca}</td>
                  <td>{v.comprador}</td>
                  <td className={styles.muted}>{v.nota || v.email}</td>
                  <td className={styles.right}>{v.cantidad}</td>
                  <td className={`${styles.right} ${styles.totalCell}`}>{fmt(v.total)}</td>
                  <td>
                    <span className={v.tipo === 'online' ? styles.badgeOnline : styles.badgeManual}>
                      {v.tipo === 'online' ? 'Online' : 'Manual'}
                    </span>
                  </td>
                  <td>
                    {v.is_activo && (
                      <div className={styles.acciones}>
                        {v.tipo === 'manual' && (
                          <button
                            className={styles.btnEditar}
                            onClick={() => handleAbrirEditar(v)}
                            title="Editar venta"
                          >
                            <EditOutlinedIcon sx={{ fontSize: '1rem' }} />
                          </button>
                        )}
                        <button
                          className={styles.btnEliminar}
                          onClick={() => handleEliminar(v)}
                          title="Desactivar venta"
                        >
                          <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan={9} className={styles.empty}>No hay ventas registradas.</td></tr>
              )}
            </tbody>
            {filtradas.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={8} className={styles.footerLabel}>Total filtrado</td>
                  <td className={`${styles.right} ${styles.footerVal}`}>{fmt(totalFiltrado)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ── Modal de edición ── */}
      {editando && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setEditando(null) }}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                <EditOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} />
                Editar venta manual
              </span>
              <button className={styles.formClose} onClick={() => setEditando(null)}>
                <CloseOutlinedIcon sx={{ fontSize: '1rem' }} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formRow2col}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Producto *</label>
                  <input className={styles.input} value={editForm.producto || ''}
                    onChange={e => setEF('producto', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Marca / Categoría</label>
                  <input className={styles.input} value={editForm.marca || ''}
                    onChange={e => setEF('marca', e.target.value)} />
                </div>
              </div>

              <div className={styles.formRow3col} style={{ marginTop: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Precio unitario (ARS) *</label>
                  <input className={styles.input} type="number" min="0"
                    value={editForm.precio || ''} onChange={e => setEF('precio', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cantidad *</label>
                  <input className={styles.input} type="number" min="1"
                    value={editForm.cantidad || ''} onChange={e => setEF('cantidad', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fecha y hora</label>
                  <input className={styles.input} type="datetime-local"
                    value={editForm.fecha || ''} onChange={e => setEF('fecha', e.target.value)} />
                </div>
              </div>

              <div className={styles.formRow2col} style={{ marginTop: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Comprador</label>
                  <input className={styles.input} placeholder="Nombre del cliente"
                    value={editForm.comprador || ''} onChange={e => setEF('comprador', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nota adicional</label>
                  <input className={styles.input} placeholder="Canal de venta, observaciones..."
                    value={editForm.nota || ''} onChange={e => setEF('nota', e.target.value)} />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.formTotal}>
                Total: <strong>{fmt(Number(editForm.precio || 0) * Number(editForm.cantidad || 1))}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={styles.btnCancelar} onClick={() => setEditando(null)}>Cancelar</button>
                <button className={styles.btnGuardar} onClick={handleActualizar}
                  disabled={guardandoEdit || !editForm.producto?.trim() || !editForm.precio}>
                  {guardandoEdit
                    ? <CircularProgress size={14} sx={{ color: '#000' }} />
                    : <><CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Guardar cambios</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminVentas
