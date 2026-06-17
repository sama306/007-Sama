# Sistema de Routing — 007-Sama (Tienda de Videojuegos)

> **Framework:** Astro 6.x (file-based routing)  
> **Output:** Hybrid (`output: 'hybrid'` — SSG por defecto, SSR por ruta)  
> **Idioma:** Español

---

## Índice

1. [Principios del Routing](#1-principios-del-routing)
2. [Rutas Estáticas](#2-rutas-estáticas)
3. [Rutas Dinámicas con `getStaticPaths`](#3-rutas-dinámicas-con-getstaticpaths)
4. [Rutas por Categoría](#4-rutas-por-categoría)
5. [Rutas de Usuario Autenticado](#5-rutas-de-usuario-autenticado)
6. [Rutas de Noticias](#6-rutas-de-noticias)
7. [Rutas de Nuevos Lanzamientos](#7-rutas-de-nuevos-lanzamientos)
8. [Middleware para Protección de Rutas Privadas](#8-middleware-para-protección-de-rutas-privadas)
9. [Manejo de 404 y Errores](#9-manejo-de-404-y-errores)
10. [SSR vs SSG — Cuándo usar cada uno](#10-ssr-vs-ssg--cuándo-usar-cada-uno)
11. [Mapa de Rutas Completo](#11-mapa-de-rutas-completo)

---

## 1. Principios del Routing

| Principio | Descripción |
|---|---|
| **File-based** | Cada archivo en `src/pages/` se traduce a una ruta; los directorios crean jerarquías. |
| **Static-first** | Todas las rutas son SSG por defecto. Solo rutas que requieren sesión usan SSR. |
| **`[param]` para dinámicas** | Corchetes denotan segmentos dinámicos en la URL. |
| **`[...rest]` para splats** | Spread operator captura segmentos residuales. |
| **SSR por ruta** | Con `output: 'hybrid'`, se marca una ruta como SSR exportando `export const prerender = false`. |

### Configuración base (`astro.config.mjs`)

```js
// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://007-sama.com',
  output: 'hybrid',             // SSG default + SSR para rutas protegidas
  adapter: vercel(),
});
```

---

## 2. Rutas Estáticas

Son rutas sin parámetros dinámicos. Se genera un archivo HTML por cada una durante `astro build`.

### Mapa de rutas estáticas

| Archivo | Ruta | Descripción |
|---|---|---|
| `src/pages/index.astro` | `/` | Portada con juegos destacados y nuevos lanzamientos |
| `src/pages/games/index.astro` | `/games` | Catálogo completo con filtros |
| `src/pages/new-releases.astro` | `/new-releases` | Lanzamientos recientes |
| `src/pages/news/index.astro` | `/news` | Listado de noticias |

### Ejemplo — Página principal (`src/pages/index.astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import GameGrid from '@/components/game/GameGrid.astro';
import { getCollection } from 'astro:content';

const featuredGames = await getCollection('games', ({ data }) => data.featured);
const newReleases = await getCollection('games', ({ data }) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return data.releaseDate >= thirtyDaysAgo;
});
---
<BaseLayout title="007-Sama — Tu tienda de videojuegos">
  <section>
    <h1>Destacados</h1>
    <GameGrid games={featuredGames} />
  </section>
  <section>
    <h2>Nuevos lanzamientos</h2>
    <GameGrid games={newReleases} />
  </section>
</BaseLayout>
```

### Ejemplo — Catálogo (`src/pages/games/index.astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import GameFilters from '@/components/game/GameFilters.astro';
import GameGrid from '@/components/game/GameGrid.astro';
import { getCollection } from 'astro:content';

const games = await getCollection('games');
const genres = [...new Set(games.map((g) => g.data.genre))];
const platforms = [...new Set(games.flatMap((g) => g.data.platform))];
---
<BaseLayout title="Catálogo de juegos | 007-Sama">
  <GameFilters genres={genres} platforms={platforms} />
  <GameGrid games={games} />
</BaseLayout>
```

---

## 3. Rutas Dinámicas con `getStaticPaths`

Se usan para páginas cuyo contenido depende de un parámetro en la URL. `getStaticPaths()` define qué valores genera Astro en build.

### Estructura

```
src/pages/games/
  └── [slug].astro        →  /games/elden-ring, /games/bg3, ...
```

### Ejemplo — Detalle de juego (`src/pages/games/[slug].astro`)

```astro
---
import GameLayout from '@/layouts/GameLayout.astro';
import RatingStars from '@/components/game/RatingStars.astro';
import { getEntry, getCollection } from 'astro:content';

// --- Generación de rutas en build ---
export async function getStaticPaths() {
  const games = await getCollection('games');
  return games.map((game) => ({
    params: { slug: game.data.slug },
    props: { game },
  }));
}

const { game } = Astro.props;
const { Content } = await game.render();
---
<GameLayout game={game.data}>
  <Content />
  <RatingStars rating={game.data.rating} />
</GameLayout>
```

### Reglas de `getStaticPaths`

| Regla | Explicación |
|---|---|
| **Export nombrada** | `export async function getStaticPaths()` |
| **Retorna array** | Cada elemento con `{ params, props }` |
| **`params`** | Objeto que coincide con los parámetros `[param]` del filename |
| **`props`** | (Opcional) Datos pasados al componente como `Astro.props` |
| **Ejecución en build** | Solo se llama durante `astro build` |

---

## 4. Rutas por Categoría

### 4.1 Por género (`/games/genre/[genre]`)

```
src/pages/games/genre/
  └── [genre].astro  →  /games/genre/rpg, /games/genre/action, ...
```

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import GameGrid from '@/components/game/GameGrid.astro';
import Breadcrumbs from '@/components/layout/Breadcrumbs.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const games = await getCollection('games');
  const genres = [...new Set(games.map((g) => g.data.genre))];

  return genres.map((genre) => ({
    params: { genre },
    props: {
      games: games.filter((g) => g.data.genre === genre),
      genre,
    },
  }));
}

const { games, genre } = Astro.props;
const genreName = { rpg: 'RPG', action: 'Acción', strategy: 'Estrategia' }[genre] ?? genre;
---
<BaseLayout title={`Juegos de ${genreName} | 007-Sama`}>
  <Breadcrumbs path={[{ label: 'Juegos', href: '/games' }, { label: genreName }]} />
  <h1>Juegos de {genreName}</h1>
  <GameGrid games={games} />
</BaseLayout>
```

### 4.2 Por plataforma (`/games/platform/[platform]`)

```
src/pages/games/platform/
  └── [platform].astro  →  /games/platform/pc, /games/platform/ps5, ...
```

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import GameGrid from '@/components/game/GameGrid.astro';
import Breadcrumbs from '@/components/layout/Breadcrumbs.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const games = await getCollection('games');
  const platforms = [...new Set(games.flatMap((g) => g.data.platform))];

  return platforms.map((platform) => ({
    params: { platform },
    props: {
      games: games.filter((g) => g.data.platform.includes(platform)),
      platform,
    },
  }));
}

const { games, platform } = Astro.props;
const platformName = { pc: 'PC', ps5: 'PlayStation 5', 'xbox-series-x': 'Xbox Series X', switch: 'Nintendo Switch' }[platform] ?? platform;
---
<BaseLayout title={`Juegos para ${platformName} | 007-Sama`}>
  <Breadcrumbs path={[{ label: 'Juegos', href: '/games' }, { label: platformName }]} />
  <h1>Juegos para {platformName}</h1>
  <GameGrid games={games} />
</BaseLayout>
```

### 4.3 Consideraciones de rendimiento

- Si el número de categorías crece (>50), considera **SSR bajo demanda** en vez de SSG para evitar builds largos.
- Para SSG, marca `export const prerender = false` en la ruta y usa `Astro.params` para consultar en cada request.

```astro
---
// Alternativa SSR para catálogos grandes
export const prerender = false;

import BaseLayout from '@/layouts/BaseLayout.astro';
import GameGrid from '@/components/game/GameGrid.astro';
import { getCollection } from 'astro:content';

const { genre } = Astro.params;
const games = await getCollection('games', ({ data }) => data.genre === genre);
---
<BaseLayout title={`Juegos de ${genre} | 007-Sama`}>
  <GameGrid games={games} />
</BaseLayout>
```

---

## 5. Rutas de Usuario Autenticado

### Estructura de archivos

```
src/pages/account/
  ├── index.astro        →  /account
  ├── orders.astro       →  /account/orders
  └── wishlist.astro     →  /account/wishlist
```

### 5.1 Dashboard (`src/pages/account/index.astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import { getSession } from '@/lib/auth';

// SSR: requiere sesión en cada request
export const prerender = false;

const session = await getSession(Astro.request);
const user = session.user;
---
<BaseLayout title="Mi cuenta | 007-Sama">
  <AuthGuard session={session}>
    <h1>Bienvenido, {user.name}</h1>
    <nav aria-label="Navegación de cuenta">
      <a href="/account/orders">Mis pedidos</a>
      <a href="/account/wishlist">Lista de deseos</a>
      <a href="/auth/logout">Cerrar sesión</a>
    </nav>
  </AuthGuard>
</BaseLayout>
```

### 5.2 Órdenes (`src/pages/account/orders.astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import { getSession } from '@/lib/auth';
import { getUserOrders } from '@/db/queries';

export const prerender = false;

const session = await getSession(Astro.request);
const orders = await getUserOrders(session.user.id);
---
<BaseLayout title="Mis pedidos | 007-Sama">
  <AuthGuard session={session}>
    <h1>Mis pedidos</h1>
    {orders.length === 0 ? (
      <p>Aún no has realizado ninguna compra.</p>
    ) : (
      <ul>
        {orders.map((order) => (
          <li>
            <strong>Pedido #{order.id}</strong> — {order.status} — ${order.total}
          </li>
        ))}
      </ul>
    )}
  </AuthGuard>
</BaseLayout>
```

### 5.3 Lista de deseos (`src/pages/account/wishlist.astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import GameGrid from '@/components/game/GameGrid.astro';
import { getSession } from '@/lib/auth';
import { getUserWishlist } from '@/db/queries';

export const prerender = false;

const session = await getSession(Astro.request);
const wishlistGames = await getUserWishlist(session.user.id);
---
<BaseLayout title="Lista de deseos | 007-Sama">
  <AuthGuard session={session}>
    <h1>Lista de deseos</h1>
    {wishlistGames.length === 0 ? (
      <p>No tienes juegos guardados.</p>
    ) : (
      <GameGrid games={wishlistGames} />
    )}
  </AuthGuard>
</BaseLayout>
```

### Notas sobre rutas protegidas

- `export const prerender = false` obliga a Astro a renderizar cada request en el servidor.
- `getSession()` lee la cookie de sesión y valida el token JWT.
- `AuthGuard` redirige a `/auth/login` si no hay sesión activa (ver sección 8).
- Todas las rutas `/account/*` **deben** ser SSR — nunca pre-renderizarlas.

---

## 6. Rutas de Noticias

### Estructura de archivos

```
src/pages/news/
  ├── index.astro        →  /news
  └── [slug].astro       →  /news/parche-1-5, /news/nuevo-torneo, ...
```

### 6.1 Listado de noticias (`src/pages/news/index.astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const newsEntries = await getCollection('news');
const sorted = newsEntries.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---
<BaseLayout title="Noticias | 007-Sama">
  <h1>Noticias</h1>
  <ul>
    {sorted.map((entry) => (
      <li>
        <a href={`/news/${entry.data.slug}`}>
          <h2>{entry.data.title}</h2>
          <time datetime={entry.data.pubDate.toISOString()}>
            {entry.data.pubDate.toLocaleDateString('es-ES')}
          </time>
        </a>
      </li>
    ))}
  </ul>
</BaseLayout>
```

### 6.2 Detalle de noticia (`src/pages/news/[slug].astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getEntry, getCollection } from 'astro:content';

export async function getStaticPaths() {
  const newsEntries = await getCollection('news');
  return newsEntries.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---
<BaseLayout title={`${entry.data.title} | 007-Sama`}>
  <article>
    <time datetime={entry.data.pubDate.toISOString()}>
      {entry.data.pubDate.toLocaleDateString('es-ES')}
    </time>
    <Content />
  </article>
</BaseLayout>
```

---

## 7. Rutas de Nuevos Lanzamientos

### Estructura de archivos

```
src/pages/
  └── new-releases.astro  →  /new-releases
```

### Criterios de "nuevo lanzamiento"

- Juegos publicados en los últimos 30 días.
- Juegos próximos con fecha de lanzamiento futura (pre-orders).
- Ordenados por fecha de lanzamiento descendente.

### Ejemplo (`src/pages/new-releases.astro`)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import GameGrid from '@/components/game/GameGrid.astro';
import { getCollection } from 'astro:content';

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentGames = await getCollection('games', ({ data }) => {
  return data.releaseDate >= thirtyDaysAgo;
});

const sorted = recentGames.sort((a, b) => b.data.releaseDate.valueOf() - a.data.releaseDate.valueOf());
---
<BaseLayout title="Nuevos lanzamientos | 007-Sama">
  <h1>Nuevos lanzamientos</h1>
  <p>Juegos publicados en los últimos 30 días.</p>
  <GameGrid games={sorted} />
</BaseLayout>
```

---

## 8. Middleware para Protección de Rutas Privadas

### Configuración

El middleware se define en `src/middleware.ts` (o `.js`) y se ejecuta en cada request para rutas SSR.

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware';
import { getSession } from '@/lib/auth';

const privateRoutes = [
  '/account',
  '/account/orders',
  '/account/wishlist',
  '/checkout',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;

  // Verificar si la ruta requiere autenticación
  const isPrivate = privateRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPrivate) {
    const session = await getSession(context.request);

    if (!session) {
      // Redirigir al login con redirect URL post-login
      return redirect(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }

    // Adjuntar la sesión al contexto local para usarla en páginas
    context.locals.session = session;
    context.locals.user = session.user;
  }

  return next();
});
```

### Declaración de tipos para `context.locals`

```ts
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    session: Session | null;
    user: {
      id: string;
      name: string;
      email: string;
    } | null;
  }
}
```

### Uso en páginas SSR

```astro
---
// src/pages/account/index.astro
export const prerender = false;

const user = Astro.locals.user;
// `Astro.locals.session` ya está poblado por el middleware
---
<BaseLayout title="Mi cuenta | 007-Sama">
  <h1>Bienvenido, {user.name}</h1>
</BaseLayout>
```

### Flujo de protección

```
Request → /account/orders
              │
              ▼
        middleware.ts
              │
              ├── ¿Ruta privada? ──No──→ next() (sigue normal)
              │
              ▼ Sí
        getSession(request)
              │
              ├── ¿Sesión válida? ──No──→ redirect(/auth/login?redirect=...)
              │
              ▼ Sí
        context.locals.user = session.user
              │
              ▼
        next() → página renderizada con usuario disponible
```

---

## 9. Manejo de 404 y Errores

### 9.1 Página 404 personalizada

`src/pages/404.astro` se sirve automáticamente para todas las rutas no encontradas.

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';

export const prerender = false; // SSR para capturar cualquier ruta no definida
---
<BaseLayout title="Página no encontrada | 007-Sama">
  <main class="flex flex-col items-center justify-center min-h-[60vh]">
    <h1>404</h1>
    <p>La página que buscas no existe.</p>
    <a href="/">Volver al inicio</a>
  </main>
</BaseLayout>
```

### 9.2 Manejo de errores SSR

Para rutas SSR, puedes capturar errores con un try-catch en el frontmatter y renderizar estados alternativos.

```astro
---
// src/pages/games/[slug].astro (variante SSR con manejo de errores)
export const prerender = false;

import BaseLayout from '@/layouts/BaseLayout.astro';
import { getEntry } from 'astro:content';

const { slug } = Astro.params;

let game;
try {
  const entry = await getEntry('games', slug);
  if (!entry) {
    return Astro.redirect('/404');
  }
  game = entry;
} catch (error) {
  return Astro.redirect('/500');
}
---
<BaseLayout title={game.data.title}>
  <!-- renderizar detalle del juego -->
</BaseLayout>
```

### 9.3 Página de error genérica (500)

Astro muestra una página de error genérica por defecto. Puedes sobreescribirla creando `src/pages/500.astro` o manejando errores en el middleware:

```ts
// src/middleware.ts — Catch global de errores
export const onRequest = defineMiddleware(async (context, next) => {
  try {
    return await next();
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 9.4 Estrategia de 404 para catálogos dinámicos

Cuando un slug no existe en `getStaticPaths`, Astro genera un 404 automáticamente en build. Para contenido que cambia frecuentemente (no pre-renderizado), usa SSR con validación manual:

```astro
---
// src/pages/news/[slug].astro — manejo de entrada inexistente
export const prerender = false;

import BaseLayout from '@/layouts/BaseLayout.astro';
import { getEntry } from 'astro:content';

const { slug } = Astro.params;
const entry = await getEntry('news', slug);

if (!entry) {
  return Astro.redirect('/404', 404);
}

const { Content } = await entry.render();
---
<BaseLayout title={entry.data.title}>
  <Content />
</BaseLayout>
```

---

## 10. SSR vs SSG — Cuándo usar cada uno

| Criterio | SSG (static) | SSR (server) |
|---|---|---|
| **Contenido** | Público, cambia poco | Personalizado, cambia por usuario |
| **Datos** | De Content Collections (build) | De base de datos (request) |
| **Sesión** | No requiere | Requiere autenticación |
| **Rendimiento** | CDN, instantáneo | Serverless, latencia de cold start |
| **SEO** | Óptimo (HTML pre-generado) | Bueno (HTML generado por request) |
| **Ejemplos** | `/`, `/games`, `/games/[slug]`, `/news` | `/account/*`, `/checkout`, `/api/*` |

### Decisión por ruta

```astro
---
// Ruta SSG (default) — Todo se ejecuta en build
// src/pages/games/[slug].astro
export async function getStaticPaths() { ... }
---
```

```astro
---
// Ruta SSR — Se ejecuta en cada request
// src/pages/account/index.astro
export const prerender = false;

const session = await getSession(Astro.request);
---
```

### Árbol de decisión rápido

```
¿La página requiere sesión de usuario?
  ├── Sí → SSR (export const prerender = false)
  └── No → ¿Los datos cambian en cada request?
              ├── Sí → SSR
              └── No → ¿Hay más de 500 rutas dinámicas?
                          ├── Sí → SSR (build muy lento)
                          └── No → SSG con getStaticPaths
```

---

## 11. Mapa de Rutas Completo

| Ruta | Archivo | Tipo | Protegida | Estrategia |
|---|---|---|---|---|
| `/` | `src/pages/index.astro` | Estática | No | SSG |
| `/games` | `src/pages/games/index.astro` | Estática | No | SSG |
| `/games/[slug]` | `src/pages/games/[slug].astro` | Dinámica | No | SSG (`getStaticPaths`) |
| `/games/genre/[genre]` | `src/pages/games/genre/[genre].astro` | Dinámica | No | SSG (`getStaticPaths`) |
| `/games/platform/[platform]` | `src/pages/games/platform/[platform].astro` | Dinámica | No | SSG (`getStaticPaths`) |
| `/new-releases` | `src/pages/new-releases.astro` | Estática | No | SSG |
| `/news` | `src/pages/news/index.astro` | Estática | No | SSG |
| `/news/[slug]` | `src/pages/news/[slug].astro` | Dinámica | No | SSG (`getStaticPaths`) |
| `/account` | `src/pages/account/index.astro` | Estática | Sí | SSR |
| `/account/orders` | `src/pages/account/orders.astro` | Estática | Sí | SSR |
| `/account/wishlist` | `src/pages/account/wishlist.astro` | Estática | Sí | SSR |
| `/cart` | `src/pages/cart/index.astro` | Estática | No | SSG + Client |
| `/checkout` | `src/pages/checkout/index.astro` | Estática | Sí | SSR |
| `/checkout/confirmation` | `src/pages/checkout/confirmation.astro` | Estática | Sí | SSR |
| `/auth/login` | `src/pages/auth/login.astro` | Estática | No | SSG |
| `/auth/register` | `src/pages/auth/register.astro` | Estática | No | SSG |
| `/search?q=` | `src/pages/search.astro` | Estática | No | SSG + Client |
| `/about` | `src/pages/about.astro` | Estática | No | SSG |
| `/404` | `src/pages/404.astro` | Estática | No | SSR |
| *API* | `src/pages/api/*.ts` | Endpoint | Varía | SSR |

### Resumen de archivos necesarios en `src/pages/`

```
src/pages/
├── index.astro                    /
├── 404.astro                     (catch-all 404)
├── 500.astro                     (error server)
├── new-releases.astro            /new-releases
├── search.astro                  /search
├── about.astro                   /about
│
├── games/
│   ├── index.astro               /games
│   ├── [slug].astro              /games/[slug]
│   ├── genre/
│   │   └── [genre].astro         /games/genre/[genre]
│   └── platform/
│       └── [platform].astro      /games/platform/[platform]
│
├── news/
│   ├── index.astro               /news
│   └── [slug].astro              /news/[slug]
│
├── account/
│   ├── index.astro               /account
│   ├── orders.astro              /account/orders
│   └── wishlist.astro            /account/wishlist
│
├── cart/
│   └── index.astro               /cart
│
├── checkout/
│   ├── index.astro               /checkout
│   └── confirmation.astro        /checkout/confirmation
│
├── auth/
│   ├── login.astro               /auth/login
│   ├── register.astro            /auth/register
│   └── logout.astro              /auth/logout
│
└── api/
    ├── cart.ts                   POST/GET/DELETE /api/cart
    ├── auth.ts                   POST /api/auth/login, /api/auth/register
    └── search.ts                 GET /api/search?q=
```
