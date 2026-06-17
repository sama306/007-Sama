import type { APIRoute } from 'astro'
import { stripe } from '@lib/stripe'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      import.meta.env.STRIPE_WEBHOOK_SECRET,
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const metadata = session.metadata
      console.log('[Stripe Webhook] Checkout session completed:', {
        id: session.id,
        email: session.customer_details?.email,
        amount_total: session.amount_total,
        currency: session.currency,
        items: metadata?.items ? JSON.parse(metadata.items) : [],
      })
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
