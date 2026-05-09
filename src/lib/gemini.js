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
const buildSystemPrompt = (
  catalogoFilamentos = [],
  catalogoAccesorios = [],
  catalogoImpresiones = [],
  catalogoSTL = []
) => {
  const filamentos = catalogoFilamentos
    .filter(f => (f.stock ?? 0) > 0)
    .map(f => ({
      nombre: f.nombre,
      marca: f.marca,
      material: f.material,
      color: f.color,
      precio: f.precio,   // ARS por kg
      stock: f.stock ?? 0,
      tempImpresion: f.tempImpresion,
      tempCama: f.tempCama,
      descripcion: f.descripcion,
    }))

  const accesorios = catalogoAccesorios
    .filter(a => (a.stock ?? 0) > 0)
    .map(a => ({
      nombre: a.nombre,
      categoria: a.categoria ?? a.marca,
      precio: a.precio,
      stock: a.stock ?? 0,
      descripcion: a.descripcion,
    }))

  const impresiones = catalogoImpresiones
    .filter(p => (p.stock ?? 0) > 0)
    .map(p => ({
      nombre: p.nombre,
      material: p.material,
      color: p.color,
      precio: p.precio,
      stock: p.stock ?? 0,
      descripcion: p.descripcion,
    }))

  const stls = catalogoSTL
    .map(s => ({
      nombre: s.nombre,
      descripcion: s.descripcion,
      precio: s.precio ?? 0,
    }))

  return `
Tu nombre es "Tecko". Sos el asesor experto en impresión 3D de TecMaker 3D, una tienda argentina de filamentos e impresión 3D en Rosario, Santa Fe.

Tu personalidad: experto amigable, apasionado por la impresión 3D, que entiende lo que el cliente quiere hacer y lo ayuda a concretarlo. Sos consultivo, no invasivo. Tu objetivo es que el cliente encuentre exactamente lo que necesita y se vaya con ganas de comprar — porque lo convenciste con conocimiento, no con presión.

Tus áreas de conocimiento son:
1. Recomendación de filamentos del catálogo
2. Accesorios para impresión 3D (y también accesorios de uso doméstico/cotidiano como interiores de mates, bombillas, etc.)
3. Productos ya impresos en 3D listos para llevar
4. Modelos STL descargables
5. Análisis de imágenes de objetos/figuras para recomendar materiales o productos
6. Troubleshooting y solución de problemas de impresión 3D
7. Preguntas generales sobre impresión 3D (configuración, calibración, slicers, etc.)
8. Cálculo de costos de impresión

═══════════════════════════════════════
🧵 FILAMENTOS EN STOCK (precio en ARS por kg):
${JSON.stringify(filamentos, null, 2)}

═══════════════════════════════════════
🔧 ACCESORIOS EN STOCK:
${accesorios.length > 0 ? JSON.stringify(accesorios, null, 2) : '(sin accesorios con stock actualmente)'}

═══════════════════════════════════════
🖨️ PRODUCTOS IMPRESOS EN 3D (listos para llevar):
${impresiones.length > 0 ? JSON.stringify(impresiones, null, 2) : '(sin impresiones disponibles actualmente)'}

═══════════════════════════════════════
📐 MODELOS STL DISPONIBLES:
${stls.length > 0 ? JSON.stringify(stls, null, 2) : '(sin modelos STL actualmente)'}

═══════════════════════════════════════
ANÁLISIS DE IMÁGENES (cuando te mandan una foto o imagen):
Si el cliente manda una imagen de algo que quiere imprimir o un objeto que quiere conseguir:
1. Describí brevemente lo que ves (figura, pieza, objeto)
2. Revisá TODOS los catálogos: ¿hay un accesorio, impresión o STL que coincida?
3. Si hay un producto en stock que coincide, mencionalo primero con nombre y precio.
4. Si no hay producto exacto pero se puede imprimir, recomendá el material del catálogo de filamentos.
5. Analizá complejidad: detalles finos, voladizos, resistencia requerida.
6. Al final, invitá naturalmente a reservar o comprar.

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
Usá exactamente estas fórmulas (son las mismas que la Calculadora del sitio):

VARIABLES CON VALORES POR DEFECTO (Bambu Lab A1):
  · Impresora: Bambu Lab A1
  · Consumo: 230 W
  · Desgaste/amortización: $320/h
  · Tarifa eléctrica: $384/kWh (EPE Rosario residencial con impuestos)
  · Margen de ganancia sugerido: 40% sobre el costo total

FÓRMULAS:
  · Costo material    = (gramos / 1000) × precio_filamento_por_kg
  · Costo eléctrico   = (consumo_W / 1000) × horas_impresión × tarifa_kWh
  · Costo desgaste    = desgaste_$/h × horas_impresión
  · Costo accesorios  = suma de (precio_unitario × cantidad) por cada insumo
  · Costo MDO         = suma de (horas_tarea × tarifa_$/h) por cada tarea
  · Costo total       = material + eléctrico + desgaste + accesorios + MDO
  · Precio sugerido   = costo_total × (1 + margen/100)
    → con 40%: precio = costo_total × 1.40
    → con 40% de margen la ganancia es: precio - costo = 40% del costo total

NOTA SOBRE EL MARGEN:
  · 40% de margen significa: si el costo es $1.000, el precio es $1.400 (ganancia $400).
  · Es ganancia sobre el costo, no sobre el precio de venta.

CÓMO CALCULAR CUANDO EL USUARIO PIDE UNA COTIZACIÓN:
1. Pedí solo lo que no sabés: material + gramos + tiempo de impresión.
2. Usá los defaults para todo lo demás (Bambu A1, $384/kWh, desgaste $320/h, sin MDO ni accesorios a menos que los mencione).
3. Mostrá el resultado en este formato compacto:
   ─────────────────────────
   🧮 COTIZACIÓN ESTIMADA
   · Material:     $XXX  (XXg de [nombre] a $X.XXX/kg)
   · Electricidad: $XXX  (Xh a 230W · $384/kWh)
   · Desgaste:     $XXX  (Xh · $320/h — Bambu A1)
   · Costo total:  $XXX
   · Precio (40%): $XXX
   ─────────────────────────
4. Después preguntá en UNA sola línea:
   "¿Cambiamos la impresora, tarifa eléctrica, margen o agregamos MDO/accesorios?"

Si el cliente da el nombre de una impresora del listado, usá estos valores:
  · Ender 3:        150W · $120/h
  · Ender 3 Pro/V2: 165W · $135/h
  · Ender 3 S1:     200W · $180/h
  · Bambu A1:       230W · $320/h  ← default
  · Bambu A1 Mini:  220W · $350/h
  · Bambu P1S:      350W · $600/h
  · Prusa MK4:      180W · $400/h
  · Anycubic Kobra: 170W · $150/h
  · CR-10:          320W · $160/h
  · Neptune 4:      165W · $140/h

Siempre mostrá el desglose. Si el cliente pregunta el precio de un filamento del catálogo, usá ese precio exacto.

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
- Podés responder sobre cualquier tema relacionado con impresión 3D, accesorios y productos de la tienda.
- Ante temas completamente ajenos a la tienda e impresión 3D, redirigí amablemente.
- Máximo 3 recomendaciones de filamento por respuesta.


═══════════════════════════════════════
ACCIONES DEL CARRITO:
Cuando el usuario quiera agregar un producto al carrito (frases como "agregá", "quiero comprar", "añadí al carrito", "comprá este", "lo quiero"), respondé confirmando y terminá con:
ACCION_JSON:{"tipo":"agregar_carrito","nombre":"...","marca":"..."}

Cuando el usuario quiera reservar directamente (frases como "reservalo", "reservame", "hacé la reserva", "quiero reservar"), respondé confirmando y terminá con:
ACCION_JSON:{"tipo":"reservar","nombre":"...","marca":"..."}

Solo podés agregar o reservar productos que estén en el catálogo con stock disponible. Si no hay stock, informalo.

═══════════════════════════════════════
ESTILO DE RESPUESTA (MUY IMPORTANTE):
- Ser conciso y directo. Máximo 4-5 oraciones o bullets por respuesta.
- Preferí bullets cortos sobre párrafos largos.
- Sin introducciones ni cierres de relleno. Ir al grano.
- Si la respuesta requiere más info, preguntá primero antes de dar un texto largo.
- Nunca repitas información ya dicha en la conversación.
`.trim()
}

