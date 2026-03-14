import { Box, Container, Paper, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscribeButton } from './subscribe-button';
import { CheckCircle2 } from 'lucide-react';

const features = [
  'Smart review routing to Google, Yelp & more',
  'QR code + SMS review collection',
  'Real-time dashboard & analytics',
  'Auto-sync with review platforms',
  'Public testimonial wall',
  'Private negative feedback capture',
  'Staff accounts & team management',
  'Email & SMS notifications',
  'Custom branding',
];

interface PageProps {
  searchParams: Promise<{ org?: string }>;
}

export default async function SubscribePage({ searchParams }: PageProps) {
  const { org: orgId } = await searchParams;

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

  // Get org details
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, billing_plan, stripe_subscription_id, trial_ends_at')
    .eq('id', organizationId)
    .single();

  if (!org) redirect('/onboarding');

  // If they have a valid trial or active sub, send them to dashboard
  const trialStillActive = org.trial_ends_at && new Date(org.trial_ends_at) > new Date();
  const hasActiveTrial = (org.billing_plan === 'trial' || org.billing_plan === 'cancelling') && trialStillActive;
  const hasActiveSub = org.billing_plan === 'active' && org.stripe_subscription_id;
  if (hasActiveTrial || hasActiveSub) {
    redirect('/dashboard');
  }

  const isPending = org.billing_plan === 'pending';
  // Anyone who's had a trial or subscription before is a returning user — no new trial
  const isReturning = !isPending && org.billing_plan !== 'trial';

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
            {isReturning ? 'Subscribe to Continue' : 'Start Your Free Trial'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {isReturning
              ? <>Reactivate your account for <strong>{org.name}</strong>.</>
              : <>Get 14 days free to try InsightReviews for <strong>{org.name}</strong>.</>
            }
          </Typography>

          <Box sx={{ mb: 3, p: 3, borderRadius: 2, backgroundColor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
              <Typography variant="h3" fontWeight={800}>$79</Typography>
              <Typography variant="h6" color="text.secondary">/mo</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {isReturning
                ? 'Cancel anytime — no lock-in'
                : 'after your 14-day free trial · cancel anytime'
              }
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'left', mb: 3 }}>
            {features.map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <CheckCircle2 size={16} color="#2563eb" />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>

          <SubscribeButton orgId={org.id} isReturning={isReturning} />

          {isReturning && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {org.billing_plan === 'cancelled'
                ? 'Your subscription was cancelled. Subscribe again to regain access.'
                : org.billing_plan === 'past_due'
                  ? 'Your last payment failed. Update your payment method to continue.'
                  : 'Your free trial has ended. Subscribe to continue using InsightReviews.'}
            </Typography>
          )}
          {isPending && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Complete your setup by adding a payment method. 14-day free trial — no charge today.
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
