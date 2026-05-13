import { useMemo, useState } from 'react'
import { Typography, CircularProgress } from '@mui/material'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import FilamentCard from '../../components/FilamentCard/FilamentCard'
import useStockStore from '../../stores/useStockStore'
import SupportIcon          from '@mui/icons-material/Support'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import SearchIcon           from '@mui/icons-material/Search'
import TuneOutlinedIcon     from '@mui/icons-material/TuneOutlined'
import CloseIcon            from '@mui/icons-material/Close'
import useSEO from '../../hooks/useSEO'
import styles from './Filamentos.module.css'

const Filamentos = () => {
  useSEO({
    title:       'Filamentos 3D — PLA, PETG, Silk y más',
    description: 'Comprá filamentos para impresión 3D en Rosario: PLA, PETG, Silk, colores metálicos y arco iris. Marcas Elegoo, Filar, GST, Hellbot y Printalot con stock disponible.',
    path:        '/filamentos',
  })

  const catalogoFilamentos = useStockStore((s) => s.catalogoFilamentos)
  const cargandoCatalogo   = useStockStore((s) => s.cargandoCatalogo)

  const [marcaActiva,  setMarcaActiva]  = useState('Todas')
  const [tipoActivo,   setTipoActivo]   = useState('Todos')
  const [colorActivo,  setColorActivo]  = useState('Todos')
  const [busqueda,     setBusqueda]     = useState('')
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const location   = useLocation()
  const isSubRoute = location.pathname !== '/filamentos'

  const marcas     = useMemo(() => [...new Set(catalogoFilamentos.map(f => f.marca))],    [catalogoFilamentos])
  const materiales = useMemo(() => [...new Set(catalogoFilamentos.map(f => f.material))], [catalogoFilamentos])
  const colores    = useMemo(() =>
    [...new Set(catalogoFilamentos.map(f => f.color).filter(Boolean))].sort(),
    [catalogoFilamentos]
  )

  const filamentosFiltrados = useMemo(() =>
    catalogoFilamentos.filter((f) => {
      const matchMarca    = marcaActiva  === 'Todas' || f.marca    === marcaActiva
      const matchMaterial = tipoActivo   === 'Todos' || f.material === tipoActivo
      const matchColor    = colorActivo  === 'Todos' || (f.color || '').toLowerCase() === colorActivo.toLowerCase()
      const q = busqueda.toLowerCase()
      const matchBusqueda = !q ||
        f.nombre.toLowerCase().includes(q) ||
        f.marca.toLowerCase().includes(q)  ||
        (f.color || '').toLowerCase().includes(q)
      return matchMarca && matchMaterial && matchColor && matchBusqueda
    }),
    [catalogoFilamentos, marcaActiva, tipoActivo, colorActivo, busqueda]
  )

  const hayFiltrosActivos = marcaActiva !== 'Todas' || tipoActivo !== 'Todos' || colorActivo !== 'Todos' || !!busqueda

  const limpiarFiltros = () => {
    setMarcaActiva('Todas')
    setTipoActivo('Todos')
    setColorActivo('Todos')
    setBusqueda('')
  }

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.pageLabel}>
            <SupportIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> CATÁLOGO
          </span>
          <Typography component="h1" className={styles.pageTitle}>Filamentos Premium</Typography>
          <Typography className={styles.pageSubtitle}>
            {cargandoCatalogo
              ? 'Cargando...'
              : `${catalogoFilamentos.length} productos · Marcas Elegoo, Filar, GST, Hellbot, Printalot`}
          </Typography>
        </div>
      </div>

      {/* ── Sub-nav ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f0f0f' }}>
        <div className={styles.subNav}>
          <NavLink
            to="/filamentos" end
            className={({ isActive }) => `${styles.subNavLink} ${isActive ? styles.subNavLinkActive : ''}`}
          >
            <ViewListOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Catálogo
          </NavLink>
          <NavLink
            to="/filamentos/configuraciones"
            className={({ isActive }) => `${styles.subNavLink} ${isActive ? styles.subNavLinkActive : ''}`}
          >
            🔬 Especificaciones Técnicas (API)
          </NavLink>
        </div>
      </div>

      {isSubRoute ? <Outlet /> : (
        <div className={styles.shopLayout}>

          {/* Overlay mobile */}
          {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

          {/* ════ SIDEBAR ════ */}
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>

            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>Filtrar por</span>
              {hayFiltrosActivos && (
                <button className={styles.clearBtn} onClick={limpiarFiltros}>Limpiar</button>
              )}
              <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)} aria-label="Cerrar filtros">
                <CloseIcon fontSize="small" />
              </button>
            </div>

            {/* Buscador */}
            <div className={styles.sidebarSearch}>
              <SearchIcon className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar filamento..."
                className={styles.searchInput}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                id="input-buscar-filamento"
              />
            </div>

            {/* Filtro: Marca */}
            <div className={styles.filterSection}>
              <p className={styles.filterTitle}>Marca</p>
              <div className={styles.filterPills}>
                <button
                  className={`${styles.pill} ${marcaActiva === 'Todas' ? styles.pillActive : ''}`}
                  onClick={() => setMarcaActiva('Todas')}
                  id="filtro-todas-marcas"
                >Todas</button>
                {marcas.map((marca) => (
                  <button
                    key={marca}
                    className={`${styles.pill} ${marcaActiva === marca ? styles.pillActive : ''}`}
                    onClick={() => setMarcaActiva(marca)}
                    id={`filtro-marca-${marca.toLowerCase()}`}
                  >{marca}</button>
                ))}
              </div>
            </div>

            {/* Filtro: Material */}
            <div className={styles.filterSection}>
              <p className={styles.filterTitle}>Material</p>
              <div className={styles.filterPills}>
                <button
                  className={`${styles.pill} ${tipoActivo === 'Todos' ? styles.pillActive : ''}`}
                  onClick={() => setTipoActivo('Todos')}
                  id="filtro-todos-tipos"
                >Todos</button>
                {materiales.map((mat) => (
                  <button
                    key={mat}
                    className={`${styles.pill} ${tipoActivo === mat ? styles.pillActive : ''}`}
                    onClick={() => setTipoActivo(mat)}
                    id={`filtro-tipo-${mat.toLowerCase().replace(/\s/g, '-')}`}
                  >{mat}</button>
                ))}
              </div>
            </div>

            {/* Filtro: Color */}
            <div className={styles.filterSection}>
              <p className={styles.filterTitle}>Color</p>
              <div className={styles.filterPills}>
                <button
                  className={`${styles.pill} ${colorActivo === 'Todos' ? styles.pillActive : ''}`}
                  onClick={() => setColorActivo('Todos')}
                  id="filtro-todos-colores"
                >Todos</button>
                {colores.map((color) => (
                  <button
                    key={color}
                    className={`${styles.pill} ${colorActivo === color ? styles.pillActive : ''}`}
                    onClick={() => setColorActivo(color)}
                    id={`filtro-color-${color.toLowerCase().replace(/\s/g, '-')}`}
                  >{color}</button>
                ))}
              </div>
            </div>

          </aside>

          {/* ════ ÁREA DE PRODUCTOS ════ */}
          <main className={styles.productsArea}>

            {/* Barra de resultados */}
            <div className={styles.resultsBar}>
              <p className={styles.resultsInfo}>
                {cargandoCatalogo
                  ? 'Cargando...'
                  : `${filamentosFiltrados.length} de ${catalogoFilamentos.length} filamentos`}
              </p>
              <button
                className={styles.filterToggle}
                onClick={() => setSidebarOpen(true)}
                id="btn-abrir-filtros"
              >
                <TuneOutlinedIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
                Filtros
                {hayFiltrosActivos && <span className={styles.filterBadge} />}
              </button>
            </div>

            {cargandoCatalogo ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <CircularProgress sx={{ color: '#6366f1' }} />
              </div>
            ) : filamentosFiltrados.length === 0 ? (
              <div className={styles.emptyResult}>
                <div className={styles.emptyResultIcon}>
                  <SearchIcon sx={{ fontSize: '3rem', color: '#475569' }} />
                </div>
                <Typography>No se encontraron filamentos con esos filtros.</Typography>
                <button className={styles.clearBtn} onClick={limpiarFiltros} style={{ marginTop: '1rem' }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {filamentosFiltrados.map((filamento) => (
                  <FilamentCard key={filamento.id} filamento={filamento} />
                ))}
              </div>
            )}

          </main>

        </div>
      )}
    </div>
  )
}

export default Filamentos