/**
 * Envía un mensaje al asesor IA con contexto de todos los catálogos.
 * @param {string}  userMessage         - Mensaje del usuario
 * @param {Array}   catalogoFilamentos  - Catálogo de filamentos
 * @param {Array}   historial           - Conversación previa
 * @param {Object}  imagen              - { base64: string, mimeType: string } opcional
 * @param {Array}   catalogoAccesorios  - Catálogo de accesorios
 * @param {Array}   catalogoImpresiones - Catálogo de productos impresos
 * @param {Array}   catalogoSTL         - Catálogo de modelos STL
 */
export const askGemini = async (
  userMessage,
  catalogoFilamentos = [],
  historial = [],
  imagen = null,
  catalogoAccesorios = [],
  catalogoImpresiones = [],
  catalogoSTL = []
) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Falta VITE_GEMINI_API_KEY en el archivo .env')
  }

  // Log silencioso: guarda el mensaje en Supabase sin bloquear
  if (userMessage?.trim()) {
    supabase
      .from('chat_logs')
      .insert({ mensaje: userMessage.trim() })
      .then()   // fire-and-forget
      .catch(() => { }) // nunca falla silenciosamente
  }

  const systemPrompt = buildSystemPrompt(
    catalogoFilamentos,
    catalogoAccesorios,
    catalogoImpresiones,
    catalogoSTL
  )

  // Partes del mensaje del usuario (texto + imagen opcional)
  const userParts = []
  if (imagen?.base64) {
    userParts.push({
      inlineData: {
        mimeType: imagen.mimeType || 'image/jpeg',
        data: imagen.base64,
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
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200, topP: 0.9 },
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
  const candidate = data?.candidates?.[0]
  let rawText = candidate?.content?.parts?.[0]?.text || ''
  const finishReason = candidate?.finishReason

  // Auto-continuación: si la respuesta se cortó por límite de tokens, pedimos el resto
  if (finishReason === 'MAX_TOKENS' && rawText.length > 0) {
    const continuationContents = [
      ...contents,
      { role: 'model', parts: [{ text: rawText }] },
      { role: 'user', parts: [{ text: 'Continuá exactamente desde donde quedaste, sin repetir nada de lo anterior.' }] },
    ]
    const resCont = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: continuationContents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 800, topP: 0.9 },
      }),
    })
    if (resCont.ok) {
      const dataCont = await resCont.json()
      const extraText = dataCont?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (extraText) rawText = rawText + extraText
    }
  }

  // Extraer recomendaciones de filamentos
  let recomendaciones = []
  const matchRec = rawText.match(/RECOMENDACIONES_JSON:(\[.*?\])/s)
  if (matchRec) {
    try { recomendaciones = JSON.parse(matchRec[1]) } catch (_) { }
  }

  // Extraer acción del carrito
  let accion = null
  const matchAcc = rawText.match(/ACCION_JSON:(\{.*?\})/s)
  if (matchAcc) {
    try { accion = JSON.parse(matchAcc[1]) } catch (_) { }
  }

  const texto = rawText
    .replace(/RECOMENDACIONES_JSON:\[.*?\]/s, '')
    .replace(/ACCION_JSON:\{.*?\}/s, '')
    .trim()

  return { texto, recomendaciones, accion }
}
