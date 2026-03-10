import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ReviewsPageContent } from '@/components/reviews/reviews-page-content';

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  // Parallel queries for all data
  const [orgRes, reviewsRes, externalRes, integrationsRes, reviewCountsRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('email, name, slug, address')
      .eq('id', member.organization_id)
      .single(),
    supabase
      .from('reviews')
      .select('*')
      .eq('organization_id', member.organization_id)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('external_reviews')
      .select('*')
      .eq('organization_id', member.organization_id)
      .order('review_date', { ascending: false })
      .limit(500),
    supabase
      .from('organization_integrations')
      .select('*')
      .eq('organization_id', member.organization_id),
    supabase
      .from('external_reviews')
      .select('platform')
      .eq('organization_id', member.organization_id),
  ]);

  const countByPlatform: Record<string, number> = {};
  (reviewCountsRes.data || []).forEach((r: { platform: string }) => {
    countByPlatform[r.platform] = (countByPlatform[r.platform] || 0) + 1;
  });

  return (
    <Box>
      <PageHeader
        title="Reviews"
        subtitle="All customer feedback in one place"
      />
      <ReviewsPageContent
        reviews={reviewsRes.data || []}
        externalReviews={externalRes.data || []}
        integrations={integrationsRes.data || []}
        reviewCounts={countByPlatform}
        isOwner={member.role === 'owner'}
        orgEmail={orgRes.data?.email ?? null}
        orgName={orgRes.data?.name ?? ''}
        orgSlug={orgRes.data?.slug ?? ''}
        orgAddress={orgRes.data?.address ?? ''}
        organizationId={member.organization_id}
      />
    </Box>
  );
}
