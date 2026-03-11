export const STRIPE_CONFIG = {
  priceId: process.env.STRIPE_PRICE_ID_STARTER || process.env.STRIPE_PRICE_ID!,
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?billing=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
  portalReturnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
} as const;
