# Sistema de Autenticación — 007-Sama (Tienda de Videojuegos)

> **Framework:** Auth.js v6 (vía `auth-astro`) + Astro 6.x  
> **Estrategia de sesión:** JWT (JSON Web Tokens)  
> **Output:** Hybrid (SSG + SSR)  
> **Idioma:** Español (código fuente en inglés)

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Tecnologías y Dependencias](#2-tecnologías-y-dependencias)
3. [Flujo de Registro de Nuevo Usuario](#3-flujo-de-registro-de-nuevo-usuario)
4. [Flujo de Login con Email/Contraseña](#4-flujo-de-login-con-emailcontraseña)
5. [Login con Proveedores OAuth (Google, Discord, Steam)](#5-login-con-proveedores-oauth-google-discord-steam)
6. [Recuperación de Contraseña](#6-recuperación-de-contraseña)
7. [Manejo de Sesiones con Cookies Seguras](#7-manejo-de-sesiones-con-cookies-seguras)
8. [Middleware de Autenticación en Astro](#8-middleware-de-autenticación-en-astro)
9. [Protección de Rutas del Dashboard](#9-protección-de-rutas-del-dashboard)
10. [Tokens JWT vs Session Tokens](#10-tokens-jwt-vs-session-tokens)
11. [Manejo de Errores y Mensajes al Usuario](#11-manejo-de-errores-y-mensajes-al-usuario)
12. [Consideraciones de Seguridad (CSRF, XSS)](#12-consideraciones-de-seguridad-csrf-xss)
13. [Estructura de Archivos del Sistema de Auth](#13-estructura-de-archivos-del-sistema-de-auth)
14. [Variables de Entorno](#14-variables-de-entorno)
15. [Esquema de Base de Datos](#15-esquema-de-base-de-datos)

---

## 1. Arquitectura General

```
                     ┌──────────────────────────────────────┐
                     │            Navegador                  │
                     │  (cookie httpOnly con JWT)            │
                     └──────────┬───────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   POST /api/auth/*     │
                    │   GET  /account/*      │
                    └───────────┬───────────┘
                                │
                     ┌──────────▼──────────┐
                     │   Middleware Astro   │
                     │  (src/middleware.ts) │
                     │                     │
                     │  ¿Ruta protegida?    │
                     │    ├── No  → next() │
                     │    └── Sí  →        │
                     │       getSession()  │
                     │       ¿válida?       │
                     │         ├── No → /auth/login
                     │         └── Sí → locals.user
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │     Auth.js Core     │
                     │  (@auth/core v0.37)  │
                     │                      │
                     │  Providers:           │
                     │  ├── Credentials     │
                     │  ├── Google          │
                     │  ├── Discord         │
                     │  └── Steam           │
                     │                      │
                     │  Estrategia: JWT     │
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │     PostgreSQL        │
                     │  (vía @astrojs/db)   │
                     │                      │
                     │  Tablas:             │
                     │  ├── users           │
                     │  ├── accounts        │
                     │  ├── sessions        │
                     │  └── verificationTokens
                     └─────────────────────┘
```

### Flujo general de autenticación

```
Usuario                    Frontend (Astro)              Auth.js                  Base de Datos
  │                             │                          │                          │
  │  Interactúa con formulario  │                          │                          │
  ├────────────────────────────>│                          │                          │
  │                             │                          │                          │
  │  POST /api/auth/callback/   │                          │                          │
  │  [provider]                 │                          │                          │
  ├────────────────────────────>│                          │                          │
  │                             │  Auth.js handler         │                          │
  │                             ├─────────────────────────>│                          │
  │                             │                          │  Consulta/crea usuario   │
  │                             │                          ├─────────────────────────>│
  │                             │                          │  <── user row ───────────│
  │                             │                          │                          │
  │                             │  Genera JWT + cookie     │                          │
  │                             │<─────────────────────────│                          │
  │  Set-Cookie:               │                          │                          │
  │  authjs.session-token=JWT   │                          │                          │
  │  (httpOnly, secure,         │                          │                          │
  │   sameSite=lax)             │                          │                          │
  │<────────────────────────────│                          │                          │
  │                             │                          │                          │
  │  Redirect a /account        │                          │                          │
  │<────────────────────────────│                          │                          │
```

---

## 2. Tecnologías y Dependencias

### Dependencias principales

| Paquete | Versión | Propósito |
|---|---|---|
| `auth-astro` | ^6.0.0 | Adaptador de Auth.js para Astro (integración oficial) |
| `@auth/core` | ^0.37.0 | Core de Auth.js: manejadores de providers, JWT, sesiones |
| `@astrojs/db` | ^0.14.0 | ORM y conexión a PostgreSQL para persistencia de usuarios |
| `zod` | ^4.4.0 | Validación de schemas en formularios y API |

### Proveedores OAuth configurados

| Proveedor | Paquete interno | Endpoint de callback |
|---|---|---|
| Google | `@auth/core/providers/google` | `/api/auth/callback/google` |
| Discord | `@auth/core/providers/discord` | `/api/auth/callback/discord` |
| Steam | `@auth/core/providers/steam` | `/api/auth/callback/steam` |
| Credentials | `@auth/core/providers/credentials` | `/api/auth/callback/credentials` |

### Configuración en `astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/serverless';
import auth from 'auth-astro';

export default defineConfig({
  site: 'https://007-sama.com',
  output: 'hybrid',
  adapter: vercel(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    sitemap(),
    auth(),
  ],
  vite: {
    resolve: {
      alias: { '@': '/src' },
    },
  },
});
```

---

## 3. Flujo de Registro de Nuevo Usuario

### 3.1 Diagrama de flujo

```
Usuario                        Frontend                         Auth.js                       BD
  │                              │                                │                           │
  │  GET /auth/register          │                                │                           │
  ├─────────────────────────────>│                                │                           │
  │  <── Formulario HTML ────────┤                                │                           │
  │                              │                                │                           │
  │  POST /api/auth/callback/    │                                │                           │
  │  credentials                 │                                │                           │
  │  {name, email, password}     │                                │                           │
  ├─────────────────────────────>│                                │                           │
  │                              │  ¿Email ya existe?             │                           │
  │                              ├───────────────────────────────>│                           │
  │                              │  <── Sí → error "email usado"  │                           │
  │                              │                                │                           │
  │                              │  Hash password (bcrypt)        │                           │
  │                              │  INSERT user                   │                           │
  │                              ├───────────────────────────────>│──────────────────────────>│
  │                              │                                │                           │
  │                              │  Generar token de verificación │                           │
  │                              │  Enviar email de confirmación  │                           │
  │                              ├───────────────────────────────>│                           │
  │                              │                                │                           │
  │  <── "Revisa tu email" ──────┤                                │                           │
  │                              │                                │                           │
  │  (Usuario abre email)        │                                │                           │
  │  Click en link               │                                │                           │
  │  GET /api/auth/verify-email  │                                │                           │
  │  ?token=xxx                  │                                │                           │
  ├─────────────────────────────>│                                │                           │
  │                              │  Validar token                 │                           │
  │                              │  UPDATE user.emailVerified     │                           │
  │                              ├───────────────────────────────>│──────────────────────────>│
  │                              │                                │                           │
  │  <── "Email verificado" ─────┤                                │                           │
  │  Redirect a /auth/login      │                                │                           │
  │<─────────────────────────────│                                │                           │
```

### 3.2 Auth.js — Configuración de providers

```ts
// src/auth.ts
import { defineConfig } from 'auth-astro';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import Discord from '@auth/core/providers/discord';
import Steam from '@auth/core/providers/steam';
import { compare } from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default defineConfig({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
    }),
    Google({
      clientId: import.meta.env.AUTH_GOOGLE_ID,
      clientSecret: import.meta.env.AUTH_GOOGLE_SECRET,
    }),
    Discord({
      clientId: import.meta.env.AUTH_DISCORD_ID,
      clientSecret: import.meta.env.AUTH_DISCORD_SECRET,
    }),
    Steam({
      clientId: import.meta.env.AUTH_STEAM_KEY,
      clientSecret: import.meta.env.AUTH_STEAM_KEY, // Steam usa API key como ambos
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'credentials' && !user.emailVerified) {
        return '/auth/verify-email?error=not-verified';
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
    verifyRequest: '/auth/verify-email',
    error: '/auth/error',
  },
});
```

### 3.3 Formulario de registro (`RegisterForm.astro`)

```astro
---
// src/components/auth/RegisterForm.astro
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener una mayúscula')
    .regex(/[a-z]/, 'Debe contener una minúscula')
    .regex(/[0-9]/, 'Debe contener un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export interface Props {
  error?: string;
  success?: string;
}
const { error, success } = Astro.props;
---
<div class="register-form">
  {error && <div class="alert alert-error" role="alert">{error}</div>}
  {success && <div class="alert alert-success" role="alert">{success}</div>}

  <form method="POST" action="/api/auth/register" novalidate>
    <label for="name">
      Nombre completo
      <input type="text" id="name" name="name" required minlength="2" />
    </label>

    <label for="email">
      Correo electrónico
      <input type="email" id="email" name="email" required autocomplete="email" />
    </label>

    <label for="password">
      Contraseña
      <input
        type="password"
        id="password"
        name="password"
        required
        minlength="8"
        autocomplete="new-password"
      />
      <small>Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número</small>
    </label>

    <label for="confirmPassword">
      Confirmar contraseña
      <input
        type="password"
        id="confirmPassword"
        name="confirmPassword"
        required
        autocomplete="new-password"
      />
    </label>

    <button type="submit">Crear cuenta</button>
  </form>

  <p class="register-form__login-link">
    ¿Ya tienes cuenta? <a href="/auth/login">Inicia sesión</a>
  </p>
</div>
```

### 3.4 Endpoint de registro (`src/pages/api/auth/register.ts`)

```ts
// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Datos inválidos',
          details: parsed.error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Verificar email duplicado
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Este email ya está registrado' }),
        { status: 409 }
      );
    }

    // Hash de contraseña con bcrypt (cost factor 12)
    const passwordHash = await hash(password, 12);

    // Crear usuario (emailVerified = null hasta confirmación)
    const [user] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      emailVerified: null,
      createdAt: new Date(),
    }).returning();

    // Generar token de verificación y enviar email
    const token = await generateVerificationToken(user.id, email);
    await sendVerificationEmail(email, token);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cuenta creada. Revisa tu email para verificar tu dirección.',
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
};
```

### 3.5 Validación del formulario (lado cliente)

```ts
// src/components/auth/registerValidation.ts
import { z } from 'zod';

export const registerFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[a-z]/, 'Debe incluir una minúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export function validateRegisterForm(formData: FormData): {
  success: boolean;
  data?: RegisterFormData;
  errors?: Record<string, string[]>;
} {
  const data = {
    name: formData.get('name')?.toString() ?? '',
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
    confirmPassword: formData.get('confirmPassword')?.toString() ?? '',
  };

  const result = registerFormSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  return { success: true, data: result.data };
}
```

### 3.6 Confirmación por email

```
Email enviado al usuario:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   007-Sama — Verifica tu correo electrónico         │
│                                                     │
│   Hola {name},                                      │
│                                                     │
│   Gracias por registrarte en 007-Sama.              │
│   Para activar tu cuenta, haz clic en el enlace:    │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  Verificar email                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   https://007-sama.com/api/auth/verify-email        │
│   ?token={token}&email={email}                     │
│                                                     │
│   Este enlace expira en 24 horas.                   │
│                                                     │
│   Si no creaste esta cuenta, ignora este email.     │
│                                                     │
│   — Equipo de 007-Sama                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```ts
// src/lib/auth.ts — Funciones de verificación de email
import { db } from '@/db';
import { verificationTokens, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

export async function generateVerificationToken(
  userId: string,
  email: string
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires: expiresAt,
    userId,
  });

  return token;
}

export async function verifyEmail(token: string, email: string): Promise<boolean> {
  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.token, token),
      eq(verificationTokens.identifier, email),
      gt(verificationTokens.expires, new Date())
    ),
  });

  if (!record) return false;

  await db.update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  await db.delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return true;
}

// src/pages/api/auth/verify-email.ts
import type { APIRoute } from 'astro';
import { verifyEmail } from '@/lib/auth';

export const GET: APIRoute = async ({ url, redirect }) => {
  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');

  if (!token || !email) {
    return redirect('/auth/error?error=missing-token');
  }

  const verified = await verifyEmail(token, email);

  if (!verified) {
    return redirect('/auth/error?error=invalid-or-expired-token');
  }

  return redirect('/auth/login?verified=true');
};
```

---

## 4. Flujo de Login con Email/Contraseña

### 4.1 Diagrama de flujo

```
Usuario                   Frontend (Astro)              Auth.js (Credentials)       BD
  │                           │                            │                        │
  │ GET /auth/login           │                            │                        │
  ├──────────────────────────>│                            │                        │
  │ <── HTML form ────────────┤                            │                        │
  │                           │                            │                        │
  │ POST /api/auth/callback/  │                            │                        │
  │ credentials               │                            │                        │
  │ {email, password}         │                            │                        │
  ├──────────────────────────>│                            │                        │
  │                           │  Llama authorize()         │                        │
  │                           ├───────────────────────────>│                        │
  │                           │                            │  SELECT user by email  │
  │                           │                            ├───────────────────────>│
  │                           │                            │  <── user + hash ──────│
  │                           │                            │                        │
  │                           │                            │  bcrypt.compare()      │
  │                           │                            │  ┌──────────┐          │
  │                           │                            │  │ ¿Match?  │          │
  │                           │                            │  ├──────────┤          │
  │                           │                            │  │ Sí → JWT │          │
  │                           │                            │  │ No → null│          │
  │                           │                            │  └──────────┘          │
  │                           │                            │                        │
  │                           │  <── JWT + cookie ─────────┤                        │
  │                           │                            │                        │
  │  <── Set-Cookie(httpOnly)─┤                            │                        │
  │  <── Redirect /account ───┤                            │                        │
  │                           │                            │                        │
  │  GET /account (cookie)    │                            │                        │
  ├──────────────────────────>│                            │                        │
  │                           │  Middleware: validar JWT   │                        │
  │                           │  locals.user = payload     │                        │
  │  <── HTML con datos ──────┤                            │                        │
```

### 4.2 Formulario de login (`LoginForm.astro`)

```astro
---
// src/components/auth/LoginForm.astro
export interface Props {
  error?: string;
  redirect?: string;
}
const { error, redirect } = Astro.props;
---
<div class="login-form">
  {error && (
    <div class="alert alert-error" role="alert">
      {error === 'CredentialsSignin' && 'Email o contraseña incorrectos'}
      {error === 'not-verified' && 'Debes verificar tu email antes de iniciar sesión'}
      {error === 'OAuthAccountNotLinked' && 'Este email ya está vinculado a otro proveedor'}
      {error === undefined && 'Error al iniciar sesión'}
    </div>
  )}

  <form method="POST" action="/api/auth/callback/credentials">
    <input type="hidden" name="redirect" value={redirect ?? '/account'} />
    <input type="hidden" name="csrfToken" value={/* generado por Auth.js */} />

    <label for="email">
      Correo electrónico
      <input
        type="email"
        id="email"
        name="email"
        required
        autocomplete="email"
      />
    </label>

    <label for="password">
      Contraseña
      <input
        type="password"
        id="password"
        name="password"
        required
        autocomplete="current-password"
      />
    </label>

    <div class="login-form__actions">
      <button type="submit">Iniciar sesión</button>
      <a href="/auth/reset-password">¿Olvidaste tu contraseña?</a>
    </div>
  </form>

  <div class="login-form__divider">
    <span>O continúa con</span>
  </div>

  <div class="login-form__oauth">
    <a
      href="/api/auth/signin/google"
      class="oauth-btn oauth-btn--google"
    >
      Google
    </a>
    <a
      href="/api/auth/signin/discord"
      class="oauth-btn oauth-btn--discord"
    >
      Discord
    </a>
    <a
      href="/api/auth/signin/steam"
      class="oauth-btn oauth-btn--steam"
    >
      Steam
    </a>
  </div>

  <p class="login-form__register-link">
    ¿No tienes cuenta? <a href="/auth/register">Regístrate</a>
  </p>
</div>
```

### 4.3 Flujo de redirect post-login

```ts
// src/lib/auth.ts — Función auxiliar para redirect
export function getRedirectUrl(request: Request, defaultUrl = '/account'): string {
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get('redirect');

  if (!redirectParam) return defaultUrl;

  // Validar que la redirección sea interna (previene open redirect)
  const allowedOrigins = ['https://007-sama.com'];
  try {
    const redirectUrl = new URL(redirectParam);
    if (!allowedOrigins.includes(redirectUrl.origin)) {
      return defaultUrl;
    }
  } catch {
    // Es una ruta relativa, permitirla
    if (redirectParam.startsWith('/')) {
      return redirectParam;
    }
    return defaultUrl;
  }

  return defaultUrl;
}
```

---

## 5. Login con Proveedores OAuth (Google, Discord, Steam)

### 5.1 Diagrama de flujo OAuth (Authorization Code Flow)

```
Usuario              Navegador               007-Sama             Proveedor OAuth        BD
  │                     │                      │                      │                  │
  │  Click "Google"     │                      │                      │                  │
  ├────────────────────>│                      │                      │                  │
  │                     │  GET /api/auth/      │                      │                  │
  │                     │  signin/google        │                      │                  │
  │                     ├─────────────────────>│                      │                  │
  │                     │                      │  Redirect a Google   │                  │
  │                     │  302 → accounts.google.com/o/oauth2/...     │                  │
  │                     │<─────────────────────│                      │                  │
  │                     │                      │                      │                  │
  │  Autentica en       │                      │                      │                  │
  │  Google             │                      │                      │                  │
  │  (consentimiento)   │                      │                      │                  │
  ├────────────────────>│                      │                      │                  │
  │                     │  Callback con auth    │                      │                  │
  │                     │  code                │                      │                  │
  │                     ├─────────────────────>│                      │                  │
  │                     │  GET /api/auth/      │                      │                  │
  │                     │  callback/google?     │                      │                  │
  │                     │  code=xxx&state=yyy  │                      │                  │
  │                     │                      │  POST code +         │                  │
  │                     │                      │  client_secret       │                  │
  │                     │                      ├─────────────────────>│                  │
  │                     │                      │  <── access_token ───┤                  │
  │                     │                      │  <── user info ──────┤                  │
  │                     │                      │                      │                  │
  │                     │                      │  ¿Usuario existe     │                  │
  │                     │                      │  por email?          │                  │
  │                     │                      ├─────────────────────>│───────────────>│
  │                     │                      │  ┌────────────────┐  │                  │
  │                     │                      │  │ ¿Existe?       │  │                  │
  │                     │                      │  │ ├── Sí → link  │  │                  │
  │                     │                      │  │ └── No → create│  │                  │
  │                     │                      │  └────────────────┘  │                  │
  │                     │                      │                      │                  │
  │                     │                      │  Crear account row   │                  │
  │                     │                      │  en tabla accounts   │                  │
  │                     │                      ├─────────────────────>│───────────────>│
  │                     │                      │                      │                  │
  │                     │  <── Set-Cookie JWT──┤                      │                  │
  │                     │  <── Redirect ───────┤                      │                  │
  │  <── Render ────────┤                      │                      │                  │
```

### 5.2 Configuración de proveedores

```ts
// src/auth.ts (extracto de configuración de OAuth)
import Google from '@auth/core/providers/google';
import Discord from '@auth/core/providers/discord';
import Steam from '@auth/core/providers/steam';

export default defineConfig({
  providers: [
    Google({
      clientId: import.meta.env.AUTH_GOOGLE_ID,
      clientSecret: import.meta.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    Discord({
      clientId: import.meta.env.AUTH_DISCORD_ID,
      clientSecret: import.meta.env.AUTH_DISCORD_SECRET,
      profile(profile) {
        // Discord devuelve: id, username, discriminator, avatar, email
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
        };
      },
    }),
    Steam({
      clientId: import.meta.env.AUTH_STEAM_KEY,
      clientSecret: import.meta.env.AUTH_STEAM_KEY,
      // Steam no devuelve email por defecto
      profile(profile) {
        return {
          id: profile.steamid,
          name: profile.personaname,
          email: null, // Steam no provee email
          image: profile.avatarfull,
        };
      },
    }),
  ],
});
```

### 5.3 Registro de aplicaciones OAuth

| Proveedor | URL de registro | Redirect URI | Datos requeridos |
|---|---|---|---|
| **Google** | https://console.cloud.google.com/apis/credentials | `https://007-sama.com/api/auth/callback/google` | Client ID, Client Secret |
| **Discord** | https://discord.com/developers/applications | `https://007-sama.com/api/auth/callback/discord` | Client ID, Client Secret |
| **Steam** | https://steamcommunity.com/dev/apikey | `https://007-sama.com/api/auth/callback/steam` | Steam API Key |

### 5.4 Link de cuentas OAuth con email/password

```
Escenario: Usuario se registró con email y luego intenta login con Google (mismo email)

Auth.js detecta que el email ya existe en users pero no hay account vinculada
a ese provider. Comportamiento:
  - Si OAuthAccountNotLinked está activo (default): rechaza el login,
    muestra error "Este email ya está vinculado a otro proveedor"
  - Solución: el usuario debe hacer login con su método original y luego
    vincular cuentas desde /account/connections
```

```ts
// src/auth.ts — Manejo de link de cuentas
callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.type === 'oauth') {
      // Verificar si el email ya existe con otro provider
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email!),
        with: { accounts: true },
      });

      if (existingUser && existingUser.accounts.length > 0) {
        const hasThisProvider = existingUser.accounts.some(
          (a) => a.provider === account.provider
        );
        if (!hasThisProvider) {
          // Link automático: agregar account al usuario existente
          await db.insert(accounts).values({
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          });
          return true;
        }
      }
    }
    return true;
  },
}
```

---

## 6. Recuperación de Contraseña

### 6.1 Diagrama de flujo

```
Usuario                  Frontend                        Servidor                        BD
  │                         │                              │                            │
  │  GET /auth/reset-       │                              │                            │
  │  password               │                              │                            │
  ├────────────────────────>│                              │                            │
  │  <── Formulario email ──┤                              │                            │
  │                         │                              │                            │
  │  POST /api/auth/        │                              │                            │
  │  forgot-password        │                              │                            │
  │  {email}                │                              │                            │
  ├────────────────────────>│                              │                            │
  │                         │  Validar email existe        │                            │
  │                         │  (sin revelar existencia)    │                            │
  │                         ├─────────────────────────────>│                            │
  │                         │  Generar reset token         │                            │
  │                         │  (crypto.randomBytes(32))    │                            │
  │                         │  Hash token + expiry(1h)     │                            │
  │                         │  INSERT passwordResetTokens  │                            │
  │                         ├─────────────────────────────>│───────────────────────────>│
  │                         │                              │                            │
  │                         │  Enviar email con link       │                            │
  │                         │  https://007-sama.com/       │                            │
  │                         │  auth/reset-password/        │                            │
  │                         │  {token}                     │                            │
  │                         ├─────────────────────────────>│                            │
  │  <── "Si el email       │                              │                            │
  │       existe, recibirás │                              │                            │
  │       instrucciones" ───┤                              │                            │
  │                         │                              │                            │
  │  (Usuario revisa email) │                              │                            │
  │                         │                              │                            │
  │  Click en link          │                              │                            │
  │  GET /auth/reset-       │                              │                            │
  │  password/{token}       │                              │                            │
  ├────────────────────────>│                              │                            │
  │                         │  Validar token en BD         │                            │
  │                         │  ¿expired? ¿ya usado?       │                            │
  │                         ├─────────────────────────────>│───────────────────────────>│
  │                         │  <── válido ─────────────────┤<───────────────────────────│
  │  <── Formulario nueva   │                              │                            │
  │       contraseña ───────┤                              │                            │
  │                         │                              │                            │
  │  POST /api/auth/        │                              │                            │
  │  reset-password/{token} │                              │                            │
  │  {password, confirm}    │                              │                            │
  ├────────────────────────>│                              │                            │
  │                         │  Validar token de nuevo      │                            │
  │                         │  Hash nueva contraseña       │                            │
  │                         │  (bcrypt, cost=12)          │                            │
  │                         │  UPDATE users.passwordHash   │                            │
  │                         ├─────────────────────────────>│───────────────────────────>│
  │                         │  DELETE token (one-time)     │                            │
  │                         ├─────────────────────────────>│───────────────────────────>│
  │                         │                              │                            │
  │  <── Redirect /auth/    │                              │                            │
  │      login ─────────────┤                              │                            │
```

### 6.2 Implementación de recovery

```ts
// src/pages/api/auth/forgot-password.ts
import type { APIRoute } from 'astro';
import { randomBytes, createHash } from 'node:crypto';
import { db } from '@/db';
import { passwordResetTokens, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email';

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json();

  if (!email || typeof email !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Email requerido' }),
      { status: 400 }
    );
  }

  // Buscar usuario (sin revelar existencia)
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  // Siempre responder igual por seguridad (evita enumeración de emails)
  if (!user) {
    return new Response(
      JSON.stringify({
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.',
      }),
      { status: 200 }
    );
  }

  // Generar token seguro
  const rawToken = randomBytes(32).toString('hex');
  const hashedToken = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  // Invalidar tokens anteriores del mismo usuario
  await db.delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.id));

  // Guardar token hasheado
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    hashedToken,
    expiresAt,
    used: false,
  });

  // Enviar email con el token raw (solo el email contiene el token real)
  await sendPasswordResetEmail(email, rawToken);

  return new Response(
    JSON.stringify({
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.',
    }),
    { status: 200 }
  );
};
```

```ts
// src/pages/api/auth/reset-password/[token].ts
import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { passwordResetTokens, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const resetSchema = z.object({
  password: z.string().min(8).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const { token } = params;
  if (!token) {
    return redirect('/auth/error?error=missing-token');
  }

  const body = await request.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: 'Contraseña inválida',
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400 }
    );
  }

  const hashedToken = createHash('sha256').update(token).digest('hex');

  const resetRecord = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.hashedToken, hashedToken),
      eq(passwordResetTokens.used, false)
    ),
  });

  if (!resetRecord || resetRecord.expiresAt < new Date()) {
    return new Response(
      JSON.stringify({ error: 'Token inválido o expirado' }),
      { status: 400 }
    );
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, resetRecord.userId));

  await db.update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, resetRecord.id));

  return new Response(
    JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente' }),
    { status: 200 }
  );
};
```

### 6.3 Email de recuperación

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   007-Sama — Restablece tu contraseña               │
│                                                     │
│   Recibimos una solicitud de cambio de contraseña   │
│   para tu cuenta en 007-Sama.                       │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  Restablecer contraseña                     │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   https://007-sama.com/auth/reset-password/         │
│   {rawToken}                                        │
│                                                     │
│   Este enlace expira en 1 hora.                     │
│                                                     │
│   Si no solicitaste este cambio, ignora este email. │
│                                                     │
│   — Equipo de 007-Sama                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Manejo de Sesiones con Cookies Seguras

### 7.1 Configuración de cookies (Auth.js)

Auth.js genera automáticamente las siguientes cookies:

| Cookie | Propósito | httpOnly | secure | sameSite | maxAge |
|---|---|---|---|---|---|
| `authjs.session-token` | Token de sesión JWT | `true` | `true` (prod) | `lax` | 30 días |
| `authjs.callback-url` | URL de redirect post-auth | `true` | `true` | `lax` | Sesión |
| `authjs.csrf-token` | Token CSRF anti-falsificación | `true` | `true` | `lax` | Sesión |

### 7.2 Personalización de cookies

```ts
// src/auth.ts — Configuración personalizada de cookies
import type { CookiesOptions } from '@auth/core';

export const cookies: Partial<CookiesOptions> = {
  sessionToken: {
    name: `__Secure-authjs.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true, // Solo HTTPS en producción
      maxAge: 30 * 24 * 60 * 60, // 30 días en segundos
    },
  },
  callbackUrl: {
    name: `__Secure-authjs.callback-url`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true,
    },
  },
  csrfToken: {
    name: `__Secure-authjs.csrf-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true,
    },
  },
};
```

### 7.3 Por qué `sameSite: 'lax'`

| Valor | Comportamiento | Caso de uso |
|---|---|---|
| `strict` | No envía cookie en ningún request cross-site | Máxima seguridad, pero rompe redirects OAuth |
| **`lax`** | Envía cookie en navegación top-level (GET) | **Elegido**: permite OAuth callbacks sin exponer a CSRF en POST |
| `none` | Envía en todos los contextos | Requiere `secure: true`, vulnerable a CSRF |

`lax` es el balance óptimo: protege contra CSRF en requests mutantes (POST, PUT, DELETE) pero permite que el flujo OAuth funcione mediante redirects GET.

### 7.4 Seguridad adicional en cookies

```ts
// src/middleware.ts — Reforzar cookies de seguridad
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Reforzar headers de seguridad en todas las respuestas
  response.headers.set(
    'Set-Cookie',
    response.headers.get('Set-Cookie')?.split(', ').map((cookie) => {
      // Asegurar que todas las cookies tengan flags de seguridad
      if (!cookie.includes('Secure') && import.meta.env.PROD) {
        cookie += '; Secure';
      }
      if (!cookie.includes('SameSite')) {
        cookie += '; SameSite=Lax';
      }
      if (!cookie.includes('HttpOnly')) {
        cookie += '; HttpOnly';
      }
      return cookie;
    }).join(', ') ?? ''
  );

  return response;
});
```

---

## 8. Middleware de Autenticación en Astro

### 8.1 Implementación completa (`src/middleware.ts`)

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

const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, locals } = context;
  const pathname = url.pathname;

  // Inicializar locals
  locals.session = null;
  locals.user = null;

  // Intentar obtener sesión en todos los requests
  try {
    const session = await getSession(context.request);
    if (session?.user) {
      locals.session = session;
      locals.user = {
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
      };
    }
  } catch (error) {
    console.error('Session error:', error);
    // Si falla la validación de la cookie, sesión nula
  }

  // Proteger rutas privadas
  const isPrivateRoute = privateRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPrivateRoute && !locals.session) {
    return redirect(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
  }

  // Redirigir usuarios autenticados fuera de auth routes
  const isAuthRoute = authRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isAuthRoute && locals.session) {
    return redirect('/account');
  }

  return next();
});
```

### 8.2 Declaración de tipos para `locals`

```ts
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: import('@auth/core/types').Session | null;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    } | null;
  }
}
```

### 8.3 Uso en páginas

```astro
---
// src/pages/account/index.astro
import BaseLayout from '@/layouts/BaseLayout.astro';

