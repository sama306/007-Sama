# Catálogo — Modelo de Datos y API Endpoints

> **Framework:** Astro 6.x (API Routes: server endpoints)  
> **Output:** SSR (`prerender = false` en todos los endpoints)  
> **Formato:** REST-like sobre HTTP  
> **Idioma:** Español (código fuente en inglés)

---

## Índice

1. [Modelo de Datos: Videojuego](#1-modelo-de-datos-videojuego)
2. [Tipos TypeScript](#2-tipos-typescript)
3. [Endpoints de la API](#3-endpoints-de-la-api)
4. [Filtros y Query Params](#4-filtros-y-query-params)
5. [Integración con Base de Datos (PostgreSQL / Supabase)](#5-integración-con-base-de-datos-postgresql--supabase)
6. [Caching y Revalidación](#6-caching-y-revalidación)
7. [Documentación OpenAPI Simplificada](#7-documentación-openapi-simplificada)
8. [Consideraciones de Rendimiento](#8-consideraciones-de-rendimiento)

---

## 1. Modelo de Datos: Videojuego

### Schema completo (PostgreSQL)

```sql
CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL UNIQUE,
  description     TEXT NOT NULL,
  price           DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  discount        INTEGER NOT NULL DEFAULT 0 CHECK (discount BETWEEN 0 AND 100),
  platforms       TEXT[] NOT NULL DEFAULT '{}',
  genres          TEXT[] NOT NULL DEFAULT '{}',
  developer       VARCHAR(255) NOT NULL,
  publisher       VARCHAR(255) NOT NULL DEFAULT '',
  release_date    DATE NOT NULL,
  images          JSONB NOT NULL DEFAULT '[]',
  trailer_url     VARCHAR(512),
  requirements    JSONB NOT NULL DEFAULT '{}',
  rating          DECIMAL(3, 1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  rating_count    INTEGER NOT NULL DEFAULT 0,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  featured        BOOLEAN NOT NULL DEFAULT false,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_games_slug ON games (slug);
CREATE INDEX idx_games_genres ON games USING GIN (genres);
CREATE INDEX idx_games_platforms ON games USING GIN (platforms);
CREATE INDEX idx_games_tags ON games USING GIN (tags);
CREATE INDEX idx_games_release_date ON games (release_date DESC);
CREATE INDEX idx_games_rating ON games (rating DESC);
CREATE INDEX idx_games_price ON games (price ASC);
CREATE INDEX idx_games_featured ON games (featured) WHERE featured = true;
```

### Schema completo (Content Collection — Zod)

Para desarrollo local y SSG, el catálogo también se puede modelar con Content Collections de Astro:

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const gamesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:         z.string(),
    slug:          z.string(),
    description:   z.string().max(2000),
    price:         z.number().positive(),
    discount:      z.number().int().min(0).max(100).default(0),
    platforms:     z.array(z.enum(['pc', 'ps5', 'xbox-series-x', 'xbox-one', 'switch', 'ios', 'android'])),
    genres:        z.array(z.enum([
      'action', 'adventure', 'rpg', 'strategy', 'simulation',
      'sports', 'horror', 'shooter', 'puzzle', 'racing',
      'fighting', 'platformer', 'mmo', 'indie',
    ])),
    developer:     z.string(),
    publisher:     z.string().optional(),
    releaseDate:   z.date(),
    images:        z.array(z.string()).default([]),
    trailerUrl:    z.string().url().optional(),
    requirements:  z.object({
      minimum: z.object({
        os:        z.string().optional(),
        cpu:       z.string().optional(),
        ram:       z.string().optional(),
        gpu:       z.string().optional(),
        storage:   z.string().optional(),
      }).optional(),
      recommended: z.object({
        os:        z.string().optional(),
        cpu:       z.string().optional(),
        ram:       z.string().optional(),
        gpu:       z.string().optional(),
        storage:   z.string().optional(),
      }).optional(),
    }).default({}),
    rating:        z.number().min(0).max(5).default(0),
    ratingCount:   z.number().int().nonnegative().default(0),
    stock:         z.number().int().nonnegative().default(0),
    featured:      z.boolean().default(false),
    tags:          z.array(z.string()).optional(),
  }),
});

export const collections = { games: gamesCollection };
```

### Tabla de campos

| Campo | Tipo SQL | Tipo TS | Descripción |
|---|---|---|---|
| `id` | `UUID` | `string` | Identificador único |
| `title` | `VARCHAR(255)` | `string` | Título del juego |
| `slug` | `VARCHAR(255) UNIQUE` | `string` | Slug para URL amigable |
| `description` | `TEXT` | `string` | Descripción del juego |
| `price` | `DECIMAL(10,2)` | `number` | Precio actual |
| `discount` | `INTEGER (0-100)` | `number` | Porcentaje de descuento |
| `platforms` | `TEXT[]` | `Platform[]` | Plataformas disponibles |
| `genres` | `TEXT[]` | `Genre[]` | Géneros del juego |
| `developer` | `VARCHAR(255)` | `string` | Desarrollador |
| `publisher` | `VARCHAR(255)` | `string` | Publicadora |
| `releaseDate` | `DATE` | `string (ISO 8601)` | Fecha de lanzamiento |
| `images` | `JSONB` | `GameImage[]` | Array de imágenes |
| `trailerUrl` | `VARCHAR(512)` | `string \| null` | URL del tráiler (YouTube embed) |
| `requirements` | `JSONB` | `SystemRequirements` | Requisitos del sistema |
| `rating` | `DECIMAL(3,1)` | `number` | Valoración media (0–5) |
| `ratingCount` | `INTEGER` | `number` | Número de valoraciones |
| `stock` | `INTEGER` | `number` | Unidades en inventario |
| `featured` | `BOOLEAN` | `boolean` | Destacado en portada |
| `tags` | `TEXT[]` | `string[]` | Tags de búsqueda |
| `createdAt` | `TIMESTAMPTZ` | `string` | Fecha de creación |
| `updatedAt` | `TIMESTAMPTZ` | `string` | Fecha de última modificación |

### Tabla de reviews (relacionada)

```sql
CREATE TABLE game_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      VARCHAR(255) NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  helpful    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (game_id, user_id)  -- un review por usuario por juego
);

CREATE INDEX idx_reviews_game_id ON game_reviews (game_id);
CREATE INDEX idx_reviews_user_id ON game_reviews (user_id);
```

---

## 2. Tipos TypeScript

```ts
// src/types/game.ts

export interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  platforms: Platform[];
  genres: Genre[];
  developer: string;
  publisher: string;
  releaseDate: string;       // ISO 8601
  images: GameImage[];
  trailerUrl: string | null;
  requirements: SystemRequirements;
  rating: number;
  ratingCount: number;
  stock: number;
  featured: boolean;
  tags: string[];
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}

/** Versión resumida para listados (evita enviar datos pesados) */
export interface GameSummary {
  id: string;
  title: string;
  slug: string;
  price: number;
  discount: number;
  platforms: Platform[];
  genres: Genre[];
  rating: number;
  coverImage: string;
  releaseDate: string;
  inStock: boolean;
}

export type Platform =
  | 'pc'
  | 'ps5'
  | 'xbox-series-x'
  | 'xbox-one'
  | 'switch'
  | 'ios'
  | 'android';

export type Genre =
  | 'action'
  | 'adventure'
  | 'rpg'
  | 'strategy'
  | 'simulation'
  | 'sports'
  | 'horror'
  | 'shooter'
  | 'puzzle'
  | 'racing'
  | 'fighting'
  | 'platformer'
  | 'mmo'
  | 'indie';

export interface GameImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  type: 'cover' | 'screenshot' | 'artwork';
}

export interface SystemRequirements {
  minimum?: RequirementsSet;
  recommended?: RequirementsSet;
}

export interface RequirementsSet {
  os: string;
  cpu: string;
  ram: string;
  gpu: string;
  storage: string;
}

export interface GameReview {
  id: string;
  gameId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;
  createdAt: string;
}

export interface GameWithPrice extends Game {
  /** Precio con descuento aplicado */
  finalPrice: number;
  /** true si tiene descuento activo */
  onSale: boolean;
}
```

### Helpers de precio

```ts
// src/lib/pricing.ts
export function calcFinalPrice(price: number, discount: number): number {
  return +(price * (1 - discount / 100)).toFixed(2);
}

export function isOnSale(discount: number): boolean {
  return discount > 0;
}
```

---

## 3. Endpoints de la API

### 3.1 `GET /api/games`

Devuelve el listado completo del catálogo con paginación y filtros.

**Ubicación:** `src/pages/api/games.ts`

```ts
// src/pages/api/games.ts
import type { APIRoute } from 'astro';
import { getGames, type GamesFilter } from '@/db/queries';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const filter = extractGamesFilter(url.searchParams);

  const { games, total, page, pageSize } = await getGames(filter);

  return new Response(
    JSON.stringify({
      data: games,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
```

**Query params:** Ver [sección 4 — Filtros](#4-filtros-y-query-params).

**Ejemplo de respuesta:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Elden Ring",
      "slug": "elden-ring",
      "price": 59.99,
      "discount": 20,
      "platforms": ["pc", "ps5", "xbox-series-x"],
      "genres": ["rpg", "action"],
      "rating": 4.8,
      "coverImage": "https://cdn.007-sama.com/images/elden-ring/cover.jpg",
      "releaseDate": "2022-02-25",
      "inStock": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 3.2 `GET /api/games/[slug]`

Devuelve el detalle completo de un videojuego por su slug.

**Ubicación:** `src/pages/api/games/[slug].ts`

```ts
// src/pages/api/games/[slug].ts
import type { APIRoute } from 'astro';
import { getGameBySlug, getGameReviews } from '@/db/queries';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const game = await getGameBySlug(slug);

  if (!game) {
    return new Response(JSON.stringify({ error: 'Juego no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ data: game }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Ejemplo de respuesta:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Elden Ring",
    "slug": "elden-ring",
    "description": "Explora las Tierras Intermedias en este aclamado RPG de acción...",
    "price": 59.99,
    "discount": 20,
    "finalPrice": 47.99,
    "onSale": true,
    "platforms": ["pc", "ps5", "xbox-series-x"],
    "genres": ["rpg", "action"],
    "developer": "FromSoftware",
    "publisher": "Bandai Namco",
    "releaseDate": "2022-02-25",
    "images": [
      {
        "url": "https://cdn.007-sama.com/images/elden-ring/cover.jpg",
        "alt": "Elden Ring cover",
        "width": 1200,
        "height": 1600,
        "type": "cover"
      },
      {
        "url": "https://cdn.007-sama.com/images/elden-ring/screenshot-1.jpg",
        "alt": "Screenshot 1",
        "width": 1920,
        "height": 1080,
        "type": "screenshot"
      }
    ],
    "trailerUrl": "https://www.youtube.com/embed/E3Huy2cdih0",
    "requirements": {
      "minimum": {
        "os": "Windows 10",
        "cpu": "Intel i5-8400 / AMD Ryzen 3 3300X",
        "ram": "12 GB",
        "gpu": "NVIDIA GTX 1060 / AMD RX 580",
        "storage": "60 GB"
      },
      "recommended": {
        "os": "Windows 11",
        "cpu": "Intel i7-8700K / AMD Ryzen 5 3600X",
        "ram": "16 GB",
        "gpu": "NVIDIA RTX 2070 / AMD RX 6700 XT",
        "storage": "60 GB"
      }
    },
    "rating": 4.8,
    "ratingCount": 45231,
    "stock": 500,
    "featured": true,
    "tags": ["open-world", "souls-like", "multiplayer", "rpg"],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-06-01T14:30:00Z"
  }
}
```

---

### 3.3 `GET /api/games/search`

Búsqueda textual sobre el catálogo.

**Ubicación:** `src/pages/api/games/search.ts`

```ts
// src/pages/api/games/search.ts
import type { APIRoute } from 'astro';
import { searchGames } from '@/db/queries';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return new Response(
      JSON.stringify({ error: 'El parámetro "q" debe tener al menos 2 caracteres' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));

  const results = await searchGames(q, { page, pageSize });

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Query params:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `q` | `string` | — | **Requerido.** Término de búsqueda (mín. 2 caracteres) |
| `page` | `integer` | `1` | Número de página |
| `pageSize` | `integer` | `20` | Resultados por página (max. 50) |

**Ejemplo de respuesta:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Elden Ring",
      "slug": "elden-ring",
      "price": 59.99,
      "discount": 20,
      "platforms": ["pc", "ps5", "xbox-series-x"],
      "genres": ["rpg", "action"],
      "rating": 4.8,
      "coverImage": "https://cdn.007-sama.com/images/elden-ring/cover.jpg",
      "releaseDate": "2022-02-25",
      "inStock": true
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 3,
    "totalPages": 1
  },
  "query": "elden"
}
```

**Implementación de búsqueda en PostgreSQL:**

```ts
// src/db/queries.ts
export async function searchGames(query: string, opts: { page: number; pageSize: number }) {
  const { page, pageSize } = opts;
  const offset = (page - 1) * pageSize;
  const searchTerm = `%${query}%`;

  const { rows } = await sql`
    SELECT id, title, slug, price, discount, platforms, genres,
           rating, images->0->>'url' AS "coverImage",
           release_date::text AS "releaseDate",
           stock > 0 AS "inStock"
    FROM games
    WHERE
      title ILIKE ${searchTerm}
      OR ${query} = ANY(tags)
      OR ${query} = ANY(genres)
    ORDER BY
      CASE WHEN title ILIKE ${query} THEN 0
           WHEN title ILIKE ${`${query}%`} THEN 1
           ELSE 2
      END,
      rating DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(*)::int
    FROM games
    WHERE
      title ILIKE ${searchTerm}
      OR ${query} = ANY(tags)
      OR ${query} = ANY(genres)
  `;

  return {
    data: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
    query,
  };
}
```

---

### 3.4 `GET /api/games/new-releases`

Devuelve los lanzamientos más recientes (últimos 30 días) + próximos lanzamientos.

**Ubicación:** `src/pages/api/games/new-releases.ts`

```ts
// src/pages/api/games/new-releases.ts
import type { APIRoute } from 'astro';
import { getNewReleases } from '@/db/queries';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));

  const games = await getNewReleases(limit);

  return new Response(JSON.stringify({ data: games }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Query params:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `limit` | `integer` | `20` | Número máximo de resultados (max. 50) |

**Ejemplo de respuesta:**

```json
{
  "data": [
    {
      "id": "...",
      "title": "Elden Ring: Shadow of the Erdtree",
      "slug": "elden-ring-shadow-of-the-erdtree",
      "price": 39.99,
      "discount": 0,
      "platforms": ["pc", "ps5", "xbox-series-x"],
      "genres": ["rpg", "action"],
      "rating": 4.9,
      "coverImage": "...",
      "releaseDate": "2024-06-21",
      "inStock": true,
      "isUpcoming": false
    }
  ]
}
```

**Consulta SQL:**

```ts
export async function getNewReleases(limit: number) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { rows } = await sql`
    SELECT id, title, slug, price, discount, platforms, genres,
           rating, images->0->>'url' AS "coverImage",
           release_date::text AS "releaseDate",
           stock > 0 AS "inStock",
           release_date > NOW() AS "isUpcoming"
    FROM games
    WHERE release_date >= ${thirtyDaysAgo}
    ORDER BY release_date DESC
    LIMIT ${limit}
  `;

  return rows;
}
```

---

### 3.5 `GET /api/games/[slug]/reviews`

Devuelve las reseñas de un juego específico.

**Ubicación:** `src/pages/api/games/[slug]/reviews.ts`

```ts
// src/pages/api/games/[slug]/reviews.ts
import type { APIRoute } from 'astro';
import { getGameReviews, getGameBySlug } from '@/db/queries';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const { slug } = params;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize')) || 10));
  const sort = url.searchParams.get('sort') || 'recent';

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const game = await getGameBySlug(slug);
  if (!game) {
    return new Response(JSON.stringify({ error: 'Juego no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reviews = await getGameReviews(game.id, { page, pageSize, sort });

  return new Response(JSON.stringify({
    data: reviews.rows,
    pagination: reviews.pagination,
    game: {
      id: game.id,
      title: game.title,
      slug: game.slug,
      rating: game.rating,
      ratingCount: game.ratingCount,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Query params:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | `integer` | `1` | Número de página |
| `pageSize` | `integer` | `10` | Reseñas por página (max. 50) |
| `sort` | `enum` | `recent` | Orden: `recent`, `oldest`, `highest`, `lowest`, `helpful` |

**Ejemplo de respuesta:**

```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "770e8400-e29b-41d4-a716-446655440002",
      "userName": "GamerPro99",
      "rating": 5,
      "title": "Obra maestra",
      "content": "Simplemente increíble. FromSoftware ha superado todas las expectativas...",
      "helpful": 342,
      "createdAt": "2024-03-15T18:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1523,
    "totalPages": 153
  },
  "game": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Elden Ring",
    "slug": "elden-ring",
    "rating": 4.8,
    "ratingCount": 45231
  }
}
```

---

## 4. Filtros y Query Params

### Filtros para `GET /api/games`

| Parámetro | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `page` | `integer` | `page=2` | Número de página (default: 1) |
| `pageSize` | `integer` | `pageSize=30` | Resultados por página (default: 20, max: 100) |
| `genre` | `string \| string[]` | `genre=rpg` o `genre=rpg,action` | Filtrar por género(s) (OR) |
| `platform` | `string \| string[]` | `platform=pc` o `platform=pc,ps5` | Filtrar por plataforma(s) (OR) |
| `minPrice` | `number` | `minPrice=10` | Precio mínimo |
| `maxPrice` | `number` | `maxPrice=60` | Precio máximo (incluye descuento aplicado) |
| `onSale` | `boolean` | `onSale=true` | Solo juegos con descuento activo |
| `rating` | `number` | `rating=4` | Valoración mínima (0–5) |
| `sort` | `enum` | `sort=price_asc` | Ordenamiento (ver tabla abajo) |
| `search` | `string` | `search=elden` | Búsqueda textual (alternativa a endpoint dedicado) |
| `tags` | `string \| string[]` | `tags=souls-like,open-world` | Filtrar por tags (AND) |
| `featured` | `boolean` | `featured=true` | Solo destacados |

### Valores de `sort`

| Valor | Orden |
|---|---|
| `price_asc` | Precio menor a mayor |
| `price_desc` | Precio mayor a menor |
| `rating` | Valoración descendente |
| `newest` | Fecha de lanzamiento descendente |
| `oldest` | Fecha de lanzamiento ascendente |
| `name` | Alfabético A–Z |
| `name_desc` | Alfabético Z–A |
| `popular` | Más valorados (por ratingCount) |

### Implementación de filtros

```ts
// src/db/queries.ts — extractor de filtros
export interface GamesFilter {
  page: number;
  pageSize: number;
  genres?: string[];
  platforms?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  minRating?: number;
  sort: SortOption;
  search?: string;
  tags?: string[];
  featured?: boolean;
}

export function extractGamesFilter(searchParams: URLSearchParams): GamesFilter {
  return {
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    pageSize: Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20)),
    genres: searchParams.get('genre')?.split(',').filter(Boolean),
    platforms: searchParams.get('platform')?.split(',').filter(Boolean),
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    onSale: searchParams.has('onSale') ? searchParams.get('onSale') === 'true' : undefined,
    minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    sort: (searchParams.get('sort') as SortOption) || 'popular',
    search: searchParams.get('search') || undefined,
    tags: searchParams.get('tags')?.split(',').filter(Boolean),
    featured: searchParams.has('featured') ? searchParams.get('featured') === 'true' : undefined,
  };
}

// Construcción dinámica de la consulta SQL
export async function getGames(filter: GamesFilter) {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filter.genres?.length) {
    conditions.push(`genres && $${paramIndex++}::text[]`);
    params.push(filter.genres);
  }
  if (filter.platforms?.length) {
    conditions.push(`platforms && $${paramIndex++}::text[]`);
    params.push(filter.platforms);
  }
  if (filter.minPrice !== undefined) {
    conditions.push(`(price * (1 - discount::decimal / 100)) >= $${paramIndex++}`);
    params.push(filter.minPrice);
  }
  if (filter.maxPrice !== undefined) {
    conditions.push(`(price * (1 - discount::decimal / 100)) <= $${paramIndex++}`);
    params.push(filter.maxPrice);
  }
  if (filter.onSale === true) {
    conditions.push('discount > 0');
  }
  if (filter.minRating !== undefined) {
    conditions.push(`rating >= $${paramIndex++}`);
    params.push(filter.minRating);
  }
  if (filter.search) {
    conditions.push(`title ILIKE $${paramIndex++}`);
    params.push(`%${filter.search}%`);
  }
  if (filter.tags?.length) {
    conditions.push(`tags @> $${paramIndex++}::text[]`);
    params.push(filter.tags);
  }
  if (filter.featured === true) {
    conditions.push('featured = true');
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const sortMap: Record<string, string> = {
    price_asc:  'final_price ASC',
    price_desc: 'final_price DESC',
    rating:     'rating DESC',
    newest:     'release_date DESC',
    oldest:     'release_date ASC',
    name:       'title ASC',
    name_desc:  'title DESC',
    popular:    'rating_count DESC',
  };

  const orderClause = sortMap[filter.sort] || 'rating_count DESC';

  const offset = (filter.page - 1) * filter.pageSize;

  const query = `
    WITH priced_games AS (
      SELECT *, (price * (1 - discount::decimal / 100)) AS final_price
      FROM games
      ${whereClause}
    )
    SELECT id, title, slug, price, discount, platforms, genres,
           rating, images->0->>'url' AS "coverImage",
           release_date::text AS "releaseDate",
           stock > 0 AS "inStock"
    FROM priced_games
    ORDER BY ${orderClause}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(filter.pageSize, offset);

  const { rows } = await sql.unsafe(query, params);

  const [{ count }] = await sql`
    SELECT COUNT(*)::int FROM games ${conditions.length > 0
      ? sql.unsafe(`WHERE ${conditions.join(' AND ')}`, params.slice(0, -2))
      : sql``
    }
  `;

  return {
    games: rows,
    total: count,
    page: filter.page,
    pageSize: filter.pageSize,
  };
}
```

### Ejemplos de uso

```bash
# Página 3 del catálogo, 10 juegos por página
GET /api/games?page=3&pageSize=10

# Juegos de acción y RPG para PC, ordenados por precio ascendente
GET /api/games?genre=action,rpg&platform=pc&sort=price_asc

# Juegos en oferta con valoración >= 4, precio entre 10 y 30
GET /api/games?onSale=true&rating=4&minPrice=10&maxPrice=30

# Juegos destacados del género shooter
GET /api/games?featured=true&genre=shooter

# Búsqueda + filtro de plataforma
GET /api/games?search=zelda&platform=switch
```

---

## 5. Integración con Base de Datos (PostgreSQL / Supabase)

### Conexión

```ts
// src/db/index.ts
import postgres from 'postgres';

const sql = postgres({
  host: import.meta.env.DB_HOST,
  port: Number(import.meta.env.DB_PORT) || 5432,
  database: import.meta.env.DB_NAME,
  username: import.meta.env.DB_USER,
  password: import.meta.env.DB_PASSWORD,
  ssl: import.meta.env.DB_SSL === 'true' ? 'require' : false,
  max: 10,                 // máximo de conexiones en pool
  idle_timeout: 30,        // segundos
  connect_timeout: 10,     // segundos
});

export default sql;
```

**Variables de entorno requeridas (`.env`):**

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=007_sama
DB_USER=postgres
DB_PASSWORD=secret
DB_SSL=false
```

### Capa de queries

```ts
// src/db/queries.ts
import sql from '@/db';

// --- Games ---

export async function getGames(filter: GamesFilter) { /* ver sección 4 */ }
export async function getGameBySlug(slug: string): Promise<Game | null> { /* ... */ }
export async function searchGames(query: string, opts: SearchOpts) { /* ver sección 3.3 */ }
export async function getNewReleases(limit: number) { /* ver sección 3.4 */ }
export async function getGameReviews(gameId: string, opts: ReviewOpts) { /* ... */ }

// --- Admin / CRUD ---

export async function createGame(data: CreateGameInput): Promise<Game> { /* ... */ }
export async function updateGame(id: string, data: UpdateGameInput): Promise<Game> { /* ... */ }
export async function deleteGame(id: string): Promise<void> { /* ... */ }
export async function updateStock(id: string, quantity: number): Promise<void> { /* ... */ }
```

### Seed de datos

```ts
// src/db/seed.ts
import sql from '@/db';

const sampleGames = [
  {
    title: 'Elden Ring',
    slug: 'elden-ring',
    description: 'Explora las Tierras Intermedias...',
    price: 59.99,
    discount: 20,
    platforms: ['pc', 'ps5', 'xbox-series-x'],
    genres: ['rpg', 'action'],
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    release_date: '2022-02-25',
    images: [
      { url: '/images/elden-ring/cover.jpg', alt: 'Cover', width: 1200, height: 1600, type: 'cover' },
    ],
    rating: 4.8,
    rating_count: 45231,
    stock: 500,
    featured: true,
    tags: ['open-world', 'souls-like', 'multiplayer'],
  },
  // ... más juegos
];

async function seed() {
  for (const game of sampleGames) {
    await sql`
      INSERT INTO games ${sql(game)}
      ON CONFLICT (slug) DO NOTHING
    `;
  }
  console.log('✅ Seed completado');
}

seed().catch(console.error);
```

### Supabase

Si se usa Supabase como hosting de PostgreSQL:

```ts
// src/db/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY
);

export default supabase;
```

```ts
// Ejemplo con Supabase client
import supabase from '@/db/supabase';

export async function getGamesWithSupabase(filter: GamesFilter) {
  let query = supabase
    .from('games')
    .select('*', { count: 'exact' });

  if (filter.genres?.length) {
    query = query.overlaps('genres', filter.genres);
  }
  if (filter.platforms?.length) {
    query = query.overlaps('platforms', filter.platforms);
  }
  if (filter.onSale) {
    query = query.gt('discount', 0);
  }
  // ... más filtros

  const { data, count, error } = await query
    .range((filter.page - 1) * filter.pageSize, filter.page * filter.pageSize - 1)
    .order('rating', { ascending: false });

  if (error) throw error;

  return { games: data, total: count ?? 0, page: filter.page, pageSize: filter.pageSize };
}
```

---

## 6. Caching y Revalidación

### Estrategia general

| Nivel | Mecanismo | TTL | Invalidez |
|---|---|---|---|
| **CDN (Vercel Edge)** | `Cache-Control` header | 60 s (catálogo) / 300 s (detalle) | Deploy o purge manual |
| **Server (Response)** | `Cache-Control: s-maxage` | 60 s | Tras escritura (revalidateTag) |
| **Base de datos** | Query cache interno de PostgreSQL | — | Por actualización de fila |
| **Client (fetch)** | `stale-while-revalidate` | 30 s / 300 s | Cache del navegador |

### Headers de caché por endpoint

```ts
function cacheHeaders(ttl: number = 60): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 5}`,
    'CDN-Cache-Control': `public, s-maxage=${ttl}`,
    'Surrogate-Control': `max-age=${ttl}`,
  };
}

// Uso:
export const GET: APIRoute = async () => {
  const games = await getGames(defaultFilter);
  return new Response(JSON.stringify({ data: games }), {
    status: 200,
    headers: cacheHeaders(60),  // 1 minuto en CDN
  });
};
```

