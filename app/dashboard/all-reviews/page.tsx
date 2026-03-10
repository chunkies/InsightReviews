import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { UnifiedReviewList } from '@/components/integrations/unified-review-list';

export default async function AllReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  // Fetch internal reviews
  const { data: internalReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false });

  // Fetch external reviews
  const { data: externalReviews } = await supabase
    .from('external_reviews')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('review_date', { ascending: false });

  // Fetch integrations for platform info
  const { data: integrations } = await supabase
    .from('organization_integrations')
    .select('id, platform, platform_account_name')
    .eq('organization_id', member.organization_id);

  return (
    <Box>
      <PageHeader
        title="All Reviews"
        subtitle="Unified view of reviews from all platforms"
      />
      <UnifiedReviewList
        internalReviews={internalReviews ?? []}
        externalReviews={externalReviews ?? []}
        integrations={integrations ?? []}
        isOwner={member.role === 'owner'}
      />
    </Box>
  );
}
