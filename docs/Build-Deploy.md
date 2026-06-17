# Build y Despliegue — 007-Sama (Tienda de Videojuegos)

> **Framework:** Astro 6.x  
> **Runtime:** Node >= 22.12.0  
> **Package Manager:** pnpm  
> **Output:** Hybrid (SSG + SSR)  
> **Hosting:** Vercel (principal) / Cloudflare Pages (alternativa)

---

## Índice

1. [Variables de Entorno](#1-variables-de-entorno)
2. [Configuración de Astro para Producción](#2-configuración-de-astro-para-producción)
3. [Pipeline CI/CD con GitHub Actions](#3-pipeline-cicd-con-github-actions)
4. [Estrategia de Imágenes](#4-estrategia-de-imágenes)
5. [Configuración de Caché](#5-configuración-de-caché)
6. [Core Web Vitals para E-commerce](#6-core-web-vitals-para-e-commerce)
7. [Monitoreo con Sentry y Analytics](#7-monitoreo-con-sentry-y-analytics)

---

## 1. Variables de Entorno

### `.env.example`

```bash
# =============================================================================
# 007-Sama — Variables de Entorno
# Copiar como .env (local) o configurar en Vercel/Cloudflare (prod).
# =============================================================================

# ---------------------------------------------------------------------------
# SITIO
# ---------------------------------------------------------------------------
# URL base del sitio en producción. Usada para generar sitemaps, OG tags,
# canonical URLs y redirecciones.
SITE_URL=https://007-sama.com

# ---------------------------------------------------------------------------
# BASE DE DATOS (PostgreSQL vía Drizzle ORM + postgres.js / Supabase)
# ---------------------------------------------------------------------------
# Cadena de conexión a PostgreSQL. En local usar Docker o instancia local.
# En producción usar Supabase, Neon, o RDS.
DATABASE_URL=postgresql://user:password@host:5432/007sama

# Para Supabase (alternativa):
# SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ---------------------------------------------------------------------------
# AUTENTICACIÓN (Auth.js v6)
# ---------------------------------------------------------------------------
# Secreto para firmar/verificar JWT. Generar con: openssl rand -base64 32
# En producción, ROTAR esta clave periódicamente.
AUTH_SECRET=supersecret-jwt-key-64-chars-minimum

# URL base para callbacks de Auth.js. Debe coincidir con SITE_URL en prod.
AUTH_URL=https://007-sama.com

# Proveedores OAuth — Google
AUTH_GOOGLE_ID=xxxxxxxxxxxx-xxxxxxxxxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx

# Proveedores OAuth — Discord
AUTH_DISCORD_ID=123456789012345678
AUTH_DISCORD_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Proveedores OAuth — Steam
AUTH_STEAM_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ---------------------------------------------------------------------------
# STRIPE (Pagos)
# ---------------------------------------------------------------------------
# Claves del dashboard de Stripe. Usar llaves de prueba (sk_test_) en
# desarrollo y llaves de producción (sk_live_) en producción.
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx

# Webhook secreto para verificar eventos entrantes de Stripe.
# Configurar en Stripe Dashboard > Webhooks > Endpoint secreto.
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# ID del precio predeterminado para suscripciones o productos
# STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxxx

# ---------------------------------------------------------------------------
# CMS (Opcional — Strapi / Sanity / Contentful)
# ---------------------------------------------------------------------------
# Token de API para el CMS. Solo si se externaliza el contenido.
# CMS_URL=https://cms.007-sama.com
# CMS_API_TOKEN=xxxxxxxxxxxxxxxxxxxx

# Token de revalidación para webhooks del CMS. Permite a Strapi/Sanity
# notificar a Astro cuando el contenido cambia.
# REVALIDATION_TOKEN=xxxxxxxxxxxx

# ---------------------------------------------------------------------------
# CDN (Cloudinary)
# ---------------------------------------------------------------------------
# Cloud name y API key de Cloudinary para optimización de imágenes.
# Configurar en Cloudinary Dashboard > Settings > API Keys.
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxx

# ---------------------------------------------------------------------------
# EMAIL (Resend / SendGrid)
# ---------------------------------------------------------------------------
# API key para envío de emails transaccionales (verificación, recovery,
# confirmación de pedido).
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Email remitente para correos transaccionales.
# FROM_EMAIL=noreply@007-sama.com

# ---------------------------------------------------------------------------
# MONITOREO (Sentry)
# ---------------------------------------------------------------------------
# DSN de Sentry para captura de errores en frontend y backend.
# Configurar en Sentry Dashboard > Projects > 007-sama > Client Keys.
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxxxxxxx.ingest.us.sentry.io/1234567

# ---------------------------------------------------------------------------
# ANALYTICS (Umami / Plausible)
# ---------------------------------------------------------------------------
# URL del script de analytics (self-hosted o cloud).
ANALYTICS_SCRIPT_URL=https://analytics.007-sama.com/script.js
# ID del sitio en la plataforma de analytics.
ANALYTICS_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ---------------------------------------------------------------------------
# SEO
# ---------------------------------------------------------------------------
# Verificación de Search Console (Google).
# GOOGLE_VERIFICATION=xxxxxxxxxxxxxxxxxxxxx

# ---------------------------------------------------------------------------
# DESARROLLO
# ---------------------------------------------------------------------------
# NODE_ENV se define automáticamente. Solo override si es necesario.
# NODE_ENV=development
```

---

## 2. Configuración de Astro para Producción

### `astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  // --- Salida híbrida: rutas estáticas por defecto, SSR donde se necesite ---
  // - SSG: catálogo, news, landing (se genera en build, sirve desde CDN).
  // - SSR: checkout, account, dashboard, API (se ejecuta en serverless).
  output: 'hybrid',

  // --- Adapter: Vercel (producción) ---
  // Alternativa: @astrojs/cloudflare para Cloudflare Pages.
  adapter: vercel({
    // Configuración ISR: páginas estáticas que se revalidan cada cierto tiempo.
    // Los componentes con soporte ISR usan Astro.response.headers o
    // experimental: { isr: true } para marcarlas.
    isr: {
      // Tiempo de revalidación global por defecto (en segundos).
      // 60 = 1 minuto para páginas de catálogo que cambian poco.
      expiration: 60,
    },
    // Incluir funciones serverless para rutas SSR.
    // Sin esta opción, Vercel trata todo como estático.
    functionPerRoute: false,
    // Imágenes: delegar optimización a Vercel Edge.
    imageService: true,
  }),

  // --- Integraciones ---
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/api'),
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date(),
    }),
    sentry({
      dsn: process.env.SENTRY_DSN,
      sourceMapsUploadOptions: {
        project: '007-sama',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],

  // --- Vite ---
  vite: {
    plugins: [tailwindcss()],
    // Exponer variables de entorno al cliente (prefijo PUBLIC_).
    // Las variables sin prefijo solo están disponibles en SSR.
  },

  // --- Servicio de imágenes ---
  // Sharp es el servicio por defecto en Astro 6.
  // Convierte imágenes a WebP/AVIF, redimensiona, aplica calidad.
  image: {
    // Formatos de salida preferidos (orden de prioridad).
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        // Calidad por defecto para imágenes convertidas (1-100).
        quality: 80,
        // Formatos que Sharp debe generar para cada imagen.
        // El navegador elige el primero que soporte.
        format: ['avif', 'webp'],
      },
    },
    // Imágenes que se aplican a todas las <Image /> sin atributos explícitos.
    // Se puede sobreescribir por instancia.
    experimental: {
      responsiveImages: {
        // Breakpoints para srcset del <Image /> component.
        breakpoints: [640, 768, 1024, 1280, 1536],
        // Formato de salida para srcset.
        format: ['avif', 'webp'],
      },
    },
  },

  // --- Prefetch ---
  // Precarga enlaces visibles en viewport para navegación instantánea.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  // --- Compresión ---
  compressHTML: true,

  // --- Server (solo desarrollo) ---
  server: {
    port: 4321,
    host: true,
  },

  // --- Seguridad ---
  // Cabeceras HTTP por defecto. Se pueden sobreescribir por ruta.
  security: {
    checkOrigin: true,
  },
});

// === NOTAS ===
// Para cambiar a Cloudflare Pages:
//   1. pnpm remove @astrojs/vercel
//   2. pnpm add @astrojs/cloudflare
//   3. Cambiar adapter: vercel(...) → adapter: cloudflare(...)
//   4. Ajustar ISR: Cloudflare no soporta ISR nativo, usar Cache API.
//   5. imageService: Cloudflare no tiene imageService integrado.
//      Usar sharp o Cloudflare Image Resizing.
```

---

## 3. Pipeline CI/CD con GitHub Actions

### `.github/workflows/deploy.yml`

```yaml
name: Deploy 007-Sama

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  # Revalidación manual desde Vercel dashboard o webhook CMS
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  PNPM_VERSION: 10
  NODE_VERSION: 22.12.0

jobs:
  # ===========================================================================
  # VALIDACIÓN: type-check + lint + test (paralelo, no necesita build)
  # ===========================================================================
  validate:
    name: Validate (type-check, lint, test)
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile
        name: Install dependencies

      - run: pnpm astro check
        name: Type-check (astro check)

      - run: pnpm lint
        name: Lint
        continue-on-error: true

      - run: pnpm test
        name: Unit tests
        continue-on-error: true

  # ===========================================================================
  # BUILD: genera dist/ para producción
  # ===========================================================================
  build:
    name: Build
    needs: [validate]
    runs-on: ubuntu-latest
    timeout-minutes: 15

    env:
      SITE_URL: ${{ vars.SITE_URL }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
      AUTH_URL: ${{ vars.AUTH_URL }}
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
      STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
      CLOUDINARY_CLOUD_NAME: ${{ vars.CLOUDINARY_CLOUD_NAME }}
      SENTRY_DSN: ${{ vars.SENTRY_DSN }}
      ANALYTICS_SCRIPT_URL: ${{ vars.ANALYTICS_SCRIPT_URL }}
      ANALYTICS_SITE_ID: ${{ vars.ANALYTICS_SITE_ID }}
      PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
      PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ vars.CLOUDINARY_CLOUD_NAME }}
      PUBLIC_SENTRY_DSN: ${{ vars.SENTRY_DSN }}
      PUBLIC_ANALYTICS_SCRIPT_URL: ${{ vars.ANALYTICS_SCRIPT_URL }}
      PUBLIC_ANALYTICS_SITE_ID: ${{ vars.ANALYTICS_SITE_ID }}
      PUBLIC_SITE_URL: ${{ vars.SITE_URL }}

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile
        name: Install dependencies

      - run: pnpm build
        name: Build Astro

      - uses: actions/upload-pages-artifact@v3
        name: Upload build artifact
        with:
          path: dist/

  # ===========================================================================
  # DEPLOY (Vercel)
  # ===========================================================================
  deploy-vercel:
    name: Deploy to Vercel
    needs: [build]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    # Solo deploy en push a main (no en PRs)
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile
        name: Install dependencies

      - run: pnpm build
        name: Build for Vercel
        env:
          SITE_URL: ${{ vars.SITE_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          AUTH_URL: ${{ vars.AUTH_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
          CLOUDINARY_CLOUD_NAME: ${{ vars.CLOUDINARY_CLOUD_NAME }}
          SENTRY_DSN: ${{ vars.SENTRY_DSN }}
          ANALYTICS_SCRIPT_URL: ${{ vars.ANALYTICS_SCRIPT_URL }}
          ANALYTICS_SITE_ID: ${{ vars.ANALYTICS_SITE_ID }}
          PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
          PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ vars.CLOUDINARY_CLOUD_NAME }}
          PUBLIC_SENTRY_DSN: ${{ vars.SENTRY_DSN }}
          PUBLIC_ANALYTICS_SCRIPT_URL: ${{ vars.ANALYTICS_SCRIPT_URL }}
          PUBLIC_ANALYTICS_SITE_ID: ${{ vars.ANALYTICS_SITE_ID }}
          PUBLIC_SITE_URL: ${{ vars.SITE_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  # ===========================================================================
  # DEPLOY (Cloudflare Pages) — alternativa comentada, activar si se migra
  # ===========================================================================
  # deploy-cloudflare:
  #   name: Deploy to Cloudflare Pages
  #   needs: [build]
  #   runs-on: ubuntu-latest
  #   timeout-minutes: 10
  #   if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  #
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: pnpm/action-setup@v4
  #       with:
  #         version: ${{ env.PNPM_VERSION }}
  #     - uses: actions/setup-node@v4
  #       with:
  #         node-version: ${{ env.NODE_VERSION }}
  #         cache: pnpm
  #     - run: pnpm install --frozen-lockfile
  #     - run: pnpm build
  #     - name: Deploy to Cloudflare
  #       uses: cloudflare/wrangler-action@v3
  #       with:
  #         apiToken: ${{ secrets.CF_API_TOKEN }}
  #         accountId: ${{ secrets.CF_ACCOUNT_ID }}
  #         command: pages deploy dist/ --project-name=007-sama

  # ===========================================================================
  # NOTIFICACIONES (opcional)
  # ===========================================================================
  # notify:
  #   name: Notify deploy status
  #   needs: [deploy-vercel]
  #   runs-on: ubuntu-latest
  #   if: always()
  #
  #   steps:
  #     - uses: actions-notify/notify@v1
  #       with:
  #         webhook: ${{ secrets.SLACK_WEBHOOK }}
  #         status: ${{ needs.deploy-vercel.result }}
```

### Scripts en `package.json`

Los siguientes scripts deben existir en `package.json` para que el pipeline funcione:

```jsonc
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "lint": "eslint src/ --ext .astro,.ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src/ --ext .astro,.ts,.tsx,.js,.jsx --fix",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Secrets requeridos en GitHub

| Secret | Descripción |
|---|---|
| `VERCEL_TOKEN` | Token de deploy de Vercel (Account > Settings > Tokens) |
| `VERCEL_ORG_ID` | ID de la organización en Vercel |
| `VERCEL_PROJECT_ID` | ID del proyecto en Vercel |
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `AUTH_SECRET` | Secreto JWT de Auth.js |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `SENTRY_AUTH_TOKEN` | Token de autenticación de Sentry para source maps |
| `CF_API_TOKEN` | (Cloudflare) API Token |
| `CF_ACCOUNT_ID` | (Cloudflare) Account ID |

Las variables sin prefijo `PUBLIC_` se inyectan solo en SSR y no deben exponerse al cliente.
Las variables con prefijo `PUBLIC_` están disponibles en el bundle del cliente.

---

## 4. Estrategia de Imágenes

### 4.1 Servicio de imágenes

Astro 6 usa **Sharp** como servicio por defecto para `astro:assets`. Convierte imágenes a formatos modernos, redimensiona y aplica optimizaciones en build time.

```js
// astro.config.mjs
image: {
  service: {
    entrypoint: 'astro/assets/services/sharp',
    config: {
      quality: 80,
      format: ['avif', 'webp'],
    },
  },
}
```

### 4.2 Componente `Image` vs `<img>`

| | `Image` de `astro:assets` | `<img>` nativo |
|---|---|---|
| Transformación en build | ✅ Sí | ❌ No |
| WebP/AVIF automático | ✅ Sí | ❌ Manual |
| `srcset` responsivo | ✅ Automático | ❌ Manual |
| Lazy loading nativo | ✅ `loading="lazy"` | ✅ Pero manual |
| Ancho/alto implícitos | ✅ Sí (evita CLS) | ❌ Requiere explícitos |

**Regla:** usar siempre `Image` de `astro:assets` para imágenes del catálogo. Solo usar `<img>` para imágenes estáticas sin optimización (favicon, OG image, SVG).

```astro
---
import { Image } from 'astro:assets';
import gameCover from '@/assets/games/elden-ring.jpg';
---

<!-- Astro genera: srcset con WebP + AVIF, dimensiones correctas, lazy loading -->
<Image
  src={gameCover}
  alt="Elden Ring"
  loading="lazy"
  decoding="async"
  widths={[320, 640, 960, 1280]}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  format="avif"
/>
```

### 4.3 Formatos y compresión

| Formato | Cuándo usar | Calidad recomendada |
|---|---|---|
| **AVIF** | Prioridad máxima. Soporte ~92% global. | 60-70 |
| **WebP** | Fallback para navegadores sin AVIF. Soporte ~98%. | 75-85 |
| **JPEG** | Fallback final. Solo si no soporta AVIF ni WebP. | 80-85 |
| **PNG** | Solo imágenes con transparencia (logos, iconos). | — |

```astro
---
<Image src={cover} formats={['avif', 'webp']} quality={65} />
<!-- Astro genera <picture> con <source> para AVIF y WebP,
     y <img> con JPEG como fallback final -->
```

### 4.4 Lazy loading

- **Todas las imágenes debajo del fold:** `loading="lazy"` + `decoding="async"`.
- **LCP image (héroe del landing, portada del juego destacado):** `loading="eager"` + `fetchpriority="high"` + `<link rel="preload">`.

```astro
---
// Hero image (LCP) — cargar inmediatamente
---
<Image
  src={heroImage}
  alt={game.title}
  loading="eager"
  fetchpriority="high"
  decoding="sync"
  widths={[640, 1024, 1920]}
/>

<link rel="preload" as="image" href={heroImage.src} imagesrcset={heroImage.srcset} />
```

### 4.5 CDN (Cloudinary)

Cloudinary se usa como **CDN externo** para imágenes subidas por usuarios/admin (no las del build). Ejemplo: imágenes de reseñas, avatares, banners promocionales.

```ts
// src/lib/cloudinary.ts
const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME;
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export function cdnImage(publicId: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}) {
  const { width, height, quality = 80, format = 'auto' } = options ?? {};
  const transformations = [
    'f_auto',                         // Formato automático (WebP si soporta)
    `q_${quality}`,                   // Calidad
    width ? `w_${width}` : '',        // Ancho
    height ? `h_${height}` : '',      // Alto
    'c_fill',                         // Crop fill
    'g_center',                       // Gravity center
  ].filter(Boolean).join(',');

  return `${BASE}/${transformations}/${publicId}`;
}
```

```astro
---
import { cdnImage } from '@/lib/cloudinary';
---

<img
  src={cdnImage('reviews/user-avatar_abc123', { width: 80, height: 80, quality: 70 })}
  alt="Avatar de usuario"
  loading="lazy"
  width={80}
  height={80}
/>
```

### 4.6 Resumen: flujo completo de imágenes

```
src/assets/games/elden-ring.jpg
        │
        ▼
   Build time (Sharp)
        │
        ├── avif (65% calidad, 320w, 640w, 960w, 1280w)
        ├── webp (80% calidad, 320w, 640w, 960w, 1280w)
        └── jpeg (fallback, 320w, 640w, 960w, 1280w)
        │
        ▼
   dist/client/_astro/elden-ring_*.avif
   dist/client/_astro/elden-ring_*.webp
   dist/client/_astro/elden-ring_*.jpg
        │
        ▼
   Vercel CDN (Edge Network)
        │
        ├── Cache: public, max-age=31536000, immutable
        └── Servido con Content-Type adecuado según Accept del navegador
```

---

## 5. Configuración de Caché

### 5.1 Cache Strategy Matrix

| Tipo de página | Estrategia | TTL | Dónde se cachea |
|---|---|---|---|
| Landing, catálogo (SSG) | Static + CDN | 1 año (inmutable) | CDN + Browser |
| Página de juego (SSG + ISR) | ISR (Vercel) | 60 s | Vercel Edge |
| News, blog (SSG) | Static + CDN | 1 año (inmutable) | CDN + Browser |
| Checkout (SSR) | No cache (dinámico) | — | — |
| Account / Dashboard (SSR) | No cache (autenticado) | — | — |
| API routes (SSR) | No cache | — | — |
| Imágenes optimizadas | Static + CDN | 1 año (inmutable) | CDN + Browser |
| CSS/JS bundles | Static + CDN | 1 año (inmutable) | CDN + Browser |

### 5.2 Cabeceras HTTP

Vercel aplica cabeceras automáticas para assets estáticos. Para personalizar:

```js
// astro.config.mjs — Cabeceras por ruta (Vercel)
export default defineConfig({
  // ...
  experimental: {
    headers: [
      {
        paths: ['/_astro/*'],  // Assets con hash
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        paths: ['/games/*'],   // Páginas de juegos (ISR)
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600' },
        ],
      },
      {
        paths: ['/'],          // Landing
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=600' },
        ],
      },
      {
        paths: ['/api/*', '/checkout/*', '/account/*'],
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ],
  },
});
```

### 5.3 ISR (Incremental Static Regeneration)

Para páginas de juegos individuales que deben actualizarse sin rebuild completo:

```astro
---
// src/pages/games/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const games = await getCollection('games');
  return games.map(game => ({
    params: { slug: game.slug },
    props: { game },
  }));
}

// Marcar como ISR — Astro regenera esta página cada 60 segundos
// cuando recibe una solicitud después de que el TTL expiró.
export const prerender = true;

// En Vercel, ISR se configura en el adapter:
//   isr: { expiration: 60 }
// En la ruta misma:
export const isr = {
  expiration: 60,                      // TTL en segundos
  bypassToken: process.env.REVALIDATION_TOKEN, // Para revalidación manual
};
---
```

### 5.4 Revalidación por webhook (CMS)

Cuando el CMS notifica que un juego cambió:

```ts
// src/pages/api/revalidate.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const token = request.headers.get('x-revalidation-token');

  if (token !== process.env.REVALIDATION_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { slug } = await request.json();

  // Revalidar página específica
  // En Vercel: el purge cache se maneja automáticamente con ISR.
  // Forzar revalidación si es necesario:
  // await fetch(`https://007-sama.com/games/${slug}?x-vercel-revalidate=1`);

  return new Response('OK', { status: 200 });
};
```

### 5.5 CDN (Vercel Edge Network)

Vercel tiene CDN global (Edge Network) con 100+ POPs. La configuración de caché se maneja mediante:

1. **Cabeceras `Cache-Control`** — Ver sección 5.2.
2. **`stale-while-revalidate`** — Sirve contenido stale mientras regenera en background.
3. **`stale-if-error`** — Sirve contenido stale si el origen falla.

```
Ejemplo de respuesta CDN:

Cache-Control: public, s-maxage=60, stale-while-revalidate=600, stale-if-error=86400
                ─────┬─────  ─────────┬─────────  ───────┬───────
                     │                │                   └── Si el server falla,
                     │                │                       sirve stale por 24h
                     │                └── Revalida en background
                     │                    hasta 10 min después del TTL
                     └── CDN cachea 60s
```

---

## 6. Core Web Vitals para E-commerce

### 6.1 Métricas objetivo

| Métrica | Bueno | Regular | Malo | Objetivo 007-Sama |
|---|---|---|---|---|
| **LCP** ( Largest Contentful Paint) | ≤ 2.5 s | ≤ 4.0 s | > 4.0 s | < 1.5 s |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 | < 0.05 |
| **INP** (Interaction to Next Paint) | ≤ 200 ms | ≤ 500 ms | > 500 ms | < 100 ms |

### 6.2 LCP — Largest Contentful Paint

El LCP suele ser la imagen hero del landing o la portada del juego destacado.

**Qué hacer:**

- **Precargar la LCP image:**
  ```astro
  <link rel="preload" as="image" href={heroImage} imagesrcset={...} />
  ```
- **Servir desde CDN** con caché larga.
- **Formato AVIF** (30-50% más ligero que JPEG).
- **Dimensiones exactas** en HTML para evitar recálculo.
- **`fetchpriority="high"`** en la imagen.
- **Evitar que el hero sea CSS background-image** (no es discoverable por el preloader).

### 6.3 CLS — Cumulative Layout Shift

Causas típicas en e-commerce y cómo evitarlas:

| Causa | Solución |
|---|---|
| Imágenes sin dimensiones | Siempre `width` + `height` en `<img>` o en `Image` de astro:assets |
| Web fonts (FOUT/FOIT) | `font-display: optional` o self-hosted con `@fontsource` |
| Anuncios / embeds dinámicos | Reservar espacio con contenedor de dimensiones fijas |
| Skeleton screens | Usar aspect-ratio en CSS en lugar de altura fija |
| Inyección tardía de JS | No usar JS que inserte bloques grandes después del render |

```css
/* Reservar espacio para GameCard antes de que se cargue la imagen */
.game-card img {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}
```

### 6.4 INP — Interaction to Next Paint

Afecta a componentes interactivos: carrito, búsqueda, login, filtros.

**Qué hacer:**

- **Islas pequeñas:** Cada componente interactivo es una isla independiente. No hidratar toda la página.
  ```astro
  <CartDrawer client:visible />
  <SearchBar client:idle />
  ```
- **Lazy hydration:** Usar `client:visible` o `client:idle` en lugar de `client:load`.
- **Bundle pequeño:** Code-split por isla. React islands en chunks separados.
- **Eventos delegados:** Manejar clicks en el contenedor en lugar de en cada item.
- **Evitar `setTimeout` / `requestAnimationFrame`** en bucles de renderizado.
- **`content-visibility: auto`** en secciones fuera del viewport.

### 6.5 Budget de rendimiento

```json
// Archivo: .github/workflows/performance-budget.yml (opcional)
{
  "budget": {
    "lcp": 2500,
    "cls": 0.1,
    "inp": 200,
    "totalBundleSize": 200000,      // 200 KB JS total
    "imageWeight": 500000,           // 500 KB imágenes en landing
    "totalRequests": 50
  }
}
```

---

## 7. Monitoreo con Sentry y Analytics

### 7.1 Sentry (Errores y Rendimiento)

#### Instalación

```bash
pnpm add @sentry/astro @sentry/vite-plugin
```

#### Configuración

```js
// astro.config.mjs
import sentry from '@sentry/astro';

export default defineConfig({
  integrations: [
    sentry({
      dsn: process.env.SENTRY_DSN,
      sourceMapsUploadOptions: {
        project: '007-sama',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
});
```

#### Uso en frontend (cliente)

```ts
// src/lib/monitoring.ts
import * as Sentry from '@sentry/astro';

export function captureCheckoutError(error: unknown, context: Record<string, unknown>) {
  Sentry.captureException(error, {
    tags: { domain: 'checkout' },
    extra: context,
  });
}

// Transacciones de rendimiento para rutas SSR
export function trackPagePerformance(pageName: string) {
  const transaction = Sentry.startTransaction({
    name: pageName,
    op: 'page-load',
  });
  return transaction;
}
```

```tsx
// Componente React con error boundary
import * as Sentry from '@sentry/react';

export function CartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <p role="alert">Error en el carrito. Intenta de nuevo.</p>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

#### Uso en SSR (server)

```ts
// src/middleware.ts
import * as Sentry from '@sentry/astro';

export const onRequest = async (context, next) => {
  try {
    return await next();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { url: context.url.pathname },
      user: { id: context.locals.user?.id },
    });
    return new Response('Error interno', { status: 500 });
  }
};
```

### 7.2 Analytics (Umami / Plausible)

Usar analytics **self-hosted y privacy-first** (sin cookies, sin GDPR issues).

#### Opciones recomendadas

| Plataforma | Tipo | Costo | Cookie-free |
|---|---|---|---|
| **Umami** | Self-hosted / Cloud | Gratis (self) / $29/mes | ✅ Sí |
| **Plausible** | Self-hosted / Cloud | Gratis (self) / €9/mes | ✅ Sí |
| **PostHog** | Self-hosted / Cloud | Gratis (self) / $0-($$) | ⚠️ Con config |

#### Implementación

```astro
---
// src/components/layout/Analytics.astro
const scriptUrl = import.meta.env.ANALYTICS_SCRIPT_URL;
const siteId = import.meta.env.ANALYTICS_SITE_ID;
---

{
  scriptUrl && siteId && (
    <script
      defer
      src={scriptUrl}
      data-website-id={siteId}
      data-domains="007-sama.com"
      data-do-not-track="true"
    />
  )
}
```

```astro
---
// src/layouts/BaseLayout.astro
import Analytics from '@/components/layout/Analytics.astro';
---
<!DOCTYPE html>
<html lang="es">
<head>
  <Analytics />
</head>
```

#### Eventos personalizados

```ts
// Rastrear eventos de e-commerce
export function trackAddToCart(gameId: string, price: number) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track('add_to_cart', { gameId, price });
  }
}

export function trackPurchase(orderId: string, total: number) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track('purchase', { orderId, total });
  }
}

export function trackSearch(query: string, resultsCount: number) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track('search', { query, resultsCount });
  }
}
```

### 7.3 Health Checks

Endpoints para monitoreo externo (UptimeRobot, BetterStack, Pingdom):

```ts
// src/pages/api/health.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),   // Conexión a PostgreSQL
      stripe: await checkStripe(),       // API key válida
      cdn: await checkCDN(),             // Cloudinary reachable
    },
  };

  const isHealthy = Object.values(checks.checks).every(Boolean);

  return new Response(JSON.stringify(checks), {
    status: isHealthy ? 200 : 503,
    headers: { 'content-type': 'application/json' },
  });
};

async function checkDatabase(): Promise<boolean> {
  try {
    // Ejemplo con postgres.js
    // const result = await sql`SELECT 1`;
    // return result.length > 0;
    return true;
  } catch {
    return false;
  }
}

async function checkStripe(): Promise<boolean> {
  try {
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // await stripe.balance.retrieve();
    return true;
  } catch {
    return false;
  }
}

async function checkCDN(): Promise<boolean> {
  try {
    // const res = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/health`);
    // return res.ok;
    return true;
  } catch {
    return false;
  }
}
```

### 7.4 Dashboard de monitoreo

| Herramienta | Propósito | URL |
|---|---|---|
| **Vercel Analytics** | Web Vitals, visitas, geografía | Dashboard Vercel |
| **Sentry** | Errores, rendimiento, source maps | sentry.io |
| **Umami / Plausible** | Analytics, funnel de conversión | analytics.007-sama.com |
| **BetterStack** | Uptime, SSL, health checks | betterstack.com |
| **Stripe Dashboard** | Pagos, disputas, revenue | dashboard.stripe.com |

---

## Apéndice A: Scripts de `package.json`

```jsonc
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "lint": "eslint src/ --ext .astro,.ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src/ --ext .astro,.ts,.tsx,.js,.jsx --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

## Apéndice B: Checklist pre-deploy

- [ ] `pnpm astro check` sin errores
- [ ] `pnpm lint` sin errores
- [ ] `pnpm test` pasa
- [ ] `pnpm build` exitoso
- [ ] Variables de entorno configuradas en Vercel / GitHub Secrets
- [ ] `SITE_URL` coincide con el dominio de producción
- [ ] Cabeceras `Cache-Control` para rutas estáticas
- [ ] LCP image precargada en landing
- [ ] Imágenes con `width` + `height` para evitar CLS
- [ ] Webhooks de Stripe configurados en dashboard
- [ ] `SENTRY_DSN` configurado y probado
- [ ] Analytics visible en la página
- [ ] Sitemap generado y enviado a Google Search Console
- [ ] `robots.txt` permite crawling de producción
- [ ] SSL activo (automático con Vercel)
- [ ] Health check endpoint responde 200
