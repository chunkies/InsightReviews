import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // IMPORTANT: Must use process.env.NEXT_PUBLIC_X directly — Next.js replaces
  // these at build time. Using a helper like envRequired() breaks this because
  // the bundler can't see the direct property access.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