| Endpoint | `s-maxage` | `stale-while-revalidate` | Notas |
|---|---|---|---|
| `GET /api/games` | 60 s | 300 s | El catálogo cambia con poca frecuencia |
| `GET /api/games/[slug]` | 300 s | 600 s | Detalle aún más estable |
| `GET /api/games/search` | 30 s | 120 s | Resultados de búsqueda |
| `GET /api/games/new-releases` | 120 s | 600 s | Cambia cuando hay nuevos lanzamientos |
| `GET /api/games/[slug]/reviews` | 60 s | 300 s | Reseñas pueden aparecer en cualquier momento |

### Revalidación tras escritura

Cuando un administrador actualiza un juego (desde el panel admin o API interna), se debe purgar la caché:

```ts
// src/lib/cache.ts
const CACHE_TAGS = {
  games: 'games',
  game: (slug: string) => `game:${slug}`,
  newReleases: 'new-releases',
  reviews: (slug: string) => `reviews:${slug}`,
};

export function revalidateCatalog(slug?: string) {
  // En Vercel:
  // await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
  //   method: 'PATCH',
  //   headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  //   body: JSON.stringify({ items: [{ operation: 'remove', key: slug ? `game:${slug}` : 'games' }] }),
  // });

  // O usando Astro actions (v6):
  // import { experimental_revalidate } from 'astro:actions';
  // await experimental_revalidate(`game:${slug}`);

  console.log(`🔄 Cache revalidated: ${slug ?? 'full catalog'}`);
}
```

