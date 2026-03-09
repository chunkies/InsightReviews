import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { computeReviewStats, timeAgo } from '@/lib/utils/dashboard-stats';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const orgId = member.organization_id;

  // Fetch org settings (for positive_threshold), stats data, and recent reviews
  const [orgRes, reviewsRes, requestsRes, recentRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('positive_threshold')
      .eq('id', orgId)
      .single(),
    supabase
      .from('reviews')
      .select('id, rating, created_at')
      .eq('organization_id', orgId),
    supabase
      .from('review_requests')
      .select('id, status')
      .eq('organization_id', orgId),
    supabase
      .from('reviews')
      .select('id, rating, comment, customer_name, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const positiveThreshold = orgRes.data?.positive_threshold ?? 4;
  const reviews = reviewsRes.data ?? [];
  const requests = requestsRes.data ?? [];
  const recentReviews = (recentRes.data ?? []).map((r) => ({
    name: r.customer_name || 'Anonymous',
    rating: r.rating,
    time: timeAgo(r.created_at),
    comment: r.comment || '',
  }));

  const stats = computeReviewStats(reviews, requests, positiveThreshold);

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Overview of your review performance" />
      <DashboardStats stats={stats} recentReviews={recentReviews} />
    </Box>
  );
}
