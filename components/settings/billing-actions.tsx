'use client';

import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { ExternalLink } from 'lucide-react';
import { useSnackbar } from '@/components/providers/snackbar-provider';

interface BillingActionsProps {
  orgId: string;
  hasSubscription: boolean;
  billingPlan: string;
}

export function BillingActions({ orgId, hasSubscription, billingPlan }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.error || 'Failed to create checkout session', 'error');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return; // Don't reset loading — page is navigating
      }
      showSnackbar('No checkout URL returned', 'error');
    } catch {
      showSnackbar('Failed to connect to billing service', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.error || 'Failed to open billing portal', 'error');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      showSnackbar('No portal URL returned', 'error');
    } catch {
      showSnackbar('Failed to connect to billing service', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {billingPlan === 'trial' || billingPlan === 'cancelled' ? (
        <Button
          variant="contained"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Subscribe Now'}
        </Button>
      ) : null}
      {hasSubscription && (
        <Button
          variant="outlined"
          startIcon={<ExternalLink size={16} />}
          onClick={handlePortal}
          disabled={loading}
        >
          Manage Billing
        </Button>
      )}
    </Box>
  );
}
