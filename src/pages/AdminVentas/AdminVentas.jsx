import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import useAuthStore from '../../stores/useAuthStore'
import { supabase } from '../../lib/supabase'
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined'
import AddCircleOutlineIcon    from '@mui/icons-material/AddCircleOutline'
import CloseOutlinedIcon       from '@mui/icons-material/CloseOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import StorefrontOutlinedIcon  from '@mui/icons-material/StorefrontOutlined'
import PersonOutlinedIcon      from '@mui/icons-material/PersonOutlined'
import styles from './AdminVentas.module.css'

const fmt = (n) =>
  n == null ? '—'
  : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) : '—'

const FORM_VACIO = {
  producto: '', marca: '', precio: '', cantidad: 1,
  comprador: '', nota: ''
}

const AdminVentas = () => {
  const { session, esAdmin } = useAuthStore()
  const [ventas,    setVentas]    = useState([])
  const [perfiles,  setPerfiles]  = useState({})
  const [cargando,  setCargando]  = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [okMsg,     setOkMsg]     = useState(false)

  useEffect(() => {
    if (!session || !esAdmin) return
    cargar()
  }, [session, esAdmin])

  // ── Carga ventas + perfiles de compradores ─────────────────
  const cargar = async () => {
    setCargando(true)
    try {
      // Compras del flujo online
      const { data: comprasData } = await supabase
        .from('compras')
        .select('id, created_at, cantidad, total, usuario_id, producto_id, productos(nombre, marca, imagen)')
        .order('created_at', { ascending: false })

      // Ventas manuales (puede no existir la tabla aún)
      let manualesData = []
      try {
        const { data } = await supabase
          .from('ventas_manuales')
          .select('*')
          .order('created_at', { ascending: false })
        manualesData = data || []
      } catch (_) {
        // tabla aún no creada — ignorar
      }

      // Perfiles de usuarios de compras online
      const uids = [...new Set((comprasData || []).map(c => c.usuario_id).filter(Boolean))]
      let perfsMap = {}
      if (uids.length) {
        const { data: perfsData } = await supabase
          .from('perfiles')
          .select('id, nombre, email')
          .in('id', uids)
        perfsData?.forEach(p => { perfsMap[p.id] = p })
      }
      setPerfiles(perfsMap)

      const online = (comprasData || []).map(c => ({
        id:         c.id,
        fecha:      c.created_at,
        producto:   c.productos?.nombre || '—',
        marca:      c.productos?.marca  || '—',
        imagen:     c.productos?.imagen || null,
        comprador:  perfsMap[c.usuario_id]?.nombre || '—',
        email:      perfsMap[c.usuario_id]?.email  || '—',
        cantidad:   c.cantidad,
        total:      c.total,
        nota:       null,
        tipo:       'online',
      }))

      const manuales = manualesData.map(m => ({
        id:        m.id,
        fecha:     m.created_at,
        producto:  m.producto,
        marca:     m.marca || '—',
        imagen:    null,
        comprador: m.comprador || '—',
        email:     '—',
        cantidad:  m.cantidad,
        total:     Number(m.precio) * Number(m.cantidad),
        nota:      m.nota || null,
        tipo:      'manual',
      }))

      const todas = [...online, ...manuales].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      )
      setVentas(todas)
    } catch (err) {
      console.error('Error cargando ventas:', err.message)
    }
    setCargando(false)
  }

  // ── Guardar venta manual ───────────────────────────────────
  const handleGuardar = async () => {
    if (!form.producto.trim() || !form.precio || !form.cantidad) return
    setGuardando(true)
    const { error } = await supabase.from('ventas_manuales').insert({
      producto:   form.producto.trim(),
      marca:      form.marca.trim()     || null,
      precio:     Number(form.precio),
      cantidad:   Number(form.cantidad) || 1,
      comprador:  form.comprador.trim() || null,
      nota:       form.nota.trim()      || null,
      admin_id:   session.user.id,
    })
    setGuardando(false)
    if (!error) {
      setForm(FORM_VACIO)
      setShowForm(false)
      setOkMsg(true)
      setTimeout(() => setOkMsg(false), 3000)
      cargar()
    } else {
      alert('Error al guardar: ' + error.message)
    }
  }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const totalFila = Number(form.precio || 0) * Number(form.cantidad || 1)

  if (!session || !esAdmin) return null

  const filtradas = ventas.filter(v => {
    const q = busqueda.toLowerCase()
    return (
      v.producto.toLowerCase().includes(q)  ||
      v.comprador.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    )
  })
  const totalFiltrado = filtradas.reduce((acc, v) => acc + (v.total || 0), 0)
  const totalGeneral  = ventas.reduce((acc, v) => acc + (v.total || 0), 0)

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
            <span className={styles.statVal}>{ventas.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Facturado</span>
            <span className={styles.statValBig}>{fmt(totalGeneral)}</span>
          </div>
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

      {/* Formulario venta manual */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <span className={styles.formTitle}>
              <StorefrontOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} />
              Registrar venta fuera de la tienda
            </span>
            <button className={styles.formClose} onClick={() => setShowForm(false)}>
              <CloseOutlinedIcon sx={{ fontSize: '1rem' }} />
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Producto *</label>
              <input className={styles.input} placeholder="Nombre del producto"
                value={form.producto} onChange={e => setF('producto', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Marca / Categoría</label>
              <input className={styles.input} placeholder="Marca o tipo"
                value={form.marca} onChange={e => setF('marca', e.target.value)} />
            </div>
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
              <label className={styles.label}>
                <PersonOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.3 }} />
                Comprador
              </label>
              <input className={styles.input} placeholder="Nombre del cliente"
                value={form.comprador} onChange={e => setF('comprador', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nota adicional</label>
              <input className={styles.input} placeholder="Canal de venta, observaciones..."
                value={form.nota} onChange={e => setF('nota', e.target.value)} />
            </div>
          </div>

          <div className={styles.formFooter}>
            <span className={styles.formTotal}>
              Total: <strong>{fmt(totalFila)}</strong>
            </span>
            <button
              className={styles.btnGuardar}
              onClick={handleGuardar}
              disabled={guardando || !form.producto.trim() || !form.precio}
            >
              {guardando
                ? <CircularProgress size={14} sx={{ color: '#000' }} />
                : <><CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Registrar venta</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
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
              </tr>
            </thead>
            <tbody>
              {filtradas.map(v => (
                <tr key={`${v.tipo}-${v.id}`}>
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
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan={8} className={styles.empty}>No hay ventas registradas.</td></tr>
              )}
            </tbody>
            {filtradas.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7} className={styles.footerLabel}>Total filtrado</td>
                  <td className={`${styles.right} ${styles.footerVal}`}>{fmt(totalFiltrado)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminVentas
