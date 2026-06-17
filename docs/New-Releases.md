# Nuevos Lanzamientos y Próximas Fechas

> **Framework:** Astro 6.x (`output: 'hybrid'`)
> **CSS:** Tailwind CSS v4
> **Idioma:** Español (código fuente en inglés)

---

## Índice

1. [Visión General](#1-visión-general)
2. [Diferencia entre Recién Lanzados y Próximos](#2-diferencia-entre-recién-lanzados-y-próximos)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Obtención y Actualización de Listas](#4-obtención-y-actualización-de-listas)
5. [Componente Countdown](#5-componente-countdown)
6. [Sistema de Suscripción a Preventas](#6-sistema-de-suscripción-a-preventas)
7. [Sección "Más Esperados" con Votos](#7-sección-más-esperados-con-votos)
8. [SEO y Structured Data](#8-seo-y-structured-data)
9. [Página /new-releases](#9-página-new-releases)
10. [Actualizaciones a Docs Existentes](#10-actualizaciones-a-docs-existentes)

---

## 1. Visión General

La sección de nuevos lanzamientos y próximas fechas es el centro de descubrimiento de la tienda. Agrupa tres categorías de juegos:

| Categoría | Ventana | Badge | Comportamiento |
|---|---|---|---|
| **Recién Lanzados** | Últimos 30 días | `NUEVO` | Se puede comprar inmediatamente |
| **Próximos** | Fecha futura | `PRE-VENTA` | Se puede reservar (pre-order) |
| **Más Esperados** | Cualquier fecha futura | `MÁS VOTADO` | Votado por la comunidad, sin fecha necesaria |

### Flujo de vida de un juego

```
  [Anuncio] ──► [Más Esperados (votación)] ──► [Próximos (pre-venta)] ──► [Recién Lanzado (30 días)] ──► [Catálogo General]

  releaseDate > 30 días      releaseDate > hoy        hoy >= releaseDate         releaseDate entre          releaseDate <
  (votación abierta)         (pre-order activo)       >= hoy - 30 días            hoy - 30 días
```

---

## 2. Diferencia entre Recién Lanzados y Próximos

### Recién Lanzados (`justReleased`)

Juegos cuya `releaseDate` está entre **hoy** y **hace 30 días**. Se consideran "recién salidos del horno".

```ts
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const justReleased = games.filter((g) => {
  const rd = new Date(g.releaseDate);
  return rd <= new Date() && rd >= thirtyDaysAgo;
});
```

Características:
- Badge `NUEVO` en la tarjeta
- Posible descuento de lanzamiento (10-20% durante los primeros 7 días)
- Ordenados por `releaseDate DESC` (más recientes primero)
- Se muestran en la home, `/new-releases` y en categorías relacionadas

### Próximos (`upcoming`)

Juegos cuya `releaseDate` es **estrictamente futura** (mayor a hoy).

```ts
const upcoming = games.filter((g) => new Date(g.releaseDate) > new Date());
```

Características:
- Badge `PRE-VENTA` en la tarjeta
- Botón "Reservar" en lugar de "Comprar"
- Muestra countdown hasta la fecha de lanzamiento
- Opción de suscripción a notificación por email
- Ordenados por `releaseDate ASC` (primero los que salen antes)

---

## 3. Modelo de Datos

### Tablas adicionales en PostgreSQL

```sql
-- ============================================
-- Suscripciones a preventas (newsletter)
-- ============================================
CREATE TABLE preorder_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL,          -- para usuarios guest
  notified        BOOLEAN NOT NULL DEFAULT false,  -- ya se envió el email
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, game_id),
  UNIQUE (email, game_id)  -- permitir que guests también sean únicos
);

CREATE INDEX idx_preorder_game ON preorder_subscriptions (game_id);
CREATE INDEX idx_preorder_notified ON preorder_subscriptions (notified) WHERE notified = false;

-- ============================================
-- Votos "Más Esperados"
-- ============================================
CREATE TABLE upcoming_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  voted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, game_id)  -- un voto por usuario por juego
);

CREATE INDEX idx_votes_game ON upcoming_votes (game_id);
CREATE INDEX idx_votes_user ON upcoming_votes (user_id);
CREATE INDEX idx_votes_count ON upcoming_votes (game_id, voted_at);

-- ============================================
-- Log de envíos de notificación
-- ============================================
CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES preorder_subscriptions(id) ON DELETE CASCADE,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message   TEXT
);

CREATE INDEX idx_notif_game ON notification_log (game_id);
```

### Tipos TypeScript

```ts
// src/types/releases.ts

export interface PreorderSubscription {
  id: string;
  userId: string | null;
  gameId: string;
  email: string;
  notified: boolean;
  subscribedAt: string;
}

export interface UpcomingVote {
  id: string;
  userId: string;
  gameId: string;
  votedAt: string;
}

export interface MostAnticipatedGame {
  gameId: string;
  title: string;
  slug: string;
  coverImage: string;
  voteCount: number;
  userVoted?: boolean;         // si el usuario actual ya votó
}

export interface GameWithReleaseStatus {
  id: string;
  title: string;
  slug: string;
  releaseDate: string;
  status: 'just_released' | 'upcoming' | 'catalog';
  daysUntilRelease: number;    // positivo si upcoming
  daysSinceRelease: number;    // positivo si just_released
  canPreorder: boolean;
  discount?: number;
}
```

### Helpers de fecha

```ts
// src/lib/releases.ts
export function getReleaseStatus(releaseDate: string): GameWithReleaseStatus['status'] {
  const now = new Date();
  const rd = new Date(releaseDate);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (rd > now) return 'upcoming';
  if (rd >= thirtyDaysAgo) return 'just_released';
  return 'catalog';
}

export function daysUntil(releaseDate: string): number {
  const now = new Date();
  const rd = new Date(releaseDate);
  return Math.ceil((rd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysSince(releaseDate: string): number {
  const now = new Date();
  const rd = new Date(releaseDate);
  return Math.floor((now.getTime() - rd.getTime()) / (1000 * 60 * 60 * 24));
}
```

---

## 4. Obtención y Actualización de Listas

### 4.1 Estrategia general

| Fuente | Método | Frecuencia | Gatillo |
|---|---|---|---|
| **Base de datos** | Consulta SQL directa | Cada request (SSR) o build (SSG) | N/A |
| **CMS (opcional)** | Webhook → revalidación | En cada publicación | Webhook entrante |
| **Cron job** | Notificaciones + limpieza | Cada hora / diario | Tiempo |
| **CDN cache** | `Cache-Control` headers | TTL 120s (new-releases) | Revalidate tag |

### 4.2 Consultas SQL

```ts
// src/db/queries.ts

// --- Recién Lanzados (últimos 30 días) ---
export async function getJustReleased(limit: number = 20) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await sql`
    SELECT id, title, slug, price, discount, platforms, genres,
           rating, images->0->>'url' AS "coverImage",
           release_date::text AS "releaseDate",
           stock > 0 AS "inStock",
           true AS "canPreorder",
           false AS "isUpcoming"
    FROM games
    WHERE release_date <= NOW()
      AND release_date >= ${thirtyDaysAgo}
    ORDER BY release_date DESC
    LIMIT ${limit}
  `;
}

// --- Próximos lanzamientos ---
export async function getUpcoming(limit: number = 20) {
  return await sql`
    SELECT id, title, slug, price, discount, platforms, genres,
           rating, images->0->>'url' AS "coverImage",
           release_date::text AS "releaseDate",
           stock > 0 AS "inStock",
           (CASE WHEN stock > 0 THEN true ELSE false END) AS "canPreorder",
           true AS "isUpcoming"
    FROM games
    WHERE release_date > NOW()
    ORDER BY release_date ASC
    LIMIT ${limit}
  `;
}

// --- Unificar new-releases (ambas listas) ---
export async function getNewReleases(limit: number = 20) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await sql`
    SELECT id, title, slug, price, discount, platforms, genres,
           rating, images->0->>'url' AS "coverImage",
           release_date::text AS "releaseDate",
           stock > 0 AS "inStock",
           release_date > NOW() AS "isUpcoming"
    FROM games
    WHERE release_date >= ${thirtyDaysAgo}
       OR release_date > NOW()
    ORDER BY
      CASE WHEN release_date > NOW() THEN 0 ELSE 1 END,  -- próximos primero
      release_date DESC
    LIMIT ${limit}
  `;
}

// --- Más esperados (top votados) ---
export async function getMostAnticipated(limit: number = 20) {
  return await sql`
    SELECT g.id, g.title, g.slug, g.images->0->>'url' AS "coverImage",
           g.release_date::text AS "releaseDate",
           COUNT(uv.id)::int AS "voteCount"
    FROM games g
    LEFT JOIN upcoming_votes uv ON uv.game_id = g.id
    WHERE g.release_date > NOW()
    GROUP BY g.id
    ORDER BY "voteCount" DESC, g.release_date ASC
    LIMIT ${limit}
  `;
}
```

### 4.3 API Endpoints

```ts
// src/pages/api/games/just-released.ts
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const games = await getJustReleased(limit);
  return new Response(JSON.stringify({ data: games }), {
    status: 200,
    headers: cacheHeaders(120),
  });
};

// src/pages/api/games/upcoming.ts
// src/pages/api/games/most-anticipated.ts
// src/pages/api/games/new-releases.ts  (unificado, ya existe)
```

### 4.4 Actualización desde CMS

Si se integra un CMS (Strapi, Sanity, Contentful), se recibe un webhook cuando se publica o actualiza un juego:

```ts
// src/pages/api/webhooks/cms-game-published.ts
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== import.meta.env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await request.json();

  // Revalidar caché de new-releases
  await experimental_revalidate('new-releases');

  // Si es un juego upcoming, notificar a suscriptores si ya salió
  if (payload.event === 'game.released') {
    await notifyPreorderSubscribers(payload.gameId);
  }

  return new Response('OK', { status: 200 });
};
```

### 4.5 Cron Jobs

Se ejecutan mediante **Vercel Cron Jobs** (`vercel.json`) o `actions/schedule` de GitHub:

```json
// vercel.json (cada hora)
{
  "crons": [
    {
      "path": "/api/cron/check-releases",
      "schedule": "0 * * * *"
    }
  ]
}
```

```ts
// src/pages/api/cron/check-releases.ts
export const prerender = false;

export const GET: APIRoute = async () => {
  // 1. Juegos que pasaron de "upcoming" a "just_released"
  const newlyReleased = await sql`
    SELECT id, title FROM games
    WHERE release_date <= NOW()
      AND release_date > NOW() - INTERVAL '1 hour'
      AND EXISTS (
        SELECT 1 FROM preorder_subscriptions
        WHERE game_id = games.id AND notified = false
      )
  `;

  // 2. Notificar a suscriptores
  for (const game of newlyReleased) {
    await notifyPreorderSubscribers(game.id);
  }

  // 3. Limpiar votos de juegos ya lanzados (mayor a 60 días)
  await sql`
    DELETE FROM upcoming_votes
    WHERE game_id IN (
      SELECT id FROM games
      WHERE release_date < NOW() - INTERVAL '60 days'
    )
  `;

  return new Response(JSON.stringify({
    notified: newlyReleased.length,
  }), { status: 200 });
};
```

### 4.6 Revalidación under demand (Webhook + API)

Cuando un editor actualiza un juego desde el panel admin, se llama a la API de revalidación:

```ts
// src/pages/api/revalidate.ts
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${import.meta.env.REVALIDATION_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { tag } = await request.json();

  // Tags disponibles: 'new-releases', 'upcoming', 'most-anticipated'
  await experimental_revalidate(tag);

  return new Response(JSON.stringify({ revalidated: true }), { status: 200 });
};
```

---

## 5. Componente Countdown

### 5.1 Countdown (server-rendered + client island)

Componente que muestra el tiempo restante hasta el lanzamiento de un juego. Se renderiza en el servidor con el valor inicial y se hidrata como isla de JS para la cuenta regresiva en tiempo real.

```astro
---
// src/components/game/ReleaseCountdown.astro

export interface Props {
  releaseDate: string;   // ISO 8601
  size?: 'sm' | 'md' | 'lg';
  onRelease?: () => void;
}

const { releaseDate, size = 'md' } = Astro.props;

const now = new Date();
const target = new Date(releaseDate);
const diffMs = target.getTime() - now.getTime();
const isReleased = diffMs <= 0;

const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

const sizeClasses: Record<string, string> = {
  sm: 'text-xs gap-1',
  md: 'text-sm gap-2',
  lg: 'text-lg gap-3',
};

const numberSize: Record<string, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};
---

{
  isReleased ? (
    <div class="text-green-400 font-semibold {sizeClasses[size]}">
      ¡Ya disponible!
    </div>
  ) : (
    <div class="release-countdown {sizeClasses[size]}" data-target={releaseDate} data-size={size}>
      <div class="flex items-center {sizeClasses[size]}">
        <div class="text-center">
          <span class="font-mono font-bold tabular-nums {numberSize[size]}">{String(days).padStart(2, '0')}</span>
          <span class="block text-[0.6em] uppercase tracking-wider text-gray-400">días</span>
        </div>
        <span class="text-gray-500 mt-[-0.5em]">:</span>
        <div class="text-center">
          <span class="font-mono font-bold tabular-nums {numberSize[size]}">{String(hours).padStart(2, '0')}</span>
          <span class="block text-[0.6em] uppercase tracking-wider text-gray-400">horas</span>
        </div>
        <span class="text-gray-500 mt-[-0.5em] hidden sm:block">:</span>
        <div class="text-center hidden sm:block">
          <span class="font-mono font-bold tabular-nums {numberSize[size]}">{String(minutes).padStart(2, '0')}</span>
          <span class="block text-[0.6em] uppercase tracking-wider text-gray-400">min</span>
        </div>
        <span class="text-gray-500 mt-[-0.5em] hidden md:block">:</span>
        <div class="text-center hidden md:block">
          <span class="font-mono font-bold tabular-nums {numberSize[size]}">{String(seconds).padStart(2, '0')}</span>
          <span class="block text-[0.6em] uppercase tracking-wider text-gray-400">seg</span>
        </div>
      </div>
    </div>
  )
}

<script>
  /**
   * Client island: actualiza el countdown cada segundo.
   */
  document.querySelectorAll('.release-countdown').forEach((el) => {
    const target = new Date(el.dataset.target!).getTime();
    const size = el.dataset.size || 'md';

    const numberSize: Record<string, string> = {
      sm: 'text-lg',
      md: 'text-2xl',
      lg: 'text-4xl',
    };

    function tick() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        el.innerHTML = '<div class="text-green-400 font-semibold">¡Ya disponible!</div>';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      el.querySelectorAll('.font-mono').forEach((span, i) => {
        const values = [
          String(days).padStart(2, '0'),
          String(hours).padStart(2, '0'),
          String(minutes).padStart(2, '0'),
          String(seconds).padStart(2, '0'),
        ];
        (span as HTMLElement).textContent = values[i] ?? '00';
      });
    }

    setInterval(tick, 1000);
  });
</script>
```

### 5.2 Uso

```astro
---
import ReleaseCountdown from '@/components/game/ReleaseCountdown.astro';
import type { Game } from '@/types/game';

const { game } = Astro.props;
---

<!-- Tamaño grande en página de detalle -->
<ReleaseCountdown releaseDate={game.releaseDate} size="lg" client:load />

<!-- Tamaño pequeño en GameCard -->
<ReleaseCountdown releaseDate={game.releaseDate} size="sm" client:idle />
```

### 5.3 Variantes

| Variante | Descripción |
|---|---|
| `default` | Días : Horas : Minutos : Segundos |
| `compact` | Solo días y horas (para tarjetas pequeñas) |
| `minimal` | Texto "Lanzamiento en X días" sin números grandes |
| `released` | Muestra "Ya disponible" con animación |

---

## 6. Sistema de Suscripción a Preventas

### 6.1 Flujo

```
Usuario ve juego upcoming
        │
        ▼
[ Botón "Avísame cuando salga" ]
        │
        ▼
┌── ¿Usuario logueado? ──┐
│         │               │
│        Sí               No
│         │               │
│    [Modal email         │
│     prellenado]         │
│         │               │
└─────────┼───────────────┘
          │
          ▼
[ Confirmar suscripción ]
          │
          ▼
  INSERT preorder_subscriptions
          │
          ▼
[ Feedback: "Te avisaremos!" ]
          │
          ▼
  [Cron job] ──► releaseDate <= hoy ──► enviar email ──► notified = true
```

### 6.2 API Endpoint de suscripción

```ts
// src/pages/api/games/[slug]/subscribe.ts
export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const { slug } = params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return new Response(JSON.stringify({ error: 'Juego no encontrado' }), { status: 404 });
  }

  if (new Date(game.releaseDate) <= new Date()) {
    return new Response(JSON.stringify({ error: 'El juego ya fue lanzado' }), { status: 400 });
  }

  const body = await request.json();
  const email = body.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Email inválido' }), { status: 400 });
  }

  // Verificar si ya está suscrito
  const [existing] = await sql`
    SELECT id FROM preorder_subscriptions
    WHERE game_id = ${game.id} AND email = ${email}
  `;

  if (existing) {
    return new Response(JSON.stringify({
      message: 'Ya estás suscrito para este juego',
      alreadySubscribed: true,
    }), { status: 200 });
  }

  await sql`
    INSERT INTO preorder_subscriptions (user_id, game_id, email)
    VALUES (${body.userId ?? null}, ${game.id}, ${email})
  `;

  return new Response(JSON.stringify({ message: 'Suscripción exitosa' }), { status: 201 });
};
```

### 6.3 Componente de Suscripción

```astro
---
// src/components/game/PreorderSubscribe.astro

export interface Props {
  gameId: string;
  gameSlug: string;
  releaseDate: string;
  user?: { id: string; email: string } | null;
}

const { gameId, gameSlug, releaseDate, user } = Astro.props;
const isReleased = new Date(releaseDate) <= new Date();
---

{
  isReleased ? null : (
    <div
      class="preorder-subscribe border border-gray-700 rounded-lg p-4 bg-gray-800/50"
      data-game-id={gameId}
      data-game-slug={gameSlug}
      data-user-email={user?.email ?? ''}
      data-user-id={user?.id ?? ''}
    >
      <p class="text-sm font-medium text-gray-300 mb-3">
        📬 ¿No quieres esperar?
      </p>
      <p class="text-xs text-gray-400 mb-4">
        Suscríbete y te enviaremos un email apenas el juego esté disponible.
      </p>

      <form class="subscribe-form flex gap-2">
        <input
          type="email"
          name="email"
          placeholder="tu@email.com"
          value={user?.email ?? ''}
          required
          class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
                 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Avísame
        </button>
      </form>

      <p class="subscribe-feedback text-xs mt-2 hidden"></p>
    </div>
  )
}

<script>
  document.querySelectorAll('.preorder-subscribe').forEach((el) => {
    const gameSlug = el.dataset.gameSlug!;
    const userId = el.dataset.userId;
    const form = el.querySelector('.subscribe-form') as HTMLFormElement;
    const feedback = el.querySelector('.subscribe-feedback') as HTMLElement;
    const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (!email) return;

      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      try {
        const res = await fetch(`/api/games/${gameSlug}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            userId: userId || undefined,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          feedback.className = 'text-xs mt-2 text-green-400';
          feedback.textContent = '✅ Te avisaremos cuando esté disponible';
          form.style.display = 'none';
        } else {
          feedback.className = 'text-xs mt-2 text-red-400';
          feedback.textContent = data.error || 'Error al suscribirte';
        }
      } catch {
        feedback.className = 'text-xs mt-2 text-red-400';
        feedback.textContent = 'Error de conexión. Intenta de nuevo.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Avísame';
      }

      feedback.classList.remove('hidden');
    });
  });
</script>
```

### 6.4 Servicio de Notificaciones

```ts
// src/lib/notifications.ts
export async function notifyPreorderSubscribers(gameId: string): Promise<void> {
  const subscribers = await sql`
    SELECT id, email FROM preorder_subscriptions
    WHERE game_id = ${gameId} AND notified = false
  `;

  const game = await getGameBySlug(gameId);
  if (!game || subscribers.length === 0) return;

  for (const sub of subscribers) {
    try {
      await sendEmail({
        to: sub.email,
        subject: `🎮 ${game.title} ya está disponible en 007-Sama`,
        html: `
          <h2>¡${game.title} ya está aquí!</h2>
          <p>El juego que esperabas ya está disponible para comprar.</p>
          <a href="${import.meta.env.SITE_URL}/games/${game.slug}"
             style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">
            Ver en la tienda
          </a>
        `,
      });

      await sql`
        UPDATE preorder_subscriptions SET notified = true
        WHERE id = ${sub.id}
      `;

      await sql`
        INSERT INTO notification_log (game_id, subscription_id, status)
        VALUES (${gameId}, ${sub.id}, 'sent')
      `;
    } catch (error) {
      await sql`
        INSERT INTO notification_log (game_id, subscription_id, status, error_message)
        VALUES (${gameId}, ${sub.id}, 'failed', ${(error as Error).message})
      `;
    }
  }
}
```

### 6.5 Proveedor de Email

```ts
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  await resend.emails.send({
    from: '007-Sama <notificaciones@007-sama.com>',
    to,
    subject,
    html,
  });
}
```

---

## 7. Sección "Más Esperados" con Votos

### 7.1 Flujo de votación

- Cualquier usuario autenticado puede votar por un juego upcoming
- Un voto por usuario por juego
- El voto se puede retirar (toggle)
- La lista de "Más Esperados" se ordena por `voteCount DESC`
- Los votos expiran cuando el juego lleva más de 60 días lanzado

### 7.2 API Endpoint de Votación

```ts
// src/pages/api/games/[slug]/vote.ts
export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const { slug } = params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return new Response(JSON.stringify({ error: 'Juego no encontrado' }), { status: 404 });
  }

  if (new Date(game.releaseDate) <= new Date()) {
    return new Response(JSON.stringify({ error: 'El juego ya fue lanzado' }), { status: 400 });
  }

  const userId = session.user.id;

  // Toggle: si ya votó, retira el voto
  const [existing] = await sql`
    SELECT id FROM upcoming_votes
    WHERE user_id = ${userId} AND game_id = ${game.id}
  `;

  if (existing) {
    await sql`DELETE FROM upcoming_votes WHERE id = ${existing.id}`;

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS "count" FROM upcoming_votes WHERE game_id = ${game.id}
    `;

    return new Response(JSON.stringify({ voted: false, voteCount: count }), { status: 200 });
  }

  await sql`
    INSERT INTO upcoming_votes (user_id, game_id) VALUES (${userId}, ${game.id})
  `;

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS "count" FROM upcoming_votes WHERE game_id = ${game.id}
  `;

  return new Response(JSON.stringify({ voted: true, voteCount: count }), { status: 200 });
};
```

### 7.3 Componente de Votación

```astro
---
// src/components/game/AnticipatedVote.astro

