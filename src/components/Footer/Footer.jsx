import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="TecMaker 3D" style={{ height: '36px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' }} />
            TecMaker 3D
          </div>
          <p className={styles.brandDesc}>
            Filamentos premium, accesorios y productos impresos en 3D.
            Calidad garantizada en cada impresión.
          </p>
          <div className={styles.social}>
            <a href="https://www.facebook.com/profile.php?id=100087129600305" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Facebook</a>
            <a href="https://www.instagram.com/tecmaker.3d/" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Instagram</a>
          </div>
        </div>
        <div>
          <p className={styles.navTitle}>Navegación</p>
          <div className={styles.navLinks}>
            <Link to="/" className={styles.navLink}>Inicio</Link>
            <Link to="/filamentos" className={styles.navLink}>Filamentos</Link>
            <Link to="/accesorios" className={styles.navLink}>Accesorios</Link>
            <Link to="/tienda" className={styles.navLink}>Tienda</Link>
            <Link to="/stl" className={styles.navLink}>STL</Link>
            <Link to="/contacto" className={styles.navLink}>Contacto</Link>
          </div>
        </div>
        <div>
          <p className={styles.navTitle}>Recursos STL</p>
          <div className={styles.navLinks}>
            <a href="https://www.thingiverse.com/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>Thingiverse</a>
            <a href="https://www.printables.com/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>Printables</a>
            <a href="https://cults3d.com/es/usuarios/Tecmaker3D" target="_blank" rel="noopener noreferrer" className={styles.navLink}>Cults3D</a>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© 2026 TecMaker 3D. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
)

export default Footer
