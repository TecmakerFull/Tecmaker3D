import { Typography, CircularProgress } from '@mui/material'
import useStockStore from '../../stores/useStockStore'
import styles from './STL.module.css'

const stlLinks = [
  { nombre: 'Thingiverse',    url: 'https://www.thingiverse.com/',                       desc: 'La biblioteca de modelos 3D más grande del mundo. Gratis.',              icon: '🌐' },
  { nombre: 'Printables',     url: 'https://www.printables.com/',                        desc: 'Plataforma de Prusa con miles de modelos de alta calidad.',              icon: '🔧' },
  { nombre: 'Cults3D',        url: 'https://cults3d.com/es/usuarios/Tecmaker3D',         desc: 'Diseños premium y exclusivos de TecMaker 3D, gratuitos y de pago.',      icon: '⭐' },
  { nombre: 'MyMiniFactory',  url: 'https://www.myminifactory.com/',                     desc: 'Modelos garantizados para imprimir sin problemas.',                      icon: '🏆' },
]

const STL = () => {
  const catalogoSTL      = useStockStore((s) => s.catalogoSTL)
  const cargandoCatalogo = useStockStore((s) => s.cargandoCatalogo)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.label}>📐 ARCHIVOS STL</span>
        <Typography component="h1" className={styles.title}>Modelos para Imprimir</Typography>
        <Typography className={styles.subtitle}>
          Encontrá el diseño perfecto en estas plataformas y nosotros lo imprimimos para vos
        </Typography>
      </div>

      <div className={styles.container}>

        {/* ── Diseños exclusivos TecMaker 3D ── */}
        {(cargandoCatalogo || catalogoSTL.length > 0) && (
          <div className={styles.seccion}>
            <Typography className={styles.seccionTitulo}>
              ⭐ Diseños Exclusivos TecMaker 3D
            </Typography>
            <Typography className={styles.seccionSub}>
              Modelos diseñados por nosotros, disponibles en Cults3D
            </Typography>

            {cargandoCatalogo ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <CircularProgress sx={{ color: '#6366f1' }} />
              </div>
            ) : (
              <div className={styles.stlGrid}>
                {catalogoSTL.map((item) => (
                  <div key={item.id} className={styles.stlCard}>
                    <div className={styles.stlImgWrapper}>
                      <img src={item.imagen} alt={item.nombre} className={styles.stlImg} loading="lazy" />
                    </div>
                    <Typography className={styles.stlNombre}>{item.nombre}</Typography>
                    {item.link_compra ? (
                      <a
                        href={item.link_compra}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.stlBtn}
                        id={`btn-stl-${item.id}`}
                      >
                        Ver en Cults3D →
                      </a>
                    ) : (
                      <span className={styles.stlProximo}>Próximamente</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Plataformas externas ── */}
        <div className={styles.seccion}>
          <Typography className={styles.seccionTitulo}>🌐 Plataformas de Modelos STL</Typography>
          <Typography className={styles.seccionSub}>Descargá modelos y nosotros los imprimimos</Typography>
          <div className={styles.grid}>
            {stlLinks.map((link) => (
              <a key={link.nombre} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.card}>
                <span className={styles.cardIcon}>{link.icon}</span>
                <Typography className={styles.cardName}>{link.nombre}</Typography>
                <Typography className={styles.cardDesc}>{link.desc}</Typography>
                <span className={styles.cardArrow}>Visitar →</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Cómo funciona ── */}
        <div className={styles.infoBox}>
          <Typography className={styles.infoTitle}>¿Cómo funciona?</Typography>
          <div className={styles.steps}>
            {[
              'Elegí tu modelo STL en cualquiera de estas plataformas',
              'Envianos el archivo o el link del modelo',
              'Nosotros lo imprimimos con el material y color que elijas',
              '¡Recibís tu pieza lista!',
            ].map((step, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <Typography className={styles.stepText}>{step}</Typography>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default STL
