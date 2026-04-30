import { create } from 'zustand'

// ================================================
// useCartStore — Estado Global del Carrito
// Consigna TP3: Zustand para gestión del carrito
// ================================================

const useCartStore = create((set, get) => ({
  // Estado inicial
  items: [],
  isCartOpen: false,

  // ── Acciones ────────────────────────────────────

  /**
   * Agrega un producto al carrito.
   * Si ya existe, incrementa su cantidad.
   * @param {Object} product - Objeto producto (filamento o accesorio)
   */
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id)

      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          ),
        }
      }

      return {
        items: [
          ...state.items,
          {
            id: product.id,
            nombre: product.nombre,
            marca: product.marca || product.categoria,
            precio: product.precio,
            imagen: product.imagen,
            cantidad: 1,
          },
        ],
      }
    })
  },

  /**
   * Elimina un producto del carrito por su ID.
   */
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }))
  },

  /**
   * Incrementa en 1 la cantidad de un producto.
   */
  incrementItem: (productId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ),
    }))
  },

  /**
   * Decrementa en 1 la cantidad. Si llega a 0, elimina el producto.
   */
  decrementItem: (productId) => {
    set((state) => ({
      items: state.items
        .map((item) =>
          item.id === productId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0),
    }))
  },

  /**
   * Vacía el carrito completamente.
   */
  clearCart: () => set({ items: [] }),

  /**
   * Abre/cierra el drawer del carrito.
   */
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  // ── Getters/Selectores ───────────────────────────

  /**
   * Cantidad total de items en el carrito (suma de cantidades).
   */
  totalItems: () => {
    return get().items.reduce((acc, item) => acc + item.cantidad, 0)
  },

  /**
   * Precio total del carrito.
   */
  totalPrice: () => {
    return get().items.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0
    )
  },
}))

export default useCartStore
