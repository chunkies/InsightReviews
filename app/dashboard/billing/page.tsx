import { Box, Paper, Typography, Chip, Divider } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, Check, Shield, Zap, Users, MessageSquare, Star } from 'lucide-react';
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
  const isActive = org.billing_plan === 'active';
  const trialDaysLeft = org.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const chipLabel = isTrialing
    ? `Trial — ${trialDaysLeft} days left`
    : isActive
      ? 'Active'
      : org.billing_plan === 'past_due'
        ? 'Past Due'
        : org.billing_plan === 'cancelled'
          ? 'Cancelled'
          : org.billing_plan;

  const chipColor: 'warning' | 'success' | 'error' = isTrialing
    ? 'warning'
    : isActive
      ? 'success'
      : 'error';

  const features = [
    { icon: Star, label: 'Smart review routing to Google, Yelp & more' },
    { icon: Shield, label: 'Private negative review capture' },
    { icon: MessageSquare, label: 'SMS & QR code review collection' },
    { icon: Users, label: 'Unlimited staff accounts' },
    { icon: Zap, label: 'Testimonial wall for your website' },
  ];

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Billing</Typography>
          <Typography variant="body2" color="text.secondary">Manage your subscription and payment</Typography>
        </Box>

        <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: isActive
                ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CreditCard size={28} color="white" />
          </Box>

          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
            Current Plan
          </Typography>

          <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>
            $29
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            per month, per location
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip label={chipLabel} color={chipColor} />
          </Box>

          {org.billing_plan === 'past_due' && (
            <Typography variant="body2" color="error" sx={{ mb: 2, px: 2 }}>
              Your last payment failed. Please update your payment method to avoid service interruption.
            </Typography>
          )}

          <BillingActions
            orgId={org.id}
            hasSubscription={!!org.stripe_customer_id}
            billingPlan={org.billing_plan}
          />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            What&apos;s included
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {features.map(({ icon: Icon, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    backgroundColor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                </Box>
                <Typography variant="body2">{label}</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <Check size={16} color="#16a34a" />
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
