import { useState } from 'react'
import { Typography, CircularProgress } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import useStockStore from '../../stores/useStockStore'
import useSEO from '../../hooks/useSEO'
import ProductoModal from '../../components/ProductoModal/ProductoModal'
import styles from './Tienda.module.css'

const WHATSAPP = '5493415866464'

const handleConsultar = (nombre) => {
  const msg = `Hola! Quisiera consultar disponibilidad y precio de:\n\n*${nombre}*\n\nMuchas gracias!`
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank')
}

const Tienda = () => {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  useSEO({
    title:       'Productos Impresos en 3D — Figuras y Accesorios',
    description: 'Comprá productos ya impresos en 3D listos para llevar en Rosario: figuras, accesorios y piezas únicas. Enviamos a todo el país.',
    path:        '/tienda',
  })

  const productos       = useStockStore((s) => s.catalogoImpresiones)
  const cargandoCatalogo = useStockStore((s) => s.cargandoCatalogo)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.label}><ThreeDRotationIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> IMPRESIONES 3D</span>
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
                <div
                  className={styles.imgWrapper}
                  onClick={() => setProductoSeleccionado(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={p.imagen} alt={p.nombre} className={styles.img} loading="lazy" />
                  <div className={styles.zoomHint}><ZoomInIcon sx={{ fontSize: '1.4rem' }} /></div>
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

      {productoSeleccionado && (
        <ProductoModal
          producto={productoSeleccionado}
          tipo="impresion"
          onClose={() => setProductoSeleccionado(null)}
        />
      )}
    </div>
  )
}

export default Tienda
