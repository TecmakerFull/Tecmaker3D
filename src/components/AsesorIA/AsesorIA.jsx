import { useState, useRef, useEffect, useCallback } from 'react'
import AutoFixHighIcon   from '@mui/icons-material/AutoFixHigh'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import SendOutlinedIcon  from '@mui/icons-material/SendOutlined'
import MicIcon           from '@mui/icons-material/Mic'
import MicOffIcon        from '@mui/icons-material/MicOff'
import ImageOutlinedIcon    from '@mui/icons-material/ImageOutlined'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import CloseIcon         from '@mui/icons-material/Close'
import useStockStore     from '../../stores/useStockStore'
import useCartStore      from '../../stores/useCartStore'
import useReservasStore  from '../../stores/useReservasStore'
import useAuthStore      from '../../stores/useAuthStore'
import { askGemini }    from '../../lib/gemini'
import styles            from './AsesorIA.module.css'

const WHATSAPP_NUMBER = '5493415866464'
const formatPrecio = n => `$${Number(n).toLocaleString('es-AR')}`

// ================================================================
// AsesorIA — Chat flotante con Gemini · Asesor experto en 3D
// ================================================================

const MENSAJE_INICIAL = {
  role: 'model',
  text: '¡Hola! Soy Tecko, tu asesor de TecMaker 3D 🖨️\nPuedo ayudarte con:\n• 🧵 Recomendaciones de filamentos\n• 📷 Analizá una foto de lo que querés imprimir\n• 🔧 Problemas de impresión (troubleshooting)\n• 💰 Cálculo de costos\n• 🗺️ Orientarte en el sitio',
  recomendaciones: [],
}

const SUGERENCIAS = [
  'Necesito imprimir una pieza resistente al calor',
  '¿Cuánto cuesta imprimir 100g de PLA en 4 horas?',
  'Tengo stringing en mi impresión, ¿cómo lo soluciono?',
  '¿Qué filamento uso para piezas mecánicas?',
]

// ── Web Speech API helper ──────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechSupported   = !!SpeechRecognition