export const prerender = false;

const user = Astro.locals.user;
const session = Astro.locals.session;
---
<BaseLayout title="Mi cuenta | 007-Sama">
  <h1>Bienvenido, {user?.name ?? 'Usuario'}</h1>

  <section class="account-summary">
    <img
      src={user?.image ?? '/default-avatar.png'}
      alt={user?.name}
      width={64}
      height={64}
    />
    <p>Email: {user?.email}</p>
  </section>

  <nav class="account-nav">
    <a href="/account/orders">Mis pedidos</a>
    <a href="/account/wishlist">Lista de deseos</a>
  </nav>

  <form method="POST" action="/api/auth/signout">
    <input type="hidden" name="csrfToken" value={session?.csrfToken} />
    <button type="submit">Cerrar sesión</button>
  </form>
</BaseLayout>
```

### 8.4 Componente `AuthGuard.astro`

```astro
---
// src/components/auth/AuthGuard.astro
import type { Session } from '@auth/core/types';

export interface Props {
  session: Session | null;
  fallback?: string;
}

const { session, fallback = '/auth/login' } = Astro.props;
---

{session ? (
  <slot />
) : (
  <div class="auth-guard" role="alert">
    <p>Debes iniciar sesión para acceder a esta sección.</p>
    <a href={fallback}>Iniciar sesión</a>
  </div>
)}
```

---

## 9. Protección de Rutas del Dashboard

### 9.1 Mapa de rutas protegidas

| Ruta | Archivo | Tipo de protección | Nivel |
|---|---|---|---|
| `/account` | `src/pages/account/index.astro` | Middleware + SSR | Usuario autenticado |
| `/account/orders` | `src/pages/account/orders.astro` | Middleware + SSR | Usuario autenticado |
| `/account/wishlist` | `src/pages/account/wishlist.astro` | Middleware + SSR | Usuario autenticado |
| `/checkout` | `src/pages/checkout/index.astro` | Middleware + SSR | Usuario autenticado |
| `/auth/login` | `src/pages/auth/login.astro` | Redirect si autenticado | Público condicional |
| `/auth/register` | `src/pages/auth/register.astro` | Redirect si autenticado | Público condicional |

### 9.2 Flujo de protección en dashboard

```
Request → /account/orders
              │
              ▼
        middleware.ts
              │
              ├── getSession(request)
              │     ├── Cookie presente?
              │     │     ├── No → redirect /auth/login
              │     │     └── Sí → Validar JWT
              │     │               ├── JWT expirado → redirect /auth/login
              │     │               ├── JWT inválido (firma) → redirect /auth/login
              │     │               └── JWT válido → extraer payload
              │     │
              │     └── context.locals.user = { id, name, email }
              │
              ▼
        next() → /account/orders.astro
              │
              ├── export const prerender = false  (forzar SSR)
              │
              ├── const user = Astro.locals.user
              │
              └── Renderizar HTML con datos del usuario
