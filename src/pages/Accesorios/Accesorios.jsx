import { useMemo, useState } from 'react'
import { Typography, CircularProgress } from '@mui/material'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import SearchIcon               from '@mui/icons-material/Search'
import TuneOutlinedIcon         from '@mui/icons-material/TuneOutlined'
import CloseIcon                from '@mui/icons-material/Close'
import AccesorioCard from '../../components/AccesorioCard/AccesorioCard'
import useStockStore from '../../stores/useStockStore'
import styles from './Accesorios.module.css'

const Accesorios = () => {
  const catalogoAccesorios = useStockStore((s) => s.catalogoAccesorios)
  const cargandoCatalogo   = useStockStore((s) => s.cargandoCatalogo)

  const [categoriaActiva, setCategoriaActiva] = useState('Todas')
  const [busqueda,        setBusqueda]        = useState('')
  const [sidebarOpen,     setSidebarOpen]     = useState(false)

  const categorias = useMemo(() =>
    [...new Set(catalogoAccesorios.map(a => a.categoria))],
    [catalogoAccesorios]
  )

  const accesoriosFiltrados = useMemo(() =>
    catalogoAccesorios.filter((a) => {
      const matchCat = categoriaActiva === 'Todas' || a.categoria === categoriaActiva
      const q = busqueda.toLowerCase()
      const matchBusqueda = !q ||
        a.nombre.toLowerCase().includes(q) ||
        (a.categoria || '').toLowerCase().includes(q)
      return matchCat && matchBusqueda
    }),
    [catalogoAccesorios, categoriaActiva, busqueda]
  )

  const hayFiltrosActivos = categoriaActiva !== 'Todas' || !!busqueda

  const limpiarFiltros = () => {
    setCategoriaActiva('Todas')
    setBusqueda('')
  }

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.pageLabel}>
            <ConstructionOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} /> ACCESORIOS
          </span>
          <Typography component="h1" className={styles.pageTitle}>
            Accesorios para Impresión 3D
          </Typography>
          <Typography className={styles.pageSubtitle}>
            {cargandoCatalogo ? 'Cargando...' : `${catalogoAccesorios.length} productos · Repuestos, componentes y más`}
          </Typography>
        </div>
      </div>

      {/* ════ LAYOUT ════ */}
      <div className={styles.shopLayout}>

        {/* Overlay mobile */}
        {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

        {/* ── SIDEBAR ── */}
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
              placeholder="Buscar accesorio..."
              className={styles.searchInput}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              id="input-buscar-accesorio"
            />
          </div>

          {/* Filtro: Categoría */}
          <div className={styles.filterSection}>
            <p className={styles.filterTitle}>Categoría</p>
            <div className={styles.filterPills}>
              <button
                className={`${styles.pill} ${categoriaActiva === 'Todas' ? styles.pillActive : ''}`}
                onClick={() => setCategoriaActiva('Todas')}
                id="filtro-todas-categorias"
              >Todas</button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.pill} ${categoriaActiva === cat ? styles.pillActive : ''}`}
                  onClick={() => setCategoriaActiva(cat)}
                  id={`filtro-cat-${cat.toLowerCase().replace(/\s/g, '-')}`}
                >{cat}</button>
              ))}
            </div>
          </div>

        </aside>

        {/* ── PRODUCTOS ── */}
        <main className={styles.productsArea}>

          <div className={styles.resultsBar}>
            <p className={styles.resultsInfo}>
              {cargandoCatalogo
                ? 'Cargando...'
                : `${accesoriosFiltrados.length} de ${catalogoAccesorios.length} accesorios`}
            </p>
            <button
              className={styles.filterToggle}
              onClick={() => setSidebarOpen(true)}
              id="btn-abrir-filtros-acc"
            >
              <TuneOutlinedIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Filtros
              {hayFiltrosActivos && <span className={styles.filterBadge} />}
            </button>
          </div>

          {cargandoCatalogo ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <CircularProgress sx={{ color: '#f59e0b' }} />
            </div>
          ) : accesoriosFiltrados.length === 0 ? (
            <div className={styles.emptyResult}>
              <div className={styles.emptyResultIcon}>
                <SearchIcon sx={{ fontSize: '3rem', color: '#475569' }} />
              </div>
              <Typography>No se encontraron accesorios con esos filtros.</Typography>
              <button className={styles.clearBtn} onClick={limpiarFiltros} style={{ marginTop: '1rem' }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {accesoriosFiltrados.map((acc) => (
                <AccesorioCard key={acc.id} accesorio={acc} />
              ))}
            </div>
          )}

        </main>

      </div>
    </div>
  )
}

export default Accesorios
