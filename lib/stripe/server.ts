import Stripe from 'stripe';
import { envRequired } from '@/lib/utils/env';

function createStripeClient(): Stripe {
  return new Stripe(envRequired('STRIPE_SECRET_KEY'), {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });
}

export { createStripeClient };