### Caching en el cliente (fetch)

```ts
// src/lib/fetch.ts
export async function apiFetch<T>(url: string, ttl: number = 60): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    // next: { revalidate: ttl }, // si se usa Astro + fetch nativo
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

### Incremental Static Regeneration (ISR) con Astro v6

Para páginas SSG del catálogo que se benefician de revalidación:

```ts
// src/pages/games/[slug].astro — con ISR
export const prerender = 'auto'; // Astro v6: ISR automático

export async function getStaticPaths() {
  const games = await getCollection('games');
  return games.map((g) => ({
    params: { slug: g.data.slug },
    props: { game: g },
  }));
}
```

En `astro.config.mjs`:

```js
export default defineConfig({
  output: 'hybrid',
  experimental: {
    incremental: true,       // Habilita ISR
    staticLruSize: 500,      // Máximo de páginas cacheadas en memoria
  },
});
```

---

## 7. Documentación OpenAPI Simplificada

```yaml
openapi: 3.1.0
info:
  title: Catálogo 007-Sama API
  description: API REST del catálogo de videojuegos
  version: 1.0.0

servers:
  - url: https://007-sama.com/api
    description: Producción
  - url: http://localhost:4321/api
    description: Desarrollo

paths:
  /games:
    get:
      summary: Lista paginada del catálogo
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: pageSize
          in: query
          schema: { type: integer, default: 20, maximum: 100 }
        - name: genre
          in: query
          schema: { type: string }
          description: "Uno o varios géneros separados por coma (OR): `rpg,action`"
        - name: platform
          in: query
          schema: { type: string }
          description: "Una o varias plataformas separadas por coma (OR): `pc,ps5`"
        - name: minPrice
          in: query
          schema: { type: number, minimum: 0 }
        - name: maxPrice
          in: query
          schema: { type: number, minimum: 0 }
        - name: onSale
          in: query
          schema: { type: boolean }
        - name: rating
          in: query
          schema: { type: number, minimum: 0, maximum: 5 }
        - name: sort
          in: query
          schema:
            type: string
            enum: [price_asc, price_desc, rating, newest, oldest, name, name_desc, popular]
            default: popular
        - name: search
          in: query
          schema: { type: string }
        - name: featured
          in: query
          schema: { type: boolean }
      responses:
        '200':
          description: Lista de juegos (GameSummary[])
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/GameSummary'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /games/{slug}:
    get:
      summary: Detalle completo de un juego
      parameters:
        - name: slug
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Juego completo
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Game'
        '404':
          description: Juego no encontrado

  /games/search:
    get:
      summary: Búsqueda textual en el catálogo
      parameters:
        - name: q
          in: query
          required: true
          schema: { type: string, minLength: 2 }
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: pageSize
          in: query
          schema: { type: integer, default: 20, maximum: 50 }
      responses:
        '200':
          description: Resultados de búsqueda
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/GameSummary'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
                  query:
                    type: string
        '400':
          description: Query requerida (mín. 2 caracteres)

  /games/new-releases:
    get:
      summary: Nuevos lanzamientos (últimos 30 días + próximos)
      parameters:
        - name: limit
          in: query
          schema: { type: integer, default: 20, maximum: 50 }
      responses:
        '200':
          description: Lista de nuevos lanzamientos

  /games/{slug}/reviews:
    get:
      summary: Reseñas de un juego
      parameters:
        - name: slug
          in: path
          required: true
          schema: { type: string }
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: pageSize
          in: query
          schema: { type: integer, default: 10, maximum: 50 }
        - name: sort
          in: query
          schema:
            type: string
            enum: [recent, oldest, highest, lowest, helpful]
            default: recent
      responses:
        '200':
          description: Reseñas del juego

