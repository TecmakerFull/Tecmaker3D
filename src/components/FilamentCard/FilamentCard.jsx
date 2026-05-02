import { useState, useEffect } from 'react'
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import CheckIcon from '@mui/icons-material/Check'
import useCartStore from '../../stores/useCartStore'
import useStockStore from '../../stores/useStockStore'
import useReservasStore from '../../stores/useReservasStore'
import styles from './FilamentCard.module.css'

const FilamentCard = ({ filamento }) => {
  const [added, setAdded] = useState(false)
  const [countdown, setCountdown] = useState('')

  const addItem       = useCartStore((state) => state.addItem)
  const stock         = useStockStore((state) => state.stock[filamento.id] ?? 0)
  const reservasGlobal = useReservasStore((s) => s.reservasGlobal)

  const reserva = reservasGlobal[filamento.id]
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

  // Los datos (precio, descripcion, imagen, etc.) vienen directamente de Supabase
  // a través del prop 'filamento' — sin merge, sin fallback al .js

  const stockDisponible = estaReservado
    ? Math.max(0, stock - (reserva?.cantidad || 1))
    : stock

  const getStockStatus = () => {
    if (estaReservado && stockDisponible === 0) return 'reservado'
    if (stockDisponible === 0) return 'out'
    if (stockDisponible <= 3)  return 'low'
    return 'in'
  }

  const stockStatus = getStockStatus()
  const stockLabels = {
    in:       `Stock: ${stockDisponible}`,
    low:      `¡Últimas ${stockDisponible}!`,
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

  const handleAddToCart = () => {
    if (stockDisponible === 0 || estaReservado) return
    addItem({ ...filamento })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

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

        <Button
          variant="contained"
          size="small"
          startIcon={added ? <CheckIcon /> : <AddShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={stockDisponible === 0 || estaReservado}
          className={`${styles.addBtn} ${(stockDisponible === 0 || estaReservado) ? styles.addBtnDisabled : ''} ${added ? styles.addedAnim : ''}`}
          id={`btn-agregar-${filamento.id}`}
        >
          {added ? '¡Agregado!' : estaReservado ? '🔒 Reservado' : stockDisponible === 0 ? 'Sin stock' : 'Agregar'}
        </Button>
      </CardActions>
    </Card>
  )
}

export default FilamentCard
