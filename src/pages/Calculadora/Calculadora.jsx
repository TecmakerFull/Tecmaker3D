import { useState, useMemo } from 'react'
import useStockStore   from '../../stores/useStockStore'
import useAuthStore    from '../../stores/useAuthStore'
import { supabase }   from '../../lib/supabase'
// ── MUI Icons ──────────────────────────────────────────────────────────────────
import SupportIcon                from '@mui/icons-material/Support'
import ConstructionOutlinedIcon   from '@mui/icons-material/ConstructionOutlined'
import EngineeringOutlinedIcon    from '@mui/icons-material/EngineeringOutlined'
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined'
import PersonOutlinedIcon         from '@mui/icons-material/PersonOutlined'
import CalculateOutlinedIcon      from '@mui/icons-material/CalculateOutlined'
import SaveOutlinedIcon           from '@mui/icons-material/SaveOutlined'
import PictureAsPdfOutlinedIcon   from '@mui/icons-material/PictureAsPdfOutlined'
import BarChartOutlinedIcon       from '@mui/icons-material/BarChartOutlined'
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import ElectricBoltOutlinedIcon   from '@mui/icons-material/ElectricBoltOutlined'
import BuildOutlinedIcon          from '@mui/icons-material/BuildOutlined'
import CheckCircleOutlinedIcon    from '@mui/icons-material/CheckCircleOutlined'
import AccessTimeOutlinedIcon     from '@mui/icons-material/AccessTimeOutlined'
import GoogleIcon                 from '@mui/icons-material/Google'
import styles from './Calculadora.module.css'

const IMPRESORAS = [
  { id: 'ender3',      nombre: 'Creality Ender 3',    consumoW: 150, desgasteHora: 120 },
  { id: 'ender3pro',   nombre: 'Ender 3 Pro / V2',    consumoW: 165, desgasteHora: 135 },
  { id: 'ender3s1',    nombre: 'Ender 3 S1 / S1 Pro', consumoW: 200, desgasteHora: 180 },
  { id: 'bambuA1',     nombre: 'Bambu Lab A1',         consumoW: 230, desgasteHora: 320 },
  { id: 'bambuA1mini', nombre: 'Bambu Lab A1 Mini',    consumoW: 220, desgasteHora: 350 },
  { id: 'bambuP1S',    nombre: 'Bambu Lab P1S',        consumoW: 350, desgasteHora: 600 },
  { id: 'prusa_mk4',   nombre: 'Prusa MK4',            consumoW: 180, desgasteHora: 400 },
  { id: 'anycubicKob', nombre: 'Anycubic Kobra 2',     consumoW: 170, desgasteHora: 150 },
  { id: 'cr10',        nombre: 'Creality CR-10 / S',   consumoW: 320, desgasteHora: 160 },
  { id: 'neptune4',    nombre: 'Elegoo Neptune 4',      consumoW: 165, desgasteHora: 140 },
  { id: 'custom',      nombre: 'Personalizada',         consumoW: 0,   desgasteHora: 0   },
]

const nuevaFilaMaterial = (id) => ({ id, productoId: '', costoManual: '', gramos: 100, descripcion: '' })
const nuevaFilaMDO      = (id) => ({ id, descripcion: '', horas: '', tarifa: '' })

const fmt = (n) =>
  n == null || isNaN(n)
    ? '—'
    : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

let _rowId = 1
const genId = () => _rowId++

