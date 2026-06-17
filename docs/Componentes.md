# Componentes de UI — Tienda de Videojuegos

> **Framework:** Astro 6.x  
> **Propósito:** Documentación de componentes reutilizables con props, variantes y ejemplos de uso.

---

## Índice

1. [GameCard](#gamecard)
2. [Navbar](#navbar)
3. [HeroSlider](#heroslider)
4. [PriceTag](#pricetag)
5. [PlatformBadge](#platformbadge)
6. [Searchbar](#searchbar)
7. [RatingStar](#ratingstar)
8. [CartDrawer](#cartdrawer)

---

## GameCard

Tarjeta de producto que muestra la información principal de un videojuego en catálogos, grillas y listados.

### Props

```ts
/**
 * @file src/components/game/GameCard.astro
 */

import type { Game } from '@/types/game';

export interface Props {
  /** Datos completos del juego a renderizar */
  game: Game;
  /** Variante de visualización de la tarjeta */
  variant?: 'default' | 'compact' | 'featured';
  /** Callback opcional al hacer clic en "Agregar al carrito" */
  onAddToCart?: (gameId: string) => void;
  /** Si la tarjeta está en la lista de deseos del usuario */
  isWishlisted?: boolean;
}
```

### Variantes

| Variante   | Descripción                                         |
|------------|-----------------------------------------------------|
| `default`  | Tarjeta estándar con imagen, título y precio.       |
| `compact`  | Versión reducida para listados laterales o grids.   |
| `featured` | Tarjeta destacada con bordes y badges prominentes.  |

### Ejemplo

```astro
---
import GameCard from '@/components/game/GameCard.astro';
import type { Game } from '@/types/game';

const featuredGames: Game[] = [
  {
    id: 'elden-ring',
    title: 'Elden Ring',
    slug: 'elden-ring',
    price: 59.99,
    genre: 'rpg',
    platform: ['ps5', 'xbox-series-x', 'pc'],
    rating: 4.8,
    image: await import('@/assets/games/elden-ring.webp'),
    inStock: true,
  },
];
---

<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {featuredGames.map((game) => (
    <GameCard game={game} variant="default" />
  ))}
</section>
```

```astro
{-- Variante compacta --}
<GameCard game={game} variant="compact" />
```

```astro
{-- Variante destacada con wishlist --}
<GameCard game={game} variant="featured" isWishlisted={true} />
```

---

## Navbar

Barra de navegación principal del sitio. Incluye logo, enlaces de navegación, búsqueda, acceso al carrito y menú de usuario.

### Props

```ts
/**
 * @file src/components/layout/Navbar.astro
 */

import type { CartSummary } from '@/types/cart';

export interface NavLink {
  label: string;
  href: string;
  /** Roles que pueden ver este enlace (opcional) */
  roles?: ('guest' | 'user' | 'premium' | 'editor' | 'admin')[];
  /** Icono asociado (nombre del icono en el sistema de icons) */
  icon?: string;
}

export interface Props {
  /** Enlaces de navegación principales */
  links?: NavLink[];
  /** Estado del carrito para mostrar badge y total */
  cartSummary?: CartSummary;
  /** Usuario autenticado (null si no hay sesión) */
  user?: {
    name: string;
    avatar?: string;
    role: 'guest' | 'user' | 'premium' | 'editor' | 'admin';
  } | null;
  /** Si el usuario es admin (habilita enlace al panel) */
  isAdmin?: boolean;
  /** URL del logo (por defecto /favicon.svg) */
  logoSrc?: string;
  /** Texto alternativo del logo */
  logoAlt?: string;
}
```

### Variantes

| Variante       | Descripción                                                         |
|----------------|---------------------------------------------------------------------|
| `default`      | Navbar completa con logo, links, búsqueda, carrito y avatar.        |
| `minimal`      | Solo logo y enlaces esenciales (para landing o páginas auth).       |
| `transparent`  | Fondo transparente para overlays sobre hero sections.               |
| `sticky`       | Se fija en la parte superior al hacer scroll.                       |

### Ejemplo

```astro
---
import Navbar from '@/components/layout/Navbar.astro';

const links = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/games' },
  { label: 'Ofertas', href: '/games?discount=true' },
  { label: 'Novedades', href: '/games?sort=releaseDate' },
];

const user = {
  name: 'Carlos',
  avatar: '/avatars/carlos.jpg',
  role: 'user' as const,
};
---

<Navbar
  links={links}
  cartSummary={{ totalItems: 3, totalPrice: 149.97 }}
  user={user}
  isAdmin={false}
/>
```

```astro
{-- Navbar transparente para hero section --}
<Navbar links={links} variant="transparent" />
```

```astro
{-- Navbar sin sesión iniciada --}
<Navbar links={links} />
```

---

## HeroSlider

Slider de juegos destacados y ofertas ubicado en la página principal. Cada slide contiene una imagen de fondo, título, descripción, precio y llamado a la acción.

### Props

```ts
/**
 * @file src/components/ui/HeroSlider.astro
 */

export interface HeroSlide {
  /** Título del juego destacado */
  title: string;
  /** Descripción breve */
  description: string;
  /** Imagen de fondo del slide */
  image: ImageMetadata;
  /** URL del juego */
  link: string;
  /** Precio actual del juego */
  price: number;
  /** Precio original (si tiene descuento) */
  originalPrice?: number;
  /** Badge de promoción (ej: "40% OFF", "Nuevo Lanzamiento") */
  badge?: string;
  /** Color de overlay oscuro (para legibilidad del texto) */
  overlayColor?: string;
  /** Opacidad del overlay (0-1) */
  overlayOpacity?: number;
}

export interface Props {
  /** Slides del slider */
  slides: HeroSlide[];
  /** Intervalo de auto-play en milisegundos */
  autoplayInterval?: number;
  /** Si se muestran los indicadores (dots) de navegación */
  showIndicators?: boolean;
  /** Si se muestran flechas de navegación */
  showArrows?: boolean;
  /** Altura del slider (por defecto '60vh') */
  height?: string;
}
```

### Variantes

| Variante    | Descripción                                                            |
|-------------|------------------------------------------------------------------------|
| `default`   | Slider full-width con overlay oscuro, título y CTA.                    |
| `minimal`   | Solo imágenes sin texto (para secciones secundarias).                  |
| `cards`     | Los slides se muestran como tarjetas apiladas con efecto de scroll.    |
| `gameplay`  | Incluye preview de video o gameplay loop como fondo del slide.         |

### Ejemplo

```astro
---
import HeroSlider from '@/components/ui/HeroSlider.astro';

const slides = [
  {
    title: 'Elden Ring: Shadow of the Erdtree',
    description: 'Explora las Tierras Sombrías en la nueva expansión del GOTY 2022.',
    image: await import('@/assets/banners/elden-ring-banner.webp'),
    link: '/games/elden-ring',
    price: 39.99,
    originalPrice: 49.99,
    badge: '20% OFF',
  },
  {
    title: 'Black Myth: Wukong',
    description: 'Una aventura épica basada en la leyenda del Rey Mono.',
    image: await import('@/assets/banners/wukong-banner.webp'),
    link: '/games/black-myth-wukong',
    price: 59.99,
    badge: 'Nuevo Lanzamiento',
  },
  {
    title: 'Cyberpunk 2077',
    description: 'Vive el futuro en Night City con la actualización 2.0.',
    image: await import('@/assets/banners/cyberpunk-banner.webp'),
    link: '/games/cyberpunk-2077',
    price: 29.99,
    originalPrice: 59.99,
    badge: '50% OFF',
  },
];
---

<HeroSlider
  slides={slides}
  autoplayInterval={5000}
  showIndicators={true}
  showArrows={true}
  height="70vh"
/>
```

```astro
{-- Slider sin indicadores ni flechas, auto-play lento --}
<HeroSlider
  slides={slides}
  autoplayInterval={8000}
  showIndicators={false}
  showArrows={false}
/>
```

---

## PriceTag

Componente para mostrar precios de juegos con soporte para descuentos. Muestra el precio original tachado, el porcentaje de descuento y el precio final.

### Props

```ts
/**
 * @file src/components/ui/PriceTag.astro
 */

export interface Props {
  /** Precio final (con descuento aplicado) */
  price: number;
  /** Precio original (se muestra tachado si existe) */
  originalPrice?: number;
  /** Moneda (por defecto 'USD') */
  currency?: string;
  /** Locale para formateo del precio (por defecto 'es-ES') */
  locale?: string;
  /** Tamaño del componente */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Alineación del texto */
  align?: 'left' | 'center' | 'right';
  /** Si se debe ocultar el descuento (solo precio final) */
  hideDiscount?: boolean;
}
```

### Variantes

| Variante    | Descripción                                                           |
|-------------|-----------------------------------------------------------------------|
| `default`   | Precio final grande, original tachado, badge de descuento.            |
| `sale`      | Igual que default pero con colores llamativos (rojo/verde).           |
| `free`      | Muestra "Gratis" en lugar del precio.                                 |
| `from`      | Muestra "Desde $X.XX" para productos con variantes.                  |
| `no-stock`  | Muestra el precio pero con indicador de "Agotado".                    |

### Ejemplo

```astro
---
import PriceTag from '@/components/ui/PriceTag.astro';
---

{-- Precio con descuento --}
<PriceTag price={39.99} originalPrice={59.99} />

{-- Precio sin descuento --}
<PriceTag price={59.99} />

{-- Variante "Gratis" --}
<PriceTag price={0} variant="free" />

{-- Tamaño grande centrado --}
<PriceTag
  price={29.99}
  originalPrice={49.99}
  size="xl"
  align="center"
  currency="EUR"
  locale="es-ES"
/>
```

```astro
{-- Variante "desde" en listado --}
<PriceTag price={39.99} variant="from" />
```

```astro
{-- Precio sin badge de descuento --}
<PriceTag price={39.99} originalPrice={59.99} hideDiscount={true} />
```

---

## PlatformBadge

Badge que indica la plataforma o plataformas en las que está disponible un juego. Muestra el icono y nombre de cada plataforma.

### Props

```ts
/**
 * @file src/components/ui/PlatformBadge.astro
 */

import type { Platform } from '@/types/game';

export interface Props {
  /** Plataforma(s) a mostrar */
  platform: Platform | Platform[];
  /** Tamaño del badge */
  size?: 'sm' | 'md' | 'lg';
  /** Variante de visualización */
  variant?: 'icon' | 'text' | 'full' | 'pill';
  /** Si los badges se muestran en línea o apilados */
  inline?: boolean;
  /** Clases CSS adicionales */
  class?: string;
}
```

### Variantes

| Variante  | Descripción                                                         |
|-----------|---------------------------------------------------------------------|
| `icon`    | Solo el icono de la plataforma (sin texto).                         |
| `text`    | Solo el nombre de la plataforma (sin icono).                        |
| `full`    | Icono + nombre de la plataforma.                                    |
| `pill`    | Badge tipo pill con icono y nombre, fondo de color por plataforma.  |

### Colores por plataforma

| Plataforma      | Color        |
|-----------------|--------------|
| `pc`            | `#1a1a2e`    |
| `ps5`           | `#003791`    |
| `xbox-series-x` | `#107c10`    |
| `switch`        | `#e60012`    |

### Ejemplo

```astro
---
import PlatformBadge from '@/components/ui/PlatformBadge.astro';
---

{-- Plataforma única --}
<PlatformBadge platform="ps5" variant="full" />

{-- Múltiples plataformas en línea --}
<PlatformBadge
  platform={['ps5', 'xbox-series-x', 'pc']}
  variant="pill"
  inline={true}
  size="sm"
/>

{-- Solo iconos (compacto para grid) --}
<PlatformBadge
  platform={['pc', 'switch']}
  variant="icon"
  inline={true}
  size="md"
/>
```

```astro
{-- Badge tipo pill en detalle de juego --}
<PlatformBadge platform="switch" variant="pill" size="lg" />
```

---

## Searchbar

Barra de búsqueda con autocompletado, utilizada en la navbar y en la página de catálogo. Muestra sugerencias en tiempo real mientras el usuario escribe.

### Props — Búsqueda del lado del servidor (Astro)

```ts
/**
 * @file src/components/ui/Searchbar.astro
 *
 * NOTA: La lógica de autocompletado se hidrata con un island de JS liviano.
 *       Las sugerencias vienen del endpoint GET /api/search?q=.
 */

export interface SearchSuggestion {
  /** Título del juego sugerido */
  title: string;
  /** URL del juego */
  slug: string;
  /** Imagen miniatura */
  image?: string;
  /** Plataformas del juego */
  platforms?: string[];
  /** Precio actual */
  price?: number;
}

export interface Props {
  /** Placeholder del input */
  placeholder?: string;
  /** Endpoint de búsqueda para sugerencias */
  endpoint?: string;
  /** Texto del botón de búsqueda */
  buttonLabel?: string;
  /** Si el input se expande al hacer clic (para mobile) */
  expandable?: boolean;
  /** Ancho del input (por defecto '100%') */
  width?: string;
  /** Debounce en milisegundos antes de buscar */
  debounceMs?: number;
  /** Número máximo de sugerencias a mostrar */
  maxSuggestions?: number;
}
```

### Variantes

| Variante      | Descripción                                                       |
|---------------|-------------------------------------------------------------------|
| `default`     | Input con botón de búsqueda y dropdown de sugerencias.            |
| `autocomplete`| Modal/popup con resultados enriquecidos (imagen, precio, badge).  |
| `minimal`     | Solo input sin botón, estilo "search as you type".                |
| `hero`        | Versión grande y centrada para páginas de landing.                |

### Ejemplo

```astro
---
import Searchbar from '@/components/ui/Searchbar.astro';
---

{-- Buscador principal en navbar --}
<Searchbar
  placeholder="Buscar juegos..."
  endpoint="/api/search"
  expandable={true}
  maxSuggestions={6}
  client:load
/>
```

```astro
{-- Buscador hero en landing --}
<Searchbar
  placeholder="¿Qué juego buscas?"
  variant="hero"
  width="600px"
  debounceMs={300}
  client:idle
/>
```

```astro
{-- Buscador minimal con autocompletado --}
<Searchbar
  variant="minimal"
  placeholder="Buscar..."
  debounceMs={400}
  client:visible
/>
```

---

## RatingStar

Sistema de visualización de valoración por estrellas. Muestra la puntuación numérica y la cantidad de reseñas asociadas.

### Props

```ts
/**
 * @file src/components/ui/RatingStar.astro
 */

export interface Props {
  /** Valoración media (0-5, soporta decimales) */
  rating: number;
  /** Cantidad de reseñas (se muestra como "(123)") */
  reviewCount?: number;
  /** Tamaño de las estrellas */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Variante de visualización */
  variant?: 'stars' | 'numeric' | 'full' | 'compact';
  /** Número máximo de estrellas (por defecto 5) */
  maxStars?: number;
  /** Si las estrellas son interactivas (para reseñas) */
  interactive?: boolean;
  /** Color de estrellas activas */
  activeColor?: string;
  /** Color de estrellas inactivas */
  inactiveColor?: string;
}
```

### Variantes

| Variante   | Descripción                                                    |
|------------|----------------------------------------------------------------|
| `stars`    | Solo las estrellas gráficas.                                    |
| `numeric`  | Solo el número (ej: "4.5").                                     |
| `full`     | Estrellas + valor numérico + cantidad de reseñas.               |
| `compact`  | Estrellas pequeñas + conteo, para listados.                     |

### Ejemplo

```astro
---
import RatingStar from '@/components/ui/RatingStar.astro';
---

{-- Full: estrellas + puntuación + reseñas --}
<RatingStar rating={4.5} reviewCount={1287} variant="full" size="md" />

{-- Solo estrellas --}
<RatingStar rating={3.8} variant="stars" size="lg" />

{-- Compacto para listados --}
<RatingStar rating={4.2} reviewCount={342} variant="compact" size="sm" />

{-- Interactivo para formulario de reseña --}
<RatingStar rating={0} variant="stars" size="xl" interactive={true} maxStars={5} />
```

```astro
{-- Estrellas con color personalizado --}
<RatingStar
  rating={4.8}
  reviewCount={2048}
  variant="full"
  size="lg"
  activeColor="#f59e0b"
  inactiveColor="#374151"
/>
```

```astro
{-- En tarjeta de producto --}
<div class="flex items-center gap-2">
  <RatingStar rating={game.rating} variant="compact" size="sm" />
  <span class="text-sm text-gray-400">({game.reviewCount})</span>
</div>
```

---

## CartDrawer

Panel lateral deslizable (drawer) que muestra el contenido actual del carrito de compras. Incluye lista de items, subtotal, y enlace al checkout.

### Props

```ts
/**
 * @file src/components/cart/CartDrawer.astro
 *
 * NOTA: El estado del carrito se maneja mediante Nano Stores (cartStore).
 *       El drawer se hidrata como cliente para animaciones y persistencia.
 */

import type { CartItem } from '@/types/cart';

export interface Props {
  /** Items actuales en el carrito */
  items: CartItem[];
  /** Subtotal del carrito */
  subtotal: number;
  /** Si el drawer está abierto */
  isOpen: boolean;
  /** IVA/impuesto aplicado (por defecto 21%) */
  taxRate?: number;
  /** Costo de envío (0 si es gratis) */
  shipping?: number;
  /** Monto mínimo para envío gratis */
  freeShippingThreshold?: number;
  /** URL de la página de checkout */
  checkoutUrl?: string;
  /** Mensaje cuando el carrito está vacío */
  emptyMessage?: string;
  /** Callback al cerrar el drawer */
  onClose?: () => void;
}
```

### Variantes

| Variante    | Descripción                                                      |
|-------------|------------------------------------------------------------------|
| `default`   | Drawer desde la derecha con overlay oscuro.                      |
| `slideover` | Panel completo que cubre toda la pantalla en mobile.             |
| `dropdown`  | Dropdown del carrito (no drawer, para hover/click en navbar).    |
| `page`      | Página completa del carrito (para /cart).                        |

### Ejemplo

```astro
---
import CartDrawer from '@/components/cart/CartDrawer.astro';
import { cartStore } from '@/stores/cartStore';

const { items, subtotal, isOpen } = cartStore.get();
---

<CartDrawer
  items={items}
  subtotal={subtotal}
  isOpen={isOpen}
  taxRate={0.21}
  shipping={4.99}
  freeShippingThreshold={50}
  checkoutUrl="/checkout"
  emptyMessage="Tu carrito está vacío"
  onClose={() => cartStore.setKey('isOpen', false)}
  client:load
/>
```

```astro
{-- Ejemplo de CartItem (componente interno del drawer) --}
---
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

const { item } = Astro.props as CartItemProps;
---

<div class="flex gap-4 p-4 border-b border-gray-700">
  <img src={item.image} alt={item.title} class="w-16 h-16 object-cover rounded" />
  <div class="flex-1">
    <h4 class="font-medium">{item.title}</h4>
    <p class="text-sm text-gray-400">{item.platform}</p>
    <div class="flex items-center gap-2 mt-1">
      <button class="text-gray-400 hover:text-white" onclick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
      <span class="w-8 text-center">{item.quantity}</span>
      <button class="text-gray-400 hover:text-white" onclick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
    </div>
  </div>
  <div class="text-right">
    <p class="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
    <button class="text-sm text-red-400 hover:text-red-300" onclick={() => onRemove(item.id)}>Eliminar</button>
  </div>
</div>
```

```astro
{-- Drawer con envío gratis destacado --}
<CartDrawer
  {items}
  subtotal={32.99}
  isOpen={true}
  freeShippingThreshold={50}
  emptyMessage="Tu carrito está vacío"
  client:load
/>
```

---

## Convenciones Generales

### Ubicación de componentes

```
src/components/
├── ui/              # Componentes genéricos (PriceTag, PlatformBadge, Searchbar, RatingStar, HeroSlider)
├── game/            # Componentes del dominio juego (GameCard, GameGrid, GameDetails, RatingStars)
├── cart/            # Componentes del carrito (CartDrawer, CartItem, CartCounter)
├── layout/          # Componentes estructurales (Navbar, Footer, Sidebar, Breadcrumbs)
└── auth/            # Componentes de autenticación (LoginForm, RegisterForm, AuthGuard)
```

### Hidratación (client directives)

| Directiva         | Uso recomendado                                       |
|-------------------|-------------------------------------------------------|
| `client:load`     | Componentes visibles e inmediatos (Navbar, CartDrawer) |
| `client:idle`     | Componentes no críticos (Searchbar, HeroSlider)        |
| `client:visible`  | Componentes lazy al hacer scroll (RatingStar interactivo) |
| `client:media`    | Componentes solo para desktop o mobile                 |

### Patrones de estilos

- Los componentes usan clases de Tailwind CSS v4.
- Los colores y tokens se definen en `src/styles/tokens.css`.
- Cada componente acepta `class` como prop para personalización externa.
- Los estados de carga, vacío y error se manejan internamente con slots o props booleanas.
