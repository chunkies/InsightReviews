import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { StaffLeaderboard } from '@/components/dashboard/staff-leaderboard';
import type { StaffLeaderboardEntry } from '@/components/dashboard/staff-leaderboard';
import type { FunnelData } from '@/components/dashboard/review-funnel';
import { computeReviewStats, timeAgo, buildDailyChartData } from '@/lib/utils/dashboard-stats';

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

  // Get first day of current month for leaderboard filtering
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch org settings (for positive_threshold), stats data, recent reviews, and leaderboard data
  const [orgRes, reviewsRes, requestsRes, recentRes, leaderboardRequestsRes, orgMembersRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('positive_threshold')
      .eq('id', orgId)
      .single(),
    supabase
      .from('reviews')
      .select('id, rating, created_at, review_request_id, redirected_to')
      .eq('organization_id', orgId),
    supabase
      .from('review_requests')
      .select('id, status, created_at')
      .eq('organization_id', orgId),
    supabase
      .from('reviews')
      .select('id, rating, comment, customer_name, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(6),
    // Leaderboard: all review requests this month with their linked reviews
    supabase
      .from('review_requests')
      .select('id, sent_by, status')
      .eq('organization_id', orgId)
      .gte('created_at', monthStart)
      .not('sent_by', 'is', null),
    // Org members to map user_id to email/role
    supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId),
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
  const chartData = buildDailyChartData(reviews, requests);

  // Build funnel data — track ALL reviews through the pipeline
  const smsLinkedReviews = reviews.filter((r) => r.review_request_id !== null);
  const walkInReviews = reviews.filter((r) => r.review_request_id === null);
  const allPositiveReviews = reviews.filter((r) => r.rating >= positiveThreshold);
  const allRedirectedReviews = allPositiveReviews.filter(
    (r) => Array.isArray(r.redirected_to) && r.redirected_to.length > 0
  );

  const funnelData: FunnelData = {
    requestsSent: requests.length,
    reviewsReceived: smsLinkedReviews.length,
    positiveReviews: allPositiveReviews.length,
    redirectedToplatform: allRedirectedReviews.length,
    walkInReviews: walkInReviews.length,
  };

  // Build leaderboard data
  const leaderboardRequests = leaderboardRequestsRes.data ?? [];
  const orgMembers = orgMembersRes.data ?? [];

  // Create a map of user_id to role for display names
  const memberRoleMap = new Map<string, string>();
  for (const m of orgMembers) {
    memberRoleMap.set(m.user_id, m.role);
  }

  // Aggregate by sent_by
  const staffMap = new Map<string, { requestsSent: number; reviewsGenerated: number }>();
  for (const req of leaderboardRequests) {
    if (!req.sent_by) continue;
    const existing = staffMap.get(req.sent_by) || { requestsSent: 0, reviewsGenerated: 0 };
    existing.requestsSent += 1;
    if (req.status === 'completed') {
      existing.reviewsGenerated += 1;
    }
    staffMap.set(req.sent_by, existing);
  }

  // Convert to sorted array
  const leaderboardEntries: StaffLeaderboardEntry[] = Array.from(staffMap.entries())
    .map(([userId, data]) => {
      const role = memberRoleMap.get(userId);
      // Show role prefix + truncated user ID as display name
      const roleLabel = role === 'owner' ? 'Owner' : 'Staff';
      const shortId = userId.substring(0, 8);
      return {
        userId,
        displayName: `${roleLabel} (${shortId})`,
        requestsSent: data.requestsSent,
        reviewsGenerated: data.reviewsGenerated,
      };
    })
    .sort((a, b) => b.requestsSent - a.requestsSent);

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Overview of your review performance" />
      <DashboardStats stats={stats} recentReviews={recentReviews} chartData={chartData} funnelData={funnelData} />
      <StaffLeaderboard entries={leaderboardEntries} />
    </Box>
  );
}
