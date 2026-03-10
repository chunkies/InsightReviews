import { Box, Paper, Typography, Chip } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { CreditCard } from 'lucide-react';
import { BillingActions } from '@/components/settings/billing-actions';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'owner') redirect('/dashboard');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, billing_plan, trial_ends_at, stripe_customer_id')
    .eq('id', member.organization_id)
    .single();

  if (!org) redirect('/onboarding');

  const isTrialing = org.billing_plan === 'trial';
  const trialDaysLeft = org.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Box>
      <PageHeader title="Billing" subtitle="Manage your subscription" />
      <Paper sx={{ p: 3, mb: 3, maxWidth: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CreditCard size={24} />
          <Typography variant="h6">Current Plan</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>$29</Typography>
          <Typography color="text.secondary">/month per location</Typography>
        </Box>
        <Chip
          label={isTrialing ? `Trial — ${trialDaysLeft} days left` : org.billing_plan}
          color={isTrialing ? 'warning' : org.billing_plan === 'active' ? 'success' : 'error'}
          sx={{ mb: 2, textTransform: 'capitalize' }}
        />
        <BillingActions
          orgId={org.id}
          hasSubscription={!!org.stripe_customer_id}
          billingPlan={org.billing_plan}
        />
        {org.billing_plan === 'past_due' && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Your last payment failed. Please update your payment method to avoid service interruption.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