```

### 9.3 Cierre de sesión

```astro
---
// src/pages/auth/logout.astro
import BaseLayout from '@/layouts/BaseLayout.astro';

export const prerender = false;
---
<BaseLayout title="Cerrar sesión | 007-Sama">
  <div class="logout-page">
    <h1>Cerrar sesión</h1>
    <p>¿Estás seguro de que deseas cerrar sesión?</p>
    <form method="POST" action="/api/auth/signout">
      <input type="hidden" name="csrfToken" value={Astro.locals.session?.csrfToken} />
      <button type="submit">Sí, cerrar sesión</button>
    </form>
    <a href="/account">Cancelar</a>
  </div>
</BaseLayout>
```

---

## 10. Tokens JWT vs Session Tokens

### 10.1 Decisión: **JWT** (JSON Web Tokens)

Auth.js soporta dos estrategias de sesión. Hemos elegido **JWT** por las siguientes razones:

| Aspecto | JWT | Session Tokens (Database) |
|---|---|---|
| **Persistencia** | Token auto-contenido | Requiere tabla `sessions` en BD |
| **Validación** | Sin consulta a BD (verificar firma) | Consulta a BD en cada request |
| **Latencia** | Baja (~0ms adicional) | Alta (~5-50ms por query) |
| **Escalabilidad** | Horizontal sin estado compartido | Requiere sesión sticky o Redis |
| **Revocación** | No inmediata (esperar expiración) | Inmediata (eliminar de BD) |
| **Tamaño** | Mayor (payload + header + firma) | Solo session ID en cookie |
| **CSRF** | No vulnerable si httpOnly | No vulnerable si httpOnly |
| **Refresh token** | No nativo (requiere lógica extra) | Nativo (rotación de sesiones) |

### 10.2 Por qué JWT para 007-Sama

```
Motivación principal:
  - Sin estado (stateless): el servidor no necesita consultar BD en cada request
  - Despliegue serverless (Vercel): evita cold start + query a BD en cada request
  - Escalabilidad: cualquier instancia puede validar sin compartir estado
  - Simplicidad: no requiere rotación de session tokens ni limpieza de expirados

