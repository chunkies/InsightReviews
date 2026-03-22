import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { buildDigestEmailHtml, buildDigestEmailText } from '@/lib/email/templates/weekly-digest';
import type { DigestData } from '@/lib/email/templates/weekly-digest';
import { envRequired } from '@/lib/utils/env';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient(
    envRequired('NEXT_PUBLIC_SUPABASE_URL'),
    envRequired('SUPABASE_SERVICE_ROLE_KEY'),
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();

  // Get all organizations with digest enabled and an email set
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug, email, positive_threshold')
    .eq('digest_enabled', true)
    .not('email', 'is', null);

  if (orgsError) {
    console.error('Failed to fetch organizations:', orgsError.message);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }

  if (!orgs || orgs.length === 0) {
    return NextResponse.json({ message: 'No organizations with digest enabled', sent: 0 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sinceDate = sevenDaysAgo.toISOString();

  let sentCount = 0;
  let errorCount = 0;

  for (const org of orgs) {
    try {
      // Fetch reviews from the past 7 days
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, customer_name, is_positive, created_at')
        .eq('organization_id', org.id)
        .gte('created_at', sinceDate)
        .order('rating', { ascending: false });

      const weekReviews = reviews ?? [];
      const newReviewsCount = weekReviews.length;

      // Compute stats
      const totalRating = weekReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = newReviewsCount > 0 ? totalRating / newReviewsCount : 0;

      const positiveCount = weekReviews.filter((r) => r.is_positive).length;
      const negativeCount = weekReviews.filter((r) => !r.is_positive).length;

      // Best review: highest rated with a comment
      const bestReview = weekReviews.find((r) => r.is_positive && r.comment);
      // Worst review: lowest rated with a comment
      const worstReview = [...weekReviews].reverse().find((r) => !r.is_positive && r.comment);

      const digestData: DigestData = {
        businessName: org.name,
        newReviewsCount,
        averageRating,
        positiveCount,
        negativeCount,
        bestReview: bestReview
          ? { rating: bestReview.rating, comment: bestReview.comment!, customerName: bestReview.customer_name }
          : null,
        worstReview: worstReview
          ? { rating: worstReview.rating, comment: worstReview.comment!, customerName: worstReview.customer_name }
          : null,
        dashboardUrl: `${siteUrl}/dashboard`,
      };

      const html = buildDigestEmailHtml(digestData);
      const text = buildDigestEmailText(digestData);
      const subject = `Weekly Review Digest - ${org.name}`;

      // Send via same email mechanism as the rest of the app
      const supabaseUrl = envRequired('NEXT_PUBLIC_SUPABASE_URL');
      const serviceRoleKey = envRequired('SUPABASE_SERVICE_ROLE_KEY');

      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: org.email,
          subject,
          html,
          text,
        }),
      });

      if (res.ok) {
        sentCount++;
      } else {
        // In development, log and count as sent
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DIGEST-DEV] To: ${org.email} | Subject: ${subject}`);
          sentCount++;
        } else {
          console.error(`Failed to send digest to ${org.email}: ${res.statusText}`);
          errorCount++;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing digest for org ${org.id}: ${message}`);
      errorCount++;
    }
  }

  return NextResponse.json({
    message: 'Weekly digest complete',
    sent: sentCount,
    errors: errorCount,
    total: orgs.length,
  });
}
