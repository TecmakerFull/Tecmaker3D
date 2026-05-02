import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import CartDrawer from './components/CartDrawer/CartDrawer'
import StockManager from './components/StockManager/StockManager'
import useStockStore from './stores/useStockStore'
import useAuthStore from './stores/useAuthStore'
import useReservasStore from './stores/useReservasStore'

// Páginas
import Home from './pages/Home/Home'
import Filamentos from './pages/Filamentos/Filamentos'
import FilamentosConfig from './pages/FilamentosConfig/FilamentosConfig'
import Accesorios from './pages/Accesorios/Accesorios'
import Tienda from './pages/Tienda/Tienda'
import STL from './pages/STL/STL'
import Contacto from './pages/Contacto/Contacto'
import Perfil from './pages/Perfil/Perfil'
import AdminReservas from './pages/AdminReservas/AdminReservas'

// ========================================
// Configuración de rutas con React Router
// ========================================

function App() {
  const cargarPreciosPublicos = useStockStore((s) => s.cargarPreciosPublicos)
  const inicializarAuth       = useAuthStore((s) => s.inicializar)
  const cargarReservasGlobal  = useReservasStore((s) => s.cargarReservasGlobal)

  useEffect(() => {
    console.log('[App] montando, llamando inicializarAuth')
    inicializarAuth()          // detecta sesión OAuth + perfil + esAdmin
    cargarPreciosPublicos()    // catálogo público
    cargarReservasGlobal()     // qué productos tienen reservas activas
  }, [])

  return (
    <>
      {/* Navbar fijo — siempre visible */}
      <Navbar />

      {/* Carrito lateral — siempre disponible */}
      <CartDrawer />

      {/* Rutas principales */}
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Ruta de filamentos con sub-ruta anidada para la API */}
        <Route path="/filamentos" element={<Filamentos />}>
          <Route path="configuraciones" element={<FilamentosConfig />} />
        </Route>

        <Route path="/accesorios" element={<Accesorios />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/stl" element={<STL />} />
        <Route path="/contacto" element={<Contacto />} />

        {/* Panel de stock administrador */}
        <Route path="/admin/stock" element={<StockManager />} />

        {/* Panel de reservas administrador */}
        <Route path="/admin/reservas" element={<AdminReservas />} />

        {/* Perfil de usuario */}
        <Route path="/perfil" element={<Perfil />} />

        {/* Ruta 404 */}
        <Route
          path="*"
          element={
            <div style={{
              paddingTop: '120px',
              minHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: '#64748b',
              fontFamily: 'Poppins, sans-serif',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '5rem' }}>🔍</span>
              <h2 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 800 }}>404 — Página no encontrada</h2>
              <p>La página que buscás no existe.</p>
              <a href="/" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>← Volver al inicio</a>
            </div>
          }
        />
      </Routes>

      {/* Footer */}
      <Footer />
    </>
  )
}

export default App
