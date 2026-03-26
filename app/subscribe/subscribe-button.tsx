'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import { useSnackbar } from '@/components/providers/snackbar-provider';

export function SubscribeButton({ orgId, isReturning: _isReturning = false }: { orgId: string; isReturning?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.error || 'Failed to start checkout', 'error');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      showSnackbar('No checkout URL returned', 'error');
    } catch {
      showSnackbar('Failed to connect to billing service', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="contained"
      size="large"
      fullWidth
      onClick={handleSubscribe}
      disabled={loading}
      sx={{ py: 1.5, fontSize: '1.05rem', fontWeight: 700 }}
    >
      {loading ? 'Loading...' : 'Subscribe Now'}
    </Button>
  );
}
