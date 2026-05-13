// ============================================================
// useSEO.js — Hook personalizado de SEO para TecMaker 3D
// ============================================================
// ¿Por qué existe este hook?
//
// TecMaker 3D es una SPA (Single Page Application) construida con React.
// En una SPA, el navegador carga UNA SOLA página HTML (index.html) y React
// se encarga de mostrar el contenido correcto según la URL, sin recargar.
//
// El problema: Google y otros buscadores ven SIEMPRE el mismo <title> y
// <meta description> (los del index.html base) sin importar en qué ruta
// esté el usuario. Eso hace que todas las páginas compitan por las mismas
// keywords y ninguna rankee bien.
//
// La solución: este hook modifica el DOM del <head> cada vez que el usuario
// navega a una nueva página, actualizando título, descripción y más.
// Google (y otros bots) termina viendo el metadata correcto para cada URL.
// ============================================================

import { useEffect } from 'react'

// Constantes compartidas por todas las páginas
const BASE     = 'TecMaker 3D'                    // sufijo que se agrega a todos los títulos
const BASE_URL = 'https://3d.tecmaker.com.ar'     // dominio de producción

/**
 * Hook reutilizable de SEO. Se llama una vez al inicio de cada componente de página.
 * Modifica el <head> del documento con metadata específica para esa ruta.
 *
 * Parámetros:
 * @param {string} title       - Título específico de la página (sin marca).
 *                               Resultado final: "Título | TecMaker 3D"
 * @param {string} description - Descripción corta (~155 caracteres).
 *                               Aparece debajo del título en los resultados de Google.
 * @param {string} path        - Ruta relativa del sitio. Ej: '/calculadora'
 *                               Se usa para construir la URL canónica y el OG:url
 * @param {string} [image]     - URL absoluta de una imagen para compartir en redes (opcional).
 *                               Si no se pasa, usa el logo de TecMaker 3D.
 * @param {Object} [jsonLd]    - Objeto de datos estructurados schema.org (opcional).
 *                               Google los lee para mostrar rich snippets en resultados.
 */
export default function useSEO({ title, description, path, image, jsonLd }) {

  // useEffect se ejecuta después de cada render cuando cambian las dependencias.
  // Acá solo queremos ejecutarlo cuando cambian los datos de SEO (al navegar).
  useEffect(() => {

    // ── Construimos los valores derivados ────────────────────────────────
    const fullTitle = `${title} | ${BASE}`          // ej: "Calculadora 3D | TecMaker 3D"
    const canonical = `${BASE_URL}${path}`          // ej: "https://3d.tecmaker.com.ar/calculadora"
    const ogImage   = image || `${BASE_URL}/logo.png` // imagen para redes sociales

    // ── 1. <title> ───────────────────────────────────────────────────────
    // Es la línea azul clickeable que aparece en Google.
    document.title = fullTitle

    // ── Helper: setMeta ──────────────────────────────────────────────────
    // Busca una etiqueta <meta> existente por su selector CSS.
    // Si la encuentra, actualiza su atributo. Si no existe, la crea y la agrega al <head>.
    // Así evitamos duplicar tags en cada navegación.
    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector)
      if (!el) {
        // La etiqueta no existe todavía: la creamos
        el = document.createElement('meta')
        // Extraemos el nombre del atributo identificador del selector CSS
        // Ej: 'meta[name="description"]' → attrName='name', attrVal='description'
        const [attrName, attrVal] = selector.match(/\[([^=]+)="([^"]+)"\]/)
          ? selector.match(/\[([^=]+)="([^"]+)"\]/).slice(1)
          : []
        if (attrName) el.setAttribute(attrName, attrVal)
        document.head.appendChild(el)
      }
      // Actualizamos el atributo 'content' con el nuevo valor
      el.setAttribute(attr, value)
    }

    // ── Helper: setLink ──────────────────────────────────────────────────
    // Igual que setMeta pero para etiquetas <link> (ej: canonical)
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
    }

    // ── 2. Meta description ──────────────────────────────────────────────
    // Texto que aparece bajo el título en resultados de Google (~155 chars).
    setMeta('meta[name="description"]', 'content', description)

    // Le decimos a los bots que indexen la página y sigan sus links.
    setMeta('meta[name="robots"]',      'content', 'index, follow')

    // ── 3. URL Canónica ──────────────────────────────────────────────────
    // Evita contenido duplicado: le dice a Google cuál es la URL "oficial" de esta página.
    setLink('canonical', canonical)

    // ── 4. Open Graph (OG) ───────────────────────────────────────────────
    // Protocolo usado por Facebook, WhatsApp, LinkedIn, etc.
    // Cuando alguien comparte el link, estas etiquetas determinan título,
    // descripción e imagen que se muestran en la vista previa.
    setMeta('meta[property="og:type"]',        'content', 'website')
    setMeta('meta[property="og:title"]',       'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]',         'content', canonical)
    setMeta('meta[property="og:image"]',       'content', ogImage)
    setMeta('meta[property="og:locale"]',      'content', 'es_AR')    // español argentino
    setMeta('meta[property="og:site_name"]',   'content', BASE)

    // ── 5. Twitter Cards ─────────────────────────────────────────────────
    // Equivalente de OG pero para Twitter/X.
    // 'summary_large_image' muestra una imagen grande en el tweet.
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]',       'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]',       'content', ogImage)

    // ── 6. JSON-LD (datos estructurados) ─────────────────────────────────
    // Formato que Google entiende para saber QUÉ ES exactamente esta página:
    // ¿es un negocio? ¿una herramienta web? ¿un producto? ¿un artículo?
    // Permite aparecer con "rich snippets" (resultados enriquecidos con info extra).
    // Solo se inyecta si la página lo proporciona (es opcional).
    if (jsonLd) {
      const id = 'seo-json-ld'
      let script = document.getElementById(id)
      if (!script) {
        // Primera vez: creamos el <script type="application/ld+json">
        script = document.createElement('script')
        script.id   = id
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      // Sobreescribimos el contenido (por si la página anterior dejó otro JSON-LD)
      script.textContent = JSON.stringify(jsonLd)
    }

    // ── Cleanup ───────────────────────────────────────────────────────────
    // React llama esta función cuando el componente se desmonta (el usuario navega a otra página).
    // Restauramos el título base para que no quede el título de la página anterior
    // durante el instante que tarda en cargarse la siguiente.
    return () => { document.title = BASE }

  }, [title, description, path, image, jsonLd])
  // Las dependencias del useEffect: solo se vuelve a ejecutar si alguno de estos valores cambia.
}