components:
  schemas:
    Game:
      type: object
      properties:
        id:           { type: string, format: uuid }
        title:        { type: string }
        slug:         { type: string }
        description:  { type: string }
        price:        { type: number, format: float }
        discount:     { type: integer, minimum: 0, maximum: 100 }
        finalPrice:   { type: number, format: float }
        onSale:       { type: boolean }
        platforms:    { type: array, items: { $ref: '#/components/schemas/Platform' } }
        genres:       { type: array, items: { $ref: '#/components/schemas/Genre' } }
        developer:    { type: string }
        publisher:    { type: string }
        releaseDate:  { type: string, format: date }
        images:       { type: array, items: { $ref: '#/components/schemas/GameImage' } }
        trailerUrl:   { type: string, nullable: true }
        requirements: { $ref: '#/components/schemas/SystemRequirements' }
        rating:       { type: number, format: float, minimum: 0, maximum: 5 }
        ratingCount:  { type: integer }
        stock:        { type: integer }
        featured:     { type: boolean }
        tags:         { type: array, items: { type: string } }

    GameSummary:
      type: object
      properties:
        id:          { type: string }
        title:       { type: string }
        slug:        { type: string }
        price:       { type: number }
        discount:    { type: integer }
        platforms:   { type: array, items: { $ref: '#/components/schemas/Platform' } }
        genres:      { type: array, items: { $ref: '#/components/schemas/Genre' } }
        rating:      { type: number }
        coverImage:  { type: string }
        releaseDate: { type: string, format: date }
        inStock:     { type: boolean }

    Pagination:
      type: object
      properties:
        page:       { type: integer }
        pageSize:   { type: integer }
        total:      { type: integer }
        totalPages: { type: integer }

    Platform:
      type: string
      enum: [pc, ps5, xbox-series-x, xbox-one, switch, ios, android]

    Genre:
      type: string
      enum: [action, adventure, rpg, strategy, simulation, sports, horror,
             shooter, puzzle, racing, fighting, platformer, mmo, indie]

    GameImage:
      type: object
      properties:
        url:    { type: string }
        alt:    { type: string }
        width:  { type: integer }
        height: { type: integer }
        type:   { type: string, enum: [cover, screenshot, artwork] }

    SystemRequirements:
      type: object
      properties:
        minimum:
          $ref: '#/components/schemas/RequirementsSet'
        recommended:
          $ref: '#/components/schemas/RequirementsSet'

    RequirementsSet:
      type: object
      properties:
        os:      { type: string }
        cpu:     { type: string }
        ram:     { type: string }
        gpu:     { type: string }
        storage: { type: string }

    GameReview:
      type: object
      properties:
        id:        { type: string }
        userName:  { type: string }
        rating:    { type: integer, minimum: 1, maximum: 5 }
        title:     { type: string }
        content:   { type: string }
        helpful:   { type: integer }
        createdAt: { type: string, format: date-time }