Trade-off asumido:
  - No podemos revocar sesiones inmediatamente (el token vive hasta expirar)
  - Mitigación: maxAge corto (30 días) + opción de forzar expiración
    incrementando el tokenVersion del usuario en BD
```

### 10.3 Estructura del JWT

```ts
// Payload del JWT generado por Auth.js
interface JWTPayload {
  // Auth.js estándar
  name: string;
  email: string;
  picture: string | null;
  sub: string;          // user.id

  // Custom
  id: string;
  emailVerified: Date | null;
  tokenVersion: number; // Para revocación forzada

  // Metadata del token
  iat: number;          // Issued at (timestamp)
  exp: number;          // Expiration (timestamp)
  jti: string;          // JWT ID (único, para revocación puntual)
}
```

### 10.4 Revocación forzada (tokenVersion)

```ts
// src/lib/auth.ts — Revocación de tokens
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function revokeAllSessions(userId: string): Promise<void> {
  await db.update(users)
    .set({ tokenVersion: db.sql`tokenVersion + 1` })
    .where(eq(users.id, userId));
}

// src/auth.ts — Validar tokenVersion en callback jwt
callbacks: {
  async jwt({ token, trigger }) {
    if (trigger === 'signIn' || trigger === 'signUp') {
      const user = await db.query.users.findFirst({
        where: eq(users.id, token.sub!),
        columns: { tokenVersion: true },
      });
      token.tokenVersion = user?.tokenVersion ?? 0;
    }

    // Verificar que el token no haya sido revocado
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, token.sub!),
      columns: { tokenVersion: true },
    });

    if (currentUser && token.tokenVersion !== currentUser.tokenVersion) {
      return {}; // Token inválido → Auth.js forzará nuevo login
    }

    return token;
  },
}
```

---

## 11. Manejo de Errores y Mensajes al Usuario

### 11.1 Mapa de errores de autenticación

| Código / Tipo | Mensaje para el usuario | Causa | HTTP Status |
|---|---|---|---|
| `CredentialsSignin` | Email o contraseña incorrectos | Credenciales inválidas | 401 |
| `not-verified` | Debes verificar tu email antes de iniciar sesión | Email no confirmado | 403 |
| `OAuthAccountNotLinked` | Este email ya está vinculado a otro método de inicio de sesión | Email duplicado entre providers | 409 |
| `invalid-or-expired-token` | El enlace de verificación ha expirado o es inválido | Token de email expirado (>24h) | 410 |
| `missing-token` | Enlace inválido. Solicita un nuevo enlace | Token ausente en URL | 400 |
| `EmailExists` | Este email ya está registrado | Email duplicado en registro | 409 |
| `WeakPassword` | La contraseña no cumple los requisitos de seguridad | No cumple regex de validación | 422 |
| `SessionRequired` | Debes iniciar sesión para acceder a esta página | Ruta protegida sin sesión | 401 |
| `TokenExpired` | Tu sesión ha expirado. Inicia sesión nuevamente | JWT expirado (>30 días) | 401 |
| `OAuthSignin` | Error al iniciar sesión con el proveedor externo | Error en OAuth flow | 502 |
| `OAuthCallback` | Error en la respuesta del proveedor externo | Código inválido o state mismatch | 502 |
| `SteamNotLinked` | Tu cuenta de Steam no tiene un email vinculado. Asocia un email en tu perfil de Steam | Steam no provee email | 400 |

### 11.2 Página de error (`src/pages/auth/error.astro`)

```astro
---
// src/pages/auth/error.astro
import BaseLayout from '@/layouts/BaseLayout.astro';

