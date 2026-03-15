import Stripe from 'stripe';

function createStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });
}

export { createStripeClient };
