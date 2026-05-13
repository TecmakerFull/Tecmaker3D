import { Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import SupportIcon from '@mui/icons-material/Support'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation'
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined'
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined'
import useSEO from '../../hooks/useSEO'
import styles from './Home.module.css'

// ========================
// Home — Página de inicio 
// ========================

const Home = () => {
  // ── SEO ─────────────────────────────────────────────────────────────────────
  // JSON-LD tipo LocalBusiness: le dice a Google que somos un negocio local
  // con dirección física en Rosario. Puede aparecer en Google Maps y búsquedas locales.
  useSEO({
    title:       'Filamentos, Accesorios e Impresión 3D en Rosario',
    description: 'TecMaker 3D — Venta de filamentos PLA, PETG y Silk, accesorios, productos impresos en 3D y modelos STL en Rosario, Santa Fe. Calculadora de costos gratuita.',
    path:        '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type':    'LocalBusiness',           // tipo: negocio local
      name:       'TecMaker 3D',
      url:        'https://3d.tecmaker.com.ar',
      image:      'https://3d.tecmaker.com.ar/logo.png',
      description: 'Tienda de filamentos, accesorios e impresiones 3D en Rosario, Santa Fe, Argentina.',
      address: {
        '@type':           'PostalAddress',
        streetAddress:     'Lamadrid 650',
        addressLocality:   'Rosario',
        addressRegion:     'Santa Fe',
        addressCountry:    'AR',
      },
      contactPoint: [
        { '@type': 'ContactPoint', telephone: '+54-9-341-586-6464', contactType: 'customer service' },
      ],
      sameAs: [   // perfiles verificados del negocio en redes
        'https://www.instagram.com/tecmaker.3d/',
        'https://www.facebook.com/profile.php?id=100087129600305',
      ],
    },
  })
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
            <Link to="/calculadora" className={styles.ctaSecondary}>
              <CalculateOutlinedIcon sx={{ fontSize: '1.5rem', verticalAlign: 'middle', mr: 0.5 }} /> Calculadora 3D →
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
          <Link
            to="/filamentos"
            className={styles.categoryCard}
            style={{ '--card-color': '139, 92, 246', '--card-hover-border': 'rgba(139,92,246,0.5)' }}
          >
            <span className={styles.categoryIcon}><SupportIcon sx={{ fontSize: '3.2rem', color: 'rgba(139,92,246,0.9)' }} /></span>
            <span className={styles.categoryName}>Filamentos</span>
            <span className={styles.categoryDesc}>PLA, PETG, Silk y más. 24 opciones de marcas premium.</span>
          </Link>
          <Link
            to="/accesorios"
            className={styles.categoryCard}
            style={{ '--card-color': '245, 158, 11', '--card-hover-border': 'rgba(245,158,11,0.5)' }}
          >
            <span className={styles.categoryIcon}><ConstructionOutlinedIcon sx={{ fontSize: '3.2rem', color: 'rgba(245,158,11,0.9)' }} /></span>
            <span className={styles.categoryName}>Accesorios</span>
            <span className={styles.categoryDesc}>Nozzles, extrusores, tubos Teflon y más repuestos.</span>
          </Link>
          <Link
            to="/tienda"
            className={styles.categoryCard}
            style={{ '--card-color': '20, 184, 166', '--card-hover-border': 'rgba(20,184,166,0.5)' }}
          >
            <span className={styles.categoryIcon}><ThreeDRotationIcon sx={{ fontSize: '3.2rem', color: 'rgba(20,184,166,0.9)' }} /></span>
            <span className={styles.categoryName}>Impresiones 3D</span>
            <span className={styles.categoryDesc}>Figuras y productos impresos en 3D listos para llevar.</span>
          </Link>
          <Link
            to="/stl"
            className={styles.categoryCard}
            style={{ '--card-color': '59, 130, 246', '--card-hover-border': 'rgba(59,130,246,0.5)' }}
          >
            <span className={styles.categoryIcon}><ViewInArOutlinedIcon sx={{ fontSize: '3.2rem', color: 'rgba(59,130,246,0.9)' }} /></span>
            <span className={styles.categoryName}>Archivos STL</span>
            <span className={styles.categoryDesc}>Modelos digitales para imprimir en tu propia impresora.</span>
          </Link>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutImage}>
            <img src="/bambu_a1.jpg" alt="Impresora 3D Bambu Lab A1 TecMaker" loading="lazy" />
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

      {/* Diseño 3D Personalizado */}
      <section className={styles.disenioSection}>
        <div className={styles.disenioInner}>

          <div className={styles.disenioHeader}>
            <Typography className={styles.sectionLabel}>DISEÑO PERSONALIZADO</Typography>
            <Typography component="h2" className={styles.sectionTitle}>
              De la idea al objeto real
            </Typography>
            <Typography className={styles.disenioSubtitle}>
              ¿Tenés un plano, una pieza rota o una idea en mente? Podemos modelarlo y convertirlo en realidad.
            </Typography>
          </div>

          <div className={styles.disenioGrid}>
            <div className={styles.disenioCard}>
              <div className={styles.disenioCardIcon}>
                <SquareFootOutlinedIcon sx={{ fontSize: '2.2rem', color: '#818cf8' }} />
              </div>
              <h3 className={styles.disenioCardTitle}>Diseño desde planos</h3>
              <p className={styles.disenioCardText}>
                Trabajamos con planos técnicos en cualquier formato. Modelamos la pieza con precisión dimensional para que quede exactamente como fue concebida.
              </p>
            </div>
            <div className={styles.disenioCard}>
              <div className={styles.disenioCardIcon}>
                <BiotechOutlinedIcon sx={{ fontSize: '2.2rem', color: '#818cf8' }} />
              </div>
              <h3 className={styles.disenioCardTitle}>Ingeniería inversa</h3>
              <p className={styles.disenioCardText}>
                Recreamos piezas a partir de muestras físicas. Ideal para repuestos descontinuados, componentes rotos o partes que ya no se consiguen en el mercado.
              </p>
            </div>
            <div className={styles.disenioCard}>
              <div className={styles.disenioCardIcon}>
                <DrawOutlinedIcon sx={{ fontSize: '2.2rem', color: '#818cf8' }} />
              </div>
              <h3 className={styles.disenioCardTitle}>Diseño a medida</h3>
              <p className={styles.disenioCardText}>
                Convertimos tus ideas en modelos 3D. Describinos lo que necesitás y desarrollamos el diseño desde cero adaptado a tus requerimientos.
              </p>
            </div>
          </div>

          <div className={styles.disenioSoftware}>
            <p className={styles.disenioSoftwareLabel}>Herramientas profesionales que utilizamos</p>
            <div className={styles.disenioSoftwareLogos}>
              <div className={styles.softwareBadge}>
                <img src="/icono_fusion360.png" alt="Autodesk Fusion 360" className={styles.softwareLogo} />
                <div className={styles.softwareInfo}>
                  <span className={styles.softwareName}>Fusion 360</span>
                  <span className={styles.softwareBy}>Autodesk</span>
                </div>
              </div>
              <div className={styles.softwareDivider} />
              <div className={styles.softwareBadge}>
                <img src="/icono_solidworks.png" alt="SolidWorks" className={styles.softwareLogo} />
                <div className={styles.softwareInfo}>
                  <span className={styles.softwareName}>SolidWorks</span>
                  <span className={styles.softwareBy}>Dassault Systèmes</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}

export default Home
