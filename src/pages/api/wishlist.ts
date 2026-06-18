export const prerender = false

import type { APIRoute } from 'astro'
import { kvSmembers, kvSadd, kvSrem } from '@lib/kv'

function wishlistKey(userId: string): string {
  return `wishlist:${userId}`
}

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals
  if (!user) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const slugs = await kvSmembers(wishlistKey(user.id))
  return new Response(JSON.stringify({ slugs }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals
  if (!user) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = (await request.json()) as { action: 'add' | 'remove'; slug: string }
    const { action, slug } = body

    if (!slug || !['add', 'remove'].includes(action)) {
      return new Response(JSON.stringify({ error: 'INVALID_PAYLOAD' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const key = wishlistKey(user.id)

    if (action === 'add') {
      await kvSadd(key, slug)
    } else {
      await kvSrem(key, slug)
    }

    const slugs = await kvSmembers(key)
    return new Response(JSON.stringify({ slugs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[wishlist]', err)
    return new Response(JSON.stringify({ error: 'SERVER_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
