# Sistema de Roles y Permisos — 007-Sama (Tienda de Videojuegos)

> **Estrategia:** RBAC (Role-Based Access Control) con granularidad plana  
> **Persistencia:** Columna `role` en tabla `users` + claims en JWT  
> **Framework:** Auth.js v6 (vía `auth-astro`) + Astro 6.x  
> **Idioma:** Español (código fuente en inglés)

---

## Índice

1. [Roles del Sistema](#1-roles-del-sistema)
2. [Matriz de Permisos](#2-matriz-de-permisos)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Claims en JWT](#4-claims-en-jwt)
5. [Guardias de Ruta (Middleware)](#5-guardias-de-ruta-middleware)
6. [Componente AuthGuard para Condicionales](#6-componente-authguard-para-condicionales)
7. [Uso en Páginas Astro](#7-uso-en-páginas-astro)
8. [Panel de Administración](#8-panel-de-administración)
9. [Casos Límite](#9-casos-límite)
10. [Apéndice: Checklist de Implementación](#10-apéndice-checklist-de-implementación)

---

## 1. Roles del Sistema

Se definen **5 roles** con una jerarquía de privilegios ascendente. Cada rol hereda los permisos del rol inmediatamente inferior.

| Rol | Jerarquía | Descripción | Público objetivo |
|---|---|---|---|
| `guest` | 0 | Usuario no autenticado. Solo navegación pública. | Visitantes |
| `user` | 1 | Usuario autenticado con email verificado. | Clientes registrados |
| `premium` | 2 | Usuario con suscripción activa. | Clientes recurrrentes |
| `editor` | 3 | Personal de contenido. Gestiona catálogo, reseñas, noticias. | Staff editorial |
| `admin` | 4 | Acceso total al sistema. Gestiona usuarios, roles, configuración. | Equipo técnico |

### 1.1 Definición de tipo

```ts
// src/lib/auth/roles.ts
export const ROLES = {
  GUEST: 'guest',
  USER: 'user',
  PREMIUM: 'premium',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.GUEST]: 0,
  [ROLES.USER]: 1,
  [ROLES.PREMIUM]: 2,
  [ROLES.EDITOR]: 3,
  [ROLES.ADMIN]: 4,
};

/**
 * Verifica si un rol tiene al menos el nivel requerido.
 * Ej: roleAtLeast('premium', 'user') → true
 *     roleAtLeast('user', 'editor') → false
 */
export function roleAtLeast(userRole: Role | null, requiredRole: Role): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? -1;
  return userLevel >= requiredLevel;
}

/**
 * Verifica si un rol cumple exactamente con el requerido (sin herencia).
 */
export function roleExactly(userRole: Role | null, requiredRole: Role): boolean {
  return userRole === requiredRole;
}
```

---

## 2. Matriz de Permisos

| Permiso | `guest` | `user` | `premium` | `editor` | `admin` |
|---|---|---|---|---|---|
| **Navegación pública** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ver catálogo + detalles** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Buscar juegos** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ver noticias** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Crear cuenta / login** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Agregar al carrito** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Comprar juegos** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Ver historial de pedidos** | ❌ | ✅ (propios) | ✅ (propios) | ✅ (propios) | ✅ (todos) |
| **Escribir reseñas** | ❌ | ✅ (1 c/u) | ✅ (1 c/u) | ✅ | ✅ |
| **Valorar reseñas (likes)** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Acceso a listas de deseados** | ❌ | ✅ (1 lista) | ✅ (3 listas) | ✅ (ilimitado) | ✅ (ilimitado) |
| **Descuentos exclusivos** | ❌ | ❌ | ✅ (5 %) | ✅ (10 %) | ✅ (10 %) |
| **Acceso anticipado a lanzamientos** | ❌ | ❌ | ✅ (48 h) | ✅ (staff) | ✅ (staff) |
| **Contenido bloqueado (detalles extendidos, análisis técnicos)** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Ver whishlist de usuarios** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Gestionar catálogo (CRUD juegos)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Gestionar noticias** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Moderar reseñas** | ❌ | ❌ | ❌ | ✅ (reportadas) | ✅ (todas) |
| **Gestionar cupones / descuentos** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Panel de administración** | ❌ | ❌ | ❌ | ✅ (limitado) | ✅ (completo) |
| **Gestionar usuarios** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Cambiar roles de usuario** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Banear / desbanear usuarios** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Ver logs del sistema** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Configurar sistema (pagos, envíos, SEO)** | ❌ | ❌ | ❌ | ❌ | ✅ |

### 2.1 Permisos granularizados (opcional)

Para casos que requieran control más fino sin cambiar el rol, se puede extender con permisos planos:

```ts
// src/lib/auth/permissions.ts
export const PERMISSIONS = {
  GAME_CREATE: 'game:create',
  GAME_EDIT: 'game:edit',
  GAME_DELETE: 'game:delete',
  NEWS_CREATE: 'news:create',
  NEWS_EDIT: 'news:edit',
  NEWS_DELETE: 'news:delete',
  REVIEW_MODERATE: 'review:moderate',
  USER_MANAGE: 'user:manage',
  USER_BAN: 'user:ban',
  ORDER_VIEW_ALL: 'order:view_all',
  COUPON_MANAGE: 'coupon:manage',
  CONFIG_EDIT: 'config:edit',
  LOGS_VIEW: 'logs:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Mapeo rol → permisos explícitos
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: [],
  user: [],
  premium: [],
  editor: [
    PERMISSIONS.GAME_CREATE,
    PERMISSIONS.GAME_EDIT,
    PERMISSIONS.GAME_DELETE,
    PERMISSIONS.NEWS_CREATE,
    PERMISSIONS.NEWS_EDIT,
    PERMISSIONS.NEWS_DELETE,
    PERMISSIONS.REVIEW_MODERATE,
    PERMISSIONS.COUPON_MANAGE,
    PERMISSIONS.ORDER_VIEW_ALL,
  ],
  admin: Object.values(PERMISSIONS),
};

export function hasPermission(userRole: Role | null, permission: Permission): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}
```

---

## 3. Modelo de Datos

### 3.1 Esquema Drizzle (extensión del esquema base)

Se reemplaza el campo `role: text` simple por un `role` tipado con check constraint y se agregan campos de estado:

```ts
// src/db/schema.ts
import { pgTable, text, timestamp, boolean, integer, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  tokenVersion: integer('token_version').notNull().default(0),
  role: text('role', { enum: ['guest', 'user', 'premium', 'editor', 'admin'] })
    .notNull()
    .default('user'),
  isBanned: boolean('is_banned').notNull().default(false),
  bannedAt: timestamp('banned_at', { mode: 'date' }),
  banReason: text('ban_reason'),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { mode: 'date' }), // para premium
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});
```

> **Nota:** Aunque el tipo `{ enum: [...] }` de Drizzle no impone un check real en PostgreSQL, se recomienda agregar una migración con:
> ```sql
> ALTER TABLE users ADD CONSTRAINT users_role_check
>   CHECK (role IN ('guest', 'user', 'premium', 'editor', 'admin'));
> ```

### 3.2 Helper de consulta

```ts
// src/lib/auth/roles.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserRole(userId: string): Promise<Role | null> {
  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0]?.role ?? null;
}
```

---

## 4. Claims en JWT

### 4.1 Configuración de Auth.js

```ts
// src/auth.ts
import { defineConfig } from 'auth-astro';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import Discord from '@auth/core/providers/discord';
import Steam from '@auth/core/providers/steam';
import type { Role } from '@/lib/auth/roles';

export default defineConfig({
  providers: [Credentials, Google, Discord, Steam],
  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Al iniciar sesión, propagar datos del usuario al token
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.isBanned = user.isBanned as boolean;
        token.emailVerified = user.emailVerified;
        token.tokenVersion = user.tokenVersion as number;
      }

      // Refrescar datos si se actualizó el perfil
      if (trigger === 'update') {
        const freshUser = await db
          .select({
            role: users.role,
            isBanned: users.isBanned,
            emailVerified: users.emailVerified,
            tokenVersion: users.tokenVersion,
          })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (freshUser[0]) {
          token.role = freshUser[0].role;
          token.isBanned = freshUser[0].isBanned;
          token.emailVerified = freshUser[0].emailVerified;
          token.tokenVersion = freshUser[0].tokenVersion;
        }
      }

      // Revocar sesión si tokenVersion cambió (cambio de role / contraseña)
      const dbUser = await db
        .select({ tokenVersion: users.tokenVersion })
        .from(users)
        .where(eq(users.id, token.id as string))
        .limit(1);

      if (dbUser[0] && dbUser[0].tokenVersion !== token.tokenVersion) {
        return null; // Invalida el token → fuerza re-login
      }

      return token;
    },

    async session({ session, token }) {
      // Propagar claims del token a la sesión
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.isBanned = token.isBanned as boolean;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },

    async signIn({ user, account }) {
      // Bloquear login si el usuario está baneado
      if (user.isBanned) {
        return '/auth/error?error=BannedAccount';
      }
      return true;
    },
  },
});
```

### 4.2 Declaración de tipos de sesión

```ts
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { Role } from '@/lib/auth/roles';

declare namespace App {
  interface Locals {
    session: import('@auth/core/types').Session | null;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: Role;
      isBanned: boolean;
      emailVerified: Date | null;
    } | null;
  }
}

// Extender tipos de Auth.js
declare module '@auth/core/types' {
  interface User {
    role: Role;
    isBanned: boolean;
    emailVerified: Date | null;
    tokenVersion: number;
  }

  interface Session {
    user: User;
  }
}
```

### 4.3 Estructura del JWT (decodificado)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Carlos López",
  "email": "carlos@example.com",
  "role": "editor",
  "isBanned": false,
  "emailVerified": "2026-05-15T10:30:00Z",
  "tokenVersion": 3,
  "iat": 1749600000,
  "exp": 1752192000
}
```

---

## 5. Guardias de Ruta (Middleware)

### 5.1 Middleware completo con verificación de roles

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware';
import { getSession } from '@/lib/auth';
import { roleAtLeast, type Role } from '@/lib/auth/roles';

// ─── Definición de rutas protegidas por rol ─────────────
interface RouteGuard {
  pattern: string;
  requiredRole: Role;
  redirect?: string;
}

const routeGuards: RouteGuard[] = [
  // Rutas de usuario autenticado (cualquier rol ≥ user)
  { pattern: '/account', requiredRole: 'user', redirect: '/auth/login' },
  { pattern: '/cart', requiredRole: 'user', redirect: '/auth/login' },
  { pattern: '/checkout', requiredRole: 'user', redirect: '/auth/login' },
  { pattern: '/wishlist', requiredRole: 'user', redirect: '/auth/login' },
  { pattern: '/orders', requiredRole: 'user', redirect: '/auth/login' },

  // Rutas de contenido exclusivo premium
  { pattern: '/premium', requiredRole: 'premium', redirect: '/upgrade' },
  { pattern: '/analytics', requiredRole: 'premium', redirect: '/upgrade' },
  { pattern: '/early-access', requiredRole: 'premium', redirect: '/upgrade' },

  // Rutas de editor
  { pattern: '/editor', requiredRole: 'editor', redirect: '/auth/login' },
  { pattern: '/admin/games', requiredRole: 'editor', redirect: '/auth/login' },
  { pattern: '/admin/news', requiredRole: 'editor', redirect: '/auth/login' },
  { pattern: '/admin/reviews', requiredRole: 'editor', redirect: '/auth/login' },
  { pattern: '/admin/coupons', requiredRole: 'editor', redirect: '/auth/login' },

  // Rutas de administrador
  { pattern: '/admin/users', requiredRole: 'admin', redirect: '/auth/login' },
  { pattern: '/admin/settings', requiredRole: 'admin', redirect: '/auth/login' },
  { pattern: '/admin/logs', requiredRole: 'admin', redirect: '/auth/login' },
];
```

### 5.2 Handler principal

```ts
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, locals } = context;
  const pathname = url.pathname;

  // Inicializar locals
  locals.session = null;
  locals.user = null;

  // Intentar obtener sesión
  try {
    const session = await getSession(context.request);
    if (session?.user) {
      locals.session = session;
      locals.user = {
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        role: session.user.role,
        isBanned: session.user.isBanned,
        emailVerified: session.user.emailVerified,
      };
    }
  } catch (error) {
    console.error('Session error:', error);
  }

  // ─── Verificaciones de estado del usuario ─────────────
  if (locals.user) {
    // Usuario baneado — denegar acceso a TODO (excepto logout)
    if (locals.user.isBanned && pathname !== '/api/auth/signout') {
      return redirect('/auth/error?error=BannedAccount');
    }

    // Email no verificado — permitir solo rutas de verificación
    if (
      !locals.user.emailVerified &&
      pathname !== '/auth/verify-email' &&
      pathname !== '/api/auth/signout' &&
      !pathname.startsWith('/api/auth')
    ) {
      return redirect('/auth/verify-email');
    }
  }

  // ─── Verificaciones de rutas públicas de auth ─────────
  const authRoutes = ['/auth/login', '/auth/register', '/auth/reset-password'];
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  if (isAuthRoute && locals.session) {
    return redirect('/account');
  }

  // ─── Verificaciones de rol por ruta ───────────────────
  for (const guard of routeGuards) {
    const matches =
      pathname === guard.pattern ||
      pathname.startsWith(guard.pattern + '/');

    if (matches) {
      // Sin sesión → redirigir
      if (!locals.user) {
        const redirectUrl = guard.redirect ?? '/auth/login';
        return redirect(`${redirectUrl}?redirect=${encodeURIComponent(pathname)}`);
      }

      // Rol insuficiente
      if (!roleAtLeast(locals.user.role, guard.requiredRole)) {
        // Si es admin o editor accediendo a ruta user, permitir
        // (la herencia ya lo cubre en roleAtLeast)
        // Pero si es user accediendo a ruta premium:
        if (guard.requiredRole === 'premium' && locals.user.role === 'user') {
          return redirect('/upgrade?redirect=' + encodeURIComponent(pathname));
        }

        // Para editor/admin routes con rol insuficiente
        return redirect('/auth/error?error=Forbidden');
      }

      break; // Primera coincidencia gana
    }
  }

  return next();
});
```

### 5.3 Modo desarrollo: depuración de roles

```ts
// Desactivar checks de rol en desarrollo si es necesario
const isDev = import.meta.env.DEV;

if (isDev && locals.user) {
  // Exponer role en consola para depuración
  console.info(`[Auth] ${locals.user.email} → role: ${locals.user.role}`);
}

// En desarrollo, permitir simular roles
if (isDev && url.searchParams.has('_role')) {
  const simulatedRole = url.searchParams.get('_role') as Role;
  if (locals.user && Object.values(ROLES).includes(simulatedRole)) {
    locals.user.role = simulatedRole;
    console.info(`[Dev] Role simulado: ${simulatedRole}`);
  }
}
```

---

## 6. Componente AuthGuard para Condicionales

### 6.1 AuthGuard con soporte de roles

```astro
---
// src/components/auth/AuthGuard.astro
import type { Role } from '@/lib/auth/roles';
import { roleAtLeast } from '@/lib/auth/roles';

export interface Props {
  user: {
    role: Role;
    isBanned: boolean;
    emailVerified: Date | null;
  } | null;
  /** Rol mínimo requerido para mostrar el contenido */
  requiredRole?: Role;
  /** URL de redirect si no cumple (opcional, por defecto muestra fallback) */
  redirectTo?: string;
  /** Mensaje de fallback sin sesión */
  loginMessage?: string;
  /** Mensaje de fallback por rol insuficiente */
  forbiddenMessage?: string;
}

const {
  user,
  requiredRole = 'user',
  redirectTo,
  loginMessage = 'Inicia sesión para acceder a esta sección.',
  forbiddenMessage = 'No tienes permisos para acceder a esta sección.',
} = Astro.props;

const canAccess = user && !user.isBanned && user.emailVerified
  ? roleAtLeast(user.role, requiredRole)
  : false;

const needsLogin = !user;
const needsUpgrade = user && !roleAtLeast(user.role, requiredRole);
---

{
  canAccess ? (
    <slot />
  ) : redirectTo ? (
    <meta http-equiv="refresh" content={`0;url=${redirectTo}`} />
  ) : (
    <div class="auth-guard" role="alert">
      {needsLogin && (
        <>
          <p>{loginMessage}</p>
          <a href="/auth/login">Iniciar sesión</a>
        </>
      )}
      {needsUpgrade && (
        <>
          <p>{forbiddenMessage}</p>
          {requiredRole === 'premium' && (
            <a href="/upgrade">Ver planes premium</a>
          )}
          {(requiredRole === 'editor' || requiredRole === 'admin') && (
            <a href="/contact">Contactar al administrador</a>
          )}
        </>
      )}
    </div>
  )
}
```

### 6.2 Ejemplos de uso

```astro
---
// src/pages/account/orders.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import OrderList from '@/components/orders/OrderList.astro';

export const prerender = false;

const user = Astro.locals.user;
---

<BaseLayout title="Mis pedidos | 007-Sama">
  <AuthGuard {user} requiredRole="user">
    <h1>Mis pedidos</h1>
    <OrderList userId={user!.id} />
  </AuthGuard>
</BaseLayout>
```

```astro
---
// src/pages/admin/games/index.astro
import AdminLayout from '@/layouts/AdminLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import GameManager from '@/components/admin/GameManager.astro';

export const prerender = false;

const user = Astro.locals.user;
---

<AdminLayout title="Gestionar juegos | Admin">
  <AuthGuard {user} requiredRole="editor">
    <GameManager />
  </AuthGuard>
</AdminLayout>
```

### 6.3 Botón condicional "Admin Panel"

```astro
---
// src/components/layout/Header.astro
import type { Role } from '@/lib/auth/roles';
import { roleAtLeast } from '@/lib/auth/roles';

export interface Props {
  user: { role: Role; isBanned: boolean; emailVerified: Date | null } | null;
}

const { user } = Astro.props;
const hasAccessToAdmin = user
  ? roleAtLeast(user.role, 'editor')
  : false;
const isUserLoggedIn = user && !user.isBanned;
---

<header>
  <nav>
    <a href="/">Inicio</a>
    <a href="/games">Catálogo</a>
    <a href="/news">Noticias</a>

    {isUserLoggedIn && (
      <>
        <a href="/account">Mi cuenta</a>
        <a href="/wishlist">Lista de deseados</a>
      </>
    )}

    {hasAccessToAdmin && (
      <a href="/admin" class="admin-link">
        Panel Admin
      </a>
    )}

    {user ? (
      <a href="/api/auth/signout">Cerrar sesión</a>
    ) : (
      <a href="/auth/login">Iniciar sesión</a>
    )}
  </nav>
</header>
```

### 6.4 Componente Reactivo (con nanostores)

Para componentes interactivos del lado del cliente:

```tsx
// src/components/auth/AdminButton.tsx
import { useSession } from '@/lib/auth/client'; // stub: sesión desde cookie
import { roleAtLeast } from '@/lib/auth/roles';

export function AdminButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  const userRole = session?.user?.role ?? null;
  const canAccess = roleAtLeast(userRole, 'editor');

  if (!canAccess) return null;

  return (
    <a href="/admin" className="btn-admin">
      Panel Admin
    </a>
  );
}
```

---

## 7. Uso en Páginas Astro

### 7.1 Página de perfil con secciones condicionales

```astro
---
// src/pages/account/index.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import type { Role } from '@/lib/auth/roles';
import { roleAtLeast } from '@/lib/auth/roles';

export const prerender = false;

const user = Astro.locals.user;
---

<BaseLayout title="Mi cuenta | 007-Sama">
  <AuthGuard {user} requiredRole="user">
    <h1>Bienvenido, {user!.name}</h1>

    <!-- Sección visible para todos los usuarios autenticados -->
    <section>
      <h2>Mis pedidos recientes</h2>
      <!-- ... -->
    </section>

    <!-- Sección visible solo para premium+ -->
    {roleAtLeast(user!.role, 'premium') && (
      <section class="premium-benefits">
        <h2>Beneficios Premium</h2>
        <p>Descuento exclusivo: {user!.role === 'premium' ? '5 %' : '10 %'}</p>
        <a href="/early-access">Acceso anticipado</a>
      </section>
    )}

    <!-- Sección visible solo para editor+ -->
    {roleAtLeast(user!.role, 'editor') && (
      <section class="quick-admin">
        <a href="/admin/games">➕ Añadir juego</a>
        <a href="/admin/news">📰 Nueva noticia</a>
      </section>
    )}

    <!-- Sección visible solo para admin -->
    {user!.role === 'admin' && (
      <section class="admin-summary">
        <h2>Resumen del sistema</h2>
        <!-- Stats, logs, etc -->
      </section>
    )}
  </AuthGuard>
</BaseLayout>
```

### 7.2 Server island con control de rol

```astro
---
// src/pages/games/[slug].astro
import PurchaseButton from '@/components/game/PurchaseButton.astro';

export const prerender = false;

const user = Astro.locals.user;
const canPurchase = user && !user.isBanned && user.emailVerified;
---

<article>
  <!-- ... contenido del juego ... -->

  {canPurchase ? (
    <PurchaseButton client:load userId={user!.id} />
  ) : user ? (
    <p>Verifica tu email antes de comprar.</p>
  ) : (
    <a href="/auth/login">Inicia sesión para comprar</a>
  )}
</article>
```

---

## 8. Panel de Administración

### 8.1 Layout de administración

```astro
---
// src/layouts/AdminLayout.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import type { Role } from '@/lib/auth/roles';
import { roleAtLeast } from '@/lib/auth/roles';

export interface Props {
  title: string;
  user: { role: Role; isBanned: boolean; emailVerified: Date | null } | null;
}

const { title, user } = Astro.props;
const isAdmin = user?.role === 'admin';
---

<AuthGuard {user} requiredRole="editor">
  <BaseLayout title={title}>
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <h2>Administración</h2>
        <nav>
          <a href="/admin">Dashboard</a>

          {roleAtLeast(user!.role, 'editor') && (
            <>
              <h3>Contenido</h3>
              <a href="/admin/games">Juegos</a>
              <a href="/admin/news">Noticias</a>
              <a href="/admin/reviews">Reseñas</a>
              <a href="/admin/coupons">Cupones</a>
            </>
          )}

          {isAdmin && (
            <>
              <h3>Sistema</h3>
              <a href="/admin/users">Usuarios</a>
              <a href="/admin/settings">Configuración</a>
              <a href="/admin/logs">Logs</a>
              <a href="/admin/system">Sistema</a>
            </>
          )}
        </nav>
      </aside>
      <main class="admin-content">
        <slot />
      </main>
    </div>
  </BaseLayout>
</AuthGuard>
```

### 8.2 Página de gestión de usuarios (admin)

```astro
---
// src/pages/admin/users.astro
import AdminLayout from '@/layouts/AdminLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import { db } from '@/db';
import { users } from '@/db/schema';

export const prerender = false;

const user = Astro.locals.user;
---

<AuthGuard {user} requiredRole="admin">
  <AdminLayout title="Usuarios | Admin" {user}>
    <h1>Gestión de Usuarios</h1>

    <table class="users-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Verificado</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr>
            <td>{u.name}</td>
            <td>{u.email}</td>
            <td>
              <span class={`badge badge--${u.role}`}>{u.role}</span>
            </td>
            <td>{u.emailVerified ? '✅' : '❌'}</td>
            <td>{u.isBanned ? '🚫 Baneado' : '✅ Activo'}</td>
            <td>
              <a href={`/admin/users/${u.id}`}>Editar</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </AdminLayout>
</AuthGuard>
```

### 8.3 Formulario de cambio de rol (admin)

```astro
---
// src/pages/admin/users/[id].astro
import AdminLayout from '@/layouts/AdminLayout.astro';
import AuthGuard from '@/components/auth/AuthGuard.astro';
import { ROLES, type Role } from '@/lib/auth/roles';

export const prerender = false;

const user = Astro.locals.user;
const targetUserId = Astro.params.id;
---

<AuthGuard {user} requiredRole="admin">
  <AdminLayout title="Editar usuario | Admin" {user}>
    <h1>Editar usuario</h1>

    <form method="POST" action={`/api/admin/users/${targetUserId}/role`}>
      <label for="role">Rol</label>
      <select name="role" id="role" required>
        {Object.values(ROLES).filter((r) => r !== 'guest').map((role) => (
          <option value={role}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </option>
        ))}
      </select>

      <label for="isBanned">
        <input type="checkbox" name="isBanned" value="true" />
        Usuario baneado
      </label>

      <label for="banReason">Motivo de baneo</label>
      <textarea name="banReason" id="banReason" rows="3"></textarea>

      <button type="submit">Guardar cambios</button>
    </form>
  </AdminLayout>
</AuthGuard>
```

### 8.4 API endpoint para cambio de rol

```ts
// src/pages/api/admin/users/[id]/role.ts
import type { APIRoute } from 'astro';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ROLES, roleAtLeast } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth';

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const session = await getSession(request);
  if (!session?.user || !roleAtLeast(session.user.role, 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const targetId = params.id;
  const formData = await request.formData();
  const newRole = formData.get('role') as string;
  const isBanned = formData.get('isBanned') === 'true';
  const banReason = formData.get('banReason') as string | null;

  // Validar que el rol exista
  if (!Object.values(ROLES).includes(newRole as Role)) {
    return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
  }

  // No permitir que un admin se auto-degrade
  if (targetId === session.user.id && newRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'No puedes cambiarte el rol a ti mismo' }), {
      status: 400,
    });
  }

  // Incrementar tokenVersion para forzar re-login del usuario afectado
  await db
    .update(users)
    .set({
      role: newRole as Role,
      isBanned,
      banReason: isBanned ? banReason ?? null : null,
      bannedAt: isBanned ? new Date() : null,
      tokenVersion: sql`token_version + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetId));

  return redirect('/admin/users');
};
```

---

## 9. Casos Límite

### 9.1 Usuario baneado

| Aspecto | Comportamiento |
|---|---|
| **Login** | Bloqueado en callback `signIn` de Auth.js. Redirige a `/auth/error?error=BannedAccount`. |
| **Middleware** | Si el JWT está vivo pero `isBanned === true`, se redirige a página de error (excepto `/api/auth/signout`). |
| **JWT** | No se invalida automáticamente (el usuario ya tiene sesión). Se usa el flag `isBanned` en el middleware. |
| **API** | Todos los endpoints verifican `session.user.isBanned` y responden 403. |
| **UI** | El Header no muestra enlaces de cuenta. Las guardias condicionales ocultan todo el contenido. |

```ts
// Endpoint helper para verificar baneo
export function checkBanned(session: Session | null): Response | null {
  if (session?.user?.isBanned) {
    return new Response(JSON.stringify({ error: 'Cuenta suspendida' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
```

### 9.2 Cuenta no verificada

| Aspecto | Comportamiento |
|---|---|
| **Login** | Permitido (el usuario necesita entrar para verificar). |
| **Middleware** | Redirige a `/auth/verify-email` si `emailVerified === null`. Excepciones: `/api/auth/*`, `/auth/verify-email`, `/auth/logout`. |
| **Compra** | Bloqueada hasta verificar email. El botón de compra muestra mensaje de verificación pendiente. |
| **JWT** | Incluye `emailVerified: null`. El frontend y middleware lo verifican. |
| **Reenvío de verificación** | Página `/auth/verify-email` permite reenviar token cada 60 s (rate limited). |

```ts
// En la página de verificación
// src/pages/auth/verify-email.astro
export const prerender = false;

const user = Astro.locals.user;

if (user?.emailVerified) {
  return Astro.redirect('/account');
}
```

### 9.3 Sesión expirada

| Aspecto | Comportamiento |
|---|---|
| **JWT expirado** | Auth.js retorna `null` en `getSession()`. El middleware trata al usuario como `guest`. |
| **Redirección** | Si la ruta requiere autenticación, redirige a `/auth/login?redirect=<ruta_original>`. |
| **UX** | En componentes cliente (carrito, wishlist), se usa un fetch periódico a `/api/auth/session`. Si falla, se muestra mensaje de sesión expirada y se limpia el estado local. |
| **Refresh automático** | Con JWT, Auth.js maneja el refresco automáticamente si se configura `maxAge` adecuado. |

```ts
// src/lib/auth/session.ts
// Helper para páginas SSR: verifica sesión + redirige si expiró
import { getSession } from '@/lib/auth';

export async function requireSession(context: any, requiredRole?: Role) {
  const session = await getSession(context.request);

  if (!session?.user) {
    return {
      redirect: `/auth/login?redirect=${encodeURIComponent(context.url.pathname)}`,
    };
  }

  if (requiredRole && !roleAtLeast(session.user.role, requiredRole)) {
    return { redirect: '/auth/error?error=Forbidden' };
  }

  return { session, user: session.user };
}
```

### 9.4 Degradación de premium (suscripción expirada)

```ts
// Cron job / webhook (ejecutar diariamente)
import { db } from '@/db';
import { users } from '@/db/schema';
import { lt } from 'drizzle-orm';

export async function expirePremiumSubscriptions() {
  const expired = await db
    .update(users)
    .set({
      role: 'user',
      subscriptionExpiresAt: null,
      tokenVersion: sql`token_version + 1`, // Invalida JWT
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.role, 'premium'),
        lt(users.subscriptionExpiresAt, new Date()),
      ),
    )
    .returning({ id: users.id, email: users.email });

  // Notificar a los usuarios afectados
  for (const user of expired) {
    await sendEmail({
      to: user.email,
      subject: 'Tu suscripción premium ha expirado',
      template: 'premium-expired',
    });
  }

  return expired;
}
```

### 9.5 Tabla resumen de edge cases

| Escenario | Estado del usuario | JWT | Ruta protegida | Acción del sistema |
|---|---|---|---|---|
| Normal | `isBanned: false, emailVerified: Date` | Válido | Cualquiera según rol | Pasa |
| Baneado intenta login | `isBanned: true` | — | — | Bloqueado en `signIn` callback |
| Baneado con JWT activo | `isBanned: true` | Válido (aún no expiró) | Cualquiera | Redirigido a error, force logout |
| No verificado | `emailVerified: null` | Válido | `/account`, `/cart`, `/checkout` | Redirigido a `/auth/verify-email` |
| No verificado | `emailVerified: null` | Válido | `/auth/verify-email`, `/api/auth/*` | Permitido |
| Premium expirado | `role: 'premium'` (desactualizado en BD) | Válido (antes del cron) | Rutas premium | Permitido hasta que el cron lo degrade |
| Premium expirado | `role: 'user'` (después del cron) | Inválido (`tokenVersion++`) | Rutas premium | Redirigido a `/upgrade` |
| Sesión expirada | `guest` | Expirado / no existe | Cualquiera protegida | Redirigido a `/auth/login?redirect=...` |
| Rol cambiado por admin | `role: 'user' → 'editor'` | Inválido (`tokenVersion++`) | Rutas editor | Forzado a re-login, obtiene nuevo JWT |
| Token manipulado | — | Firma inválida | Cualquiera | Auth.js retorna `null`, tratado como guest |

---

## 10. Apéndice: Checklist de Implementación

- [ ] **Tipos y constantes**: `src/lib/auth/roles.ts` con enum de roles, jerarquía, helpers.
- [ ] **Permisos granularizados** (opcional): `src/lib/auth/permissions.ts` con permisos planos.
- [ ] **Esquema Drizzle**: columna `role` con `{ enum: [...] }`, columnas `isBanned`, `bannedAt`, `banReason`, `subscriptionExpiresAt`.
- [ ] **Migración**: agregar CHECK constraint en PostgreSQL.
- [ ] **Auth.js config**: callback `jwt` con propagación de `role`, `isBanned`, `tokenVersion`.
- [ ] **Auth.js config**: callback `session` con propagación de claims a la sesión.
- [ ] **Auth.js config**: callback `signIn` con bloqueo de baneados.
- [ ] **Tipos globales**: extender `App.Locals` y módulos `@auth/core/types`.
- [ ] **Middleware**: lista `routeGuards` con `pattern` + `requiredRole`.
- [ ] **Middleware**: verificación de baneo (excepto `/api/auth/signout`).
- [ ] **Middleware**: verificación de email (excepto `/api/auth/*`).
- [ ] **Middleware**: redirect con `?redirect=` para post-login.
- [ ] **Componente `AuthGuard.astro`**: `requiredRole`, mensajes de fallback, redirect opcional.
- [ ] **Header condicional**: enlace "Panel Admin" según `roleAtLeast(user.role, 'editor')`.
- [ ] **Admin layout**: `AdminLayout.astro` con sidebar de navegación según rol.
- [ ] **Página de gestión de usuarios**: `/admin/users` con tabla CRUD.
- [ ] **API endpoint**: `POST /api/admin/users/[id]/role` con verificación de admin.
- [ ] **Protección de auto-degradación**: evitar que admin se baje el rol a sí mismo.
- [ ] **Cron de expiración premium**: degradar suscripciones vencidas diariamente.
- [ ] **Página de error**: `/auth/error` con mensajes para `BannedAccount`, `Forbidden`, etc.
- [ ] **Página de verificación**: `/auth/verify-email` con botón de reenvío.
- [ ] **Rate limiting de reenvío**: cooldown de 60 s en envío de token de verificación.
- [ ] **Test de flujo completo**: registro → verificación → compra → cambio de rol por admin → re-login.
