# Arquitectura del Proyecto — 007-Sama (Tienda de Videojuegos)

> **Framework:** Astro 6.x  
> **Runtime:** Node >= 22.12.0  
> **Package Manager:** pnpm  
> **Idioma:** Español (código fuente en inglés)

---

## Índice

1. [Principios Arquitectónicos](#1-principios-arquitectónicos)
2. [Estructura de Directorios (Árbol Comentado)](#2-estructura-de-directorios-árbol-comentado)
3. [Descripción de Directorios y Propósito](#3-descripción-de-directorios-y-propósito)
4. [Convenciones de Nombrado](#4-convenciones-de-nombrado)
5. [Content Collections (Catálogo de Juegos)](#5-content-collections-catálogo-de-juegos)
6. [Ruteo y Páginas](#6-ruteo-y-páginas)
7. [Dependencias Principales](#7-dependencias-principales)
8. [Flujo de Datos](#8-flujo-de-datos)
9. [Estrategia de Build y Deploy](#9-estrategia-de-build-y-deploy)

---

## 1. Principios Arquitectónicos

| Principio | Descripción |
|---|---|
| **Islas de hidratación** | Solo los componentes interactivos (carrito, búsqueda, login) envían JS al cliente. El resto es HTML estático generado en build. |
| **Static-first** | SSG (Static Site Generation) como estrategia base. Las rutas dinámicas (detalle de juego, perfil) usan `getStaticPaths()`. |
| **Content-collections como fuente de verdad** | El catálogo de videojuegos se modela con Content Collections + Zod schema. |
| **Server islands bajo demanda** | Carrito y login se implementan como server islands con endpoint `POST` para operaciones mutables. |
| **Rendimiento Core Web Vitals** | LCP < 2.5 s, CLS < 0.1, INP < 200 ms. Optimización de imágenes con `astro:assets`. |

---

## 2. Estructura de Directorios (Árbol Comentado)

```
007-sama/
│
├── astro.config.mjs              # Configuración central de Astro (integraciones, output, vite)
├── tsconfig.json                  # TypeScript strict mode + alias @/
├── package.json                   # Dependencias y scripts del proyecto
├── pnpm-lock.yaml                 # Lockfile de dependencias
├── pnpm-workspace.yaml            # (Opcional) Configuración de monorepo
│
├── public/                        # Archivos estáticos (favicon, robots.txt, .well-known)
│   ├── favicon.ico
│   └── favicon.svg
│
├── src/                           # Código fuente de la aplicación
│   │
│   ├── content/                   # Content Collections (catálogo de juegos)
│   │   ├── config.ts              #   Define los schemas de colecciones con Zod
│   │   └── games/                 #   Archivos .md/.mdx — un archivo por juego
│   │       ├── elden-ring.md
│   │       ├── bg3.md
│   │       └── ...
│   │
│   ├── components/                # Componentes reutilizables (Astro, JSX, Svelte, etc.)
│   │   ├── ui/                    #   Componentes de interfaz genéricos (botones, inputs, modales)
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   ├── Badge.astro
│   │   │   └── Modal.astro
│   │   ├── game/                  #   Componentes específicos del dominio "juego"
│   │   │   ├── GameCard.astro     #     Tarjeta de producto en catálogo
│   │   │   ├── GameGrid.astro     #     Grilla responsiva de tarjetas
│   │   │   ├── GameDetails.astro  #     Sección de detalles ampliados
│   │   │   └── RatingStars.astro  #     Estrellas de valoración
│   │   ├── cart/                  #   Componentes del carrito de compras
│   │   │   ├── CartDrawer.astro   #     Drawer lateral del carrito
│   │   │   ├── CartItem.astro     #     Item individual dentro del carrito
│   │   │   └── CartCounter.astro  #     Contador en header (badge)
│   │   ├── layout/                #   Componentes estructurales del layout
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── Sidebar.astro
│   │   │   └── Breadcrumbs.astro
│   │   └── auth/                  #   Componentes de autenticación
│   │       ├── LoginForm.astro
│   │       ├── RegisterForm.astro
│   │       └── AuthGuard.astro    #     Envuelve contenido que requiere sesión
│   │
│   ├── layouts/                   # Layouts raíz (plantillas de página)
│   │   ├── BaseLayout.astro       #   Layout base: <html>, <head>, <body>, SEO, fuentes
│   │   ├── GameLayout.astro       #   Layout para páginas de detalle de juego
│   │   └── AdminLayout.astro      #   Layout para panel de administración
│   │
│   ├── pages/                     # Rutas y páginas de la aplicación (file-based routing)
│   │   ├── index.astro            #   Página principal / — catálogo destacado
│   │   ├── about.astro            #   /about — información del sitio
│   │   ├── contact.astro          #   /contact — formulario de contacto
│   │   ├── games/                 #   Rutas anidadas del catálogo
│   │   │   ├── index.astro        #     /games — listado completo con filtros
│   │   │   ├── [slug].astro       #     /games/[slug] — detalle de juego (ruta dinámica)
│   │   │   └── genre/
│   │   │       └── [genre].astro  #     /games/genre/[genre] — filtro por género
│   │   ├── cart/                  #   Rutas del carrito
│   │   │   └── index.astro        #     /cart — página completa del carrito
│   │   ├── checkout/              #   Proceso de compra
│   │   │   ├── index.astro        #     /checkout — resumen y formulario de pago
│   │   │   └── confirmation.astro #     /checkout/confirmation — post-pago
│   │   ├── account/               #   Área de usuario (protegida)
│   │   │   ├── index.astro        #     /account — dashboard del usuario
│   │   │   ├── orders.astro       #     /account/orders — historial de pedidos
│   │   │   └── wishlist.astro     #     /account/wishlist — lista de deseos
│   │   ├── auth/                  #   Rutas de autenticación
│   │   │   ├── login.astro        #     /auth/login
│   │   │   ├── register.astro     #     /auth/register
│   │   │   ├── logout.astro       #     /auth/logout (POST)
│   │   │   └── reset-password.astro #  /auth/reset-password
│   │   ├── search.astro           #   /search — resultados de búsqueda (?q=)
│   │   ├── 404.astro              #   Página personalizada de error 404
│   │   └── api/                   #   Endpoints de API (server endpoints)
│   │       ├── cart.ts            #     POST/GET/DELETE /api/cart
│   │       ├── auth.ts            #     POST /api/auth/login, /api/auth/register
│   │       └── search.ts          #     GET /api/search?q=
│   │
│   ├── db/                        # (Opcional) Capa de base de datos
│   │   ├── schema.ts              #   Esquemas de tablas (Drizzle / Astro DB)
│   │   ├── queries.ts             #   Consultas reutilizables
│   │   └── seed.ts                #   Script de seed para datos de prueba
│   │
│   ├── lib/                       # Utilidades y lógica de negocio
│   │   ├── constants.ts           #   Constantes globales (precios, impuestos, URLs)
│   │   ├── format.ts              #   Formateadores (precio, fecha)
│   │   ├── search.ts              #   Lógica de búsqueda (Fuse.js / mini-search)
│   │   ├── cart.ts                #   Lógica de carrito (CRUD server-side)
│   │   └── auth.ts                #   Lógica de autenticación (sesiones, cookies)
│   │
│   ├── stores/                    # Estado global del cliente (Nano Stores)
│   │   ├── cartStore.ts           #   Estado del carrito
│   │   ├── authStore.ts           #   Estado de sesión del usuario
│   │   └── uiStore.ts             #   Estado de UI (sidebar abierto, tema, etc.)
│   │
│   ├── types/                     # Tipos TypeScript compartidos
│   │   ├── game.ts                #   Game, Genre, Platform, etc.
│   │   ├── user.ts                #   User, Session
│   │   └── cart.ts                #   CartItem, CartSummary
│   │
│   └── styles/                    # Estilos globales
│       ├── global.css             #   Reset, variables CSS, tipografía
│       └── tokens.css             #   Design tokens (colores, espaciados, breakpoints)
│
├── tests/                         # Tests (Vitest + Playwright)
│   ├── unit/
│   │   ├── format.test.ts
│   │   └── cart.test.ts
│   ├── e2e/
│   │   ├── catalog.spec.ts
│   │   └── checkout.spec.ts
│   └── fixtures/
│       └── games.json
│
├── public/                        # Estáticos servidos sin transformación
│   ├── images/                    #   Imágenes de banner, logos, etc.
│   ├── fonts/                     #   Fuentes self-hosted
│   └── robots.txt
│
└── docs/                          # Documentación del proyecto
    ├── Architecture.md            #   Este archivo
    ├── API.md                     #   Documentación de endpoints
    └── CONTRIBUTING.md            #   Guía de contribución
```

---

## 3. Descripción de Directorios y Propósito

### `src/content/` — Content Collections

Gestiona el catálogo de videojuegos como archivos Markdown/MDX con frontmatter tipado.

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const gamesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    slug:        z.string(),
    description: z.string().max(280),
    price:       z.number().positive(),
    releaseDate: z.date(),
    genre:       z.enum(['action', 'rpg', 'strategy', 'adventure', 'simulation', 'sports', 'horror']),
    platform:    z.array(z.enum(['pc', 'ps5', 'xbox-series-x', 'switch'])),
    rating:      z.number().min(0).max(5),
    image:       z.string(),       // Ruta a imagen en src/assets/
    developer:   z.string(),
    publisher:   z.string(),
    featured:    z.boolean().default(false),
    inStock:     z.boolean().default(true),
    tags:        z.array(z.string()).optional(),
  }),
});

export const collections = { games: gamesCollection };
```

**Propósito:** Fuente única de verdad para el catálogo. Cada archivo `.md` representa un juego. Los componentes leen estas colecciones con `getCollection('games')` o `getEntry('games', slug)`.

### `src/components/` — Componentes

Componentes reutilizables organizados por dominio. Siguen el patrón de **componentes atómicos**: `ui/` contiene átomos y moléculas; `game/`, `cart/`, `auth/` contienen organismos específicos del negocio.

**Regla de importación:** Un componente en `game/` puede importar de `ui/`, pero no al revés.

### `src/layouts/` — Plantillas de Página

Layouts que envuelven el contenido de cada página. Usan `<slot />` para inyectar contenido y pueden recibir props como `title`, `description`, `breadcrumbs`.

```astro
---
// src/layouts/BaseLayout.astro
export interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const { title, description, ogImage } = Astro.props;
---
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | 007-Sama</title>
    <meta name="description" content={description ?? 'Tienda de videojuegos'} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <Header />
    <main><slot /></main>
    <Footer />
  </body>
</html>
```

### `src/pages/` — Rutas (File-based Routing)

Cada archivo `.astro` o `.md` dentro de `pages/` se convierte en una ruta pública. Los corchetes `[param]` indican rutas dinámicas.

| Archivo | Ruta generada | Tipo |
|---|---|---|
| `index.astro` | `/` | Estática |
| `games/index.astro` | `/games` | Estática (con filtros vía query params) |
| `games/[slug].astro` | `/games/elden-ring` | Dinámica (`getStaticPaths()`) |
| `games/genre/[genre].astro` | `/games/genre/rpg` | Dinámica |
| `api/cart.ts` | `POST /api/cart` | Endpoint server |

### `src/pages/api/` — Endpoints Server

Archivos `.ts` que exponen endpoints REST. Se ejecutan **solo en el servidor** (build o SSR). No envían JS al cliente.

```ts
// src/pages/api/cart.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json();
  // ... lógica de carrito
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

### `src/lib/` — Lógica de Negocio

Funciones puras y helpers sin estado. Aquí vive la lógica de formateo, búsqueda, cálculo de impuestos, etc.

### `src/stores/` — Estado Cliente (Nano Stores)

Usamos [Nano Stores](https://github.com/nanostores/nanostores) para estado reactivo del lado del cliente. Los stores se importan donde se necesitan sin contexto de provider.

```ts
// src/stores/cartStore.ts
import { atom, map } from 'nanostores';
import type { CartItem } from '@/types/cart';

export const cartItems = map<Record<string, CartItem>>({});
export const cartCount = atom(0);
```

### `src/types/` — Tipos Compartidos

Definiciones TypeScript que se usan a través de toda la aplicación. Prefijo `I` no usado — seguimos tipo nominal sin prefijos.

```ts
// src/types/game.ts
export interface Game {
  id: string;
  title: string;
  slug: string;
  price: number;
  genre: Genre;
  platform: Platform[];
  rating: number;
  image: ImageMetadata;
  inStock: boolean;
}

export type Genre = 'action' | 'rpg' | 'strategy' | 'adventure' | 'simulation' | 'sports' | 'horror';
export type Platform = 'pc' | 'ps5' | 'xbox-series-x' | 'switch';
```

### `src/styles/` — Estilos Globales

CSS global y design tokens. Usamos variables CSS personalizadas para mantener consistencia.

---

## 4. Convenciones de Nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos `.astro` | `PascalCase.astro` | `GameCard.astro` |
| Archivos `.astro` (páginas) | `kebab-case` | `reset-password.astro` |
| Archivos `.ts` (lógica) | `camelCase` | `cartStore.ts`, `format.ts` |
| Archivos `.ts` (tipos) | `camelCase` | `game.ts`, `user.ts` |
| Archivos `.css` | `camelCase` | `global.css`, `tokens.css` |
| Directorios | `kebab-case` | `game/`, `cart/`, `auth/` |
| Componentes (nombre) | Sustantivo descriptivo | `GameGrid`, `CartDrawer` |
| Props de componente | `camelCase` | `title`, `onAddToCart` |
| Interfaces | `PascalCase` (sin prefijo `I`) | `Game`, `CartItem` |
| Tipos (type alias) | `PascalCase` | `Genre`, `Platform` |
| Funciones | `camelCase`, verbo | `formatPrice()`, `getGamesByGenre()` |
| Stores | `camelCase` + sufijo `Store` | `cartStore`, `authStore` |
| Rutas dinámicas | `[param]` | `[slug].astro`, `[genre].astro` |
| Archivos de colección | `kebab-case` | `elden-ring.md`, `baldurs-gate-3.md` |

### Reglas Adicionales

- **Un componente por archivo.** No exportar múltiples componentes desde un mismo `.astro`.
- **Componentes de una sola palabra** reservados para elementos `ui/` (`Button.astro`, `Card.astro`).
- **Componentes compuestos** reflejan su dominio: `GameCard.astro`, `CartItem.astro`.
- **Layouts** llevan sufijo `Layout`: `BaseLayout.astro`, `AdminLayout.astro`.
- **Endpoints API** son archivos planos `.ts`, no carpetas con `index.ts`.

---

## 5. Content Collections (Catálogo de Juegos)

### Esquema (definido en `src/content/config.ts`)

Ver sección 3 para el schema completo con Zod.

### Archivo de ejemplo (`src/content/games/elden-ring.md`)

```markdown
---
title: "Elden Ring"
slug: "elden-ring"
description: "Explora las Tierras Intermedias en este aclamado RPG de acción."
price: 59.99
releaseDate: 2022-02-25
genre: "rpg"
platform: ["pc", "ps5", "xbox-series-x"]
rating: 4.8
image: "./images/elden-ring.jpg"
developer: "FromSoftware"
publisher: "Bandai Namco"
featured: true
inStock: true
tags: ["open-world", "souls-like", "multiplayer"]
---

## Acerca del juego

**Elden Ring** es un juego de rol de acción ambientado en un mundo abierto...

## Características

- Mundo abierto interconectado
- Personalización del personaje
- Combate táctico
- Multijugador cooperativo y PvP
```

### Consulta en páginas

```astro
---
// src/pages/games/[slug].astro
import { getEntry, getCollection } from 'astro:content';
import type { GetStaticPathsOptions } from 'astro';

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
</GameLayout>
```

---

## 6. Ruteo y Páginas

### Mapa de rutas completo

| Ruta | Página | Tipo | Protegida |
|---|---|---|---|
| `/` | Home — destacados y ofertas | SSG | No |
| `/games` | Catálogo completo con filtros | SSG | No |
| `/games/[slug]` | Detalle de juego | SSG | No |
| `/games/genre/[genre]` | Catálogo filtrado por género | SSG | No |
| `/cart` | Carrito de compras | SSG + Client | No |
| `/checkout` | Finalizar compra | SSR | Sí |
| `/checkout/confirmation` | Confirmación de pedido | SSR | Sí |
| `/account` | Panel de usuario | SSR | Sí |
| `/account/orders` | Historial de pedidos | SSR | Sí |
| `/account/wishlist` | Lista de deseos | SSR | Sí |
| `/auth/login` | Inicio de sesión | SSG | No |
| `/auth/register` | Registro | SSG | No |
| `/search?q=` | Resultados de búsqueda | SSG + Client | No |
| `/about` | Acerca de | SSG | No |
| `/contact` | Contacto | SSG | No |
| `/404` | Página no encontrada | SSG | No |

**Leyenda:** SSG = pre-renderizado estático en build; SSR = renderizado bajo demanda (server); Client = hidratación parcial en el navegador.

### Estrategia de rutas dinámicas

`[slug].astro` usa `getStaticPaths()` para generar todas las páginas de detalle en build. En proyectos con >1000 juegos, se recomienda incremental static regeneration mediante `astro:actions` o server island.

```astro
---
// src/pages/games/[slug].astro
export async function getStaticPaths() {
  const games = await getCollection('games');
  return games.map((game) => ({
    params: { slug: game.data.slug },
    props: { game },
  }));
}
---
```

---

## 7. Dependencias Principales

### `astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/serverless';
import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://007-sama.com',
  output: 'hybrid',       // SSG por defecto + SSR para rutas protegidas
  adapter: vercel(),       // Deploy en Vercel
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),               // Para componentes interactivos (carrito, login)
    sitemap(),
    auth(),                // Auth.js (ex NextAuth.js)
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    domains: ['cdn.007-sama.com'],
  },
  vite: {
    resolve: {
      alias: { '@': '/src' },
    },
  },
});
```

### Dependencias en `package.json`

```jsonc
{
  "dependencies": {
    // Core
    "astro": "^6.4.6",

    // Integraciones oficiales
    "@astrojs/tailwind": "^6.0.0",
    "@astrojs/react": "^4.0.0",
    "@astrojs/sitemap": "^3.2.0",
    "@astrojs/vercel": "^8.0.0",
    "@astrojs/db": "^0.14.0",

    // UI / Estilos
    "tailwindcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.0",
    "@tailwindcss/forms": "^0.5.0",

    // Estado del lado cliente
    "nanostores": "^0.11.0",

    // Autenticación
    "auth-astro": "^6.0.0",         // Adaptador de Auth.js para Astro
    "@auth/core": "^0.37.0",        // Core de Auth.js

    // Utilidades
    "zod": "^4.4.0",                // Validación de schemas (integrado en Content Collections)
    "fuse.js": "^7.0.0",            // Búsqueda client-side
    "sharp": "^0.33.0",             // Procesamiento de imágenes
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "@playwright/test": "^1.50.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0",
    "prettier-plugin-astro": "^0.14.0",
    "@astrojs/check": "^0.9.0",     // LSP y diagnóstico en .astro
  }
}
```

### Tabla de integraciones

| Integración | Propósito | ¿Obligatoria? |
|---|---|---|
| `@astrojs/tailwind` | Utilidades CSS atómicas para UI responsiva | Sí |
| `@astrojs/react` | Hidratación de componentes interactivos (carrito, login, búsqueda) | Sí |
| `@astrojs/sitemap` | Generación automática de `sitemap.xml` para SEO | Recomendada |
| `@astrojs/vercel` | Adaptador SSR para deploy en Vercel Edge/Functions | Sí (según hosting) |
| `@astrojs/db` | Base de datos integrada (pedidos, usuarios, sesiones) | Sí |
| `auth-astro` | Integración de Auth.js con Astro (GitHub, Google, credentials) | Sí |
| `@tailwindcss/typography` | Estilos tipográficos para contenido MDX (`prose`) | Recomendada |
| `@astrojs/check` | Type-checking en archivos `.astro` en tiempo real | Dev |

---

## 8. Flujo de Datos

```
                    ┌───────────────┐
                    │    Build      │
                    │  (astro build)│
                    └───────┬───────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
    ┌──────────────────┐       ┌──────────────────────┐
    │  SSG (estático)  │       │  SSR (bajo demanda)  │
    │                  │       │                      │
    │  • Home          │       │  • /checkout          │
    │  • Catálogo      │       │  • /account/*         │
    │  • Detalle juego │       │  • /api/*             │
    │  • About/Contact │       │  • /auth/*            │
    └────────┬─────────┘       └──────────┬───────────┘
             │                            │
             ▼                            ▼
    ┌──────────────────┐       ┌──────────────────────┐
    │  CDN (Vercel     │       │  Serverless          │
    │  Edge Network)   │       │  Functions (Node)    │
    └──────────────────┘       └──────────┬───────────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │  @astrojs/db   │
                                  │  (PostgreSQL)   │
                                  └────────────────┘
```

### Flujo de navegación del usuario

1. El usuario visita `/` — Astro sirve HTML estático desde CDN. Sin JS de framework.
2. Navega a `/games` — misma mecánica. Los filtros (género, precio) se aplican vía URL search params con hidratación parcial de un componente `GameFilter`.
3. Agrega un juego al carrito — el componente `GameCard` (React + `client:load`) dispara un `POST /api/cart` que actualiza un store de Nano Stores y el badge del header.
4. Va a `/checkout` — ruta SSR que requiere sesión. El server valida el carrito en base de datos y renderiza la página.
5. Confirma la compra — `POST /api/checkout` crea un pedido en `@astrojs/db` y redirige a `/checkout/confirmation`.

### Fetch de datos en páginas SSG

```astro
---
// src/pages/index.astro — Todo se ejecuta en build
import { getCollection } from 'astro:content';

const featuredGames = await getCollection('games', ({ data }) => data.featured);
const newReleases = await getCollection('games', ({ data }) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return data.releaseDate >= thirtyDaysAgo;
});
---
```

---

## 9. Estrategia de Build y Deploy

### Scripts disponibles

| Script | Comando | Uso |
|---|---|---|
| `dev` | `astro dev` | Servidor de desarrollo con HMR en `localhost:4321` |
| `build` | `astro build` | Build de producción. Genera HTML estático + server functions en `dist/` |
| `preview` | `astro preview` | Previsualización local del build de producción |
| `astro` | `astro` | CLI de Astro (check, sync, add, etc.) |

### Deploy (Vercel)

```bash
pnpm build                    # Genera dist/ + .vercel/output/
vercel deploy --prod          # Deploy a producción
```

### Output esperado del build

```
dist/
├── client/                   # Archivos estáticos (HTML, CSS, JS, imágenes optimizadas)
│   ├── index.html
│   ├── games/
│   │   ├── index.html
│   │   └── elden-ring/index.html
│   └── _astro/
│       ├── *.css
│       ├── *.js
│       └── *.webp
├── server/                   # Server functions para rutas SSR
│   ├── checkout.mjs
│   ├── account.mjs
│   └── api.mjs
└── _redirects                # Redirects de SPA o reglas de rewrites
```

### Optimizaciones

- **Imágenes:** `astro:assets` + Sharp → formato WebP/AVIF, lazy loading nativo, dimensiones responsivas.
- **CSS:** Tailwind purge tree-shaking (solo estilos usados en producción).
- **JS:** Las islas de React se code-split automáticamente por componente.
- **Fuentes:** Self-hosted con `@fontsource` para evitar dependencia de Google Fonts CDN.
- **Precarga:** `<link rel="preload">` para fuentes críticas y LCP image.

---

## Apéndice A: Resolución de Alias (`@/`)

Configurado en `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

Esto permite imports como:

```ts
import { formatPrice } from '@/lib/format';
import { GameCard } from '@/components/game/GameCard';
import type { Game } from '@/types/game';
```

> **Nota:** Si usas `@astrojs/check` en VS Code, asegúrate de que el workspace esté abierto en la raíz del proyecto para que el alias se resuelva correctamente.

---

## Apéndice B: Checklist de Nuevas Features

- [ ] ¿Necesita ser interactivo? → Usar `client:load` o `client:visible` en un framework (React).
- [ ] ¿Es contenido estático? → Astro component sin hidratación.
- [ ] ¿Es información del catálogo? → Agregar a Content Collection `games`.
- [ ] ¿Requiere sesión de usuario? → Ruta SSR + `AuthGuard` o endpoint con validación.
- [ ] ¿Modifica datos? → Endpoint `POST` en `src/pages/api/`.
- [ ] ¿Afecta SEO? → Agregar `<meta>` en `BaseLayout` y entry al sitemap.
- [ ] Imagen agregada → Optimizar con `Image` de `astro:assets`.
