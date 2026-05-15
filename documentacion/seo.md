# SEO en TecMaker 3D

## El problema de SEO en una SPA

TecMaker 3D es una **SPA (Single Page Application)** construida con React + Vite.
En una SPA, el servidor siempre devuelve el mismo `index.html` sin importar la URL.
React toma ese HTML vacío y construye el contenido en el navegador con JavaScript.

```
Usuario visita /calculadora
       ↓
Servidor devuelve index.html (siempre el mismo)
       ↓
React carga y renderiza <Calculadora />
       ↓
El usuario ve la calculadora ✅
```

**El problema:** Google y otros buscadores leen el HTML *antes* de ejecutar JavaScript.
Lo que ven es el `index.html` genérico con el mismo `<title>` para TODAS las páginas.

```
Google visita /calculadora
       ↓
Ve: <title>TecMaker 3D</title>  ← igual que la home, filamentos, etc.
       ↓
No sabe que esta página ES una calculadora de costos de impresión 3D ❌
```

---

## La solución: hook `useSEO`

**Archivo:** `src/hooks/useSEO.js`

Se trata de un **hook de React** (función reutilizable con lógica de efecto) que modifica
el `<head>` del documento dinámicamente cuando el usuario navega a cada página.

Aunque Google ejecuta JavaScript en su rastreo moderno, hacerlo bien desde el código
garantiza que los bots que **no** ejecutan JS (Bing, LinkedIn, WhatsApp previews) también
lean los datos correctos.

### Uso básico

```jsx
// En cualquier componente de página:
import useSEO from '../../hooks/useSEO'

const MiPagina = () => {
  useSEO({
    title:       'Título de la página',    // sin marca, se agrega automático
    description: 'Descripción corta...',   // ~155 caracteres
    path:        '/mi-ruta',               // para construir la URL canónica
  })

  return <div>...</div>
}
```

### Parámetros completos

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `title` | `string` | ✅ | Título de la página. Resultado final: `"Título \| TecMaker 3D"` |
| `description` | `string` | ✅ | Meta description. Máx. ~155 caracteres. Aparece bajo el título en Google. |
| `path` | `string` | ✅ | Ruta relativa. Ej: `'/calculadora'`. Construye la URL canónica. |
| `image` | `string` | ❌ | URL absoluta de imagen OG. Default: logo de TecMaker 3D. |
| `jsonLd` | `Object` | ❌ | Objeto schema.org para datos estructurados (rich snippets). |

---

## Qué modifica en el `<head>`

### 1. `<title>` — Línea azul clickeable en Google

```html
<title>Calculadora de Costos de Impresión 3D | TecMaker 3D</title>
```

Es lo más importante para el ranking. Cada página tiene el suyo.

### 2. Meta description — Texto descriptivo en resultados

```html
<meta name="description" content="Calculá gratis el precio de venta de tus impresiones 3D..." />
```

No afecta directamente el ranking pero sí el **CTR** (cuánta gente hace click).

### 3. URL Canónica — Evita contenido duplicado

```html
<link rel="canonical" href="https://3d.tecmaker.com.ar/calculadora" />
```

Le dice a Google: "Esta es la URL oficial de esta página". Evita que indexe
variantes con parámetros (`?ref=...`) como páginas separadas.

### 4. Open Graph — Vista previa en redes sociales

```html
<meta property="og:title"       content="Calculadora de Costos de Impresión 3D | TecMaker 3D" />
<meta property="og:description" content="Calculá gratis el precio de venta..." />
<meta property="og:image"       content="https://3d.tecmaker.com.ar/logo.png" />
<meta property="og:url"         content="https://3d.tecmaker.com.ar/calculadora" />
```

Cuando alguien comparte el link en WhatsApp, Facebook o LinkedIn, estas etiquetas
determinan qué imagen, título y texto se muestran en la vista previa.

### 5. Twitter Cards

```html
<meta name="twitter:card"  content="summary_large_image" />
<meta name="twitter:title" content="Calculadora de Costos de Impresión 3D | TecMaker 3D" />
```

Equivalente de Open Graph pero específico para Twitter/X.

### 6. JSON-LD (datos estructurados)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Calculadora de Costos de Impresión 3D — TecMaker 3D",
  ...
}
</script>
```

Formato que Google usa para entender exactamente **qué es** la página y mostrar
*rich snippets* (resultados enriquecidos con información extra, estrellas, precios, etc.).

---

## Implementación por página

| Página | `@type` JSON-LD | Keywords objetivo |
|---|---|---|
| **Home** `/` | `LocalBusiness` | "impresión 3d rosario", "filamentos rosario" |
| **Calculadora** `/calculadora` | `WebApplication` | "calculadora 3d", "calculadora costos impresión 3d" |
| **Filamentos** `/filamentos` | *(sin JSON-LD)* | "filamentos PLA", "filamentos PETG rosario" |
| **Tienda** `/tienda` | *(sin JSON-LD)* | "productos impresos 3d", "figuras 3d rosario" |
| **Contacto** `/contacto` | *(sin JSON-LD)* | "tecmaker 3d contacto", "impresión 3d rosario contacto" |

---

## Otros archivos SEO

### `public/sitemap.xml`

Le dice a Google qué páginas existen y con qué prioridad indexarlas.
La calculadora tiene prioridad `0.9` (casi máxima) para que Google la encuentre rápido.

**Cómo enviar el sitemap a Google:**
1. Entrar a [Google Search Console](https://search.google.com/search-console)
2. Agregar la propiedad `3d.tecmaker.com.ar`
3. Ir a "Sitemaps" → ingresar `sitemap.xml` → Enviar  (Ya realizado)

### `public/robots.txt`

Le dice a los bots qué pueden y qué no pueden indexar.
La configuración actual permite todo:

```
User-agent: *
Allow: /
Sitemap: https://3d.tecmaker.com.ar/sitemap.xml
```

---

## Cómo agregar SEO a una nueva página

```jsx
// 1. Importar el hook
import useSEO from '../../hooks/useSEO'

// 2. Llamarlo al inicio del componente (antes del return)
const NuevaPagina = () => {
  useSEO({
    title:       'Título descriptivo con keywords',
    description: 'Descripción de ~155 chars con las palabras clave más importantes primero.',
    path:        '/ruta-de-la-pagina',
    // jsonLd: { ... }  ← opcional, solo si querés datos estructurados
  })

  return ( ... )
}

// 3. Agregar la URL al sitemap.xml en /public/sitemap.xml
```

> **Tip:** El `title` y `description` son lo más importante. Poné las keywords más relevantes
> **al principio** del texto, no al final.