```

---

## 8. Consideraciones de Rendimiento

### Paginación

- Siempre usar `LIMIT` / `OFFSET` o keyset pagination (`WHERE id > $1`) para tablas grandes.
- El default de `pageSize` es **20**; máximo permitido: **100**.
- El header `X-Total-Count` puede incluirse como alternativa al objeto `pagination`.

### Proyección de campos

- `GET /api/games` devuelve `GameSummary` (campos ligeros, sin `description`, `requirements`, `images` completas).
- `GET /api/games/[slug]` devuelve `Game` completo (todos los campos).
- Para evitar N+1 en reviews, cargar el conteo agregado en la query de detalle.

### Rate limiting

Se recomienda implementar rate limiting por IP en Vercel Edge Middleware o mediante un servicio externo:

```ts
// src/middleware.ts — rate limiting básico
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/api/')) {
    const ip = context.request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);

    if (entry && entry.resetAt > now) {
      entry.count++;
      if (entry.count > 100) {
        return new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      }
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + 60000 });
    }
  }

  return next();
});
```

### Compresión

Los endpoints deben devolver contenido comprimido con gzip/brotli. Vercel lo maneja automáticamente. En desarrollo, Astro incluye compresión por defecto.

---

## Referencias

- [Arquitectura del Proyecto](./Architecture.md) — estructura general, Content Collections, flujo de datos
- [Routing del Proyecto](./Routing.md) — rutas de páginas, SSR vs SSG, middleware
- [Componentes UI](./Componentes.md) — GameCard, GameGrid, RatingStars, PriceTag
- [Esquema DB en Supabase](https://supabase.com/docs/guides/database)
- [Astro API Routes](https://docs.astro.build/en/guides/endpoints/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Tabla `games` SQL](#1-modelo-de-datos-videojuego) — esta documentación
