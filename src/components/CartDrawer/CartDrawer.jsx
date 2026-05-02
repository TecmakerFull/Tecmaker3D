import { useState } from 'react'
import { Typography, Button, CircularProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import useCartStore from '../../stores/useCartStore'
import useStockStore from '../../stores/useStockStore'
import useAuthStore from '../../stores/useAuthStore'
import useReservasStore from '../../stores/useReservasStore'
import AuthModal from '../Auth/AuthModal'
import styles from './CartDrawer.module.css'

// ====================================================
// CartDrawer — Panel lateral del carrito de compras
// ====================================================

// 📱 Números de contacto TecMaker 3D
const WHATSAPP_NUMBER = '5493415866464' // Enrique

const CartDrawer = () => {
  const items        = useCartStore((state) => state.items)
  const isOpen       = useCartStore((state) => state.isCartOpen)
  const closeCart    = useCartStore((state) => state.closeCart)
  const removeItem   = useCartStore((state) => state.removeItem)
  const incrementItem = useCartStore((state) => state.incrementItem)
  const decrementItem = useCartStore((state) => state.decrementItem)
  const clearCart    = useCartStore((state) => state.clearCart)
  const increaseStock = useStockStore((state) => state.increaseStock)
  const decreaseStock = useStockStore((state) => state.decreaseStock)
  const stock        = useStockStore((state) => state.stock)
  const session      = useAuthStore((s) => s.session)
  const crearReserva = useReservasStore((s) => s.crearReserva)
  const reservasGlobal = useReservasStore((s) => s.reservasGlobal)

  const [showAuthModal,  setShowAuthModal]  = useState(false)
  const [reservando,     setReservando]     = useState(false)
  const [erroresReserva, setErroresReserva] = useState([])  // items que no se pudieron reservar

  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0)
  const totalPrice = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

  const formatPrecio = (precio) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(precio)

  // Calcular stock disponible (restando reservas activas de otros)
  const stockDisponible = (item) => {
    const reservada = reservasGlobal[item.id]?.cantidad || 0
    return Math.max(0, (stock[item.id] ?? 0) - reservada)
  }

  const handleIncrement = (item) => {
    // No superar el stock disponible (ya descontado en cart)
    incrementItem(item.id)
    decreaseStock(item.id, 1)
  }

  const handleDecrement = (item) => {
    decrementItem(item.id)
    increaseStock(item.id, 1)
  }

  const handleRemove = (item) => {
    increaseStock(item.id, item.cantidad)
    removeItem(item.id)
  }

  const handleClearCart = () => {
    items.forEach((item) => increaseStock(item.id, item.cantidad))
    clearCart()
  }

  // ── Reservar por WhatsApp ──
  const handleReservar = async () => {
    // 1. Verificar login
    if (!session) { setShowAuthModal(true); return }

    setReservando(true)
    setErroresReserva([])

    const reservados = []
    const fallidos   = []

    // 2. Intentar reservar cada item del carrito
    for (const item of items) {
      const { error } = await crearReserva(item.producto_id || item.id, item.cantidad)
      if (error) {
        fallidos.push({ ...item, motivo: error })
      } else {
        reservados.push(item)
      }
    }

    setReservando(false)

    // 3. Si nada se pudo reservar, mostrar error y no abrir WhatsApp
    if (reservados.length === 0) {
      setErroresReserva(fallidos)
      return
    }

    // 4. Avisar sobre los fallidos (si hay parciales)
    if (fallidos.length > 0) setErroresReserva(fallidos)

    // 5. Armar mensaje de WhatsApp solo con los reservados
    const lineas = reservados.map(
      (item) => `  - ${item.nombre} x${item.cantidad}: ${formatPrecio(item.precio * item.cantidad)}`
    )
    const totalReservado = reservados.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

    const mensaje =
      `*RESERVA DE PEDIDO - TecMaker 3D*\n\n` +
      `*Productos:*\n${lineas.join('\n')}\n\n` +
      `*Total: ${formatPrecio(totalReservado)}*\n\n` +
      `✅ Reserva confirmada por 30 minutos\n` +
      `--------------------------------\n` +
      `Una vez confirmada la disponibilidad, podés abonar por Mercado Pago:\n\n` +
      `*Nombre:* Enrique Cesar Temperini\n` +
      `*Alias:* tecmaker.3d\n` +
      `*CVU:* 0000003100076322336301\n\n` +
      `Enviarme el comprobante por este chat y coordinamos la entrega. Gracias!`

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mensajeContexto="Para reservar tus productos necesitás iniciar sesión."
          onClose={() => setShowAuthModal(false)}
        />
      )}
      {/* Overlay */}
      <div className={styles.overlay} onClick={closeCart} />

      {/* Drawer */}
      <div className={styles.drawer} role="dialog" aria-label="Carrito de compras">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Typography className={styles.title}>🛒 Mi Carrito</Typography>
            {totalItems > 0 && (
              <span className={styles.itemCount}>{totalItems} items</span>
            )}
          </div>
          <Button className={styles.closeBtn} onClick={closeCart} id="btn-cerrar-carrito">
            <CloseIcon fontSize="small" />
          </Button>
        </div>

        {/* Lista de items o estado vacío */}
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <Typography className={styles.emptyText}>Tu carrito está vacío</Typography>
            <Typography className={styles.emptySubtext}>
              Agregá filamentos o accesorios para comenzar
            </Typography>
          </div>
        ) : (
          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className={styles.itemImage}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div className={styles.itemInfo}>
                  <Typography className={styles.itemMarca}>{item.marca}</Typography>
                  <Typography className={styles.itemNombre}>{item.nombre}</Typography>
                  <Typography className={styles.itemPrecioUnit}>
                    {formatPrecio(item.precio)} c/u
                  </Typography>
                </div>
                <div className={styles.itemControls}>
                  <div className={styles.quantityControls}>
                    <Button
                      className={styles.qtyBtn}
                      onClick={() => handleDecrement(item)}
                      id={`btn-dec-${item.id}`}
                    >
                      −
                    </Button>
                    <span className={styles.qty}>{item.cantidad}</span>
                    <Button
                      className={styles.qtyBtn}
                      onClick={() => handleIncrement(item)}
                      id={`btn-inc-${item.id}`}
                    >
                      +
                    </Button>
                  </div>
                  <Typography className={styles.itemSubtotal}>
                    {formatPrecio(item.precio * item.cantidad)}
                  </Typography>
                  <Button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(item)}
                    id={`btn-remove-${item.id}`}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer con total */}
        {items.length > 0 && (
          <div className={styles.footer}>
            {/* Errores de reserva parcial */}
            {erroresReserva.length > 0 && (
              <div className={styles.reservaError}>
                <strong>⚠️ No se pudo reservar:</strong>
                {erroresReserva.map((item) => (
                  <span key={item.id}>· {item.nombre}: {item.motivo}</span>
                ))}
              </div>
            )}

            <div className={styles.totalRow}>
              <Typography className={styles.totalLabel}>Total:</Typography>
              <Typography className={styles.totalAmount}>
                {formatPrecio(totalPrice)}
              </Typography>
            </div>
            <Button
              className={styles.checkoutBtn}
              id="btn-reservar-pedido"
              onClick={handleReservar}
              disabled={reservando}
            >
              {reservando
                ? <><CircularProgress size={14} sx={{ color: '#000', mr: 1 }} /> Reservando...</>
                : '📱 Reservar por WhatsApp'
              }
            </Button>
            <Button className={styles.clearBtn} onClick={handleClearCart} id="btn-vaciar-carrito"
              disabled={reservando}>
              Vaciar carrito
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default CartDrawer
