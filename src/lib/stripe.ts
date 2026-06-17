import Stripe from 'stripe';
import { getCollection } from 'astro:content';
import type { CartItem } from '@/types/cart';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(items: CartItem[], origin: string) {
  const games = await getCollection('games');

  const line_items = items.map((item) => {
    const game = games.find((g) => g.data.slug === item.slug);
    if (!game) {
      throw new Error(`Game not found: ${item.slug}`);
    }

    const discountedPrice = game.data.price * (1 - game.data.discount / 100);
    const unitAmount = Math.round(discountedPrice * 100);

    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: game.data.title,
          images: game.data.images.length > 0 ? [game.data.images[0]] : [],
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });

  const metadataItems = items.map((i) => ({
    slug: i.slug,
    quantity: i.quantity,
    platform: i.platform,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    success_url: `${origin}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: {
      items: JSON.stringify(metadataItems),
    },
  });

  return session;
}
