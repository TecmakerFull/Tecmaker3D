import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import CartDrawer from './components/CartDrawer/CartDrawer'
import StockManager from './components/StockManager/StockManager'
import useStockStore from './stores/useStockStore'

// Páginas
import Home from './pages/Home/Home'
import Filamentos from './pages/Filamentos/Filamentos'
import FilamentosConfig from './pages/FilamentosConfig/FilamentosConfig'
import Accesorios from './pages/Accesorios/Accesorios'
import Tienda from './pages/Tienda/Tienda'
import STL from './pages/STL/STL'
import Contacto from './pages/Contacto/Contacto'

// ====================================================
// App.jsx — Configuración de rutas con React Router
// Consigna TP3: <BrowserRouter> en main.jsx,
// <Routes> y <Route> aquí
// ====================================================

function App() {
  const cargarPreciosPublicos = useStockStore((s) => s.cargarPreciosPublicos)

  // Carga precios y stock de Supabase al iniciar la app
  useEffect(() => { cargarPreciosPublicos() }, [])

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
