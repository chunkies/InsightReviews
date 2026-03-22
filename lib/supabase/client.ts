import { createBrowserClient } from '@supabase/ssr';
import { envRequired } from '@/lib/utils/env';

export function createClient() {
  return createBrowserClient(
    envRequired('NEXT_PUBLIC_SUPABASE_URL'),
    envRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}
