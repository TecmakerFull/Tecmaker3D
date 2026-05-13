import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import useAuthStore from '../../stores/useAuthStore'
import { supabase } from '../../lib/supabase'
import AccessTimeOutlinedIcon  from '@mui/icons-material/AccessTimeOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import PersonOutlinedIcon      from '@mui/icons-material/PersonOutlined'
import WhatsAppIcon            from '@mui/icons-material/WhatsApp'
import TimerOutlinedIcon       from '@mui/icons-material/TimerOutlined'
import LockOutlinedIcon        from '@mui/icons-material/LockOutlined'
import styles from './AdminReservas.module.css'

const AdminReservas = () => {
  const esAdmin = useAuthStore((s) => s.esAdmin)
  const [reservas,   setReservas]   = useState([])
  const [usuarios,   setUsuarios]   = useState({})
  const [cargando,   setCargando]   = useState(true)
  const [procesando, setProcesando] = useState({})
  const [countdowns, setCountdowns] = useState({})

  useEffect(() => {
    if (!esAdmin) {
      setCargando(false)
      return
    }
    cargarReservas()
  }, [esAdmin])

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
    try {
      const { data } = await supabase
        .from('reservas')
        .select('*, productos(nombre, imagen, marca, precio)')
        .eq('estado', 'activa')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

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
    } catch (e) {
      console.error('Error cargando reservas:', e)
    } finally {
      setCargando(false)
    }
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
      <LockOutlinedIcon sx={{ fontSize: '1.5rem', verticalAlign: 'middle', mr: 0.5 }} /> Acceso solo para administradores
    </div>
  )

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>PANEL ADMIN</span>
          <h1 className={styles.titulo}>
            <AccessTimeOutlinedIcon sx={{ fontSize: '1.6rem', verticalAlign: 'middle', mr: 0.6 }} />
            Reservas Activas
            {reservas.length > 0 && (
              <span className={styles.heroCount}>{reservas.length}</span>
            )}
          </h1>
        </div>
      </div>

      {/* Contenido */}
      <div className={styles.section}>
        {cargando ? (
          <div className={styles.loading}><CircularProgress sx={{ color: '#f59e0b' }} /></div>
        ) : reservas.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircleOutlinedIcon sx={{ fontSize: '2.5rem', color: '#22c55e' }} />
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
                    <span className={styles.timer}><TimerOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.2 }} /> {countdowns[r.id]}</span>
                    <span className={styles.fechaReserva}>{formatFecha(r.created_at)}</span>
                  </div>

                  {/* Usuario */}
                  <div className={styles.usuarioRow}>
                    <span className={styles.usuarioLabel}><PersonOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.2 }} /> Usuario</span>
                    <span className={styles.usuarioNombre}>{usuario?.nombre || 'Sin nombre'}</span>
                    <span className={styles.usuarioEmail}>{usuario?.email}</span>
                    {usuario?.telefono && (
                      <a
                        href={`https://wa.me/${usuario.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.waLink}
                      >
                        <WhatsAppIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> WhatsApp
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
                         : <><CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Confirmar compra</>
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

    </div>
  )
}

export default AdminReservas
