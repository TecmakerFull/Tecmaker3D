import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import useAuthStore from '../../stores/useAuthStore'
import { supabase } from '../../lib/supabase'
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined'
import styles from './AdminVentas.module.css'

// ============================================================
// AdminVentas — Registro de ventas concretadas
// Solo accesible para esAdmin === true
// ============================================================

const fmt = (n) =>
  n == null ? '—'
  : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) : '—'

const AdminVentas = () => {
  const { session, esAdmin } = useAuthStore()
  const [ventas,   setVentas]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [total,    setTotal]    = useState(0)

  useEffect(() => {
    if (!session || !esAdmin) return
    cargar()
  }, [session, esAdmin])

  const cargar = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('compras')
      .select(`
        id, created_at, cantidad, total, usuario_id,
        productos(nombre, marca, imagen),
        perfiles(nombre, email)
      `)
      .order('created_at', { ascending: false })

    if (error) console.error('Error cargando ventas:', error.message)

    const rows = data || []
    setVentas(rows)
    setTotal(rows.reduce((acc, v) => acc + (Number(v.total) || 0), 0))
    setCargando(false)
  }

  if (!session || !esAdmin) return null

  const filtradas = ventas.filter(v => {
    const q = busqueda.toLowerCase()
    return (
      (v.productos?.nombre || '').toLowerCase().includes(q) ||
      (v.perfiles?.nombre  || '').toLowerCase().includes(q) ||
      (v.perfiles?.email   || '').toLowerCase().includes(q)
    )
  })

  const totalFiltrado = filtradas.reduce((acc, v) => acc + (Number(v.total) || 0), 0)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.titulo}><PointOfSaleOutlinedIcon sx={{ fontSize: '1.4rem', verticalAlign: 'middle', mr: 0.5 }} /> Ventas concretadas</h1>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total ventas</span>
            <span className={styles.statVal}>{ventas.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Facturado</span>
            <span className={styles.statValBig}>{fmt(total)}</span>
          </div>
        </div>
      </div>

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
        <button className={styles.refreshBtn} onClick={cargar}>↺ Actualizar</button>
      </div>

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
                <th>Cliente</th>
                <th>Email</th>
                <th className={styles.right}>Cant.</th>
                <th className={styles.right}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(v => (
                <tr key={v.id}>
                  <td className={styles.fecha}>{fmtFecha(v.created_at)}</td>
                  <td>
                    <div className={styles.prodCell}>
                      {v.productos?.imagen && (
                        <img src={v.productos.imagen} alt="" className={styles.prodImg}
                          onError={e => { e.target.style.display='none' }} />
                      )}
                      <span className={styles.prodNombre}>{v.productos?.nombre || '—'}</span>
                    </div>
                  </td>
                  <td className={styles.muted}>{v.productos?.marca || '—'}</td>
                  <td>{v.perfiles?.nombre || '—'}</td>
                  <td className={styles.muted}>{v.perfiles?.email || '—'}</td>
                  <td className={styles.right}>{v.cantidad}</td>
                  <td className={styles.right + ' ' + styles.totalCell}>{fmt(v.total)}</td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>No hay ventas registradas.</td></tr>
              )}
            </tbody>
            {filtradas.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={6} className={styles.footerLabel}>Total filtrado</td>
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
