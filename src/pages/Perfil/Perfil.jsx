import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import useAuthStore from '../../stores/useAuthStore'
import useReservasStore from '../../stores/useReservasStore'
import { supabase } from '../../lib/supabase'
import WavingHandOutlinedIcon   from '@mui/icons-material/WavingHandOutlined'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import SaveOutlinedIcon         from '@mui/icons-material/SaveOutlined'
import AccessTimeOutlinedIcon   from '@mui/icons-material/AccessTimeOutlined'
import ReceiptLongOutlinedIcon  from '@mui/icons-material/ReceiptLongOutlined'
import ShoppingBagOutlinedIcon  from '@mui/icons-material/ShoppingBagOutlined'
import TimerOutlinedIcon        from '@mui/icons-material/TimerOutlined'
import styles from './Perfil.module.css'

// ============================================================
// Perfil — Página del usuario logueado
// /perfil → reservas activas + historial de compras
// ============================================================

const Perfil = () => {
  const { session, perfil, actualizarPerfil } = useAuthStore()
  const { reservas, cargarReservas, cancelarReserva } = useReservasStore()

  const [compras,       setCompras]       = useState([])
  const [cargandoHist,  setCargandoHist]  = useState(false)
  const [cotizaciones,  setCotizaciones]  = useState([])
  const [cargandoCot,   setCargandoCot]   = useState(false)
  const [editando,      setEditando]      = useState(false)
  const [formPerfil,    setFormPerfil]    = useState({ nombre: '', telefono: '' })
  const [guardandoPerf, setGuardandoPerf] = useState(false)
  const [countdowns,    setCountdowns]    = useState({})

  useEffect(() => {
    if (!session) {
      setCargandoHist(false)
      setCargandoCot(false)
      return
    }
    cargarReservas()
    cargarHistorial()
    cargarCotizaciones()
  }, [session])

  // Inicializar form de perfil
  useEffect(() => {
    if (perfil) setFormPerfil({ nombre: perfil.nombre || '', telefono: perfil.telefono || '' })
  }, [perfil])

  // Countdown timer para reservas activas
  useEffect(() => {
    const tick = () => {
      const cd = {}
      reservas.forEach((r) => {
        const diff = Math.max(0, Math.floor((new Date(r.expires_at) - new Date()) / 1000))
        const m = String(Math.floor(diff / 60)).padStart(2, '0')
        const s = String(diff % 60).padStart(2, '0')
        cd[r.id] = `${m}:${s}`
      })
      setCountdowns(cd)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [reservas])

  const cargarHistorial = async () => {
    setCargandoHist(true)
    try {
      const { data } = await supabase
        .from('compras')
        .select('*, productos(nombre, imagen, marca)')
        .eq('usuario_id', session.user.id)
        .order('created_at', { ascending: false })
      setCompras(data || [])
    } catch (e) {
      console.error('Error cargando historial:', e)
    } finally {
      setCargandoHist(false)
    }
  }

  const cargarCotizaciones = async () => {
    setCargandoCot(true)
    try {
      const { data } = await supabase
        .from('cotizaciones')
        .select('id, created_at, nombre_producto, cliente, precio_final, costo_total, margen, impresora_nombre')
        .eq('usuario_id', session.user.id)
        .order('created_at', { ascending: false })
      setCotizaciones(data || [])
    } catch (e) {
      console.error('Error cargando cotizaciones:', e)
    } finally {
      setCargandoCot(false)
    }
  }

  const eliminarCotizacion = async (id) => {
    await supabase.from('cotizaciones').delete().eq('id', id)
    setCotizaciones(prev => prev.filter(c => c.id !== id))
  }

  const handleGuardarPerfil = async (e) => {
    e.preventDefault()
    setGuardandoPerf(true)
    await actualizarPerfil(formPerfil)
    setGuardandoPerf(false)
    setEditando(false)
  }

  const formatPrecio = (p) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p)

  const formatFecha = (f) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (!session) return (
    <div className={styles.page}>
      <p className={styles.noSession}>Debés iniciar sesión para ver tu perfil.</p>
    </div>
  )

  const nombre   = perfil?.nombre || session.user.user_metadata?.full_name || 'Usuario'
  const avatar   = perfil?.avatar_url || session.user.user_metadata?.avatar_url
  const reservasActivas = reservas.filter((r) => new Date(r.expires_at) > new Date())

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>MI CUENTA</span>
          <h1 className={styles.titulo}>Hola, {nombre.split(' ')[0]} <WavingHandOutlinedIcon sx={{ fontSize: '1.6rem', verticalAlign: 'middle', color: '#f59e0b' }} /></h1>
        </div>
      </div>

      <div className={styles.grid}>

        {/* ── Datos del perfil ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Mi perfil</h2>
            {!editando && (
              <button className={styles.editBtn} onClick={() => setEditando(true)}><EditOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Editar</button>
            )}
          </div>

          <div className={styles.avatarRow}>
            {avatar
              ? <img src={avatar} alt={nombre} className={styles.avatar} referrerPolicy="no-referrer" />
              : <div className={styles.avatarInitial}>{nombre.charAt(0).toUpperCase()}</div>
            }
            <div>
              <p className={styles.perfilNombre}>{nombre}</p>
              <p className={styles.perfilEmail}>{session.user.email}</p>
            </div>
          </div>

          {editando ? (
            <form onSubmit={handleGuardarPerfil} className={styles.editForm}>
              <label className={styles.fieldLabel}>Nombre completo</label>
              <input
                className={styles.input}
                value={formPerfil.nombre}
                onChange={(e) => setFormPerfil((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Tu nombre"
                id="input-perfil-nombre"
              />
              <label className={styles.fieldLabel}>Teléfono</label>
              <input
                className={styles.input}
                value={formPerfil.telefono}
                onChange={(e) => setFormPerfil((p) => ({ ...p, telefono: e.target.value }))}
                placeholder="Ej: 341-555-0000"
                id="input-perfil-telefono"
              />
              <div className={styles.editActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditando(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={guardandoPerf}>
                  {guardandoPerf ? <CircularProgress size={14} sx={{ color: '#f59e0b' }} /> : <><SaveOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Guardar</>}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.perfilData}>
              <div className={styles.perfilField}>
                <span className={styles.perfilFieldLabel}>Teléfono</span>
                <span className={styles.perfilFieldValue}>{perfil?.telefono || '—'}</span>
              </div>
              <div className={styles.perfilField}>
                <span className={styles.perfilFieldLabel}>Miembro desde</span>
                <span className={styles.perfilFieldValue}>{perfil?.created_at ? formatFecha(perfil.created_at) : '—'}</span>
              </div>
            </div>
          )}
        </section>

        {/* ── Reservas activas ── */}
        <section className={styles.card} id="reservas">
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><AccessTimeOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Reservas activas</h2>
            {reservasActivas.length > 0 && (
              <span className={styles.countBadge}>{reservasActivas.length}</span>
            )}
          </div>

          {reservasActivas.length === 0 ? (
            <p className={styles.emptyMsg}>No tenés reservas activas en este momento.</p>
          ) : (
            <div className={styles.reservasList}>
              {reservasActivas.map((r) => (
                <div key={r.id} className={styles.reservaItem}>
                  <div className={styles.reservaInfo}>
                    <span className={styles.reservaProducto}>
                      {r.productos?.nombre || `Producto #${r.producto_id}`}
                    </span>
                    <span className={styles.reservaCantidad}>× {r.cantidad}</span>
                  </div>
                  <div className={styles.reservaRight}>
                    <span className={styles.reservaTimer}><TimerOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.2 }} /> {countdowns[r.id]}</span>
                    <button
                      className={styles.cancelReservaBtn}
                      onClick={() => cancelarReserva(r.producto_id)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Cotizaciones ── */}
        <section className={`${styles.card} ${styles.cardFull}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><ReceiptLongOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Mis Cotizaciones</h2>
            {!cargandoCot && <span className={styles.countBadge}>{cotizaciones.length}</span>}
          </div>
          {cargandoCot ? (
            <div className={styles.loading}><CircularProgress size={24} sx={{ color: '#f59e0b' }} /></div>
          ) : cotizaciones.length === 0 ? (
            <p className={styles.emptyMsg}>No tenés presupuestos guardados todavía.</p>
          ) : (
            <div className={styles.comprasList}>
              {cotizaciones.map(c => (
                <div key={c.id} className={styles.compraItem}>
                  <div className={styles.compraInfo}>
                    <span className={styles.compraNombre}>{c.nombre_producto || 'Sin nombre'}</span>
                    {c.cliente && <span className={styles.compraMarca}>Cliente: {c.cliente}</span>}
                    <span className={styles.compraMarca}>{c.impresora_nombre}</span>
                  </div>
                  <div className={styles.compraDetalles}>
                    <span className={styles.compraTotal}>{formatPrecio(c.precio_final)}</span>
                    <span className={styles.compraCantidad}>{c.margen}% margen</span>
                    <span className={styles.compraFecha}>{formatFecha(c.created_at)}</span>
                    <button
                      onClick={() => eliminarCotizacion(c.id)}
                      style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'1rem' }}
                      title="Eliminar"
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Historial de compras ── */}
        <section className={`${styles.card} ${styles.cardFull}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><ShoppingBagOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Historial de compras</h2>
          </div>

          {cargandoHist ? (
            <div className={styles.loading}><CircularProgress size={24} sx={{ color: '#f59e0b' }} /></div>
          ) : compras.length === 0 ? (
            <p className={styles.emptyMsg}>Aún no tenés compras confirmadas.</p>
          ) : (
            <div className={styles.comprasList}>
              {compras.map((c) => (
                <div key={c.id} className={styles.compraItem}>
                  {c.productos?.imagen && (
                    <img src={c.productos.imagen} alt={c.productos.nombre} className={styles.compraImg}
                      onError={(e) => { e.target.style.display = 'none' }} />
                  )}
                  <div className={styles.compraInfo}>
                    <span className={styles.compraNombre}>{c.productos?.nombre || c.producto_id}</span>
                    <span className={styles.compraMarca}>{c.productos?.marca}</span>
                  </div>
                  <div className={styles.compraDetalles}>
                    <span className={styles.compraCantidad}>× {c.cantidad}</span>
                    <span className={styles.compraTotal}>{formatPrecio(c.total)}</span>
                    <span className={styles.compraFecha}>{formatFecha(c.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default Perfil
