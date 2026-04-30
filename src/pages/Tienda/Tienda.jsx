import { Typography, CircularProgress } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import useStockStore from '../../stores/useStockStore'
import styles from './Tienda.module.css'

const WHATSAPP = '5493415866464'

const handleConsultar = (nombre) => {
  const msg = `Hola! Quisiera consultar disponibilidad y precio de:\n\n*${nombre}*\n\nMuchas gracias!`
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank')
}

const Tienda = () => {
  const productos       = useStockStore((s) => s.catalogoImpresiones)
  const cargandoCatalogo = useStockStore((s) => s.cargandoCatalogo)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.label}>🛍️ TIENDA</span>
        <Typography component="h1" className={styles.title}>Productos Impresos en 3D</Typography>
        <Typography className={styles.subtitle}>Figuras, accesorios y piezas únicas listas para llevar</Typography>
      </div>

      <div className={styles.container}>
        {cargandoCatalogo ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <CircularProgress sx={{ color: '#6366f1' }} />
          </div>
        ) : (
          <div className={styles.grid}>
            {productos.map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.imgWrapper}>
                  <img src={p.imagen} alt={p.nombre} className={styles.img} loading="lazy" />
                </div>
                <div className={styles.cardBody}>
                  <Typography className={styles.nombre}>{p.nombre}</Typography>
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.btn}
                      onClick={() => handleConsultar(p.nombre)}
                      id={`btn-consultar-${p.id}`}
                    >
                      <WhatsAppIcon style={{ fontSize: '1rem' }} />
                      Consultar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tienda
