'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackConversion } from '@/lib/analytics/tracking';

export function BillingSuccessSync() {
  const searchParams = useSearchParams();
  const synced = useRef(false);

  useEffect(() => {
    if (searchParams.get('billing') !== 'success' || synced.current) return;
    synced.current = true;

    // Fire conversion events for trial start / purchase
    trackConversion('trial_started', { value: 0, currency: 'AUD' });

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
