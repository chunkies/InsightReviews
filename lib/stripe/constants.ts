import { envRequired } from '@/lib/utils/env';

const siteUrl = envRequired('NEXT_PUBLIC_SITE_URL');

export const STRIPE_CONFIG = {
  priceId: envRequired('STRIPE_PRICE_ID'),
  successUrl: `${siteUrl}/dashboard?billing=success`,
  cancelUrl: `${siteUrl}/dashboard/billing`,
  portalReturnUrl: `${siteUrl}/dashboard/billing`,
} as const;
