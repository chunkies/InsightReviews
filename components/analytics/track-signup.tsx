'use client';

import { useEffect, useRef } from 'react';
import { trackConversion } from '@/lib/analytics/tracking';

export function TrackSignup() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackConversion('signup');
  }, []);

  return null;
}
