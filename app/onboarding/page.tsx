import { Box, Container, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { TrackSignup } from '@/components/analytics/track-signup';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // If already has org, go to dashboard
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (member) redirect('/dashboard');

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
          Set Up Your Business
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Let&apos;s get your review collection up and running in 2 minutes.
        </Typography>
        <OnboardingWizard userId={user.id} initialName={user.user_metadata?.full_name ?? ''} />
        <TrackSignup />
      </Box>
    </Container>
  );
}