export const prerender = false;

const errorType = Astro.url.searchParams.get('error') ?? 'unknown';

const errorMessages: Record<string, { title: string; message: string; action: string; actionUrl: string }> = {
  CredentialsSignin: {
    title: 'Error al iniciar sesión',
    message: 'Email o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.',
    action: 'Volver a iniciar sesión',
    actionUrl: '/auth/login',
  },
  not_verified: {
    title: 'Email no verificado',
    message: 'Debes verificar tu dirección de email antes de acceder. Revisa tu bandeja de entrada.',
    action: 'Reenviar email de verificación',
    actionUrl: '/auth/verify-email',
  },
  OAuthAccountNotLinked: {
    title: 'Cuenta ya vinculada',
    message: 'Este email ya está asociado a otro método de inicio de sesión. Usa el método original.',
    action: 'Ir a iniciar sesión',
    actionUrl: '/auth/login',
  },
  SessionRequired: {
    title: 'Sesión requerida',
    message: 'Necesitas iniciar sesión para acceder a esta página.',
    action: 'Iniciar sesión',
    actionUrl: '/auth/login',
  },
  default: {
    title: 'Error de autenticación',
    message: 'Ocurrió un error inesperado. Intenta nuevamente.',
    action: 'Volver al inicio',
    actionUrl: '/',
  },
};

