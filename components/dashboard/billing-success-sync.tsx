'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export function BillingSuccessSync() {
  const searchParams = useSearchParams();
  const synced = useRef(false);

  useEffect(() => {
    if (searchParams.get('billing') !== 'success' || synced.current) return;
    synced.current = true;

    fetch('/api/stripe/sync', { method: 'POST' })
      .then((res) => res.json())
      .then(() => {
        // Hard reload to /dashboard so server layout re-checks billing with fresh DB state
        window.location.replace('/dashboard');
      })
      .catch(() => {
        window.location.replace('/dashboard');
      });
  }, [searchParams]);

  return null;
}
