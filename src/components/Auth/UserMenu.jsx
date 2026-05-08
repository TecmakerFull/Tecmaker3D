import { useState, useRef, useEffect } from 'react'
import useAuthStore from '../../stores/useAuthStore'
import useReservasStore from '../../stores/useReservasStore'
import styles from './UserMenu.module.css'

// ── SVG Google ──────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" className={styles.googleIcon}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

// ── Modal de Login ──────────────────────────────────────
export const LoginModal = ({ onClose }) => {
  const { loginConGoogle, loginConEmail, registrarConEmail, resetPassword } = useAuthStore()
  const [modo, setModo] = useState('login') // 'login' | 'registro' | 'reset'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre]     = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')
  const [ok, setOk]             = useState('')
  const overlayRef = useRef()

  const reset = () => { setError(''); setOk('') }

  const handleGoogle = () => { loginConGoogle(); onClose() }

  const handleEmail = async (e) => {
    e.preventDefault()
    reset()
    setCargando(true)
    if (modo === 'login') {
      const { error } = await loginConEmail(email, password)
      if (error) setError(
        error.message.includes('Invalid') ? 'Email o contraseña incorrectos.' : error.message
      )
      else onClose()
    } else if (modo === 'registro') {
      const { error } = await registrarConEmail(email, password, nombre)
      if (error) setError(error.message)
      else setOk('¡Cuenta creada! Revisá tu email para confirmar.')
    } else {
      const { error } = await resetPassword(email)
      if (error) setError(error.message)
      else setOk('Te enviamos un email para restablecer tu contraseña.')
    }
    setCargando(false)
  }

  return (
    <div
      className={styles.modalOverlay}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={styles.modalBox}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            {modo === 'login'    ? '👋 Iniciar sesión'     :
             modo === 'registro' ? '✨ Crear cuenta'       :
                                   '🔑 Recuperar contraseña'}
          </span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>

          {/* Google */}
          {modo !== 'reset' && (
            <>
              <button className={styles.googleBtn} onClick={handleGoogle}>
                <GoogleIcon />
                {modo === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
              </button>
              <div className={styles.divider}><span>o con email</span></div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleEmail} className={styles.form}>
            {modo === 'registro' && (
              <input
                className={styles.input}
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={e => { setNombre(e.target.value); reset() }}
                required
                autoFocus
              />
            )}
            <input
              className={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => { setEmail(e.target.value); reset() }}
              required
              autoFocus={modo !== 'registro'}
            />
            {modo !== 'reset' && (
              <input
                className={styles.input}
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => { setPassword(e.target.value); reset() }}
                required
                minLength={6}
              />
            )}

            {error && <p className={styles.errorMsg}>⚠️ {error}</p>}
            {ok    && <p className={styles.okMsg}>✅ {ok}</p>}

            <button className={styles.submitBtn} type="submit" disabled={cargando}>
              {cargando ? 'Procesando...' :
               modo === 'login'    ? 'Ingresar'             :
               modo === 'registro' ? 'Crear cuenta'         :
                                     'Enviar email'}
            </button>
          </form>

          {/* Links entre modos */}
          <div className={styles.modeLinks}>
            {modo === 'login' && <>
              <button className={styles.modeLink} onClick={() => { setModo('registro'); reset() }}>
                ¿No tenés cuenta? Registrate
              </button>
              <button className={styles.modeLink} onClick={() => { setModo('reset'); reset() }}>
                Olvidé mi contraseña
              </button>
            </>}
            {(modo === 'registro' || modo === 'reset') && (
              <button className={styles.modeLink} onClick={() => { setModo('login'); reset() }}>
                ← Volver a iniciar sesión
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Botón cuando NO hay sesión ──────────────────────────
export const LoginButton = ({ compact = false }) => {
  const [modalAbierto, setModalAbierto] = useState(false)

  return (
    <>
      <button
        className={`${styles.loginBtn} ${compact ? styles.loginBtnCompact : ''}`}
        onClick={() => setModalAbierto(true)}
        id="btn-login"
      >
        <GoogleIcon />
        {!compact && <span>Iniciar sesión</span>}
      </button>
      {modalAbierto && <LoginModal onClose={() => setModalAbierto(false)} />}
    </>
  )
}

// ── Avatar + dropdown cuando SÍ hay sesión ──────────────
const UserMenu = () => {
  const { perfil, session, logout } = useAuthStore()
  const reservas = useReservasStore((s) => s.reservas)
  const [abierto, setAbierto] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const nombre  = perfil?.nombre || session?.user?.user_metadata?.full_name || 'Usuario'
  const avatar  = perfil?.avatar_url || session?.user?.user_metadata?.avatar_url || null
  const inicial = nombre.charAt(0).toUpperCase()
  const reservasActivas = reservas.filter((r) => new Date(r.expires_at) > new Date()).length

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.avatarBtn} onClick={() => setAbierto((v) => !v)} id="btn-user-menu">
        {avatar
          ? <img src={avatar} alt={nombre} className={styles.avatar} referrerPolicy="no-referrer" />
          : <span className={styles.avatarInitial}>{inicial}</span>
        }
        {reservasActivas > 0 && <span className={styles.badge}>{reservasActivas}</span>}
      </button>

      {abierto && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownNombre}>{nombre}</span>
            <span className={styles.dropdownEmail}>{session?.user?.email}</span>
          </div>
          <div className={styles.dropdownDivider} />
          <a href="/perfil" className={styles.dropdownItem} onClick={() => setAbierto(false)}>
            👤 Mi perfil
          </a>
          {reservasActivas > 0 && (
            <a href="/perfil#reservas" className={styles.dropdownItem} onClick={() => setAbierto(false)}>
              ⏱ Mis reservas <span className={styles.dropdownBadge}>{reservasActivas}</span>
            </a>
          )}
          <div className={styles.dropdownDivider} />
          <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={logout}>
            🔒 Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
