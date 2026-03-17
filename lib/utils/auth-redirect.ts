/**
 * Build the auth callback redirect URL with optional Vercel deployment
 * protection bypass. This ensures magic links and staff invites work
 * on Vercel preview deployments that have deployment protection enabled.
 *
 * Set NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS in Vercel env vars to the
 * bypass secret from: Dashboard → Settings → Deployment Protection.
 */
export function buildAuthRedirectUrl(baseUrl: string, next?: string): string {
  const url = new URL('/auth/confirm', baseUrl);

  if (next) {
    url.searchParams.set('next', next);
  }

  const bypassSecret = process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS;
  if (bypassSecret) {
    url.searchParams.set('x-vercel-protection-bypass', bypassSecret);
    url.searchParams.set('x-vercel-set-bypass-cookie', 'samesitefirst');
  }

  return url.toString();
}
