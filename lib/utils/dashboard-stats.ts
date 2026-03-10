import type { ReviewStats } from '@/lib/types/database';

interface ReviewRow {
  id: string;
  rating: number;
  created_at: string;
}

interface RequestRow {
  id: string;
  status: string;
}

/**
 * Compute dashboard stats from raw review and request rows.
 */
export function computeReviewStats(
  reviews: ReviewRow[],
  requests: RequestRow[],
  positiveThreshold: number,
  now: Date = new Date(),
): ReviewStats {
  const totalReviews = reviews.length;
  const totalRequests = requests.length;

  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const positiveCount = reviews.filter(
    (r) => r.rating >= positiveThreshold,
  ).length;
  const positivePercentage =
    totalReviews > 0 ? (positiveCount / totalReviews) * 100 : 0;

  const completedRequests = requests.filter(
    (r) => r.status === 'completed',
  ).length;
  const responseRate =
    totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekReviews = reviews.filter(
    (r) => new Date(r.created_at) >= weekAgo,
  ).length;
  const lastWeekReviews = reviews.filter((r) => {
    const d = new Date(r.created_at);
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;

  // NPS calculation: 5 stars = Promoter, 4 stars = Passive, 1-3 stars = Detractor
  const promoterCount = reviews.filter((r) => r.rating === 5).length;
  const passiveCount = reviews.filter((r) => r.rating === 4).length;
  const detractorCount = reviews.filter((r) => r.rating <= 3).length;

  const npsScore =
    totalReviews > 0
      ? Math.round(
          ((promoterCount - detractorCount) / totalReviews) * 100,
        )
      : null;

  return {
    totalReviews,
    averageRating: Math.round(avgRating * 10) / 10,
    positivePercentage: Math.round(positivePercentage),
    totalRequests,
    responseRate: Math.round(responseRate),
    thisWeekReviews,
    lastWeekReviews,
    npsScore,
    promoterCount,
    passiveCount,
    detractorCount,
  };
}

interface ChartRow {
  created_at: string;
}

/**
 * Build daily chart data for the last 30 days.
 */
export function buildDailyChartData(
  reviews: ChartRow[],
  requests: ChartRow[],
  now: Date = new Date(),
): Array<{ date: string; reviews: number; requests: number }> {
  const days = 30;
  const result: Array<{ date: string; reviews: number; requests: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, reviews: 0, requests: 0 });
  }

  for (const r of reviews) {
    const dateStr = new Date(r.created_at).toISOString().slice(0, 10);
    const entry = result.find((e) => e.date === dateStr);
    if (entry) entry.reviews++;
  }

  for (const r of requests) {
    const dateStr = new Date(r.created_at).toISOString().slice(0, 10);
    const entry = result.find((e) => e.date === dateStr);
    if (entry) entry.requests++;
  }

  // Format dates for display
  return result.map((e) => ({
    ...e,
    date: new Date(e.date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
  }));
}

/**
 * Format a timestamp into a human-readable relative time string.
 */
export function timeAgo(dateStr: string, now: Date = new Date()): string {
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

/**
 * Mask a phone number for display: show first 4 and last 3 digits.
 * e.g. "+61412345678" -> "+614 *** 678"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  const prefix = phone.startsWith('+') ? '+' : '';
  return `${prefix}${digits.slice(0, 3)} *** ${digits.slice(-3)}`;
}

/**
 * Mask an email for display: show first char + "***" + domain.
 * e.g. "john@example.com" -> "j***@example.com"
 */
export function maskEmail(email: string): string {
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return email;
  return `${email[0]}***${email.slice(atIdx)}`;
}
