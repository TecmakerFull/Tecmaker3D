import { useState } from 'react'
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import CheckIcon from '@mui/icons-material/Check'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import useCartStore from '../../stores/useCartStore'
import useStockStore from '../../stores/useStockStore'
import ProductoModal from '../ProductoModal/ProductoModal'
import styles from './AccesorioCard.module.css'

const AccesorioCard = ({ accesorio }) => {
  const [added,    setAdded]    = useState(false)
  const [qty,      setQty]      = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const addItem          = useCartStore((state) => state.addItem)
  const setItemQuantity  = useCartStore((state) => state.setItemQuantity)
  const cartItems        = useCartStore((state) => state.items)
  const stock            = useStockStore((state) => state.stock[accesorio.id] ?? 0)

  const enCarrito       = cartItems.find(i => i.id === accesorio.id)?.cantidad || 0
  const stockDisponible = Math.max(0, stock - enCarrito)   // cuánto queda por agregar
  const sinStock        = stock === 0
  const limiteAlcanzado = enCarrito >= stock

  // Mantener qty dentro del rango válido cuando cambia el stock
  const qtyValida = Math.min(qty, stockDisponible) || 1

  const getStockStatus = () => {
    if (stock === 0) return 'out'
    if (stock <= 3)  return 'low'
    return 'in'
  }

  const stockStatus  = getStockStatus()
  const stockLabels  = { in: `Stock: ${stock}`, low: `¡Últimas ${stock}!`, out: 'Sin stock' }
  const stockClasses = { in: styles.inStock, low: styles.lowStock, out: styles.outStock }

  const formatPrecio = (precio) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(precio)

  // ── Manejo del selector de cantidad ──────────────
  const handleQtyChange = (e) => {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val) || val < 1) { setQty(1); return }
    setQty(Math.min(val, stockDisponible))
  }

  const handleQtyStep = (delta) => {
    setQty((prev) => Math.max(1, Math.min(prev + delta, stockDisponible)))
  }

  // ── Agregar al carrito con la cantidad seleccionada ──
  const handleAddToCart = () => {
    if (sinStock || limiteAlcanzado) return
    const cantidadFinal = Math.min(qtyValida, stockDisponible)
    if (cantidadFinal <= 0) return

    // Si ya está en el carrito, sumamos la nueva cantidad seleccionada
    const nuevaCantidad = enCarrito + cantidadFinal
    setItemQuantity(accesorio.id, nuevaCantidad, { ...accesorio, marca: accesorio.categoria })

    setAdded(true)
    setQty(1)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Card className={styles.card} elevation={0}>
      <div className={styles.imageWrapper} onClick={() => setModalOpen(true)} style={{ cursor: 'pointer' }}>
        <img
          src={accesorio.imagen}
          alt={accesorio.nombre}
          className={styles.image}
          loading="lazy"
          onError={(e) => { e.target.style.opacity = '0.3' }}
        />
        <div className={styles.zoomHint}><ZoomInIcon sx={{ fontSize: '1.4rem' }} /></div>
        <div className={styles.badgesWrapper}>
          <span className={styles.categoriaBadge}>{accesorio.categoria}</span>
          <span className={`${styles.stockBadge} ${stockClasses[stockStatus]}`}>
            {stockLabels[stockStatus]}
          </span>
        </div>
      </div>

      <CardContent className={styles.content}>
        <Typography className={styles.nombre}>{accesorio.nombre}</Typography>
        <Typography className={styles.descripcion}>{accesorio.descripcion}</Typography>
        <Typography className={styles.specs}>⚙ {accesorio.especificaciones}</Typography>
      </CardContent>

      <CardActions className={styles.footer}>
        <Typography className={styles.precio}>{formatPrecio(accesorio.precio)}</Typography>

        {/* Selector de cantidad + botón */}
        <div className={styles.addRow}>
          {!sinStock && !limiteAlcanzado && (
            <div className={styles.qtySelector}>
              <button
                className={styles.qtyStep}
                onClick={() => handleQtyStep(-1)}
                disabled={qty <= 1}
                aria-label="Disminuir cantidad"
              >−</button>
              <input
                className={styles.qtyInput}
                type="number"
                min={1}
                max={stockDisponible}
                value={qty}
                onChange={handleQtyChange}
                aria-label="Cantidad"
                id={`qty-${accesorio.id}`}
              />
              <button
                className={styles.qtyStep}
                onClick={() => handleQtyStep(1)}
                disabled={qty >= stockDisponible}
                aria-label="Aumentar cantidad"
              >+</button>
            </div>
          )}

          <Button
            variant="contained"
            size="small"
            startIcon={added ? <CheckIcon /> : <AddShoppingCartIcon />}
            onClick={handleAddToCart}
            disabled={sinStock || limiteAlcanzado}
            className={`${styles.addBtn} ${(sinStock || limiteAlcanzado) ? styles.addBtnDisabled : ''}`}
            id={`btn-agregar-${accesorio.id}`}
          >
            {added
              ? '¡Agregado!'
              : sinStock
                ? 'Sin stock'
                : limiteAlcanzado
                  ? 'Máx. en carrito'
                  : qty > 1
                    ? `Agregar ${qty}`
                    : 'Agregar'}
          </Button>
        </div>
      </CardActions>

      {modalOpen && (
        <ProductoModal
          producto={accesorio}
          tipo="accesorio"
          onClose={() => setModalOpen(false)}
        />
      )}
    </Card>
  )
}

export default AccesorioCard
