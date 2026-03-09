import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ReviewList } from '@/components/reviews/review-list';

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

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false });

  return (
    <Box>
      <PageHeader
        title="Reviews"
        subtitle="All customer feedback in one place"
      />
      <ReviewList reviews={reviews ?? []} isOwner={member.role === 'owner'} />
    </Box>
  );
}
