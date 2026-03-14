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

  const isTrialing = billingPlan === 'trial';
  const isActive = billingPlan === 'active';
  const isCancelling = billingPlan === 'cancelling';
  const isCancelled = billingPlan === 'cancelled';
  const isPending = billingPlan === 'pending';

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

  async function handleCancelTrial() {
    setLoading(true);
    setCancelDialogOpen(false);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, cancelTrial: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.error || 'Failed to cancel', 'error');
        return;
      }
      showSnackbar('Trial cancelled. You can resubscribe anytime.', 'success');
      window.location.reload();
    } catch {
      showSnackbar('Failed to connect to billing service', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
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

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Trial: only show Cancel Trial */}
        {isTrialing && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setCancelDialogOpen(true)}
            disabled={loading}
          >
            Cancel Trial
          </Button>
        )}

        {/* Active paid: show Manage + Cancel */}
        {isActive && hasActiveSubscription && (
          <>
            <Button
              variant="outlined"
              startIcon={<ExternalLink size={16} />}
              onClick={handlePortal}
              disabled={loading}
            >
              Manage Billing
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setCancelDialogOpen(true)}
              disabled={loading}
            >
              Cancel Subscription
            </Button>
          </>
        )}

        {/* Cancelling: show Resubscribe + Manage */}
        {isCancelling && (
          <>
            <Button
              variant="contained"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Resubscribe'}
            </Button>
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
          </>
        )}

        {/* Cancelled or Pending: show Subscribe */}
        {(isCancelled || isPending) && (
          <Button
            variant="contained"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Subscribe Now — $79/mo'}
          </Button>
        )}
      </Box>

      {/* Cancel dialog — different message for trial vs paid */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title={isTrialing ? 'Cancel Free Trial' : 'Cancel Subscription'}
        message={
          isTrialing
            ? 'Are you sure you want to cancel your free trial? You\'ll lose access to all features immediately.'
            : 'Are you sure you want to cancel? You\'ll keep access until the end of your current billing period, then your account will be deactivated.'
        }
        confirmLabel={isTrialing ? 'Yes, Cancel Trial' : 'Yes, Cancel'}
        onConfirm={isTrialing ? handleCancelTrial : handleCancelSubscription}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </>
  );
}
