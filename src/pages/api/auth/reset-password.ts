export const prerender = false

import type { APIRoute } from 'astro'
import { z } from 'astro/zod'
import { findUserByEmail, updateUserPassword } from '@lib/users'
import { validateResetToken, consumeResetToken } from '@lib/tokens'

const resetSchema = z
  .object({
    token: z.string().min(1, 'Token requerido.'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .regex(/[A-Z]/, 'Debe contener una mayúscula.')
      .regex(/[0-9]/, 'Debe contener un número.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const parsed = resetSchema.safeParse(body)

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

    const { token, password } = parsed.data

    const validation = validateResetToken(token)

    if (!validation.valid || !validation.email) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_TOKEN',
          message: 'El link es inválido o expiró.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const user = await findUserByEmail(validation.email)

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'USER_NOT_FOUND',
          message: 'El usuario ya no existe.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    await updateUserPassword(validation.email, password)
    consumeResetToken(token)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[reset-password]', err)
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', message: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
