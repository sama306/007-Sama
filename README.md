
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
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=fff" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss&logoColor=fff" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000" alt="React">
  <img src="https://img.shields.io/badge/Auth.js-v6-1A1A2E" alt="Auth.js">
  <img src="https://img.shields.io/badge/Node-%3E%3D22.12.0-5FA04E?logo=node.js&logoColor=fff" alt="Node">
  <img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=fff" alt="pnpm">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Estado-En_Desarrollo-yellow" alt="Estado">
</p>

---

## Motivación

007-Sama nace de la necesidad de contar con una tienda de videojuegos que ponga el rendimiento y la experiencia de desarrollo por delante. La mayoría de e-commerces del sector dependen de pesados SPAs que sacrifican Core Web Vitals en favor de交互ividad total. Este proyecto demuestra que se puede tener **interactividad donde importa** (carrito, búsqueda, login) sin resignar la velocidad de un sitio estático.

El nombre — _007-Sama_ — es un guiño al agente secreto combinado con el sufijo honorífico japonés: discreción, eficacia, respeto por el oficio.

---

## Stack Tecnológico

<<<<<<< Updated upstream
| Capa | Tecnología | Por qué |
|---|---|---|
| **Framework** | [Astro 6](https://astro.build) | Zero JS por defecto, islands architecture, hybrid output (SSG + SSR por ruta) |
| **Lenguaje** | TypeScript (strict) | Tipado completo, incluso en frontmatter `.astro` |
| **Estilos** | Tailwind CSS 4 | Utilidades atómicas, purge tree-shaking, @tailwindcss/vite plugin |
| **Islas interactivas** | React 19 | Hidratación parcial solo donde se necesita (`client:load`, `client:visible`) |
| **Estado cliente** | Nano Stores | Reactivo, sin providers, ~1 KB, funciona fuera de React |
| **Autenticación** | Auth.js v6 (vía `auth-astro`) | JWT, sesiones, OAuth (Google, Discord, Steam), credentials |
| **Base de datos** | PostgreSQL + Drizzle ORM | Tipado fuerte, migraciones, integración con Astro DB |
| **Validación** | Zod 4 | Schemas compartidos entre API, formularios y Content Collections |
| **Pagos** | Stripe | Webhooks, escenario completo de checkout |
| **Hosting** | Vercel (Edge Network) | ISR, serverless functions, CDN global |
| **Búsqueda** | Fuse.js | Fuzzy search client-side sin depender de servicios externos |
| **CI/CD** | GitHub Actions | Type-check, lint, test, build, deploy automático |

---

## Capturas de Pantalla

> _Sección en preparación. A medida que se implementen las secciones principales (catálogo, detalle de juego, carrito, checkout) se agregarán capturas y/o grabaciones._

| Sección | Estado |
|---|---|
| Home / Hero | 📝 Diseñado |
| Catálogo con filtros | 📝 Diseñado |
| Detalle de juego | 📝 Diseñado |
| Carrito | 📝 Diseñado |
| Checkout | 📝 Diseñado |
| Dashboard de usuario | 📝 Diseñado |
| Panel admin | 📝 Diseñado |

---

=======
| Capa | Tecnología |
|---|---|
| **Framework** | [Astro 6](https://astro.build) — static-first, islands architecture, output hybrid (SSG + SSR) |
| **Lenguaje** | TypeScript strict — tipado completo incluso en frontmatter `.astro` |
| **Estilos** | [Tailwind CSS 4](https://tailwindcss.com) — utilidades atómicas, purge tree-shaking, `@tailwindcss/vite` |
| **Islas interactivas** | [React 19](https://react.dev) — hidratación parcial (`client:load`, `client:visible`) |
| **Estado cliente** | [Nano Stores](https://github.com/nanostores/nanostores) — reactivo, ~1 KB, sin providers |
| **Autenticación** | [Auth.js v6](https://authjs.dev) via `auth-astro` — JWT, OAuth (Google, Steam), credentials |
| **Pagos** | [Stripe](https://stripe.com) — Payment Intents, Webhooks, modo test |
| **Validación** | [Zod](https://zod.dev) — schemas compartidos entre API, formularios y Content Collections |
| **Búsqueda** | [Fuse.js](https://fusejs.io) — fuzzy search client-side, sin servicios externos |
| **PDF** | [jsPDF](https://github.com/parallax/jsPDF) — generación de comprobantes en el cliente |
| **Email** | [Resend](https://resend.com) — recuperación de contraseña y emails transaccionales |
| **Hosting** | [Vercel](https://vercel.com) — Edge Network, serverless functions, CDN global |
| **CI/CD** | GitHub Actions — typecheck, lint, test, build, deploy automático |

---

>>>>>>> Stashed changes
## Empezando

### Prerrequisitos

- **Node.js** >= 22.12.0
- **pnpm** 10.x (`npm install -g pnpm`)
- **PostgreSQL** (local o vía Docker / Supabase / Neon)

### Instalación

```bash
<<<<<<< Updated upstream
# Clonar el repositorio
git clone https://github.com/tu-usuario/007-sama.git
=======
git clone https://github.com/sama306/007-sama.git
>>>>>>> Stashed changes
cd 007-sama

# Instalar dependencias
pnpm install

# Copiar variables de entorno y ajustar
cp .env.example .env

# Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en `http://localhost:4321`.

### Scripts disponibles

| Comando | Acción |
|---|---|
<<<<<<< Updated upstream
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción (SSG + server functions) |
| `pnpm preview` | Previsualización local del build |
| `pnpm astro <cmd>` | CLI de Astro (`check`, `sync`, `add`, etc.) |
=======
| `AUTH_SECRET` | Clave JWT para sesiones de Auth.js |
| `STRIPE_SECRET_KEY` | Stripe Secret Key (`sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret (`whsec_...`) |
| `RESEND_API_KEY` | API Key de Resend para emails |
>>>>>>> Stashed changes

---

## Variables de Entorno

Copia `.env.example` como `.env` y completa los valores:

```bash
# =============================================================================
# 007-Sama — Variables de Entorno
# Copiar como .env (local) o configurar en Vercel (prod).
# =============================================================================

# --- Sitio ---
SITE_URL=http://localhost:4321

# --- Base de datos (PostgreSQL) ---
DATABASE_URL=postgresql://user:password@localhost:5432/007sama

# --- Autenticación (Auth.js) ---
AUTH_SECRET=generar-con-openssl-rand-base64-32
AUTH_URL=http://localhost:4321
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=
AUTH_STEAM_KEY=

# --- Stripe ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# --- CDN (Cloudinary) ---
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# --- Email (Resend) ---
RESEND_API_KEY=re_...

# --- Monitoreo ---
SENTRY_DSN=

# --- Analytics (Umami / Plausible) ---
ANALYTICS_SCRIPT_URL=
ANALYTICS_SITE_ID=
```

> Las variables con prefijo `PUBLIC_` se exponen al cliente. El resto solo están disponibles en SSR.

---

## Estructura del Proyecto

```
007-sama/
├── astro.config.mjs        # Configuración de Astro (integraciones, output hybrid)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json            # TypeScript strict + alias @/ → src/
│
├── public/                  # Estáticos (favicon, robots.txt)
│
├── src/
│   ├── content/             # Content Collections (catálogo de juegos en .md)
│   │   ├── config.ts        #   Schemas con Zod
│   │   └── games/           #   Un archivo .md por juego
│   │
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/              #   Botones, cards, badges, modales
│   │   ├── game/            #   GameCard, GameGrid, RatingStars
│   │   ├── cart/            #   CartDrawer, CartItem, CartCounter
│   │   ├── auth/            #   LoginForm, RegisterForm, AuthGuard
│   │   └── layout/          #   Header, Footer, Sidebar, Breadcrumbs
│   │
│   ├── layouts/             # Plantillas de página
│   │   ├── BaseLayout.astro
│   │   ├── GameLayout.astro
│   │   └── AdminLayout.astro
│   │
│   ├── pages/               # File-based routing
│   │   ├── index.astro      #   Home
│   │   ├── games/           #   /games, /games/[slug], /games/genre/[genre]
│   │   ├── cart/            #   /cart
│   │   ├── checkout/        #   /checkout, /checkout/confirmation
│   │   ├── account/         #   /account (SSR, protegido)
│   │   ├── auth/            #   /auth/login, /auth/register
│   │   ├── news/            #   /news, /news/[slug]
│   │   ├── search.astro     #   /search?q=
│   │   └── api/             #   Endpoints server (cart, auth, search)
│   │
│   ├── db/                  # Schema Drizzle, queries, seed
│   ├── lib/                 # Lógica de negocio (formateo, búsqueda, auth)
│   ├── stores/              # Nano Stores (cart, auth, UI)
│   ├── types/               # Tipos compartidos (Game, User, CartItem)
│   └── styles/              # global.css, design tokens
│
├── tests/                   # Vitest (unit) + Playwright (e2e)
│
└── docs/                    # Documentación de arquitectura y decisiones
    ├── Architecture.md
    ├── Authentication.md
    ├── Build-Deploy.md
    └── ...
```

> ⚡ **Nota:** El proyecto se encuentra en fase inicial. La estructura refleja el destino final documentado en `docs/`. Actualmente `src/` contiene solo el starter mínimo de Astro.

---

## Decisiones Técnicas

### Static-first con hybrid output

Elegí `output: 'hybrid'` porque un e-commerce tiene —como mínimo— dos regímenes de contenido bien diferenciados:

| Tipo | Estrategia | Ejemplos |
|---|---|---|
| Catálogo, landing, news | **SSG** → HTML en build, CDN | `/`, `/games`, `/games/elden-ring` |
| Checkout, dashboard, API | **SSR** → serverless bajo demanda | `/checkout`, `/account/*`, `/api/*` |

Esto evita el costo de cold-start en páginas que no lo necesitan y da HTML instantáneo desde el edge para el catálogo.

### Islas de hidratación, no SPAs

Astro permite que componentes React se hidraten **individualmente** sin que el framework tome el control de la página. Uso `client:visible` para el carrito (se hidrata cuando entra al viewport) y `client:idle` para la búsqueda (cuando el navegador está libre). El resultado: ~0 KB de JS en la carga inicial de la landing.

### Nano Stores en lugar de Context/Redux

El estado del carrito y la sesión se manejan con [Nano Stores](https://github.com/nanostores/nanostores) (~1 KB, sin providers, sin boilerplate). Se integran con Astro y React por igual. La alternativa (React Context) forzaría a que todo componente que lea el carrito esté dentro del árbol de React, lo que rompe el modelo de islas.

### Content Collections como fuente de verdad del catálogo

Cada juego es un archivo `.md` con frontmatter validado por Zod. Esto da:
- **Type safety** en build time (si falta un campo obligatorio, el build falla).
- **Editor experience** (autocompletado en VS Code al editar un juego).
- **Sin necesidad de CMS** para el catálogo base (aunque se puede externalizar después).

### Por qué no Next.js

Next.js App Router empuja a `"use client"` en cada esquina. En un e-commerce donde el 80% del contenido es estático (descripciones, precios, imágenes), tener React como requisito para renderizar una card en el servidor no suma valor. Con Astro, los componentes estáticos son solo HTML; los interactivos son islas React opt-in.

---

## Roadmap

### Fase 1 — Fundación (actual)
- [x] Configuración inicial de Astro + TypeScript strict
- [x] Alias `@/`, output hybrid
- [x] Documentación de arquitectura (`docs/`)
- [x] Integraciones: Tailwind, React, Sitemap, Auth.js
- [x] Content Collections + schema Zod del catálogo
- [x] Página Home con juegos destacados

### Fase 2 — Catálogo y navegación
- [x] Listado de juegos con filtros (género, plataforma, precio, rating)
- [x] Página de detalle de juego con galería y requisitos
- [x] Búsqueda client-side con Fuse.js
- [x] Página de nuevos lanzamientos
- [x] Módulo de noticias

### Fase 3 — Carrito y checkout
- [ ] Carrito con Nano Stores (sincronizado con API)
- [ ] Checkout SSR con sesión
- [ ] Integración con Stripe (pagos + webhooks)
- [ ] Confirmación de pedido + email transaccional

<<<<<<< Updated upstream
### Fase 4 — Usuarios y autenticación
- [ ] Registro y login con email + OAuth
- [ ] Dashboard de usuario (pedidos, wishlist)
- [ ] Recuperación de contraseña

### Fase 5 — Administración y UX
- [ ] Panel admin (RBAC: editor, admin)
- [ ] Gestión de juegos, noticias, pedidos
- [ ] Analíticas (Umami/Plausible)
- [ ] Monitoreo de errores (Sentry)
- [ ] CI/CD con GitHub Actions

### Fase 6 — Pulido
- [ ] Tests unitarios (Vitest) y end-to-end (Playwright)
- [ ] Lighthouse score ≥ 95 en todas las métricas
- [ ] SEO: sitemap, structured data, Open Graph
- [ ] i18n (español / inglés)

---

## Licencia

MIT © 2026 — [Tu nombre / organización]

---

<p align="center">
  <sub>Hecho con ☕ y 🎮 por alguien que cree que el rendimiento no debería ser opcional.</sub>
=======
## Licencia

MIT © 2026 — **Valentin Samacoits**

<p align="center">
  <a href="https://github.com/sama306">Portfolio</a>
  ·
  <a href="https://www.linkedin.com/in/dante-valent%C3%ADn-samacoits-2880b8261">LinkedIn</a>
</p>

<p align="center">
  Hecho con dedicación, mate y la convicción de que el rendimiento web no debería ser opcional. Este proyecto es mi carta de presentación como desarrollador — cada línea está pensada para demostrar lo que sé hacer.
>>>>>>> Stashed changes
</p>
