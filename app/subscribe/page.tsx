import { Box, Container, Paper, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscribeButton } from './subscribe-button';
import { hasValidBilling } from '@/lib/utils/admin';

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
            <Typography variant="h5" fontWeight={700}>
              $29<Typography component="span" color="text.secondary" variant="body1">/month per location</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              After your 14-day free trial
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'left', mb: 3 }}>
            {[
              'Unlimited review requests',
              'Smart routing to Google, Yelp, Facebook & more',
              'Private negative review capture',
              'Testimonial wall for your website',
              'Staff accounts for your team',
              'SMS review collection',
            ].map((feature) => (
              <Typography key={feature} variant="body2" sx={{ py: 0.5 }}>
                ✓ {feature}
              </Typography>
            ))}
          </Box>

          <SubscribeButton orgId={org.id} />

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
