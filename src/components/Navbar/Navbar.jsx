import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MenuIcon         from '@mui/icons-material/Menu'
import CloseIcon        from '@mui/icons-material/Close'
import useCartStore from '../../stores/useCartStore'
import useAuthStore from '../../stores/useAuthStore'
import UserMenu, { LoginButton } from '../Auth/UserMenu'
import styles from './Navbar.module.css'

// ====================================================
// Navbar — Navegación principal con React Router
// ====================================================

const TIENDA_ITEMS = [
  { to: '/filamentos', label: 'Filamentos'     },
  { to: '/accesorios', label: 'Accesorios'     },
  { to: '/tienda',     label: 'Impresiones 3D' },
  { to: '/stl',        label: 'Archivos STL'   },
]

const ADMIN_ITEMS = [
  { to: '/admin/stock',    label: 'Stock'                },
  { to: '/admin/reservas', label: 'Reservas'             },
  { to: '/admin/usuarios', label: 'Usuarios registrados' },
  { to: '/admin/ventas',   label: 'Ventas'               },
]

const Navbar = () => {
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [tiendaOpen, setTiendaOpen] = useState(false)
  const [adminOpen,  setAdminOpen]  = useState(false)
  const [mobileShopOpen,  setMobileShopOpen]  = useState(false)
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false)
  const navRef      = useRef(null)
  const dropdownRef = useRef(null)
  const adminRef    = useRef(null)
  const location    = useLocation()

  const items    = useCartStore((state) => state.items)
  const openCart = useCartStore((state) => state.openCart)
  const session  = useAuthStore((s) => s.session)
  const esAdmin  = useAuthStore((s) => s.esAdmin)

  const totalItems   = items.reduce((acc, item) => acc + item.cantidad, 0)
  const tiendaActiva = TIENDA_ITEMS.some(i => location.pathname.startsWith(i.to))
  const adminActiva  = ADMIN_ITEMS.some(i => location.pathname.startsWith(i.to))

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setTiendaOpen(false)
      if (adminRef.current    && !adminRef.current.contains(e.target))    setAdminOpen(false)
      // Cierra el menú hamburguesa si el click es fuera de la barra de nav
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false)
        setMobileShopOpen(false)
        setMobileAdminOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNavClick = () => {
    setMenuOpen(false)
    setTiendaOpen(false)
    setAdminOpen(false)
    setMobileShopOpen(false)
    setMobileAdminOpen(false)
  }

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`} ref={navRef}>
      <div className={styles.container}>

        {/* Logo */}
        <Link to="/" className={styles.brand} onClick={handleNavClick}>
          <img src="/logo.png" alt="TecMaker 3D Logo" className={styles.brandLogo} />
          TecMaker 3D
        </Link>

        {/* Links principales */}
        <ul className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>

          <li>
            <NavLink to="/" end
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              onClick={handleNavClick}
            >
              Inicio
            </NavLink>
          </li>

          {/* Tienda dropdown */}
          <li className={styles.dropdownWrap} ref={dropdownRef}>
            <button
              className={`${styles.navLink} ${styles.dropdownBtn} ${tiendaActiva ? styles.navLinkActive : ''}`}
              onClick={() => setTiendaOpen(o => !o)}
              aria-expanded={tiendaOpen}
            >
              Tienda
              <span className={`${styles.dropdownArrow} ${tiendaOpen ? styles.dropdownArrowOpen : ''}`}>▾</span>
            </button>

            {tiendaOpen && (
              <ul className={styles.dropdown}>
                {TIENDA_ITEMS.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `${styles.dropdownLink} ${isActive ? styles.dropdownLinkActive : ''}`
                      }
                      onClick={handleNavClick}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li>
            <NavLink to="/calculadora"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              onClick={handleNavClick}
            >
              Calculadora 3D
            </NavLink>
          </li>

          <li>
            <NavLink to="/contacto"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              onClick={handleNavClick}
            >
              Contacto
            </NavLink>
          </li>

          {/* Admin dropdown */}
          {esAdmin && (
            <li className={styles.dropdownWrap} ref={adminRef}>
              <button
                className={`${styles.navLink} ${styles.dropdownBtn} ${styles.adminBtn} ${adminActiva ? styles.navLinkActive : ''}`}
                onClick={() => setAdminOpen(o => !o)}
                aria-expanded={adminOpen}
              >
                Admin
                <span className={`${styles.dropdownArrow} ${adminOpen ? styles.dropdownArrowOpen : ''}`}>▾</span>
              </button>
              {adminOpen && (
                <ul className={`${styles.dropdown} ${styles.dropdownAdmin}`}>
                  {ADMIN_ITEMS.map(({ to, label }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        className={({ isActive }) =>
                          `${styles.dropdownLink} ${isActive ? styles.dropdownLinkActive : ''}`
                        }
                        onClick={handleNavClick}
                      >
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}

          {/* Mobile: Tienda como acordeón */}
          <li className={styles.mobileOnly}>
            <button
              className={`${styles.navLink} ${styles.dropdownBtn} ${TIENDA_ITEMS.some(i => location.pathname.startsWith(i.to)) ? styles.navLinkActive : ''}`}
              onClick={() => setMobileShopOpen(o => !o)}
            >
              Tienda
              <span className={`${styles.dropdownArrow} ${mobileShopOpen ? styles.dropdownArrowOpen : ''}`}>▾</span>
            </button>
            {mobileShopOpen && (
              <ul className={styles.mobileSubList}>
                {TIENDA_ITEMS.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `${styles.navLink} ${styles.mobileSubLink} ${isActive ? styles.navLinkActive : ''}`
                      }
                      onClick={handleNavClick}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Mobile: Admin como acordeón */}
          {esAdmin && (
            <li className={styles.mobileOnly}>
              <button
                className={`${styles.navLink} ${styles.dropdownBtn} ${ADMIN_ITEMS.some(i => location.pathname.startsWith(i.to)) ? styles.navLinkActive : ''}`}
                onClick={() => setMobileAdminOpen(o => !o)}
              >
                Admin
                <span className={`${styles.dropdownArrow} ${mobileAdminOpen ? styles.dropdownArrowOpen : ''}`}>▾</span>
              </button>
              {mobileAdminOpen && (
                <ul className={styles.mobileSubList}>
                  {ADMIN_ITEMS.map(({ to, label }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        className={({ isActive }) =>
                          `${styles.navLink} ${styles.mobileSubLink} ${isActive ? styles.navLinkActive : ''}`
                        }
                        onClick={handleNavClick}
                      >
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}

        </ul>

        {/* Acciones */}
        <div className={styles.navActions}>
          {session ? <UserMenu /> : <LoginButton />}

          <button className={styles.cartBtn} onClick={openCart}
            aria-label="Abrir carrito de compras" id="btn-abrir-carrito"
          >
            <ShoppingCartIcon fontSize="small" />
            <span className={styles.cartBtnText}>Carrito</span>
            {totalItems > 0 && (
              <span className={styles.cartBadge} key={totalItems}>{totalItems}</span>
            )}
          </button>

          <button className={styles.mobileMenuBtn}
            onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

      </div>
    </nav>
  )
}

export default Navbar
