import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { TestimonialWall } from '@/components/testimonials/testimonial-wall';
import { mergeWallConfig } from '@/lib/types/wall-config';
import type { Metadata } from 'next';

export const revalidate = 300; // Cache for 5 minutes

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabaseClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', slug)
    .single();

  const name = org?.name || 'Business';
  return {
    title: `${name} — Customer Reviews`,
    description: `See what customers are saying about ${name}. Read real reviews from verified customers.`,
    openGraph: {
      title: `${name} — Customer Reviews`,
      description: `See what customers are saying about ${name}.`,
      type: 'website',
    },
  };
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  photo_url: string | null;
  created_at: string;
}

function buildJsonLd(orgName: string, reviews: ReviewRow[]) {
  const validReviews = reviews.filter((r) => r.rating > 0);
  const totalCount = validReviews.length;

  if (totalCount === 0) return null;

  const avgRating =
    validReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount;

  const reviewEntries = validReviews.slice(0, 10).map((r) => ({
    '@type': 'Review' as const,
    reviewRating: {
      '@type': 'Rating' as const,
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person' as const,
      name: r.customer_name || 'A customer',
    },
    ...(r.comment ? { reviewBody: r.comment } : {}),
    datePublished: r.created_at.split('T')[0],
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: orgName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.round(avgRating * 10) / 10,
      bestRating: 5,
      worstRating: 1,
      reviewCount: totalCount,
    },
    review: reviewEntries,
  };
}

export default async function TestimonialWallPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = getSupabaseClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url, wall_config, billing_plan, trial_ends_at, subscription_ends_at')
    .eq('slug', slug)
    .single();

  if (!org) notFound();

  // Block wall if billing expired
  const plan = org.billing_plan ?? 'none';
  const isExpiredTrial = plan === 'trial' && org.trial_ends_at && new Date(org.trial_ends_at) < new Date();
  const isExpiredCancelling = plan === 'cancelling' && (org.subscription_ends_at || org.trial_ends_at) && new Date((org.subscription_ends_at || org.trial_ends_at)!).getTime() < Date.now();
  const isInactive = ['cancelled', 'past_due', 'none'].includes(plan);

  if (isExpiredTrial || isExpiredCancelling || isInactive) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Testimonial wall disabled</h2>
          <p style={{ color: '#64748b' }}>This page is currently inactive. Please contact the business for more information.</p>
        </div>
      </div>
    );
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, customer_name, photo_url, created_at')
    .eq('organization_id', org.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const config = mergeWallConfig(org.wall_config);
  const safeReviews: ReviewRow[] = (reviews ?? []) as ReviewRow[];
  const jsonLd = buildJsonLd(org.name, safeReviews);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TestimonialWall
        org={{ name: org.name, logo_url: org.logo_url }}
        reviews={safeReviews}
        config={config}
      />
    </>
  );
}