export default function Calculadora() {
  const catalogoFilamentos = useStockStore((s) => s.catalogoFilamentos)
  const catalogoAccesorios = useStockStore((s) => s.catalogoAccesorios)
  const cargandoCatalogo   = useStockStore((s) => s.cargandoCatalogo)

  // Excluimos solo los repuestos internos (Partes Impresora)
  // Cualquier otra categoría (Insumos para 3D, etc.) se muestra al cliente
  const accesoriosParaCliente = useMemo(
    () => catalogoAccesorios.filter(a => a.categoria !== 'Partes Impresora'),
    [catalogoAccesorios]
  )

  const { session, loginConGoogle } = useAuthStore()

  // ── Estado general ───────────────────────────────────
  const [nombreProducto, setNombreProducto] = useState('')
  const [cliente,        setCliente]        = useState('')
  const [margen, setMargen] = useState(40)

  // ── Modal guardar ────────────────────────────────
  const [modalGuardar,   setModalGuardar]   = useState(false) // 'login' | 'confirm' | false
  const [guardando,      setGuardando]      = useState(false)
  const [guardadoOk,     setGuardadoOk]     = useState(false)

  // ── Impresora ─────────────────────────────────────────
  const [impresora, setImpresora]           = useState(IMPRESORAS[3]) // Bambu A1 por defecto
  const [consumoWCustom, setConsumoWCustom] = useState(String(IMPRESORAS[3].consumoW))
  const [desgasteCustom, setDesgasteCustom] = useState(String(IMPRESORAS[3].desgasteHora))
  const [horasImp, setHorasImp]             = useState('')
  const [minutosImp, setMinutosImp]         = useState('')
  const [tarifaKwh, setTarifaKwh]           = useState('384')

  // ── Materiales ────────────────────────────────────────
  const [materiales, setMateriales] = useState([nuevaFilaMaterial(genId())])

  // ── Accesorios ────────────────────────────────────────
  const [accesorios, setAccesorios] = useState([{ id: genId(), productoId: '', costoManual: '', cantidad: 1, descripcion: '' }])

  // ── Mano de obra ──────────────────────────────────────
  const [mdo, setMdo] = useState([nuevaFilaMDO(genId())])

  // ── Helpers materiales ────────────────────────────────
  const addMaterial    = () => setMateriales(p => [...p, nuevaFilaMaterial(genId())])
  const removeMaterial = (id) => setMateriales(p => p.filter(r => r.id !== id))
  const updateMaterial = (id, f, v) => setMateriales(p => p.map(r => r.id === id ? { ...r, [f]: v } : r))

  // ── Helpers accesorios ────────────────────────────────
  const addAccesorio    = () => setAccesorios(p => [...p, { id: genId(), productoId: '', costoManual: '', cantidad: 1, descripcion: '' }])
  const removeAccesorio = (id) => setAccesorios(p => p.filter(r => r.id !== id))
  const updateAccesorio = (id, f, v) => setAccesorios(p => p.map(r => r.id === id ? { ...r, [f]: v } : r))

  // ── Helpers mano de obra ──────────────────────────────
  const addMdo    = () => setMdo(p => [...p, nuevaFilaMDO(genId())])
  const removeMdo = (id) => setMdo(p => p.filter(r => r.id !== id))
  const updateMdo = (id, f, v) => setMdo(p => p.map(r => r.id === id ? { ...r, [f]: v } : r))

  // ── Impresora ─────────────────────────────────────────
  const selectImpresora = (imp) => {
    setImpresora(imp)
    if (imp.id !== 'custom') {
      setConsumoWCustom(String(imp.consumoW))
      setDesgasteCustom(String(imp.desgasteHora))
    }
  }

  // ── Tiempo total en horas (decimal) ──────────────────
  const horasTotales = (Number(horasImp) || 0) + (Number(minutosImp) || 0) / 60

  // ── Cálculo ───────────────────────────────────────────
  const resultado = useMemo(() => {
    const consumoW  = Number(consumoWCustom) || 0
    const desgaste  = Number(desgasteCustom) || 0
    const horasN    = (Number(horasImp) || 0) + (Number(minutosImp) || 0) / 60
    const tarifaN   = Number(tarifaKwh) || 0

    const costoElectrico    = (consumoW / 1000) * horasN * tarifaN
    const costoAmortizacion = desgaste * horasN

    const costoMateriales = materiales.reduce((acc, r) => {
      let pKg = 0
      if (r.productoId && r.productoId !== 'otro') pKg = catalogoFilamentos.find(p => p.id === r.productoId)?.precio || 0
      else if (r.costoManual) pKg = Number(r.costoManual)
      return acc + (pKg / 1000) * (Number(r.gramos) || 0)
    }, 0)

    const costoAccesorios = accesorios.reduce((acc, r) => {
      let precio = 0
      if (r.productoId && r.productoId !== 'otro') precio = catalogoAccesorios.find(p => p.id === r.productoId)?.precio || 0
      else if (r.costoManual) precio = Number(r.costoManual)
      return acc + precio * (Number(r.cantidad) || 1)
    }, 0)

    const costoMDO = mdo.reduce((acc, r) => {
      return acc + (Number(r.horas) || 0) * (Number(r.tarifa) || 0)
    }, 0)

    const costoOperativo = costoElectrico + costoAmortizacion
    const costoTotal     = costoMateriales + costoAccesorios + costoMDO + costoOperativo
    const precioFinal    = costoTotal * (1 + margen / 100)

    return { costoMateriales, costoAccesorios, costoMDO, costoElectrico, costoAmortizacion, costoOperativo, costoTotal, precioFinal, horasN, consumoW }
  }, [consumoWCustom, desgasteCustom, horasImp, minutosImp,
      tarifaKwh, materiales, accesorios, mdo, margen, catalogoFilamentos, catalogoAccesorios])

  const handleReset = () => {
    setNombreProducto(''); setCliente('')
    setMateriales([nuevaFilaMaterial(genId())])
    setAccesorios([{ id: genId(), productoId: '', costoManual: '', cantidad: 1, descripcion: '' }])
    setMdo([nuevaFilaMDO(genId())])
    setHorasImp(''); setMinutosImp('')
    setImpresora(IMPRESORAS[3]); setConsumoWCustom('230'); setDesgasteCustom('320')
    setMargen(40); setGuardadoOk(false)
  }
  const handleExportPDF = () => {
    const fmtN = (n) =>
      n == null || isNaN(n) ? '—'
      : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    const duracion = resultado.horasN > 0
      ? `${Math.floor(resultado.horasN)}h ${Math.round((resultado.horasN % 1) * 60)}min`
      : '—'

    const filasMaterieles = materiales
      .filter(r => r.productoId || r.costoManual)
      .map(r => {
        const prod = r.productoId && r.productoId !== 'otro'
          ? catalogoFilamentos.find(p => p.id === r.productoId) : null
        const nombre   = prod ? `${prod.nombre} (${prod.marca})` : (r.descripcion || 'Material manual')
        const pKg      = prod ? prod.precio : Number(r.costoManual) || 0
        const gramos   = Number(r.gramos) || 0
        const subtotal = (pKg / 1000) * gramos
        return `<tr><td>${nombre}</td><td>${gramos}g</td><td>${fmtN(pKg)}/kg</td><td class="num">${fmtN(subtotal)}</td></tr>`
      }).join('')

    const filasAccesorios = accesorios
      .filter(r => r.productoId || r.costoManual)
      .map(r => {
        const prod = r.productoId && r.productoId !== 'otro'
          ? accesoriosParaCliente.find(p => p.id === r.productoId) : null
        const nombre   = prod ? prod.nombre : (r.descripcion || 'Accesorio manual')
        const precio   = prod ? prod.precio : Number(r.costoManual) || 0
        const cantidad = Number(r.cantidad) || 1
        return `<tr><td>${nombre}</td><td>${cantidad} u.</td><td>${fmtN(precio)}</td><td class="num">${fmtN(precio * cantidad)}</td></tr>`
      }).join('')

    const filasMDO = mdo
      .filter(r => r.horas && r.tarifa)
      .map(r => {
        const subtotal = (Number(r.horas) || 0) * (Number(r.tarifa) || 0)
        return `<tr><td>${r.descripcion || 'Mano de obra'}</td><td>${r.horas}h</td><td>${fmtN(Number(r.tarifa))}/h</td><td class="num">${fmtN(subtotal)}</td></tr>`
      }).join('')

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Presupuesto TecMaker 3D</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b;background:#fff;padding:2cm 2.2cm}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;padding-bottom:1rem;border-bottom:3px solid #f59e0b}
.brand{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px}
.brand span{color:#f59e0b}
.brand-sub{font-size:10px;color:#64748b;margin-top:2px}
.meta{text-align:right;font-size:11px;color:#475569;line-height:1.9}
.meta strong{color:#0f172a}
.pres-title{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:.3rem}
.pres-cliente{font-size:11px;color:#475569;margin-bottom:1.5rem}
.section{margin-bottom:1.5rem}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;margin-bottom:.5rem;padding-bottom:.3rem;border-bottom:1px solid #fde68a}
table{width:100%;border-collapse:collapse}
th{background:#f8fafc;color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:6px 8px;text-align:left;border-bottom:1px solid #e2e8f0}
td{padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#334155}
tr:last-child td{border-bottom:none}
.num{text-align:right;font-weight:600;color:#0f172a}
.desglose{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;margin-bottom:1.5rem}
.drow{display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#475569}
.drow.tot{border-top:1px solid #e2e8f0;margin-top:6px;padding-top:8px;font-size:12px;font-weight:700;color:#0f172a}
.precio-box{background:#0f172a;border-radius:10px;padding:1.2rem 1.5rem;display:flex;justify-content:space-between;align-items:center}
.precio-label{color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.precio-valor{color:#f59e0b;font-size:26px;font-weight:800;letter-spacing:-1px}
.precio-margen{color:#64748b;font-size:10px;margin-top:2px}
.footer{margin-top:2rem;padding-top:.75rem;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
@media print{body{padding:1.5cm}}
</style></head><body>

<div class="header">
  <div>
    <div class="brand">TecMaker <span>3D</span></div>
    <div class="brand-sub">Impresión 3D · Filamentos · Accesorios</div>
  </div>
  <div class="meta">
    <div><strong>Fecha:</strong> ${fecha}</div>
    ${cliente ? `<div><strong>Cliente:</strong> ${cliente}</div>` : ''}
    <div><strong>Impresora:</strong> ${impresora.nombre}</div>
    <div><strong>Duración:</strong> ${duracion}</div>
    <div><strong>Margen:</strong> ${margen}%</div>
  </div>
</div>

<div class="pres-title">${nombreProducto || 'Cotización de Impresión 3D'}</div>
${cliente ? `<div class="pres-cliente">Preparado para: <strong>${cliente}</strong></div>` : '<div style="margin-bottom:1.5rem"></div>'}

${filasMaterieles ? `<div class="section">
  <div class="section-title">Materiales</div>
  <table><thead><tr><th>Material</th><th>Cantidad</th><th>Precio</th><th style="text-align:right">Subtotal</th></tr></thead>
  <tbody>${filasMaterieles}</tbody></table>
</div>` : ''}

${filasAccesorios ? `<div class="section">
  <div class="section-title">Accesorios / Insumos</div>
  <table><thead><tr><th>Accesorio</th><th>Unidades</th><th>P. Unit.</th><th style="text-align:right">Subtotal</th></tr></thead>
  <tbody>${filasAccesorios}</tbody></table>
</div>` : ''}

${filasMDO ? `<div class="section">
  <div class="section-title">Mano de Obra</div>
  <table><thead><tr><th>Descripción</th><th>Horas</th><th>Tarifa</th><th style="text-align:right">Subtotal</th></tr></thead>
  <tbody>${filasMDO}</tbody></table>
</div>` : ''}

<div class="desglose">
  <div class="drow"><span>Materiales</span><span>${fmtN(resultado.costoMateriales)}</span></div>
  ${resultado.costoAccesorios > 0 ? `<div class="drow"><span>Accesorios</span><span>${fmtN(resultado.costoAccesorios)}</span></div>` : ''}
  ${resultado.costoMDO > 0 ? `<div class="drow"><span>Mano de obra</span><span>${fmtN(resultado.costoMDO)}</span></div>` : ''}
  <div class="drow"><span>Energía eléctrica</span><span>${fmtN(resultado.costoElectrico)}</span></div>
  <div class="drow"><span>Amortización impresora</span><span>${fmtN(resultado.costoAmortizacion)}</span></div>
  <div class="drow tot"><span>Costo total</span><span>${fmtN(resultado.costoTotal)}</span></div>
</div>

<div class="precio-box">
  <div>
    <div class="precio-label">Precio Final al Cliente</div>
    <div class="precio-margen">Incluye ${margen}% de margen comercial</div>
  </div>
  <div class="precio-valor">${fmtN(resultado.precioFinal)}</div>
</div>

<div class="footer">Generado por TecMaker 3D · tecmaker.com.ar · Presupuesto válido por 7 días hábiles.</div>
</body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  // ── Guardar presupuesto ─────────────────────────────
  const handleGuardar = () => {
    if (!session) { setModalGuardar('login'); return }
    setModalGuardar('confirm')
  }

  const confirmarGuardar = async () => {
    setGuardando(true)
    const payload = {
      usuario_id:         session.user.id,
      nombre_producto:    nombreProducto || null,
      cliente:            cliente        || null,
      materiales:         JSON.stringify(materiales),
      accesorios:         JSON.stringify(accesorios),
      mano_de_obra:       JSON.stringify(mdo),
      impresora_nombre:   impresora.nombre,
      consumo_w:          Number(consumoWCustom) || 0,
      desgaste_hora:      Number(desgasteCustom) || 0,
      horas_imp:          Number(horasImp)       || 0,
      minutos_imp:        Number(minutosImp)     || 0,
      tarifa_kwh:         Number(tarifaKwh)      || 0,
      margen,
      costo_materiales:   resultado.costoMateriales,
      costo_accesorios:   resultado.costoAccesorios,
      costo_mdo:          resultado.costoMDO,
      costo_electrico:    resultado.costoElectrico,
      costo_amortizacion: resultado.costoAmortizacion,
      costo_total:        resultado.costoTotal,
      precio_final:       resultado.precioFinal,
    }
    try {
      const { error } = await supabase.from('cotizaciones').insert(payload)
      if (!error) {
        setGuardadoOk(true)
      } else {
        console.error('Error guardando cotización:', error.message, error.details, error.hint)
        alert(`No se pudo guardar la cotización.\n\nError: ${error.message}${error.hint ? '\nHint: ' + error.hint : ''}`)
      }
    } catch (e) {
      console.error('Excepción al guardar cotización:', e)
      alert(`Error inesperado al guardar: ${e.message}`)
    } finally {
      setGuardando(false)
      setModalGuardar(false)
    }
  }

  // ── Estimación eléctrica en tiempo real ───────────────
  const consumoEfectivo = Number(consumoWCustom) || impresora.consumoW
  const kwhEstimado     = horasTotales > 0 ? (consumoEfectivo / 1000 * horasTotales).toFixed(3) : null
  const tiempoLabel     = horasImp || minutosImp
    ? `${horasImp || 0}h ${minutosImp || 0}min`
    : null

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}><CalculateOutlinedIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.6rem' }} /> Calculadora <span>3D</span></h1>
        </div>
        <div className={styles.headerRight}>
          <input
            className={styles.nombreInput}
            type="text"
            placeholder="Nombre del producto / presupuesto..."
            value={nombreProducto}
            onChange={e => setNombreProducto(e.target.value)}
          />
          <button className={styles.btnGuardar} onClick={handleGuardar}><SaveOutlinedIcon sx={{ fontSize: '0.95rem', verticalAlign: 'middle', mr: 0.4 }} /> Guardar</button>
          <button className={styles.btnReset}   onClick={handleReset}>Reiniciar</button>
          <button className={styles.btnPDF}     onClick={handleExportPDF}><PictureAsPdfOutlinedIcon sx={{ fontSize: '0.95rem', verticalAlign: 'middle', mr: 0.4 }} /> PDF</button>
          {guardadoOk && <span className={styles.savedBadge}><CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle' }} /> Guardado</span>}
        </div>
      </div>

      {/* ── Layout principal: 2 columnas ── */}
      <div className={styles.mainLayout}>

        {/* ═══ COLUMNA IZQUIERDA ═══ */}
        <div className={styles.leftCol}>

          {/* 1. Materiales */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><SupportIcon fontSize="small" /></div>
              <div>
                <p className={styles.cardTitle}>Materiales</p>
                <p className={styles.cardSubtitle}>Filamentos del catálogo</p>
              </div>
              <button className={styles.btnAddInline} onClick={addMaterial} title="Agregar material">＋</button>
            </div>
            <div className={styles.colHeaders}>
              <span className={styles.colHeaderSpacer}></span>
              <span className={`${styles.colHeaderLabel} ${styles.colHeaderSelect}`}>Filamento</span>
              <span className={`${styles.colHeaderLabel} ${styles.colHeaderPrice}`}>Precio/kg</span>
              <span className={`${styles.colHeaderLabel} ${styles.colHeaderNum}`}>Gramos</span>
              <span className={styles.colHeaderUnit}></span>
            </div>
            <div className={styles.rowsContainer}>
              {materiales.map((row, idx) => (
                <div key={row.id} className={styles.animIn}>
                  <div className={styles.materialGrid}>
                    <span className={styles.rowNum}>{idx + 1}</span>
                    <select className={styles.select} value={row.productoId}
                      onChange={e => updateMaterial(row.id, 'productoId', e.target.value)}>
                      <option value="">— Filamento —</option>
                      {cargandoCatalogo
                        ? <option disabled>Cargando...</option>
                        : catalogoFilamentos.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.marca ? `[${p.marca}] ` : ''}{p.nombre} {p.color ? `(${p.color})` : ''}
                            </option>
                          ))
                      }
                      <option value="otro">Precio manual</option>
                    </select>
                    <div className={styles.inputGroup}>
                      {row.productoId === 'otro'
                        ? <input className={styles.input} type="number" min="0"
                            placeholder="0" value={row.costoManual}
                            onChange={e => updateMaterial(row.id, 'costoManual', e.target.value)} />
                        : row.productoId
                          ? <span className={styles.priceDisplay}>
                              {fmt(catalogoFilamentos.find(p => p.id === row.productoId)?.precio)}
                            </span>
                          : <span className={styles.priceEmpty}></span>
                      }
                      {row.productoId === 'otro' && <span className={styles.inputSuffix}>$</span>}
                    </div>
                    <div className={styles.inputGroup}>
                      <input className={styles.input} type="number" min="1"
                        placeholder="0" value={row.gramos}
                        onChange={e => updateMaterial(row.id, 'gramos', e.target.value)} />
                      <span className={styles.inputSuffix}>g</span>
                    </div>
                    <button className={styles.btnRemove} onClick={() => removeMaterial(row.id)}
                      disabled={materiales.length === 1}>×</button>
                  </div>
                  {row.productoId === 'otro' && (
                    <input
                      className={styles.inputDetalle}
                      type="text"
                      placeholder="Descripción del material (ej: PETG transparente importado)"
                      value={row.descripcion}
                      onChange={e => updateMaterial(row.id, 'descripcion', e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Accesorios */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><ConstructionOutlinedIcon fontSize="small" /></div>
              <div>
                <p className={styles.cardTitle}>Accesorios</p>
                <p className={styles.cardSubtitle}>Insumos adicionales</p>
              </div>
              <button className={styles.btnAddInline} onClick={addAccesorio} title="Agregar accesorio">＋</button>
            </div>
            <div className={styles.colHeaders}>
              <span className={styles.colHeaderSpacer}></span>
              <span className={`${styles.colHeaderLabel} ${styles.colHeaderSelect}`}>Accesorio / insumo</span>
              <span className={`${styles.colHeaderLabel} ${styles.colHeaderPrice}`}>Precio u.</span>
              <span className={`${styles.colHeaderLabel} ${styles.colHeaderNum}`}>Unidades</span>
              <span className={styles.colHeaderUnit}></span>
            </div>
            <div className={styles.rowsContainer}>
              {accesorios.map((row, idx) => (
                <div key={row.id} className={styles.animIn}>
                  <div className={styles.materialGrid}>
                    <span className={styles.rowNum}>{idx + 1}</span>
                    <select className={styles.select} value={row.productoId}
                      onChange={e => updateAccesorio(row.id, 'productoId', e.target.value)}>
                      <option value="">— Accesorio —</option>
                      {cargandoCatalogo
                        ? <option disabled>Cargando...</option>
                        : accesoriosParaCliente.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))
                      }
                      <option value="otro">Manual</option>
                    </select>
                    <div className={styles.inputGroup}>
                      {row.productoId === 'otro'
                        ? <input className={styles.input} type="number" min="0"
                            placeholder="0" value={row.costoManual}
                            onChange={e => updateAccesorio(row.id, 'costoManual', e.target.value)} />
                        : row.productoId
                          ? <span className={styles.priceDisplay}>
                              {fmt(accesoriosParaCliente.find(p => p.id === row.productoId)?.precio)}
                            </span>
                          : <span className={styles.priceEmpty}></span>
                      }
                      {row.productoId === 'otro' && <span className={styles.inputSuffix}>$</span>}
                    </div>
                    <div className={styles.inputGroup}>
                      <input className={styles.input} type="number" min="1"
                        placeholder="1" value={row.cantidad}
                        onChange={e => updateAccesorio(row.id, 'cantidad', e.target.value)} />
                      <span className={styles.inputSuffix}>u</span>
                    </div>
                    <button className={styles.btnRemove} onClick={() => removeAccesorio(row.id)}>×</button>
                  </div>
                  {row.productoId === 'otro' && (
                    <input
                      className={styles.inputDetalle}
                      type="text"
                      placeholder="Descripción del insumo (ej: Tornillos M3 x 10mm)"
                      value={row.descripcion}
                      onChange={e => updateAccesorio(row.id, 'descripcion', e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Mano de obra */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><EngineeringOutlinedIcon fontSize="small" /></div>
              <div>
                <p className={styles.cardTitle}>Mano de Obra</p>
                <p className={styles.cardSubtitle}>Diseño · Retrabajo · Tintado · Post-proceso</p>
              </div>
              <button className={styles.btnAddInline} onClick={addMdo} title="Agregar tarea">＋</button>
            </div>
            <div className={styles.mdoHeader}>
              <span></span>
              <span className={styles.mdoColLabel}>Tarea</span>
              <span className={styles.mdoColLabel}>Hs</span>
              <span className={styles.mdoColLabel}>$/h</span>
              <span className={styles.mdoColLabel}>Subtotal</span>
              <span></span>
            </div>
            <div className={styles.rowsContainer}>
              {mdo.map((row, idx) => (
                <div key={row.id} className={`${styles.mdoRow} ${styles.animIn}`}>
                  <span className={styles.rowNum}>{idx + 1}</span>
                  <input className={`${styles.input} ${styles.inputMdoDesc}`} type="text"
                    placeholder="Diseño, Tintado..."
                    value={row.descripcion}
                    onChange={e => updateMdo(row.id, 'descripcion', e.target.value)} />
                  <input className={`${styles.input} ${styles.inputXs}`} type="number" min="0" step="0.25"
                    placeholder="0" value={row.horas}
                    onChange={e => updateMdo(row.id, 'horas', e.target.value)} />
                  <input className={`${styles.input} ${styles.inputSm}`} type="number" min="0"
                    placeholder="$/h" value={row.tarifa}
                    onChange={e => updateMdo(row.id, 'tarifa', e.target.value)} />
                  <span className={styles.mdoSubtotal}>
                    {row.horas && row.tarifa ? fmt((Number(row.horas)||0)*(Number(row.tarifa)||0)) : '—'}
                  </span>
                  <button
                    className={styles.btnRemove}
                    onClick={() => {
                      if (mdo.length === 1) {
                        // limpiar campos de la única fila
                        updateMdo(row.id, 'descripcion', '')
                        updateMdo(row.id, 'horas', '')
                        updateMdo(row.id, 'tarifa', '')
                      } else {
                        removeMdo(row.id)
                      }
                    }}
                  >×</button>
                </div>
              ))}
            </div>
            {mdo.some(r => r.horas && r.tarifa) && (
              <div className={styles.mdoTotal}>
                <span>Subtotal mano de obra</span>
                <span>{fmt(mdo.reduce((a, r) => a + (Number(r.horas) || 0) * (Number(r.tarifa) || 0), 0))}</span>
              </div>
            )}
          </div>

          {/* ── Desglose de Costos (abajo del leftCol) ── */}
          <div className={styles.resultCardWide}>
            <p className={styles.resultTitle}><BarChartOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Desglose de Costos</p>
            <div className={styles.desgloseGrid}>
              <div className={styles.costoBase}>
                <span className={styles.costoBaseLabel}><SupportIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.4 }} /> Materiales</span>
                <span className={styles.costoBaseVal}>{fmt(resultado.costoMateriales)}</span>
              </div>
              <div className={styles.costoBase}>
                <span className={styles.costoBaseLabel}><ConstructionOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.4 }} /> Accesorios</span>
                <span className={styles.costoBaseVal}>{fmt(resultado.costoAccesorios)}</span>
              </div>
              <div className={styles.costoBase}>
                <span className={styles.costoBaseLabel}><EngineeringOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.4 }} /> Mano de obra</span>
                <span className={styles.costoBaseVal}>{fmt(resultado.costoMDO)}</span>
              </div>
              <div className={styles.costoBase}>
                <span className={styles.costoBaseLabel}><ElectricBoltOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.4 }} /> Electricidad</span>
                <span className={styles.costoBaseVal}>{fmt(resultado.costoElectrico)}</span>
              </div>
              <div className={styles.costoBase}>
                <span className={styles.costoBaseLabel}><BuildOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.4 }} /> Desgaste impresora</span>
                <span className={styles.costoBaseVal}>{fmt(resultado.costoAmortizacion)}</span>
              </div>
            </div>
            <div className={styles.costoTotalRow}>
              <span className={styles.costoTotalLabel}>Costo total base</span>
              <span className={styles.costoTotalVal}>{fmt(resultado.costoTotal)}</span>
            </div>
          </div>

        </div>

        {/* ═══ COLUMNA DERECHA ═══ */}
        <div className={styles.rightCol}>

          {/* Impresora + tiempo + tarifa */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><PrecisionManufacturingOutlinedIcon fontSize="small" /></div>
              <div>
                <p className={styles.cardTitle}>Impresora</p>
                <p className={styles.cardSubtitle}>Perfil de consumo y desgaste</p>
              </div>
            </div>

            {/* Modelo */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Modelo</label>
              <select className={styles.select} value={impresora.id}
                onChange={e => selectImpresora(IMPRESORAS.find(i => i.id === e.target.value))}>
                {IMPRESORAS.map(imp => (
                  <option key={imp.id} value={imp.id}>
                    {imp.nombre}{imp.id !== 'custom' ? ` — ${imp.consumoW}W · $${imp.desgasteHora}/h` : ' — Personalizada'}
                  </option>
                ))}
              </select>
            </div>

            {/* Consumo y desgaste */}
            <div className={styles.inlineFields}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Consumo (W)</label>
                <div className={styles.inputGroup}>
                  <input className={styles.input} type="number" min="0"
                    placeholder={String(impresora.consumoW || 0)}
                    value={consumoWCustom} onChange={e => setConsumoWCustom(e.target.value)} />
                  <span className={styles.inputSuffix}>W</span>
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Desgaste</label>
                <div className={styles.inputGroup}>
                  <input className={styles.input} type="number" min="0"
                    placeholder={String(impresora.desgasteHora || 0)}
                    value={desgasteCustom} onChange={e => setDesgasteCustom(e.target.value)} />
                  <span className={styles.inputSuffix}>$/h</span>
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Tarifa eléctrica — primero */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tarifa eléctrica</label>
              <div className={styles.inputGroup}>
                <input className={styles.input} type="number" min="0" placeholder="384"
                  value={tarifaKwh} onChange={e => setTarifaKwh(e.target.value)} />
                <span className={styles.inputSuffix}>$/kWh</span>
              </div>
              <p className={styles.tarifaNota}>
                Valor sugerido basado en la tarifa actual de EPE Rosario (residencial con impuestos). Modificalo si sos comercio o industria.
              </p>
            </div>

            <div className={styles.divider} />

            {/* Tiempo de impresión (h + min) — segundo */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Tiempo de impresión
                <span className={styles.fieldLabelHint}>(del laminador: ej. 2h 30min)</span>
              </label>
              <div className={styles.timeFields}>
                <div className={styles.inputGroup}>
                  <input className={styles.input} type="number" min="0" placeholder="0"
                    value={horasImp} onChange={e => setHorasImp(e.target.value)} />
                  <span className={styles.inputSuffix}>h</span>
                </div>
                <span className={styles.timeSep}>:</span>
                <div className={styles.inputGroup}>
                  <input className={styles.input} type="number" min="0" max="59" placeholder="00"
                    value={minutosImp} onChange={e => setMinutosImp(e.target.value)} />
                  <span className={styles.inputSuffix}>min</span>
                </div>
              </div>
              {tiempoLabel && kwhEstimado && (
                <div className={styles.chips} style={{ marginTop: '0.5rem' }}>
                  <span className={styles.chip}><ElectricBoltOutlinedIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle' }} /> {kwhEstimado} kWh estimados</span>
                  <span className={`${styles.chip} ${styles.chipAmber}`}><AccessTimeOutlinedIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle' }} /> {tiempoLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta Cliente (opcional) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}><PersonOutlinedIcon fontSize="small" /></div>
              <div>
                <p className={styles.cardTitle}>Cliente</p>
                <p className={styles.cardSubtitle}>Opcional — para el presupuesto</p>
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <input
                className={styles.input}
                type="text"
                placeholder="Nombre del cliente..."
                value={cliente}
                onChange={e => setCliente(e.target.value)}
              />
            </div>
          </div>

          {/* ── Precio de Venta (abajo del rightCol) ── */}
          <div className={styles.resultCardWide}>
            <p className={styles.resultTitle}>
              {nombreProducto ? <><MonetizationOnOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} />{nombreProducto}</> : <><MonetizationOnOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} />Precio de Venta</>}
            </p>
            <div className={styles.sliderInline}>
              <span className={styles.sliderInlineLabel}>% Ganancia</span>
              <input type="range" min="0" max="300" step="5"
                value={margen} onChange={e => setMargen(Number(e.target.value))}
                className={styles.slider} />
              <span className={styles.margenValue}>{margen}%</span>
            </div>
            <div className={styles.gananciaAbs}>
              <span className={styles.gananciaLabel}>Ganancia en $</span>
              <span className={styles.gananciaVal}>
                {fmt(resultado.precioFinal - resultado.costoTotal)}
              </span>
            </div>
            <div className={styles.precioMainBox}>
              <p className={styles.precioMainVal}>{fmt(resultado.precioFinal)}</p>
              <p className={styles.precioMainMargen}>Precio de venta sugerido con {margen}% de ganancia</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal guardar ── */}
      {modalGuardar && (
        <div className={styles.modalOverlay} onClick={() => setModalGuardar(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>

            {modalGuardar === 'login' && (
              <>
                <p className={styles.modalTitle}><SaveOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Guardar presupuesto</p>
                <p className={styles.modalText}>
                  Para guardar y consultar tus presupuestos en otro momento necesitás iniciar sesión.
                </p>
                <div className={styles.modalActions}>
                  <button className={styles.btnReset} onClick={() => setModalGuardar(false)}>Cancelar</button>
                  <button className={styles.btnGuardar} onClick={() => { setModalGuardar(false); loginConGoogle() }}>
                    <GoogleIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Iniciar sesión con Google
                  </button>
                </div>
              </>
            )}

            {modalGuardar === 'confirm' && (
              <>
                <p className={styles.modalTitle}><SaveOutlinedIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.4 }} /> Confirmar guardado</p>
                <p className={styles.modalText}>
                  Se va a guardar <strong>{nombreProducto || 'este presupuesto'}</strong>
                  {cliente ? ` para ${cliente}` : ''} con un precio de venta de{' '}
                  <strong>{fmt(resultado.precioFinal)}</strong>.
                </p>
                <div className={styles.modalActions}>
                  <button className={styles.btnReset} onClick={() => setModalGuardar(false)}>Cancelar</button>
                  <button className={styles.btnGuardar} onClick={confirmarGuardar} disabled={guardando}>
                    {guardando ? 'Guardando...' : <><CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Confirmar</>}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
