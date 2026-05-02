import { Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import styles from './Home.module.css'

// ========================
// Home — Página de inicio 
// ========================

const Home = () => {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>IMPRESIÓN 3D DE ALTA CALIDAD</div>
          <Typography component="h1" className={styles.heroTitle}>
            Materializando{' '}
            <span className={styles.heroTitleAccent}>Ideas</span>
          </Typography>
          <img src="/logo.png" alt="TecMaker 3D" className={styles.heroLogo} />
          <Typography className={styles.heroSubtitle}>
            Filamentos premium, accesorios y productos impresos en 3D.
            Diseños STL exclusivos disponibles. Calidad garantizada.
          </Typography>
          <div className={styles.heroCtas}>
            <Link to="/filamentos" className={styles.ctaPrimary}>
              Ver Filamentos
            </Link>
            <Link to="/tienda" className={styles.ctaSecondary}>
              Ver Tienda →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>24+</span>
            <span className={styles.statLabel}>Filamentos</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>5</span>
            <span className={styles.statLabel}>Marcas Líderes</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>3</span>
            <span className={styles.statLabel}>Tipos de Material</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100%</span>
            <span className={styles.statLabel}>Calidad Garantizada</span>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className={styles.categoriesSection}>
        <div className={styles.categoriesHeader}>
          <Typography className={styles.sectionLabel}>NUESTROS PRODUCTOS</Typography>
          <Typography component="h2" className={styles.sectionTitle}>
            ¿Qué estás buscando?
          </Typography>
        </div>
        <div className={styles.categoriesGrid}>
          <Link to="/filamentos" className={styles.categoryCard}>
            <span className={styles.categoryIcon}>🧵</span>
            <span className={styles.categoryName}>Filamentos</span>
            <span className={styles.categoryDesc}>PLA, PETG, Silk y más. 24 opciones de marcas premium.</span>
          </Link>
          <Link to="/accesorios" className={styles.categoryCard}>
            <span className={styles.categoryIcon}>⚙️</span>
            <span className={styles.categoryName}>Accesorios</span>
            <span className={styles.categoryDesc}>Nozzles, extrusores, tubos Teflon y más repuestos.</span>
          </Link>
          <Link to="/tienda" className={styles.categoryCard}>
            <span className={styles.categoryIcon}>🛍️</span>
            <span className={styles.categoryName}>Tienda</span>
            <span className={styles.categoryDesc}>Figuras y productos impresos en 3D listos para llevar.</span>
          </Link>
          <Link to="/stl" className={styles.categoryCard}>
            <span className={styles.categoryIcon}>📐</span>
            <span className={styles.categoryName}>Archivos STL</span>
            <span className={styles.categoryDesc}>Modelos digitales para imprimir en tu propia impresora.</span>
          </Link>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutImage}>
            <img src="/ender.jpg" alt="Impresora 3D Ender TecMaker" loading="lazy" />
          </div>
          <div>
            <Typography className={styles.sectionLabel}>SOBRE NOSOTROS</Typography>
            <Typography component="h2" className={styles.sectionTitle}>
              Nuestra Experiencia en Impresión 3D
            </Typography>
            <Typography className={styles.aboutText}>
              En Tecmaker 3D nos apasiona la tecnología de impresión 3D y sus infinitas posibilidades.
              Desde nuestros inicios hemos trabajado con dedicación para brindar productos de calidad superior,
              utilizando materiales premium y diseños exclusivos.
            </Typography>
            <Typography className={styles.aboutText}>
              Ya sea que necesites prototipos, repuestos personalizados o figuras únicas,
              estamos aquí para materializarlas con la mejor calidad y atención al detalle.
            </Typography>
            <div className={styles.links}>
              <a href="https://www.thingiverse.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>
                <span className={styles.linkDot} />
                Thingiverse.com
              </a>
              <a href="https://www.printables.com/" target="_blank" rel="noopener noreferrer" className={styles.link}>
                <span className={styles.linkDot} />
                Printables.com
              </a>
              <a href="https://cults3d.com/es/usuarios/Tecmaker3D" target="_blank" rel="noopener noreferrer" className={styles.link}>
                <span className={styles.linkDot} />
                Cults3D.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
