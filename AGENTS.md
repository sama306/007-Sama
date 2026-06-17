# 007-Sama — Video Game Store

Astro 6.x web app. Personal/portfolio project. **No real payments.**  
**Status:** Documentation complete. Source code is minimal (bare Astro starter).  
**Language convention:** docs in Spanish, source code in English.

---

## Commands

| Command | Action |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview production build locally |
| `pnpm astro <cmd>` | Astro CLI (`check`, `sync`, `add`, etc.) |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6.x, `output: 'hybrid'` (SSG default, SSR per-route) |
| Styling | Tailwind CSS (`@astrojs/tailwind`) |
| Interactivity | React (`@astrojs/react`) — only for interactive islands |
| Auth | Auth.js v6 via `auth-astro` + `@auth/core` |
| Database | PostgreSQL via `@astrojs/db` |
| Client state | Nano Stores (`nanostores`) |
| Validation | Zod (Content Collections + forms) |
| Search | Fuse.js (client-side) |
| Images | `astro:assets` + Sharp → WebP/AVIF |
| Deploy | Vercel (`@astrojs/vercel/serverless`) |
| Package manager | pnpm. Node >= 22.12.0 |

> **Note:** None of these integrations are installed yet. Install before using.

---

## Project Structure

```
src/
├── content/
│   ├── config.ts           # Zod schemas for Content Collections
│   └── games/              # One .md/.mdx file per game
├── components/
│   ├── ui/                 # Generic: Button, Card, Badge, Modal
│   ├── game/               # GameCard, GameGrid, GameDetails, RatingStars
│   ├── cart/               # CartDrawer, CartItem, CartCounter
│   ├── layout/             # Header, Footer, Sidebar, Breadcrumbs
│   └── auth/               # LoginForm, RegisterForm, AuthGuard
├── layouts/
│   ├── BaseLayout.astro    # Root layout: <html>, SEO, fonts
│   ├── GameLayout.astro    # Game detail pages
│   └── AdminLayout.astro   # Admin panel
├── pages/
│   ├── index.astro         # / — Home
│   ├── games/
│   │   ├── index.astro     # /games — full catalog with filters
│   │   ├── [slug].astro    # /games/[slug] — game detail (SSG)
│   │   ├── genre/[genre].astro
│   │   └── platform/[platform].astro
│   ├── news/
│   │   ├── index.astro     # /news
│   │   └── [slug].astro    # /news/[slug] (SSG)
│   ├── new-releases.astro  # /new-releases
│   ├── account/            # /account/* — all SSR, auth required
│   │   ├── index.astro
│   │   ├── orders.astro
│   │   └── wishlist.astro
│   ├── auth/
│   │   ├── login.astro
│   │   ├── register.astro
│   │   └── logout.astro
│   ├── cart/index.astro    # /cart — SSG + client state
│   ├── search.astro        # /search?q=
│   ├── 404.astro
│   └── api/
│       ├── cart.ts         # POST/GET/DELETE /api/cart
│       ├── auth.ts         # POST /api/auth/*
│       └── search.ts       # GET /api/search?q=
├── db/
│   ├── schema.ts           # Drizzle / Astro DB table schemas
│   ├── queries.ts          # Reusable queries
│   └── seed.ts             # Seed script
├── lib/
│   ├── constants.ts
│   ├── format.ts           # Price and date formatters
│   ├── search.ts           # Fuse.js search logic
│   ├── cart.ts             # Cart CRUD (server-side)
│   └── auth.ts             # Session/cookie helpers
├── stores/
│   ├── cartStore.ts        # Cart state (Nano Stores)
│   ├── authStore.ts        # Session state
│   └── uiStore.ts          # UI state (sidebar, theme)
├── types/
│   ├── game.ts             # Game, Genre, Platform
│   ├── user.ts             # User, Session
│   └── cart.ts             # CartItem, CartSummary
└── styles/
    ├── global.css
    └── tokens.css          # CSS design tokens
```

Alias `@/` → `src/` (configured in `tsconfig.json`).

---

## Routing Rules

- **SSG (default):** public pages — `/`, `/games`, `/games/[slug]`, `/news`, `/new-releases`
- **SSR:** protected or dynamic — `/account/*`, `/checkout`, `/api/*`, `/auth/*`
- Mark SSR routes with `export const prerender = false`
- `getStaticPaths()` for dynamic SSG routes (`[slug]`, `[genre]`, `[platform]`)

### Full Route Map

| Route | Strategy | Auth required |
|---|---|---|
| `/` | SSG | No |
| `/games` | SSG | No |
| `/games/[slug]` | SSG `getStaticPaths` | No |
| `/games/genre/[genre]` | SSG `getStaticPaths` | No |
| `/games/platform/[platform]` | SSG `getStaticPaths` | No |
| `/new-releases` | SSG | No |
| `/news` | SSG | No |
| `/news/[slug]` | SSG `getStaticPaths` | No |
| `/cart` | SSG + client | No |
| `/search` | SSG + client | No |
| `/account/*` | SSR | Yes |
| `/checkout` | SSR | Yes |
| `/auth/*` | SSR | No |
| `/api/*` | SSR | Varies |

