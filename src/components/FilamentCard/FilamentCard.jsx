import { useState, useEffect } from 'react'
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import CheckIcon from '@mui/icons-material/Check'
import useCartStore from '../../stores/useCartStore'
import useStockStore from '../../stores/useStockStore'
import useReservasStore from '../../stores/useReservasStore'
import styles from './FilamentCard.module.css'

const FilamentCard = ({ filamento }) => {
  const [added,    setAdded]    = useState(false)
  const [countdown, setCountdown] = useState('')
  const [qty,      setQty]      = useState(1)

  const addItem         = useCartStore((state) => state.addItem)
  const setItemQuantity = useCartStore((state) => state.setItemQuantity)
  const cartItems       = useCartStore((state) => state.items)
  const stock           = useStockStore((state) => state.stock[filamento.id] ?? 0)
  const reservasGlobal  = useReservasStore((s) => s.reservasGlobal)

  const reserva       = reservasGlobal[filamento.id]
  const estaReservado = !!reserva && new Date(reserva.expires_at) > new Date()

  // Countdown timer para productos reservados
  useEffect(() => {
    if (!estaReservado) { setCountdown(''); return }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(reserva.expires_at) - new Date()) / 1000))
      const m = String(Math.floor(diff / 60)).padStart(2, '0')
      const s = String(diff % 60).padStart(2, '0')
      setCountdown(`${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [estaReservado, reserva])

  // Cuántas unidades ya tiene el usuario en el carrito
  const enCarrito = cartItems.find(i => i.id === filamento.id)?.cantidad || 0

  const stockBase       = estaReservado
    ? Math.max(0, stock - (reserva?.cantidad || 1))
    : stock
  const stockDisponible = Math.max(0, stockBase - enCarrito)  // cuánto queda por agregar

  const sinStock        = stockBase === 0
  const limiteAlcanzado = enCarrito >= stockBase

  const getStockStatus = () => {
    if (estaReservado && stockBase === 0) return 'reservado'
    if (stockBase === 0) return 'out'
    if (stockBase <= 3)  return 'low'
    return 'in'
  }

  const stockStatus = getStockStatus()
  const stockLabels = {
    in:       `Stock: ${stockBase}`,
    low:      `¡Últimas ${stockBase}!`,
    out:      'Sin stock',
    reservado: `🔒 Reservado · ${countdown}`,
  }
  const stockClasses = {
    in:       styles.inStock,
    low:      styles.lowStock,
    out:      styles.outStock,
    reservado: styles.reservedStock,
  }

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
    if (sinStock || estaReservado || limiteAlcanzado) return
    const cantidadFinal = Math.min(qty, stockDisponible)
    if (cantidadFinal <= 0) return

    const nuevaCantidad = enCarrito + cantidadFinal
    setItemQuantity(filamento.id, nuevaCantidad, { ...filamento })

    setAdded(true)
    setQty(1)
    setTimeout(() => setAdded(false), 1500)
  }

  const puedeAgregar = !sinStock && !estaReservado && !limiteAlcanzado

  return (
    <Card className={styles.card} elevation={0}>
      {/* Imagen */}
      <div className={styles.imageWrapper}>
        <img
          src={filamento.imagen}
          alt={`${filamento.marca} ${filamento.nombre}`}
          className={styles.image}
          loading="lazy"
          onError={(e) => { e.target.style.opacity = '0.3' }}
        />
        <div className={styles.badgesWrapper}>
          <span className={styles.tipoBadge}>{filamento.material}</span>
          <span className={`${styles.stockBadge} ${stockClasses[stockStatus]}`}>
            {stockLabels[stockStatus]}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <CardContent className={styles.content}>
        <Typography className={styles.marca}>{filamento.marca}</Typography>
        <Typography className={styles.nombre}>{filamento.nombre}</Typography>
        <Typography className={styles.descripcion}>{filamento.descripcion}</Typography>

        <div className={styles.specs}>
          <span className={styles.specItem}>🌡 {filamento.tempImpresion}</span>
          <span className={styles.specItem}>⚖ {filamento.peso}</span>
          <span className={styles.specItem}>📐 {filamento.diametro}</span>
        </div>
      </CardContent>

      {/* Footer con precio y botón */}
      <CardActions className={styles.footer}>
        <Typography className={styles.precio}>
          {formatPrecio(filamento.precio)}
        </Typography>

        {/* Selector de cantidad + botón */}
        <div className={styles.addRow}>
          {puedeAgregar && (
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
                id={`qty-${filamento.id}`}
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
            disabled={!puedeAgregar}
            className={`${styles.addBtn} ${!puedeAgregar ? styles.addBtnDisabled : ''} ${added ? styles.addedAnim : ''}`}
            id={`btn-agregar-${filamento.id}`}
          >
            {added
              ? '¡Agregado!'
              : estaReservado
                ? '🔒 Reservado'
                : (sinStock || limiteAlcanzado)
                  ? 'Máx. en carrito'
                  : qty > 1
                    ? `Agregar ${qty}`
                    : 'Agregar'}
          </Button>
        </div>
      </CardActions>
    </Card>
  )
}

export default FilamentCard
