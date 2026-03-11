import { Box, Container, Paper, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscribeButton } from './subscribe-button';
import { hasValidBilling } from '@/lib/utils/admin';

const tierConfig = {
  starter: { name: 'Starter', price: '$79', features: ['1 location', '200 SMS/mo', '3 staff accounts', 'Smart routing', 'Dashboard & analytics', 'Testimonial wall'] },
  growth: { name: 'Growth', price: '$149', features: ['Up to 3 locations', '1,000 SMS/mo', '10 staff accounts', 'Auto-sync', 'Custom themes', 'Webhook integrations'] },
  agency: { name: 'Agency', price: '$249', features: ['5+ locations ($49/extra)', 'Unlimited SMS', 'Unlimited staff', 'White-label branding', 'Priority support', 'Dedicated account manager'] },
} as const;

type TierKey = keyof typeof tierConfig;

interface PageProps {
  searchParams: Promise<{ org?: string; tier?: string }>;
}

export default async function SubscribePage({ searchParams }: PageProps) {
  const { org: orgId, tier: tierParam } = await searchParams;
  const tier: TierKey = (tierParam && tierParam in tierConfig) ? tierParam as TierKey : 'starter';
  const selectedTier = tierConfig[tier];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Always verify user is a member of the org they're trying to subscribe for
  const memberQuery = orgId
    ? supabase.from('organization_members').select('organization_id').eq('organization_id', orgId).eq('user_id', user.id).maybeSingle()
    : supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle();

  const { data: member } = await memberQuery;
  const organizationId = member?.organization_id;

  if (!organizationId) redirect('/onboarding');

  // Check if they actually need to subscribe
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, billing_plan, trial_ends_at')
    .eq('id', organizationId)
    .single();

  if (!org) redirect('/onboarding');

  if (hasValidBilling(org.billing_plan, org.trial_ends_at, user.email)) {
    redirect('/dashboard');
  }
  const isTrialExpired = org.billing_plan === 'trial' && org.trial_ends_at && new Date(org.trial_ends_at) < new Date();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eff6ff 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Start Your Free Trial
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Get 14 days free to try InsightReviews for <strong>{org.name}</strong>.
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            No charge during your trial. Cancel anytime.
          </Typography>

          <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 700, color: 'primary.main' }}>
              {selectedTier.name} Plan
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {selectedTier.price}<Typography component="span" color="text.secondary" variant="body1">/month</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              After your 14-day free trial
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'left', mb: 3 }}>
            {selectedTier.features.map((feature) => (
              <Typography key={feature} variant="body2" sx={{ py: 0.5 }}>
                ✓ {feature}
              </Typography>
            ))}
          </Box>

          <SubscribeButton orgId={org.id} tier={tier} />

          {org.billing_plan === 'cancelled' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Your subscription was cancelled. Subscribe again to regain access.
            </Typography>
          )}
          {isTrialExpired && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Your free trial has expired. Subscribe to continue using InsightReviews.
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
