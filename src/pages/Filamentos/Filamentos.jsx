import { useMemo, useState } from 'react'
import { Typography, Button, CircularProgress } from '@mui/material'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import FilamentCard from '../../components/FilamentCard/FilamentCard'
import useStockStore from '../../stores/useStockStore'
import styles from './Filamentos.module.css'

const Filamentos = () => {
  const catalogoFilamentos = useStockStore((s) => s.catalogoFilamentos)
  const cargandoCatalogo   = useStockStore((s) => s.cargandoCatalogo)

  const [marcaActiva, setMarcaActiva] = useState('Todas')
  const [tipoActivo,  setTipoActivo]  = useState('Todos')
  const [busqueda,    setBusqueda]    = useState('')
  const location = useLocation()
  const isSubRoute = location.pathname !== '/filamentos'

  // Marcas y materiales dinámicos desde Supabase
  const marcas    = useMemo(() => [...new Set(catalogoFilamentos.map(f => f.marca))],    [catalogoFilamentos])
  const materiales = useMemo(() => [...new Set(catalogoFilamentos.map(f => f.material))], [catalogoFilamentos])

  // Filtrado
  const filamentosFiltrados = useMemo(() =>
    catalogoFilamentos.filter((f) => {
      const matchMarca    = marcaActiva === 'Todas'  || f.marca     === marcaActiva
      const matchMaterial = tipoActivo  === 'Todos'  || f.material  === tipoActivo
      const q = busqueda.toLowerCase()
      const matchBusqueda = !q ||
        f.nombre.toLowerCase().includes(q) ||
        f.marca.toLowerCase().includes(q)  ||
        (f.color || '').toLowerCase().includes(q)
      return matchMarca && matchMaterial && matchBusqueda
    }),
    [catalogoFilamentos, marcaActiva, tipoActivo, busqueda]
  )

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.pageLabel}>🧵 CATÁLOGO</span>
          <Typography component="h1" className={styles.pageTitle}>
            Filamentos Premium
          </Typography>
          <Typography className={styles.pageSubtitle}>
            {cargandoCatalogo ? 'Cargando...' : `${catalogoFilamentos.length} productos · Marcas Elegoo, Filar, GST, Hellbot, Printalot`}
          </Typography>
        </div>
      </div>

      {/* Sub-navegación */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f0f0f' }}>
        <div className={styles.subNav}>
          <NavLink to="/filamentos" end className={({ isActive }) => `${styles.subNavLink} ${isActive ? styles.subNavLinkActive : ''}`}>
            📦 Catálogo
          </NavLink>
          <NavLink to="/filamentos/configuraciones" className={({ isActive }) => `${styles.subNavLink} ${isActive ? styles.subNavLinkActive : ''}`}>
            🔬 Especificaciones Técnicas (API)
          </NavLink>
        </div>
      </div>

      {isSubRoute ? <Outlet /> : (
        <>
          {/* Toolbar de filtros */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarInner}>

              {/* ── DESKTOP: pills ── */}
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Marca:</span>
                <Button className={`${styles.filterBtn} ${marcaActiva === 'Todas' ? styles.filterBtnActive : ''}`} onClick={() => setMarcaActiva('Todas')} id="filtro-todas-marcas">Todas</Button>
                {marcas.map((marca) => (
                  <Button key={marca} className={`${styles.filterBtn} ${marcaActiva === marca ? styles.filterBtnActive : ''}`} onClick={() => setMarcaActiva(marca)} id={`filtro-marca-${marca.toLowerCase()}`}>{marca}</Button>
                ))}
              </div>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Material:</span>
                <Button className={`${styles.filterBtn} ${tipoActivo === 'Todos' ? styles.filterBtnActive : ''}`} onClick={() => setTipoActivo('Todos')} id="filtro-todos-tipos">Todos</Button>
                {materiales.map((mat) => (
                  <Button key={mat} className={`${styles.filterBtn} ${tipoActivo === mat ? styles.filterBtnActive : ''}`} onClick={() => setTipoActivo(mat)} id={`filtro-tipo-${mat.toLowerCase().replace(/\s/g, '-')}`}>{mat}</Button>
                ))}
              </div>

              {/* ── MOBILE: selects desplegables ── */}
              <div className={styles.mobileFilters}>
                <select
                  className={styles.mobileSelect}
                  value={marcaActiva}
                  onChange={(e) => setMarcaActiva(e.target.value)}
                  id="select-marca-mobile"
                >
                  <option value="Todas">🏷️ Marca: Todas</option>
                  {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  className={styles.mobileSelect}
                  value={tipoActivo}
                  onChange={(e) => setTipoActivo(e.target.value)}
                  id="select-material-mobile"
                >
                  <option value="Todos">🧪 Material: Todos</option>
                  {materiales.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Búsqueda (siempre visible) */}
              <div className={styles.searchRow}>
                <input type="text" placeholder="🔍 Buscar..." className={styles.searchInput} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} id="input-buscar-filamento" />
              </div>
            </div>
          </div>

          {/* Grilla */}
          <div className={styles.container}>
            {cargandoCatalogo ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <CircularProgress sx={{ color: '#6366f1' }} />
              </div>
            ) : (
              <>
                <p className={styles.resultsInfo}>
                  Mostrando {filamentosFiltrados.length} de {catalogoFilamentos.length} filamentos
                </p>
                {filamentosFiltrados.length === 0 ? (
                  <div className={styles.emptyResult}>
                    <div className={styles.emptyResultIcon}>🔍</div>
                    <Typography>No se encontraron filamentos con esos filtros.</Typography>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {filamentosFiltrados.map((filamento) => (
                      <FilamentCard key={filamento.id} filamento={filamento} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Filamentos
