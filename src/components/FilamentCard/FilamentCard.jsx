import { useState } from 'react'
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import CheckIcon from '@mui/icons-material/Check'
import useCartStore from '../../stores/useCartStore'
import useStockStore from '../../stores/useStockStore'
import styles from './FilamentCard.module.css'

const FilamentCard = ({ filamento }) => {
  const [added, setAdded] = useState(false)

  const addItem       = useCartStore((state) => state.addItem)
  const stock         = useStockStore((state) => state.stock[filamento.id] ?? 0)
  const decreaseStock = useStockStore((state) => state.decreaseStock)

  // Los datos (precio, descripcion, imagen, etc.) vienen directamente de Supabase
  // a través del prop 'filamento' — sin merge, sin fallback al .js

  const getStockStatus = () => {
    if (stock === 0) return 'out'
    if (stock <= 3)  return 'low'
    return 'in'
  }

  const stockStatus = getStockStatus()
  const stockLabels = {
    in:  `Stock: ${stock}`,
    low: `¡Últimas ${stock}!`,
    out: 'Sin stock',
  }
  const stockClasses = {
    in:  styles.inStock,
    low: styles.lowStock,
    out: styles.outStock,
  }

  const formatPrecio = (precio) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(precio)

  const handleAddToCart = () => {
    if (stock === 0) return
    addItem({ ...filamento })
    decreaseStock(filamento.id, 1)
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
          disabled={stock === 0}
          className={`${styles.addBtn} ${stock === 0 ? styles.addBtnDisabled : ''} ${added ? styles.addedAnim : ''}`}
          id={`btn-agregar-${filamento.id}`}
        >
          {added ? '¡Agregado!' : stock === 0 ? 'Sin stock' : 'Agregar'}
        </Button>
      </CardActions>
    </Card>
  )
}

export default FilamentCard
