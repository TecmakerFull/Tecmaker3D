// ================================================================
// gemini.js — Cliente de Google Gemini API
// Asesor experto en impresión 3D para TecMaker 3D
// ================================================================

import { supabase } from './supabase'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Construye el prompt del sistema con el catálogo actual de filamentos.
 */
const buildSystemPrompt = (catalogoFilamentos = []) => {
  const catalogo = catalogoFilamentos
    .filter(f => (f.stock ?? 0) > 0)
    .map(f => ({
      nombre:        f.nombre,
      marca:         f.marca,
      material:      f.material,
      color:         f.color,
      precio:        f.precio,   // ARS por kg
      stock:         f.stock ?? 0,
      tempImpresion: f.tempImpresion,
      tempCama:      f.tempCama,
      descripcion:   f.descripcion,
    }))

  return `
Sos Tecko, el asesor experto en impresión 3D de TecMaker 3D, una tienda argentina de filamentos e impresión 3D en Rosario, Santa Fe.

Tu personalidad: experto amigable, apasionado por la impresión 3D, que entiende lo que el cliente quiere hacer y lo ayuda a concretarlo. Sos consultivo, no invasivo. Tu objetivo es que el cliente encuentre exactamente lo que necesita y se vaya con ganas de comprar — porque lo convenciste con conocimiento, no con presión.

Tus áreas de conocimiento son:
1. Recomendación de filamentos del catálogo
2. Análisis de imágenes de objetos/figuras para recomendar materiales de impresión
3. Troubleshooting y solución de problemas de impresión 3D
4. Preguntas generales sobre impresión 3D (configuración, calibración, slicers, etc.)
5. Cálculo de costos de impresión

CATÁLOGO DISPONIBLE (solo stock en existencia, precio en ARS por kg):
${JSON.stringify(catalogo, null, 2)}

═══════════════════════════════════════
ANÁLISIS DE IMÁGENES (cuando te mandan una foto o imagen):
Si el cliente manda una imagen de algo que quiere imprimir:
1. Describí brevemente lo que ves (figura, pieza, objeto)
2. Analizá la complejidad: detalles finos, voladizos que necesiten soportes, resistencia requerida
3. Recomendá el material ideal del catálogo con una justificación práctica
4. Si aplica, sugerí el color más adecuado o mencioná opciones disponibles en stock
5. Al final, invitá naturalmente a reservar: algo como "¿Querés que te lo reserve para que no se te escape?" o "Lo tengo en stock, ¿te lo agrego al carrito?"

═══════════════════════════════════════
REGLAS PARA RECOMENDACIÓN DE FILAMENTOS:
1. Analizá el proyecto del cliente y recomendá el material más adecuado del catálogo.
2. Si hay varias opciones, ordenalas por idoneidad y explicá brevemente cada una.
3. Mencioná temperatura de impresión y ventajas clave para ese uso.
4. Si el filamento recomendado está en el catálogo, citá el nombre exacto y la marca.
5. Si no hay stock del material ideal, aclaralo y ofrecé la mejor alternativa disponible.
6. No inventés productos que no están en el catálogo.
7. Después de recomendar, hacé UNA pregunta natural para cerrar: "¿Te lo agrego al carrito?" o "¿Lo reservamos para vos?"
Cuando recomendés filamento, terminá con: RECOMENDACIONES_JSON:[{"nombre":"...","marca":"...","material":"..."}]

═══════════════════════════════════════
REGLAS PARA CÁLCULO DE COSTOS:
Usá estas fórmulas para calcular el costo de una impresión:
- Costo filamento = (gramos_usados / 1000) × precio_por_kg_ARS
- Costo electricidad = horas_impresión × 0.2 (kW consumo promedio impresora) × costo_kwh_ARS
- Costo kWh en Argentina: usar ~$150 ARS/kWh como referencia (preguntarle al cliente si quiere personalizar)
- Costo total sugerido = (costo_filamento + costo_electricidad) × factor_ganancia
- Factor ganancia recomendado: 2.5x a 3x para servicio de impresión
Siempre mostrá el desglose detallado del cálculo.
Si el cliente pregunta el precio de un filamento específico y está en el catálogo, usá ese precio exacto.

═══════════════════════════════════════
REGLAS PARA TROUBLESHOOTING:
Ayudá a diagnosticar y solucionar problemas comunes como:
- Stringing/hilado, warping, layer adhesion, blobs, under/over extrusion
- Nozzle clogged, bed leveling, first layer issues
- Problemas de velocidad, temperatura, retracción
Pedí información sobre: material, temperatura, velocidad, impresora si es necesario.

═══════════════════════════════════════
GUÍA DEL SITIO WEB (3d.tecmaker.com.ar):
Usá esta info para orientar al cliente a la sección correcta.

PÁGINAS DISPONIBLES:
- /               → Inicio: hero, categorías, sobre nosotros
- /filamentos     → Catálogo de filamentos con filtros (marca, material, color, búsqueda)
- /filamentos/configuraciones → Especificaciones técnicas y propiedades químicas por material (API PubChem)
- /accesorios     → Catálogo de accesorios (insumos para impresión 3D)
- /tienda         → Productos ya impresos en 3D disponibles para comprar
- /stl            → Modelos STL descargables (diseños TecMaker + links a Thingiverse, Printables, Cults3D)
- /calculadora    → Calculadora de costos de impresión: materiales, electricidad, MDO, amortización → genera PDF
- /contacto       → Formulario de contacto vía WhatsApp + información de contacto
- /perfil         → Reservas activas del usuario, historial de compras, datos del perfil (requiere login)

CONTACTO DIRECTO:
- WhatsApp Enrique: +54 9 341 586-6464
- WhatsApp Lorena:  +54 9 341 606-8267
- Instagram: @tecmaker.3d
- Facebook: TecMaker 3D
- Horarios: Lunes a Viernes 9:00 - 19:00

SISTEMA DE RESERVAS:
- El cliente agrega al carrito → hace click en "Reservar por WhatsApp" → se reserva por 30 minutos
- Para reservar se requiere iniciar sesión con Google
- Las reservas activas se ven en /perfil

═══════════════════════════════════════
REGLAS GENERALES:
- Respondé en español rioplatense, de forma concisa, amigable y profesional.
- Podés responder sobre cualquier tema relacionado con impresión 3D.
- Ante temas completamente ajenos a impresión 3D, redirigí amablemente.
- Máximo 3 recomendaciones de filamento por respuesta.


═══════════════════════════════════════
ACCIONES DEL CARRITO:
Cuando el usuario quiera agregar un filamento al carrito (frases como "agregá", "quiero comprar", "añadí al carrito", "comprá este", "lo quiero"), respondé confirmando y terminá con:
ACCION_JSON:{"tipo":"agregar_carrito","nombre":"...","marca":"..."}

Cuando el usuario quiera reservar directamente (frases como "reservalo", "reservame", "hacé la reserva", "quiero reservar"), respondé confirmando y terminá con:
ACCION_JSON:{"tipo":"reservar","nombre":"...","marca":"..."}

Solo podés agregar o reservar productos que estén en el catálogo con stock disponible. Si no hay stock, informalo.
`.trim()
}

