import { useState, useRef, useMemo } from 'react'
import { CircularProgress } from '@mui/material'
import CloseIcon                from '@mui/icons-material/Close'
import SupportIcon              from '@mui/icons-material/Support'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import ThreeDRotationIcon       from '@mui/icons-material/ThreeDRotation'
import ViewInArOutlinedIcon     from '@mui/icons-material/ViewInArOutlined'
import ImageOutlinedIcon        from '@mui/icons-material/ImageOutlined'
import UploadFileOutlinedIcon   from '@mui/icons-material/UploadFileOutlined'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import SaveOutlinedIcon         from '@mui/icons-material/SaveOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import useStockStore from '../../stores/useStockStore'
import styles from './NuevoProductoModal.module.css'

// ============================================================
// NuevoProductoModal — Formulario para crear nuevos productos
// ============================================================

const TIPOS = [
  { value: 'filamento', label: 'Filamento', Icon: SupportIcon },
  { value: 'accesorio', label: 'Accesorio', Icon: ConstructionOutlinedIcon },
  { value: 'impresion', label: 'Impresión 3D', Icon: ThreeDRotationIcon },
  { value: 'stl',       label: 'Archivo STL', Icon: ViewInArOutlinedIcon },
]

const MATERIALES = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'HIPS', 'Nylon', 'Silk PLA', 'Marble PLA', 'Wood PLA', 'Otro']
const DIAMETROS  = ['1.75mm', '2.85mm', '3mm']
const PESOS      = ['250g', '500g', '1kg', '2kg', '3kg', '5kg']

const INITIAL_FORM = {
  tipo:             'filamento',
  nombre:           '',
  marca:            '',
  material:         '',
  color:            '',
  precio:           '',
  stock:            '',
  descripcion:      '',
  peso:             '',
  diametro:         '1.75mm',
  temp_impresion:   '',
  temp_cama:        '',
  especificaciones: '',
  link_compra:      '',
  imagen:           '',
}