const error = errorMessages[errorType] ?? errorMessages.default;
---
<BaseLayout title={`${error.title} | 007-Sama`}>
  <div class="error-page" role="alert">
    <h1>{error.title}</h1>
    <p>{error.message}</p>
    <a href={error.actionUrl}>{error.action}</a>
  </div>
</BaseLayout>
```

### 11.3 Mensajes de éxito

| Escenario | Mensaje | Tipo | Duración |
|---|---|---|---|
| Registro exitoso | Cuenta creada correctamente. Revisa tu email para verificar tu dirección. | `success` | Persistente |
| Email verificado | Email verificado correctamente. Ya puedes iniciar sesión. | `success` | 5 segundos |
| Password reset exitoso | Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña. | `success` | 5 segundos |
| Sesión cerrada | Has cerrado sesión correctamente. | `info` | 3 segundos |

### 11.4 Manejo de errores en endpoints API

```ts
// src/lib/api-error.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return new Response(
      JSON.stringify({
        error: error.code,
        message: error.message,
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.error('Unhandled auth error:', error);
  return new Response(
    JSON.stringify({
      error: 'InternalError',
      message: 'Error interno del servidor. Intenta nuevamente.',
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

### 11.5 Validación client-side con feedback en tiempo real

```ts
// src/components/auth/useFormValidation.ts
import { useState, useCallback } from 'react';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

const passwordRules: ValidationRule[] = [
  { test: (v) => v.length >= 8, message: 'Mínimo 8 caracteres' },
  { test: (v) => /[A-Z]/.test(v), message: 'Una mayúscula' },
  { test: (v) => /[a-z]/.test(v), message: 'Una minúscula' },
  { test: (v) => /[0-9]/.test(v), message: 'Un número' },
];

export function usePasswordValidation() {
  const [checks, setChecks] = useState<Record<number, boolean>>({});

  const validate = useCallback((password: string) => {
    const newChecks = passwordRules.reduce<Record<number, boolean>>(
      (acc, rule, i) => {
        acc[i] = rule.test(password);
        return acc;
      },
      {}
    );
    setChecks(newChecks);
  }, []);

  const allPassed = Object.values(checks).every(Boolean);
  const passedCount = Object.values(checks).filter(Boolean).length;

  return { checks, validate, allPassed, passedCount, total: passwordRules.length };
}
```

---

## 12. Consideraciones de Seguridad (CSRF, XSS)

### 12.1 Protección CSRF

Auth.js implementa CSRF protection mediante **Synchronizer Token Pattern**:

```
1. El servidor genera un token CSRF aleatorio y lo almacena en:
   - Cookie httpOnly: `authjs.csrf-token`
   - Campo oculto en formularios: `<input name="csrfToken" value="...">`

2. En cada POST request a /api/auth/*, Auth.js:
   - Lee el token de la cookie (httpOnly, no accesible por JS)
   - Compara con el token enviado en el body
   - Si no coinciden → rechaza con error CSRF

3. Esto previene que un sitio malicioso (https://evil.com) pueda:
   - Hacer un POST falso a /api/auth/callback/credentials
   - Porque no puede leer la cookie httpOnly desde JS
   - Y no sabe el valor del token CSRF
```

**¿Por qué `sameSite: 'lax'` no es suficiente?**
- `lax` protege contra CSRF en POST pero permite GET cross-site
- El CSRF token es la defensa adicional para POST a endpoints críticos

### 12.2 Protección XSS (Cross-Site Scripting)

| Medida | Implementación | ¿Dónde? |
|---|---|---|
| **Cookies httpOnly** | El JWT de sesión no es accesible por `document.cookie` | Auth.js por defecto |
| **Input sanitization** | Zod valida y rechaza HTML/scripts en inputs | `src/pages/api/auth/*.ts` |
| **Templating escapado** | Astro escapa automáticamente `{user.name}` en HTML | Astro por defecto |
| **Content Security Policy** | Headers CSP restrictivos | `astro.config.mjs` |
| **No eval()** | Sin `eval()` en código de autenticación | Buenas prácticas |
| ** Sanitizar profile OAuth** | Validar que `profile.name` no contenga HTML | `src/auth.ts` callbacks |

```js
// astro.config.mjs — Content Security Policy
export default defineConfig({
  // ...
  vite: {
    plugins: [
      {
        name: 'csp-headers',
        configureServer(server) {
          server.middlewares.use((_req, res, next) => {
            res.setHeader(
              'Content-Security-Policy',
              [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'", // unsafe-inline para hidratación de islas
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' https://cdn.discordapp.com https://avatars.steamstatic.com https://lh3.googleusercontent.com data:",
                "connect-src 'self'",
                "frame-src 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
              ].join('; ')
            );
            next();
          });
        },
      },
    ],
  },
});
```

### 12.3 Headers de seguridad adicionales

```ts
// src/middleware.ts — Security headers
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '0'); // Obsoleto pero preventivo
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});
```

### 12.4 Buenas prácticas adicionales

| Práctica | Descripción |
|---|---|
| **Hash de contraseñas** | bcrypt con cost factor 12 (~250ms por hash) |
| **Rate limiting** | Limitar intentos de login (5 intentos/15min por IP) |
| **No enumeración de usuarios** | Respuesta idéntica si email existe o no (forgot password) |
| **Token expiry corto** | Reset tokens: 1 hora. Verify tokens: 24 horas |
| **One-time tokens** | Tokens de recuperación/verificación se invalidan tras uso |
| **SSL/TLS** | Todas las cookies marcadas `Secure` en producción |
| **Logout** | Invalidar sesión y redirigir con `308` |
| **Monitorización** | Loggear intentos fallidos sin exponer datos sensibles |

### 12.5 Rate limiting

```ts
// src/lib/rate-limit.ts
import { db } from '@/db';
import { loginAttempts } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function checkRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const attempts = await db.query.loginAttempts.findMany({
    where: and(
      eq(loginAttempts.ip, ip),
      gt(loginAttempts.createdAt, windowStart)
    ),
  });

  return attempts.length < MAX_ATTEMPTS;
}

export async function recordAttempt(ip: string, success: boolean) {
  await db.insert(loginAttempts).values({
    ip,
    success,
    createdAt: new Date(),
  });
}

// Uso en endpoint de login
// export const POST: APIRoute = async ({ request, clientAddress }) => {
//   const ip = clientAddress ?? 'unknown';
//   const allowed = await checkRateLimit(ip);
//   if (!allowed) {
//     return new Response(
//       JSON.stringify({ error: 'Demasiados intentos. Intenta en 15 minutos.' }),
//       { status: 429 }
//     );
//   }
//   // ... resto del flujo
// };
```

---

## 13. Estructura de Archivos del Sistema de Auth

```
src/
├── auth.ts                         # Configuración central de Auth.js
│
├── middleware.ts                   # Middleware de protección de rutas
│
├── env.d.ts                        # Tipos para App.Locals (session, user)
│
├── lib/
│   └── auth.ts                     # Funciones auxiliares (getSession, verifyEmail,
│                                   #   generateVerificationToken, revokeAllSessions)
│
├── components/
│   └── auth/
│       ├── LoginForm.astro         # Formulario de inicio de sesión
│       ├── RegisterForm.astro      # Formulario de registro
│       ├── AuthGuard.astro         # Wrapper de protección condicional
│       ├── OAuthButtons.astro      # Botones de OAuth (Google, Discord, Steam)
│       ├── PasswordStrength.astro  # Indicador de fortaleza de contraseña
│       └── registerValidation.ts   # Validación Zod del formulario de registro
│
├── pages/
│   ├── auth/
│   │   ├── login.astro             # /auth/login
│   │   ├── register.astro          # /auth/register
│   │   ├── logout.astro            # /auth/logout
│   │   ├── reset-password.astro    # /auth/reset-password
│   │   │   └── [token].astro       # /auth/reset-password/{token}
│   │   ├── verify-email.astro      # /auth/verify-email
│   │   └── error.astro             # /auth/error
│   │
│   ├── account/
│   │   ├── index.astro             # /account (dashboard protegido)
│   │   ├── orders.astro            # /account/orders
│   │   └── wishlist.astro          # /account/wishlist
│   │
│   └── api/
│       ├── auth/
│       │   ├── register.ts         # POST /api/auth/register
│       │   ├── forgot-password.ts  # POST /api/auth/forgot-password
│       │   ├── reset-password/
│       │   │   └── [token].ts      # POST /api/auth/reset-password/{token}
│       │   └── verify-email.ts     # GET /api/auth/verify-email
│       └── auth.ts                 # Auth.js handler (signin, signout, callbacks)
│
├── db/
│   ├── schema.ts                   # Definición de tablas (users, accounts, sessions, etc.)
│   └── queries.ts                  # Consultas reutilizables (getUserByEmail, etc.)
│
├── stores/
│   └── authStore.ts                # Nano Store con estado de sesión (cliente)
│
└── types/
    └── user.ts                     # Tipos User, Session
```

---

## 14. Variables de Entorno

```bash
# .env — Variables de entorno para autenticación

# Auth.js
AUTH_SECRET="<generar con: openssl rand -base64 32>"
AUTH_URL="http://localhost:4321"           # Desarrollo
# AUTH_URL="https://007-sama.com"          # Producción

# Google OAuth
AUTH_GOOGLE_ID="<Google Client ID>"
AUTH_GOOGLE_SECRET="<Google Client Secret>"

# Discord OAuth
AUTH_DISCORD_ID="<Discord Client ID>"
AUTH_DISCORD_SECRET="<Discord Client Secret>"

# Steam OAuth
AUTH_STEAM_KEY="<Steam API Key>"

# PostgreSQL (vía @astrojs/db)
DATABASE_URL="postgresql://user:password@localhost:5432/007sama"

# Email (para verificación y password reset)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="<SendGrid API Key>"
EMAIL_FROM="noreply@007-sama.com"

# Site
SITE_URL="http://localhost:4321"
```

### Archivo `.env.example`

```bash
# .env.example (commiteado, sin valores sensibles)
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""
AUTH_STEAM_KEY=""
DATABASE_URL=""
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@007-sama.com"
SITE_URL="http://localhost:4321"
```

---

## 15. Esquema de Base de Datos

```ts
// src/db/schema.ts
import { pgTable, text, timestamp, boolean, integer, primaryKey } from 'drizzle-orm/pg-core';

// ─── Usuarios ──────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),       // null para usuarios OAuth puros
  emailVerified: timestamp('email_verified', { mode: 'date' }), // null si no verificado
  image: text('image'),                       // URL de avatar
  tokenVersion: integer('token_version').notNull().default(0), // Para revocación de JWT
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// ─── Cuentas OAuth ─────────────────────────────────────
export const accounts = pgTable('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),               // 'oauth' | 'credentials'
  provider: text('provider').notNull(),        // 'google' | 'discord' | 'steam'
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  providerAccountIdUnique: unique().on(table.provider, table.providerAccountId),
}));

// ─── Sesiones (solo para estrategia database, no JWT) ─
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  sessionToken: text('session_token').notNull().unique(),
});

// ─── Tokens de verificación de email ───────────────────
export const verificationTokens = pgTable('verification_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),    // email
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

// ─── Tokens de reset de contraseña ────────────────────
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  hashedToken: text('hashed_token').notNull(),  // sha256(token)
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// ─── Rate limiting ─────────────────────────────────────
export const loginAttempts = pgTable('login_attempts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ip: text('ip').notNull(),
  success: boolean('success').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});
```

---

## Apéndice A: Checklist de Implementación de Auth

- [ ] **Auth.js instalado**: `auth-astro` + `@auth/core` en `package.json`
- [ ] **Configuración en `astro.config.mjs`**: integración `auth()`, output `hybrid`, adapter Vercel
- [ ] **`src/auth.ts`**: proveedores configurados (Credentials, Google, Discord, Steam)
- [ ] **Variables de entorno**: `AUTH_SECRET`, tokens OAuth, `DATABASE_URL`
- [ ] **Middleware**: `src/middleware.ts` con protección de rutas privadas
- [ ] **Tipos en `env.d.ts`**: `App.Locals` con `session` y `user`
- [ ] **Esquema de BD**: tablas `users`, `accounts`, `verificationTokens`, `passwordResetTokens`
- [ ] **Página de login**: `/auth/login` con formulario y botones OAuth
- [ ] **Página de registro**: `/auth/register` con validación Zod
- [ ] **Flujo de verificación de email**: token + email + endpoint de confirmación
- [ ] **Recuperación de contraseña**: forgot-password + reset-password con token expiry
- [ ] **Página de error de auth**: `/auth/error` con mensajes descriptivos
- [ ] **Dashboard protegido**: `/account/*` con SSR + middleware
- [ ] **Rate limiting**: tabla `loginAttempts` + verificación en login
- [ ] **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options
- [ ] **Logout**: POST a `/api/auth/signout` con CSRF token
- [ ] **Registro OAuth apps**: Google Cloud Console, Discord Developer Portal, Steam API
- [ ] **Test de flujo completo**: registro → verificación email → login → dashboard → logout

---

## Apéndice B: Resolución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| `AUTH_SECRET missing` | Variable de entorno no definida | Generar con `openssl rand -base64 32` y agregar a `.env` |
| OAuth redirects to `http://localhost` en prod | `AUTH_URL` incorrecta | Verificar `AUTH_URL` en entorno de producción |
| `OAuthCallback` error | Redirect URI no configurada en proveedor | Verificar URI exacta en consola del proveedor |
| Steam login no devuelve email | Steam no provee email | Manejar `email: null` en perfil de usuario |
| JWT no se invalida al cambiar password | `tokenVersion` no se actualiza | Implementar callback `jwt` con verificación de `tokenVersion` |
| Cookie no se establece en producción | Falta `secure: true` o HTTPS no configurado | Verificar SSL/TLS y config Vercel |
| CSRF error en POST | Token CSRF no coincide | Verificar que formulario incluye `csrfToken` de Auth.js |
| `getSession()` retorna null en middleware | Cookie no se envía (sameSite, path) | Verificar configuración de cookies y dominio |
