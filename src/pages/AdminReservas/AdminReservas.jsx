import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import useAuthStore from '../../stores/useAuthStore'
import { supabase } from '../../lib/supabase'
import styles from './AdminReservas.module.css'

// ============================================================
// AdminReservas — Panel de reservas activas para el admin
// Confirmar compra o cancelar/desbloquear
// ============================================================

const AdminReservas = () => {
  const esAdmin = useAuthStore((s) => s.esAdmin)
  const [reservas,   setReservas]   = useState([])
  const [usuarios,   setUsuarios]   = useState({})
  const [cargando,   setCargando]   = useState(true)
  const [procesando, setProcesando] = useState({})
  const [countdowns, setCountdowns] = useState({})
  const [tabActivo,  setTabActivo]  = useState('reservas') // 'reservas' | 'usuarios'
  const [listaUsers, setListaUsers] = useState([])

  useEffect(() => {
    if (!esAdmin) return
    cargarReservas()
  }, [esAdmin])

  useEffect(() => {
    if (tabActivo === 'usuarios') cargarUsuarios()
  }, [tabActivo])

  // Countdown timer
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

  const cargarReservas = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('reservas')
      .select('*, productos(nombre, imagen, marca, precio)')
      .eq('estado', 'activa')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    // Cargar perfiles de los usuarios
    if (data?.length) {
      const uids = [...new Set(data.map((r) => r.usuario_id))]
      const { data: perfs } = await supabase
        .from('perfiles')
        .select('id, nombre, email, telefono')
        .in('id', uids)
      const mapa = {}
      perfs?.forEach((p) => { mapa[p.id] = p })
      setUsuarios(mapa)
    }

    setReservas(data || [])
    setCargando(false)
  }

  const cargarUsuarios = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false })
    setListaUsers(data || [])
  }

  const handleConfirmar = async (reservaId) => {
    if (!window.confirm('¿Confirmar la compra y descontar del stock?')) return
    setProcesando((p) => ({ ...p, [reservaId]: 'confirmando' }))

    const { data, error } = await supabase.rpc('confirmar_compra', { p_reserva_id: reservaId })

    if (error || data?.error) {
      alert(`Error: ${error?.message || data?.error}`)
    } else {
      setReservas((prev) => prev.filter((r) => r.id !== reservaId))
    }
    setProcesando((p) => { const n = { ...p }; delete n[reservaId]; return n })
  }

  const handleCancelar = async (reservaId) => {
    if (!window.confirm('¿Cancelar esta reserva y liberar el producto?')) return
    setProcesando((p) => ({ ...p, [reservaId]: 'cancelando' }))

    await supabase
      .from('reservas')
      .update({ estado: 'expirada' })
      .eq('id', reservaId)

    setReservas((prev) => prev.filter((r) => r.id !== reservaId))
    setProcesando((p) => { const n = { ...p }; delete n[reservaId]; return n })
  }

  const formatPrecio = (p) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p)

  const formatFecha = (f) =>
    new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (!esAdmin) return (
    <div style={{ paddingTop: 120, textAlign: 'center', color: '#64748b', fontFamily: 'Poppins,sans-serif' }}>
      🔒 Acceso solo para administradores
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>PANEL ADMIN</span>
          <h1 className={styles.titulo}>Gestión de Reservas</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tabActivo === 'reservas' ? styles.tabActive : ''}`}
          onClick={() => setTabActivo('reservas')}
        >
          ⏱ Reservas activas {reservas.length > 0 && <span className={styles.tabBadge}>{reservas.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${tabActivo === 'usuarios' ? styles.tabActive : ''}`}
          onClick={() => setTabActivo('usuarios')}
        >
          👥 Usuarios registrados
        </button>
      </div>

      {/* ── Tab Reservas ── */}
      {tabActivo === 'reservas' && (
        <div className={styles.section}>
          {cargando ? (
            <div className={styles.loading}><CircularProgress sx={{ color: '#f59e0b' }} /></div>
          ) : reservas.length === 0 ? (
            <div className={styles.emptyState}>
              <span>✅</span>
              <p>No hay reservas activas en este momento.</p>
            </div>
          ) : (
            <div className={styles.reservasGrid}>
              {reservas.map((r) => {
                const usuario = usuarios[r.usuario_id]
                const prod    = r.productos
                const estado  = procesando[r.id]
                return (
                  <div key={r.id} className={styles.reservaCard}>
                    {/* Producto */}
                    <div className={styles.reservaProd}>
                      {prod?.imagen && (
                        <img src={prod.imagen} alt={prod.nombre} className={styles.prodImg}
                          onError={(e) => { e.target.style.display = 'none' }} />
                      )}
                      <div>
                        <p className={styles.prodNombre}>{prod?.nombre || r.producto_id}</p>
                        <p className={styles.prodMarca}>{prod?.marca}</p>
                        <p className={styles.prodDetalle}>
                          {r.cantidad} × {formatPrecio(prod?.precio || 0)} =
                          <strong> {formatPrecio((prod?.precio || 0) * r.cantidad)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className={styles.timerRow}>
                      <span className={styles.timer}>⏳ {countdowns[r.id]}</span>
                      <span className={styles.fechaReserva}>{formatFecha(r.created_at)}</span>
                    </div>

                    {/* Usuario */}
                    <div className={styles.usuarioRow}>
                      <span className={styles.usuarioLabel}>👤 Usuario</span>
                      <span className={styles.usuarioNombre}>{usuario?.nombre || 'Sin nombre'}</span>
                      <span className={styles.usuarioEmail}>{usuario?.email}</span>
                      {usuario?.telefono && (
                        <a
                          href={`https://wa.me/${usuario.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.waLink}
                        >
                          📱 WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className={styles.acciones}>
                      <button
                        className={styles.btnConfirmar}
                        onClick={() => handleConfirmar(r.id)}
                        disabled={!!estado}
                        id={`btn-confirmar-${r.id}`}
                      >
                        {estado === 'confirmando'
                          ? <CircularProgress size={14} sx={{ color: '#000' }} />
                          : '✅ Confirmar compra'
                        }
                      </button>
                      <button
                        className={styles.btnCancelar}
                        onClick={() => handleCancelar(r.id)}
                        disabled={!!estado}
                        id={`btn-cancelar-${r.id}`}
                      >
                        {estado === 'cancelando'
                          ? <CircularProgress size={14} sx={{ color: '#ef4444' }} />
                          : '✗ Cancelar'
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Usuarios ── */}
      {tabActivo === 'usuarios' && (
        <div className={styles.section}>
          <div className={styles.usersHeader}>
            <span className={styles.usersCount}>{listaUsers.length} usuarios registrados</span>
          </div>
          <div className={styles.usersTable}>
            <div className={styles.usersTableHead}>
              <span>Usuario</span>
              <span>Email</span>
              <span>Teléfono</span>
              <span>Registrado</span>
            </div>
            {listaUsers.map((u) => (
              <div key={u.id} className={styles.usersRow}>
                <span className={styles.userNombre}>{u.nombre || '—'}</span>
                <span className={styles.userEmail}>{u.email}</span>
                <span className={styles.userTel}>{u.telefono || '—'}</span>
                <span className={styles.userFecha}>{formatFecha(u.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReservas
