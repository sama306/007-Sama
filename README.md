<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/favicon.svg">
    <img alt="007-Sama" src="./public/favicon.svg" width="120">
  </picture>
</p>

<h1 align="center">007-Sama</h1>

<p align="center">
  <strong>Tienda de videojuegos — static-first, con islas de hidratación, pensada para rendimiento y escalabilidad.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-6.x-BC52EE?logo=astro&logoColor=fff" alt="Astro">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=fff" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=fff" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Auth.js-v6-1A1A2E" alt="Auth.js">
  <img src="https://img.shields.io/badge/Node-%3E%3D22.12.0-5FA04E?logo=node.js&logoColor=fff" alt="Node">
  <img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=fff" alt="pnpm">
  <img src="https://img.shields.io/badge/Upstash_Redis-00C7B7?logo=upstash&logoColor=fff" alt="Upstash Redis">
  <img src="https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=fff" alt="Vercel">
  <img src="https://img.shields.io/badge/Estado-Terminado-success" alt="Estado">
</p>

---

## Motivación

007-Sama nace de la necesidad de contar con una tienda de videojuegos que ponga el rendimiento y la experiencia de desarrollo por delante. La mayoría de e-commerces del sector dependen de pesados SPAs que sacrifican Core Web Vitals en favor de interactividad total. Este proyecto demuestra que se puede tener **interactividad donde importa** (carrito, búsqueda, login, wishlist) sin resignar la velocidad de un sitio estático.

Es un proyecto **portfolio** — sin pagos reales, sin datos sensibles, pensado como carta de presentación.

El nombre — _007-Sama_ — es un guiño al agente secreto combinado con el sufijo honorífico japonés: discreción, eficacia, respeto por el oficio.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | [Astro 6](https://astro.build) — static-first, islands architecture, output hybrid (SSG + SSR) |
| **Lenguaje** | TypeScript strict — tipado completo incluso en frontmatter `.astro` |
| **Estilos** | [Tailwind CSS 4](https://tailwindcss.com) — utilidades atómicas, purge tree-shaking |
| **Islas interactivas** | [React 19](https://react.dev) — hidratación parcial (`client:load`, `client:visible`) |
| **Estado cliente** | [Nano Stores](https://github.com/nanostores/nanostores) — reactivo, ~1 KB, sin providers |
| **Autenticación** | [Auth.js v6](https://authjs.dev) via `auth-astro` — JWT, OAuth (Google, Discord, Steam), credentials |
| **Persistencia** | [Upstash Redis](https://upstash.com) — sesiones, wishlist, usuarios (fallback in-memory para local/CI) |
| **Validación** | [Zod](https://zod.dev) — schemas compartidos entre API, formularios y Content Collections |
| **Búsqueda** | [Fuse.js](https://fusejs.io) — fuzzy search client-side, sin servicios externos |
| **PDF** | [jsPDF](https://github.com/parallax/jsPDF) — generación de comprobantes en el cliente |
| **Email** | [Resend](https://resend.com) — recuperación de contraseña y emails transaccionales |
| **Hosting** | [Vercel](https://vercel.com) — Edge Network, serverless functions, CDN global |
| **CI/CD** | GitHub Actions — typecheck, lint, test, build, deploy automático |

---

## Funcionalidades implementadas

- **Catálogo completo** con Content Collections — juegos en `.md` con frontmatter validado por Zod
- **Filtros** por género, plataforma, precio, rating
- **Búsqueda** client-side con Fuse.js (fuzzy search)
- **Página de detalle** con galería, requisitos, trailer, valoraciones
- **Nuevos lanzamientos** — últimos 30 días + próximos
- **Módulo de noticias** — releases, updates, reviews, eventos
- **Autenticación** — registro con email, login con OAuth (Google, Discord, Steam)
- **Recuperación de contraseña** — email transaccional con Resend
- **Carrito de compras** — sincronizado con API, persistente en sesión
- **Lista de deseos (wishlist)** — sincronizada entre dispositivos vía Redis + localStorage como fallback
- **Checkout** — formulario SSR, confirmación con comprobante PDF
- **Panel de usuario** — pedidos, wishlist, datos de perfil
- **SEO** — sitemap, structured data (JSON-LD), Open Graph, meta tags
- **Responsive design** — mobile-first con Tailwind
- **Tests** — Vitest (unit) + Playwright (e2e)
- **CI/CD** — GitHub Actions: typecheck, lint, tests, build, deploy a Vercel

---

## Empezando

### Prerrequisitos

- **Node.js** >= 22.12.0
- **pnpm** 10.x (`npm install -g pnpm`)

### Instalación

```bash
git clone https://github.com/sama306/007-sama.git
cd 007-sama

pnpm install

cp .env.example .env

pnpm dev
```

La aplicación estará disponible en `http://localhost:4321`.

### Scripts disponibles

| Comando | Acción |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción (SSG + server functions) |
| `pnpm preview` | Previsualización local del build |
| `pnpm astro <cmd>` | CLI de Astro (`check`, `sync`, `add`, etc.) |
| `pnpm test` | Tests unitarios (Vitest) |
| `pnpm test:e2e` | Tests end-to-end (Playwright) |
| `pnpm format:check` | Verificar formato con Prettier |
| `pnpm format` | Formatear código con Prettier |

---

## Estructura del Proyecto

```
007-sama/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── vitest.config.ts
│
├── public/                  # Estáticos (favicon, robots.txt)
├── src/
│   ├── content/             # Content Collections (juegos en .md)
│   │   ├── config.ts        #   Schemas con Zod
│   │   ├── games/           #   Un archivo .md por juego
│   │   └── news/            #   Noticias en .md
│   │
│   ├── components/
│   │   ├── ui/              #   Button, Card, Badge, Modal, Toast
│   │   ├── game/            #   GameCard, GameGrid, GameDetails, RatingStars, WishlistButton
│   │   ├── cart/            #   CartDrawer, CartItem, CartCounter, AddToCartButton
│   │   ├── auth/            #   LoginForm, RegisterForm, AuthGuard, AuthCartSync
│   │   └── layout/          #   Header, Footer, Sidebar, Breadcrumbs
│   │
│   ├── layouts/             # BaseLayout, GameLayout, AdminLayout
│   ├── pages/               # File-based routing (ver ruteo abajo)
│   ├── lib/                 # Lógica de negocio (kv, auth, users, search, cart, format)
│   ├── stores/              # Nano Stores (cart, auth, wishlist, UI, toast)
│   ├── types/               # Tipos compartidos
│   ├── db/                  # Schema, queries, seed
│   └── styles/              # global.css, tokens.css
│
├── tests/                   # Vitest (unit)
├── e2e/                     # Playwright (e2e)
└── docs/                    # Documentación de arquitectura
```

### Ruteo

| Ruta | Estrategia | Auth |
|---|---|---|
| `/` | SSG | No |
| `/games` | SSG | No |
| `/games/[slug]` | SSG | No |
| `/games/genre/[genre]` | SSG | No |
| `/games/platform/[platform]` | SSG | No |
| `/new-releases` | SSG | No |
| `/news` | SSG | No |
| `/news/[slug]` | SSG | No |
| `/cart` | SSG + client | No |
| `/search` | SSG + client | No |
| `/account/*` | SSR | Sí |
| `/checkout` | SSR | Sí |
| `/auth/*` | SSR | No |
| `/api/*` | SSR | Varía |

### Variables de Entorno

Copia `.env.example` como `.env` y completa los valores. Las variables clave son:

| Variable | Descripción |
|---|---|
| `AUTH_SECRET` | Clave JWT para sesiones de Auth.js |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth Google |
| `AUTH_STEAM_KEY` | OAuth Steam |
| `RESEND_API_KEY` | API Key de Resend para emails |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (inyectado por Vercel) |

En local/CI, Redis tiene un fallback in-memory: no necesitas una instancia de Redis para desarrollo.

---

## Licencia

MIT © 2026 — **Valentin Samacoits**

<p align="center">
  <a href="https://github.com/sama306">GitHub</a>
  ·
  <a href="https://www.linkedin.com/in/dante-valent%C3%ADn-samacoits-2880b8261">LinkedIn</a>
</p>

<p align="center">
  Hecho con dedicación, mate y la convicción de que el rendimiento web no debería ser opcional.
</p>