export interface Props {
  gameId: string;
  gameSlug: string;
  initialVoteCount: number;
  userVoted?: boolean;
  isAuthenticated: boolean;
}

const { gameId, gameSlug, initialVoteCount, userVoted = false, isAuthenticated } = Astro.props;
---

<div
  class="anticipated-vote flex items-center gap-2"
  data-game-slug={gameSlug}
  data-initial-count={initialVoteCount}
  data-user-voted={userVoted}
  data-authenticated={isAuthenticated}
>
  <button
    class="vote-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
           transition-colors border
           {userVoted
             ? 'bg-indigo-600 text-white border-indigo-500'
             : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-indigo-500 hover:text-indigo-400'}"
  >
    <span class="vote-icon">{userVoted ? '▲' : '△'}</span>
    <span class="vote-count">{initialVoteCount}</span>
  </button>
</div>

<script>
  document.querySelectorAll('.anticipated-vote').forEach((el) => {
    const gameSlug = el.dataset.gameSlug!;
    const isAuthenticated = el.dataset.authenticated === 'true';
    const btn = el.querySelector('.vote-btn') as HTMLButtonElement;
    const icon = btn.querySelector('.vote-icon') as HTMLElement;
    const count = btn.querySelector('.vote-count') as HTMLElement;

    btn.addEventListener('click', async () => {
      if (!isAuthenticated) {
        window.location.href = `/auth/login?redirect=/games/${gameSlug}`;
        return;
      }

      btn.disabled = true;

      try {
        const res = await fetch(`/api/games/${gameSlug}/vote`, { method: 'POST' });
        const data = await res.json();

        if (res.ok) {
          count.textContent = String(data.voteCount);
          icon.textContent = data.voted ? '▲' : '△';
          btn.classList.toggle('bg-indigo-600', data.voted);
          btn.classList.toggle('text-white', data.voted);
          btn.classList.toggle('border-indigo-500', data.voted);
          btn.classList.toggle('bg-gray-800', !data.voted);
          btn.classList.toggle('text-gray-300', !data.voted);
          btn.classList.toggle('border-gray-700', !data.voted);
        }
      } catch {
        // silent fail
      } finally {
        btn.disabled = false;
      }
    });
  });
</script>
```

### 7.4 Página /most-anticipated

```astro
---
// src/pages/most-anticipated.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import GameCard from '@/components/game/GameCard.astro';
import AnticipatedVote from '@/components/game/AnticipatedVote.astro';
import { getMostAnticipated } from '@/db/queries';
import { getSession } from '@/lib/auth';

const session = await getSession(Astro.request);
const user = session?.user ?? null;
const mostAnticipated = await getMostAnticipated(24);
const userVotes = user
  ? await sql`
      SELECT game_id FROM upcoming_votes WHERE user_id = ${user.id}
    `
  : [];
const votedGameIds = new Set(userVotes.map((v: any) => v.game_id));
---

<BaseLayout
  title="Más Esperados | 007-Sama"
  description="Los juegos más votados por la comunidad. Vota por tus lanzamientos más esperados."
>
  <section class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">🔥 Más Esperados</h1>
    <p class="text-gray-400 mb-8">
      Vota por los juegos que más esperas. Los más votados aparecen primero.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {mostAnticipated.map((game) => (
        <div class="relative">
          <GameCard game={game} variant="compact" />

          <div class="absolute top-2 right-2">
            <AnticipatedVote
              gameId={game.id}
              gameSlug={game.slug}
              initialVoteCount={game.voteCount}
              userVoted={votedGameIds.has(game.id)}
              isAuthenticated={!!user}
              client:load
            />
          </div>
        </div>
      ))}
    </div>

    {mostAnticipated.length === 0 && (
      <div class="text-center py-16 text-gray-500">
        <p class="text-4xl mb-4">📅</p>
        <p class="text-lg">No hay próximos lanzamientos registrados.</p>
        <p class="text-sm">Vuelve pronto para votar por los juegos más esperados.</p>
      </div>
    )}
  </section>
</BaseLayout>
```

---

## 8. SEO y Structured Data

### 8.1 JSON-LD para juegos (Product + Event schema)

Cada juego en la página de nuevo lanzamiento o próximo debe incluir structured data:

```ts
// src/lib/seo.ts
export function getGameStructuredData(game: Game) {
  const isUpcoming = new Date(game.releaseDate) > new Date();

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.title,
    description: game.description,
    image: game.images?.[0]?.url,
    sku: game.id,
    brand: {
      '@type': 'Brand',
      name: game.developer,
    },
    offers: {
      '@type': isUpcoming ? 'PreOrder' : 'Offer',
      price: game.discount > 0
        ? (game.price * (1 - game.discount / 100)).toFixed(2)
        : game.price.toFixed(2),
      priceCurrency: 'USD',
      availability: game.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${import.meta.env.SITE_URL}/games/${game.slug}`,
      priceValidUntil: isUpcoming
        ? game.releaseDate
        : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    },
    ...(game.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating,
        reviewCount: game.ratingCount,
        bestRating: 5,
      },
    }),
    releaseDate: game.releaseDate,
    ...(game.genres?.length > 0 && {
      genre: game.genres,
    }),
    ...(game.platforms?.length > 0 && {
      platform: game.platforms.map(p => {
        const map: Record<string, string> = {
          pc: 'PC',
          ps5: 'PlayStation 5',
          'xbox-series-x': 'Xbox Series X',
          'xbox-one': 'Xbox One',
          switch: 'Nintendo Switch',
          ios: 'iOS',
          android: 'Android',
        };
        return map[p] ?? p;
      }),
    }),
  };
}
```

### 8.2 Uso en página

```astro
---
// src/pages/games/[slug].astro — dentro del <head>
import { getGameStructuredData } from '@/lib/seo';
const game = /* ... */;
const structuredData = getGameStructuredData(game);
---

<script type="application/ld+json" set:html={JSON.stringify(structuredData)} />
```

### 8.3 Página de nuevos lanzamientos (lista)

Para la página `/new-releases`, se genera un `ItemList` con los juegos:

```ts
export function getNewReleasesStructuredData(games: GameSummary[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Nuevos Lanzamientos de Videojuegos',
    description: 'Los videojuegos recién lanzados y próximos en 007-Sama',
    itemListElement: games.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: game.title,
        url: `${import.meta.env.SITE_URL}/games/${game.slug}`,
        image: game.coverImage,
        offers: {
          '@type': 'Offer',
          price: game.price.toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };
}
```

### 8.4 SEO Metadata por página

| Página | Title | Description | Robots |
|---|---|---|---|
| `/new-releases` | `Nuevos Lanzamientos | 007-Sama` | `Descubre los últimos lanzamientos y próximos estrenos de videojuegos. Pre-venta, fechas y novedades en 007-Sama.` | `index, follow` |
| `/most-anticipated` | `Más Esperados | 007-Sama` | `Vota por los videojuegos más esperados por la comunidad. Los próximos lanzamientos más votados en 007-Sama.` | `index, follow` |
| `/games/[slug]` (upcoming) | `{title} — Pre-venta | 007-Sama` | `Reserva {title} en 007-Sama. Fecha de lanzamiento: {date}. Precio: ${price}.` | `index, follow` |

---

## 9. Página /new-releases (actualizada)

```astro
---
// src/pages/new-releases.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import GameCard from '@/components/game/GameCard.astro';
import ReleaseCountdown from '@/components/game/ReleaseCountdown.astro';
import PreorderSubscribe from '@/components/game/PreorderSubscribe.astro';
import AnticipatedVote from '@/components/game/AnticipatedVote.astro';
import { getJustReleased, getUpcoming, getMostAnticipated } from '@/db/queries';
import { getSession } from '@/lib/auth';
import { getNewReleasesStructuredData } from '@/lib/seo';

const session = await getSession(Astro.request);
const user = session?.user ?? null;

const justReleased = await getJustReleased(12);
const upcoming = await getUpcoming(12);
const mostAnticipated = await getMostAnticipated(8);

const userVotes = user
  ? await sql`SELECT game_id FROM upcoming_votes WHERE user_id = ${user.id}`
  : [];
const votedGameIds = new Set(userVotes.map((v: any) => v.game_id));

const structuredData = getNewReleasesStructuredData([...justReleased, ...upcoming]);
---

<BaseLayout
  title="Nuevos Lanzamientos | 007-Sama"
  description="Descubre los últimos lanzamientos y próximos estrenos de videojuegos. Pre-venta, fechas y novedades."
>
  <script type="application/ld+json" set:html={JSON.stringify(structuredData)} />

  <section class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">🚀 Nuevos Lanzamientos</h1>
    <p class="text-gray-400 mb-8">
      Juegos recién lanzados (últimos 30 días) y próximos estrenos.
    </p>

    <!-- ========= PRÓXIMOS ========= -->
    {upcoming.length > 0 && (
      <>
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <span class="text-amber-400">📅</span> Próximos Lanzamientos
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {upcoming.map((game) => (
            <div class="relative">
              <div class="absolute top-2 left-2 z-10">
                <span class="px-2 py-1 bg-amber-600 text-white text-xs font-bold rounded">
                  PRE-VENTA
                </span>
              </div>
              <GameCard game={game} variant="compact" />

              <div class="mt-3">
                <ReleaseCountdown releaseDate={game.releaseDate} size="sm" client:idle />
              </div>
              <div class="mt-2">
                <PreorderSubscribe
                  gameId={game.id}
                  gameSlug={game.slug}
                  releaseDate={game.releaseDate}
                  user={user}
                  client:load
                />
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    <!-- ========= RECIÉN LANZADOS ========= -->
    {justReleased.length > 0 && (
      <>
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <span class="text-green-400">🆕</span> Recién Lanzados
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {justReleased.map((game) => (
            <div class="relative">
              <div class="absolute top-2 left-2 z-10">
                <span class="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                  NUEVO
                </span>
              </div>
              <GameCard game={game} variant="compact" />
            </div>
          ))}
        </div>
      </>
    )}

    <!-- ========= MÁS ESPERADOS ========= -->
    {mostAnticipated.length > 0 && (
      <>
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <span class="text-red-400">🔥</span> Más Esperados por la Comunidad
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mostAnticipated.map((game) => (
            <div class="relative">
              <AnticipatedVote
                gameId={game.id}
                gameSlug={game.slug}
                initialVoteCount={game.voteCount}
                userVoted={votedGameIds.has(game.id)}
                isAuthenticated={!!user}
                client:load
              />
              <GameCard game={game} variant="compact" />
            </div>
          ))}
        </div>
        <a
          href="/most-anticipated"
          class="inline-block text-indigo-400 hover:text-indigo-300 text-sm font-medium"
        >
          Ver todos los más esperados →
        </a>
      </>
    )}

    {justReleased.length === 0 && upcoming.length === 0 && (
      <div class="text-center py-16 text-gray-500">
        <p class="text-4xl mb-4">📦</p>
        <p class="text-lg">No hay novedades por ahora.</p>
        <p class="text-sm">Vuelve pronto para ver nuevos lanzamientos.</p>
      </div>
    )}
  </section>
</BaseLayout>
```

---

## 10. Actualizaciones a Docs Existentes

Los siguientes documentos existentes hacen referencia a una ventana de 90 días y deben actualizarse para reflejar la nueva ventana de 30 días:

### 10.1 `docs/Catalog-API.md`

| Ubicación | Cambio |
|---|---|
| Sección 3.4 título | "últimos 90 días + próximos" → "últimos 30 días + próximos" |
| Línea 588 (comentario en `getNewReleases`) | `threeMonthsAgo` → `thirtyDaysAgo` |
| Línea 642–644 | `setMonth(-3)` → `setDate(-30)` |
| Línea 1127 (tabla cache) | TTL: mantener 120s |

### 10.2 `docs/Pages-Layouts.md`

| Ubicación | Cambio |
|---|---|
| Sección 2.1 (Home, línea 325) | `releaseDate en últimos 3 meses` → `releaseDate en últimos 30 días` |
| Sección 2.4 (New Releases, línea 578) | `juegos lanzados en los últimos 90 días` → `juegos lanzados en los últimos 30 días` |
| Sección 2.4 (línea 590–591) | `threeMonthsAgo` → `thirtyDaysAgo`, `setMonth(-3)` → `setDate(-30)` |
| Sección 2.4 (wireframe, línea 633) | `Juegos publicados en los últimos 3 meses` → `Juegos publicados en los últimos 30 días` |

### 10.3 `docs/Routing.md`

Agregar las nuevas rutas:

| Ruta | Archivo | Estrategia | Auth |
|---|---|---|---|
| `/most-anticipated` | `src/pages/most-anticipated.astro` | SSG con revalidate | No |
| `/api/games/just-released` | `src/pages/api/games/just-released.ts` | SSR | No |
| `/api/games/upcoming` | `src/pages/api/games/upcoming.ts` | SSR | No |
| `/api/games/most-anticipated` | `src/pages/api/games/most-anticipated.ts` | SSR | No |
| `/api/games/[slug]/subscribe` | `src/pages/api/games/[slug]/subscribe.ts` | SSR | No |
| `/api/games/[slug]/vote` | `src/pages/api/games/[slug]/vote.ts` | SSR | Requiere auth |
| `/api/cron/check-releases` | `src/pages/api/cron/check-releases.ts` | SSR | Token |
| `/api/webhooks/cms-game-published` | `src/pages/api/webhooks/cms-game-published.ts` | SSR | Webhook secret |
| `/api/revalidate` | `src/pages/api/revalidate.ts` | SSR | Token |

---

## Referencias

- [Catálogo — API Endpoints](./Catalog-API.md#34-get-apigamesnew-releases) — endpoint existente de new-releases
- [Páginas y Layouts](./Pages-Layouts.md#24-nuevos-lanzamientos-new-releasesastro) — página /new-releases
- [Componentes UI](./Componentes.md) — GameCard, PriceTag, RatingStar
- [Routing del Proyecto](./Routing.md) — rutas, SSR vs SSG
- [Arquitectura del Proyecto](./Architecture.md) — estructura general, flujo de datos
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro API Routes](https://docs.astro.build/en/guides/endpoints/)
- [Resend — Email API](https://resend.com/docs)
- [Schema.org Product](https://schema.org/Product)
- [Schema.org PreOrder](https://schema.org/PreOrder)
