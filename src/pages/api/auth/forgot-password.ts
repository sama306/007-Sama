export const prerender = false

import type { APIRoute } from 'astro'
import { z } from 'astro/zod'
import { findUserByEmail } from '@lib/users'
import { generateResetToken, isRateLimited, incrementRateLimit } from '@lib/tokens'
import { sendPasswordResetEmail } from '@lib/email'

const forgotSchema = z.object({
  email: z.string().email('Email inválido.'),
})

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = clientAddress || 'unknown'

    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMIT', message: 'Esperá 15 minutos antes de intentar de nuevo.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const body = await request.json()
    const parsed = forgotSchema.safeParse(body)

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

    const { email } = parsed.data

    incrementRateLimit(ip)

    const user = await findUserByEmail(email)

    if (user) {
      const token = generateResetToken(email)
      const result = await sendPasswordResetEmail(email, token)

      if (!result.success) {
        console.error('[forgot-password] Error sending email for', email, result.error)
      } else {
        console.log('[forgot-password] Email sent to', email)
      }
    } else {
      console.log('[forgot-password] Email not found:', email)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Si el email existe, recibirás un correo con instrucciones para restablecer tu contraseña.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[forgot-password]', err)
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', message: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