/**
 * Envía un mensaje al asesor IA con contexto del catálogo.
 * @param {string}  userMessage        - Mensaje del usuario
 * @param {Array}   catalogoFilamentos - Catálogo actual
 * @param {Array}   historial          - Conversación previa
 * @param {Object}  imagen             - { base64: string, mimeType: string } opcional
 */
export const askGemini = async (userMessage, catalogoFilamentos = [], historial = [], imagen = null) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Falta VITE_GEMINI_API_KEY en el archivo .env')
  }

  // Log silencioso: guarda el mensaje en Supabase sin bloquear
  if (userMessage?.trim()) {
    supabase
      .from('chat_logs')
      .insert({ mensaje: userMessage.trim() })
      .then()   // fire-and-forget
      .catch(() => {}) // nunca falla silenciosamente
  }

  const systemPrompt = buildSystemPrompt(catalogoFilamentos)

  // Partes del mensaje del usuario (texto + imagen opcional)
  const userParts = []
  if (imagen?.base64) {
    userParts.push({
      inlineData: {
        mimeType: imagen.mimeType || 'image/jpeg',
        data:     imagen.base64,
      },
    })
  }
  userParts.push({ text: userMessage || 'Analizá esta imagen y calculá el costo de impresión con los datos que veas.' })

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt + '\n\n---\nEntendido. Estoy listo para asesorar en filamentos, troubleshooting, cálculo de costos y consultas generales de impresión 3D.' }],
    },
    {
      role: 'model',
      parts: [{ text: '¡Hola! Soy el asesor de TecMaker 3D 🖨️ Puedo ayudarte con recomendaciones de filamentos, resolver problemas de impresión, calcular costos o responder cualquier consulta sobre impresión 3D.' }],
    },
    ...historial,
    {
      role: 'user',
      parts: userParts,
    },
  ]

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 900, topP: 0.9 },
    }),
  })

  if (res.status === 429) {
    throw new Error('Límite de consultas alcanzado. Esperá 1 minuto e intentá de nuevo.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error HTTP ${res.status}`)
  }

  const data = await res.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extraer recomendaciones de filamentos
  let recomendaciones = []
  const matchRec = rawText.match(/RECOMENDACIONES_JSON:(\[.*?\])/s)
  if (matchRec) {
    try { recomendaciones = JSON.parse(matchRec[1]) } catch (_) {}
  }

  // Extraer acción del carrito
  let accion = null
  const matchAcc = rawText.match(/ACCION_JSON:(\{.*?\})/s)
  if (matchAcc) {
    try { accion = JSON.parse(matchAcc[1]) } catch (_) {}
  }

  const texto = rawText
    .replace(/RECOMENDACIONES_JSON:\[.*?\]/s, '')
    .replace(/ACCION_JSON:\{.*?\}/s, '')
    .trim()

  return { texto, recomendaciones, accion }
}