const NuevoProductoModal = ({ onClose, onSuccess }) => {
  const crearProducto    = useStockStore((s) => s.crearProducto)
  const catalogoAccesorios = useStockStore((s) => s.catalogoAccesorios)

  // Categorías únicas extraídas de la BD
  const categoriasExistentes = useMemo(
    () => [...new Set(catalogoAccesorios.map(a => a.categoria).filter(Boolean))].sort(),
    [catalogoAccesorios]
  )

  const [form, setForm]               = useState(INITIAL_FORM)
  const [imagenFile, setImagenFile]   = useState(null)
  const [preview, setPreview]         = useState('')
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')
  const [ok, setOk]                   = useState(false)
  const [nuevaCat, setNuevaCat]       = useState(false)
  const [confirmClose, setConfirmClose] = useState(false) // mini confirm de descarte
  const fileRef = useRef()

  // Tiene datos si algún campo relevante está lleno
  const hasData = form.nombre.trim() || form.marca.trim() || form.precio || imagenFile || form.imagen.trim()

  const isFilamento  = form.tipo === 'filamento'
  const isAccesorio  = form.tipo === 'accesorio'
  const isSTL        = form.tipo === 'stl'

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleTipo = (tipo) => {
    setForm({ ...INITIAL_FORM, tipo, diametro: '1.75mm' })
    setNuevaCat(false)
    setConfirmClose(false)
    setError('')
  }

  // Cierre seguro: si hay datos pide confirmación; si no, cierra directo
  const handleClose = () => {
    if (hasData) {
      setConfirmClose(true)
    } else {
      onClose()
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5 MB')
      return
    }
    setImagenFile(file)
    setPreview(URL.createObjectURL(file))
    setForm((prev) => ({ ...prev, imagen: '' })) // limpiar URL manual si se elige archivo
  }

  const handleUrlImagen = (e) => {
    setForm((prev) => ({ ...prev, imagen: e.target.value }))
    setPreview(e.target.value)
    setImagenFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const validate = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio'
    if (!form.marca.trim())  return 'La marca / categoría es obligatoria'
    if (!form.precio)        return 'El precio es obligatorio'
    if (isFilamento && !form.material) return 'El material es obligatorio para filamentos'
    if (!imagenFile && !form.imagen.trim()) return 'Agregá una imagen (archivo o URL)'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setGuardando(true)
    setError('')

    const { error: supaErr } = await crearProducto(form, imagenFile || null)

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
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalBadge}>PANEL ADMIN</span>
            <h2 className={styles.modalTitle}>Nuevo Producto</h2>
            <p className={styles.modalSubtitle}>Completá los campos y se guardará en Supabase</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Mini confirmación de descarte */}
        {confirmClose && (
          <div className={styles.discardBanner}>
            <span className={styles.discardText}>¿Descartar los datos cargados?</span>
            <div className={styles.discardActions}>
              <button type="button" className={styles.discardCancel} onClick={() => setConfirmClose(false)}>Seguir editando</button>
              <button type="button" className={styles.discardConfirm} onClick={onClose}>Sí, descartar</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Selector de tipo */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Tipo de producto</label>
            <div className={styles.tipoGrid}>
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.tipoPill} ${form.tipo === t.value ? styles.tipoPillActive : ''}`}
                  onClick={() => handleTipo(t.value)}
                  id={`tipo-${t.value}`}
                >
                  <t.Icon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.4 }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fila principal: nombre + marca */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Nombre <span className={styles.req}>*</span>
              </label>
              <input
                name="nombre"
                className={styles.input}
                placeholder="Ej: PLA Negro 1kg"
                value={form.nombre}
                onChange={handleChange}
                id="input-nuevo-nombre"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                {isAccesorio ? 'Categoría' : 'Marca'} <span className={styles.req}>*</span>
              </label>
              {isAccesorio ? (
                !nuevaCat ? (
                  <>
                    <select
                      name="marca"
                      className={styles.select}
                      value={form.marca}
                      onChange={(e) => {
                        if (e.target.value === '__nueva__') {
                          setNuevaCat(true)
                          setForm(p => ({ ...p, marca: '' }))
                        } else {
                          handleChange(e)
                        }
                      }}
                      id="select-nuevo-categoria"
                    >
                      <option value="">Seleccioná categoría...</option>
                      {categoriasExistentes.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__nueva__">+ Nueva categoría</option>
                    </select>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      name="marca"
                      className={styles.input}
                      placeholder="Nombre de la nueva categoría"
                      value={form.marca}
                      onChange={handleChange}
                      autoFocus
                      id="input-nuevo-categoria-nueva"
                    />
                    <button
                      type="button"
                      onClick={() => { setNuevaCat(false); setForm(p => ({ ...p, marca: '' })) }}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.3rem' }}
                      title="Cancelar nueva categoría"
                    >×</button>
                  </div>
                )
              ) : (
                <input
                  name="marca"
                  className={styles.input}
                  placeholder="Ej: Elegoo"
                  value={form.marca}
                  onChange={handleChange}
                  id="input-nuevo-marca"
                />
              )}
            </div>
          </div>

          {/* Precio + Stock */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Precio (ARS) <span className={styles.req}>*</span>
              </label>
              <input
                name="precio"
                type="number"
                min="0"
                className={styles.input}
                placeholder="Ej: 15000"
                value={form.precio}
                onChange={handleChange}
                id="input-nuevo-precio"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Stock inicial</label>
              <input
                name="stock"
                type="number"
                min="0"
                className={styles.input}
                placeholder="Ej: 10"
                value={form.stock}
                onChange={handleChange}
                id="input-nuevo-stock"
              />
            </div>
          </div>

          {/* Campos específicos para filamentos */}
          {isFilamento && (
            <>
              <div className={styles.row3}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    Material <span className={styles.req}>*</span>
                  </label>
                  <select
                    name="material"
                    className={styles.select}
                    value={form.material}
                    onChange={handleChange}
                    id="select-nuevo-material"
                  >
                    <option value="">Seleccioná...</option>
                    {MATERIALES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Color</label>
                  <input
                    name="color"
                    className={styles.input}
                    placeholder="Ej: Negro"
                    value={form.color}
                    onChange={handleChange}
                    id="input-nuevo-color"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Diámetro</label>
                  <select
                    name="diametro"
                    className={styles.select}
                    value={form.diametro}
                    onChange={handleChange}
                    id="select-nuevo-diametro"
                  >
                    {DIAMETROS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.row3}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Peso</label>
                  <select
                    name="peso"
                    className={styles.select}
                    value={form.peso}
                    onChange={handleChange}
                    id="select-nuevo-peso"
                  >
                    <option value="">Seleccioná...</option>
                    {PESOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Temp. Extrusor</label>
                  <input
                    name="temp_impresion"
                    className={styles.input}
                    placeholder="Ej: 190–220°C"
                    value={form.temp_impresion}
                    onChange={handleChange}
                    id="input-nuevo-temp-impresion"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Temp. Cama</label>
                  <input
                    name="temp_cama"
                    className={styles.input}
                    placeholder="Ej: 60°C"
                    value={form.temp_cama}
                    onChange={handleChange}
                    id="input-nuevo-temp-cama"
                  />
                </div>
              </div>
            </>
          )}

          {/* Especificaciones para accesorios */}
          {isAccesorio && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Especificaciones técnicas</label>
              <input
                name="especificaciones"
                className={styles.input}
                placeholder="Ej: Compatibilidad, tamaño, material..."
                value={form.especificaciones}
                onChange={handleChange}
                id="input-nuevo-especificaciones"
              />
            </div>
          )}

          {/* Link compra para STL */}
          {isSTL && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Link de compra (Cults3D, etc.)</label>
              <input
                name="link_compra"
                className={styles.input}
                placeholder="https://cults3d.com/..."
                value={form.link_compra}
                onChange={handleChange}
                id="input-nuevo-link-compra"
              />
            </div>
          )}

          {/* Descripción */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Descripción</label>
            <textarea
              name="descripcion"
              className={styles.textarea}
              rows={3}
              placeholder="Breve descripción del producto..."
              value={form.descripcion}
              onChange={handleChange}
              id="input-nuevo-descripcion"
            />
          </div>

          {/* Imagen */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              Imagen <span className={styles.req}>*</span>
            </label>
            <div className={styles.imagenRow}>
              {/* Preview */}
              <div className={styles.preview}>
                {preview
                  ? <img src={preview} alt="preview" onError={() => setPreview('')} />
                  : <span className={styles.previewPlaceholder}><ImageOutlinedIcon sx={{ fontSize: '2.5rem', color: '#475569' }} /></span>
                }
              </div>

              <div className={styles.imagenOpciones}>
                {/* Upload archivo */}
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => fileRef.current?.click()}
                  id="btn-upload-imagen"
                >
                  <UploadFileOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.4 }} /> Subir imagen
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFile}
                />
                {imagenFile && (
                  <span className={styles.fileName}><CheckCircleOutlinedIcon sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.3, color: '#22c55e' }} /> {imagenFile.name}</span>
                )}

                <div className={styles.divider}>
                  <span>o pegar URL</span>
                </div>

                <input
                  name="imagen"
                  className={styles.input}
                  placeholder="https://..."
                  value={form.imagen}
                  onChange={handleUrlImagen}
                  id="input-nuevo-imagen-url"
                />
                <p className={styles.imagenHint}>
                  Máx. 5 MB · JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorMsg}><WarningAmberOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> {error}</div>
          )}

          {/* Botones */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${ok ? styles.submitBtnOk : ''}`}
              disabled={guardando || ok}
              id="btn-guardar-nuevo-producto"
            >
              {ok
                ? <><CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> ¡Producto creado!</>
                : guardando
                  ? <><CircularProgress size={14} sx={{ color: '#f59e0b' }} /> Guardando...</>
                  : <><SaveOutlinedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.3 }} /> Guardar Producto</>
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default NuevoProductoModal
