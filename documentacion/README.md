# TecMaker 3D — Documentación Completa

> Sitio web de e-commerce para venta de filamentos, accesorios e impresiones 3D.
> **URL producción:** https://3d.tecmaker.com.ar | **Deploy:** Vercel

---

## Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Base de Datos — Supabase](#base-de-datos--supabase)
4. [Sistema de Diseño — Estilos Globales](#sistema-de-diseño--estilos-globales)
5. [Configuración inicial](#configuración-inicial)
6. [Rutas (React Router)](#rutas-react-router)
7. [State Management — Zustand](#state-management--zustand)
8. [Custom Hook — useFetch](#custom-hook--usefetch)
9. [Componentes](#componentes)
10. [Páginas](#páginas)
11. [Sistema de Autenticación](#sistema-de-autenticación)
12. [Sistema de Reservas](#sistema-de-reservas)
13. [Deploy y Configuración](#deploy-y-configuración)

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.4.10 | Build tool / dev server |
| React Router DOM | 6.27.0 | Navegación SPA |
| Zustand | 5.0.1 | Estado global |
| Supabase JS | 2.105.1 | Base de datos + Auth |
| MUI (Material UI) | 6.1.6 | Componentes UI |
| Axios | 1.7.7 | Peticiones HTTP externas |
| CSS Modules | — | Estilos por componente |

---

## Estructura del Proyecto

```
TecMaker 3D/
├── index.html               # Entry point HTML (SEO, fuentes Poppins)
├── vite.config.js           # Config Vite + plugin React
├── vercel.json              # Config deploy Vercel (rewrites SPA)
├── .env                     # Variables de entorno (NO comitear)
├── package.json
├── public/
│   ├── logo.png             # Logo TecMaker 3D
│   ├── hexagons.png         # Fondo hexagonal decorativo
│   └── fondo.png            # Imagen de fondo
└── src/
    ├── main.jsx             # Punto de entrada React
    ├── App.jsx              # Rutas + inicialización de stores globales
    ├── index.css            # Estilos globales + tokens CSS
    ├── lib/
    │   └── supabase.js      # Cliente Supabase (con detectSessionInUrl)
    ├── hooks/
    │   └── useFetch.js      # Custom hook HTTP con Axios
    ├── stores/
    │   ├── useCartStore.js     # Carrito (Zustand)
    │   ├── useStockStore.js    # Stock y catálogo (Zustand + Supabase)
    │   ├── useAuthStore.js     # Autenticación Google OAuth (Zustand + Supabase)
    │   └── useReservasStore.js # Reservas temporales 30min (Zustand + Supabase)
    ├── components/
    │   ├── Navbar/          # Navegación principal (condicional según rol)
    │   ├── Footer/          # Pie de página
    │   ├── CartDrawer/      # Panel lateral del carrito + flujo de reserva
    │   ├── FilamentCard/    # Tarjeta de producto con badge de reserva
    │   ├── AccesorioCard/   # Tarjeta de accesorio
    │   ├── Auth/            # LoginButton, UserMenu, AuthModal
    │   └── StockManager/    # Panel admin de stock (solo admin)
    └── pages/
        ├── Home/            # Página de inicio
        ├── Filamentos/      # Catálogo de filamentos + filtros
        ├── FilamentosConfig/# Especificaciones técnicas (API PubChem)
        ├── Accesorios/      # Catálogo de accesorios
        ├── Tienda/          # Productos impresos 3D
        ├── STL/             # Modelos STL + plataformas
        ├── Contacto/        # Formulario de contacto
        ├── Perfil/          # Perfil de usuario + reservas + historial
        └── AdminReservas/   # Panel admin: confirmar/cancelar reservas
```

---

## Base de Datos — Supabase

### Tablas principales

#### `productos`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | PK |
| `nombre` | text | Nombre del producto |
| `marca` | text | Marca (o categoría para accesorios) |
| `tipo` | text | `filamento` / `accesorio` / `impresion` / `stl` |
| `material` | text | PLA, PETG, TPU, etc. |
| `color` | text | Color del filamento |
| `precio` | numeric | Precio en ARS |
| `descripcion` | text | Descripción |
| `imagen` | text | URL de imagen (Supabase Storage) |
| `peso` | text | Ej: "1kg" |
| `diametro` | text | Ej: "1.75mm" |
| `temp_impresion` | text | Ej: "190–220°C" |
| `temp_cama` | text | Ej: "60°C" |
| `especificaciones` | text | Specs adicionales (accesorios) |
| `link_compra` | text | Link externo (STL → Cults3D) |
| `stock` | int | Unidades disponibles |
| `activo` | boolean | Si aparece en el catálogo público |

#### `movimientos_stock`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | PK |
| `producto_id` | int | FK → productos.id |
| `tipo` | text | `ingreso` / `egreso` |
| `cantidad` | int | Unidades del movimiento |
| `stock_anterior` | int | Stock antes del movimiento |
| `stock_nuevo` | int | Stock después del movimiento |
| `motivo` | text | Descripción del motivo |
| `usuario` | text | Quién hizo el movimiento |
| `created_at` | timestamp | Fecha/hora automática |

#### `perfiles`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK = auth.users.id |
| `email` | text | Email de Google |
| `nombre` | text | Nombre completo |
| `avatar_url` | text | URL del avatar de Google |
| `telefono` | text | Teléfono opcional |
| `es_admin` | boolean | `TRUE` = acceso a Stock y panel de Reservas |
| `created_at` | timestamp | Fecha de registro |

#### `reservas`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `usuario_id` | uuid | FK → auth.users.id |
| `producto_id` | int | FK → productos.id |
| `cantidad` | int | Unidades reservadas |
| `estado` | text | `activa` / `confirmada` / `expirada` |
| `expires_at` | timestamp | Expiración (30 min desde creación) |
| `created_at` | timestamp | Fecha de reserva |

#### `compras`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `usuario_id` | uuid | FK → auth.users.id |
| `producto_id` | int | FK → productos.id |
| `cantidad` | int | Unidades compradas |
| `total` | numeric | Precio total |
| `created_at` | timestamp | Fecha de compra |

### Función SQL: `confirmar_compra(p_reserva_id)`

Función transaccional que el admin ejecuta para confirmar una venta:
1. Verifica que la reserva esté activa
2. Descuenta stock del producto
3. Registra la compra en `compras`
4. Marca la reserva como `confirmada`

### Función SQL: `es_admin_actual()`

Función `SECURITY DEFINER` que verifica si el usuario actual tiene `es_admin = TRUE` en `perfiles`, sin causar recursión en las políticas RLS.

### RLS (Row Level Security)

Todas las tablas tienen RLS habilitado:
- **perfiles**: cada usuario ve solo su perfil; admins ven todos (via `es_admin_actual()`)
- **reservas**: usuarios ven sus propias reservas; todos ven las activas globales (para mostrar "Reservado")
- **compras**: usuarios ven su historial; admins gestionan todo

### Variables de entorno (`.env`)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Cliente Supabase (`src/lib/supabase.js`)

```js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Sistema de Diseño — Estilos Globales

Definidos en `src/index.css` mediante variables CSS:

```css
:root {
  --color-primary:      #f59e0b;   /* Ámbar — color principal */
  --color-primary-dark: #d97706;
  --color-secondary:    #6366f1;   /* Indigo */
  --color-bg:           #0f0f0f;   /* Fondo oscuro */
  --color-surface:      #1a1a1a;   /* Superficie de cards */
  --color-surface-2:    #252525;
  --color-border:       rgba(255,255,255,0.08);
  --color-text:         #f1f5f9;   /* Texto principal */
  --color-text-muted:   #94a3b8;   /* Texto secundario */
  --font-main:          'Poppins', sans-serif;
  --shadow-glow:        0 0 20px rgba(245,158,11,0.15);
  --transition:         all 0.3s cubic-bezier(0.4,0,0.2,1);
  --radius-lg:          16px;
  --radius-md:          10px;
  --radius-sm:          6px;
}
```

### Animaciones globales

| Nombre | Descripción |
|---|---|
| `fadeInUp` | Aparece desde abajo con opacidad |
| `pulse` | Escala de 1 → 1.05 → 1 |
| `shimmer` | Efecto skeleton de carga |

### Clases utilitarias

| Clase | Uso |
|---|---|
| `.container-custom` | Contenedor centrado, max 1280px |
| `.section-title` | Títulos de sección (clamp responsive) |
| `.section-subtitle` | Subtítulo gris bajo el título |
| `.skeleton` | Loading placeholder animado |
| `.badge-stock.in-stock` | Verde — stock normal |
| `.badge-stock.low-stock` | Ámbar — stock bajo (≤3) |
| `.badge-stock.out-of-stock` | Rojo — sin stock |

### Scrollbar personalizado

Scrollbar de 6px, color ámbar `#f59e0b`, fondo oscuro.

### Tema MUI (`main.jsx`)

```js
createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#f59e0b' },
    secondary:  { main: '#6366f1' },
    background: { default: '#0f0f0f', paper: '#1a1a1a' },
  },
  typography: { fontFamily: '"Poppins", sans-serif' },
})
```

---

## Configuración inicial

### Instalar dependencias

```bash
npm install
```

### Correr en desarrollo

```bash
npm run dev
# → http://localhost:5173
```

### Build para producción

```bash
npm run build
```

### Preview del build

```bash
npm run preview
```

---

## Rutas (React Router)

Configuradas en `src/App.jsx`. `<BrowserRouter>` vive en `main.jsx`.

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Home` | Página de inicio con hero, stats y categorías |
| `/filamentos` | `Filamentos` | Catálogo de filamentos con filtros |
| `/filamentos/configuraciones` | `FilamentosConfig` | Especificaciones técnicas via API PubChem |
| `/accesorios` | `Accesorios` | Catálogo de accesorios con filtros |
| `/tienda` | `Tienda` | Productos impresos en 3D |
| `/stl` | `STL` | Modelos STL y plataformas externas |
| `/contacto` | `Contacto` | Formulario de contacto vía WhatsApp |
| `/perfil` | `Perfil` | Perfil de usuario, reservas activas e historial |
| `/admin/stock` | `StockManager` | Panel de stock (solo admin) |
| `/admin/reservas` | `AdminReservas` | Panel de reservas activas (solo admin) |
| `*` | inline 404 | Página no encontrada con link a inicio |

> La ruta `/filamentos/configuraciones` es una **sub-ruta anidada** (`<Outlet />`) dentro de `/filamentos`.

### Comportamiento global

- `<Navbar />` siempre visible (fixed top)
- `<CartDrawer />` siempre montado, se muestra/oculta con estado Zustand
- `<Footer />` siempre visible al final
- Al iniciar la app, se llama `cargarPreciosPublicos()` para traer todo el catálogo desde Supabase

---

## State Management — Zustand

### `useCartStore` — Carrito de compras

**Persistencia:** usa el middleware `persist` de Zustand → guarda `items` en **`localStorage`** bajo la clave `tecmaker-carrito`. El carrito sobrevive cierres de sesión, recargas y reinicios del navegador. El drawer (`isCartOpen`) **no** se persiste — siempre arranca cerrado.

**Estado:**

| Campo | Tipo | Descripción |
|---|---|---|
| `items` | `Array` | Lista de productos en el carrito (persiste en localStorage) |
| `isCartOpen` | `boolean` | Si el drawer lateral está abierto (no persiste) |

Cada `item` en el carrito tiene: `{ id, nombre, marca, precio, imagen, cantidad }`

> ⚠️ **El carrito NO descuenta stock.** Agregar productos al carrito es solo una selección local. El stock real solo se descuenta en Supabase al hacer una **reserva** (`crearReserva`).

**Acciones:**

| Función | Descripción |
|---|---|
| `addItem(product)` | Agrega producto. Si ya existe, incrementa cantidad |
| `removeItem(productId)` | Elimina un producto del carrito |
| `incrementItem(productId)` | +1 unidad |
| `decrementItem(productId)` | −1 unidad (si llega a 0, elimina) |
| `clearCart()` | Vacía el carrito (también limpia localStorage) |
| `toggleCart()` | Abre/cierra el drawer |
| `openCart()` | Abre el drawer |
| `closeCart()` | Cierra el drawer |
| `totalItems()` | Getter: suma total de unidades |
| `totalPrice()` | Getter: precio total del carrito |

---

### `useStockStore` — Stock y Catálogo (Supabase)

**Estado:**

| Campo | Tipo | Descripción |
|---|---|---|
| `stock` | `Object` | `{ [productoId]: cantidad }` |
| `precios` | `Object` | `{ [productoId]: precio }` |
| `catalogo` | `Object` | `{ [productoId]: productoCompleto }` |
| `catalogoFilamentos` | `Array` | Productos con `tipo === 'filamento'` |
| `catalogoAccesorios` | `Array` | Productos con `tipo === 'accesorio'` |
| `catalogoImpresiones` | `Array` | Productos con `tipo === 'impresion'` |
| `catalogoSTL` | `Array` | Productos con `tipo === 'stl'` |
| `cargandoCatalogo` | `boolean` | Loading del fetch público |
| `cargando` | `boolean` | Loading del panel admin |
| `error` | `string\|null` | Mensaje de error |
| `movimientos` | `Array` | Historial (no usado en UI aún) |

**Acciones:**

| Función | Descripción |
|---|---|
| `cargarPreciosPublicos()` | Carga TODO el catálogo activo desde Supabase. Fuente única de verdad. |
| `cargarStock()` | Carga solo `stock` y `precio` (usado en panel admin) |
| `ingresarStock(id, cantidad, motivo)` | Suma stock + registra movimiento |
| `egresarStock(id, cantidad, motivo)` | Resta stock (mín. 0) + registra movimiento |
| `ajustarStock(id, stockNuevo, motivo)` | Ajuste directo a valor absoluto |
| `actualizarPrecio(id, nuevoPrecio)` | Actualiza precio en Supabase + UI |
| `getStock(id)` | Getter: retorna stock actual |
| `hasStock(id, cantidad)` | Getter: retorna true si hay suficiente stock |
| `increaseStock(id, cantidad)` | Alias de `ingresarStock` |
| `decreaseStock(id, cantidad)` | Alias de `egresarStock` |
| `setStock(id, cantidad)` | Alias de `ajustarStock` |

**Normalización de campos:**

Al cargar desde Supabase, se normalizan campos snake_case a camelCase:
- `temp_impresion` → `tempImpresion`
- `temp_cama` → `tempCama`
- Para accesorios: el campo `marca` de Supabase se mapea como `categoria`

---

### `useAuthStore` — Autenticación Google OAuth

**Estado:**

| Campo | Tipo | Descripción |
|---|---|---|
| `session` | `Object\|null` | Sesión de Supabase Auth |
| `perfil` | `Object\|null` | Datos de `public.perfiles` |
| `esAdmin` | `boolean` | `TRUE` si el usuario tiene `es_admin = TRUE` |
| `cargando` | `boolean` | `TRUE` mientras se inicializa la sesión |

**Acciones:**

| Función | Descripción |
|---|---|
| `inicializar()` | Llama `getSession()` y configura `onAuthStateChange`. Llamar 1 vez en App.jsx |
| `cargarPerfil(userId)` | Lee `perfiles` por ID. Si no existe, lo crea automáticamente |
| `loginConGoogle()` | Abre el flujo OAuth de Google (redirect) |
| `logout()` | Cierra sesión y limpia estado |
| `actualizarPerfil(datos)` | UPDATE en `perfiles` (nombre, teléfono) |

---

### `useReservasStore` — Reservas temporales

**Estado:**

| Campo | Tipo | Descripción |
|---|---|---|
| `reservas` | `Array` | Reservas activas del usuario actual |
| `reservasActivas` | `Object` | `{ [productoId]: reserva }` — mapa para consulta rápida |
| `reservasGlobal` | `Object` | `{ [productoId]: reserva }` — todas las reservas activas (cualquier usuario) |
| `cargando` | `boolean` | Loading |

**Acciones:**

| Función | Descripción |
|---|---|
| `cargarReservas()` | Carga reservas activas del usuario actual |
| `cargarReservasGlobal()` | Carga todas las reservas activas (para badges en catálogo) |
| `crearReserva(productoId, cantidad)` | Crea reserva en Supabase (30 min) |
| `cancelarReserva(productoId)` | Marca reserva como `expirada` |
| `limpiarExpiradas()` | Limpia reservas vencidas del estado local |
| `tieneReserva(productoId)` | Getter: ¿el usuario actual reservó este producto? |
| `estaReservado(productoId)` | Getter: ¿algún usuario reservó este producto? |
| `segundosRestantes(productoId)` | Getter: segundos hasta que expire la reserva |

---

## Custom Hook — useFetch

Archivo: `src/hooks/useFetch.js`

```js
const { data, loading, error } = useFetch(url, retryKey)
```

**Parámetros:**
- `url` — URL para el GET. Si es falsy, no hace nada.
- `key` — Número (default 0). Cambiar este valor fuerza un nuevo fetch (retry).

**Retorna:** `{ data, loading, error }`

**Características:**
- Usa **Axios** para la petición GET
- Implementa **AbortController** para cancelar la petición si el componente se desmonta
- Maneja errores con mensaje descriptivo (`err.response?.data?.message || err.message`)
- Ignora errores de cancelación (`axios.isCancel`)
- Se re-ejecuta cuando cambia `url` o `key`

---

## Componentes

### `Navbar`

**Archivo:** `src/components/Navbar/Navbar.jsx`

**Funcionalidad:**
- Navbar fijo en la parte superior
- Cambia de estilo al hacer scroll (`scrolled` state + `navbarScrolled` CSS class)
- Menú hamburguesa para mobile (`menuOpen` state)
- Usa `<NavLink>` de React Router para resaltar la ruta activa
- Muestra badge con cantidad de items en el carrito (desde `useCartStore`)
- Links: Inicio / Filamentos / Accesorios / Tienda / STL / Contacto / 📦 Stock (admin)

**Props:** ninguna

**Dependencias:** `useCartStore`, `react-router-dom`, MUI Icons

---

### `Footer`

**Archivo:** `src/components/Footer/Footer.jsx`

**Funcionalidad:**
- Pie de página estático con 3 columnas:
  1. **Brand:** Logo, descripción, links a Facebook e Instagram
  2. **Navegación:** Links internos a todas las rutas
  3. **Recursos STL:** Links a Thingiverse, Printables, Cults3D
- Copyright 2026

**Props:** ninguna

---

### `CartDrawer`

**Archivo:** `src/components/CartDrawer/CartDrawer.jsx`

**Funcionalidad:**
- Panel lateral (drawer) que aparece desde la derecha
- Se activa con `isCartOpen` del `useCartStore`
- Overlay oscuro al fondo (click cierra el drawer)
- Lista los productos del carrito con imagen, nombre, precio unitario
- Controles de cantidad: +/− por item
- Al incrementar/decrementar, sincroniza con `useStockStore` (decrease/increase stock)
- Eliminar item individual → devuelve stock
- Vaciar carrito → devuelve todo el stock
- Muestra total en ARS con `Intl.NumberFormat`
- Botón **"Reservar por WhatsApp"**: genera un mensaje formateado y abre `wa.me/5493415866464`

**WhatsApp:** Número de Enrique `5493415866464`. El mensaje incluye lista de productos, cantidades, subtotales, total, alias MP y CVU.

---

### `FilamentCard`

**Archivo:** `src/components/FilamentCard/FilamentCard.jsx`

**Props:** `filamento` (objeto completo desde Supabase)

**Funcionalidad:**
- Tarjeta para mostrar un filamento individual
- Muestra imagen, badge de material, badge de stock, marca, nombre, descripción
- Specs: temperatura de impresión 🌡, peso ⚖, diámetro 📐
- Precio formateado en ARS
- Botón "Agregar" → agrega al carrito + descuenta stock
- Estado visual del stock:
  - `stock > 3` → verde "Stock: N"
  - `stock <= 3` → ámbar "¡Últimas N!"
  - `stock === 0` → rojo "Sin stock" + botón deshabilitado
- Animación "¡Agregado!" 1.5s al hacer click

---

### `AccesorioCard`

**Archivo:** `src/components/AccesorioCard/AccesorioCard.jsx`

**Props:** `accesorio` (objeto completo desde Supabase)

**Funcionalidad:** Idéntica a `FilamentCard` pero para accesorios.
- Muestra badge de categoría (en lugar de material)
- Muestra especificaciones técnicas (campo `especificaciones`)
- Al agregar al carrito, usa `accesorio.categoria` como `marca` del item

---

### `StockManager`

**Archivo:** `src/components/StockManager/StockManager.jsx`

**Ruta:** `/admin/stock` (visible en navbar)

**Funcionalidad — 3 estados:**

1. **Cargando sesión** → spinner centrado
2. **Sin sesión** → formulario de login con email/password
   - Usa `supabase.auth.signInWithPassword()`
   - Muestra error "Email o contraseña incorrectos"
   - Detecta sesión previa al montar con `supabase.auth.getSession()`
   - Listener de cambios de sesión con `onAuthStateChange`
3. **Con sesión** → Panel de administración:
   - Header con email del admin + botón cerrar sesión
   - **Summary cards:** total filamentos, total accesorios, productos sin stock
   - **Tabs:** 🧵 Filamentos / ⚙️ Accesorios
   - **Tabla por producto:**
     - Imagen + nombre
     - Marca/Categoría
     - Precio actual + input para actualizar precio + botón ✓
     - Stock actual (con color: verde/ámbar/rojo)
     - Botón +1 (ingreso)
     - Botón −1 (egreso, deshabilitado si stock=0)
     - Input ajuste directo + botón ✓
   - Todos los botones muestran "..." mientras se procesa (estado `guardando`)

---

## Páginas

### `Home` — `/`

Página de inicio con 4 secciones:

1. **Hero:** Badge, título "Materializando Ideas", logo animado, subtítulo, CTAs (Ver Filamentos / Ver Tienda)
2. **Stats:** 24+ Filamentos | 5 Marcas | 3 Tipos | 100% Calidad
3. **Categorías:** Grid de 4 cards (Filamentos, Accesorios, Tienda, STL) con links internos
4. **Sobre Nosotros:** Imagen de impresora + texto descriptivo + links a plataformas STL

---

### `Filamentos` — `/filamentos`

**Funcionalidad:**
- Carga `catalogoFilamentos` desde `useStockStore`
- Sub-navegación: **📦 Catálogo** | **🔬 Especificaciones Técnicas (API)**
- Si la ruta es `/filamentos/configuraciones`, renderiza `<Outlet />` (FilamentosConfig)
- Si es `/filamentos`, muestra:
  - **Filtros dinámicos** por marca (botones generados desde los datos)
  - **Filtros dinámicos** por material (PLA, PETG, Silk, etc.)
  - **Buscador** por nombre, marca o color (case-insensitive)
  - Contador "Mostrando X de Y filamentos"
  - **Grid de `<FilamentCard />`**
- Todos los filtros usan `useMemo` para rendimiento

---

### `FilamentosConfig` — `/filamentos/configuraciones`

**Funcionalidad:** Consume la API externa de **PubChem (NIH)**.

**URL de la API:**
```
https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{CIDs}/property/{PROPS}/JSON
```

**Materiales cubiertos (15 CIDs):**
PLA (612), PETG (174), ABS (7501), Nylon 6 (9815), TPU (5372954), PC (6623), PVA (8857), Nylon 12 (10413), ASA (644), HIPS (7847), PP (8252), PMMA (6658), PCL (31239), PVDF (9254), PS (7794)

**Propiedades mostradas (12):**
Fórmula Molecular, Peso Molecular, Nombre IUPAC, Masa Exacta, XLogP, TPSA, Complejidad, Donantes H, Aceptores H, Átomos Pesados, Enlaces Rotables, Carga.

**UI:**
- Pills de selección rápida para los 6 materiales principales
- Buscador con dropdown para los 15 materiales
- Tarjeta de detalle con: emoji, nombre, descripción contextual, temperaturas de impresión/cama
- Grid de 12 propiedades químicas con icono, valor, unidad y descripción didáctica
- Fuente del CID PubChem
- Estado loading (CircularProgress) / error (con botón Reintentar) / data

Usa el **custom hook `useFetch`** con Axios.

---

### `Accesorios` — `/accesorios`

**Funcionalidad:**
- Carga `catalogoAccesorios` desde `useStockStore`
- **Filtros dinámicos** por categoría (generados desde los datos de Supabase)
- Grid de `<AccesorioCard />`
- Contador de resultados

---

### `Tienda` — `/tienda`

**Funcionalidad:**
- Carga `catalogoImpresiones` desde `useStockStore`
- Grid de cards con imagen y nombre
- Botón **"Consultar"** en cada card → abre WhatsApp con mensaje pre-cargado con el nombre del producto
- Número WhatsApp: `5493415866464`

---

### `STL` — `/stl`

**Funcionalidad — 3 secciones:**

1. **Diseños exclusivos TecMaker 3D:** Grid de cards cargadas desde `catalogoSTL` (Supabase). Cada card muestra imagen, nombre y link a Cults3D (o "Próximamente").
2. **Plataformas externas:** Cards estáticas con links a Thingiverse, Printables, Cults3D (perfil TecMaker), MyMiniFactory.
3. **¿Cómo funciona?:** 4 pasos del proceso (elegí modelo → envianos → imprimimos → recibís).

---

### `Contacto` — `/contacto`

**Funcionalidad:**
- Layout de 2 columnas: info de contacto + formulario
- **Información de contacto:**
  - WhatsApp Enrique: +54 9 341 586-6464
  - WhatsApp Lorena: +54 9 341 606-8267
  - Instagram: @tecmaker.3d
  - Facebook: TecMaker 3D
  - Horarios: Lun-Vie 9:00 - 19:00
- **Formulario:** Nombre, Email, Asunto, Mensaje (todos requeridos)
- Al enviar: genera mensaje formateado y abre WhatsApp (`wa.me/5493415866464`)
- Después de enviar: limpia el formulario

---

## Deploy y Configuración

### Vercel (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> El `rewrites` es **crítico**: redirige todas las rutas al `index.html` para que React Router funcione en producción (evita 404 en refresh directo).

### Variables de entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### `.gitignore`

El archivo `.env` está excluido del repositorio. Nunca commitearlo.

---

## Flujo de datos completo

```
Supabase DB (tabla 'productos')
        │
        ▼
useStockStore.cargarPreciosPublicos()   ← se llama al iniciar App
        │
        ├── catalogoFilamentos  →  Filamentos.jsx  →  FilamentCard
        ├── catalogoAccesorios  →  Accesorios.jsx  →  AccesorioCard
        ├── catalogoImpresiones →  Tienda.jsx
        └── catalogoSTL         →  STL.jsx

useAuthStore.inicializar()  ← se llama al iniciar App
        ├── getSession()  → detecta sesión existente o código OAuth del URL
        ├── onAuthStateChange → escucha SIGNED_IN / SIGNED_OUT
        └── cargarPerfil() → lee perfiles, determina esAdmin

useReservasStore.cargarReservasGlobal()  ← se llama al iniciar App
        └── reservasGlobal → FilamentCard muestra badge "🔒 Reservado · MM:SS"

────────────────────────────────────────────
 REGLA CLAVE: El carrito NO afecta el stock
────────────────────────────────────────────
Usuario agrega productos al carrito:
    FilamentCard/AccesorioCard
        └── useCartStore.addItem(product)    ← solo al estado local (NO toca stock)

    El stock mostrado = stock real Supabase − reservas activas en DB
    Múltiples usuarios pueden tener el mismo producto en carrito
    El primero que reserve gana; el resto recibe error al intentar reservar
────────────────────────────────────────────

Usuario logueado → click "Reservar por WhatsApp":
    CartDrawer.handleReservar()
        ├── verifica sesión → si no hay, abre AuthModal
        ├── por cada item: useReservasStore.crearReserva()
        │       ├── INSERT reservas (30 min) ← AQUÍ se bloquea el stock en DB
        │       └── reservasActivas / reservasGlobal actualizados
        ├── reporta errores parciales (producto ya reservado por otro usuario)
        ├── abre WhatsApp con el resumen del pedido
        └── vacía y cierra el carrito

Admin confirma venta:
    AdminReservas.handleConfirmar(reservaId)
        └── supabase.rpc('confirmar_compra')
                ├── UPDATE productos SET stock = stock - cantidad  ← descuento REAL
                ├── INSERT compras
                └── UPDATE reservas SET estado = 'confirmada'

Admin cancela reserva:
    AdminReservas.handleCancelar(reservaId)
        └── UPDATE reservas SET estado = 'expirada'  (libera el producto)
```

---

## Información de contacto del negocio

| Canal | Dato |
|---|---|
| WhatsApp Enrique | +54 9 341 586-6464 (`5493415866464`) |
| WhatsApp Lorena | +54 9 341 606-8267 (`5493416068267`) |
| Instagram | @tecmaker.3d |
| Facebook | https://www.facebook.com/profile.php?id=100087129600305 |
| Cults3D | https://cults3d.com/es/usuarios/Tecmaker3D |
| Alias Mercado Pago | `tecmaker.3d` |
| CVU | `0000003100076322336301` |
| Titular | Enrique Cesar Temperini |
