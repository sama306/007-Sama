import type { APIRoute } from 'astro'
import { encode } from '@auth/core/jwt'
import { findUserByEmail, verifyPassword } from '@lib/users'

export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
  const contentType = request.headers.get('content-type') || ''

  let email: string | undefined
  let password: string | undefined

  if (contentType.includes('application/json')) {
    const body = await request.json()
    email = body.email
    password = body.password
  } else {
    const formData = await request.formData()
    email = formData.get('email') as string
    password = formData.get('password') as string
  }

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email y contraseña son requeridos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secret = import.meta.env.AUTH_SECRET
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const useSecure = request.url.startsWith('https')
  const cookiePrefix = useSecure ? '__Secure-' : ''

  const token = {
    name: user.name,
    email: user.email,
    picture: user.image,
    sub: user.id,
    id: user.id,
    role: user.role || 'user',
  }

  const maxAge = 30 * 24 * 60 * 60
  const salt = `${cookiePrefix}authjs.session-token`

  const jwtToken = await encode({ token, secret, salt, maxAge })

  cookies.set(`${cookiePrefix}authjs.session-token`, jwtToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: useSecure,
    maxAge,
  })

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
