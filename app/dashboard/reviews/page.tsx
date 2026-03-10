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

  // Parallel queries
  const [orgRes, reviewsRes, externalRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('email, name, slug')
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
  ]);

  return (
    <Box>
      <PageHeader
        title="Reviews"
        subtitle="All customer feedback in one place"
      />
      <ReviewsPageContent
        reviews={reviewsRes.data || []}
        externalReviews={externalRes.data || []}
        isOwner={member.role === 'owner'}
        orgEmail={orgRes.data?.email ?? null}
        orgName={orgRes.data?.name ?? ''}
        orgSlug={orgRes.data?.slug ?? ''}
      />
    </Box>
  );
}
