'use client';

import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { ExternalLink } from 'lucide-react';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface BillingActionsProps {
  orgId: string;
  hasSubscription: boolean;
  hasActiveSubscription: boolean;
  billingPlan: string;
}

export function BillingActions({ orgId, hasSubscription, hasActiveSubscription, billingPlan }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
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
        return;
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

  async function handleCancel() {
    setLoading(true);
    setCancelDialogOpen(false);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.error || 'Failed to cancel subscription', 'error');
        return;
      }
      showSnackbar('Subscription cancelled. You will retain access until the end of your billing period.', 'success');
      window.location.reload();
    } catch {
      showSnackbar('Failed to connect to billing service', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Show "Subscribe Now" if no active sub, or cancelling (they can resubscribe)
  const showSubscribe = !hasActiveSubscription && (billingPlan === 'trial' || billingPlan === 'cancelled' || billingPlan === 'pending')
    || billingPlan === 'cancelling';

  // Show "Manage Billing" if they have a Stripe customer (can view invoices, update payment)
  const showManage = hasSubscription && (hasActiveSubscription || billingPlan === 'cancelling');

  // Show "Cancel" only if they have an active Stripe subscription and haven't already cancelled
  const showCancel = hasActiveSubscription && (billingPlan === 'active' || billingPlan === 'trial');

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {showSubscribe && (
          <Button
            variant="contained"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Subscribe Now'}
          </Button>
        )}
        {showManage && (
          <Button
            variant="outlined"
            startIcon={<ExternalLink size={16} />}
            onClick={handlePortal}
            disabled={loading}
          >
            Manage Billing
          </Button>
        )}
        {showCancel && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setCancelDialogOpen(true)}
            disabled={loading}
          >
            Cancel Subscription
          </Button>
        )}
      </Box>
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancel Subscription"
        message="Are you sure you want to cancel? You'll keep access until the end of your current billing period, then your account will be deactivated."
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </>
  );
}
