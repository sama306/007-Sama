export const prerender = false

import type { APIRoute } from 'astro'
import { z } from 'astro/zod'
import { findUserByEmail, createUser } from '@lib/users'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[A-Z]/, 'Debe contener una mayúscula.')
    .regex(/[0-9]/, 'Debe contener un número.'),
})

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          details: parsed.error.issues.map((i) => ({
            field: i.path[0],
            message: i.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { name, email, password } = parsed.data

    const existing = await findUserByEmail(email)
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'EMAIL_EXISTS', message: 'Este email ya está registrado.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const user = await createUser(name, email, password)

    return new Response(JSON.stringify({ success: true, message: 'Usuario creado', user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[register]', err)
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', message: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
