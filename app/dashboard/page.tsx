import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

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

  // Fetch stats
  const [reviewsRes, requestsRes] = await Promise.all([
    supabase.from('reviews').select('id, rating, created_at').eq('organization_id', orgId),
    supabase.from('review_requests').select('id, status').eq('organization_id', orgId),
  ]);

  const reviews = reviewsRes.data ?? [];
  const requests = requestsRes.data ?? [];

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;
  const positiveCount = reviews.filter(r => r.rating >= 4).length;
  const positivePercentage = totalReviews > 0 ? (positiveCount / totalReviews) * 100 : 0;
  const totalRequests = requests.length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const responseRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

  // This week vs last week
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thisWeek = reviews.filter(r => new Date(r.created_at) >= weekAgo).length;
  const lastWeek = reviews.filter(r => {
    const d = new Date(r.created_at);
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Overview of your review performance" />
      <DashboardStats
        stats={{
          totalReviews,
          averageRating: Math.round(avgRating * 10) / 10,
          positivePercentage: Math.round(positivePercentage),
          totalRequests,
          responseRate: Math.round(responseRate),
          thisWeekReviews: thisWeek,
          lastWeekReviews: lastWeek,
        }}
      />
    </Box>
  );
}
