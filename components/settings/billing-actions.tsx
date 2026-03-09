'use client';

import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { ExternalLink } from 'lucide-react';

interface BillingActionsProps {
  orgId: string;
  hasSubscription: boolean;
  billingPlan: string;
}

export function BillingActions({ orgId, hasSubscription, billingPlan }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  async function handlePortal() {
    setLoading(true);
    const res = await fetch('/api/stripe/create-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
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
