import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import useCartStore from '../../stores/useCartStore'
import useAuthStore from '../../stores/useAuthStore'
import UserMenu, { LoginButton } from '../Auth/UserMenu'
import styles from './Navbar.module.css'

// ====================================================
// Navbar — Navegación principal con React Router
// ====================================================

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const items    = useCartStore((state) => state.items)
  const openCart = useCartStore((state) => state.openCart)
  const session  = useAuthStore((s) => s.session)
  const esAdmin  = useAuthStore((s) => s.esAdmin)

  // Cantidad total del carrito
  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0)

  // Efecto scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cierra menú mobile al navegar
  const handleNavClick = () => setMenuOpen(false)

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo / Brand */}
        <Link to="/" className={styles.brand} onClick={handleNavClick}>
          <img
            src="/logo.png"
            alt="TecMaker 3D Logo"
            className={styles.brandLogo}
          />
          TecMaker 3D
        </Link>

        {/* Links de navegación — usan <NavLink> para clase activa automática */}
        <ul className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={handleNavClick}
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/filamentos"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={handleNavClick}
            >
              Filamentos
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/accesorios"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={handleNavClick}
            >
              Accesorios
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/tienda"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={handleNavClick}
            >
              Tienda
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/stl"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={handleNavClick}
            >
              STL
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contacto"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={handleNavClick}
            >
              Contacto
            </NavLink>
          </li>
          {/* Tabs solo para admin */}
          {esAdmin && (
            <>
              <li>
                <NavLink
                  to="/admin/stock"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  onClick={handleNavClick}
                >
                  📦 Stock
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reservas"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  onClick={handleNavClick}
                >
                  📋 Reservas
                </NavLink>
              </li>
            </>
          )}
        </ul>

        {/* Acciones: Carrito */}
        <div className={styles.navActions}>
          <button
            className={styles.cartBtn}
            onClick={openCart}
            aria-label="Abrir carrito de compras"
            id="btn-abrir-carrito"
          >
            <ShoppingCartIcon fontSize="small" />
            <span>Carrito</span>
            {totalItems > 0 && (
              <span className={styles.cartBadge} key={totalItems}>
                {totalItems}
              </span>
            )}
          </button>

          {/* Login / Avatar */}
          {session ? <UserMenu /> : <LoginButton />}

          {/* Botón hamburguesa mobile */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
