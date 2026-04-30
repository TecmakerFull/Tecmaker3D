import { useMemo, useState } from 'react'
import { Typography, Button, CircularProgress } from '@mui/material'
import AccesorioCard from '../../components/AccesorioCard/AccesorioCard'
import useStockStore from '../../stores/useStockStore'
import styles from './Accesorios.module.css'

const Accesorios = () => {
  const catalogoAccesorios = useStockStore((s) => s.catalogoAccesorios)
  const cargandoCatalogo   = useStockStore((s) => s.cargandoCatalogo)

  const [categoriaActiva, setCategoriaActiva] = useState('Todas')

  // Categorías dinámicas desde Supabase (campo 'marca' = categoria en accesorios)
  const categorias = useMemo(() =>
    [...new Set(catalogoAccesorios.map(a => a.categoria))],
    [catalogoAccesorios]
  )

  const accesoriosFiltrados = useMemo(() =>
    categoriaActiva === 'Todas'
      ? catalogoAccesorios
      : catalogoAccesorios.filter(a => a.categoria === categoriaActiva),
    [catalogoAccesorios, categoriaActiva]
  )

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.pageLabel}>⚙️ ACCESORIOS</span>
          <Typography component="h1" className={styles.pageTitle}>
            Accesorios para Impresión 3D
          </Typography>
          <Typography className={styles.pageSubtitle}>
            {cargandoCatalogo ? 'Cargando...' : `${catalogoAccesorios.length} productos · Repuestos, componentes y más`}
          </Typography>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <span className={styles.filterLabel}>Categoría:</span>
          <Button className={`${styles.filterBtn} ${categoriaActiva === 'Todas' ? styles.filterBtnActive : ''}`} onClick={() => setCategoriaActiva('Todas')} id="filtro-todas-categorias">Todas</Button>
          {categorias.map((cat) => (
            <Button key={cat} className={`${styles.filterBtn} ${categoriaActiva === cat ? styles.filterBtnActive : ''}`} onClick={() => setCategoriaActiva(cat)} id={`filtro-cat-${cat.toLowerCase().replace(/\s/g, '-')}`}>{cat}</Button>
          ))}
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
              Mostrando {accesoriosFiltrados.length} de {catalogoAccesorios.length} accesorios
            </p>
            <div className={styles.grid}>
              {accesoriosFiltrados.map((acc) => (
                <AccesorioCard key={acc.id} accesorio={acc} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Accesorios
