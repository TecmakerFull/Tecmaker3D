import { useState, useRef } from 'react'
import { CircularProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import useStockStore from '../../stores/useStockStore'
import styles from './NuevoProductoModal.module.css'  // reutiliza los mismos estilos

// ============================================================
// EditarProductoModal — Editar todos los campos de un producto
// ============================================================

const MATERIALES = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'HIPS', 'Nylon', 'Silk PLA', 'Marble PLA', 'Wood PLA', 'Otro']
const DIAMETROS  = ['1.75mm', '2.85mm', '3mm']
const PESOS      = ['250g', '500g', '1kg', '2kg', '3kg', '5kg']

const EditarProductoModal = ({ producto, onClose, onSuccess }) => {
  const actualizarProducto = useStockStore((s) => s.actualizarProducto)
  const eliminarProducto   = useStockStore((s) => s.eliminarProducto)
  const precios            = useStockStore((s) => s.precios)

  // Pre-rellenar con datos actuales
  const [form, setForm] = useState({
    tipo:             producto.tipo        || 'filamento',
    nombre:           producto.nombre      || '',
    marca:            producto.marca       || producto.categoria || '',
    material:         producto.material    || '',
    color:            producto.color       || '',
    precio:           String(precios[producto.id] ?? producto.precio ?? ''),
    descripcion:      producto.descripcion || '',
    peso:             producto.peso        || '',
    diametro:         producto.diametro    || '1.75mm',
    temp_impresion:   producto.temp_impresion || producto.tempImpresion || '',
    temp_cama:        producto.temp_cama   || producto.tempCama || '',
    especificaciones: producto.especificaciones || '',
    link_compra:      producto.link_compra || '',
    imagen:           producto.imagen      || '',
  })

  const [imagenFile, setImagenFile] = useState(null)
  const [preview,    setPreview]    = useState(producto.imagen || '')
  const [guardando,  setGuardando]  = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error,      setError]      = useState('')
  const [ok,         setOk]         = useState(false)
  const fileRef = useRef()

  const isFilamento = form.tipo === 'filamento'
  const isAccesorio = form.tipo === 'accesorio'
  const isSTL       = form.tipo === 'stl'

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede superar los 5 MB'); return }
    setImagenFile(file)
    setPreview(URL.createObjectURL(file))
    setForm((prev) => ({ ...prev, imagen: '' }))
  }

  const handleUrlImagen = (e) => {
    setForm((prev) => ({ ...prev, imagen: e.target.value }))
    setPreview(e.target.value)
    setImagenFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleEliminar = async () => {
    if (!window.confirm(`¿Desactivar "${producto.nombre}" del catálogo?\n\nEsta acción lo ocultará del sitio web.`)) return
    setEliminando(true)
    await eliminarProducto(producto.id)
    setEliminando(false)
    onSuccess?.()
    onClose()
  }

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio'
    if (!form.marca.trim())  return 'La marca / categoría es obligatoria'
    if (!form.precio)        return 'El precio es obligatorio'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setGuardando(true)
    setError('')

    const { error: supaErr } = await actualizarProducto(producto.id, form, imagenFile || null)

    setGuardando(false)

    if (supaErr) {
      setError(`Error al guardar: ${supaErr.message}`)
      return
    }

    setOk(true)
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1200)
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalBadge}>✏️ EDITAR PRODUCTO</span>
            <h2 className={styles.modalTitle}>{producto.nombre}</h2>
            <p className={styles.modalSubtitle}>ID: {producto.id} · Modificá los campos y guardá</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Nombre + Marca */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Nombre <span className={styles.req}>*</span></label>
              <input name="nombre" className={styles.input} value={form.nombre} onChange={handleChange} id="edit-nombre" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                {isAccesorio ? 'Categoría' : 'Marca'} <span className={styles.req}>*</span>
              </label>
              <input name="marca" className={styles.input} value={form.marca} onChange={handleChange} id="edit-marca" />
            </div>
          </div>

          {/* Precio */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Precio (ARS) <span className={styles.req}>*</span></label>
              <input name="precio" type="number" min="0" className={styles.input} value={form.precio} onChange={handleChange} id="edit-precio" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Tipo</label>
              <input className={styles.input} value={form.tipo} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>

          {/* Campos de filamentos */}
          {isFilamento && (
            <>
              <div className={styles.row3}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Material <span className={styles.req}>*</span></label>
                  <select name="material" className={styles.select} value={form.material} onChange={handleChange} id="edit-material">
                    <option value="">Seleccioná...</option>
                    {MATERIALES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Color</label>
                  <input name="color" className={styles.input} value={form.color} onChange={handleChange} id="edit-color" />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Diámetro</label>
                  <select name="diametro" className={styles.select} value={form.diametro} onChange={handleChange} id="edit-diametro">
                    {DIAMETROS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.row3}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Peso</label>
                  <select name="peso" className={styles.select} value={form.peso} onChange={handleChange} id="edit-peso">
                    <option value="">Seleccioná...</option>
                    {PESOS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Temp. Extrusor</label>
                  <input name="temp_impresion" className={styles.input} value={form.temp_impresion} onChange={handleChange} id="edit-temp-impresion" />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Temp. Cama</label>
                  <input name="temp_cama" className={styles.input} value={form.temp_cama} onChange={handleChange} id="edit-temp-cama" />
                </div>
              </div>
            </>
          )}

          {/* Especificaciones para accesorios */}
          {isAccesorio && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Especificaciones técnicas</label>
              <input name="especificaciones" className={styles.input} value={form.especificaciones} onChange={handleChange} id="edit-especificaciones" />
            </div>
          )}

          {/* Link compra para STL */}
          {isSTL && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Link de compra</label>
              <input name="link_compra" className={styles.input} value={form.link_compra} onChange={handleChange} id="edit-link-compra" />
            </div>
          )}

          {/* Descripción */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Descripción</label>
            <textarea name="descripcion" className={styles.textarea} rows={3} value={form.descripcion} onChange={handleChange} id="edit-descripcion" />
          </div>

          {/* Imagen */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Imagen</label>
            <div className={styles.imagenRow}>
              <div className={styles.preview}>
                {preview
                  ? <img src={preview} alt="preview" onError={() => setPreview('')} />
                  : <span className={styles.previewPlaceholder}>🖼️</span>
                }
              </div>
              <div className={styles.imagenOpciones}>
                <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()} id="edit-upload-imagen">
                  📁 Cambiar imagen
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                {imagenFile && <span className={styles.fileName}>✓ {imagenFile.name}</span>}
                <div className={styles.divider}><span>o pegar URL</span></div>
                <input name="imagen" className={styles.input} placeholder="https://..." value={form.imagen} onChange={handleUrlImagen} id="edit-imagen-url" />
                <p className={styles.imagenHint}>Máx. 5 MB · JPG, PNG, WebP</p>
              </div>
            </div>
          </div>

          {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleEliminar}
              disabled={guardando || eliminando || ok}
              id="btn-eliminar-producto"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#ef4444',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: 'auto',
                transition: 'all 0.2s ease',
              }}
            >
              {eliminando ? '...' : '🗑 Eliminar'}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={guardando || eliminando}>Cancelar</button>
            <button type="submit" className={`${styles.submitBtn} ${ok ? styles.submitBtnOk : ''}`} disabled={guardando || eliminando || ok} id="btn-guardar-edicion">
              {ok
                ? '✅ ¡Guardado!'
                : guardando
                  ? <><CircularProgress size={14} sx={{ color: '#f59e0b' }} /> Guardando...</>
                  : '💾 Guardar Cambios'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default EditarProductoModal
