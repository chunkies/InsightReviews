const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();

export const STRIPE_CONFIG = {
  priceId: process.env.STRIPE_PRICE_ID!,
  successUrl: `${siteUrl}/dashboard?billing=success`,
  cancelUrl: `${siteUrl}/dashboard/billing`,
  portalReturnUrl: `${siteUrl}/dashboard/billing`,
} as const;
