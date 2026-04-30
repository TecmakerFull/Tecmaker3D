import { useState, useEffect } from 'react'
import { Typography, Button, CircularProgress } from '@mui/material'
import { supabase } from '../../lib/supabase'
import useStockStore from '../../stores/useStockStore'
import styles from './StockManager.module.css'

// ====================================================
// StockManager — Autenticación real con Supabase Auth
// ====================================================

const StockManager = () => {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const { stock, precios, catalogoFilamentos, catalogoAccesorios, cargando, error, cargarStock, ingresarStock, egresarStock, ajustarStock, actualizarPrecio } = useStockStore()
  const [tab, setTab] = useState('filamentos')
  const [inputValues, setInputValues] = useState({})
  const [precioValues, setPrecioValues] = useState({})
  const [guardando, setGuardando] = useState({})

  const productos = tab === 'filamentos' ? catalogoFilamentos : catalogoAccesorios

  // Detectar sesión existente al montar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cargar stock cuando hay sesión
  useEffect(() => {
    if (session) cargarStock()
  }, [session])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError('Email o contraseña incorrectos')
    setLoginLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const handleChange = (id, value) =>
    setInputValues((prev) => ({ ...prev, [id]: value }))

  const handleAjuste = async (id) => {
    const val = parseInt(inputValues[id], 10)
    if (isNaN(val) || val < 0) return
    setGuardando((prev) => ({ ...prev, [id]: true }))
    await ajustarStock(id, val, 'Ajuste manual de inventario')
    setInputValues((prev) => ({ ...prev, [id]: '' }))
    setGuardando((prev) => ({ ...prev, [id]: false }))
  }

  const handlePrecioChange = (id, val) =>
    setPrecioValues((prev) => ({ ...prev, [id]: val }))

  const handleGuardarPrecio = async (id) => {
    const val = parseInt(precioValues[id], 10)
    if (isNaN(val) || val < 0) return
    setGuardando((prev) => ({ ...prev, [`p-${id}`]: true }))
    await actualizarPrecio(id, val)
    setPrecioValues((prev) => ({ ...prev, [id]: '' }))
    setGuardando((prev) => ({ ...prev, [`p-${id}`]: false }))
  }

  const handleIngreso = async (id) => {
    setGuardando((prev) => ({ ...prev, [`in-${id}`]: true }))
    await ingresarStock(id, 1, 'Ingreso +1')
    setGuardando((prev) => ({ ...prev, [`in-${id}`]: false }))
  }

  const handleEgreso = async (id) => {
    setGuardando((prev) => ({ ...prev, [`out-${id}`]: true }))
    await egresarStock(id, 1, 'Egreso -1')
    setGuardando((prev) => ({ ...prev, [`out-${id}`]: false }))
  }

  const getStockColor = (cantidad) => {
    if (cantidad === 0) return '#ef4444'
    if (cantidad <= 3) return '#f59e0b'
    return '#22c55e'
  }

  // ── Cargando sesión ────────────────────────────────
  if (authLoading) {
    return (
      <div className={styles.loginWrapper}>
        <CircularProgress size={36} sx={{ color: '#f59e0b' }} />
      </div>
    )
  }

  // ── LOGIN ──────────────────────────────────────────
  if (!session) {
    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginCard}>
          <div className={styles.loginIcon}>🔒</div>
          <Typography className={styles.loginTitle}>Acceso Restringido</Typography>
          <Typography className={styles.loginSubtitle}>
            Panel de administración · TecMaker 3D
          </Typography>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="email"
              className={styles.loginInput}
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLoginError('') }}
              autoFocus
              id="input-admin-email"
            />
            <input
              type="password"
              className={`${styles.loginInput} ${loginError ? styles.loginInputError : ''}`}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
              id="input-admin-password"
            />
            {loginError && <span className={styles.loginError}>⚠️ {loginError}</span>}
            <Button
              type="submit"
              className={styles.loginBtn}
              disabled={loginLoading}
              id="btn-admin-login"
            >
              {loginLoading ? <CircularProgress size={18} sx={{ color: '#f59e0b' }} /> : 'Ingresar →'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // ── PANEL DE STOCK ─────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerBadge}>📦 PANEL ADMINISTRADOR</div>
        <Typography component="h1" className={styles.title}>Gestión de Stock</Typography>
        <Typography className={styles.subtitle}>
          {session.user.email} · Stock sincronizado con Supabase
        </Typography>
        <button className={styles.logoutBtn} onClick={handleLogout} id="btn-cerrar-sesion">
          🔒 Cerrar sesión
        </button>
      </div>

      {cargando && (
        <div className={styles.loadingRow}>
          <CircularProgress size={20} sx={{ color: '#f59e0b' }} />
          <span>Cargando stock desde Supabase...</span>
        </div>
      )}
      {error && (
        <div className={styles.errorBanner}>
          ⚠️ Error: {error}
          <button onClick={cargarStock} className={styles.retrySmall}>Reintentar</button>
        </div>
      )}

      {!cargando && (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryNumber} style={{ color: '#f59e0b' }}>
                {filamentos.reduce((acc, f) => acc + (stock[f.id] || 0), 0)}
              </span>
              <span className={styles.summaryLabel}>Unidades de Filamento</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryNumber} style={{ color: '#6366f1' }}>
                {accesorios.reduce((acc, a) => acc + (stock[a.id] || 0), 0)}
              </span>
              <span className={styles.summaryLabel}>Unidades de Accesorios</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryNumber} style={{ color: '#ef4444' }}>
                {[...filamentos, ...accesorios].filter((p) => (stock[p.id] || 0) === 0).length}
              </span>
              <span className={styles.summaryLabel}>Sin Stock</span>
            </div>
          </div>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'filamentos' ? styles.tabActive : ''}`}
              onClick={() => setTab('filamentos')} id="tab-filamentos">
              🧵 Filamentos ({filamentos.length})
            </button>
            <button className={`${styles.tab} ${tab === 'accesorios' ? styles.tabActive : ''}`}
              onClick={() => setTab('accesorios')} id="tab-accesorios">
              ⚙️ Accesorios ({accesorios.length})
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca/Cat.</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Ingreso (+)</th>
                  <th>Egreso (−)</th>
                  <th>Ajustar</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const stockActual = stock[p.id] || 0
                  return (
                    <tr key={p.id} className={styles.row}>
                      <td>
                        <div className={styles.productCell}>
                          <img src={p.imagen} alt={p.nombre} className={styles.productImg}
                            onError={(e) => { e.target.style.display = 'none' }} />
                          <span className={styles.productName}>{p.nombre}</span>
                        </div>
                      </td>
                      <td className={styles.cellMarca}>{p.marca || p.categoria}</td>
                      <td>
                        <div className={styles.setGroup}>
                          <span className={styles.precioActual}>
                            ${(precios[p.id] ?? p.precio ?? 0).toLocaleString('es-AR')}
                          </span>
                          <input
                            type="number" min="0"
                            className={styles.setInput}
                            style={{ width: '80px' }}
                            value={precioValues[p.id] || ''}
                            onChange={(e) => handlePrecioChange(p.id, e.target.value)}
                            placeholder="nuevo"
                            id={`input-precio-${p.id}`}
                          />
                          <Button
                            className={styles.btnSet}
                            onClick={() => handleGuardarPrecio(p.id)}
                            disabled={!!guardando[`p-${p.id}`]}
                            id={`btn-precio-${p.id}`}
                          >
                            {guardando[`p-${p.id}`] ? '...' : '✓'}
                          </Button>
                        </div>
                      </td>
                      <td>
                        <span className={styles.stockNum} style={{ color: getStockColor(stockActual) }}>
                          {stockActual}
                        </span>
                      </td>
                      <td>
                        <Button className={styles.btnIncrease}
                          onClick={() => handleIngreso(p.id)}
                          disabled={!!guardando[`in-${p.id}`]}
                          id={`btn-increase-${p.id}`}>
                          {guardando[`in-${p.id}`] ? '...' : '+1'}
                        </Button>
                      </td>
                      <td>
                        <Button className={styles.btnDecrease}
                          onClick={() => handleEgreso(p.id)}
                          disabled={stockActual === 0 || !!guardando[`out-${p.id}`]}
                          id={`btn-decrease-${p.id}`}>
                          {guardando[`out-${p.id}`] ? '...' : '−1'}
                        </Button>
                      </td>
                      <td>
                        <div className={styles.setGroup}>
                          <input type="number" min="0" className={styles.setInput}
                            value={inputValues[p.id] || ''}
                            onChange={(e) => handleChange(p.id, e.target.value)}
                            placeholder="0" id={`input-stock-${p.id}`} />
                          <Button className={styles.btnSet}
                            onClick={() => handleAjuste(p.id)}
                            disabled={!!guardando[p.id]}
                            id={`btn-set-${p.id}`}>
                            {guardando[p.id] ? '...' : '✓'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default StockManager
