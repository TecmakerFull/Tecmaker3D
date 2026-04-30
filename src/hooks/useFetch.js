import { useState, useEffect } from 'react'
import axios from 'axios'

// ====================================================
// useFetch — Custom Hook para peticiones HTTP
// Consigna TP3: Manejo de loading, data y error
// Encapsula la lógica de llamadas a API externa
// ====================================================

/**
 * Custom Hook para realizar peticiones GET a una URL.
 *
 * @param {string} url - URL a consultar
 * @param {number} [key=0] - Cambiar este valor fuerza un nuevo fetch (para retry)
 * @returns {{ data: any, loading: boolean, error: string|null }}
 */
const useFetch = (url, key = 0) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Si no hay URL, no hacemos nada
    if (!url) {
      setLoading(false)
      return
    }

    // Reiniciamos los estados en cada llamada
    setLoading(true)
    setData(null)
    setError(null)

    // AbortController para cancelar la petición si el componente se desmonta
    const controller = new AbortController()

    axios
      .get(url, { signal: controller.signal })
      .then((response) => {
        setData(response.data)
        setLoading(false)
      })
      .catch((err) => {
        // Ignoramos el error de cancelación (cuando el componente se desmonta)
        if (axios.isCancel(err)) return

        // Manejo de error: mostramos mensaje descriptivo
        const mensaje =
          err.response?.data?.message ||
          err.message ||
          'Error al conectar con el servidor. Verificá tu conexión.'

        setError(mensaje)
        setLoading(false)
      })

    // Cleanup: cancelamos la petición si el componente se desmonta
    return () => {
      controller.abort()
    }
  }, [url, key]) // Se re-ejecuta si cambia la URL o el key de retry

  return { data, loading, error }
}

export default useFetch