---

## Authentication

- **Provider:** Auth.js v6 (`auth-astro`) with JWT strategy
- **OAuth providers:** Google, Discord, Steam
- **Session:** httpOnly cookie with JWT. Fields: `id`, `name`, `email`, `role`
- **Middleware:** `src/middleware.ts` — validates session on protected routes, populates `Astro.locals.user`
- **Protected routes prefix:** `/account`, `/checkout`, `/api/cart`
- On missing/invalid session → redirect to `/auth/login?redirect=<original-path>`

```ts
// Astro.locals types (src/env.d.ts)
declare namespace App {
  interface Locals {
    session: Session | null;
    user: { id: string; name: string; email: string; role: Role } | null;
  }
}
```

---

## Roles & Permissions (RBAC)

5 roles with ascending hierarchy. Each role inherits permissions from roles below it.

| Role | Level | Description |
|---|---|---|
| `guest` | 0 | Unauthenticated — public browsing only |
| `user` | 1 | Authenticated with verified email |
| `premium` | 2 | Active subscription |
| `editor` | 3 | Content staff — manages catalog, reviews, news |
| `admin` | 4 | Full access |

```ts
// src/lib/auth/roles.ts
export const ROLES = { GUEST: 'guest', USER: 'user', PREMIUM: 'premium', EDITOR: 'editor', ADMIN: 'admin' } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ROLE_HIERARCHY: Record<Role, number> = { guest: 0, user: 1, premium: 2, editor: 3, admin: 4 };
export const hasRole = (userRole: Role, required: Role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
```

Use `AuthGuard` component to conditionally render by role. Use `hasRole()` in middleware/endpoints.

---

## Content Collections — Games

```ts
// src/content/config.ts
const gamesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    slug:        z.string(),
    description: z.string().max(280),
    price:       z.number().positive(),
    discount:    z.number().min(0).max(100).default(0),
    platform:    z.array(z.enum(['pc', 'ps5', 'xbox-series-x', 'switch'])),
    genre:       z.enum(['action', 'rpg', 'strategy', 'adventure', 'simulation', 'sports', 'horror']),
    developer:   z.string(),
    publisher:   z.string().optional(),
    releaseDate: z.date(),
    images:      z.array(z.string().url()),
    trailerUrl:  z.string().url().optional(),
    rating:      z.number().min(0).max(5).default(0),
    featured:    z.boolean().default(false),
    tags:        z.array(z.string()).default([]),
    status:      z.enum(['published', 'draft']).default('published'),
  }),
});
```

Fetch example:
```ts
const games = await getCollection('games', ({ data }) => data.status === 'published');
const newReleases = await getCollection('games', ({ data }) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return data.releaseDate >= thirtyDaysAgo;
});
```

---

## Content Collections — News

```ts
const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    slug:        z.string(),
    date:        z.date(),
    author:      z.string(),
    category:    z.enum(['release', 'update', 'review', 'event', 'community']),
    image:       z.string().url(),
    excerpt:     z.string().max(200),
    tags:        z.array(z.string()).default([]),
    relatedGames: z.array(z.string()).default([]),
    status:      z.enum(['published', 'draft']).default('published'),
  }),
});
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/games` | No | List games with filters |
| GET | `/api/games/[slug]` | No | Single game |
| GET | `/api/games/search?q=` | No | Search games |
| GET | `/api/games/new-releases` | No | Last 30 days + upcoming |
| GET | `/api/cart` | Yes | Get current cart |
| POST | `/api/cart` | Yes | Add item to cart |
| PUT | `/api/cart` | Yes | Update quantity |
| DELETE | `/api/cart` | Yes | Remove item |

Available query params for `/api/games`: `genre`, `platform`, `minPrice`, `maxPrice`, `rating`, `featured`, `sort` (`price_asc`, `price_desc`, `rating`, `release_date`), `page`, `limit`.

---

## Key Conventions

- **No payments:** This is a portfolio project. Cart and checkout are visual/simulated only.
- **Component hydration:** Use `client:load` for above-the-fold interactive (cart counter, login). Use `client:visible` for below-the-fold (filters, review form).
- **Images:** Always use `<Image>` from `astro:assets`, never raw `<img>` tags.
- **SSR pages:** Must have `export const prerender = false` at the top.
- **Protected pages:** Check `Astro.locals.user` — redirect if null.
- **TypeScript:** Strict mode. All types in `src/types/`. Use `@/` alias everywhere.
- **Naming:** Components in PascalCase. Utilities/stores in camelCase. Routes in kebab-case.

---

## Gotchas

- Run `pnpm astro sync` to regenerate `.astro/types.d.ts` after changing Content Collections.
- `dist/` and `.astro/` are gitignored — never commit them.
- No integrations are installed yet. Run `pnpm astro add <integration>` before importing.
- Content Collections use build-time data. For runtime DB queries, use `@astrojs/db` in SSR routes.
- Cart state is client-only (Nano Stores + localStorage) for non-authenticated users; syncs to DB on login.
