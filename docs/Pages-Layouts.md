# Páginas y Layouts — 007-Sama (Tienda de Videojuegos)

> **Framework:** Astro 6.x (file-based routing, `output: 'hybrid'`)  
> **CSS:** Tailwind CSS v4  
> **Idioma:** Español

---

## Índice

1. [Layouts](#1-layouts)
   - [BaseLayout](#11-baselayoutastro)
   - [GameLayout](#12-gamelayoutastro)
   - [AdminLayout](#13-adminlayoutastro)
2. [Páginas Públicas](#2-páginas-públicas)
   - [Home `/`](#21-home-indexastro)
   - [Catálogo `/games`](#22-catálogo-gamesindexastro)
   - [Detalle de juego `/games/[slug]`](#23-detalle-de-juego-gamesslugastro)
   - [Nuevos lanzamientos `/new-releases`](#24-nuevos-lanzamientos-new-releasesastro)
   - [Noticias `/news`](#25-noticias-newsindexastro)
   - [Detalle de noticia `/news/[slug]`](#26-detalle-de-noticia-newsslugastro)
3. [Páginas de Carrito y Checkout](#3-páginas-de-carrito-y-checkout)
   - [Carrito `/cart`](#31-carrito-cartindexastro)
   - [Checkout `/checkout`](#32-checkout-checkoutindexastro)
   - [Confirmación `/checkout/confirmation`](#33-confirmación-checkoutconfirmationastro)
4. [Páginas de Usuario](#4-páginas-de-usuario)
   - [Perfil `/account`](#41-perfil-accountindexastro)
   - [Pedidos `/account/orders`](#42-pedidos-accountordersastro)
5. [Apéndice: Mapa de Datos](#5-apéndice-mapa-de-datos)

---

## 1. Layouts

### 1.1 `BaseLayout.astro`

**Propósito:** Layout raíz del sitio. Define la estructura HTML completa (`<html>`, `<head>`, `<body>`), carga de fuentes, SEO tags globales, y componentes estructurales compartidos (navbar, footer). Todas las páginas públicas y privadas lo usan como contenedor principal.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/layouts/BaseLayout.astro` |
| **Modo de render** | SSG (estático, se resuelve en build) |
| **Autenticación** | No requiere |

#### Props

```ts
export interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  noIndex?: boolean;
  breadcrumbs?: { label: string; href?: string }[];
}
```

#### Componentes que renderiza

| Componente | Propósito |
|---|---|
| `<Navbar />` | Navegación principal: logo, enlaces, buscador, carrito, avatar de usuario |
| `<Breadcrumbs />` | (Opcional) Hilo de navegación contextual |
| `<slot />` | Contenido específico de cada página |
| `<Footer />` | Pie de página: links legales, redes sociales, newsletter |

#### SEO Metadata que genera

```html
<title>{title} | 007-Sama</title>
<meta name="description" content={description ?? "Tienda de videojuegos"} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage ?? "/og-default.jpg"} />
<meta property="og:type" content={ogType ?? "website"} />
<link rel="canonical" href={canonicalUrl} />
<meta name="robots" content={noIndex ? "noindex" : "index, follow"} />
```

#### Wireframe textual

```
┌──────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒 │  ← Navbar
│                   [Iniciar sesión]               │
├──────────────────────────────────────────────────┤
│                                                  │
│   ┌── <Breadcrumbs /> (opcional) ──────────┐     │
│   │  Inicio > Catálogo > Elden Ring        │     │
│   └─────────────────────────────────────────┘     │
│                                                  │
│              <slot /> (contenido)                 │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [007-Sama]  [Términos] [Privacidad] [Contacto] │  ← Footer
│  © 2026 007-Sama. Todos los derechos reservados. │
│  [🕊 Twitter] [💬 Discord]                       │
└──────────────────────────────────────────────────┘
```

---

### 1.2 `GameLayout.astro`

**Propósito:** Layout específico para la página de detalle de un videojuego. Extiende `BaseLayout` y agrega secciones estructuradas: cabecera con portada, sidebar con metadatos (género, plataformas, precio), y áreas para contenido Markdown, reseñas y juegos relacionados.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/layouts/GameLayout.astro` |
| **Modo de render** | SSG (usado desde `[slug].astro` con `getStaticPaths()`) |
| **Autenticación** | No requiere |

#### Props

```ts
import type { GameEntry } from '@/types/game';

export interface Props {
  game: GameEntry;          // Datos completos del juego desde Content Collection
  relatedGames?: GameEntry[];
}
```

#### Componentes que renderiza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base con SEO y estructura global |
| `<PlatformBadge />` | Badges de plataformas disponibles |
| `<PriceTag />` | Precio actual con descuento si aplica |
| `<RatingStars />` | Valoración media + conteo de reseñas |
| `<GameGallery />` | Galería de screenshots / video embed |
| `<slot />` | Contenido Markdown del juego (descripción, características) |
| `<GameRequirements />` | Requisitos mínimos y recomendados |
| `<ReviewList />` | Lista de reseñas de usuarios |
| `<RelatedGames />` | Grid de juegos relacionados (mismo género/desarrollador) |
| `<Breadcrumbs />` | Migas de pan: Inicio > Catálogo > [Título] |

#### SEO Metadata que genera

```html
<title>{game.title} | 007-Sama</title>
<meta name="description" content={game.description} />
<meta property="og:title" content={game.title} />
<meta property="og:description" content={game.description} />
<meta property="og:image" content={game.image} />
<meta property="og:type" content="product" />
<script type="application/ld+json">
  <!-- Structured data (Product schema) para motores de búsqueda -->
  { "@context": "https://schema.org", "@type": "Product", ... }
</script>
```

#### Datos que necesita

```ts
interface GameEntry {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  releaseDate: Date;
  genre: Genre;
  platform: Platform[];
  rating: number;
  reviewCount: number;
  image: string;
  screenshots: string[];
  videoUrl?: string;
  developer: string;
  publisher: string;
  featured: boolean;
  inStock: boolean;
  tags: string[];
  requirements: {
    minimum: { os: string; cpu: string; ram: string; gpu: string; storage: string };
    recommended: { os: string; cpu: string; ram: string; gpu: string; storage: string };
  };
}
```

#### Wireframe textual

```
┌──────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒 │
├──────────────────────────────────────────────────┤
│  Inicio > Catálogo > {game.title}                │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │              │  │  {game.title}             │ │
│  │   Portada    │  │  [PlatformBadges]         │ │
│  │   Principal  │  │  ★★★★☆ {rating} ({n}     │ │
│  │              │  │         reseñas)          │ │
│  └──────────────┘  │  [PriceTag]               │ │
│                    │  [Comprar] [ + Wishlist ]  │ │
│                    │                           │ │
│                    │  Desarrollador: {dev}     │ │
│                    │  Publicador: {pub}        │ │
│                    │  Lanzamiento: {date}      │ │
│                    │  Género: {genre}          │ │
│                    └───────────────────────────┘ │
│                                                  │
│  ┌── Galería ────────────────────────────────┐  │
│  │  [img1] [img2] [img3] [▶ Video]          │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌── Descripción ────────────────────────────┐  │
│  │  <slot /> (contenido Markdown)            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌── Requisitos del sistema ─────────────────┐  │
│  │  Mínimo:          Recomendado:            │  │
│  │  • OS: {min.os}   • OS: {rec.os}         │  │
│  │  • CPU: {min.cpu} • CPU: {rec.cpu}       │  │
│  │  • RAM: {min.ram} • RAM: {rec.ram}       │  │
│  │  • GPU: {min.gpu} • GPU: {rec.gpu}       │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌── Reseñas de usuarios ────────────────────┐  │
│  │  [RatingStars interactivo]                 │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  ★★★★☆ Usuario1 — "Muy buen juego"  │  │  │
│  │  │  ★★★★★ Usuario2 — "Obra maestra"     │  │  │
│  │  │  ★★★☆☆ Usuario3 — "Bueno pero corto" │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌── Juegos relacionados ────────────────────┐  │
│  │  [GameCard] [GameCard] [GameCard]          │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Footer]                                         │
└──────────────────────────────────────────────────┘
```

---

### 1.3 `AdminLayout.astro`

**Propósito:** Layout para el panel de administración. Extiende `BaseLayout` pero agrega una sidebar de navegación administrativa con secciones visibles según el rol del usuario (editor o admin). Incluye `AuthGuard` para proteger todas las rutas admin.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/layouts/AdminLayout.astro` |
| **Modo de render** | SSR (`export const prerender = false`) |
| **Autenticación** | Requiere rol ≥ `editor` |

#### Props

```ts
export interface Props {
  title: string;
  user: {
    role: 'guest' | 'user' | 'premium' | 'editor' | 'admin';
    isBanned: boolean;
    emailVerified: Date | null;
  } | null;
}
```

#### Componentes que renderiza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base (title, SEO, footer) |
| `<AuthGuard />` | Protege el contenido según rol + estado |
| `<AdminSidebar />` | Navegación lateral contextual por rol |
| `<slot />` | Contenido administrativo |

#### Wireframe textual

```
┌──────────────────────────────────────────────────┐
│  [Logo]  [Ir a la tienda]  [👤 {user.name}]     │  ← Navbar minimal
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌── AdminSidebar ──┐  ┌── Admin Content ────┐  │
│  │  📊 Dashboard     │  │                     │  │
│  │                   │  │   <slot />          │  │
│  │  — Contenido —    │  │                     │  │
│  │  🎮 Juegos        │  │                     │  │
│  │  📰 Noticias      │  │                     │  │
│  │  ⭐ Reseñas        │  │                     │  │
│  │  🏷️ Cupones       │  │                     │  │
│  │                   │  │                     │  │
│  │  — Sistema —     │  │                     │  │
│  │  👥 Usuarios      │  │  (solo visible      │  │
│  │  ⚙️ Configuración │  │   para admin)       │  │
│  │  📋 Logs          │  │                     │  │
│  └───────────────────┘  └─────────────────────┘  │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Footer]                                         │
└──────────────────────────────────────────────────┘
```

---

## 2. Páginas Públicas

### 2.1 Home (`index.astro`)

**Ruta:** `/`
**Propósito:** Portada principal de la tienda. Muestra hero slider con juegos destacados, secciones de ofertas del día, nuevos lanzamientos y noticias recientes. Es la carta de presentación del sitio.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/index.astro` |
| **Modo de render** | SSG (pre-renderizado en build) |
| **Autenticación** | No requiere |

#### Datos que necesita

```ts
// Obtenidos en build mediante getCollection()
const featuredGames: GameEntry[];     // games donde featured === true
const dailyDeals: GameEntry[];        // games con descuento activo (originalPrice > price)
const newReleases: GameEntry[];       // games con releaseDate en últimos 30 días
const recentNews: NewsEntry[];        // últimas 5 noticias ordenadas por fecha
```

#### Componentes que utiliza

| Componente | Ubicación |
|---|---|
| `<BaseLayout />` | Layout principal |
| `<HeroSlider />` | Slider full-width con slides de juegos destacados (autoplay 5s) |
| `<GameCard variant="featured" />` | Tarjetas destacadas en la grilla principal |
| `<GameGrid />` | Grilla responsiva de tarjetas (2-4 columnas) |
| `<PriceTag />` | Precios con badges de descuento en ofertas |
| `<NewsCard />` | Miniaturas de noticias recientes |
| `<PlatformBadge />` | Badges de plataforma en cada juego |

#### SEO Metadata

```html
<title>007-Sama — Tu tienda de videojuegos</title>
<meta name="description" content="Descubre los mejores videojuegos en 007-Sama. Ofertas diarias, nuevos lanzamientos y noticias del mundo gamer." />
<meta property="og:title" content="007-Sama — Tu tienda de videojuegos" />
<meta property="og:type" content="website" />
<meta property="og:image" content="/og-home.jpg" />
```

#### Wireframe textual

```
┌─────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────── HeroSlider ───────────────────────┐  │
│  │                                               │  │
│  │   ███████████████████████████████████████████  │  │
│  │   █  Elden Ring: Shadow of the Erdtree    █   │  │
│  │   █  Explora las Tierras Sombrías...       █   │  │
│  │   █  [20% OFF]  $39.99  $49.99  [Ver más] █   │  │
│  │   ███████████████████████████████████████████  │  │
│  │       ● ○ ○ (autoplay 5s)                     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌── Juegos Destacados ─────────────────────────┐  │
│  │  [Ver todos →]                               │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │  │
│  │  │ 🎮   │ │ 🎮   │ │ 🎮   │ │ 🎮   │       │  │
│  │  │ Título│ │ Título│ │ Título│ │ Título│       │  │
│  │  │ ★4.8  │ │ ★4.5  │ │ ★4.9  │ │ ★4.7  │       │  │
│  │  │ $59.99│ │ $49.99│ │ $39.99│ │ $59.99│       │  │
│  │  │ [PC]  │ │ [PS5] │ │ [XBSX]│ │ [NSW] │       │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌── Ofertas del Día ──────────────────────────┐  │
│  │  [Ver todas →]                               │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐                 │  │
│  │  │-50%  │ │-30%  │ │-40%  │                 │  │
│  │  │ 🎮   │ │ 🎮   │ │ 🎮   │                 │  │
│  │  │ $29.99│ │ $41.99│ │ $35.99│                 │  │
│  │  │~~$59.99││~~$59.99││~~$59.99│                 │  │
│  │  └──────┘ └──────┘ └──────┘                 │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌── Nuevos Lanzamientos ──────────────────────┐  │
│  │  [Ver todos →]                               │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │  │
│  │  │NUEVO │ │NUEVO │ │PRE-  │ │NUEVO │       │  │
│  │  │ 🎮   │ │ 🎮   │ │VENTA │ │ 🎮   │       │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌── Noticias Recientes ───────────────────────┐  │
│  │  [Todas las noticias →]                      │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │ 📰 Parche 1.5 de Elden Ring ya disponible│  │
│  │  │    hace 2 horas — 45 comentarios         │  │
│  │  ├────────────────────────────────────────┤  │  │
│  │  │ 📰 Nuevo torneo de Street Fighter 6     │  │
│  │  │    hace 1 día — 28 comentarios           │  │
│  │  ├────────────────────────────────────────┤  │  │
│  │  │ 📰 Análisis técnico de Black Myth: Wukong│  │
│  │  │    hace 3 días — 112 comentarios         │  │
│  │  └────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Footer]                                           │
└─────────────────────────────────────────────────────┘
```

---

### 2.2 Catálogo (`/games/index.astro`)

**Ruta:** `/games`
**Propósito:** Página de catálogo completo con grid de juegos y sistema de filtros (plataforma, género, precio, valoración). Soporta paginación y ordenamiento. Los filtros se manejan mediante query params en la URL para permitir enlaces compartibles.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/games/index.astro` |
| **Modo de render** | SSG (estático, filtros vía query params + JS client-side) |
| **Autenticación** | No requiere |

#### Datos que necesita

```ts
const allGames: GameEntry[];              // Todos los juegos del catálogo
const genres: Genre[];                    // Lista única de géneros (extraída de games)
const platforms: Platform[];              // Lista única de plataformas
const priceRanges: PriceRange[];          // Rangos de precio predefinidos
const pageSize = 24;
const currentPage: number;                // De query param ?page=
const filteredGames: GameEntry[];         // Juegos después de aplicar filtros
const totalPages: number;                 // Math.ceil(filteredGames.length / pageSize)
```

#### Filtros disponibles

| Filtro | Query param | Valores |
|---|---|---|
| Plataforma | `?platform=` | `pc`, `ps5`, `xbox-series-x`, `switch` |
| Género | `?genre=` | `action`, `rpg`, `strategy`, `adventure`, `simulation`, `sports`, `horror` |
| Precio mínimo | `?minPrice=` | número |
| Precio máximo | `?maxPrice=` | número |
| Valoración mínima | `?minRating=` | número (0-5) |
| Ordenar por | `?sort=` | `price-asc`, `price-desc`, `rating`, `releaseDate`, `name` |
| Página | `?page=` | número |

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<Searchbar />` | Búsqueda textual con autocompletado |
| `<GameFilters />` | Panel de filtros (sidebar o drawer en mobile) |
| `<GameGrid />` | Grid responsivo de resultados |
| `<GameCard variant="compact" />` | Tarjetas en el grid |
| `<Pagination />` | Navegación de páginas |
| `<ActiveFilters />` | Tags de filtros activos con botón "Limpiar" |
| `<SortSelect />` | Dropdown de ordenamiento |
| `<PriceTag />` | Precios en cada tarjeta |
| `<PlatformBadge />` | Badges de plataforma |
| `<RatingStar variant="compact" />` | Valoraciones en cada tarjeta |

#### SEO Metadata

```html
<title>Catálogo de juegos | 007-Sama</title>
<meta name="description" content="Explora nuestro catálogo completo de videojuegos. Filtra por plataforma, género, precio y valoración. Encuentra tu próximo juego favorito." />
<meta property="og:title" content="Catálogo de juegos | 007-Sama" />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒    │
├────────────────────────────────────────────────────┤
│  Inicio > Catálogo                                  │
├────────────────────────────────────────────────────┤
│  ┌── Searchbar ──────────────────────────────┐     │
│  │  🔍 Buscar juegos...                       │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  ┌── ActiveFilters ───────────────────────────┐     │
│  │  [PC ×] [RPG ×] [$10-$50 ×]  [Limpiar]    │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ GameFilters   │  │ Sort: [Más populares ▼]   │  │
│  │               │  │                           │  │
│  │ Plataforma    │  │  ┌──────┐ ┌──────┐ ┌────┐│  │
│  │ ☑ PC          │  │  │ 🎮   │ │ 🎮   │ │ 🎮 ││  │
│  │ ☐ PS5         │  │  │Elden │ │BG3   │ │Hades││  │
│  │ ☐ Xbox Series │  │  │$59.99│ │$49.99│ │$24.││  │
│  │ ☐ Switch      │  │  │★4.8  │ │★4.7  │ │★4.9││  │
│  │               │  │  └──────┘ └──────┘ └────┘│  │
│  │ Género        │  │  ┌──────┐ ┌──────┐ ┌────┐│  │
│  │ ☐ Acción      │  │  │ 🎮   │ │ 🎮   │ │ 🎮 ││  │
│  │ ☑ RPG         │  │  │Cyber │ │Wukong│ │Stel││  │
│  │ ☐ Estrategia  │  │  │$29.99│ │$59.99│ │$39.││  │
│  │ ☐ Aventura    │  │  │★4.5  │ │★4.6  │ │★4.8││  │
│  │ ...           │  │  └──────┘ └──────┘ └────┘│  │
│  │               │  │                           │  │
│  │ Precio        │  │  ┌──────┐ ┌──────┐ ┌────┐│  │
│  │ ○ $0-$20      │  │  │ 🎮   │ │ 🎮   │ │ 🎮 ││  │
│  │ ○ $20-$40     │  │  │...   │ │...   │ │... ││  │
│  │ ○ $40-$60     │  │  └──────┘ └──────┘ └────┘│  │
│  │ ○ $60+        │  │                           │  │
│  │               │  │  [← 1 2 3 4 5 ... →]     │  │
│  │ Valoración    │  │                           │  │
│  │ [★★★★★]      │  │  Mostrando 1-24 de 156    │  │
│  │ [★★★★☆ 4+]   │  │                           │  │
│  │ [★★★☆☆ 3+]   │  └────────────────────────────┘  │
│  └──────────────┘                                   │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

### 2.3 Detalle de juego (`/games/[slug].astro`)

**Ruta:** `/games/[slug]`
**Propósito:** Página de detalle completo de un videojuego. Muestra galería de imágenes, descripción ampliada (desde Markdown), requisitos del sistema, reseñas de usuarios y juegos relacionados.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/games/[slug].astro` |
| **Modo de render** | SSG con `getStaticPaths()` |
| **Autenticación** | No requiere |

#### Generación de rutas

```ts
export async function getStaticPaths() {
  const games = await getCollection('games');
  return games.map((game) => ({
    params: { slug: game.data.slug },
    props: { game },
  }));
}
```

#### Datos que necesita

```ts
const { game } = Astro.props;                           // Desde getStaticPaths
const { Content } = await game.render();                // Contenido MDX del juego
const relatedGames = await getCollection('games', ...); // Mismo género, excluyendo el actual
const reviews = await getGameReviews(game.data.id);     // Reseñas (desde API/DB)
```

#### Componentes que utiliza

Ver sección [GameLayout](#12-gamelayoutastro).

#### SEO Metadata

Ver sección [GameLayout](#12-gamelayoutastro). Incluye structured data (JSON-LD) con schema `Product` y `VideoGame`.

#### Wireframe textual

```
Ver wireframe en GameLayout (sección 1.2).
```

---

### 2.4 Nuevos lanzamientos (`/new-releases.astro`)

**Ruta:** `/new-releases`
**Propósito:** Página que muestra los juegos lanzados en los últimos 30 días, ordenados por fecha de lanzamiento descendente. Incluye próximos lanzamientos (pre-orders) y juegos recién salidos.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/new-releases.astro` |
| **Modo de render** | SSG |
| **Autenticación** | No requiere |

#### Datos que necesita

```ts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentGames = await getCollection('games', ({ data }) => {
    return data.releaseDate >= thirtyDaysAgo;
});

const sorted = recentGames.sort((a, b) =>
  b.data.releaseDate.valueOf() - a.data.releaseDate.valueOf()
);

// Separar próximos lanzamientos (futuros) y recién lanzados (pasados)
const upcoming = sorted.filter(g => g.data.releaseDate > new Date());
const justReleased = sorted.filter(g => g.data.releaseDate <= new Date());
```

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<GameGrid />` | Grilla de resultados |
| `<GameCard variant="compact" />` | Tarjetas con badge "NUEVO" o "PRE-VENTA" |
| `<Breadcrumbs />` | Inicio > Novedades |
| `<PriceTag />` | Precio (con descuento de lanzamiento si aplica) |

#### SEO Metadata

```html
<title>Nuevos lanzamientos | 007-Sama</title>
<meta name="description" content="Descubre los últimos lanzamientos de videojuegos. Juegos nuevos cada semana en 007-Sama." />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒    │
├────────────────────────────────────────────────────┤
│  Inicio > Nuevos lanzamientos                       │
├────────────────────────────────────────────────────┤
│                                                    │
  │  🚀 Nuevos lanzamientos                             │
  │  Juegos publicados en los últimos 30 días.          │
│                                                    │
│  ┌── Próximamente (Pre-venta) ─────────────────┐  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐                │  │
│  │  │PRE-  │ │PRE-  │ │PRE-  │                │  │
│  │  │VENTA │ │VENTA │ │VENTA │                │  │
│  │  │ 🎮   │ │ 🎮   │ │ 🎮   │                │  │
│  │  │  Jun  │ │  Jul  │ │  Ago  │                │  │
│  │  └──────┘ └──────┘ └──────┘                │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌── Recién lanzados ──────────────────────────┐  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │  │
│  │  │NUEVO │ │NUEVO │ │NUEVO │ │NUEVO │       │  │
│  │  │ 🎮   │ │ 🎮   │ │ 🎮   │ │ 🎮   │       │  │
│  │  │Título│ │Título│ │Título│ │Título│       │  │
│  │  │$59.99│ │$49.99│ │$39.99│ │$59.99│       │  │
│  │  │★4.8  │ │★4.5  │ │★4.9  │ │★4.7  │       │  │
│  │  │Hoy   │ │Ayer  │ │3 días│ │1 sem │       │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘       │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [← 1 2 3 ... →]                                  │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

### 2.5 Noticias (`/news/index.astro`)

**Ruta:** `/news`
**Propósito:** Listado de noticias del mundo de los videojuegos. Muestra entradas ordenadas por fecha de publicación descendente, con título, extracto, fecha y enlace al detalle.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/news/index.astro` |
| **Modo de render** | SSG |
| **Autenticación** | No requiere |

#### Datos que necesita

```ts
const newsEntries = await getCollection('news');
const sorted = newsEntries.sort((a, b) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);
```

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<NewsCard />` | Tarjeta de noticia con imagen, título, extracto, fecha |
| `<Breadcrumbs />` | Inicio > Noticias |
| `<Pagination />` | Navegación entre páginas de noticias |

#### SEO Metadata

```html
<title>Noticias | 007-Sama</title>
<meta name="description" content="Las últimas noticias del mundo de los videojuegos. Lanzamientos, actualizaciones, torneos y más en 007-Sama." />
<meta property="og:title" content="Noticias | 007-Sama" />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒    │
├────────────────────────────────────────────────────┤
│  Inicio > Noticias                                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  📰 Noticias                                        │
│                                                    │
│  ┌────────────────────────────────────────────┐    │
│  │  [img]  Parche 1.5 de Elden Ring ya        │    │
│  │         disponible                           │    │
│  │         El nuevo parche trae correcciones    │    │
│  │         de equilibrio y contenido nuevo...   │    │
│  │         📅 10 junio 2026  💬 45 comentarios  │    │
│  ├────────────────────────────────────────────┤    │
│  │  [img]  Nuevo torneo de Street Fighter 6    │    │
│  │         se anunció la fecha del próximo      │    │
│  │         campeonato mundial con $1M en...    │    │
│  │         📅 9 junio 2026   💬 28 comentarios  │    │
│  ├────────────────────────────────────────────┤    │
│  │  [img]  Análisis técnico de Black Myth:     │    │
│  │         Wukong — Rendimiento en PC y        │    │
│  │         consolas...                         │    │
│  │         📅 7 junio 2026   💬 112 comentarios │    │
│  ├────────────────────────────────────────────┤    │
│  │  [img]  GTA 6: Nuevos detalles de la        │    │
│  │         jugabilidad filtrados               │    │
│  │         Según fuentes cercanas al...        │    │
│  │         📅 5 junio 2026   💬 234 comentarios │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  [← 1 2 3 ... →]                                  │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

### 2.6 Detalle de noticia (`/news/[slug].astro`)

**Ruta:** `/news/[slug]`
**Propósito:** Página de detalle de una noticia. Muestra el contenido completo con formato enriquecido (desde Markdown), metadatos (fecha, autor, categoría) y sección de comentarios.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/news/[slug].astro` |
| **Modo de render** | SSG con `getStaticPaths()` |
| **Autenticación** | No requiere |

#### Datos que necesita

```ts
const { entry } = Astro.props;
const { Content } = await entry.render();
```

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<Breadcrumbs />` | Inicio > Noticias > [Título] |
| `<Content />` | Render del Markdown de la noticia |
| `<ShareButtons />` | Botones de compartir (Twitter, Facebook, copiar link) |
| `<CommentSection />` | Sección de comentarios (requiere auth para escribir) |

#### SEO Metadata

```html
<title>{entry.data.title} | 007-Sama</title>
<meta name="description" content={entry.data.excerpt} />
<meta property="og:title" content={entry.data.title} />
<meta property="og:description" content={entry.data.excerpt} />
<meta property="og:image" content={entry.data.image} />
<meta property="og:type" content="article" />
<meta property="article:published_time" content={entry.data.pubDate.toISOString()} />
<meta property="article:author" content={entry.data.author} />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒    │
├────────────────────────────────────────────────────┤
│  Inicio > Noticias > {title}                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  <article>                                         │
│    📰 {entry.data.title}                           │
│    📅 {date}  |  ✍️ {author}  |  📁 {category}    │
│                                                    │
│    ┌──────────────────────────────────────────┐    │
│    │                                          │    │
│    │   <Content /> (Markdown renderizado)     │    │
│    │   • Texto con formato                     │    │
│    │   • Imágenes incrustadas                  │    │
│    │   • Videos embebidos (YouTube/Twitch)    │    │
│    │   • Tablas de datos                       │    │
│    │   • Enlaces relacionados                  │    │
│    │                                          │    │
│    └──────────────────────────────────────────┘    │
│                                                    │
│    [Compartir: 🕊 Twitter | 💬 Facebook | 🔗 Copiar]│
│                                                    │
│    ┌── Comentarios ───────────────────────────┐    │
│    │  [Inicia sesión para comentar]            │    │
│    │                                           │    │
│    │  Usuario1 — "Gran noticia, gracias!"      │    │
│    │  │  Usuario2 — "Totalmente de acuerdo"    │    │
│    │  Usuario3 — "¿Alguna fuente oficial?"     │    │
│    └──────────────────────────────────────────┘    │
│  </article>                                        │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

## 3. Páginas de Carrito y Checkout

### 3.1 Carrito (`/cart/index.astro`)

**Ruta:** `/cart`
**Propósito:** Página completa del carrito de compras. Muestra todos los juegos agregados, cantidades, precios, subtotal, impuestos y total. Permite modificar cantidades, eliminar items y proceder al checkout.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/cart/index.astro` |
| **Modo de render** | SSG + Estado cliente (Nano Stores) |
| **Autenticación** | No requiere (pero el checkout sí) |

#### Datos que necesita

```ts
// Estado cliente manejado con Nano Stores
interface CartItem {
  id: string;
  gameId: string;
  title: string;
  slug: string;
  image: string;
  platform: Platform;
  price: number;
  quantity: number;
  inStock: boolean;
}

interface CartSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;            // 21% IVA
  shipping: number;       // $4.99 o gratis > $50
  total: number;
  itemCount: number;
  freeShippingThreshold: number;
}
```

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<CartItemRow />` | Fila de item con imagen, título, plataforma, selector de cantidad, precio, botón eliminar |
| `<CartSummary />` | Resumen con subtotal, impuestos, envío, total |
| `<PromoCodeInput />` | Input para aplicar código de descuento |
| `<ShippingProgress />` | Barra de progreso hacia envío gratis |
| `<EmptyCart />` | Estado vacío con CTA "Explorar catálogo" |
| `<Button variant="primary" />` | Botón "Proceder al checkout" |

#### SEO Metadata

```html
<title>Carrito de compras | 007-Sama</title>
<meta name="description" content="Revisa tu carrito de compras en 007-Sama." />
<meta name="robots" content="noindex, nofollow" />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒(3) │
├────────────────────────────────────────────────────┤
│  Inicio > Carrito                                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  🛒 Tu carrito (3 items)                           │
│                                                    │
│  ┌── ShippingProgress ────────────────────────┐    │
│  │  ████████████░░░░░  $32.99 de $50 para     │    │
│  │                      envío gratis           │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  ┌── Cart Items ──────────────────────────────┐    │
│  │                                             │    │
│  │  🎮 Elden Ring                    [PC]     │    │
│  │     $59.99     [-][ 1 ][+]     $59.99  🗑️ │    │
│  │  ─────────────────────────────────────────  │    │
│  │  🎮 Baldur's Gate 3               [PS5]    │    │
│  │     $49.99     [-][ 2 ][+]     $99.98  🗑️ │    │
│  │  ─────────────────────────────────────────  │    │
│  │  🎮 Hades II                      [NSW]    │    │
│  │     $24.99     [-][ 1 ][+]     $24.99  🗑️ │    │
│  │                                             │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  ┌── Promo Code ─────────────────────────────┐    │
│  │  [Código de descuento]  [Aplicar]          │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  ┌── Cart Summary ───────────────────────────┐    │
│  │  Subtotal                    $184.97       │    │
│  │  Envío                        $4.99        │    │
│  │  IVA (21%)                   $38.84        │    │
│  │  ──────────────────────────────────        │    │
│  │  Total                       $228.80       │    │
│  │                                             │    │
│  │  [ Proceder al checkout → ]                 │    │
│  │                                             │    │
│  │  💳 Aceptamos: Visa MC Amex PayPal         │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

### 3.2 Checkout (`/checkout/index.astro`)

**Ruta:** `/checkout`
**Propósito:** Proceso de finalización de compra. Muestra resumen del pedido, formulario de datos de facturación y selección de método de pago. Es una ruta SSR porque requiere sesión y datos del usuario.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/checkout/index.astro` |
| **Modo de render** | SSR (`export const prerender = false`) |
| **Autenticación** | Requiere: usuario logueado, email verificado, no baneado |

#### Datos que necesita

```ts
const session = await getSession(Astro.request);
const user = session.user;                          // Del JWT
const cartItems = await getCartFromDB(user.id);     // Carrito desde BD
const userAddresses = await getUserAddresses(user.id);
const paymentMethods = await getUserPaymentMethods(user.id);
const orderSummary = calculateOrderSummary(cartItems);
```

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<CheckoutForm />` | Formulario multi-paso (datos, envío, pago, revisar) |
| `<OrderSummary />` | Resumen lateral del pedido |
| `<AddressForm />` | Formulario de dirección de envío/facturación |
| `<PaymentSelector />` | Selección de método de pago (tarjeta, PayPal) |
| `<SavedAddresses />` | Direcciones guardadas del usuario |
| `<StepIndicator />` | Indicador de progreso: 1→2→3→4 |

#### SEO Metadata

```html
<title>Finalizar compra | 007-Sama</title>
<meta name="description" content="Completa tu compra en 007-Sama de forma segura." />
<meta name="robots" content="noindex, nofollow" />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒(3) │
├────────────────────────────────────────────────────┤
│  Inicio > Carrito > Checkout                        │
├────────────────────────────────────────────────────┤
│  👤 {user.name}  |  Cerrar sesión                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  ⏺ [1. Datos] → [2. Envío] → [3. Pago] → [4. Rev.]│
│                                                    │
│  ┌── Checkout Form ──────────┐ ┌── OrderSummary ┐  │
│  │                            │ │                 │  │
│  │  1. Información personal  │ │  🎮 Elden Ring  │  │
│  │                           │ │     $59.99      │  │
│  │  Nombre: [Carlos López]   │ │  🎮 Baldur's   │  │
│  │  Email: [carlos@...]     │ │     $99.98      │  │
│  │  Teléfono: [ +52 555...] │ │  🎮 Hades II    │  │
│  │                           │ │     $24.99      │  │
│  │  2. Dirección de envío   │ │  ─────────────  │  │
│  │                           │ │  Subtotal $184.97│  │
│  │  ○ Usar dirección guardada│ │  Envío    $4.99 │  │
│  │  ○ Nueva dirección       │ │  IVA      $38.84│  │
│  │  [Calle] [Número]        │ │  ─────────────  │  │
│  │  [Ciudad] [Estado] [CP]  │ │  Total   $228.80│  │
│  │                           │ │                 │  │
│  │  3. Método de pago       │ │                 │  │
│  │                           │ │                 │  │
│  │  ○ 💳 Tarjeta crédito    │ │                 │  │
│  │  ○ PayPal                │ │                 │  │
│  │  ○ 🟢 Mercado Pago       │ │                 │  │
│  │                           │ │                 │  │
│  │  [ Confirmar compra ]     │ │                 │  │
│  │                           │ │                 │  │
│  └───────────────────────────┘ └─────────────────┘  │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

### 3.3 Confirmación (`/checkout/confirmation.astro`)

**Ruta:** `/checkout/confirmation`
**Propósito:** Página post-compra que confirma el pedido realizado. Muestra el número de pedido, resumen de la compra, estado y próximos pasos.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/checkout/confirmation.astro` |
| **Modo de render** | SSR |
| **Autenticación** | Requiere sesión |

#### Datos que necesita

```ts
const order = await getOrderById(session.user.id, orderId); // Desde query params o sesión
```

#### SEO Metadata

```html
<title>Compra confirmada | 007-Sama</title>
<meta name="robots" content="noindex, nofollow" />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ✅ ¡Compra confirmada!                             │
│                                                    │
│  ┌── Confirmation ────────────────────────────┐    │
│  │                                             │    │
│  │   🎉 Gracias por tu compra, {name}!         │    │
│  │                                             │    │
│  │   Número de pedido: #ORD-2026-0610-2847    │    │
│  │   Estado: Pagado                           │    │
│  │   Fecha: 10 junio 2026                     │    │
│  │                                             │    │
│  │   Recibirás un email de confirmación en     │    │
│  │   {email} con los detalles de tu compra.   │    │
│  │                                             │    │
│  │   ┌── Resumen ─────────────────────────┐   │    │
│  │   │  Elden Ring (PC)          $59.99    │   │    │
│  │   │  Baldur's Gate 3 (PS5)    $99.98    │   │    │
│  │   │  Hades II (Switch)        $24.99    │   │    │
│  │   │  ──────────────────────────────     │   │    │
│  │   │  Total                    $228.80   │   │    │
│  │   └─────────────────────────────────────┘   │    │
│  │                                             │    │
│  │   🔗 Puedes seguir tu pedido desde:         │    │
│  │   [Mis pedidos →]                           │    │
│  │                                             │    │
│  │   [Seguir comprando]                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

## 4. Páginas de Usuario

### 4.1 Perfil (`/account/index.astro`)

**Ruta:** `/account`
**Propósito:** Dashboard del usuario autenticado. Muestra información de la cuenta, pedidos recientes, lista de deseos y enlaces a secciones privadas. El contenido varía según el rol del usuario.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/account/index.astro` |
| **Modo de render** | SSR (`export const prerender = false`) |
| **Autenticación** | Requiere: usuario logueado, email verificado, no baneado |

#### Datos que necesita

```ts
const user = Astro.locals.user;                 // Del middleware
const recentOrders = await getRecentOrders(user.id, 5);
const wishlistCount = await getWishlistCount(user.id);
const isPremium = user.role === 'premium';
const isEditor = roleAtLeast(user.role, 'editor');
const isAdmin = user.role === 'admin';
```

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<AuthGuard />` | Protege la página |
| `<UserInfoCard />` | Avatar, nombre, email, rol, fecha de registro |
| `<RecentOrdersList />` | Últimos 5 pedidos con estado y total |
| `<WishlistPreview />` | Miniaturas de juegos en lista de deseos |
| `<AccountNav />` | Navegación lateral: Perfil, Pedidos, Lista de deseos, Cerrar sesión |
| `<PremiumBanner />` | (Condicional) Beneficios premium |
| `<QuickAdminPanel />` | (Condicional) Enlaces rápidos para editores/admins |

#### SEO Metadata

```html
<title>Mi cuenta | 007-Sama</title>
<meta name="robots" content="noindex, nofollow" />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒    │
├────────────────────────────────────────────────────┤
│  Inicio > Mi cuenta                                 │
├────────────────────────────────────────────────────┤
│  ┌── AccountNav ──────┐  ┌── Dashboard ────────┐  │
│  │                     │  │                      │  │
│  │  👤 Mi perfil       │  │  👋 Bienvenido,      │  │
│  │  📦 Mis pedidos     │  │     Carlos López!    │  │
│  │  ❤️ Lista de deseos │  │                      │  │
│  │  ⚙️ Configuración  │  │  ┌── UserCard ────┐  │  │
│  │  🚪 Cerrar sesión   │  │  │ [Avatar]       │  │  │
│  │                     │  │  │ {name}         │  │  │
│  │  (Admin links)      │  │  │ {email}        │  │  │
│  │  🎮 Gestionar       │  │  │ Rol: usuario   │  │  │
│  │     juegos          │  │  │ Miembro desde   │  │  │
│  │  📰 Noticias        │  │  │   enero 2026    │  │  │
│  │                     │  │  └────────────────┘  │  │
│  │                     │  │                      │  │
│  │                     │  │  ┌── Últimos ─────┐  │  │
│  │                     │  │  │  pedidos       │  │  │
│  │                     │  │  │ #ORD-2847      │  │  │
│  │                     │  │  │   $228.80  ✅  │  │  │
│  │                     │  │  │ #ORD-2812      │  │  │
│  │                     │  │  │   $59.99   ✅  │  │  │
│  │                     │  │  └────────────────┘  │  │
│  │                     │  │                      │  │
│  │                     │  │  [Ver todos los      │  │
│  │                     │  │   pedidos →]         │  │
│  └─────────────────────┘  └──────────────────────┘  │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

### 4.2 Pedidos (`/account/orders.astro`)

**Ruta:** `/account/orders`
**Propósito:** Historial completo de pedidos del usuario. Muestra cada pedido con su número, fecha, estado, items comprados y total. Permite ver detalles de cada pedido.

| Aspecto | Descripción |
|---|---|
| **Archivo** | `src/pages/account/orders.astro` |
| **Modo de render** | SSR |
| **Autenticación** | Requiere sesión |

#### Datos que necesita

```ts
const user = Astro.locals.user;
const orders = await getUserOrders(user.id);     // Todos los pedidos del usuario
```

#### Componentes que utiliza

| Componente | Propósito |
|---|---|
| `<BaseLayout />` | Layout base |
| `<AuthGuard />` | Protege la página |
| `<AccountNav />` | Navegación lateral |
| `<OrderCard />` | Resumen de pedido individual |
| `<OrderStatusBadge />` | Badge de estado: Pagado, Enviado, Entregado, Cancelado |
| `<EmptyState />` | Mensaje "Aún no has realizado ninguna compra" |

#### SEO Metadata

```html
<title>Mis pedidos | 007-Sama</title>
<meta name="robots" content="noindex, nofollow" />
```

#### Wireframe textual

```
┌────────────────────────────────────────────────────┐
│  [Logo]  [Catálogo] [Ofertas] [Noticias]  🔍 🛒    │
├────────────────────────────────────────────────────┤
│  Inicio > Mi cuenta > Mis pedidos                   │
├────────────────────────────────────────────────────┤
│  ┌── AccountNav ──────┐  ┌── Orders List ───────┐  │
│  │                     │  │                       │  │
│  │  👤 Mi perfil       │  │  📦 Mis pedidos       │  │
│  │  📦 Mis pedidos     │  │                       │  │
│  │  ❤️ Lista de deseos │  │  ┌── OrderCard ────┐  │  │
│  │  ⚙️ Configuración  │  │  │ Pedido #ORD-2847 │  │  │
│  │  🚪 Cerrar sesión   │  │  │ 10 junio 2026    │  │  │
│  │                     │  │  │ [Entregado]       │  │  │
│  │                     │  │  │ 🎮 Elden Ring    │  │  │
│  │                     │  │  │ 🎮 Baldur's Gate │  │  │
│  │                     │  │  │ 🎮 Hades II      │  │  │
│  │                     │  │  │ Total: $228.80   │  │  │
│  │                     │  │  │ [Ver detalle →]  │  │  │
│  │                     │  │  └─────────────────┘  │  │
│  │                     │  │                       │  │
│  │                     │  │  ┌── OrderCard ────┐  │  │
│  │                     │  │  │ Pedido #ORD-2812 │  │  │
│  │                     │  │  │ 1 mayo 2026      │  │  │
│  │                     │  │  │ [Enviado]         │  │  │
│  │                     │  │  │ 🎮 Cyberpunk 2077│  │  │
│  │                     │  │  │ Total: $29.99    │  │  │
│  │                     │  │  │ [Ver detalle →]  │  │  │
│  │                     │  │  └─────────────────┘  │  │
│  │                     │  │                       │  │
│  │                     │  │  [← 1 2 3 →]         │  │
│  └─────────────────────┘  └───────────────────────┘  │
│                                                    │
├────────────────────────────────────────────────────┤
│  [Footer]                                           │
└────────────────────────────────────────────────────┘
```

---

## 5. Apéndice: Mapa de Datos

### Resumen de datos por página

| Página | Fuente de datos | Estrategia | Cache |
|---|---|---|---|
| `/` | `getCollection('games')` + `getCollection('news')` | Build (SSG) | CDN |
| `/games` | `getCollection('games')` | Build (SSG) | CDN |
| `/games/[slug]` | `getCollection('games')` via `getStaticPaths` | Build (SSG) | CDN |
| `/new-releases` | `getCollection('games')` filtrado por fecha | Build (SSG) | CDN |
| `/news` | `getCollection('news')` | Build (SSG) | CDN |
| `/news/[slug]` | `getCollection('news')` via `getStaticPaths` | Build (SSG) | CDN |
| `/cart` | Nano Stores (cliente) + `POST /api/cart` | Client-side | — |
| `/checkout` | DB via SSR (`getSession` + queries) | Request (SSR) | No |
| `/checkout/confirmation` | DB via SSR | Request (SSR) | No |
| `/account` | `Astro.locals.user` (del middleware) | Request (SSR) | No |
| `/account/orders` | DB via SSR | Request (SSR) | No |

### Estrategia de carga de datos

```
SSG (build):
  getCollection('games') ──────────────► /, /games, /games/[slug], /new-releases
  getCollection('news')  ──────────────► /news, /news/[slug]

SSR (cada request):
  getSession(request) ──────────────► /checkout, /account, /account/orders
  DB queries          ──────────────►
       getUserOrders(user.id)
       getCartFromDB(user.id)
       getUserAddresses(user.id)

Client (después de carga):
  Nano Stores ──────────────────────► /cart (sincronizado con POST /api/cart)
```

### Estados de autenticación por página

| Página | guest | user (verificado) | premium | editor | admin |
|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/games` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/games/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/new-releases` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/news` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/news/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/cart` | ✅ (ver pero no comprar) | ✅ | ✅ | ✅ | ✅ |
| `/checkout` | ❌ (redirect login) | ✅ | ✅ | ✅ | ✅ |
| `/checkout/confirmation` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/account` | ❌ (redirect login) | ✅ | ✅ | ✅ | ✅ |
| `/account/orders` | ❌ (redirect login) | ✅ (propios) | ✅ (propios) | ✅ (propios) | ✅ (todos) |
