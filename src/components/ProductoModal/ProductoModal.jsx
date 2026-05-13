import { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { Button, Typography } from '@mui/material'
import AddShoppingCartIcon   from '@mui/icons-material/AddShoppingCart'
import CheckIcon             from '@mui/icons-material/Check'
import WhatsAppIcon          from '@mui/icons-material/WhatsApp'
import CloseIcon             from '@mui/icons-material/Close'
import useCartStore          from '../../stores/useCartStore'
import useStockStore         from '../../stores/useStockStore'
import useReservasStore      from '../../stores/useReservasStore'
import styles from './ProductoModal.module.css'

const WHATSAPP = '5493415866464'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

// ── Sección de acciones para Filamentos / Accesorios ──────────────────────────
const AccionesCarrito = ({ producto, esFilamento }) => {
  const [added, setAdded] = useState(false)
  const [qty,   setQty]   = useState(1)
  const [countdown, setCountdown] = useState('')

  const setItemQuantity = useCartStore((s) => s.setItemQuantity)
  const cartItems       = useCartStore((s) => s.items)
  const stock           = useStockStore((s) => s.stock[producto.id] ?? 0)
  const reservasGlobal  = useReservasStore((s) => s.reservasGlobal)

  const reserva       = esFilamento ? reservasGlobal[producto.id] : null
  const estaReservado = !!reserva && new Date(reserva.expires_at) > new Date()

  useEffect(() => {
    if (!estaReservado) { setCountdown(''); return }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(reserva.expires_at) - new Date()) / 1000))
      setCountdown(`${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [estaReservado, reserva])

  const enCarrito       = cartItems.find(i => i.id === producto.id)?.cantidad || 0
  const stockBase       = estaReservado ? Math.max(0, stock - (reserva?.cantidad || 1)) : stock
  const stockDisponible = Math.max(0, stockBase - enCarrito)
  const sinStock        = stockBase === 0
  const limiteAlcanzado = enCarrito >= stockBase
  const puedeAgregar    = !sinStock && !estaReservado && !limiteAlcanzado

  const stockStatus = estaReservado && stockBase === 0 ? 'reservado' : stockBase === 0 ? 'out' : stockBase <= 3 ? 'low' : 'in'
  const stockLabels = { in: `Stock: ${stockBase}`, low: `¡Últimas ${stockBase}!`, out: 'Sin stock', reservado: `🔒 Reservado · ${countdown}` }

  const handleQtyStep   = (d) => setQty(p => Math.max(1, Math.min(p + d, stockDisponible)))
  const handleQtyChange = (e) => {
    const v = parseInt(e.target.value, 10)
    if (isNaN(v) || v < 1) { setQty(1); return }
    setQty(Math.min(v, stockDisponible))
  }

  const handleAdd = () => {
    if (!puedeAgregar) return
    const cant = Math.min(qty, stockDisponible)
    if (cant <= 0) return
    setItemQuantity(producto.id, enCarrito + cant, { ...producto, marca: producto.marca || producto.categoria })
    setAdded(true)
    setQty(1)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className={styles.accionesCarrito}>
      <div className={styles.stockRow}>
        <span className={`${styles.stockBadge} ${styles[stockStatus]}`}>{stockLabels[stockStatus]}</span>
      </div>
      <div className={styles.addRow}>
        {puedeAgregar && (
          <div className={styles.qtySelector}>
            <button className={styles.qtyStep} onClick={() => handleQtyStep(-1)} disabled={qty <= 1}>−</button>
            <input
              className={styles.qtyInput}
              type="number" min={1} max={stockDisponible}
              value={qty} onChange={handleQtyChange}
              id={`modal-qty-${producto.id}`}
            />
            <button className={styles.qtyStep} onClick={() => handleQtyStep(1)} disabled={qty >= stockDisponible}>+</button>
          </div>
        )}
        <Button
          variant="contained"
          startIcon={added ? <CheckIcon /> : <AddShoppingCartIcon />}
          onClick={handleAdd}
          disabled={!puedeAgregar}
          className={`${styles.addBtn} ${!puedeAgregar ? styles.addBtnDisabled : ''} ${added ? styles.addedAnim : ''}`}
          id={`modal-btn-agregar-${producto.id}`}
        >
          {added ? '¡Agregado!' : estaReservado ? '🔒 Reservado' : (sinStock || limiteAlcanzado) ? 'Sin stock' : qty > 1 ? `Agregar ${qty}` : 'Agregar'}
        </Button>
      </div>
    </div>
  )
}

// ── Sección de acciones para Impresiones 3D ───────────────────────────────────
const AccionesWhatsApp = ({ nombre }) => {
  const handleConsultar = () => {
    const msg = `Hola! Quisiera consultar disponibilidad y precio de:\n\n*${nombre}*\n\nMuchas gracias!`
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank')
  }
  return (
    <button className={styles.btnWa} onClick={handleConsultar} id={`modal-btn-consultar-${nombre}`}>
      <WhatsAppIcon sx={{ fontSize: '1.1rem' }} />
      Consultar por WhatsApp
    </button>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────
const ProductoModal = ({ producto, tipo, onClose }) => {

  const handleKey = useCallback((e) => { if (e.key === 'Escape') onClose() }, [onClose])
  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  if (!producto) return null

  const esFilamento  = tipo === 'filamento'
  const esAccesorio  = tipo === 'accesorio'
  const esImpresion  = tipo === 'impresion'
  const tieneCarrito = esFilamento || esAccesorio

  const modal = (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Botón cerrar */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </button>

        {/* Imagen */}
        <div className={styles.imgSection}>
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className={styles.imgGrande}
            onError={(e) => { e.target.style.opacity = '0.3' }}
          />
          {/* Badges sobre la imagen */}
          <div className={styles.imgBadges}>
            {producto.material  && <span className={styles.badgeMaterial}>{producto.material}</span>}
            {producto.categoria && <span className={styles.badgeCategoria}>{producto.categoria}</span>}
            {esImpresion        && <span className={styles.badgeImpresion}>Impresión 3D</span>}
          </div>
        </div>

        {/* Info */}
        <div className={styles.infoSection}>
          {(producto.marca && !esAccesorio) && (
            <p className={styles.marca}>{producto.marca}</p>
          )}
          <h2 className={styles.nombre}>{producto.nombre}</h2>

          {producto.descripcion && (
            <p className={styles.descripcion}>{producto.descripcion}</p>
          )}

          {/* Specs — filamentos */}
          {esFilamento && (producto.tempImpresion || producto.peso || producto.diametro) && (
            <div className={styles.specs}>
              {producto.tempImpresion && <span className={styles.spec}>🌡 Impresión: {producto.tempImpresion}</span>}
              {producto.tempCama      && <span className={styles.spec}>🛏 Cama: {producto.tempCama}</span>}
              {producto.peso         && <span className={styles.spec}>⚖ Peso: {producto.peso}</span>}
              {producto.diametro     && <span className={styles.spec}>📐 Diámetro: {producto.diametro}</span>}
            </div>
          )}

          {/* Specs — accesorios */}
          {esAccesorio && producto.especificaciones && (
            <div className={styles.specs}>
              <span className={styles.spec}>⚙ {producto.especificaciones}</span>
            </div>
          )}

          {/* Precio */}
          {producto.precio > 0 && (
            <p className={styles.precio}>{fmt(producto.precio)}</p>
          )}

          {/* Acciones */}
          {tieneCarrito && <AccionesCarrito producto={producto} esFilamento={esFilamento} />}
          {esImpresion  && <AccionesWhatsApp nombre={producto.nombre} />}
        </div>

      </div>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

export default ProductoModal
