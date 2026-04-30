import { useState } from 'react'
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import CheckIcon from '@mui/icons-material/Check'
import useCartStore from '../../stores/useCartStore'
import useStockStore from '../../stores/useStockStore'
import styles from './AccesorioCard.module.css'

const AccesorioCard = ({ accesorio }) => {
  const [added, setAdded] = useState(false)

  const addItem       = useCartStore((state) => state.addItem)
  const stock         = useStockStore((state) => state.stock[accesorio.id] ?? 0)
  const decreaseStock = useStockStore((state) => state.decreaseStock)

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

  const handleAddToCart = () => {
    if (stock === 0) return
    addItem({ ...accesorio, marca: accesorio.categoria })
    decreaseStock(accesorio.id, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Card className={styles.card} elevation={0}>
      <div className={styles.imageWrapper}>
        <img
          src={accesorio.imagen}
          alt={accesorio.nombre}
          className={styles.image}
          loading="lazy"
          onError={(e) => { e.target.style.opacity = '0.3' }}
        />
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
        <Button
          variant="contained"
          size="small"
          startIcon={added ? <CheckIcon /> : <AddShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={stock === 0}
          className={`${styles.addBtn} ${stock === 0 ? styles.addBtnDisabled : ''}`}
          id={`btn-agregar-${accesorio.id}`}
        >
          {added ? '¡Agregado!' : stock === 0 ? 'Sin stock' : 'Agregar'}
        </Button>
      </CardActions>
    </Card>
  )
}

export default AccesorioCard
