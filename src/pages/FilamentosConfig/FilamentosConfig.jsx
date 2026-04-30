import { useState, useMemo } from 'react'
import { Typography, Button, Chip, CircularProgress } from '@mui/material'
import useFetch from '../../hooks/useFetch'
import styles from './FilamentosConfig.module.css'

// ============================================================
// FilamentosConfig — Consigna 2 del TP3
// ✅ Custom Hook useFetch | ✅ Axios | ✅ useEffect([])
// ✅ Loading / Error (.catch) / Data | ✅ MUI Components
// ============================================================

const ALL_CIDS = '612,174,7501,9815,5372954,6623,8857,10413,644,7847,8252,6658,31239,9254,7794'
const API_PROPS = 'MolecularFormula,MolecularWeight,IUPACName,XLogP,ExactMass,TPSA,Complexity,HBondDonorCount,HBondAcceptorCount,HeavyAtomCount,RotatableBondCount,Charge'
const API_URL = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${ALL_CIDS}/property/${API_PROPS}/JSON`

const FEATURED_CIDS = [612, 174, 7501, 9815, 5372954, 6623]

const CID_CONTEXT = {
  612:     { filamento: 'PLA',      emoji: '🌿', temp: '180–230°C', cama: '20–60°C',  color: '#166534', bg: '#dcfce7', desc: 'Ácido Poliláctico. El filamento más popular, biodegradable y fácil de imprimir.' },
  174:     { filamento: 'PETG',     emoji: '💧', temp: '220–250°C', cama: '50–75°C',  color: '#1e40af', bg: '#dbeafe', desc: 'Resistente a impactos y humedad. Combina la facilidad del PLA con la durabilidad del ABS.' },
  7501:    { filamento: 'ABS',      emoji: '⚙️', temp: '220–250°C', cama: '80–110°C', color: '#92400e', bg: '#fef3c7', desc: 'Alta resistencia térmica y mecánica. Requiere recinto cerrado.' },
  9815:    { filamento: 'Nylon 6',  emoji: '🔩', temp: '240–280°C', cama: '70–90°C',  color: '#6b21a8', bg: '#f3e8ff', desc: 'Extrema resistencia al desgaste. Requiere secado previo del filamento.' },
  5372954: { filamento: 'TPU',      emoji: '🤸', temp: '210–230°C', cama: '20–60°C',  color: '#9d174d', bg: '#fce7f3', desc: 'Flexible y elástico. Perfecto para fundas y piezas que absorben impactos.' },
  6623:    { filamento: 'PC',       emoji: '🔷', temp: '250–310°C', cama: '90–120°C', color: '#0e7490', bg: '#cffafe', desc: 'Policarbonato. Altísima resistencia al impacto y transparencia óptica.' },
  8857:    { filamento: 'PVA',      emoji: '💊', temp: '190–220°C', cama: '45–60°C',  color: '#065f46', bg: '#d1fae5', desc: 'Filamento de soporte soluble en agua. Ideal para impresoras duales.' },
  10413:   { filamento: 'Nylon 12', emoji: '🔗', temp: '240–260°C', cama: '70–85°C',  color: '#4c1d95', bg: '#ede9fe', desc: 'Mayor flexibilidad que el Nylon 6. Menor absorción de humedad.' },
  644:     { filamento: 'ASA',      emoji: '☀️', temp: '240–260°C', cama: '90–110°C', color: '#92400e', bg: '#fff7ed', desc: 'Como el ABS pero resistente a rayos UV. Ideal para piezas de exterior.' },
  7847:    { filamento: 'HIPS',     emoji: '🧩', temp: '220–240°C', cama: '90–110°C', color: '#374151', bg: '#f3f4f6', desc: 'Soporte soluble en D-limoneno. Compatible con ABS para impresión dual.' },
  // Materiales adicionales (solo buscador desplegable)
  8252:    { filamento: 'PP',       emoji: '🧪', temp: '220–250°C', cama: '85–100°C', color: '#1d4ed8', bg: '#eff6ff', desc: 'Polipropileno. Alta resistencia química y a la fatiga. Difícil adhesión a la cama.' },
  6658:    { filamento: 'PMMA',     emoji: '🧪', temp: '230–260°C', cama: '90–100°C', color: '#701a75', bg: '#fdf4ff', desc: 'Acrílico/Plexiglas. Transparencia cristalina y alta rigidez. Frágil ante impactos.' },
  31239:   { filamento: 'PCL',      emoji: '🧪', temp: '60–80°C',  cama: '0–30°C',  color: '#065f46', bg: '#ecfdf5', desc: 'Policaprolactona. Temperatura de impresión ultrabaja. Biodegradable. Ideal para prótesis y educación.' },
  9254:    { filamento: 'PVDF',     emoji: '🧪', temp: '220–260°C', cama: '90–110°C', color: '#0c4a6e', bg: '#f0f9ff', desc: 'Fluoropolímero flexible con excelente resistencia química. Usado en industria alimenticia y médica.' },
  7794:    { filamento: 'PS',       emoji: '🧪', temp: '210–250°C', cama: '90–110°C', color: '#44403c', bg: '#fafaf9', desc: 'Poliestireno puro. Base del HIPS. Alta rigidez y fácil pintado. Poco resistente a impactos.' },
}

// Definición de TODAS las propiedades con icono, unidad y descripción
const PROP_DEFS = [
  { key: 'MolecularFormula',   icon: '⚗️',  label: 'Fórmula Molecular',          unit: '',       desc: 'Composición atómica del compuesto base del filamento.' },
  { key: 'MolecularWeight',    icon: '⚖️',  label: 'Peso Molecular',             unit: 'g/mol',  desc: 'Masa de una mol del compuesto. Influye en la viscosidad al fundirse.' },
  { key: 'IUPACName',          icon: '🔬',  label: 'Nombre IUPAC',               unit: '',       desc: 'Nombre científico oficial según la nomenclatura internacional.' },
  { key: 'ExactMass',          icon: '🎯',  label: 'Masa Exacta',                unit: 'Da',     desc: 'Masa monoisotópica precisa del compuesto. Usada en análisis espectrométrico.' },
  { key: 'XLogP',              icon: '📊',  label: 'XLogP (Lipofilicidad)',      unit: '',       desc: 'Indica afinidad por agua (negativo) o grasas (positivo). Afecta absorción de humedad.' },
  { key: 'TPSA',               icon: '🌊',  label: 'TPSA (Área Polar)',          unit: 'Å²',     desc: 'Área superficial polar. Valores altos indican mayor absorción de humedad (higroscopicidad).' },
  { key: 'Complexity',         icon: '🔮',  label: 'Complejidad Molecular',      unit: '',       desc: 'Medida de la complejidad estructural. Más alta = molécula más difícil de sintetizar.' },
  { key: 'HBondDonorCount',    icon: '💧',  label: 'Donantes de Puente H',       unit: '',       desc: 'Grupos capaces de ceder un hidrógeno. Más donantes = mayor absorción de agua del filamento.' },
  { key: 'HBondAcceptorCount', icon: '🧲',  label: 'Aceptores de Puente H',      unit: '',       desc: 'Grupos capaces de aceptar un hidrógeno. Relacionado con la polaridad y adhesión entre capas.' },
  { key: 'HeavyAtomCount',     icon: '⚛️',  label: 'Átomos Pesados',             unit: '',       desc: 'Cantidad de átomos no-hidrógeno. Indica el tamaño relativo de la molécula.' },
  { key: 'RotatableBondCount', icon: '🔄',  label: 'Enlances Rotables',          unit: '',       desc: 'Flexibilidad molecular. Más enlaces rotables = mayor flexibilidad del polímero resultante.' },
  { key: 'Charge',             icon: '⚡',  label: 'Carga Molecular',            unit: '',       desc: 'Carga eléctrica neta. 0 = neutro. Afecta la compatibilidad con aditivos conductores.' },
]

// Formatea el valor de la propiedad (fórmula como código, etc.)
const formatValue = (key, val) => {
  if (val === null || val === undefined) return '—'
  if (key === 'IUPACName') return val
  if (key === 'MolecularFormula') return val
  if (typeof val === 'number') return val.toString()
  return val
}

// ─────────────────────────────────────────────

const FilamentosConfig = () => {
  const [retryKey, setRetryKey] = useState(0)
  const [selectedCID, setSelectedCID] = useState(612)
  const [busqueda, setBusqueda] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const { data, loading, error } = useFetch(API_URL, retryKey)
  const handleRetry = () => setRetryKey((k) => k + 1)

  const compuestos = data?.PropertyTable?.Properties || []
  const selected = compuestos.find((c) => c.CID === selectedCID)
  const ctx = CID_CONTEXT[selectedCID]

  const materialesFiltrados = useMemo(() => {
    return compuestos.filter((c) => {
      const cx = CID_CONTEXT[c.CID]
      if (!cx) return false
      return cx.filamento.toLowerCase().includes(busqueda.toLowerCase())
    })
  }, [compuestos, busqueda])

  const handleSelect = (cid) => {
    setSelectedCID(cid)
    setBusqueda('')
    setDropdownOpen(false)
  }

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.apiTag}>
          <span className={styles.dot} />
          API EXTERNA · PUBCHEM (NIH)
        </div>
        <Typography className={styles.title}>
          Propiedades de los Materiales 3D
        </Typography>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingContainer} role="status">
          <CircularProgress size={44} sx={{ color: '#6366f1' }} />
          <Typography className={styles.loadingText}>Cargando datos...</Typography>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={styles.errorContainer} role="alert">
          <Typography className={styles.errorTitle}>⚠️ Error al conectar con la API</Typography>
          <Typography className={styles.errorMessage}>{error}</Typography>
          <Button className={styles.retryBtn} onClick={handleRetry} id="btn-reintentar-api">
            🔄 Reintentar
          </Button>
        </div>
      )}

      {/* Data */}
      {compuestos.length > 0 && !loading && !error && (
        <div className={styles.content}>

          {/* Fila: pills + buscador */}
          <div className={styles.selectorRow}>
            <div className={styles.pills}>
              {FEATURED_CIDS.map((cid) => {
                const cx = CID_CONTEXT[cid]
                const isActive = cid === selectedCID
                return (
                  <button
                    key={cid}
                    onClick={() => handleSelect(cid)}
                    className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
                    style={isActive ? { background: cx.bg, color: cx.color, borderColor: cx.color } : {}}
                    id={`pill-${cx?.filamento?.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {cx?.emoji} {cx?.filamento}
                  </button>
                )
              })}
            </div>

            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="🔍 Buscar material..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setDropdownOpen(true) }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                id="input-buscar-material"
              />
              {dropdownOpen && materialesFiltrados.length > 0 && (
                <div className={styles.dropdown}>
                  {materialesFiltrados.map((c) => {
                    const cx = CID_CONTEXT[c.CID]
                    return (
                      <button
                        key={c.CID}
                        className={`${styles.dropdownItem} ${c.CID === selectedCID ? styles.dropdownItemActive : ''}`}
                        onMouseDown={() => handleSelect(c.CID)}
                        id={`dropdown-${cx?.filamento?.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <span>{cx?.emoji}</span>
                        <span className={styles.dropdownName}>{cx?.filamento}</span>
                        <span className={styles.dropdownFormula}>{c.MolecularFormula}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de detalle */}
          {selected && ctx && (
            <div className={styles.card} key={selectedCID}>

              {/* Card Header */}
              <div className={styles.cardHeader} style={{ borderLeftColor: ctx.color }}>
                <div className={styles.cardEmoji}>{ctx.emoji}</div>
                <div>
                  <Typography className={styles.cardTitle}>{ctx.filamento}</Typography>
                  <Typography className={styles.cardDesc}>{ctx.desc}</Typography>
                  <div className={styles.tempRow}>
                    <span className={styles.tempBadge}>🌡️ Extrusor: <strong>{ctx.temp}</strong></span>
                    <span className={styles.tempBadge}>🔥 Cama: <strong>{ctx.cama}</strong></span>
                  </div>
                </div>
              </div>

              {/* Grid de TODAS las propiedades de la API */}
              <Typography className={styles.propsTitle}>
                Datos Químicos
                <span className={styles.apiSourceBadge}>· PubChem API</span>
              </Typography>

              <div className={styles.propsGrid}>
                {PROP_DEFS.map(({ key, icon, label, unit, desc }) => {
                  const raw = selected[key]
                  const val = formatValue(key, raw)
                  const isCode = key === 'MolecularFormula'
                  const isLong = key === 'IUPACName'

                  return (
                    <div
                      key={key}
                      className={`${styles.propBox} ${isLong ? styles.propBoxWide : ''}`}
                    >
                      <div className={styles.propHeader}>
                        <span className={styles.propIcon}>{icon}</span>
                        <span className={styles.propLabel}>{label}</span>
                        {unit && <span className={styles.propUnit}>{unit}</span>}
                      </div>
                      {isCode
                        ? <code className={styles.propFormula}>{val}</code>
                        : <span className={styles.propValue}>{val}</span>
                      }
                      <span className={styles.propDesc}>{desc}</span>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className={styles.cardFooter}>
                <Chip
                  label={`CID PubChem: ${selected.CID}`}
                  size="small"
                  sx={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 600, fontSize: '0.72rem' }}
                />
                <span className={styles.cardSource}>Fuente: PubChem · NIH · {compuestos.length} materiales</span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default FilamentosConfig
