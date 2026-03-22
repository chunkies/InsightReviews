/**
 * Safely read an environment variable, stripping trailing whitespace and newlines.
 *
 * Vercel env vars set via `echo "val" | vercel env add` get a trailing \n,
 * which silently breaks API keys and URLs. This function prevents that.
 *
 * IMPORTANT: Do NOT use this for NEXT_PUBLIC_ vars in client/browser code.
 * Next.js replaces `process.env.NEXT_PUBLIC_X` at build time via string
 * substitution — it only works with direct property access, not dynamic
 * lookups like `process.env[key]`. Use this only in server-side code
 * (API routes, middleware, server components).
 */
export function env(key: string): string {
  const raw = process.env[key] ?? '';
  return raw.replace(/[\s\n\r]+$/, '');
}

/**
 * Like env() but throws if the value is empty after trimming.
 */
export function envRequired(key: string): string {
  const value = env(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