const AsesorIA = () => {
  const catalogoFilamentos  = useStockStore(s => s.catalogoFilamentos)
  const catalogoAccesorios  = useStockStore(s => s.catalogoAccesorios)
  const catalogoImpresiones = useStockStore(s => s.catalogoImpresiones)
  const catalogoSTL         = useStockStore(s => s.catalogoSTL)
  const catalogoCargado     = catalogoFilamentos.length > 0
  const addItem            = useCartStore(s => s.addItem)
  const openCart           = useCartStore(s => s.openCart)
  const clearCart          = useCartStore(s => s.clearCart)
  const crearReserva       = useReservasStore(s => s.crearReserva)
  const session            = useAuthStore(s => s.session)

  const [isOpen,      setIsOpen]      = useState(false)
  const [mensajes,    setMensajes]    = useState([MENSAJE_INICIAL])
  const [input,       setInput]       = useState('')
  const [pensando,    setPensando]    = useState(false)
  const [hasNew,      setHasNew]      = useState(false)
  const [escuchando,  setEscuchando]  = useState(false)
  const [imagen,      setImagen]      = useState(null)   // { base64, mimeType, preview }

  const endRef         = useRef(null)
  const inputRef       = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  // Scroll al fondo cuando llega respuesta
  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, isOpen])

  // Focus al abrir
  useEffect(() => {
    if (isOpen) {
      setHasNew(false)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => recognitionRef.current?.abort()
  }, [])

  const buildHistorial = () =>
    mensajes
      .filter(m => m.role !== 'model' || m !== MENSAJE_INICIAL)
      .map(m => ({
        role:  m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }))

  const enviar = async (texto = input.trim()) => {
    if ((!texto && !imagen) || pensando || !catalogoCargado) return
    setInput('')
    const imagenEnviar = imagen
    setImagen(null)

    const mensajeUser = {
      role: 'user',
      text: texto || '📷 Imagen del laminador',
      recomendaciones: [],
      imagenPreview: imagenEnviar?.preview || null,
    }
    setMensajes(prev => [...prev, mensajeUser])
    setPensando(true)

    try {
      const { texto: respuesta, recomendaciones, accion } = await askGemini(
        texto,
        catalogoFilamentos,
        buildHistorial(),
        imagenEnviar,
        catalogoAccesorios,
        catalogoImpresiones,
        catalogoSTL
      )
      setMensajes(prev => [...prev, { role: 'model', text: respuesta, recomendaciones }])
      if (!isOpen) setHasNew(true)

      // Ejecutar acción del carrito si la IA lo indica
      if (accion?.tipo === 'agregar_carrito' || accion?.tipo === 'reservar') {
        const producto = catalogoFilamentos.find(
          f => f.nombre?.toLowerCase() === accion.nombre?.toLowerCase()
            || (f.nombre?.toLowerCase().includes(accion.nombre?.toLowerCase()) && accion.nombre?.length > 3)
        )

        if (producto) {
          addItem(producto)

          if (accion.tipo === 'reservar') {
            // Flujo de reserva: requiere sesión
            if (!session) {
              setMensajes(prev => [...prev, {
                role: 'model',
                text: '⚠️ Para reservar necesitás iniciar sesión primero. Te abrí el carrito para que puedas hacerlo.',
                recomendaciones: [], isError: true,
              }])
              openCart()
            } else {
              try {
                const resultado = await crearReserva(producto.id, 1)
                if (!resultado?.error) {
                  const mensaje =
                    `*RESERVA DE PEDIDO - TecMaker 3D*\n\n` +
                    `*Producto:*\n  - ${producto.nombre} x1: ${formatPrecio(producto.precio)}\n\n` +
                    `*Total: ${formatPrecio(producto.precio)}*\n\n` +
                    `✅ Reserva confirmada por 30 minutos\n` +
                    `--------------------------------\n` +
                    `Una vez confirmada la disponibilidad, podés abonar por Mercado Pago:\n\n` +
                    `*Nombre:* Enrique Cesar Temperini\n` +
                    `*Alias:* tecmaker.3d\n` +
                    `*CVU:* 0000003100076322336301\n\n` +
                    `Enviarme el comprobante por este chat y coordinamos la entrega. Gracias!`
                  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank')
                  clearCart()
                } else {
                  setMensajes(prev => [...prev, {
                    role: 'model',
                    text: `⚠️ No se pudo reservar: ${resultado.error?.message || resultado.error}`,
                    recomendaciones: [], isError: true,
                  }])
                }
              } catch (e) {
                console.error('[Reserva desde chat]', e)
              }
            }
          } else {
            openCart()
          }
        }
      }
    } catch (err) {
      const esRateLimit = err.message?.toLowerCase().includes('límite') || err.message?.toLowerCase().includes('limit')
      const msgError = esRateLimit
        ? `⏱️ ${err.message}`
        : `Ups, ocurrió un error: ${err.message}`
      setMensajes(prev => [...prev, {
        role: 'model',
        text: msgError,
        recomendaciones: [],
        isError: true,
      }])
    } finally {
      setPensando(false)
    }
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const resetChat = () => {
    setMensajes([MENSAJE_INICIAL])
    setInput('')
    setImagen(null)
    recognitionRef.current?.abort()
    setEscuchando(false)
  }

  // ── Manejo de imagen ───────────────────────────────────────────
  const handleImagen = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl  = ev.target.result
      const base64   = dataUrl.split(',')[1]
      const mimeType = file.type || 'image/jpeg'
      setImagen({ base64, mimeType, preview: dataUrl })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset para poder subir la misma imagen
  }

  // ── Web Speech API ─────────────────────────────────────────────
  const toggleVoz = useCallback(() => {
    if (!speechSupported) return

    if (escuchando) {
      recognitionRef.current?.stop()
      setEscuchando(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang           = 'es-AR'
    recognition.continuous     = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setEscuchando(true)

    recognition.onresult = e => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setEscuchando(false)
      // Auto-enviar tras 400ms para dar tiempo a ver el texto
      setTimeout(() => enviar(transcript), 400)
    }

    recognition.onerror = () => setEscuchando(false)
    recognition.onend   = () => setEscuchando(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [escuchando, enviar])

  const apiKeyOk      = !!import.meta.env.VITE_GEMINI_API_KEY
  const inputDisabled = pensando || !apiKeyOk || !catalogoCargado

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen(o => !o)}
        title="Asesor experto en impresión 3D"
        aria-label="Abrir asesor IA"
      >
        {isOpen
          ? <CloseOutlinedIcon sx={{ fontSize: '1.4rem' }} />
          : <AutoFixHighIcon  sx={{ fontSize: '1.4rem' }} />
        }
        {hasNew && !isOpen && <span className={styles.newDot} />}
        {!isOpen && <span className={styles.fabLabel}>Asesor IA</span>}
      </button>

      {/* ── Panel de chat ── */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`} role="dialog" aria-label="Asesor de impresión 3D">

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>
              <AutoFixHighIcon sx={{ fontSize: '1rem', color: '#f59e0b' }} />
            </div>
            <div>
              <p className={styles.headerTitle}>Asesor TecMaker</p>
              <p className={styles.headerSub}>Powered by Gemini AI ✨</p>
            </div>
          </div>
          <button className={styles.resetBtn} onClick={resetChat} title="Nueva conversación">
            ↺
          </button>
        </div>

        {/* Alerta si falta API key */}
        {!apiKeyOk && (
          <div className={styles.apiAlert}>
            ⚠️ Falta <code>VITE_GEMINI_API_KEY</code> en el <code>.env</code>
          </div>
        )}

        {/* Mensajes */}
        <div className={styles.messages}>

          {mensajes.map((m, i) => (
            <div key={i} className={`${styles.msgWrap} ${m.role === 'user' ? styles.msgUser : styles.msgModel}`}>
              {m.role === 'model' && (
                <div className={styles.botAvatar}>
                  <AutoFixHighIcon sx={{ fontSize: '0.75rem', color: '#f59e0b' }} />
                </div>
              )}
              <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleModel} ${m.isError ? styles.bubbleError : ''}`}>
                {/* Imagen adjunta en el mensaje */}
                {m.imagenPreview && (
                  <img
                    src={m.imagenPreview}
                    alt="Imagen adjunta"
                    className={styles.msgImagen}
                  />
                )}
                {m.text.split('\n').map((line, li) => (
                  <span key={li}>{line}{li < m.text.split('\n').length - 1 && <br />}</span>
                ))}

                {/* Chips de filamentos recomendados */}
                {m.recomendaciones?.length > 0 && (
                  <div className={styles.chips}>
                    {m.recomendaciones.map((r, ri) => (
                      <a
                        key={ri}
                        href="/filamentos"
                        className={styles.chip}
                        title={`Ver ${r.nombre} en el catálogo`}
                      >
                        🧵 {r.nombre} · {r.marca}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Indicador de escritura */}
          {pensando && (
            <div className={`${styles.msgWrap} ${styles.msgModel}`}>
              <div className={styles.botAvatar}>
                <AutoFixHighIcon sx={{ fontSize: '0.75rem', color: '#f59e0b' }} />
              </div>
              <div className={`${styles.bubble} ${styles.bubbleModel} ${styles.typing}`}>
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Indicador de escucha de voz */}
          {escuchando && (
            <div className={`${styles.msgWrap} ${styles.msgModel}`}>
              <div className={styles.botAvatar}>
                <AutoFixHighIcon sx={{ fontSize: '0.75rem', color: '#f59e0b' }} />
              </div>
              <div className={`${styles.bubble} ${styles.bubbleModel}`}>
                🎙️ Escuchando... hablá ahora
              </div>
            </div>
          )}

          {/* Sugerencias iniciales */}
          {mensajes.length === 1 && !pensando && (
            <div className={styles.sugerencias}>
              {SUGERENCIAS.map((s, i) => (
                <button key={i} className={styles.sugerencia} onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className={styles.inputWrapper}>

          {/* Preview de imagen adjunta */}
          {imagen && (
            <div className={styles.imagenPreview}>
              <img src={imagen.preview} alt="Vista previa" className={styles.previewImg} />
              <button
                className={styles.removeImagen}
                onClick={() => setImagen(null)}
                title="Quitar imagen"
              >
                <CloseIcon sx={{ fontSize: '0.9rem' }} />
              </button>
            </div>
          )}

          {/* Inputs ocultos — archivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImagen}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleImagen}
          />

          {/* Fila superior: textarea + botón enviar */}
          <div className={styles.textareaRow}>
            <textarea
              ref={inputRef}
              className={styles.textarea}
              placeholder={
                !catalogoCargado
                  ? '⏳ Cargando catálogo...'
                  : escuchando
                  ? '🎙️ Escuchando...'
                  : imagen
                  ? 'Agregá un comentario o enviá la imagen...'
                  : 'Consultá sobre filamentos, problemas o costos...'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={inputDisabled}
            />
            <button
              className={styles.sendBtn}
              onClick={() => enviar()}
              disabled={(!input.trim() && !imagen) || inputDisabled}
              aria-label="Enviar mensaje"
            >
              <SendOutlinedIcon sx={{ fontSize: '1.1rem' }} />
            </button>
          </div>

          {/* Fila inferior: barra de herramientas sutil */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              {/* Botón galería */}
              <button
                className={`${styles.toolBtn} ${imagen ? styles.toolBtnActive : ''}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={inputDisabled}
                aria-label="Adjuntar imagen desde galería"
                title="Elegir imagen de la galería"
              >
                <ImageOutlinedIcon sx={{ fontSize: '1rem' }} />
              </button>

              {/* Botón cámara */}
              <button
                className={styles.toolBtn}
                onClick={() => cameraInputRef.current?.click()}
                disabled={inputDisabled}
                aria-label="Tomar foto con la cámara"
                title="Tomar una foto ahora"
              >
                <CameraAltOutlinedIcon sx={{ fontSize: '1rem' }} />
              </button>

              {/* Botón micrófono */}
              {speechSupported && (
                <button
                  className={`${styles.toolBtn} ${escuchando ? styles.toolBtnMicActive : ''}`}
                  onClick={toggleVoz}
                  disabled={inputDisabled}
                  aria-label={escuchando ? 'Detener grabación' : 'Hablar'}
                  title={escuchando ? 'Detener' : 'Hablar con el asesor'}
                >
                  {escuchando
                    ? <MicOffIcon sx={{ fontSize: '1rem' }} />
                    : <MicIcon    sx={{ fontSize: '1rem' }} />
                  }
                </button>
              )}
            </div>
            <span className={styles.toolbarHint}>Enter para enviar · Shift+Enter nueva línea</span>
          </div>
        </div>

      </div>
    </>
  )
}

export default AsesorIA
