# 🎨 TecMaker 3D — Guía de Estilos Globales

> **Versión:** 1.0 — Mayo 2026  
> **Dominio:** [3d.tecmaker.com.ar](https://3d.tecmaker.com.ar)  
> **Uso:** Diseño web · Publicaciones de Instagram · Carteles · Propagandas · Prompts para IA generativa de imágenes

---

## 🏷️ Identidad de Marca

| Atributo | Valor |
|---|---|
| **Nombre** | TecMaker 3D |
| **Rubro** | Venta de filamentos, accesorios y productos impresos en 3D |
| **Personalidad** | Técnico · Confiable · Moderno · Industrial |
| **Tono visual** | Oscuro, premium, futurista con detalles dorado-ámbar |
| **Audiencia** | Makers, entusiastas de impresión 3D, emprendedores, estudiantes de tecnología |

---

## 🎨 Paleta de Colores

### Colores Primarios

| Nombre | HEX | RGB | Uso |
|---|---|---|---|
| **Primary — Amber Gold** | `#f59e0b` | rgb(245, 158, 11) | Color principal de marca. Títulos destacados, botones CTA, acentos, logo. |
| **Primary Dark** | `#d97706` | rgb(217, 119, 6) | Gradientes, hover states, variante más profunda del dorado. |
| **Primary Hover Light** | `#fbbf24` | rgb(251, 191, 36) | Efecto hover en links y elementos interactivos. |

### Colores de Fondo (Dark Mode)

| Nombre | HEX | RGB | Uso |
|---|---|---|---|
| **BG — Deep Black** | `#0f0f0f` | rgb(15, 15, 15) | Fondo principal de la app y publicaciones oscuras. |
| **Surface** | `#1a1a1a` | rgb(26, 26, 26) | Cards, paneles, secciones elevadas. |
| **Surface 2** | `#252525` | rgb(37, 37, 37) | Inputs, elementos de segunda profundidad. |
| **Surface Dark** | `#0a0a0a` | rgb(10, 10, 10) | Footer, fondos ultra-profundos. |
| **Modal Dark** | `#161616` | rgb(22, 22, 22) | Modales, overlays. |

### Colores de Texto

| Nombre | HEX | RGB | Uso |
|---|---|---|---|
| **Text** | `#f1f5f9` | rgb(241, 245, 249) | Texto principal sobre fondo oscuro. |
| **Text Muted** | `#94a3b8` | rgb(148, 163, 184) | Texto secundario, subtítulos, descripciones. |
| **Text Subtle** | `#64748b` | rgb(100, 116, 139) | Placeholders, etiquetas de formulario, texto terciario. |
| **Text Dark** | `#475569` | rgb(71, 85, 105) | Texto oscuro sobre fondos claros (si se usa fondo blanco). |
| **Text Deep** | `#334155` | rgb(51, 65, 85) | Textos de copyright, pie de página. |

### Color Secundario (Acento)

| Nombre | HEX | RGB | Uso |
|---|---|---|---|
| **Secondary — Indigo** | `#6366f1` | rgb(99, 102, 241) | Badges de tipo de producto, botones secundarios, detalles alternativos. |
| **Indigo Light** | `#818cf8` | rgb(129, 140, 248) | Versión clara del indigo para texto sobre fondo oscuro. |

### Colores de Estado

| Nombre | HEX | RGB | Uso |
|---|---|---|---|
| **Success — Green** | `#22c55e` | rgb(34, 197, 94) | Stock disponible, confirmaciones, éxito. |
| **Warning — Amber** | `#f59e0b` | rgb(245, 158, 11) | Stock bajo, advertencias (comparte con Primary). |
| **Danger — Red** | `#ef4444` | rgb(239, 68, 68) | Sin stock, errores, alertas. |
| **Reserved — Indigo** | `#818cf8` | rgb(129, 140, 248) | Stock reservado o en proceso. |

### Colores para Fondos Claros (uso alternativo)

> Aunque el sitio es predominantemente dark, en algunos contextos (cards de productos) se usa fondo claro.

| Nombre | HEX | Uso |
|---|---|---|
| **White Card** | `#ffffff` | Fondo de cards de productos en sección de catálogo. |
| **Light Surface** | `#fafafa` | Footer de cards, secciones alternativas. |
| **Light Border** | `#e2e8f0` | Bordes sobre fondos claros. |
| **Light Text** | `#0f172a` | Títulos de productos sobre fondo blanco. |

---

## 🔤 Tipografía

### Familia Tipográfica Principal

**Poppins** — Geométrica sans-serif de Google Fonts  
`https://fonts.google.com/specimen/Poppins`

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
```

### Escala de Pesos y Usos

| Peso | Nombre | Uso principal |
|---|---|---|
| **900** | Black | Logotipo en carteles, impacto máximo |
| **800** | ExtraBold | Títulos principales (H1) de publicaciones y carteles |
| **700** | Bold | Subtítulos (H2), nombres de productos, CTAs |
| **600** | SemiBold | Botones, etiquetas de navegación, badges |
| **500** | Medium | Textos de navegación, labels de formularios |
| **400** | Regular | Cuerpo de texto, descripciones de producto |
| **300** | Light | Notas al pie, textos terciarios, captions |

### Escala Tipográfica (Tamaños)

| Elemento | Tamaño | Peso | Color |
|---|---|---|---|
| Hero Title | `clamp(2.5rem, 6vw, 4rem)` | 800 | `#f59e0b` |
| Section Title | `clamp(1.8rem, 4vw, 2.5rem)` | 700 | `#f59e0b` |
| Card Title | `1rem` | 700 | `#0f172a` (claro) / `#f1f5f9` (oscuro) |
| Body Text | `0.875rem` | 400 | `#f1f5f9` |
| Caption / Badge | `0.7rem – 0.75rem` | 600–700 | Variable según contexto |
| Subtitle / Muted | `1.05rem` | 400 | `#94a3b8` |

> **⚠️ IMPORTANTE:** Siempre usar Poppins. Nunca mezclar con otras tipografías en materiales de TecMaker 3D.  
> El espaciado entre letras (letter-spacing) para textos en mayúsculas: `0.5px – 1.5px`.

---

## 🖼️ Estética Visual y Tono

### Concepto Central
> **"Industrial-Tech Premium Dark"**  
> TecMaker 3D transmite precisión tecnológica y modernidad. El look es oscuro, con brillos ámbar que evocan manufactura de alta calidad, componentes electrónicos y la luz de la boquilla de una impresora 3D en acción.

### Reglas Visuales

| Elemento | Estilo |
|---|---|
| **Fondo base** | Negro profundo `#0f0f0f` con texturas hexagonales sutiles |
| **Acentos de luz** | Glow ámbar difuso en bordes y elementos destacados |
| **Efecto glassmorphism** | `backdrop-filter: blur(20px)` con `rgba(15,15,15,0.85)` |
| **Gradientes** | De `#f59e0b` a `#d97706` (dorado profundo), siempre cálidos |
| **Bordes** | Finos, `1px solid`, con baja opacidad (`rgba(255,255,255,0.08)` a `0.15`) |
| **Bordes activos** | `rgba(245, 158, 11, 0.3)` a `rgba(245, 158, 11, 0.5)` |
| **Sombras** | Suaves y profundas. Glow ámbar para elementos CTA: `0 0 20px rgba(245,158,11,0.15)` |
| **Imágenes de fondo** | Hexágonos, patrones de malla, texturas metálicas oscuras |
| **Formas** | Bordes redondeados pero no excesivos. `border-radius: 10px–20px` |

### Tokens de Diseño (Variables CSS)

```css
--color-primary:      #f59e0b;
--color-primary-dark: #d97706;
--color-secondary:    #6366f1;
--color-bg:           #0f0f0f;
--color-surface:      #1a1a1a;
--color-surface-2:    #252525;
--color-border:       rgba(255, 255, 255, 0.08);
--color-text:         #f1f5f9;
--color-text-muted:   #94a3b8;
--font-main:          'Poppins', sans-serif;
--shadow-glow:        0 0 20px rgba(245, 158, 11, 0.15);
--transition:         all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--radius-lg:          16px;
--radius-md:          10px;
--radius-sm:          6px;
```

---

## 📸 Guía para Publicaciones en Instagram

### Formato y Dimensiones

| Tipo | Dimensión | Aspecto |
|---|---|---|
| Post cuadrado | 1080 × 1080 px | 1:1 |
| Story / Reel | 1080 × 1920 px | 9:16 |
| Banner horizontal | 1080 × 566 px | 1.91:1 |
| Carrusel | 1080 × 1080 px (cada slide) | 1:1 |

### Composición Recomendada

- **Fondo:** Negro profundo `#0f0f0f` con textura hexagonal o de malla gris muy sutil
- **Elemento central:** Producto 3D / filamento en alta calidad, con sombra y glow ámbar
- **Título:** Poppins 800, color `#f59e0b`, alineado a la izquierda o centrado
- **Subtítulo:** Poppins 400–500, color `#94a3b8`
- **CTA (call to action):** Badge o botón con borde ámbar y fondo `rgba(245,158,11,0.15)`
- **Logo:** Siempre presente, esquina inferior derecha o centrado abajo
- **Acento decorativo:** Línea fina ámbar horizontal o diagonal, glow sutil en borde del producto

### Ejemplo de Layout Instagram Post

```
┌─────────────────────────────┐
│  [Textura hex oscura BG]    │
│                             │
│  🔷 BADGE: NUEVO STOCK      │  ← Indigo #6366f1
│                             │
│  [IMAGEN PRODUCTO con glow] │
│                             │
│  Filamento PLA Premium      │  ← Poppins 800 Amber
│  El mejor del mercado       │  ← Poppins 400 Muted
│                             │
│  $XXXX  ░░ Ver más ░░       │  ← CTA borde ámbar
│                             │
│              [logo TM3D]    │
└─────────────────────────────┘
```

---

## 🤖 Prompt Base para IAs Generadoras de Imágenes

> Copiá este bloque y completá los campos entre `[corchetes]` según cada publicación.

```
PROMPT PARA IA - IMAGEN DE MARCA TECMAKER 3D

Estilo: industrial tech premium, dark mode, futurista minimalista.

Fondo: negro profundo (#0f0f0f) con textura hexagonal o de malla metálica gris muy sutil.
Iluminación: dramática, direccional, con glow ámbar suave (color #f59e0b) en los bordes
del objeto principal y en el ambiente general.

Sujeto principal: [DESCRIPCIÓN DEL PRODUCTO / ESCENA], renderizado en 3D de alta calidad
con materiales realistas, iluminado con luz ámbar-dorada desde abajo o el frente.

Paleta de colores estricta:
- Fondos: #0f0f0f, #1a1a1a
- Acento principal: #f59e0b (dorado ámbar)
- Acento secundario: #6366f1 (índigo/violeta)
- Textos/highlights: #f1f5f9 (blanco suave)
- Evitar: colores pasteles, fondos blancos, estilos caricaturescos o flat

Tipografía en imagen (si aplica): Poppins, bold, en color #f59e0b o blanco #f1f5f9.

Mood: profesional, premium, tecnológico, confiable. Similar a renders de productos de
marcas tech como DJI, Bambu Lab o Prusa Research. Alta calidad fotográfica o render 3D.

Resolución y formato: cuadrado 1:1 para Instagram, o 9:16 para Story.

[INSTRUCCIONES ADICIONALES ESPECÍFICAS DE ESTA PIEZA]
```

### Variaciones de Prompt por Tipo de Contenido

**Para mostrar filamentos:**
> "Bobina de filamento PLA de color [COLOR] sobre superficie negra reflectante, glow ámbar sutil en los bordes, fondo oscuro con hexágonos muy sutiles, iluminación de estudio, premium, realista."

**Para mostrar impresoras:**
> "Impresora 3D [MODELO] imprimiendo una pieza, ambiente oscuro industrial, luz ámbar proveniente de la boquilla en movimiento, detalles de capa visible en la pieza impresa, fondo negro, estética tech premium."

**Para promociones / descuentos:**
> "Cartel promocional estilo tech dark: fondo #0f0f0f, texto 'OFERTA' en Poppins 800 ámbar dorado, elementos geométricos hexagonales, glow sutil, minimalista, premium."

**Para destacar servicios de impresión:**
> "Mano sosteniendo una pieza impresa en 3D de color blanco sobre fondo oscuro #0f0f0f, iluminación ámbar dramática, detalles de las capas de impresión visibles, estilo fotográfico premium tipo product shoot."

---

## 🔡 Vocabulario de Marca (para textos y copies)

### Palabras clave a usar
- Precisión · Calidad · Premium · Innovación · Tecnología
- Filamento · Impresión 3D · Maker · Diseño · Fabricación
- Envío rápido · Stock disponible · Exclusivo · Personalizado

### Palabras a evitar
- Barato (usar: "accesible", "relación precio-calidad")
- Genérico / Común (usar: "exclusivo", "de calidad")
- Urgente (usar: "stock limitado", "disponibilidad acotada")

### Hashtags sugeridos para Instagram
```
#TecMaker3D #Impresion3D #Filamento3D #PLA #PETG #Maker
#Tecnologia #Innovacion #HechoenArgentina #Impresora3D
#3DPrinting #3DPrint #FilamentoPLA #Diseño3D #Argentina
```

---

## ✅ Checklist de Consistencia para Publicaciones

Antes de publicar cualquier material, verificar:

- [ ] ¿Usa Poppins como tipografía principal?
- [ ] ¿El fondo es oscuro (`#0f0f0f` o `#1a1a1a`)?
- [ ] ¿Los títulos principales están en ámbar `#f59e0b`?
- [ ] ¿Hay al menos un elemento con glow ámbar sutil?
- [ ] ¿El logo de TecMaker 3D está incluido?
- [ ] ¿Se mantiene la estética "industrial tech premium"?
- [ ] ¿La imagen tiene alta resolución (mín. 1080px en el lado menor)?
- [ ] ¿El texto es legible sobre el fondo oscuro?

---

*Guía de estilos generada en Mayo 2026 — TecMaker 3D*  
*Para actualizaciones o consultas, contactar al equipo de desarrollo.*
